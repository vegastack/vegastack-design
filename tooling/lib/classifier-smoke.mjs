import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readlinkSync } from "node:fs";
import { join } from "node:path";

import { ROOT } from "./change-set.mjs";
import { contractSha256, pinnedToolchain } from "./gate-receipt.mjs";

// This module is intentionally dependency-free. CI's receipt-guard imports it before pnpm install;
// parser-backed Vitest comparison remains in smoke-scope.mjs and the generated shadow binds those
// results to the complete bytes and filesystem metadata read here.
export const CLASSIFIER_SMOKE_GLOBAL_INPUTS = [
  /^pnpm-lock\.yaml$/,
  /^package\.json$/,
  /^packages\/ui\/package\.json$/,
  /^packages\/ui\/vitest(?:\.[\w-]+)?\.config\.ts$/,
  /^packages\/ui\/vitest\.setup\.ts$/,
  /^packages\/ui\/contract-smoke-tests\.generated\.json$/,
  /^packages\/ui\/component-contracts\.json$/,
  /^packages\/ui\/registry\.json$/,
];

const IMPACT_INPUTS = [
  "pnpm-lock.yaml",
  "package.json",
  "packages/ui/package.json",
  "packages/ui/tsconfig.json",
  "config/typescript-config/package.json",
  "config/typescript-config/react-library.json",
  "config/typescript-config/base.json",
  "pnpm-workspace.yaml",
  "packages/ui/component-contracts.json",
  "packages/ui/registry.json",
  "packages/ui/vitest.config.ts",
  "packages/ui/vitest.smoke.config.ts",
  "packages/ui/vitest.all-browsers.config.ts",
  "packages/ui/vitest.setup.ts",
  "tooling/sync-smoke-impact.mjs",
  "tooling/lib/classifier-smoke.mjs",
  "tooling/lib/smoke-scope.mjs",
];

function records() {
  const authority = JSON.parse(
    readFileSync(join(ROOT, "packages/ui/component-contracts.json"), "utf8"),
  );
  return [...authority.components, ...authority.hooks, ...authority.blocks];
}

function smokeRegistryImpact(authorityRecords) {
  const byName = new Map(
    authorityRecords.map((record) => [record.name, record]),
  );
  const impactByFile = new Map();
  const selected = authorityRecords.filter(
    (record) => record.coverage?.crossBrowserSmoke === "selected",
  );
  const add = (path, tests) => {
    if (!impactByFile.has(path)) impactByFile.set(path, new Set());
    for (const test of tests) impactByFile.get(path).add(test);
  };
  for (const root of selected) {
    const tests = root.testFiles ?? [];
    const reached = new Set();
    const queue = [root.name];
    while (queue.length > 0) {
      const name = queue.pop();
      if (reached.has(name)) continue;
      reached.add(name);
      const record = byName.get(name);
      if (!record) continue;
      for (const path of record.sourceFiles ?? []) add(path, tests);
      for (const dependency of record.registryDependencies ?? [])
        queue.push(dependency.replace(/^@vegastack\//, ""));
    }
    for (const path of root.testFiles ?? []) add(path, tests);
  }
  return impactByFile;
}

function modeledPaths(authorityRecords) {
  return new Set(
    authorityRecords.flatMap((record) => [
      ...(record.sourceFiles ?? []),
      ...(record.testFiles ?? []),
    ]),
  );
}

export function vitestImpactContentDigest({ root = ROOT } = {}) {
  const authorityRecords = records();
  const inputs = [
    ...new Set([
      ...IMPACT_INPUTS,
      ...authorityRecords.flatMap((record) => [
        ...(record.sourceFiles ?? []),
        ...(record.testFiles ?? []),
      ]),
    ]),
  ].sort();
  const hash = createHash("sha256");
  for (const path of inputs) {
    const absolute = join(root, path);
    if (!existsSync(absolute)) {
      hash.update(`${path}\0missing\n`);
      continue;
    }
    const stat = lstatSync(absolute);
    const type = stat.isSymbolicLink()
      ? "symlink"
      : stat.isFile()
        ? "file"
        : "other";
    hash.update(`${path}\0${type}\0${stat.mode.toString(8)}\0`);
    if (type === "symlink") hash.update(readlinkSync(absolute));
    else if (type === "file") hash.update(readFileSync(absolute));
    hash.update("\n");
  }
  return hash.digest("hex");
}

function readShadow() {
  try {
    return JSON.parse(
      readFileSync(
        join(ROOT, "packages/ui/smoke-impact.generated.json"),
        "utf8",
      ),
    );
  } catch (error) {
    return { unreadable: error.message, entries: {} };
  }
}

function sameStrings(left, right) {
  return (
    Array.isArray(left) &&
    JSON.stringify([...left].sort()) === JSON.stringify([...right].sort())
  );
}

export function classifierSmokeImpact(changedFiles) {
  const authorityRecords = records();
  const registryImpact = smokeRegistryImpact(authorityRecords);
  const modeled = modeledPaths(authorityRecords);
  const shadow = readShadow();
  const pinned = pinnedToolchain();
  const shadowCurrent =
    !shadow.unreadable &&
    shadow.generatedBy === "tooling/sync-smoke-impact.mjs" &&
    shadow.contractSha256 === contractSha256() &&
    shadow.contentDigest === vitestImpactContentDigest() &&
    JSON.stringify(shadow.toolchain?.pinned) === JSON.stringify(pinned);
  const tests = new Set();
  const reasons = [];
  let full = false;
  let disagreement = false;

  for (const path of changedFiles) {
    if (CLASSIFIER_SMOKE_GLOBAL_INPUTS.some((pattern) => pattern.test(path))) {
      full = true;
      reasons.push(`${path}: global smoke input`);
      continue;
    }
    const isRegistryCode = /^packages\/ui\/registry\/.+\.[cm]?[jt]sx?$/.test(
      path,
    );
    if (isRegistryCode && !modeled.has(path)) {
      full = true;
      reasons.push(`${path}: unmodeled registry source/test`);
      continue;
    }
    if (!modeled.has(path)) continue;
    if (!shadowCurrent) {
      full = true;
      reasons.push(
        `${path}: dependency shadow is missing, unreadable, or stale`,
      );
      continue;
    }
    const entry = shadow.entries?.[path];
    if (!entry) {
      full = true;
      reasons.push(`${path}: no dependency-shadow entry`);
      continue;
    }
    const independentlyDerived = [...(registryImpact.get(path) ?? [])].sort();
    if (
      !sameStrings(entry.registryTests, independentlyDerived) ||
      !Array.isArray(entry.vitestTests) ||
      entry.vitestTests.some(
        (test) =>
          typeof test !== "string" ||
          !/^packages\/ui\/(?:registry|test)\/.+\.test\.tsx$/.test(test),
      ) ||
      new Set(entry.vitestTests).size !== entry.vitestTests.length ||
      entry.disagreement !==
        !sameStrings(entry.registryTests, entry.vitestTests)
    ) {
      full = true;
      disagreement = true;
      reasons.push(`${path}: malformed or conflicting dependency-shadow entry`);
      continue;
    }
    for (const test of entry.vitestTests) tests.add(test);
    if (entry.disagreement) {
      full = true;
      disagreement = true;
      reasons.push(`${path}: registry/Vitest related selection disagrees`);
    }
  }

  return {
    required: full || tests.size > 0,
    full,
    tests: [...tests].sort(),
    reasons,
    disagreement,
    shadowCurrent,
  };
}
