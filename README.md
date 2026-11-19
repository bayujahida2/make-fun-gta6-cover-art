# Solmar Cover Studio — Make GTA 6 Cover Art

Turn your photos and a caption into multi-panel GTA-style cover art, exported
as a PNG to share. Runs **offline** in a desktop browser from its own static
files: photos are read on your machine and never uploaded anywhere.

## Use it

```sh
node serve.ts
# open http://localhost:8080
```

1. **Photos** — click **Load demo photos** to start, or upload your own photo
   into any of the four panels. **Fill all panels** takes one photo (repeated
   with different crops) or several photos (placed in order).
2. **Crop** — click a panel to select it, drag it on the cover to pan, use
   the zoom slider to crop. Each panel has its own reset.
3. **Caption** — edit the title and subtitle; the preview updates live.
4. **Layout** — Vice Grid (hero + three panels), Split (big panel + two
   stacked + one tilted snapshot), Poster (full-bleed hero + inset snapshots).
5. **Style** — Vice Sunset, Neon Nights, or Ocean Drive colour grades.
6. **Export PNG** — 1080 x 1080, 1080 x 1350, or 1920 x 1080, one click.

## What is in this repo

- `app/index.html`, `app/style.css` — the editor page.
- `app/src/main.js` — editor wiring: uploads, drag/zoom, export.
- `app/src/cover.js` — the cover engine: layouts, grades, lettering, grain.
- `app/src/demo.js` — the four demo scenes, painted procedurally in code
  from seeded generators (sunset beach, neon boulevard, palm skyline, pier).
- `app/src/shots.js` — fixed `?shot=` scenes for screenshots.
- `main.ts` — hands `app/` and `screenshots/` in and writes `dossier.json`.
- `serve.ts` — tiny static server for local tries.
- `screenshots/` — the cover and the editor, taken with Playwright
  (`tools/take-shots.py`, re-runnable; set `SOLMAR_SHOT_IMAGES` to a
  comma-separated list of photo paths to fill the panels with real photos
  instead of the demo scenes before shooting).
- `tools/smoke.py` — the offline + export smoke test (see below).

## Originality

All art, lettering and demo scenes are original work made in code for this
app, under the MIT license in `LICENSE`. No Rockstar Games logo, wordmark,
official artwork, character or font file is used anywhere; the lettering is
the system font stack only, and no external font or image is loaded.

## Verification (what was checked before this entry was handed in)

- Served with `node serve.ts --port 8080` and driven with Playwright:
  demo photos load, a test photo uploads into a panel, drag/zoom move the
  crop, caption edits, preset and layout switches, and all three PNG sizes
  export with the exact dimensions. Every request during the run went to
  `127.0.0.1` only — zero external network requests.
- `node main.ts` run twice into different output dirs produces
  byte-identical output (`diff -r` clean).
- Gate limits checked: `app/` file count and bytes, screenshot sizes and
  dimensions, dossier size.
- `makefun check` and `makefun grade-local` (gate scorer only) run from the
  kit CLI; see `notes/verification.md` for the outputs.
