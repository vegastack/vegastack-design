// The gate receipt: what ran, against exactly which content, on which toolchain.
//
// WHAT IT IS FOR
//   Under the local-first topology (docs/plans/2026-07-25-cicd-local-first-revamp.md, Option A) no
//   GitHub-hosted runner executes a browser gate. CI re-executes the entire non-browser half on the
//   free mac minis and therefore needs no receipt for it. The four browser lanes — the unit suite,
//   the cross-engine smoke, the three-engine suite, and the 864 behaviour contracts — run only on a
//   developer machine. This file is how a push carries evidence that they ran, and ran against the
//   content being pushed.
//
// WHAT IT IS NOT
//   Proof. `git push --no-verify` plus a hand-edited JSON defeats it, and nothing here pretends
//   otherwise. It converts skipping a browser gate from a silent act into a visible, auditable one,
//   and that is the entire guarantee on those lanes. It is the right trade while one person merges
//   component changes; when that stops being true the answer is required status checks and a second
//   machine actually re-running the lanes, not a cleverer receipt.
//
//   Say this out loud in AGENTS.md and in review. A receipt read as proof is worse than no receipt.
//
// WHY IT BINDS TO A WORKING-TREE HASH
//   `tree` is a git tree hash of the working tree with `.gates/` excluded (see
//   tooling/lib/change-set.mjs). Excluding the receipt's own directory is what makes the binding
//   non-circular: writing the receipt does not invalidate it, and committing it does not either, so
//   ONE commit can carry both a change and the evidence for it.

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ROOT } from "./change-set.mjs";
import { atomicWriteJson } from "./measurement-report.mjs";
import {
  BROWSER_ENGINES,
  buildEvidenceManifest,
  canonicalJson,
  CHANGE_PROFILE,
  CONTRACT_ASSERTIONS,
  CONTRACT_PROJECTS,
  FULL_CONTRACT_TESTS,
  PRODUCTION_ENVIRONMENT,
  PRODUCTION_PROFILE,
  profileRequirements,
  sha256,
  VALID_PROFILES,
} from "./gate-profile.mjs";
import { COMPONENT_ROUTES } from "./route-scope.mjs";

export const SCHEMA = 2;
export const RECEIPT_PATH = join(ROOT, ".gates/receipt.json");
export const RECEIPT_REPO_PATH = ".gates/receipt.json";

/**
 * Gates the receipt must always carry. These are re-executed by CI anyway, so requiring them buys
 * one specific thing: evidence that the hook ran at all rather than being bypassed.
 */
export const ALWAYS_REQUIRED = ["typecheck", "lint"];

/** Gates required only when the change class calls for them. Every one is a BROWSER lane. */
export const CONDITIONAL_GATES = ["unit", "smoke", "contracts"];
export const PRODUCTION_ONLY_GATES = ["all-browsers"];

export const ALL_GATES = [
  ...ALWAYS_REQUIRED,
  ...CONDITIONAL_GATES,
  ...PRODUCTION_ONLY_GATES,
];

export const VALID_STATUSES = new Set(["pass", "fail", "skipped"]);

/**
 * The Playwright versions the repository PINS, read from committed manifests so CI can evaluate this
 * without installing anything. A receipt produced against a different installed build is not
 * evidence about this tree: the contract suite's tolerances were tuned against specific engine
 * behaviour, and the pinned version is what the rest of the ladder assumes.
 */
export function pinnedToolchain() {
  const read = (relative) =>
    JSON.parse(readFileSync(join(ROOT, relative), "utf8"));
  const docs = read("apps/docs/package.json");
  const ui = read("packages/ui/package.json");
  return {
    "@playwright/test":
      docs.devDependencies?.["@playwright/test"] ??
      docs.dependencies?.["@playwright/test"] ??
      null,
    playwright:
      ui.devDependencies?.playwright ?? ui.dependencies?.playwright ?? null,
    vitest: ui.devDependencies?.vitest ?? ui.dependencies?.vitest ?? null,
    "@vitest/browser-playwright":
      ui.devDependencies?.["@vitest/browser-playwright"] ??
      ui.dependencies?.["@vitest/browser-playwright"] ??
      null,
  };
}

/** The Playwright versions actually INSTALLED here. Null entries mean "not installed". */
export function installedToolchain() {
  const version = (relative) => {
    try {
      return JSON.parse(readFileSync(join(ROOT, relative), "utf8")).version;
    } catch {
      return null;
    }
  };
  return {
    "@playwright/test": version(
      "apps/docs/node_modules/@playwright/test/package.json",
    ),
    playwright: version("packages/ui/node_modules/playwright/package.json"),
    vitest: version("packages/ui/node_modules/vitest/package.json"),
    "@vitest/browser-playwright": version(
      "packages/ui/node_modules/@vitest/browser-playwright/package.json",
    ),
  };
}

/** The contract SHA-256 the generated surfaces were derived from. */
export function contractSha256() {
  const generated = readFileSync(
    join(ROOT, "apps/docs/vrt/contract-routes.generated.ts"),
    "utf8",
  );
  return /Contract SHA-256: ([a-f0-9]{64})/.exec(generated)?.[1] ?? null;
}

export function readReceipt(path = RECEIPT_PATH) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    return {
      __unreadable: error.code === "ENOENT" ? "missing" : error.message,
    };
  }
}

/** All receipt writers use one flushed same-filesystem temporary + atomic rename. */
export function writeReceiptFile(receipt, path = RECEIPT_PATH) {
  atomicWriteJson(path, receipt);
}

/**
 * Verify a receipt against the tree and change class it is supposed to describe.
 *
 * Returns `{ problems: string[] }`. Every check is a separate problem string so a failing guard
 * reports everything wrong at once — a guard that stops at the first problem turns one fix-and-rerun
 * cycle into five.
 */
export function verifyReceipt(
  receipt,
  {
    treeHash,
    required = {},
    pinned = pinnedToolchain(),
    contractSha = contractSha256(),
    allowedSkips = [],
    // Set by the caller ONLY after re-deriving `versionBumpOnly()` from git between the receipt's
    // `carriedFrom` tree and this one. A carry the caller has not verified is rejected below —
    // otherwise `carriedFrom` would be a free-text field that excuses any tree.
    carryVerified = null,
    profile = CHANGE_PROFILE,
    contractRoutes = [],
  },
) {
  const problems = [];
  const fail = (message) => problems.push(message);

  if (receipt?.__unreadable) {
    fail(
      receipt.__unreadable === "missing"
        ? `no gate receipt at ${RECEIPT_REPO_PATH} — run \`pnpm gates:push\` and commit the receipt it writes`
        : `gate receipt is unreadable: ${receipt.__unreadable}`,
    );
    return { problems };
  }

  if (receipt.schema !== SCHEMA)
    fail(
      `gate receipt schema is ${receipt.schema}, expected ${SCHEMA} — regenerate it with \`pnpm gates:push\``,
    );

  if (!VALID_PROFILES.has(receipt.profile))
    fail(
      `gate receipt records unknown profile ${JSON.stringify(receipt.profile)}; expected ${profile}`,
    );
  else if (
    receipt.profile !== profile &&
    !(profile === CHANGE_PROFILE && receipt.profile === PRODUCTION_PROFILE)
  )
    fail(
      `gate receipt profile is ${receipt.profile}, but this command requires ${profile}`,
    );

  // Profile dominance is one-way. A production-full receipt contains the complete change universe
  // plus all-browser/full-contract leaves, so it may satisfy a change guard. The reverse is never
  // true. Reconstruct against the receipt's stronger profile so its canonical leaves are neither
  // ignored nor mislabeled as extras.
  const effectiveProfile =
    profile === CHANGE_PROFILE && receipt.profile === PRODUCTION_PROFILE
      ? PRODUCTION_PROFILE
      : profile;

  if (typeof receipt.tree !== "string" || receipt.tree.length === 0)
    fail("gate receipt records no tree hash, so it describes nothing");
  else if (receipt.tree !== treeHash)
    fail(
      `gate receipt was produced against tree ${receipt.tree} but this tree is ${treeHash} — ` +
        "the gates ran against different content than is being pushed",
    );

  // A carried receipt attests browser results measured against a DIFFERENT tree, so the claim that
  // the difference was harmless has to be proven, not asserted. `tooling/gate-receipt-carry.mjs`
  // proves it before writing; the guard proves it again before accepting.
  if (receipt.carriedFrom !== undefined) {
    if (receipt.carryReason !== "version-bump")
      fail(
        `gate receipt was carried with reason ${JSON.stringify(receipt.carryReason)}; the only ` +
          "carry this system recognises is a version bump",
      );
    if (carryVerified === null)
      fail(
        "gate receipt claims to have been carried forward, but the caller did not verify that claim " +
          "against git — a carried receipt is only acceptable when the diff is re-derived",
      );
    else if (carryVerified?.ok !== true)
      fail(
        `gate receipt was carried from ${receipt.carriedFrom}, but the difference between that tree ` +
          `and this one is NOT pure version churn (${carryVerified?.offenders?.length ?? "?"} real ` +
          `change(s), e.g. ${carryVerified?.offenders?.[0]?.file ?? "unknown"}) — the browser gates ` +
          "must run against this tree",
      );
  }

  if (contractSha && receipt.contractSha256 !== contractSha)
    fail(
      `gate receipt records contract SHA-256 ${receipt.contractSha256 ?? "(none)"} but this tree's is ` +
        `${contractSha} — the receipt describes a different component inventory`,
    );

  if (
    receipt.host?.platform !== PRODUCTION_ENVIRONMENT.platform ||
    receipt.host?.arch !== PRODUCTION_ENVIRONMENT.arch
  )
    fail(
      `gate receipt host is ${receipt.host?.platform ?? "unknown"}/${receipt.host?.arch ?? "unknown"}; ` +
        `browser evidence requires ${PRODUCTION_ENVIRONMENT.platform}/${PRODUCTION_ENVIRONMENT.arch}`,
    );
  const nodeVersion = /^v(\d+)\.(\d+)\.(\d+)$/.exec(receipt.host?.node ?? "");
  if (
    !nodeVersion ||
    Number(nodeVersion[1]) !== PRODUCTION_ENVIRONMENT.nodeMajor ||
    Number(nodeVersion[2]) < 14
  )
    fail(
      `gate receipt Node is ${receipt.host?.node ?? "unknown"}; expected Node 24.14 or newer within the locked major`,
    );

  for (const [name, expected] of Object.entries(pinned)) {
    if (expected === null) continue;
    const actual = receipt.toolchain?.[name] ?? null;
    if (actual === null)
      fail(`gate receipt does not record which ${name} it ran against`);
    else if (actual !== expected)
      fail(
        `gate receipt ran against ${name} ${actual} but this tree pins ${expected} — ` +
          "browser behaviour is version-specific, so that is not evidence about this tree",
      );
  }

  const gates = receipt.gates ?? {};
  for (const [name, entry] of Object.entries(gates)) {
    if (!ALL_GATES.includes(name))
      fail(`gate receipt records an unknown gate \`${name}\``);
    if (!VALID_STATUSES.has(entry?.status))
      fail(
        `gate \`${name}\` has status ${JSON.stringify(entry?.status)}, which is not one of ${[
          ...VALID_STATUSES,
        ].join("/")}`,
      );
    if (entry?.status === "fail")
      fail(`gate \`${name}\` FAILED and was pushed anyway`);
  }

  let profiled = {};
  try {
    profiled = profileRequirements(effectiveProfile, required);
  } catch (error) {
    fail(error.message);
  }
  const requiredGates = [
    ...ALWAYS_REQUIRED,
    ...Object.entries(profiled)
      .filter(([, value]) => value === true)
      .map(([name]) => name),
  ];
  for (const name of requiredGates) {
    const entry = gates[name];
    if (!entry) {
      fail(
        `this change requires the \`${name}\` gate and the receipt does not carry it` +
          ([...CONDITIONAL_GATES, ...PRODUCTION_ONLY_GATES].includes(name)
            ? " — tooling/classify-change.mjs classified the change as needing it"
            : ""),
      );
      continue;
    }
    if (entry.status === "skipped")
      fail(
        `gate \`${name}\` is required for this change but was skipped${
          entry.reason ? ` (${entry.reason})` : ""
        }`,
      );
  }

  const sameStrings = (actual, expected) =>
    Array.isArray(actual) &&
    canonicalJson([...actual].sort()) === canonicalJson([...expected].sort());
  if (profiled.unit && gates.unit?.status === "pass") {
    if (!sameStrings(gates.unit.engines, ["chromium"]))
      fail("the unit/axe gate must record exactly the Chromium engine");
  }
  if (profiled.smoke && gates.smoke?.status === "pass") {
    if (!sameStrings(gates.smoke.engines, BROWSER_ENGINES))
      fail(
        "the smoke gate must represent Chromium, Firefox, and WebKit independently",
      );
  }
  if (profiled["all-browsers"] && gates["all-browsers"]?.status === "pass") {
    if (!sameStrings(gates["all-browsers"].engines, BROWSER_ENGINES))
      fail(
        "the complete three-engine gate must represent Chromium, Firefox, and WebKit independently",
      );
  }

  // A contracts entry that passed while executing nothing is the specific fail-open this whole
  // design has to survive: an empty scope reads exactly like a green run.
  if (profiled.contracts === true) {
    const contracts = gates.contracts;
    if (contracts?.status === "pass" && !(contracts.executed > 0))
      fail(
        "the contracts gate reports pass but executed 0 tests — an empty scope is not passing evidence",
      );
    if (
      contracts?.status === "pass" &&
      contracts.scopeRoutes === 0 &&
      !contracts.full
    )
      fail(
        "the contracts gate reports pass over 0 routes while this change requires contract coverage",
      );
    const expectedRoutes =
      effectiveProfile === PRODUCTION_PROFILE
        ? [...COMPONENT_ROUTES]
        : [...new Set(contractRoutes)];
    const expectedTests =
      expectedRoutes.length *
      CONTRACT_PROJECTS.length *
      CONTRACT_ASSERTIONS.length;
    if (!sameStrings(contracts?.routes, expectedRoutes))
      fail(
        `the contracts gate route manifest is incomplete or stale; expected ${expectedRoutes.length} authoritative route(s)`,
      );
    if (contracts?.executed !== expectedTests)
      fail(
        `the contracts gate executed ${contracts?.executed ?? 0} tests; expected exactly ${expectedTests}`,
      );
    if (contracts?.expected !== expectedTests)
      fail(
        `the contracts gate expected-count is ${contracts?.expected ?? 0}; independently reconstructed value is ${expectedTests}`,
      );
    if (effectiveProfile === PRODUCTION_PROFILE) {
      if (contracts?.full !== true)
        fail(
          "production-full requires a full contracts report, not scoped evidence",
        );
      if (expectedRoutes.length !== COMPONENT_ROUTES.length)
        fail(
          `production-full route authority is inconsistent: ${expectedRoutes.length} versus ${COMPONENT_ROUTES.length}`,
        );
      if (expectedTests !== FULL_CONTRACT_TESTS)
        fail(
          `production-full contract authority is inconsistent: ${expectedTests} versus ${FULL_CONTRACT_TESTS}`,
        );
    }
  }

  // The manifest is the enforcement surface. Its required universe and every fingerprint are
  // rebuilt from this checkout; the coverage root is only a deterministic summary of those leaves.
  let expectedEvidence = null;
  try {
    expectedEvidence = buildEvidenceManifest({
      profile: effectiveProfile,
      required,
      contractRoutes,
      tree: treeHash,
      executedOnTree:
        receipt.carriedFrom !== undefined ? receipt.carriedFrom : treeHash,
      toolchain: pinned,
      contractSha256: contractSha,
    });
  } catch (error) {
    fail(
      `could not reconstruct the required evidence universe: ${error.message}`,
    );
  }
  const evidence = receipt.evidence;
  if (!evidence || !Array.isArray(evidence.leaves))
    fail(
      "gate receipt carries no canonical evidence-leaf manifest; a coverage-root digest alone is not accepted",
    );
  else if (expectedEvidence) {
    const ids = evidence.leaves.map((leaf) => leaf?.id);
    const duplicateIds = ids.filter(
      (id, index) => id === undefined || ids.indexOf(id) !== index,
    );
    if (duplicateIds.length > 0)
      fail(
        `evidence manifest has duplicate or missing unit IDs: ${[...new Set(duplicateIds)].join(", ")}`,
      );
    const sorted = [...ids].sort();
    if (canonicalJson(ids) !== canonicalJson(sorted))
      fail("evidence leaves are not in canonical sorted unit-ID order");

    const expectedById = new Map(
      expectedEvidence.leaves.map((leaf) => [leaf.id, leaf]),
    );
    const actualById = new Map(evidence.leaves.map((leaf) => [leaf?.id, leaf]));
    const missing = [...expectedById.keys()].filter(
      (id) => !actualById.has(id),
    );
    const extra = [...actualById.keys()].filter((id) => !expectedById.has(id));
    if (missing.length > 0)
      fail(
        `evidence manifest is missing ${missing.length} required leaf/leaves, e.g. ${missing[0]}`,
      );
    if (extra.length > 0)
      fail(
        `evidence manifest has ${extra.length} unknown/extra leaf/leaves, e.g. ${extra[0]}`,
      );
    for (const [id, expected] of expectedById) {
      const actual = actualById.get(id);
      if (actual && canonicalJson(actual) !== canonicalJson(expected))
        fail(
          `evidence leaf ${id} has a wrong profile, result, executed tree, or content/toolchain/authority fingerprint`,
        );
    }
    if (
      canonicalJson(evidence.requiredUniverse) !==
      canonicalJson(expectedEvidence.requiredUniverse)
    )
      fail(
        "evidence required-universe counts/digest do not match the independently reconstructed universe",
      );
    if (
      canonicalJson(evidence.environment) !==
      canonicalJson(expectedEvidence.environment)
    )
      fail(
        "evidence environment profile does not match the locked browser profile",
      );
    const actualRoot = sha256(canonicalJson(evidence.leaves));
    if (evidence.coverageRoot !== actualRoot)
      fail("evidence coverage root does not match its canonical leaf manifest");
    if (evidence.coverageRoot !== expectedEvidence.coverageRoot)
      fail(
        "evidence coverage root does not match the independently reconstructed required manifest",
      );
  }

  const skips = receipt.skips ?? [];
  for (const skip of skips)
    if (!allowedSkips.includes(skip.gate))
      fail(
        `gate \`${skip.gate}\` was deliberately skipped (${skip.reason ?? "no reason recorded"}) — ` +
          "a recorded skip needs MK acknowledgement, it is not self-clearing",
      );

  return { problems };
}
