# Orchestration briefs — audit epic #31

The task briefs the 2026-09-07 system audit was actually executed from. They lived only on one
laptop, unversioned and unbacked-up, until 2026-09-09; they are here so the record of **how** the
audit was run sits beside the record of **what** it found.

Like everything else under `docs/audits/`, these are **point-in-time records** (AGENTS.md
§ Truth hierarchy). Read them for why a batch was scoped the way it was — never as evidence of
current behaviour, counts, commands, or APIs.

## What is what

- **`_common.md` — the current contract.** Rewritten 2026-09-09 for the post-rebuild world
  (`pnpm verify` is the one gate; the receipt flow, `pnpm gates:*`, the pre-push hook, the remote
  sweep and the merge train are gone). It also carries the rebase traps this epic learned the hard
  way. This is the only file here that describes how work is verified today.
- **`MANDATE-SESSION-4.md`** — the session-4 orchestration mandate: the batch table, the approval
  boundaries, the branch-and-loss audit, and the known flakes.
- **Every per-batch brief (`c1.md`, `d1.md`, `fo1.md`, …) is SCOPE-ONLY.** All of them except
  `g1b.md` were written before the verification rebuild landed, so their verification sections name
  machinery that no longer exists. Their **batch scope is authoritative; their verification
  instructions are superseded by `_common.md`.** `g1b.md` is the one brief written after the
  rebuild.

## Deliberately not imported

The machine-specific shell scripts (`provision-box.sh`, `onboard-box.sh`, `board-push.sh`,
`remote-gates-*.sh`) and the dead handoffs (`HANDOFF-SESSION-2.md`, `HOLD-STATE.md`) describe a
verification topology that was deleted on 2026-09-08. Importing them would version exactly the kind
of stale legacy this repo is trying to stop carrying. The committed, supported equivalents are
`tooling/runner/provision-linux-runner.sh` and `docs/runbooks/`.
