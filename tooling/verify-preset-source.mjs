#!/usr/bin/env node
// verify-preset-source: prove the published Tailwind preset self-contains the `@source`
// declarations a REAL npm consumer needs.
//
// Round-5 HIGH (Codex): `@vegastack/design/preset.css` imports Tailwind + tokens
// but, before this gate, never told Tailwind to scan the classes shipped INSIDE our own
// packages — the compiled `Toaster` in `@vegastack/ui/dist` (sonner `classNames` like
// `group-[.toaster]:bg-popover`) and `BrandIcon` in this package's own dist
// (`inline-flex shrink-0 [&>svg]:size-full`). The docs app papered over this with its own
// manual workspace `@source` entries, so the showcase looked correct while a real consumer
// importing ONLY the preset would get partially-unstyled provider/icon UI.
//
// What this script does (NO docs-app `@source` hacks, NO showcase paths):
//   1. Builds a throwaway CSS entry that imports ONLY `@vegastack/design/preset.css`.
//   2. Compiles it with the real Tailwind v4 pipeline (`@tailwindcss/node` `compile` +
//      `@tailwindcss/oxide` `Scanner` — exactly what the Tailwind CLI runs internally),
//      with the compile `base` set to the preset package dir so the preset's own
//      `@source "./dist"` / `"../ui/dist"` resolve relative to the preset's realpath
//      (the icon runtime is inside this package; ui — when present — is a sibling).
//   3. Asserts the Toaster + BrandIcon classes appear in the compiled output.
//
// If they appear, the preset alone is enough — consumers do nothing extra. If they don't,
// the distribution contract is broken and this gate fails the build.
//
// Wired into `pnpm --filter @vegastack/design run verify` (and its `lint`).

import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const presetDir = join(here, "..", "packages", "design");

// Resolve the Tailwind compile pipeline from the preset's own dependency graph (devDeps),
// so this gate is self-contained and independent of hoisting.
const req = createRequire(join(presetDir, "package.json"));
const { compile } = await import(req.resolve("@tailwindcss/node"));
const { Scanner } = await import(req.resolve("@tailwindcss/oxide"));

// The ENTIRE consumer stylesheet: a single import of the preset. Nothing else — no docs
// `@source`, no showcase paths.
const ENTRY = '@import "@vegastack/design/preset.css";\n';

// Classes that ONLY exist because the preset's `@source` scanned our published package dist.
// (Escaped form is how Tailwind emits the selector in the compiled stylesheet.)
const ASSERTIONS = [
  {
    label: "Toaster (@vegastack/ui dist) — group-[.toaster]:bg-popover",
    test: (css) => css.includes("group-\\[\\.toaster\\]\\:bg-popover"),
  },
  {
    label:
      "Toaster (@vegastack/ui dist) — group-[.toaster]:text-popover-foreground",
    test: (css) =>
      css.includes("group-\\[\\.toaster\\]\\:text-popover-foreground"),
  },
  {
    label: "BrandIcon (@vegastack/design/icons dist) — .shrink-0",
    test: (css) => /\.shrink-0\s*\{/.test(css),
  },
  {
    label: "BrandIcon (@vegastack/design/icons dist) — [&>svg]:size-full",
    test: (css) => css.includes("size-full"),
  },
];

function fail(msg) {
  console.error(`\n  ✗ verify-preset-source FAILED\n    ${msg}\n`);
  process.exit(1);
}

let css;
try {
  // base = the preset dir: the preset's own relative @source ("./dist", "../ui/dist")
  // is resolved relative to the imported preset.css's realpath, mirroring a real consumer build.
  const compiler = await compile(ENTRY, { base: presetDir, onDependency() {} });
  const scanner = new Scanner({ sources: compiler.sources });
  css = compiler.build(scanner.scan());
} catch (err) {
  fail(
    `Tailwind compile of the preset alone errored: ${err.message.split("\n")[0]}`,
  );
}

const missing = ASSERTIONS.filter((a) => !a.test(css)).map((a) => a.label);

if (missing.length > 0) {
  fail(
    `The preset compiled, but these package-shipped classes were NOT generated from ` +
      `the preset's own @source (a real consumer would get unstyled provider/icon UI):\n` +
      missing.map((m) => `      - ${m}`).join("\n") +
      `\n    Fix: ensure packages/design/preset.css declares @source "./dist" (this package's ` +
      `own icon runtime) and @source "../ui/dist" (@vegastack/ui sits as a sibling under the ` +
      `@vegastack scope when installed — graceful skip when absent).`,
  );
}

console.log(
  `  ✓ verify-preset-source: preset self-contains @source — ` +
    `${ASSERTIONS.length}/${ASSERTIONS.length} package classes generated ` +
    `(Toaster + BrandIcon) from the preset import alone.`,
);
