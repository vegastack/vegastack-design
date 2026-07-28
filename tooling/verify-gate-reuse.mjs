#!/usr/bin/env node

import assert from "node:assert/strict";

import {
  assessExactTreeProductionReceipt,
  chooseMonotonicReceipt,
  exactTreeReusePlan,
} from "./lib/gate-reuse.mjs";
import { SCHEMA } from "./lib/gate-receipt.mjs";
import {
  BROWSER_ENGINES,
  buildEvidenceManifest,
  CHANGE_PROFILE,
  FULL_CONTRACT_TESTS,
  PRODUCTION_PROFILE,
} from "./lib/gate-profile.mjs";
import { COMPONENT_ROUTES } from "./lib/route-scope.mjs";

const TREE = "tree-1111111111111111111111111111111111111111";
const OTHER_TREE = "tree-2222222222222222222222222222222222222222";
const CONTRACT_SHA = "a".repeat(64);
const TOOLCHAIN = { "@playwright/test": "1.61.0", playwright: "1.61.0" };

function production(overrides = {}) {
  return {
    schema: SCHEMA,
    profile: PRODUCTION_PROFILE,
    tree: TREE,
    head: "b".repeat(40),
    writtenAt: "2026-07-28T00:00:00.000Z",
    mode: "ship",
    host: { platform: "darwin", arch: "arm64", node: "v24.18.0" },
    toolchain: { ...TOOLCHAIN },
    contractSha256: CONTRACT_SHA,
    gates: {
      typecheck: { status: "pass" },
      lint: { status: "pass" },
      unit: { status: "pass", engines: ["chromium"] },
      smoke: { status: "pass", engines: [...BROWSER_ENGINES] },
      "all-browsers": { status: "pass", engines: [...BROWSER_ENGINES] },
      contracts: {
        status: "pass",
        full: true,
        scopeRoutes: COMPONENT_ROUTES.length,
        routes: [...COMPONENT_ROUTES],
        expected: FULL_CONTRACT_TESTS,
        executed: FULL_CONTRACT_TESTS,
      },
    },
    evidence: buildEvidenceManifest({
      profile: PRODUCTION_PROFILE,
      contractRoutes: COMPONENT_ROUTES,
      tree: TREE,
      toolchain: TOOLCHAIN,
      contractSha256: CONTRACT_SHA,
    }),
    skips: [],
    ...overrides,
  };
}

function change(overrides = {}) {
  return {
    ...production(),
    profile: CHANGE_PROFILE,
    mode: "push",
    evidence: buildEvidenceManifest({
      profile: CHANGE_PROFILE,
      required: { contracts: false, unit: false, smoke: false },
      contractRoutes: [],
      tree: TREE,
      toolchain: TOOLCHAIN,
      contractSha256: CONTRACT_SHA,
    }),
    gates: {
      typecheck: { status: "pass" },
      lint: { status: "pass" },
    },
    ...overrides,
  };
}

const context = {
  treeHash: TREE,
  pinned: TOOLCHAIN,
  contractSha: CONTRACT_SHA,
};
const accepted = assessExactTreeProductionReceipt(production(), context);
assert.equal(accepted.eligible, true, accepted.problems?.join(" | "));
assert.deepEqual(accepted.reusableGates, [
  "unit",
  "smoke",
  "all-browsers",
  "contracts",
]);

for (const [name, receipt, expected] of [
  ["scoped/change", change(), /production-full/],
  ["different tree", production({ tree: OTHER_TREE }), /different content/],
  [
    "carried",
    production({ carriedFrom: OTHER_TREE, carryReason: "version-bump" }),
    /exact[- ]tree/,
  ],
  [
    "toolchain",
    production({ toolchain: { playwright: "1.60.0" } }),
    /toolchain|does not record|browser behaviour/,
  ],
  [
    "authority",
    production({ contractSha256: "f".repeat(64) }),
    /component inventory/,
  ],
  ["corrupt", { __unreadable: "Unexpected token" }, /unreadable/],
]) {
  const assessment = assessExactTreeProductionReceipt(receipt, context);
  assert.equal(assessment.eligible, false, name);
  assert.match(assessment.reason, expected, name);
}

const stronger = production();
const weaker = change();
assert.equal(
  chooseMonotonicReceipt({ existing: stronger, candidate: weaker, context })
    .receipt,
  stronger,
  "an exact-tree production receipt must dominate a later change receipt",
);
assert.equal(
  chooseMonotonicReceipt({
    existing: production({ tree: OTHER_TREE }),
    candidate: weaker,
    context,
  }).receipt,
  weaker,
  "a strong receipt for another tree is stale, not reusable",
);
const annotated = chooseMonotonicReceipt({
  existing: stronger,
  candidate: change({
    gates: { unit: { status: "fail" } },
    skips: [{ gate: "unit", reason: "diagnostic specimen" }],
  }),
  context,
});
assert.equal(annotated.disposition, "annotated-production-full-failure");
assert.equal(annotated.receipt.profile, PRODUCTION_PROFILE);
assert.equal(annotated.receipt.evidence, stronger.evidence);
assert.equal(annotated.receipt.gates.unit.status, "fail");
assert.equal(
  assessExactTreeProductionReceipt(annotated.receipt, context).eligible,
  false,
  "a later failure must remain visible and cannot ride the earlier full receipt",
);

const shadow = exactTreeReusePlan(production(), context);
assert.equal(
  shadow.enabled,
  false,
  "reuse must stay disabled before checkpoint",
);
assert.equal(shadow.decision, "would-reuse");
assert.deepEqual(shadow.execute, [
  "unit",
  "smoke",
  "all-browsers",
  "contracts",
]);

console.log(
  "✓ gate reuse: exact-tree production dominance + stale/carry/toolchain/authority/corrupt mutations; shadow executes the full oracle",
);
