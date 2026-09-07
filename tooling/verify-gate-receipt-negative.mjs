#!/usr/bin/env node
// Prove the receipt guard rejects every way a receipt can be wrong.
//
// WHY THIS IS NOT OPTIONAL
//   Under the local-first topology no GitHub-hosted runner executes a browser gate, so
//   `verify-gate-receipt.mjs` is the entire mechanism by which a push carries evidence that the unit
//   suite, the cross-engine smoke, and the behaviour contracts over every component route ran. A
//   guard with a hole in it is worse than no guard: it produces a green check that means nothing.
//
//   This repository already keeps `verify-design-lint-structural.mjs` and
//   `verify-registry-integrity-negative.mjs` for exactly this reason — a gate never observed failing
//   is an assumption. Every rejection below is asserted, and a valid receipt is asserted to PASS so
//   the suite cannot trivially satisfy itself by rejecting everything.
//
//   The full-sweep section exists because the hole was real: on 2026-09-07 the audit reproduced
//   `deploy.yml`'s guard accepting a scoped one-route push receipt (TG-01), and a `GATES_SKIP` past
//   a failing ship-only gate writing a receipt with `skips: []` (TG-02). Both are asserted rejected.

import assert from "node:assert/strict";

import {
  ALL_GATES,
  ALWAYS_REQUIRED,
  CONDITIONAL_GATES,
  SCHEMA,
  SHIP_GATES,
  verifyReceipt,
} from "./lib/gate-receipt.mjs";

const TREE = "tree-1111111111111111111111111111111111111111";
const CONTRACT_SHA = "a".repeat(64);
const PINNED = { "@playwright/test": "1.61.0", playwright: "1.61.0" };
/** Stand-in for COMPONENT_ROUTES.length, so this suite does not depend on the live inventory. */
const ROUTE_COUNT = 110;

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

/** What `pnpm gates:ship` writes: every gate, the contract lane run with --all over every route. */
function shipReceipt(overrides = {}) {
  return validReceipt({
    mode: "ship",
    gates: {
      typecheck: { status: "pass", durationMs: 12_000 },
      lint: { status: "pass", durationMs: 40_000 },
      unit: { status: "pass", durationMs: 16_000 },
      smoke: { status: "pass", durationMs: 16_000 },
      "all-browsers": { status: "pass", durationMs: 99_000 },
      registry: { status: "pass", durationMs: 9_000 },
      consume: { status: "pass", durationMs: 222_000 },
      contracts: {
        status: "pass",
        durationMs: 840_000,
        executed: ROUTE_COUNT * 8,
        full: true,
        scopeRoutes: ROUTE_COUNT,
      },
    },
    ...overrides,
  });
}

const BASE_EXPECTATIONS = {
  treeHash: TREE,
  required: { contracts: true, unit: true, smoke: true },
  pinned: PINNED,
  contractSha: CONTRACT_SHA,
  allowedSkips: [],
  componentRouteCount: ROUTE_COUNT,
};
const FULL_SWEEP = { requireFullSweep: true };

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
// Schema 1 never recorded the ship-only gates, so it cannot say what it omitted. Rejected with a
// message that says so — this is what the committed receipt looks like until it is re-minted.
expectReject(
  validReceipt({ schema: 1 }),
  {},
  /schema is 1.*never recorded the ship-only gates/,
  "a schema-1 receipt",
);
expectReject(
  shipReceipt({ schema: 1 }),
  FULL_SWEEP,
  /schema is 1/,
  "a schema-1 receipt on the deploy path, even one that looks complete",
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
// A skip naming a gate the ladder does not run cannot be acknowledged, only investigated. Schema 1
// silently ignored such an entry, which is one half of how a ship-only failure vanished (TG-02).
expectReject(
  validReceipt({ skips: [{ gate: "vibes", reason: "felt fine" }] }),
  { allowedSkips: ["vibes"] },
  /skip for an unknown gate "vibes"/,
  "a skip naming an unknown gate — even when 'acknowledged'",
);
// A ship-only gate that failed under GATES_SKIP is recorded and rejected like any other.
expectReject(
  shipReceipt({
    gates: {
      ...shipReceipt().gates,
      "all-browsers": { status: "fail", durationMs: 99_000 },
    },
    skips: [
      { gate: "all-browsers", reason: "Firefox timeouts, will fix later" },
    ],
  }),
  FULL_SWEEP,
  /`all-browsers` FAILED and was pushed anyway/,
  "a failed ship-only gate recorded under GATES_SKIP — the silent door TG-02 found",
);
expectReject(
  shipReceipt({
    gates: {
      ...shipReceipt().gates,
      "all-browsers": { status: "fail", durationMs: 99_000 },
    },
    skips: [
      { gate: "all-browsers", reason: "Firefox timeouts, will fix later" },
    ],
  }),
  FULL_SWEEP,
  /`all-browsers` was deliberately skipped/,
  "…and its skip needs acknowledgement like any other",
);

// ── the full sweep a deploy requires ─────────────────────────────────────────────────────────────
//
// `deploy.yml` passes `--require-full-sweep`. Schema 1 could not express this at all: `verifyReceipt`
// checked only `executed > 0` and never `mode` or `full`, and the three ship-only gates were dropped
// on write. Reproduced 2026-09-07 — a scoped one-route push receipt satisfied the deploy guard.

expectPass(
  shipReceipt(),
  FULL_SWEEP,
  "a complete `gates ship` receipt on the deploy path",
);
// A ship receipt is also an ordinary push receipt: ship gates present in push mode are fine.
expectPass(
  shipReceipt(),
  {},
  "a complete `gates ship` receipt on the push path",
);
// The carry preserves `mode: "ship"`, so a carried full sweep still deploys.
expectPass(
  shipReceipt({
    carriedFrom: "tree-" + "e".repeat(40),
    carryReason: "version-bump",
  }),
  { ...FULL_SWEEP, carryVerified: { ok: true, offenders: [], files: 1593 } },
  "a carried full-sweep receipt on the deploy path",
);

expectReject(
  validReceipt(),
  FULL_SWEEP,
  /written by `gates push`, but a deploy requires the full sweep/,
  "a scoped PUSH receipt on the deploy path — the TG-01 reproduction",
);
expectReject(
  validReceipt(),
  FULL_SWEEP,
  /requires the `all-browsers` gate and the receipt does not carry it/,
  "…which is also missing every ship-only gate",
);
for (const gate of SHIP_GATES) {
  const gates = shipReceipt().gates;
  delete gates[gate];
  expectReject(
    shipReceipt({ gates }),
    FULL_SWEEP,
    new RegExp(
      `requires the \`${gate}\` gate and the receipt does not carry it`,
    ),
    `a ship receipt missing the \`${gate}\` gate`,
  );
  expectReject(
    shipReceipt({
      gates: {
        ...shipReceipt().gates,
        [gate]: { status: "skipped", reason: "not run" },
      },
    }),
    FULL_SWEEP,
    new RegExp(`\`${gate}\` is required for this change but was skipped`),
    `a ship receipt that skipped the \`${gate}\` gate`,
  );
}
// `mode: "ship"` alone is not a sweep — the contract lane must have run --all over every route.
expectReject(
  shipReceipt({
    gates: {
      ...shipReceipt().gates,
      contracts: { status: "pass", executed: 8, full: false, scopeRoutes: 1 },
    },
  }),
  FULL_SWEEP,
  /did not run with --all/,
  "a ship-mode receipt whose contract lane was scoped to one route",
);
expectReject(
  shipReceipt({
    gates: {
      ...shipReceipt().gates,
      contracts: {
        status: "pass",
        executed: (ROUTE_COUNT - 2) * 8,
        full: true,
        scopeRoutes: ROUTE_COUNT - 2,
      },
    },
  }),
  FULL_SWEEP,
  new RegExp(
    `covered ${ROUTE_COUNT - 2} route\\(s\\) but this tree has ${ROUTE_COUNT} component routes`,
  ),
  "a full sweep recorded against a smaller inventory than the tree being deployed",
);
// Every gate the ladder knows is a required gate on the deploy path — none may be missing.
{
  const gates = Object.fromEntries(
    ALL_GATES.map((gate) => [gate, shipReceipt().gates[gate]]),
  );
  assert.deepEqual(
    Object.keys(gates).sort(),
    Object.keys(shipReceipt().gates).sort(),
    "the ship fixture must carry exactly ALL_GATES, or these assertions test a stale gate set",
  );
  checks++;
}

// ── the version-bump carry ────────────────────────────────────────────────────────────────────────
//
// A carried receipt attests browser results measured against a DIFFERENT tree. That is legitimate for
// a version bump — `changeset version` moves the tree hash while changing no code a browser gate can
// observe — and illegitimate for anything else. These assertions are what keep `carriedFrom` from
// becoming a free-text field that excuses any tree.

const CARRIED = {
  carriedFrom: "tree-" + "e".repeat(40),
  carryReason: "version-bump",
};

expectPass(
  validReceipt(CARRIED),
  { carryVerified: { ok: true, offenders: [], files: 1593 } },
  "a carried receipt whose diff the caller PROVED is version churn",
);
expectReject(
  validReceipt(CARRIED),
  {},
  /did not verify that claim against git/,
  "a carried receipt the caller did not verify at all",
);
expectReject(
  validReceipt(CARRIED),
  {
    carryVerified: {
      ok: false,
      offenders: [{ file: "packages/ui/registry/ui/button.tsx" }],
    },
  },
  /NOT pure version churn/,
  "a carry hiding a real component change — the fail-open this exists to stop",
);
// A carry whose origin cannot be re-derived is worthless: the tree hash in `carriedFrom` names a
// DANGLING object that exists only on the machine that computed it, which is why the proof is anchored
// to `carriedFromCommit`. Release run 30168750521 died on exactly this.
expectReject(
  validReceipt({
    carriedFrom: "tree-" + "e".repeat(40),
    carryReason: "version-bump",
  }),
  {
    carryVerified: {
      ok: false,
      offenders: [{ file: "(the receipt records no carriedFromCommit…)" }],
    },
  },
  /NOT pure version churn/,
  "a carry with no re-derivable origin commit",
);

expectReject(
  validReceipt({
    carriedFrom: "tree-" + "e".repeat(40),
    carryReason: "felt like it",
  }),
  { carryVerified: { ok: true, offenders: [] } },
  /only carry this system recognises/,
  "a carry with an invented reason",
);
// An UNcarried receipt must not be affected by any of this.
expectPass(
  validReceipt(),
  { carryVerified: null },
  "an ordinary receipt, with no carry claim",
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
    `a failed gate, an invented status, a contracts lane that reports pass over zero tests, a ` +
    `schema-1 receipt, a skip naming an unknown gate, and — on the deploy path — a push receipt, a ` +
    `missing or skipped ship-only gate, and a contract lane that was not a full sweep`,
);
