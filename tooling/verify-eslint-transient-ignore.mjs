#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { ROOT } from "./lib/change-set.mjs";

const fixture = join(ROOT, "packages/design/tsup.config.bundled_negative.mjs");
try {
  // Invalid syntax proves ESLint ignored the fixture. If the ignore disappears, parsing fails.
  writeFileSync(fixture, "export const = transient\n", { flag: "wx" });
  const result = spawnSync(
    "pnpm",
    [
      "--filter",
      "@vegastack/design",
      "exec",
      "eslint",
      "--no-warn-ignored",
      "tsup.config.bundled_negative.mjs",
    ],
    { cwd: ROOT, encoding: "utf8" },
  );
  assert.equal(
    result.status,
    0,
    "ESLint attempted to read tsup's transient bundled config; concurrent tsup deletion can race discovery:\n" +
      `${result.stdout}${result.stderr}`,
  );
} finally {
  try {
    unlinkSync(fixture);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

console.log(
  "✓ eslint transient ignore: tsup.config.bundled_*.mjs cannot race ESLint discovery/read",
);
