# Mandate & gap audit — audit epic #31, session 4

Written 2026-09-09 by the session-3 orchestrator. Supersedes `HANDOFF-SESSION-2.md` and
`HOLD-STATE.md`, both of which describe a verification topology that **no longer exists**.
Repo `/Users/mk/projects/vegastack-design`; ops dir `/Users/mk/projects/vegastack-design-audit-ops`
(`$OPS`). `origin/main` = **`c40cc68d`**.

---

## 0. The one thing to internalise first

**The verification rebuild (WP0–WP6) is fully merged.** Between 2026-09-08 20:00 and 2026-09-09 the
following landed on `main`: WP0 #68, WP1 #69, WP2 #71, WP4 #70, WP5 #77, WP3 #78, WP6 #79, plus the
geometry-defect ledger #80. That deleted the machinery every earlier brief was written against.

**Gone, verified absent from `main`:** `pnpm gates:*` · `.gates/` and `receipt.json` ·
`.husky/pre-push` · `receipt-guard` · `apps/docs/vrt/` · `contracts-run.mjs` · `classify-change.mjs`
· `lib/route-scope.mjs` · `vrt-review.mjs` · `verify-gate-receipt*.mjs` · `gate-receipt-carry.mjs` ·
`runner-diagnostics.yml` · the `gates` skill.

**The ladder now (AGENTS.md § Verification — three loops):**

```bash
pnpm check:component <name>   # ~10s   design-lint · typecheck · that one component's test
pnpm verify                   # ~2m Mac · ~2m50 Linux runner · ~1m40 macOS static half
pnpm verify:release           # ~7m    deploy-only extras on top of verify
pnpm run clean                # report only; --after-run / --weekly reclaim
```

`pnpm verify` = typecheck → lint → `design:verify` → the `@vegastack/ui` browser suite (unit, axe,
geometry contracts) + `@vegastack/design` CLI node tests, through turbo. **It is byte-for-byte what
CI runs**, so a green local run and a green check are the same evidence. It ends with
`workspace-clean.mjs --after-run` on pass, fail or interrupt, preserving the exit code.

**Consequences you must act on, not just know:**

- **No receipts. No remote sweeps. No merge train.** A PR needs: rebase → `pnpm verify` → push →
  green CI. Rebases are now cheap.
- **`$OPS/remote-gates-v2.sh`, `-v3.sh`, `-v4.sh` are DEAD** — they invoke `pnpm gates:push`.
  Do not use them for verification. (v4's ssh/rsync plumbing is still a fine way to run the _audit
  probes_ on a box; see §2.)
- **19 of the 23 files in `$OPS/briefs/` reference dead commands** (`gates:push`, receipts, the
  train): `_common.md`, `conductor.md`, `finish-after-f2.md`, `resume-after-429.md`, `fix-round.md`,
  `d1.md`, `d2.md`, `d3.md`, `m2.md`, `o2.md`, `p1.md`, `mk1.md`, `i1-fix.md`, `f2-finish.md`,
  `do1a-fix.md`, `g1b.md`, and others. **Their BATCH SCOPE is still valid and authoritative; their
  VERIFICATION SECTIONS are not.** Rewrite `_common.md` first (§5.1), then treat each batch brief as
  scope-only.
- **`briefs/g1b.md` was written for the post-rebuild world** and is the one brief that is current.

---

## 1. The five boxes — real state, and the throughput gap

| alias  | IP            | user     | GitHub Actions runner          | role today      |
| ------ | ------------- | -------- | ------------------------------ | --------------- |
| gates  | 192.168.88.75 | admin-05 | **`vsk-node-05` online, idle** | CI `verify`     |
| gates2 | 192.168.88.77 | admin-07 | **`vsk-node-07` online, idle** | CI `verify`     |
| gates3 | 192.168.88.71 | admin-01 | **NOT ENROLLED**               | ssh only — idle |
| gates4 | 192.168.88.76 | admin-06 | **NOT ENROLLED**               | ssh only — idle |
| gates5 | 192.168.88.78 | admin-08 | **NOT ENROLLED**               | ssh only — idle |

SSH aliases are in `~/.ssh/config`, key `~/.ssh/id_ed25519_gates`, passwordless sudo via
`/etc/sudoers.d/agent`. All five: Debian 13, Ryzen 12 threads, 14 GB, Node 24 + pnpm 11.7.0 in
`/usr/local`, Playwright with chromium/firefox/**webkit**.

**THE GAP, and the first job of session 4.** `ci.yml`'s `verify` job runs
`runs-on: [self-hosted, linux, vsk-runner]` inside `mcr.microsoft.com/playwright:v1.61.0-noble`.
Only two runners carry that label, so **CI verifies two PRs at a time**. With 13 batches to land
that is the binding constraint on the whole remaining epic.

**Enrol gates3, gates4 and gates5 as runners before landing batches.** The contract is committed and
idempotent: `tooling/runner/provision-linux-runner.sh`, procedure in
`docs/runbooks/ci-runner-provisioning-linux.md`. Re-running it is safe — it converges Docker, the
runner tarball, registration and the systemd service, and never prints the registration token.
Acceptance: `gh api repos/vegastack/vegastack-design/actions/runners` lists five `online` runners
with `self-hosted,Linux,X64,vsk-runner`, and five PRs verify concurrently. Expected payoff: CI
throughput 2 → 5, roughly 2.5× on the critical path.

**What still runs over plain SSH (not as a runner).** The audit probes survived WP3 and live in
`docs/audits/2026-09-07-system-audit/`: `probe-states.mjs`, `probe-overlays.mjs`,
`probe-forced-colors.mjs`, `capture.mjs`, `graph.mjs`, `histogram.mjs`. They
`await import("playwright")` and `chromium.launch()` directly, using the root `playwright` 1.61.0
dependency — they are NOT part of `pnpm verify` and no CI job runs them. The end round needs them
(both-theme state probe, hover sweep, pixel/appearance review). Run them on gates3/4/5 over ssh; the
rsync-and-run plumbing in `$OPS/remote-gates-v4.sh` still works for that if you replace the command.

**The Mac may now run `pnpm verify` locally.** The old "browser lanes NEVER on the Mac" rule existed
because a Playwright contract sweep took 10–15 minutes and there were a dozen of them. The vitest
browser lane is ~43 s and `pnpm verify` is ~2 min. AGENTS.md no longer forbids it and the ladder
assumes it. Keep heavy _probe_ work on the boxes.

---

## 2. What is pending — the complete list

### 2.1 Thirteen batch issues open under epic #31

| batch | issue | PR  | branch @ head                                   | worktree                | state                                                         |
| ----- | ----- | --- | ----------------------------------------------- | ----------------------- | ------------------------------------------------------------- |
| D1    | #34   | #72 | `audit/d1-deps-security-alignment` @ `e0048fb5` | agent-a5fd49c9bbd42c51d | code-complete, was fully green, now CONFLICTING               |
| N1    | #43   | #73 | `audit/n1-navigation-layout` @ `d825c3e9`       | agent-a6c3ffeb17387b333 | code-complete, was green, CONFLICTING                         |
| Mk1   | #47   | #74 | `audit/mk1-marketing-hooks-block` @ `8ce46b35`  | agent-ae544ead6dc75ed97 | code-complete, was green, CONFLICTING                         |
| P1    | #45   | #75 | `audit/p1-pickers-drag` @ `2f237012` (4 dirty)  | agent-af375b32d83b027b2 | code-complete; `verify` had failed on a mini pnpm-cache flake |
| C1    | #44   | #76 | `audit/c1-composition-feedback` @ `b8b99f88`    | agent-a64707371ec7a2b11 | code-complete; full sweep passed all lanes before the hold    |
| M1    | #35   | #65 | `audit/m1-media-players` @ `f37526bc`           | agent-a26bd900144579794 | code-complete, stale base, CONFLICTING                        |
| M2    | #36   | #64 | `audit/m2-rich-text-toolbars` @ `99eb86dc` (1)  | agent-a9f466c472f35938e | code-complete, stale base, CONFLICTING                        |
| T1    | #37   | #61 | `audit/t1-tables-grids` @ `ee10c7c5`            | agent-a5ece1ab2a22fb18b | code-complete, stale base, CONFLICTING                        |
| Fo1   | #39   | #67 | `audit/fo1-forms` @ `598af830`                  | agent-adb77e930818ebe32 | code-complete, stale base, CONFLICTING                        |
| O2    | #41   | —   | `audit/o2-toasts` @ `c21f53b0` (1 dirty)        | agent-a89ebf2958f1d7aa3 | agent stopped MID-SWEEP; **verify scope before shipping**     |
| D2    | #50   | —   | `audit/d2-deps-fumadocs-lucide` @ `ea8f3bd9`    | agent-d2                | 18 commits; contains D1's commits until D1 merges             |
| D3    | #51   | —   | not started (`briefs/d3.md`)                    | —                       | four sub-PRs; **D3-4 opens a PR and STOPS** (MK)              |
| G1-b  | #49   | —   | not started (`briefs/g1b.md` — current)         | —                       | re-scoped for the post-rebuild world                          |

Nine of these were green under the old topology. **That evidence is void** — it was produced against
a tree with `apps/docs/vrt/` and a receipt. Each needs a fresh `pnpm verify` after rebasing.

### 2.2 Do1-b — a tracking gap

**Issue #48 is CLOSED but only Do1-a shipped.** Do1-b was never started and has no open issue:
page-canon migration of all pages, removing the `AutoTypeTable: ApiTable` alias and the
slug-inferred `registry`, and extended content-lint. **WP6 rewrote AGENTS.md § Docs authoring and
moved the page canon into `design.md` § Docs canon**, so Do1-b's scope must be re-derived against
that before it is reopened. Open a fresh issue rather than reopening #48.

### 2.3 Resolved since the last handoff — do not redo

- **G1-a #53 is CLOSED.** TG-07 landed (`tooling/lib/fs.mjs` exists) and TG-08's transition-pairing
  rule is in `tooling/design-lint.mjs` (`checkTransitionPairing`). This Needs-MK item is settled.
- The entire rebuild WP0–WP6.

### 2.4 Open quality debt

- **15 geometry-lane defects**, recorded in `docs/ledger/bugs.md` (2026-09-09) and carried as an
  `EXCLUDED` map in `packages/ui/test/geometry.browser.test.tsx`. They are REAL 24 px / reflow
  failures, excluded with a measurement each, and the lane re-executes every exclusion in
  expect-failure mode so a stale exemption fails closed. Examples: breadcrumb collapsed/ellipsis/
  trail triggers at **20.00×20.00**; `scrollFadeEdge`/`scrollFadeSize` reflow **332 > 320**;
  date-picker caption dropdown **50.36×21.00**; `iconText` truncation trigger **206.00×21.00**.
  **This is an MK triage queue and is not assigned to any batch.** Decide: fix in the owning batch,
  spin a new batch, or accept with rationale.
- **Focus-indicator coverage no longer exists.** WP3 deleted the forced-colors check that had been
  unable to fail since 2026-07-25. Nothing replaces it, while AGENTS.md § Build rules still promises
  a visible `:focus-visible` as a WCAG 2.2 AA commitment. Options in `briefs/g1b.md`; recommendation
  is a real assertion in the geometry lane. **Needs MK.**
- **`briefs/fix-round.md`** holds review findings routed to batches that the end round must
  re-verify. Its verification instructions are stale; its findings are not.
- **Needs-MK items 1–22** on the board (`EXECUTION.md` § Needs MK), minus the G1-a one now settled.

### 2.5 Release path, untouched and MK-gated

- **Version PR #56 is CONFLICTING across 100 files, and `main` carries 80 pending changesets.**
  WP5 changed how the release entry is assembled (`tooling/changelog-assemble.mjs` now runs inside
  `pnpm version-packages` before `changeset version`). **#56 predates that and should almost
  certainly be closed and left to regenerate** from a release run after the batches land — confirm
  with MK, never merge it.
- npm publish: MK only. Deploy dispatch: MK only.

### 2.6 Hygiene

- **55 GB in `.claude/worktrees/`, 20 worktrees.** Eight belong to already-merged batches and can be
  removed after confirming nothing uncommitted: `audit/o1-overlays`, `di1-display-leaves`,
  `do1a-docs-chrome-export`, `t2-chips-announcer`, `i1-icons-factory`, `f2-button-variant-tone`,
  `f1-docfix`, `f1-surface-tokens`, plus `g1a-gate-fixes` (1 dirty file — inspect first; #53 closed).
- A stale stash entry exists from an unrelated old branch — leave it; the stash is shared across
  worktrees and other sessions.
- Dirty worktrees to inspect before use: P1 (4), O2 (1), M2 (1), G1-a (1), F1 (1).

---

## 3. Approval boundaries (unchanged)

**Pre-approved:** opening PRs; merging a batch PR after green CI in which the verification job
actually executed (`gh run view <id> --json jobs` — check `steps` counts, not just conclusion);
`gh pr merge --squash --delete-branch`; enrolling gates3/4/5 as runners.

**NOT approved without an explicit MK "yes" for that step:** any npm publish · merging Version PR
#56 or closing it · any `deploy.yml` dispatch · merging D3-4 · any new sanctioned dependency
exception · changing Cloudflare Access.

Anything uncovered → a "Needs MK" line on the board with options and a recommendation, then keep
building. Never re-open a locked decision to work around a blocker.

## 4. Standing process instructions from MK

Production-grade; **no backward compatibility, no deprecation shims, no "kept for safety" aliases**
(the F1 `secondary/muted/accent/sidebar-*` token aliases are the one decided exception).
Sub-agents on **Opus 5, high reasoning**. **Dev first, one consolidated verification round at the
end.** Merge batch PRs on green CI without a per-batch reviewer. Codex is rate-limited until
**2026-09-15** → use independent Opus reviewers with an adversarial checklist. Parallelise
aggressively. Keep the board current and give honest effort-weighted percentages when asked.
Never assume library behaviour from memory — read the installed version's docs and cite URLs in PR
bodies. Every decision in `00-decisions.md` (D1–D30, DD-1–5, TD-1–7) is FINAL.

## 5. The work, in order

### 5.1 Before any batch — three prerequisites

1. **Enrol gates3/4/5** (§1). This is the throughput unlock; do it first.
2. **Rewrite `$OPS/briefs/_common.md`** for the post-rebuild world: delete the receipt flow, the
   `HUSKY=0` push rule, the remote-sweep section and the merge-chain rule; replace with
   rebase → `pnpm verify` → push → green CI. **Keep** the two sections added 2026-09-09: the
   take-main's-side rebase trap, and the per-PR artefact rules. Add: per PR the only changelog
   artefact is a **changeset with exactly one section marker** (`tooling/changeset-lint.mjs`) —
   nobody hand-edits `/CHANGELOG.md` any more (WP5), and `design.md` / skills / ledgers / AGENTS.md
   now belong in a **separate wave PR that touches nothing else** (AGENTS.md § Verification).
3. **Prune the eight merged-batch worktrees** (§2.6) to reclaim ~20 GB before running five parallel
   verifies.

### 5.2 Land the nine ready batches — five at a time

Order does not matter much now that WP4 ungitted the derived docs files; conflicts remain only on
`apps/docs/public/r/*.json`, `packages/ui/component-contracts.json` and AGENTS.md § Numbers.
Suggested: **D1 → M1 → T1 → Fo1 → M2 → N1 → Mk1 → C1 → P1** (D1 first because D2 stacks on it and
because its Base UI 1.8 bump makes O1's Drawer/Tooltip findings re-verifiable).

Per batch: rebase onto `origin/main` → resolve at the root (regenerate, never hand-merge; run
`git log --oneline origin/main..HEAD -- <file>` before taking either side) → `pnpm verify` locally →
push → open/update PR → merge on green CI → **the next branch rebases onto the new `main`**.

### 5.3 Then, in dependency order

O2 (verify its scope first) · **D2** — must rebase `--onto origin/main 203b2229`, NOT onto D1's
current head `e0048fb5` (D1 rebased twice; the old object still exists) · D3-1…4 (`briefs/d3.md`,
**D3-4 stops before merge**) · Do1-b (new issue, re-scoped per §2.2) · G1-b (`briefs/g1b.md`).

### 5.4 The consolidated end round

Area-partitioned **Opus** reviewer agents with an adversarial checklist (no Codex until 09-15) →
fix pass over `briefs/fix-round.md` → full `pnpm verify && pnpm verify:release` → both-theme state
probe and hover sweep on a box (§1) → counts scan (`node $OPS/counts.mjs <repoRoot>`) → appearance
review of the items the ledger flags → record the round in `docs/ledger/codex-rounds.md`, `bugs.md`,
`operator-review.md` → **final report to MK**: merged PRs, the 15 geometry defects with a
recommendation each, Version PR #56's disposition, deploy awaiting dispatch, every Needs-MK item,
and everything deliberately left out.

## 6. Agent protocol

Launch with the `Agent` tool, `model: opus`, prompt = a pointer to `$OPS/briefs/<batch>.md` plus the
exact worktree/branch/head and known state. **Briefs are scope-only now — put the verification
procedure in the prompt.**

- A "completed" notification whose text says waiting/polling/continuing is a **yield**; the agent
  re-wakes. **Never relaunch on a yield.** `status: failed` or a process restart is terminal.
- **There is no `SendMessage` for subagents in this build.** You cannot correct a running agent —
  only `TaskStop` it. Put everything it needs in the launch prompt.
- Keep ≤ ~8 concurrent Opus agents; stagger launches. Opus session limits killed every agent four
  times during this epic.
- Bash foreground limit 10 min → `run_in_background` plus an `until … sleep` poll loop.
- **Before adopting work another session may own**, run `mcp__ccd_session_mgmt__list_sessions` for a
  live peer in the same cwd and `gh pr list` for its branches. Worktree state alone NEVER establishes
  abandonment — this session wrongly concluded the rebuild was dead and launched a duplicate.
- **Never edit a script in place while agents are executing it** — bash reads by byte offset. Write a
  new path.
- Board: edit `$OPS/board-wt/docs/audits/2026-09-07-system-audit/EXECUTION.md`, push with
  `$OPS/board-push.sh "<subject>"` (already updated for the post-rebuild world: prettier → commit →
  push, no gates). Comment on epic #31 after each wave.

## 7. Known flakes — recognise, do not chase

`relative-time` 320 px / target-floor race (the fixture re-renders on its own clock) · Vite
dep-optimizer storm on a cold worktree (`Cannot read properties of null (reading 'useState')` /
`Cannot connect to the iframe`) — re-run once · `ERR_INSUFFICIENT_RESOURCES` / `Page crashed` under
box load > 20 · **the mac minis' shared `setup-pnpm` cache is mutated by concurrent jobs**
(`MODULE_NOT_FOUND … pnpm/dist/worker.js`, `ENOTEMPTY`) — this hit both D1 and P1; re-run the failed
job only · `verify-shadcn-consume` needs network access to `ui.shadcn.com`.

---

## 8. Branch-and-loss audit (2026-09-09) — nothing of MK's release/infra work is lost

Checked every local branch, every remote branch, the stash, and every worktree.

### 8.1 MK's parallel release / infra work — **all of it is on `main`**

| local branch                          | status                                                       |
| ------------------------------------- | ------------------------------------------------------------ |
| `feat/self-hosted-npm-release`        | **merged as PR #27** (`65a85e7b`)                            |
| `fix/release-no-artifact-storage`     | **merged as PR #29** (`148a700e`) — patch-id match confirmed |
| `fix/deploy-no-artifact-storage`      | **merged as PR #30** (`b2a5322c`)                            |
| `feat/audio-player-transport-refresh` | merged; tree identical to `main`                             |
| `feat/crm-commissioned-components`    | merged; tree identical to `main`                             |

`git cherry` reports `+` for several of these commits, which looks alarming and is a **false
positive**: squash merges rewrite patch-ids, so only the 1-commit branch (#29) matches by patch-id.
The reliable evidence is that all three squash commits are in `main`'s history, and the one content
item that could have gone missing — the changelog link fix `22741a6 → 43eb359` — is verified present
on `main` (`43eb359` appears once, `22741a6` zero times).

Subsequent divergence between these branches and `main` is `main` moving ahead: WP2/WP5/WP6 rewrote
`release.yml`, `deploy.yml`, `docs/RELEASING.md` and the `ship` skill wholesale. **Do not
cherry-pick anything from these branches into the current tree** — you would reintroduce the
pre-rebuild release topology. They are safe to delete once MK confirms; they carry no unique work.

The two later commits on `feat/self-hosted-npm-release` (`ci: target vsk-runners-mac (live)` and its
`Revert`) net to zero, and `chore: re-trigger CI` is a no-op.

### 8.2 Scratch / backup branches — local-only, keep for now

`fo1-backup-preRebase` (pre-rebase safety copy of Fo1 — keep until Fo1 merges) ·
`mk1-f2based` (superseded by `audit/mk1-marketing-hooks-block`) · `g1a-fixes-local` and `review/g1a`
(G1-a work; **PR #53 was closed unmerged by decision**, carrying only TG-07 and TG-08, both now
confirmed on `main` — `tooling/lib/fs.mjs` exists and `checkTransitionPairing` is in
`design-lint.mjs`). G1-a's remaining ~13 commits are deliberately dropped, and they are **also
pushed** as `origin/audit/g1a-gate-fixes`, so they stay recoverable even if the local branches go.

`origin/mk1-remote` is a stale earlier push of Mk1; PR #74 tracks
`audit/mk1-marketing-hooks-block`. Delete after Mk1 merges.

### 8.3 The stash — safe to drop

`stash@{0}` on `fix/deploy-no-artifact-storage` contains only `.gates/push.json` lane-timing numbers.
`.gates/` no longer exists. It carries nothing. **Do not use bare `git stash pop`** — the stash is
shared across all worktrees and other sessions may be using it; drop it explicitly by SHA if MK
agrees.

### 8.4 Uncommitted work in worktrees

P1 (4 files), O2 (1), M2 (1), G1-a (1), F1 (1). Inspect each with `git status` + `git diff` before
reusing that worktree; O2's is the only one whose agent was interrupted mid-task.

### 8.5 **Environment gotcha that caused real confusion today**

**The repo's fetch refspec is `+refs/heads/main:refs/remotes/origin/main` — main only.** Plain
`git fetch origin` does NOT update `origin/<anything-else>`, in the main checkout or in any worktree.
Consequences: `origin/<branch>` reads stale, `--force-with-lease` needs the explicit
`--force-with-lease=<branch>:<sha>` form with a sha you looked up, and PR mergeability read from a
local ref can be wrong. Use:

```bash
git fetch origin '+refs/heads/*:refs/remotes/origin/*'      # refresh everything
gh api repos/vegastack/vegastack-design/branches/<branch> --jq .commit.sha   # the truth
```

The board worktree additionally had its **upstream misconfigured to `origin/main`**, so
`git push` from it targeted `main`. Fixed 2026-09-09 by pushing explicitly with
`git push origin HEAD:audit/execution-board`; the tracking config could not be set because of the
refspec above. **Always push the board with the explicit refspec form.** One board commit
(`a90b19d6`) was found unpushed and has been pushed; the board is now current on GitHub.

### 8.6 `$OPS` is NOT a git repository

`/Users/mk/projects/vegastack-design-audit-ops/` — this mandate, every brief, the board worktree
config, `counts.mjs`, `onboard-box.sh`, the runner scripts — is **plain local files with no backup**.
Losing the machine loses the whole orchestration toolkit. Recommend to MK: `git init` it and push it
to a private repo, or move the briefs into `docs/audits/2026-09-07-system-audit/briefs/` in the main
repo where they are versioned. **Needs MK.**
