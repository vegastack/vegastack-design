#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { ROOT } from "./lib/change-set.mjs";

const scratch = mkdtempSync(join(tmpdir(), "classifier-smoke-negative-"));
const root = join(scratch, "repo");
try {
  execFileSync("git", ["clone", "--quiet", "--no-hardlinks", ROOT, root]);
  assert.equal(
    existsSync(join(root, "node_modules")),
    false,
    "the direct classifier-smoke mutation suite must not inherit node_modules",
  );
  for (const path of [
    "package.json",
    "tooling/lib/classifier-smoke.mjs",
    "packages/ui/smoke-impact.generated.json",
  ])
    cpSync(join(ROOT, path), join(root, path));

  const shadowPath = join(root, "packages/ui/smoke-impact.generated.json");
  const sourcePath = join(root, "packages/ui/registry/ui/button.tsx");
  const originalShadow = readFileSync(shadowPath, "utf8");
  const originalSource = readFileSync(sourcePath, "utf8");
  let checks = 1;

  function run(changedFiles) {
    const module = pathToFileURL(
      join(root, "tooling/lib/classifier-smoke.mjs"),
    ).href;
    return JSON.parse(
      execFileSync(
        "node",
        [
          "--input-type=module",
          "--eval",
          `const {classifierSmokeImpact}=await import(${JSON.stringify(module)}); console.log(JSON.stringify(classifierSmokeImpact(${JSON.stringify(changedFiles)})));`,
        ],
        { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
      ),
    );
  }

  function shadowMutation(mutate, expectedReason) {
    const shadow = JSON.parse(originalShadow);
    mutate(shadow);
    writeFileSync(shadowPath, `${JSON.stringify(shadow, null, 2)}\n`);
    const result = run(["packages/ui/registry/ui/button.tsx"]);
    assert.equal(result.full, true);
    assert.equal(result.required, true);
    assert.match(result.reasons.join("; "), expectedReason);
    writeFileSync(shadowPath, originalShadow);
    checks += 3;
  }

  assert.equal(
    run(["packages/ui/registry/ui/button.tsx"]).required,
    true,
    "the dependency-free authority must select button smoke dependents",
  );
  assert.equal(
    run(["packages/ui/registry/ui/particle-field.tsx"]).required,
    false,
    "a modeled non-smoke leaf must remain safely skippable",
  );
  checks += 2;

  writeFileSync(shadowPath, "{ malformed");
  {
    const result = run(["packages/ui/registry/ui/button.tsx"]);
    assert.equal(result.full, true);
    assert.match(result.reasons.join("; "), /missing, unreadable, or stale/);
    checks += 2;
  }
  writeFileSync(shadowPath, originalShadow);

  unlinkSync(shadowPath);
  {
    const result = run(["packages/ui/registry/ui/button.tsx"]);
    assert.equal(result.full, true);
    assert.match(result.reasons.join("; "), /missing, unreadable, or stale/);
    checks += 2;
  }
  writeFileSync(shadowPath, originalShadow);

  shadowMutation((shadow) => {
    delete shadow.entries["packages/ui/registry/ui/button.tsx"];
  }, /no dependency-shadow entry/);
  shadowMutation((shadow) => {
    shadow.contractSha256 = "stale";
  }, /missing, unreadable, or stale/);
  shadowMutation((shadow) => {
    shadow.toolchain.pinned.vitest = "0.0.0-stale";
  }, /missing, unreadable, or stale/);
  shadowMutation((shadow) => {
    shadow.entries["packages/ui/registry/ui/button.tsx"].registryTests = [];
  }, /malformed or conflicting/);
  shadowMutation((shadow) => {
    shadow.entries["packages/ui/registry/ui/button.tsx"].vitestTests = [42];
  }, /malformed or conflicting/);
  shadowMutation((shadow) => {
    const entry = shadow.entries["packages/ui/registry/ui/button.tsx"];
    entry.vitestTests.push(entry.vitestTests[0]);
  }, /malformed or conflicting/);
  shadowMutation((shadow) => {
    shadow.entries["packages/ui/registry/ui/button.tsx"].vitestTests = [];
    shadow.entries["packages/ui/registry/ui/button.tsx"].disagreement = false;
  }, /malformed or conflicting/);

  writeFileSync(sourcePath, `${originalSource}\n// stale-shadow mutation\n`);
  {
    const result = run(["packages/ui/registry/ui/button.tsx"]);
    assert.equal(result.full, true);
    assert.match(result.reasons.join("; "), /missing, unreadable, or stale/);
    checks += 2;
  }
  writeFileSync(sourcePath, originalSource);

  assert.equal(
    run(["packages/ui/registry/ui/unmodeled-new-source.tsx"]).full,
    true,
  );
  assert.equal(run(["pnpm-lock.yaml"]).full, true);
  checks += 2;

  console.log(
    `✓ dependency-free classifier smoke: ${checks} clean/stale/malformed/conflicting/global/unknown assertions fail closed without node_modules`,
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
