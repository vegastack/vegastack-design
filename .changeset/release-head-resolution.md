---
"@vegastack/ui": patch
---

🛠 The Version PR head is read from REST and the exact-SHA comparison retries.

`gh pr view --json headRefOid` served a stale head for minutes on release run 35763347504 — the
branch ref was already at `49486dab0` while the PR API still reported `6a359a602`. The comparison
against the branch ref had no retry of its own (only the PR lookup above it did), so a Version PR
that had been generated correctly was left behind a red run.

The head now comes from `repos/{owner}/{repo}/pulls/{n}` (REST answered correctly and immediately
throughout that incident) and the comparison retries on the same bounded schedule. The check itself
is unchanged: two genuinely different shas still fail, because that comparison is the exact-SHA
protection boundary.

The negative harness gained the mutation that boundary never had — replacing the branch-ref lookup
with the PR's own head, making the comparison vacuous. 36/36 rejected.

Both reads now tolerate a failing call, because under `set -e` a transient `gh api` error aborted
the step at the command substitution before the retry could do anything, with no message at all.
An empty read never compares equal, so it falls through to the same bounded retry.
