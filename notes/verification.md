# Verification — Solmar Cover Studio (gta6-cover-art-01)

Run 2026-11-19 ~18:39–18:45 WIB, Node v24.22.1, server `node serve.ts --port 8080`,
Playwright from `/home/hatch/workspace/airdrop-agent/.venv/bin/python`
(chromium-1255). Local HEAD at the time: `01d836d` (see git log).

## Smoke test (`tools/smoke.py`) — PASSED (twice: before and after the fixes)

- Demo photos loaded: 4/4
- Test photo uploaded into panel 2: true (HTMLImageElement)
- Drag on hero panel pans the crop: ox 0.079, oy 0.099 after drag
- Zoom slider sets crop zoom to 1.8
- Caption / preset / layout edits land in state
  (`preset: neon, layout: split, title: Test Drive`)
- Exports (valid PNG, exact dimensions):
  - square 1080x1080, portrait 1080x1350, wide 1920x1080
- Network requests during the run: 6 total, all to `127.0.0.1:8080`
  (index.html, style.css, src/main.js, src/cover.js, src/demo.js,
  src/shots.js) — **0 external requests**

## Screenshots (`tools/take-shots.py`, re-runnable)

| file | size | bytes | shows |
|---|---|---|---|
| `screenshots/1-cover.jpg` | 1080x1080 | 107,016 | Vice Grid cover, Vice Sunset, "Solmar Heat" |
| `screenshots/2-editor.jpg` | 1280x1000 | 134,719 | Editor with demo photos loaded, Split + Neon Nights |
| `screenshots/3-cover.jpg` | 1024x1280 | 98,295 | Poster cover, Ocean Drive, "Golden Hour" |
| `screenshots/4-cover.jpg` | 1280x720 | 85,721 | Split cover, Neon Nights, "Vice Lights" |

All ≤256 KiB, long side ≤1280, short side ≥480. Re-shoot with real photos:
`SOLMAR_SHOT_IMAGES=/path/a.jpg,... tools/take-shots.py` (loads them into
the panels via `window.__solmar` before shooting; the app never bundles them).
No Flow-generated photos had arrived when these were taken; they use the
procedural demo scenes.

## Fixes found by looking at the first screenshots

1. Poster layout: the tilted snapshot overlapped the title block — moved to
   the bottom-centre inset row.
2. Wide (1920x1080) title overlapped the "SOLMAR BAY" eyebrow — title size
   now capped by band height as well as width.
3. Poster insets were darkened by the foot scrim drawn over them — the scrim
   is now drawn right after the hero, before the insets.
4. Editor screenshot viewport raised 1280x720 → 1280x1000 so the whole editor
   (controls + live preview + caption fields) is visible; panel-card file
   inputs no longer overflow their cards.

## Determinism (`main.ts` twice, different MAKEFUN_OUTPUT_DIR)

`diff -r /tmp/out1 /tmp/out2` — clean, byte-identical.
`/output` total: 1,094,950 bytes, 15 entries (limit 1000 / 64 MiB).

## Gate limits (measured on `/tmp/out1`)

- app/ entries (files+dirs): 7 (limit 993)
- app/ total bytes: 49,443 (limit 48 MiB)
- app/index.html: 5,394 bytes (limit 1 MiB)
- longest app path: 12 bytes (limit 1000)
- dossier.json: 619,756 bytes (limit 1.5 MiB)
- dossier source text: 49,918 bytes (limit 160 KiB)
- screenshots: all within size/dimension limits (table above)

## `makefun check` (`--kit <kit> --repo . --worktree`)

`4 passed, 0 failed, 17 skipped, 5 checked at submission` —
"ok: every check run here passes; the rest are the site's at submission".
Passes: competition_open, snapshot (18 files, 548,880 bytes),
license_osi (MIT), entrypoint (main.ts, node22). Skipped: all transcript
checks (site-side, expected — recordings are sealed by the parent flow).
Checked at submission (need the GitHub repo): repo_public, repo_owner,
repo_created_after_open, commit_in_repo, duplicate_snapshot.

## `makefun grade-local` (`--kit <kit> --bot . --driver process`)

Not available for this competition — the CLI reports:
"makefun grade-local: gta6-cover-art-01 is a program/v1 competition: its
scorer and reference data are not published in the kit, so the house grades
it from its competition directory". Grading is server-side only. This is a
limitation of the kit, not of the entry.

## GitHub — BLOCKED at repo creation (needs the parent / BAYU)

`github call-tool create_repository` (name `make-fun-gta6-cover-art`,
`private: false`, owner bayujahida2 — confirmed by `get_me`, and the name
is free: `search_repositories` returned 0) fails with:
`POST https://api.github.com/user/repos: 403 Resource not accessible by
integration`. The connected GitHub App (Meta Muse AI) token cannot use the
user-repo creation endpoint. The repo must be created another way (BAYU in
the browser, or the parent agent with a user OAuth token / `gh` login),
as a PUBLIC repo named `make-fun-gta6-cover-art` under bayujahida2, created
after the 2026-11-19 17:30 WIB opening. Once it exists, push the local
commits to it (files via the `github push-files` tool; verify the binary
screenshots round-trip byte-for-byte after pushing) and re-run
`makefun check` so the at-submission rows can pass.
