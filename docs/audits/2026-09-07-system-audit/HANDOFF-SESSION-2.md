# Handoff — audit epic #31 orchestration, session 2 → session 3

Written 2026-09-09 01:45 IST by the session-2 orchestrator after a Claude Code process restart killed
every running agent. Everything durable lives in **`/Users/mk/projects/vegastack-design-audit-ops/`**
(`$OPS` below) — the old session scratchpad is gone. Repo: `/Users/mk/projects/vegastack-design`.

## 0. Mandate (unchanged — verbatim intent)

Execute GitHub epic **#31** (issues #32–#51) of the 2026-09-07 audit end to end per
`docs/audits/2026-09-07-system-audit/HANDOFF-PROMPT.md`: production-grade, **no backward compatibility,
no deprecation shims, no "kept for safety" aliases** (only F1's `secondary/muted/accent/sidebar-*` token
aliases stay, by decision). Every decision in `00-decisions.md` (D1–D30, DD-1–5, TD-1–7) is FINAL.
Code, tokens, `design.md`, docs + markdown/agent export, AGENTS.md, CLAUDE.md, all skills
(`skills/internal/**`, `skills/public/**` + `packages/design/skills/**` mirror), changelog and ledgers
must agree per batch. One sub-agent per issue in its own worktree on branch `audit/<key>`. Never assume
library behaviour from memory — read the installed version's docs and cite URLs in PR bodies.

**Approval boundaries.** Pre-approved: opening PRs; merging a batch PR after green CI in which the
verification job actually executed (`gh run view <id> --json jobs`); `gh pr merge --squash --delete-branch`.
**NOT approved: any npm publish (stop at Version PR #56 and report), any `deploy.yml` dispatch, merging
D3-4 (Changesets/pnpm).** Never run the `ship` skill's publish/deploy steps. Anything uncovered → a
"Needs MK" line on the board with options + recommendation, then keep building.

**MK's standing process instructions** (all still in force): sub-agents on **Opus 5, high reasoning**
(orchestrator may be Fable); **dev first, one consolidated verification round at the end**; merge batch
PRs on green CI without a per-batch reviewer; Codex (`gpt-5.6-sol`, high) for background review —
**but Codex is rate-limited until 2026-09-15**, so use independent Opus reviewer agents with an
adversarial checklist instead; parallelise aggressively; **browser lanes NEVER run on the Mac** — use
the LAN boxes; batch tests to the end of each phase; keep the progress table current and give honest
effort-weighted percentages when asked.

## 1. Read first, in this order

1. `docs/audits/2026-09-07-system-audit/HANDOFF-PROMPT.md`, `00-decisions.md`, `EXECUTION.md` (the
   live board — branch `audit/execution-board`, worktree `$OPS/board-wt`).
2. `$OPS/briefs/_common.md` (binding rules for every agent), `finish-after-f2.md` (finisher protocol +
   merge-chain rule), `resume-after-429.md`, `conductor.md`, `fix-round.md` (routed review findings
   the end round must re-verify), then the per-batch briefs (`d2.md`, `d3.md`, `o2.md`, `p1.md`, …).
3. `$OPS/merge-chain.md` — the merge-train state and the conductor's log.
4. **`docs/plans/2026-09-08-verification-rebuild.md`** and memory `verification-rebuild-2026-09-08` —
   a PARALLEL effort (another session, MK-approved) is rewriting the verification topology on `main`
   (§3 below). Read §3.1, §3.4, §3.5, §4 of that plan before touching any gate or CI file.
5. Memory files: `audit-execution-2026-09-07`, `ryzen-gates-boxes`, `subagent-notifications-not-terminal`,
   `mk-dev-first-then-verify`, `mk-subagent-model-preference`, `mk-audit-preferences`.

## 2. State at 01:35 IST, 2026-09-09

`origin/main` = `0935d502` (WP0). Merged audit PRs, in order: F1 #55 `9c33dfaf` · Do1-a #54 `d5c960a3`
· F1 follow-up #59 `065315d5` · F2 #60 `8ce8de4d` · I1 #57 `f1d7d2fb` · Di1 #62 `42aa455b` · T2 #63
`f8ca47ca`. Then the rebuild's WP1 #69 `aded7838` and WP0 #68 `0935d502` landed on top.

| batch                               | issue | PR  | branch @ head (worktree `.claude/worktrees/<name>`)                                                                                              | state                                                                                                                                                                                                                                                   |
| ----------------------------------- | ----- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1 media                            | #35   | #65 | `audit/m1-media-players` @ `f37526bc` (agent-a26bd900144579794)                                                                                  | was green + rebased onto post-T2 main (CI 34232498130); now CONFLICTING again after WP1/WP0 → rebase + `pnpm verify`-style re-run                                                                                                                       |
| M2 rich text                        | #36   | #64 | `audit/m2-rich-text-toolbars` @ `99eb86dc` (agent-a9f466c472f35938e, 1 dirty file)                                                               | CI green on old base; CONFLICTING                                                                                                                                                                                                                       |
| T1 tables                           | #37   | #61 | `audit/t1-tables-grids` @ `ee10c7c5` (agent-a5ece1ab2a22fb18b)                                                                                   | rebased on F2; sweep was running on `gates` when the process died (now a stale process — see §4.4); CONFLICTING                                                                                                                                         |
| Fo1 forms                           | #39   | #67 | `audit/fo1-forms` @ `598af830` (agent-adb77e930818ebe32)                                                                                         | PR opened by the resumed agent; CI state unknown; CONFLICTING                                                                                                                                                                                           |
| O1 overlays                         | #40   | #66 | `audit/o1-overlays` @ `5f330182` (agent-a17ed5bd58558f638, **18 dirty files — mid "regenerate after rebase onto Di1"**; inspect before anything) | PR open; O2 + P1 blocked on it                                                                                                                                                                                                                          |
| N1 navigation                       | #43   | —   | `audit/n1-navigation-layout` @ `6adb44ce` (agent-a6c3ffeb17387b333, 1 dirty)                                                                     | rebased onto post-I1 main; sweep never completed                                                                                                                                                                                                        |
| C1 composition                      | #44   | —   | `audit/c1-composition-feedback` @ `8abec8c6` (agent-a64707371ec7a2b11)                                                                           | sweep was running on `gates2` when the process died (stale)                                                                                                                                                                                             |
| D1 deps                             | #34   | —   | `audit/d1-deps-security-alignment` @ `203b2229` (agent-a5fd49c9bbd42c51d)                                                                        | code complete, statically green, PR body at `$OPS/d1/pr-body.md`; sweep never completed; **D2 stacks on this head**                                                                                                                                     |
| D2 deps                             | #50   | —   | `audit/d2-deps-fumadocs-lucide` @ `ea8f3bd9` (agent-d2), 18 commits incl. "changelog, changeset and ledgers"                                     | agent lost mid-finish; verify scope vs `briefs/d2.md`, then finish; contains D1's commits until D1 merges                                                                                                                                               |
| Mk1 marketing/hooks                 | #47   | —   | `audit/mk1-marketing-hooks-block` @ `8b44e8e0` (agent-ae544ead6dc75ed97)                                                                         | code complete; sweep passed once at an earlier head; needs final sweep + PR                                                                                                                                                                             |
| P1 pickers/drag                     | #45   | —   | `audit/p1-pickers-drag` @ `fdf8c2bd` (agent-af375b32d83b027b2)                                                                                   | code complete on O1's OLD head; PR body at `$OPS/p1-pr-body.md`; waits for O1                                                                                                                                                                           |
| O2 toasts                           | #41   | —   | `audit/o2-toasts` @ `2bf8e1fd` (agent-a89ebf2958f1d7aa3)                                                                                         | on O1's old head; last commit is a test; verify scope vs `briefs/o2.md`; waits for O1                                                                                                                                                                   |
| G1-a gates                          | #49a  | #53 | `audit/g1a-gate-fixes`                                                                                                                           | **the rebuild plan says: close #53 unmerged; carry TG-07 (`tooling/lib/fs.mjs`) + TG-08 (motion pairing) into WP3** — confirm with the rebuild session/MK before closing                                                                                |
| G1-b lint rules                     | #49b  | —   | not started                                                                                                                                      | re-scope after WP2/WP3: keep the 12 design-lint rules, hover-fill-without-active rule, `packages/ui/test` in tsconfig, contract-count derivation, token-reference lint; DROP the receipt/verify-only/worker-cap/contract-lane items the rebuild deletes |
| Do1-b docs                          | #48b  | —   | not started                                                                                                                                      | page-canon migration of all pages, remove `AutoTypeTable: ApiTable` alias + slug-inferred `registry`, `component:new`, extended content-lint; after component batches                                                                                   |
| D3-1…4                              | #51   | —   | not started (`briefs/d3.md`)                                                                                                                     | after D2; D3-4 stops before merge (MK)                                                                                                                                                                                                                  |
| Version Packages                    | —     | #56 | bot                                                                                                                                              | MK's publish gate — never merge                                                                                                                                                                                                                         |
| #22 `codex/cicd-release-efficiency` | —     | #22 | stale                                                                                                                                            | not ours; ignore                                                                                                                                                                                                                                        |

Effort-weighted completion at 01:35: **≈ 60% done / 40% pending** (7 audit PRs merged ≈ 24%; 13 batches
code-complete ≈ 34%; D2 ≈ 2%). Pending: landing 13 batches (~18%), D3/Do1-b/G1-b (~15%), end round (~4%),
plus whatever the rebuild forces.

Needs-MK items 1–19 are on the board (`EXECUTION.md` § Needs MK). Fresh ones this session: #10 test dir
not type-checked, #11 AGENTS.md hover sentence, #13 `:active` on disabled, #14–15 Di1, #16–17 T2,
#18 sweep economics (superseded by the rebuild), #19 M1 API calls.

## 3. The parallel verification rebuild — what it changes for you

Another session is executing `docs/plans/2026-09-08-verification-rebuild.md` (WP0 ✅ #68, WP1 ✅ #69,
WP2–WP6 pending; check `gh pr list --search rebuild/ --state all`). Do not duplicate its work; do
coordinate:

- **WP2** deletes `gates:*`, `.husky/pre-push`, `.gates/`, `receipt-guard`, adds `pnpm verify` /
  `pnpm verify:release`, and CI runs `verify` in the Playwright container on the Linux runners. After
  it merges, **the whole receipt/sweep/train mechanism in the briefs is obsolete**: a PR only needs green
  CI (`verify` on Linux + `verify-macos`). Rebase every audit branch once across WP2 and stop minting
  receipts. Until then, the receipt flow in §4 applies.
- **WP3** deletes the attestation stack incl. `apps/docs/vrt/` (the contract lane) — it is sequenced to
  land AFTER the audit batches on the train. If it lands first, batches simply re-run under `pnpm verify`.
- **WP4** ungits the generated docs files — after it, most of our rebase conflicts disappear.
- **WP5** changelog per version — the per-PR `CHANGELOG.md` obligation in `_common.md` ends; changesets
  remain mandatory.
- **WP6** rewrites AGENTS.md and the skills — Do1-b/G1-b and every batch that edits AGENTS.md must
  rebase across it.
- `gates`/`gates2` (192.168.88.75/.77) are now ALSO GitHub self-hosted runners (`self-hosted,linux,vsk-runner`).
  Sweeps on them compete with CI jobs; prefer gates3/4/5 for sweeps (the runner already does).

## 4. Infrastructure — the boxes and the runner

**Boxes** (Debian 13, Ryzen 12 threads, 14 GB; ssh aliases in `~/.ssh/config`, key
`~/.ssh/id_ed25519_gates`, passwordless sudo via `/etc/sudoers.d/agent`):
`gates` (.75, admin-05) · `gates2` (.77, admin-07) · `gates3` (.71, admin-01) · `gates4` (.76, admin-06)
· `gates5` (.78, admin-08). Each has Node 24 + pnpm 11.7.0 in `/usr/local`, bare mirror
`~/vegastack-design.git` (remote `github` fetches `refs/pull/*/head`), per-worktree clones `~/wt/<name>`,
Playwright with chromium/firefox/**webkit** (WebKit works on Linux; it cannot launch on this Mac).
New box: `bash $OPS/onboard-box.sh <alias> <ip> <user> <password>` (~10 min, ends with an 8/8 `button`
contract acceptance). Never commit IPs/passwords anywhere in the repo.

**Runner** — `bash $OPS/remote-gates-v3.sh <worktree> [--box gatesN] -- <command…>`:
mirrors the worktree's HEAD + `origin/main` to the box (hooks bypassed with `-c core.hooksPath=/dev/null`
— mirrors only, never origin), checks out `~/wt/<basename>`, clears `apps/docs/.next apps/docs/out .turbo`
(stale caches poisoned builds), rsyncs the working tree (excl. `.git node_modules .next out .turbo
.gates .vrt-review .audit`), `pnpm install --frozen-lockfile` on lockfile change, runs the command under
`flock -w 10800 ~/.browser-lane-1.lock`, rsyncs `.gates/ .vrt-review/ .audit/` back, and — for gates
commands — requires `node tooling/verify-gate-receipt.mjs` to pass (exit 3 otherwise). Policy:
**ONE lane per box** (two per box measured 2x slower each + 60% unit-lane flakes); first free of
gates3/4/5/gates/gates2; hashed fallback. Never two runs in one worktree. Never re-dispatch a queued run.
Typical idle timings: typecheck 40 s · lint 20 s · unit+axe 60 s · smoke 30 s · contracts full 110 routes
~580 s (all batches are classified global, so every sweep is the full contract lane).

**Receipt flow (until WP2 merges):** sweep passes → `git add .gates/receipt.json` → commit
`chore(gates): receipt …` → `HUSKY=0 git push --force-with-lease=<branch>:<old-sha> origin <branch>`
(worktrees have a main-only fetch refspec, so the explicit lease form is required; `HUSKY=0` is allowed
ONLY because the receipt was verified remotely) → CI `receipt-guard` + `verify` must both execute green.

**Stacking / merge train:** a squash merge makes every sibling CONFLICTING (generated files, changelog,
§Numbers, ledgers) and a rebase voids the receipt. So the conductor stacks the next PR on the previous
PR's head, sweeps once, and after the predecessor merges does `git rebase --onto origin/main <pred-head>`
→ identical tree → receipt still valid → CI → merge. Procedure: `$OPS/briefs/conductor.md`; state:
`$OPS/merge-chain.md`. Conflict policy: `.gates/receipt.json` theirs; generated files either side then
regenerate (`pnpm registry:build`, `pnpm design:derived`, `pnpm design:sync`, `node tooling/sync-changelog.mjs`);
`CHANGELOG.md`/`bugs.md`/`operator-review.md` keep both sides, main's first; `design.md` doctrine by hand.

**4.4 Stale state to clean first (do this before dispatching anything):**

```bash
for b in gates gates2 gates3 gates4 gates5; do ssh $b 'pkill -f "tooling/gates.mjs push"; pkill -f "flock -w 10800"; pkill -f "contracts-run.mjs"; pkill -f playwright; pkill -f vitest; sleep 1; flock -n ~/.browser-lane-1.lock true && echo "'$b' lane free"'; done
git -C /Users/mk/projects/vegastack-design worktree prune; git -C /Users/mk/projects/vegastack-design worktree list
```

(T1's and C1's sweeps were orphaned on `gates`/`gates2` at 0% CPU when the process died.) Then for every
audit worktree with `dirty>0` (`O1` 18 files, `N1`, `M2`, G1-a, `f1-surface-tokens`) inspect
`git status` + `git diff --stat` before deciding commit vs stash; check `.git/worktrees/<name>/rebase-merge`.

**Known flakes / environmental failures (recognise, don't chase):** `relative-time` 320 px + target-floor
race (fixture re-renders on its own clock; fixed for 320 px in #59, target-floor left to G1-b/WP3);
`provider.test.tsx` toast leaking across tests (fixed at root in D1 `0cc2754`); Vite dep-optimizer storm
on a cold box worktree (unit lane dies with `Cannot read properties of null (reading 'useState')` /
`Cannot connect to the iframe` — re-run); `ERR_INSUFFICIENT_RESOURCES`/`Page crashed` under box load >20;
stale `.next` cache (runner now clears it); `verify-shadcn-consume`/`pnpm lint` need network
(`ui.shadcn.com`). The unit lane failed in 16/25 recorded sweeps — always read the failure before re-running.

**Counts to zero:** `node $OPS/counts.mjs <repoRoot>` (baseline and latest values in the board's Counts
table). Run it on `main` after every merge wave.

## 5. Agent protocol (harness facts that cost hours to learn)

- Launch with `Agent` tool, `model: opus`, prompt = one-liner pointing at `$OPS/briefs/<x>.md` + exact
  worktree/branch/HEAD + known state; briefs on disk so relaunches are cheap.
- A "completed" notification whose text says waiting/polling/continuing is a **yield** — the agent
  re-wakes when its background command finishes. **Never relaunch on a yield.** `status: failed` (429)
  or a process restart is terminal. After an outage relaunch ONLY agents with a failed notice (C1 survived
  one wave; relaunching it made a duplicate that had to be `TaskStop`ped).
- In session 2 there was no `SendMessage` tool; the restart notice says agents can be resumed by id with
  `SendMessage` — check `ToolSearch select:SendMessage` first; if absent, relaunch with `resume-after-429.md`.
- Bash foreground limit 10 min → `run_in_background` + `until … sleep` loops; no chained `sleep`s.
- Rate limits: Opus session limits killed all agents three times (2026-09-07 15:30, 20:40, 01:00; 2026-09-08
  15:50). Keep ≤ ~8 concurrent Opus agents; stagger launches.
- Every agent: exactly one remote sweep per batch (a second only after a root-cause fix); no probes/captures
  (orchestrator batches those per wave); never `--no-verify`; changeset required for `packages/**` changes
  (CI `changeset status`); conventional commit types; PR body per `_common.md` (decisions, docs URLs,
  evidence, left-out, Needs MK).
- Board: edit `$OPS/board-wt/docs/audits/2026-09-07-system-audit/EXECUTION.md`, push with
  `$OPS/board-push.sh "<subject>"` (prettier → gates push → commit with receipt → push; after WP2 simplify
  it to prettier + commit + push). Comment on epic #31 after each wave.

## 6. Next steps, in order

1. §4.4 cleanup. Confirm which rebuild WPs have merged (`gh pr list --search rebuild/ --state all`) and
   whether `.husky/pre-push` / `.gates` still exist on `main` — that decides receipt-flow vs `pnpm verify`.
2. If WP2 has NOT merged: relaunch the conductor (`briefs/conductor.md`) on the train
   `#65 M1 → #64 M2 → #61 T1 → #67 Fo1 → #66 O1 → N1 → C1 → Mk1 → D1`, each stacked on the previous head;
   relaunch finishers for N1, C1, Mk1, D1 (`resume-after-429.md`) to get their PRs open, using gates3/4/5.
   If WP2 HAS merged: rebase each branch onto `origin/main`, run `pnpm verify` locally (static) + let CI
   run the browsers, merge on green — no receipts, no train.
3. After O1 merges: P1 and O2 finishers (`briefs/p1.md`, `o2.md`; rebase `--onto origin/main <O1-old-head>`).
4. After D1 merges: D2 finisher (verify scope, rebase `--onto origin/main 203b2229`, PR). Then D3-1…4
   (`briefs/d3.md`; D3-4 opens a PR and STOPS).
5. G1-a #53: coordinate with the rebuild (close unmerged, carry TG-07/08) — a Needs-MK confirmation.
6. Do1-b, then G1-b (re-scoped per §2), then WP6 interplay.
7. End round (one consolidated pass, per MK): area-partitioned Opus reviewer agents with an adversarial
   checklist (Codex unavailable until 09-15); fix pass over `briefs/fix-round.md`; full verification
   (`pnpm gates:ship` or, post-WP2, `pnpm verify && pnpm verify:release`); both-theme state probe
   (`tooling/audit/probe-states.mjs` on a box — hover-only pass first, see fix-round); counts scan; pixel
   review items (N1 chip track vs selected rung); final report to MK: merged PRs, Version PR #56 awaiting
   the publish decision, deploy awaiting dispatch, every Needs-MK item, anything left out.
