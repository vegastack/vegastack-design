#!/usr/bin/env node
// Carry the gate receipt across a version bump.
//
// THE PROBLEM THIS SOLVES
//   A receipt is bound to a tree hash. `changeset version` + `version-sync` move that hash — package
//   versions, package CHANGELOGs, consumed changesets, and a re-stamped provenance header in 1082
//   files — while changing no code any browser gate could observe. Dated measurement on the real
//   `Version Packages (#1)` commit: tree 77a346c0 → 1b5796df.
//
//   Without this, every Version PR would fail `receipt-guard`, `quality-gate` would never run, and no
//   npm publish could ever happen. And it is unfixable by re-running the gates: that branch is
//   authored by the changesets bot, and the browser lanes cannot run in CI at all — the mac minis
//   cannot launch a browser.
//
// WHY IT IS NOT A LOOPHOLE
//   It rewrites only the receipt's tree-bound facts (`tree`, `treeFiles`, and `contractSha256`),
//   records `carriedFrom` and `carryReason`, and refuses outright unless `versionBumpOnly()` proves
//   every difference between the two trees is version churn. The guard then RE-DERIVES that same
//   proof from git before accepting the carry — so this tool cannot grant anything the guard will
//   not independently confirm. A carried receipt still attests browser results measured against
//   real code; only version strings and their derived hashes moved underneath it.
//
// WHERE IT RUNS
//   Inside `pnpm run version-packages`, after `changeset version` and `version-sync`, and therefore
//   before `changesets/action` commits the branch — which is the only point at which the post-bump
//   tree exists and is not yet committed.

import {
  resolveCommit,
  versionBumpOnly,
  workingTreeContentHash,
} from "./lib/change-set.mjs";
import {
  contractSha256,
  readReceipt,
  RECEIPT_REPO_PATH,
  SCHEMA,
  writeReceiptFile,
} from "./lib/gate-receipt.mjs";
import { buildEvidenceManifest } from "./lib/gate-profile.mjs";

const CARRY_REASON = "version-bump";

const usage = `Usage: node tooling/gate-receipt-carry.mjs

Carry the current gate receipt across an independently rederived pure version bump. The command
refuses any substantive, untracked, malformed, ambiguous, or schema-mismatched change. It is only
valid inside version-packages after changeset version and version-sync.`;
const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.includes("-h")) {
  console.log(usage);
  process.exit(0);
}
if (argv.length > 0) {
  console.error(`gate-receipt-carry: unknown option ${argv[0]}\n\n${usage}`);
  process.exit(2);
}

function fatal(message) {
  console.error(`gate-receipt-carry: ${message}`);
  process.exit(1);
}

const receipt = readReceipt();
if (receipt.__unreadable)
  fatal(
    `no usable receipt at ${RECEIPT_REPO_PATH} (${receipt.__unreadable}). The commit this Version PR ` +
      "is based on must carry one — that is what is being carried forward.",
  );
if (receipt.schema !== SCHEMA)
  fatal(
    `receipt schema ${receipt.schema ?? "(none)"} cannot be carried by schema ${SCHEMA}; run a fresh full gate before versioning`,
  );

const previousTree = receipt.tree;
if (typeof previousTree !== "string" || !previousTree.startsWith("tree-"))
  fatal(`the existing receipt records no usable tree hash: ${previousTree}`);

const { hash: currentTree, files } = workingTreeContentHash();

if (currentTree === previousTree) {
  console.log(
    `gate-receipt-carry: tree unchanged (${currentTree}) — nothing to carry.`,
  );
  process.exit(0);
}

// The whole point: prove the move was version churn before rewriting anything.
//
// Proven against the COMMIT this bump is based on, not against the receipt's tree hash. That hash
// names a DANGLING tree — `workingTreeContentHash()` builds it through a throwaway index, so it is
// never pushed and does not exist on any other machine. The guard on a runner died with
// `fatal: bad object` when it tried (release run 30168750521). A commit is reachable everywhere.
const baseCommit = resolveCommit("HEAD");
if (!baseCommit)
  fatal(
    "HEAD does not resolve to a commit, so there is nothing to prove the carry against",
  );
const proof = versionBumpOnly(baseCommit, null);
if (!proof.ok) {
  console.error(
    `gate-receipt-carry: REFUSING to carry the receipt.\n` +
      `  from ${previousTree}\n    to ${currentTree}\n` +
      `  ${proof.offenders.length} difference(s) are not version churn, e.g.:`,
  );
  for (const offender of proof.offenders.slice(0, 5))
    console.error(
      `    ${offender.file}\n      ${String(offender.line).slice(0, 160)}`,
    );
  console.error(
    "\n  A receipt may only be carried across a pure version bump. Something else changed in this\n" +
      "  tree, so the browser gates have to run against it — `pnpm gates:push`.",
  );
  process.exit(1);
}

const currentContractSha = contractSha256();
const priorExecutedTrees = new Set(
  (receipt.evidence?.leaves ?? []).map((leaf) => leaf.executedOnTree),
);
if (priorExecutedTrees.size > 1)
  fatal(
    "the receipt evidence does not name one unambiguous executed tree; refusing to carry it",
  );
const executedOnTree = [...priorExecutedTrees][0] ?? previousTree;
const evidence = buildEvidenceManifest({
  profile: receipt.profile,
  required: receipt.classified ?? {},
  contractRoutes: receipt.gates?.contracts?.routes ?? [],
  tree: currentTree,
  executedOnTree,
  toolchain: receipt.toolchain,
  contractSha256: currentContractSha,
  passedGates: Object.entries(receipt.gates ?? {})
    .filter(([, entry]) => entry.status === "pass")
    .map(([name]) => name),
});

writeReceiptFile({
  ...receipt,
  tree: currentTree,
  treeFiles: files,
  head: resolveCommit("HEAD"),
  carriedFrom: previousTree,
  carriedFromCommit: baseCommit,
  carryReason: CARRY_REASON,
  carriedAt: new Date().toISOString(),
  evidence,
  // version-sync rewrites dependency ranges in component-contracts.json. That moves the authority
  // hash without changing inventory or browser-observable code, and design:derived stamps the new
  // hash into its generated surfaces. Carry the current authority fact only AFTER the version-only
  // proof above succeeds; a real code change never reaches this write.
  contractSha256: currentContractSha,
});

console.log(
  `gate-receipt-carry: carried the receipt across a version bump\n` +
    `  from ${previousTree}\n    to ${currentTree}\n` +
    `  ${proof.files} changed file(s), all version churn — the guard will re-derive this proof.`,
);
