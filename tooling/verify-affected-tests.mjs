#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { ROOT } from "./lib/fs.mjs";

const FILES = {
  package: "package.json",
  planner: "tooling/affected-tests.mjs",
  geometry: "packages/ui/test/geometry.browser.test.tsx",
  config: "packages/ui/vitest.config.ts",
};

function readSources() {
  return Object.fromEntries(
    Object.entries(FILES).map(([key, path]) => [
      key,
      readFileSync(`${ROOT}/${path}`, "utf8"),
    ]),
  );
}

function verify(sources) {
  const pkg = JSON.parse(sources.package);
  assert.match(pkg.scripts?.["check:affected"] ?? "", /affected-tests\.mjs/);
  assert.match(pkg.scripts?.["check:component"] ?? "", /--component/);
  assert.equal(
    pkg.scripts?.["verify:affected"],
    "node tooling/verify.mjs affected",
  );
  assert.equal(
    pkg.scripts?.["test:full"],
    "node tooling/full-browser-suite.mjs",
  );

  assert.match(sources.planner, /export function reverseClosure/);
  assert.match(sources.planner, /collectWorkingTreeChanges/);
  assert.match(sources.planner, /changedContractRecords/);
  assert.match(sources.planner, /changedRegistryRecords/);
  assert.match(sources.planner, /unclassified path:/);
  // A DELETED registry path has no owner left to find, so the classifier must recognise the
  // deletion rather than fail closed on it — otherwise no batch can ever retire a component.
  assert.match(sources.planner, /registry-deletion/);
  assert.match(sources.planner, /change\.status\.startsWith\("D"\)/);
  assert.match(sources.planner, /VEGASTACK_GEOMETRY_FIXTURES/);
  assert.match(sources.planner, /geometryCanaries/);

  assert.match(
    sources.config,
    /import\.meta\.env\.VEGASTACK_GEOMETRY_FIXTURES/,
  );
  assert.match(
    sources.geometry,
    /the requested geometry fixture selection is valid/,
  );
  assert.match(sources.geometry, /unknown,[\s\S]*?toEqual\(\[\]\)/);
  assert.match(sources.geometry, /unswept,[\s\S]*?toEqual\(\[\]\)/);
  assert.match(
    sources.geometry,
    /\bFIXTURES\.length,[\s\S]*?toBeGreaterThan\(0\)/,
  );
  assert.match(
    sources.geometry,
    /\bALL_FIXTURES\.length,[\s\S]*?toBeGreaterThan\(100\)/,
  );
}

const sources = readSources();
verify(sources);

if (process.argv.includes("--self-test")) {
  const mutations = [
    [
      "planner drops reverse closure",
      "planner",
      "export function reverseClosure",
      "function droppedReverseClosure",
    ],
    [
      "planner accepts unknown paths",
      "planner",
      "unclassified path:",
      "ignored path:",
    ],
    [
      "planner stops recognising a deletion",
      "planner",
      "registry-deletion",
      "registry-unknown",
    ],
    [
      "planner treats a rename's old path as a deletion",
      "planner",
      'change.status.startsWith("D")',
      'change.status.startsWith("R")',
    ],
    [
      "planner drops geometry env",
      "planner",
      "VEGASTACK_GEOMETRY_FIXTURES",
      "IGNORED_GEOMETRY_FIXTURES",
    ],
    [
      "config stops forwarding selection",
      "config",
      "import.meta.env.VEGASTACK_GEOMETRY_FIXTURES",
      "import.meta.env.IGNORED_GEOMETRY_FIXTURES",
    ],
    [
      "unknown fixture guard is removed",
      "geometry",
      "the requested geometry fixture selection is valid",
      "selection is unchecked",
    ],
    [
      "empty fixture selection can pass",
      "geometry",
      "FIXTURES.length,",
      "ALL_FIXTURES.length,",
    ],
    [
      "barrel threshold is scoped",
      "geometry",
      "ALL_FIXTURES.length,",
      "FIXTURES.length,",
    ],
    [
      "manual full command bypasses its runner",
      "package",
      '"test:full": "node tooling/full-browser-suite.mjs"',
      '"test:full": "pnpm -F @vegastack/ui test"',
    ],
  ];
  for (const [name, file, find, replacement] of mutations) {
    const changed = sources[file].replace(find, replacement);
    assert.notEqual(changed, sources[file], `mutation did not apply: ${name}`);
    assert.throws(
      () => verify({ ...sources, [file]: changed }),
      undefined,
      name,
    );
    console.log(`✓ ${name}`);
  }
  console.log(
    `verify-affected-tests --self-test: ${mutations.length}/${mutations.length} mutations rejected`,
  );
} else {
  console.log(
    "verify-affected-tests: affected planner and geometry guards intact",
  );
}
