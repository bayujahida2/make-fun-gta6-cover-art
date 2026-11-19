"""Take the entry screenshots from shots.json with Playwright.

Usage (server must already be running on :8080):
  /home/hatch/workspace/airdrop-agent/.venv/bin/python tools/take-shots.py

Re-shoot with real photos instead of the demo scenes:
  SOLMAR_SHOT_IMAGES=/path/a.jpg,/path/b.jpg,/path/c.jpg,/path/d.jpg \
    /home/hatch/workspace/airdrop-agent/.venv/bin/python tools/take-shots.py

The images are loaded into the four panels through the app's own
window.__solmar handle before each screenshot is taken. The app itself
never bundles them; they only appear in the screenshots.
"""
import base64
import json
import os
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
BASE = "http://127.0.0.1:8080/index.html"

def load_images(page):
    raw = os.environ.get("SOLMAR_SHOT_IMAGES", "").strip()
    if not raw:
        return False
    paths = [p.strip() for p in raw.split(",") if p.strip()]
    urls = []
    for p in paths:
        data = Path(p).read_bytes()
        ext = Path(p).suffix.lower()
        mime = "image/png" if ext == ".png" else "image/jpeg"
        urls.append(f"data:{mime};base64," + base64.b64encode(data).decode())
    for i, url in enumerate(urls[:4]):
        page.evaluate(
            "([i, url]) => window.__solmar.setPanelFromDataURL(i, url)",
            [i, url],
        )
    page.evaluate("() => window.__solmar.renderPreview()")
    page.wait_for_timeout(400)
    return True

def main():
    from playwright.sync_api import sync_playwright

    shots = json.loads((REPO / "shots.json").read_text())
    outdir = REPO / "screenshots"
    outdir.mkdir(exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for shot in shots:
            page = browser.new_page(viewport={"width": shot["w"], "height": shot["h"]})
            page.goto(BASE + shot["query"])
            page.wait_for_function("window.__shotReady === true", timeout=30000)
            page.wait_for_timeout(300)
            used_external = load_images(page)
            path = outdir / shot["name"]
            page.screenshot(path=str(path), type="jpeg", quality=82)
            size = path.stat().st_size
            print(f"{shot['name']}: {shot['w']}x{shot['h']} {size} bytes"
                  + (" (external photos)" if used_external else " (demo scenes)"))
            page.close()
        browser.close()

if __name__ == "__main__":
    sys.exit(main())
