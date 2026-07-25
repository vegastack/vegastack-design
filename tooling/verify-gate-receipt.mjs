#!/usr/bin/env node
// The receipt guard. Runs in CI, on the free mac minis, and is the only thing standing between the
// browser gates having run and being assumed to have run.
//
// WHAT IT CHECKS
//   That `.gates/receipt.json` describes THIS tree, on the pinned Playwright, with every gate the
//   change class requires present and passing, and no unacknowledged skips.
//
// WHAT IT CANNOT CHECK
//   That the receipt is honest. See tooling/lib/gate-receipt.mjs — this is attestation, not proof.
//   CI independently re-executes every non-browser gate, so the receipt is load-bearing only for the
//   four browser lanes.
//
// USAGE
//   node tooling/verify-gate-receipt.mjs                       # classify from origin/main → HEAD
//   node tooling/verify-gate-receipt.mjs --contracts true --unit true --smoke false
//   node tooling/verify-gate-receipt.mjs --allow-skip contracts   # MK acknowledgement, one gate

import { execFileSync } from "node:child_process";
import { join } from "node:path";

import { ROOT, workingTreeContentHash } from "./lib/change-set.mjs";
import {
  CONDITIONAL_GATES,
  contractSha256,
  pinnedToolchain,
  readReceipt,
  RECEIPT_REPO_PATH,
  verifyReceipt,
} from "./lib/gate-receipt.mjs";

const USAGE = `Usage: node tooling/verify-gate-receipt.mjs [options]

  --contracts <bool>   require the contracts lane (default: ask tooling/classify-change.mjs)
  --unit <bool>        require the browser-unit lane
  --smoke <bool>       require the cross-engine smoke lane
  --before <ref>       classification range start, when classifying here
  --after <ref>        classification range end
  --allow-skip <gate>  accept a recorded skip for this gate (MK acknowledgement; repeatable)

Exit codes: 0 the receipt covers this tree · 1 it does not · 2 the guard could not run.`;

function fatal(message) {
  console.error(`verify-gate-receipt: ${message}`);
  process.exit(2);
}

const options = {
  required: {},
  before: null,
  after: null,
  allowedSkips: [],
};
const bool = (flag, raw) => {
  if (raw === "true") return true;
  if (raw === "false") return false;
  return fatal(`${flag} takes true or false, got ${JSON.stringify(raw)}`);
};
for (let index = 2; index < process.argv.length; index++) {
  const flag = process.argv[index];
  const value = () => {
    const next = process.argv[++index];
    if (next === undefined) fatal(`${flag} requires a value`);
    return next;
  };
  if (flag === "--contracts") options.required.contracts = bool(flag, value());
  else if (flag === "--unit") options.required.unit = bool(flag, value());
  else if (flag === "--smoke") options.required.smoke = bool(flag, value());
  else if (flag === "--before") options.before = value();
  else if (flag === "--after") options.after = value();
  else if (flag === "--allow-skip") options.allowedSkips.push(value());
  else if (flag === "--help" || flag === "-h") {
    console.log(USAGE);
    process.exit(0);
  } else fatal(`unknown option ${flag}\n\n${USAGE}`);
}

/**
 * Any requirement not supplied is classified here, by the same script the workflows call. A workflow
 * that knows its own push range should pass the flags — on a push to `main` the merge-base of main
 * with itself is main, so classifying locally would see an empty diff and require nothing. That is
 * the one shape of this guard that could silently pass everything, which is why the workflows are
 * wired to pass explicit values.
 */
const unclassified = CONDITIONAL_GATES.filter(
  (gate) => options.required[gate] === undefined,
);
if (unclassified.length > 0) {
  const args = [join(ROOT, "tooling/classify-change.mjs"), "--json"];
  if (options.before) args.push("--before", options.before);
  if (options.after) args.push("--after", options.after);
  let classification;
  try {
    classification = JSON.parse(
      execFileSync("node", args, {
        cwd: ROOT,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      }),
    );
  } catch (error) {
    fatal(
      `classify-change failed, so the requirements are unknown:\n${error.message}`,
    );
  }
  for (const gate of unclassified)
    options.required[gate] = classification[gate] === true;
  console.log(
    `verify-gate-receipt: classified here — ${unclassified
      .map((gate) => `${gate}=${options.required[gate]}`)
      .join(" ")}`,
  );
}

const { hash: treeHash, files } = workingTreeContentHash();
const receipt = readReceipt();
const { problems } = verifyReceipt(receipt, {
  treeHash,
  required: options.required,
  pinned: pinnedToolchain(),
  contractSha: contractSha256(),
  allowedSkips: options.allowedSkips,
});

console.log(`verify-gate-receipt: tree ${treeHash} (${files} files)`);
if (!receipt.__unreadable) {
  console.log(
    `verify-gate-receipt: receipt written ${receipt.writtenAt} on ${receipt.host?.platform}/${receipt.host?.arch} ` +
      `by \`gates ${receipt.mode}\``,
  );
  for (const gate of Object.keys(receipt.gates ?? {}))
    console.log(
      `  ${gate.padEnd(12)} ${receipt.gates[gate].status}` +
        (options.required[gate] === true ? "  (required)" : ""),
    );
}

if (problems.length > 0) {
  console.error(
    `\nverify-gate-receipt: FAIL — ${problems.length} problem(s) with ${RECEIPT_REPO_PATH}:`,
  );
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  console.error(
    "\nThe browser gates run on a developer machine under this topology, so this receipt is the " +
      "only evidence they ran. Re-run `pnpm gates:push` and commit the receipt it writes.",
  );
  process.exit(1);
}

console.log(
  `\n✓ gate receipt covers this tree: every required gate (${
    Object.entries(options.required)
      .filter(([, value]) => value)
      .map(([gate]) => gate)
      .join(", ") || "none beyond the always-required pair"
  }) is present and passing on the pinned Playwright.`,
);
