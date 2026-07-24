#!/usr/bin/env node

// Runtime proof for the published packages' CommonJS contract. Reading the manifest is not enough:
// Node's conditional-exports resolution must actually find and execute every declared `require`
// target, including the package.json subpath tools commonly resolve.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function packageRequire(directory) {
  return createRequire(join(root, "packages", directory, "package.json"));
}

const requireDesign = packageRequire("design");
const design = requireDesign("@vegastack/design");
assert.equal(
  typeof design.cn,
  "function",
  "@vegastack/design CommonJS root does not export cn",
);
assert.equal(
  typeof requireDesign("@vegastack/design/icons").Icon,
  "function",
  "@vegastack/design/icons CommonJS export is not executable",
);
assert.equal(
  typeof requireDesign("@vegastack/design/theme-scope").useInternalThemeScope,
  "function",
  "@vegastack/design/theme-scope CommonJS export is not executable",
);
assert.equal(typeof requireDesign("@vegastack/design/preset"), "object");
assert.equal(
  requireDesign("@vegastack/design/package.json").name,
  "@vegastack/design",
  "@vegastack/design/package.json is not exported",
);

const requireTokens = packageRequire("design-tokens");
assert.equal(
  typeof requireTokens("@vegastack/design-tokens"),
  "object",
  "@vegastack/design-tokens CommonJS root is not executable",
);
assert.equal(
  requireTokens("@vegastack/design-tokens/package.json").name,
  "@vegastack/design-tokens",
  "@vegastack/design-tokens/package.json is not exported",
);

console.log(
  "✓ package exports: ESM packages expose executable CommonJS roots/subpaths + package.json",
);
