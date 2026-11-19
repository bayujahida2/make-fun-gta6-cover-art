"""Smoke test for Solmar Cover Studio (server must run on :8080).

  /home/hatch/workspace/airdrop-agent/.venv/bin/python tools/smoke.py

Checks: demo photos load, a test photo uploads into a panel, drag pans and
zoom crops it, caption edits, preset + layout switch, all three PNG sizes
export with exact dimensions, and every request during the run stays on
127.0.0.1 (zero external network requests).
"""
import struct
import sys
import zlib
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
TMP = Path("/tmp/solmar-smoke")
TMP.mkdir(exist_ok=True)

def write_test_png(path, w=800, h=600):
    raw = b""
    for y in range(h):
        raw += b"\x00"
        for x in range(w):
            r = int(255 * x / w)
            g = int(120 + 100 * y / h)
            b = int(255 * (1 - x / w))
            dx, dy = x - w // 2, y - h // 2
            if dx * dx + dy * dy < (w // 4) ** 2:
                r, g, b = 255, 235, 90
            raw += bytes((r, g, b))
    def chunk(kind, data):
        c = struct.pack(">I", len(data)) + kind + data
        return c + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw))
    png += chunk(b"IEND", b"")
    path.write_bytes(png)
    return path

def png_size(path):
    data = path.read_bytes()
    assert data[:8] == b"\x89PNG\r\n\x1a\n", f"{path}: not a PNG"
    w, h = struct.unpack(">II", data[16:24])
    return w, h

def main():
    from playwright.sync_api import sync_playwright

    photo = write_test_png(TMP / "test-photo.png")
    requests = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = browser.new_context(accept_downloads=True, viewport={"width": 1280, "height": 900})
        page = ctx.new_page()
        page.on("request", lambda r: requests.append(r.url))
        page.goto("http://127.0.0.1:8080/index.html")
        page.wait_for_function("window.__solmar !== undefined", timeout=15000)
        page.wait_for_timeout(500)
        loaded = page.evaluate("() => window.__solmar.state.images.filter(Boolean).length")
        print(f"demo photos loaded: {loaded}/4")
        assert loaded == 4, "demo photos did not load"

        # Upload a test photo into panel 2 (index 1).
        page.set_input_files('.panel-card[data-panel="1"] .panel-file', str(photo))
        page.wait_for_timeout(500)
        is_img = page.evaluate("() => window.__solmar.state.images[1] instanceof HTMLImageElement")
        print(f"test photo uploaded to panel 2: {is_img}")
        assert is_img

        # Drag the hero panel to pan, then zoom it.
        box = page.locator("#preview").bounding_box()
        page.mouse.move(box["x"] + box["width"] * 0.3, box["y"] + box["height"] * 0.2)
        page.mouse.down()
        page.mouse.move(box["x"] + box["width"] * 0.3 + 60, box["y"] + box["height"] * 0.2 + 30, steps=8)
        page.mouse.up()
        page.wait_for_timeout(200)
        pan = page.evaluate("() => window.__solmar.state.crops[0]")
        print(f"hero crop after drag: {pan}")
        assert abs(pan["ox"]) > 0.001 or abs(pan["oy"]) > 0.001, "drag did not pan"
        page.evaluate("() => { const z = document.getElementById('zoom'); z.value = '1.8'; z.dispatchEvent(new Event('input')); }")
        zoom = page.evaluate("() => window.__solmar.state.crops[0].zoom")
        print(f"hero zoom after slider: {zoom}")
        assert zoom == 1.8

        # Caption, preset, layout.
        page.fill("#title", "Test Drive")
        page.fill("#subtitle", "smoke test in solmar bay")
        page.click('.preset-btn[data-preset="neon"]')
        page.click('.layout-btn[data-layout="split"]')
        page.wait_for_timeout(300)
        st = page.evaluate("() => ({ preset: window.__solmar.state.preset, layout: window.__solmar.state.layout, title: window.__solmar.state.title })")
        print(f"state after edits: {st}")
        assert st == {"preset": "neon", "layout": "split", "title": "Test Drive"}

        # Export all three sizes and verify exact dimensions.
        for size_key, (ew, eh) in {"square": (1080, 1080), "portrait": (1080, 1350), "wide": (1920, 1080)}.items():
            page.select_option("#size", size_key)
            with page.expect_download(timeout=15000) as dl:
                page.click("#exportBtn")
            dl_path = TMP / f"export-{size_key}.png"
            dl.value.save_as(str(dl_path))
            got = png_size(dl_path)
            print(f"export {size_key}: {got[0]}x{got[1]} expected {ew}x{eh} bytes={dl_path.stat().st_size}")
            assert got == (ew, eh), f"wrong export size for {size_key}"
            last = page.evaluate("() => window.__lastExport")
            assert last == {"w": ew, "h": eh, "size": size_key}, f"__lastExport mismatch: {last}"

        # Offline check: every request must be same-origin localhost.
        external = [u for u in requests if "127.0.0.1" not in u and "localhost" not in u]
        print(f"total requests: {len(requests)}; external: {len(external)}")
        for u in requests:
            print(f"  req: {u}")
        assert not external, f"external requests seen: {external}"
        browser.close()
    print("SMOKE TEST PASSED")

if __name__ == "__main__":
    sys.exit(main())
