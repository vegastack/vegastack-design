// The gate receipt: what ran, against exactly which content, on which toolchain.
//
// WHAT IT IS FOR
//   Under the local-first topology (docs/plans/2026-07-25-cicd-local-first-revamp.md, Option A) no
//   GitHub-hosted runner executes a browser gate. CI re-executes the entire non-browser half on the
//   free mac minis and therefore needs no receipt for it. The four browser lanes — the unit suite,
//   the cross-engine smoke, the three-engine suite, and the 768 behaviour contracts — run only on a
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

export const SCHEMA = 1;
export const RECEIPT_PATH = join(ROOT, ".gates/receipt.json");
export const RECEIPT_REPO_PATH = ".gates/receipt.json";

/**
 * Gates the receipt must always carry. These are re-executed by CI anyway, so requiring them buys
 * one specific thing: evidence that the hook ran at all rather than being bypassed.
 */
export const ALWAYS_REQUIRED = ["typecheck", "lint"];

/** Gates required only when the change class calls for them. Every one is a BROWSER lane. */
export const CONDITIONAL_GATES = ["unit", "smoke", "contracts"];

export const ALL_GATES = [...ALWAYS_REQUIRED, ...CONDITIONAL_GATES];

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

  if (typeof receipt.tree !== "string" || receipt.tree.length === 0)
    fail("gate receipt records no tree hash, so it describes nothing");
  else if (receipt.tree !== treeHash)
    fail(
      `gate receipt was produced against tree ${receipt.tree} but this tree is ${treeHash} — ` +
        "the gates ran against different content than is being pushed",
    );

  if (contractSha && receipt.contractSha256 !== contractSha)
    fail(
      `gate receipt records contract SHA-256 ${receipt.contractSha256 ?? "(none)"} but this tree's is ` +
        `${contractSha} — the receipt describes a different component inventory`,
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

  const requiredGates = [
    ...ALWAYS_REQUIRED,
    ...CONDITIONAL_GATES.filter((name) => required[name] === true),
  ];
  for (const name of requiredGates) {
    const entry = gates[name];
    if (!entry) {
      fail(
        `this change requires the \`${name}\` gate and the receipt does not carry it` +
          (CONDITIONAL_GATES.includes(name)
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

  // A contracts entry that passed while executing nothing is the specific fail-open this whole
  // design has to survive: an empty scope reads exactly like a green run.
  if (required.contracts === true) {
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
