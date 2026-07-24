#!/usr/bin/env node
// verify-ui-use-client (Codex R14 HIGH): the built @vegastack/ui entry MUST keep its `'use client'`
// directive at the very top of dist/index.js.
//
// WHY: every module the entry re-exports (provider/toaster/use-vegastack-theme) is client-only
// (next-themes + Base UI context, Sonner, React hooks). tsup/esbuild STRIP the source `'use client'`
// directive when bundling, so the emitted dist/index.js would otherwise start with imports/comments.
// Next App Router needs the directive at the TOP of the module — without it, importing
// `VegaStackProvider` from a server `app/layout.tsx` breaks at build time. packages/ui/tsup.config.ts
// re-adds it via `banner`; this gate fails closed if that ever regresses (banner removed, build script
// drifts back to a flagless `tsup src/index.ts`, etc.).
//
// Runs as `@vegastack/ui` `postbuild`, so it fires on every build of the package — locally and in CI
// (`pnpm build` → turbo → this package's build).
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "packages/ui/dist/index.js");
const rel = DIST.replace(ROOT + "/", "");

let src;
try {
  src = readFileSync(DIST, "utf8");
} catch {
  console.error(
    `\n✗ verify-ui-use-client: cannot read ${rel} — build @vegastack/ui first`,
  );
  process.exit(1);
}

// The FIRST line must be exactly the client directive (single or double quotes, optional semicolon).
// A leading BOM, blank lines, comments, or imports before it would defeat Next's directive detection.
const firstLine = src.replace(/^﻿/, "").split("\n", 1)[0].trim();
const isUseClient = /^(['"])use client\1;?$/.test(firstLine);

if (!isUseClient) {
  console.error(`\n✗ verify-ui-use-client: ${rel}`);
  console.error(
    `    - first line of the built entry must be the 'use client' directive`,
  );
  console.error(`    - got: ${JSON.stringify(firstLine)}`);
  console.error(
    `\n  The @vegastack/ui entry is client-only; Next App Router needs 'use client' at the TOP of\n` +
      `  dist/index.js or server-layout imports of VegaStackProvider break. Keep the tsup banner\n` +
      `  (packages/ui/tsup.config.ts: banner.js = "'use client';").`,
  );
  process.exit(1);
}

console.log(`✓ verify-ui-use-client: ${rel} starts with ${firstLine}`);
