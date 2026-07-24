#!/usr/bin/env node
// The canonical registry Toaster is the source of truth. The private package mirror must be an
// exact copy after removing only the generated registry provenance header and its separator line.

import { readFileSync, writeFileSync } from "node:fs";

const canonicalPath = "packages/ui/registry/ui/sonner.tsx";
const mirrorPath = "packages/ui/src/provider/toaster.tsx";
const check = process.argv.includes("--check");
const headerPattern = /^\/\/ @vegastack sonner@[^\n]+\n\n/;

const canonical = readFileSync(canonicalPath, "utf8");
if (!headerPattern.test(canonical)) {
  console.error(
    `✗ toaster mirror: ${canonicalPath} is missing its line-1 provenance header`,
  );
  process.exit(1);
}
const expected = canonical.replace(headerPattern, "");
const actual = readFileSync(mirrorPath, "utf8");

if (actual === expected) {
  console.log(
    "✓ toaster mirror: package implementation exactly matches canonical registry source",
  );
  process.exit(0);
}

if (check) {
  console.error(
    `✗ toaster mirror: ${mirrorPath} drifted from ${canonicalPath} (only the canonical provenance header may differ)`,
  );
  process.exit(1);
}

writeFileSync(mirrorPath, expected);
console.log(
  `✓ toaster mirror: synchronized ${mirrorPath} from canonical source`,
);
