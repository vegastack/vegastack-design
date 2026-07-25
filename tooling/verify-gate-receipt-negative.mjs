#!/usr/bin/env node
// Prove the receipt guard rejects every way a receipt can be wrong.
//
// WHY THIS IS NOT OPTIONAL
//   Under the local-first topology no GitHub-hosted runner executes a browser gate, so
//   `verify-gate-receipt.mjs` is the entire mechanism by which a push carries evidence that the unit
//   suite, the cross-engine smoke, and the 768 behaviour contracts ran. A guard with a hole in it is
//   worse than no guard: it produces a green check that means nothing.
//
//   This repository already keeps `verify-design-lint-structural.mjs` and
//   `verify-registry-integrity-negative.mjs` for exactly this reason — a gate never observed failing
//   is an assumption. Every rejection below is asserted, and a valid receipt is asserted to PASS so
//   the suite cannot trivially satisfy itself by rejecting everything.

import assert from "node:assert/strict";

import {
  ALWAYS_REQUIRED,
  CONDITIONAL_GATES,
  SCHEMA,
  verifyReceipt,
} from "./lib/gate-receipt.mjs";

const TREE = "tree-1111111111111111111111111111111111111111";
const CONTRACT_SHA = "a".repeat(64);
const PINNED = { "@playwright/test": "1.61.0", playwright: "1.61.0" };

/** A receipt that must pass, so every negative below differs by exactly one fact. */
function validReceipt(overrides = {}) {
  return {
    schema: SCHEMA,
    tree: TREE,
    head: "b".repeat(40),
    writtenAt: "2026-07-25T00:00:00.000Z",
    mode: "push",
    host: { platform: "darwin", arch: "arm64", node: "v24.18.0" },
    toolchain: { ...PINNED },
    contractSha256: CONTRACT_SHA,
    gates: {
      typecheck: { status: "pass", durationMs: 12_000 },
      lint: { status: "pass", durationMs: 20_000 },
      unit: { status: "pass", durationMs: 16_000 },
      smoke: { status: "pass", durationMs: 16_000 },
      contracts: {
        status: "pass",
        durationMs: 24_000,
        executed: 16,
        full: false,
        scopeRoutes: 2,
      },
    },
    skips: [],
    ...overrides,
  };
}

const BASE_EXPECTATIONS = {
  treeHash: TREE,
  required: { contracts: true, unit: true, smoke: true },
  pinned: PINNED,
  contractSha: CONTRACT_SHA,
  allowedSkips: [],
};

let checks = 0;

function expectPass(receipt, expectations, label) {
  const { problems } = verifyReceipt(receipt, {
    ...BASE_EXPECTATIONS,
    ...expectations,
  });
  assert.deepEqual(
    problems,
    [],
    `${label} must PASS the guard, got: ${problems.join(" | ")}`,
  );
  checks++;
}

function expectReject(receipt, expectations, pattern, label) {
  const { problems } = verifyReceipt(receipt, {
    ...BASE_EXPECTATIONS,
    ...expectations,
  });
  assert.ok(
    problems.length > 0,
    `${label} must be REJECTED by the guard, but it reported no problems`,
  );
  assert.ok(
    problems.some((problem) => pattern.test(problem)),
    `${label} must be rejected FOR THE RIGHT REASON (/${pattern.source}/), got: ${problems.join(" | ")}`,
  );
  checks++;
}

// ── the positive control ─────────────────────────────────────────────────────────────────────────

expectPass(validReceipt(), {}, "a complete, current receipt");

// A change requiring nothing conditional still requires the always-on pair.
expectPass(
  validReceipt({
    gates: {
      typecheck: { status: "pass" },
      lint: { status: "pass" },
      contracts: { status: "skipped", reason: "no contract surface changed" },
      unit: { status: "skipped", reason: "no component source changed" },
      smoke: {
        status: "skipped",
        reason: "no smoke-selected component changed",
      },
    },
  }),
  { required: { contracts: false, unit: false, smoke: false } },
  "legitimately skipped conditional gates when the change does not require them",
);

// ── the receipt does not describe this tree ───────────────────────────────────────────────────────

expectReject(
  { __unreadable: "missing" },
  {},
  /no gate receipt/,
  "a missing receipt",
);
expectReject(
  { __unreadable: "Unexpected token" },
  {},
  /unreadable/,
  "a corrupt receipt",
);
expectReject(
  validReceipt({ tree: "tree-9999999999999999999999999999999999999999" }),
  {},
  /different content than is being pushed/,
  "a receipt bound to a DIFFERENT tree — the central check",
);
expectReject(
  validReceipt({ tree: undefined }),
  {},
  /records no tree hash/,
  "a receipt with no tree hash at all",
);
expectReject(
  validReceipt({ schema: SCHEMA + 1 }),
  {},
  /schema/,
  "a receipt from a future schema",
);
expectReject(
  validReceipt({ contractSha256: "f".repeat(64) }),
  {},
  /different component inventory/,
  "a receipt carrying a forged contract SHA-256",
);

// ── the toolchain the gates actually ran on ───────────────────────────────────────────────────────

expectReject(
  validReceipt({
    toolchain: { "@playwright/test": "1.60.0", playwright: "1.61.0" },
  }),
  {},
  /browser behaviour is version-specific/,
  "a receipt produced against a different Playwright than this tree pins",
);
expectReject(
  validReceipt({ toolchain: {} }),
  {},
  /does not record which/,
  "a receipt that does not say which Playwright it ran on",
);

// ── required gates ───────────────────────────────────────────────────────────────────────────────

for (const gate of [...ALWAYS_REQUIRED, ...CONDITIONAL_GATES]) {
  const gates = validReceipt().gates;
  delete gates[gate];
  expectReject(
    validReceipt({ gates }),
    {},
    new RegExp(`requires the \`${gate}\` gate|\`${gate}\``),
    `a receipt missing the required \`${gate}\` gate`,
  );
}

for (const gate of CONDITIONAL_GATES) {
  const gates = {
    ...validReceipt().gates,
    [gate]: { status: "skipped", reason: "felt slow" },
  };
  expectReject(
    validReceipt({ gates }),
    {},
    new RegExp(`\`${gate}\` is required for this change but was skipped`),
    `a receipt skipping \`${gate}\` when the change requires it`,
  );
}

expectReject(
  validReceipt({
    gates: {
      ...validReceipt().gates,
      contracts: { status: "fail", executed: 16 },
    },
  }),
  {},
  /FAILED and was pushed anyway/,
  "a receipt recording a FAILED gate",
);

expectReject(
  validReceipt({
    gates: {
      ...validReceipt().gates,
      contracts: { status: "green", executed: 16 },
    },
  }),
  {},
  /not one of/,
  "a receipt using an invented status word",
);

expectReject(
  validReceipt({
    gates: { ...validReceipt().gates, "totally-made-up": { status: "pass" } },
  }),
  {},
  /unknown gate/,
  "a receipt inventing a gate name",
);

// ── the green-but-empty fail-open ─────────────────────────────────────────────────────────────────

// This is the specific shape the whole design has to survive: a contracts lane that reports pass
// while having executed nothing reads exactly like a real pass.
expectReject(
  validReceipt({
    gates: {
      ...validReceipt().gates,
      contracts: { status: "pass", executed: 0, full: false, scopeRoutes: 0 },
    },
  }),
  {},
  /executed 0 tests/,
  "a contracts gate reporting pass over ZERO executed tests",
);
expectReject(
  validReceipt({
    gates: {
      ...validReceipt().gates,
      contracts: { status: "pass", executed: 12, full: false, scopeRoutes: 0 },
    },
  }),
  {},
  /0 routes/,
  "a contracts gate reporting pass over ZERO routes",
);
// `executed` absent entirely must not read as "fine".
expectReject(
  validReceipt({
    gates: {
      ...validReceipt().gates,
      contracts: { status: "pass", scopeRoutes: 2 },
    },
  }),
  {},
  /executed 0 tests/,
  "a contracts gate that does not record how many tests it executed",
);

// ── the loud door ────────────────────────────────────────────────────────────────────────────────

expectReject(
  validReceipt({ skips: [{ gate: "contracts", reason: "in a hurry" }] }),
  {},
  /needs MK acknowledgement/,
  "a recorded GATES_SKIP without acknowledgement",
);
expectPass(
  validReceipt({
    skips: [{ gate: "contracts", reason: "runner outage, MK approved" }],
  }),
  { allowedSkips: ["contracts"] },
  "a recorded skip WITH explicit acknowledgement",
);
// Acknowledging one gate must not acknowledge another.
expectReject(
  validReceipt({ skips: [{ gate: "smoke", reason: "in a hurry" }] }),
  { allowedSkips: ["contracts"] },
  /needs MK acknowledgement/,
  "an acknowledgement for a DIFFERENT gate",
);

// ── every problem is reported, not just the first ─────────────────────────────────────────────────

// A guard that stops at the first problem turns one fix-and-rerun cycle into five.
const manyProblems = verifyReceipt(
  validReceipt({
    tree: "tree-0000000000000000000000000000000000000000",
    contractSha256: "c".repeat(64),
    toolchain: { "@playwright/test": "1.0.0", playwright: "1.0.0" },
  }),
  BASE_EXPECTATIONS,
).problems;
assert.ok(
  manyProblems.length >= 4,
  `the guard must report every problem at once, got ${manyProblems.length}: ${manyProblems.join(" | ")}`,
);
checks++;

console.log(
  `✓ gate-receipt: ${checks} assertions — a current receipt passes, and the guard rejects a stale ` +
    `tree, a forged contract SHA, a mismatched Playwright, every missing or skipped required gate, ` +
    `a failed gate, an invented status, and a contracts lane that reports pass over zero tests`,
);
