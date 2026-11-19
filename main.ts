// Solmar Cover Studio — build entrypoint.
//
// What this file does, in one pass: it gathers the finished offline web
// app (the static files under app/, plus the rendered cover screenshots
// under screenshots/) into the hand-in folder, then asks the vendored
// make.fun helper to summarise that folder as dossier.json, the summary
// the bounty judge reads. Nothing here draws a cover or edits a photo;
// all of the cover-making lives in app/src/*.js and is loaded by
// app/index.html in a desktop browser with no network at all. Order
// matters: the files are staged first, because the summary is computed
// from the hand-in folder itself, not from the repo.
//
// Run it from anywhere in the repo with plain Node 22, no build step:
//   node main.ts
// and, outside the grader container, point it at a scratch folder with:
//   MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the same app locally for a quick look with `node serve.ts`.

import {
  cpSync as copyTree,
  existsSync as pathExists,
  mkdirSync as makeDir,
  writeFileSync as saveFile,
} from "node:fs";
import { join as joinPath } from "node:path";
import { fileURLToPath as urlToPath } from "node:url";
import { buildDossier as makeDossier } from "./vendor/makefun-app.ts";

// Folder this file lives in: the repo root, where app/ and screenshots/ sit.
const repoRoot: string = urlToPath(new URL(".", import.meta.url));

// Where the hand-in goes. The grader uses /output; a local run can
// override it through the environment instead of writing there.
const handInDir: string = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// The caps the scorer itself uses (from its gate.json). Only the text cap
// changes what dossier.json contains; the rest make this build refuse
// exactly where the scorer would refuse an entry: too many screenshots,
// an oversized screenshot, too many app files or bytes, or an over-long
// path under app/.
const scorerCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function stageStaticFiles(): void {
  makeDir(handInDir, { recursive: true });
  copyTree(joinPath(repoRoot, "app"), joinPath(handInDir, "app"), {
    recursive: true,
  });
  makeDir(joinPath(handInDir, "screenshots"), { recursive: true });
  const shotsSource: string = joinPath(repoRoot, "screenshots");
  if (pathExists(shotsSource)) {
    copyTree(shotsSource, joinPath(handInDir, "screenshots"), {
      recursive: true,
    });
  }
}

function writeSummary(): void {
  const dossierBytes: Uint8Array = makeDossier(handInDir, scorerCaps);
  saveFile(joinPath(handInDir, "dossier.json"), dossierBytes);
}

stageStaticFiles();
writeSummary();
