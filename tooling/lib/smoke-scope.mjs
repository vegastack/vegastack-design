import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ROOT } from "./change-set.mjs";
import { contractSha256 } from "./gate-receipt.mjs";

const AUTHORITY = JSON.parse(
  readFileSync(join(ROOT, "packages/ui/component-contracts.json"), "utf8"),
);
const RECORDS = [
  ...AUTHORITY.components,
  ...AUTHORITY.hooks,
  ...AUTHORITY.blocks,
];

export const SMOKE_GLOBAL_INPUTS = [
  /^pnpm-lock\.yaml$/,
  /^package\.json$/,
  /^packages\/ui\/package\.json$/,
  /^packages\/ui\/vitest(?:\.[\w-]+)?\.config\.ts$/,
  /^packages\/ui\/vitest\.setup\.ts$/,
  /^packages\/ui\/contract-smoke-tests\.generated\.json$/,
  /^packages\/ui\/component-contracts\.json$/,
  /^packages\/ui\/registry\.json$/,
];

function names(records) {
  return new Map(records.map((record) => [record.name, record]));
}

export function buildSmokeModel(records = RECORDS) {
  const byName = names(records);
  const selected = records.filter(
    (record) => record.coverage?.crossBrowserSmoke === "selected",
  );
  const selectedTests = new Set(
    selected.flatMap((record) => record.testFiles ?? []),
  );
  const impactByFile = new Map();

  function add(path, tests) {
    if (!impactByFile.has(path)) impactByFile.set(path, new Set());
    for (const test of tests) impactByFile.get(path).add(test);
  }

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

  return { records, selected, selectedTests, impactByFile };
}

export const SMOKE_MODEL = buildSmokeModel();
export const SMOKE_SELECTED_TESTS = [...SMOKE_MODEL.selectedTests].sort();
export const SMOKE_DEPENDENCY_SOURCES = [...SMOKE_MODEL.impactByFile.keys()]
  .filter(
    (path) =>
      !SMOKE_MODEL.selected.some((record) =>
        [...(record.sourceFiles ?? []), ...(record.testFiles ?? [])].includes(
          path,
        ),
      ),
  )
  .sort();

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

export function smokeImpact(changedFiles, { shadow = readShadow() } = {}) {
  const tests = new Set();
  const reasons = [];
  let full = false;
  const currentSha = contractSha256();
  const shadowCurrent =
    !shadow.unreadable && shadow.contractSha256 === currentSha;

  for (const path of changedFiles) {
    if (SMOKE_GLOBAL_INPUTS.some((pattern) => pattern.test(path))) {
      full = true;
      reasons.push(`${path}: global smoke input`);
      continue;
    }
    const registry = SMOKE_MODEL.impactByFile.get(path);
    if (registry) for (const test of registry) tests.add(test);

    const isRegistryCode = /^packages\/ui\/registry\/.+\.tsx?$/.test(path);
    if (isRegistryCode && !registry) {
      full = true;
      reasons.push(`${path}: unmodeled registry source/test`);
      continue;
    }
    if (!registry) continue;
    if (!shadowCurrent) {
      full = true;
      reasons.push(
        `${path}: Vitest-related shadow is missing, unreadable, or stale`,
      );
      continue;
    }
    const entry = shadow.entries?.[path];
    if (!entry) {
      full = true;
      reasons.push(`${path}: no Vitest-related shadow entry`);
      continue;
    }
    for (const test of entry.vitestTests ?? []) tests.add(test);
    if (entry.disagreement) {
      full = true;
      reasons.push(`${path}: registry/Vitest related selection disagrees`);
    }
  }

  return {
    required: full || tests.size > 0,
    full,
    tests: [...tests].sort(),
    reasons,
    shadowCurrent,
  };
}
