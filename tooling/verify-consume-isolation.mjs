#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  declaredVegastackPackages,
  packageNameFromSpec,
  validateConsumeReport,
  writeImmutableJson,
} from "./lib/consume-isolation.mjs";
import {
  requiredPackedPaths,
  validatePackedPackageFiles,
} from "./lib/package-artifact.mjs";

const packageFixture = {
  name: "@vegastack/example",
  version: "1.2.3",
  exports: {
    ".": {
      types: "./dist/index.d.ts",
      import: "./dist/index.js",
    },
    "./theme.css": "./dist/theme.css",
    "./package.json": "./package.json",
  },
  bin: { example: "./bin/example.mjs" },
};
assert.deepEqual(requiredPackedPaths(packageFixture), [
  "bin/example.mjs",
  "dist/index.d.ts",
  "dist/index.js",
  "dist/theme.css",
  "package.json",
]);
assert.match(
  validatePackedPackageFiles(packageFixture, [
    { path: "package.json" },
    { path: "bin/example.mjs" },
  ]).join("\n"),
  /packed artifact omits exported file dist\/index\.d\.ts/,
  "a clean pack missing generated exports must fail before consumer typecheck",
);
assert.deepEqual(
  validatePackedPackageFiles(
    packageFixture,
    requiredPackedPaths(packageFixture).map((path) => ({ path })),
  ),
  [],
  "a complete packed export surface must pass",
);

assert.equal(
  packageNameFromSpec("@vegastack/design@^0.3.0"),
  "@vegastack/design",
);
assert.equal(packageNameFromSpec("@vegastack/design"), "@vegastack/design");
assert.equal(packageNameFromSpec("motion@^12.0.0"), "motion");
assert.deepEqual(
  declaredVegastackPackages([
    { dependencies: ["motion@^12", "@vegastack/design@^0.3.0"] },
  ]),
  ["@vegastack/design"],
  "an isolated root must not require an unrelated package installed by an earlier root",
);

const writeRoot = mkdtempSync(join(tmpdir(), "consume-report-write-"));
try {
  const reportPath = join(writeRoot, "report.json");
  writeImmutableJson(reportPath, { generation: "first" });
  assert.throws(
    () => writeImmutableJson(reportPath, { generation: "conflicting" }),
    { code: "EEXIST" },
    "a duplicate/conflicting report key must fail instead of overwriting",
  );
  assert.equal(
    JSON.parse(readFileSync(reportPath, "utf8")).generation,
    "first",
    "the first complete report must remain byte-authoritative",
  );
} finally {
  rmSync(writeRoot, { recursive: true, force: true });
}
assert.deepEqual(
  declaredVegastackPackages([
    { dependencies: ["@vegastack/design@^0.3.0"] },
    { dependencies: ["@vegastack/design-tokens@^0.2.0"] },
  ]),
  ["@vegastack/design", "@vegastack/design-tokens"],
  "resolved graph dependencies must be unioned exactly",
);

const leaf = (root, consumer, target = `${root}.tsx`, digest = root) => ({
  root,
  layout: "default",
  consumer,
  postWriteOk: true,
  tscOk: true,
  outputs: [{ target, sha256: digest }],
});

const validAffected = {
  schema: "vegastack-consume-report/v1",
  mode: "affected",
  status: "pass",
  exhaustiveRootCount: 554,
  packageArtifacts: [
    {
      name: "@vegastack/design",
      version: "0.3.0",
      buildStatus: "pass",
      exportsValidated: true,
      packedFileCount: 24,
    },
    {
      name: "@vegastack/design-tokens",
      version: "0.2.0",
      buildStatus: "pass",
      exportsValidated: true,
      packedFileCount: 8,
    },
  ],
  selectedRoots: ["a", "b"],
  selectedLayouts: ["default"],
  isolatedReal: [leaf("a", "/tmp/a"), leaf("b", "/tmp/b")],
  isolatedSimulated: [leaf("a", "/tmp/sim-a"), leaf("b", "/tmp/sim-b")],
  consolidated: [],
  collisionProblems: [],
  fullOracleExecuted: false,
  shadowOnly: true,
  reuseEnabled: false,
  evidenceReusable: false,
  receiptWritten: false,
  ciFullOracleRequired: true,
};

assert.deepEqual(validateConsumeReport(validAffected), []);

function rejected(label, mutate, expected) {
  const report = structuredClone(validAffected);
  mutate(report);
  assert.match(
    validateConsumeReport(report).join("\n"),
    expected,
    `${label} must fail for the intended reason`,
  );
}

rejected(
  "accumulating consumer",
  (report) => {
    report.isolatedReal[1].consumer = report.isolatedReal[0].consumer;
  },
  /consumer reused across roots/,
);
rejected(
  "missing post-write",
  (report) => {
    report.isolatedSimulated[0].postWriteOk = false;
  },
  /post-write proof missing/,
);
rejected(
  "missing typecheck",
  (report) => {
    report.isolatedReal[0].tscOk = false;
  },
  /typecheck proof missing/,
);
rejected(
  "conflicting output",
  (report) => {
    report.isolatedReal[1].outputs = [
      { target: "components/ui/shared.tsx", sha256: "different" },
    ];
    report.isolatedReal[0].outputs = [
      { target: "components/ui/shared.tsx", sha256: "original" },
    ];
  },
  /conflicting target/,
);
rejected(
  "affected marked reusable",
  (report) => {
    report.evidenceReusable = true;
  },
  /must not be reusable/,
);
rejected(
  "affected writes receipt",
  (report) => {
    report.receiptWritten = true;
  },
  /must not write a receipt/,
);
rejected(
  "empty selectors",
  (report) => {
    report.selectedRoots = [];
  },
  /nonempty roots/,
);
rejected(
  "cross-phase consumer reuse",
  (report) => {
    report.isolatedSimulated[0].consumer = report.isolatedReal[0].consumer;
  },
  /consumer reused across proof phases/,
);
rejected(
  "failed status",
  (report) => {
    report.status = "fail";
  },
  /status is not pass/,
);
rejected(
  "missing public package artifact proof",
  (report) => {
    report.packageArtifacts = [];
  },
  /public package artifact proof is missing/,
);
rejected(
  "unvalidated packed exports",
  (report) => {
    report.packageArtifacts[0].exportsValidated = false;
  },
  /packed exports were not validated/,
);
rejected(
  "missing required public package",
  (report) => {
    report.packageArtifacts = report.packageArtifacts.filter(
      (artifact) => artifact.name !== "@vegastack/design-tokens",
    );
  },
  /required public package artifact @vegastack\/design-tokens is missing/,
);
rejected(
  "duplicate public package artifact",
  (report) => {
    report.packageArtifacts.push(structuredClone(report.packageArtifacts[0]));
  },
  /duplicate public package artifact @vegastack\/design/,
);
rejected(
  "unknown layout",
  (report) => {
    report.selectedLayouts = ["invented"];
    report.isolatedReal = report.isolatedReal.map((leaf) => ({
      ...leaf,
      layout: "invented",
    }));
    report.isolatedSimulated = report.isolatedSimulated.map((leaf) => ({
      ...leaf,
      layout: "invented",
    }));
  },
  /unknown selected layout/,
);
assert.match(
  validateConsumeReport(validAffected, { expectedRootCount: 553 }).join("\n"),
  /does not match independently derived 553/,
);

const validFull = {
  ...structuredClone(validAffected),
  mode: "full",
  selectedRoots: ["a", "b"],
  selectedLayouts: ["default", "src"],
  fullOracleExecuted: true,
  shadowOnly: false,
  isolatedReal: [
    leaf("a", "/tmp/a"),
    leaf("b", "/tmp/b"),
    { ...leaf("a", "/tmp/a-src"), layout: "src" },
    { ...leaf("b", "/tmp/b-src"), layout: "src" },
  ],
  isolatedSimulated: [
    leaf("a", "/tmp/sim-a"),
    leaf("b", "/tmp/sim-b"),
    { ...leaf("a", "/tmp/sim-a-src"), layout: "src" },
    { ...leaf("b", "/tmp/sim-b-src"), layout: "src" },
  ],
  consolidated: [
    {
      layout: "default",
      consumer: "/tmp/full-default",
      provenItems: 554,
      totalItems: 554,
      postWriteOk: true,
      tscOk: true,
      collisionsOk: true,
    },
    {
      layout: "src",
      consumer: "/tmp/full-src",
      provenItems: 554,
      totalItems: 554,
      postWriteOk: true,
      tscOk: true,
      collisionsOk: true,
    },
  ],
};
assert.deepEqual(validateConsumeReport(validFull), []);

rejected(
  "full without oracle",
  (report) => {
    Object.assign(report, structuredClone(validFull));
    report.fullOracleExecuted = false;
  },
  /full oracle was not executed/,
);
rejected(
  "full missing src layout",
  (report) => {
    Object.assign(report, structuredClone(validFull));
    report.consolidated = report.consolidated.filter(
      (entry) => entry.layout !== "src",
    );
  },
  /missing consolidated src layout/,
);
rejected(
  "full wrong item count",
  (report) => {
    Object.assign(report, structuredClone(validFull));
    report.consolidated[0].provenItems = 553;
  },
  /did not prove its complete item universe/,
);
rejected(
  "full self-consistent but incomplete count",
  (report) => {
    Object.assign(report, structuredClone(validFull));
    report.consolidated[0].provenItems = 553;
    report.consolidated[0].totalItems = 553;
  },
  /did not prove its complete item universe/,
);

console.log(
  "✓ consume isolation: public artifact/export omissions, accumulated roots, missing post-write/typecheck, target conflicts, incomplete full layouts/counts, empty selectors, receipt writes, and reusable shadow evidence fail closed",
);
