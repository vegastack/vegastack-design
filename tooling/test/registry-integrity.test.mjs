// Proof that the registry integrity check is ALIVE — that it fails when an item's whole-item
// SHA-256 no longer matches its content.
//
// `tooling/verify-registry-integrity-negative.mjs` already carries in-process tamper probes, but
// those probe a `structuredClone` of an item held in memory. They therefore prove the hashing
// FUNCTION rejects a mutation; they cannot prove the verifier rejects a mutation that is actually on
// disk, in the file a consumer would fetch. The distinction matters because `meta.integrity` is the
// only thing standing between `shadcn add @vegastack/<item>` and arbitrary content: a check that
// reads the tampered value and re-derives the hash from the tampered file agrees with itself
// forever.
//
// So this tampers the real artifact, runs the real verifier as a subprocess, and requires a non-zero
// exit. The original bytes are restored in a `finally` and the restoration is re-read and asserted —
// a test that can leave a corrupted registry JSON behind would be worse than no test.
//
// IT MUTATES A TRACKED FILE, AND THAT COSTS TWO RESIDUALS. State them rather than imply they are
// covered:
//
//   1. SIGKILL (or a power loss) between the write and the `finally` leaves
//      `apps/docs/public/r/button.json` corrupted in the working tree. `git checkout --
//      apps/docs/public/r/button.json` restores it, and the next `pnpm verify` fails loudly rather
//      than silently — the corruption is a one-character digest edit that the verifier is built to
//      catch — so the failure mode is a confusing red run, never a bad artifact reaching a consumer.
//   2. Concurrency: two `pnpm lint` runs over the SAME working tree at once can interleave the
//      tamper and the restore. Nothing in this repository runs the suite twice against one tree —
//      each CI job and each agent gets its own checkout or worktree — so this is a hazard of a
//      practice we do not have, not a live defect.
//
// The alternative — copy the item to a temp dir and point the verifier at the copy — is not
// available: `tooling/verify-registry-integrity-negative.mjs` hard-codes `apps/docs/public/r`
// relative to the repository root and accepts no path argument, and adding one purely for this test
// would widen a fail-closed verifier's surface to make a test tidier. Rejected deliberately.

import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const VERIFIER = join(ROOT, "tooling/verify-registry-integrity-negative.mjs");
const ITEM = join(ROOT, "apps/docs/public/r/button.json");

function runVerifier() {
  return spawnSync("node", [VERIFIER], { cwd: ROOT, encoding: "utf8" });
}

describe("registry item integrity", () => {
  it("passes over the committed registry", () => {
    const result = runVerifier();
    expect(result.stderr + result.stdout).not.toMatch(/failed/i);
    expect(result.status).toBe(0);
  });

  it("fails when an item's meta.integrity is tampered on disk", () => {
    const original = readFileSync(ITEM);
    const item = JSON.parse(original.toString("utf8"));
    expect(item.meta?.integrity).toMatch(/^sha256-[A-Za-z0-9+/]{43}=$/);

    try {
      // One base64 character of the digest. Nothing else about the file changes — not its
      // content, not its dependency list, not the manifest — so only a check that RE-DERIVES the
      // hash from the file can notice.
      item.meta.integrity = item.meta.integrity.replace(
        /^(sha256-)(.)/,
        (_, prefix, c) => `${prefix}${c === "A" ? "B" : "A"}`,
      );
      writeFileSync(ITEM, `${JSON.stringify(item, null, 2)}\n`);

      const result = runVerifier();
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(
        /button: positive integrity verification failed/,
      );
    } finally {
      writeFileSync(ITEM, original);
    }

    // The restoration is proven, not assumed: `git diff --quiet` exits non-zero on any difference.
    expect(() =>
      execFileSync(
        "git",
        ["diff", "--quiet", "--", "apps/docs/public/r/button.json"],
        {
          cwd: ROOT,
        },
      ),
    ).not.toThrow();
  });
});
