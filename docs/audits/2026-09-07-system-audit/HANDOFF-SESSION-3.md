# Handoff — audit epic #31, session 3 (post verification-rebuild)

Written 2026-09-09 ~07:00 IST. Supersedes `HANDOFF-SESSION-2.md` §2–§4 and §6; that file's §0 (mandate,
approval boundaries, MK's standing instructions), §1 (read list), §4 box inventory/onboarding, and §5
(agent protocol) still apply. `$OPS` = `/Users/mk/projects/vegastack-design-audit-ops`.

## 1. What changed: the verification rebuild is COMPLETE

All six work packages + a ledger PR are on `main` (`c40cc68d`): WP0 #68 Linux runners · WP1 #69 geometry
lane · WP2 #71 `pnpm verify` · WP4 #70 generated docs files ungitted · WP5 #77 changelog assembled per
version · WP3 #78 attestation stack + Playwright docs runner deleted · WP6 #79 AGENTS.md rulebook (150
lines) + skills realigned · #80 the 15 geometry defects recorded in `docs/ledger/bugs.md`.
G1-a **#53 is CLOSED unmerged**; its TG-07 (`tooling/lib/fs.mjs`) and TG-08 (motion pairing) are on main
in `09b2107e`. WP3b (tooling under one runner) is DEFERRED until epic #31 lands.

Consequences — the old flow in `briefs/_common.md`, `finish-after-f2.md`, `resume-after-429.md`,
`conductor.md`, `remote-gates-v3.sh`, `board-push.sh`'s gates step, and `merge-chain.md` is OBSOLETE:

- No `.husky/pre-push`, no `.gates/`, no receipts, no `receipt-guard`, no `HUSKY=0`, no merge train,
  no route scoping, no `contracts-run`, no `apps/docs/vrt/`. Hooks left: `pre-commit` (design-lint +
  prettier on staged) and `commit-msg`.
- The ladder is `pnpm verify` (`node tooling/verify.mjs`: typecheck · lint · design:verify · the
  `@vegastack/ui` browser suite incl. the new geometry lane; ~2 min on the Mac) and `pnpm verify:release`
  (docs export both matrices · docs-shell a11y · consume round-trip · three engines; ~7 min).
  `pnpm check:component <name>` is the cheap per-component loop. `pnpm clean` (never `--weekly` while
  audit worktrees exist).
- CI per PR = `verify` (Ryzen box, Playwright container, ~3 min) + `verify-macos` (mini, static, ~2 min).
  Both must be green and executed before a merge. `gates`/`gates2` are those GitHub runners now.
- Generated docs files (`*.generated.ts(x)`, `contract-routes`, `component-matrix`, `integrity-manifest`,
  the changelog page, `public/design.md`) are build outputs — rebases show modify/delete conflicts on them
  and on `.gates/receipt.json`: **resolve as delete, every time**.
- `CHANGELOG.md` is no longer edited per PR; **every changeset body's first non-empty line must start with
  one of the eight section emoji** (`🧩/🔧/🗑/🛠/📦/📚/🐛/⚠️`) or `pnpm lint` fails
  (`tooling/changeset-lint.mjs`). A `packages/*` change needs a changeset (empty is fine).
- After ANY rebase across the rebuild: `git diff origin/main -- turbo.json AGENTS.md .gitignore
package.json` must show only your batch's intended changes (git silently dropped inserted hunks in
  `turbo.json` once).
- AGENTS.md and all skills were rewritten in WP6. Read the new AGENTS.md before editing it or any skill;
  Do1-b/G1-b/D-batches that touch them rebase first, then edit.

## 2. State at 2026-09-09 06:45 IST

Merged audit PRs (8): F1 #55 · Do1-a #54 · F1 follow-up #59 · F2 #60 · I1 #57 · Di1 #62 · T2 #63 ·
**O1 #66 `54c5cb68`**.

| batch               | issue | PR  | branch / worktree (`.claude/worktrees/<name>`)                                                                                                                                                                                                                                                                                                      | state                                                                                     |
| ------------------- | ----- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| T1 tables           | #37   | #61 | `audit/t1-tables-grids` / agent-a5ece1ab2a22fb18b                                                                                                                                                                                                                                                                                                   | CONFLICTING; rebase onto main                                                             |
| M2 rich text        | #36   | #64 | `audit/m2-rich-text-toolbars` / agent-a9f466c472f35938e                                                                                                                                                                                                                                                                                             | CONFLICTING; rebase                                                                       |
| M1 media            | #35   | #65 | `audit/m1-media-players` / agent-a26bd900144579794                                                                                                                                                                                                                                                                                                  | CONFLICTING; rebase                                                                       |
| Fo1 forms           | #39   | #67 | `audit/fo1-forms` / agent-adb77e930818ebe32                                                                                                                                                                                                                                                                                                         | CONFLICTING; rebase                                                                       |
| D1 deps             | #34   | #72 | `audit/d1-deps-security-alignment` / agent-a5fd49c9bbd42c51d                                                                                                                                                                                                                                                                                        | CI was green on an interim main; re-check after rebase                                    |
| N1 navigation       | #43   | #73 | `audit/n1-navigation-layout` / agent-a6c3ffeb17387b333                                                                                                                                                                                                                                                                                              | same                                                                                      |
| Mk1 marketing/hooks | #47   | #74 | `audit/mk1-marketing-hooks-block` / agent-ae544ead6dc75ed97                                                                                                                                                                                                                                                                                         | same                                                                                      |
| P1 pickers/drag     | #45   | #75 | `audit/p1-pickers-drag` / agent-af375b32d83b027b2 (4 dirty files)                                                                                                                                                                                                                                                                                   | `verify` FAILED on an interim main — read the run, fix at root                            |
| C1 composition      | #44   | #76 | `audit/c1-composition-feedback` / agent-a64707371ec7a2b11                                                                                                                                                                                                                                                                                           | no CI yet; rebase                                                                         |
| O2 toasts           | #41   | —   | `audit/o2-toasts` @ `c21f53b0` / agent-a89ebf2958f1d7aa3 (1 dirty)                                                                                                                                                                                                                                                                                  | O1 merged → rebase `--onto origin/main <O1-old-head>`, verify scope vs `briefs/o2.md`, PR |
| D2 deps             | #50   | —   | `audit/d2-deps-fumadocs-lucide` @ `ea8f3bd9` / agent-d2 (stacked on D1 `203b2229`)                                                                                                                                                                                                                                                                  | verify scope vs `briefs/d2.md`; after D1 merges `rebase --onto origin/main 203b2229`; PR  |
| D3-1…4              | #51   | —   | not started (`briefs/d3.md`; D3-3 vitest 5 and D3-4 changesets 3 now interact with WP2/WP5 — read `tooling/verify.mjs` and `tooling/changelog-assemble.mjs` first)                                                                                                                                                                                  | after D2                                                                                  |
| Do1-b docs          | #48b  | —   | not started                                                                                                                                                                                                                                                                                                                                         | after component batches; rebase across WP6                                                |
| G1-b                | #49b  | —   | not started; RE-SCOPED: design-lint rules incl. hover-fill-without-active (fail closed + negative fixture), `packages/ui/test` in tsconfig `include`, contract inventory count derived from `registry.json`, token-reference lint over prose, `verify-docs-export`/docs-shell wiring check; DROP receipt/verify-only/worker-cap/contract-lane items | last                                                                                      |
| Version Packages    | —     | #56 | bot                                                                                                                                                                                                                                                                                                                                                 | MK's publish gate — never merge                                                           |

Effort-weighted: **≈ 66% done / 34% pending** (8 merged ≈ 27%; 11 code-complete ≈ 37%; D2 ≈ 2%).
Pending: 11 landings (~14%), D3 + Do1-b + G1-b (~14%), end round (~6%).

Needs-MK items 1–19 stay on the board; #18 (sweep economics) is resolved by the rebuild.
NEW routed defects (`docs/ledger/bugs.md` 2026-09-09): 15 geometry-lane 24px/obstruction defects in
breadcrumb (N1), combobox chip (T2→end round), date-picker caption (P1), icon-text (Di1→end round),
marker, message-scroller (Mk1), stepper (Fo1/C1), tabs chip (N1), action bar (M2), attachment thumbnail
(Fo1), resizable, timeline (C1) — listed in the exclusion map of `packages/ui/test/geometry.browser.test.tsx`;
fix in the owning batch if still open, else in the end round, and delete the exclusion with each fix.
Plus: the docs fullscreen focus trap does not hold (OPEN DEFECT, docs-shell entry) → Do1-b.

## 3. The per-batch landing procedure (replaces the finisher protocol)

In the batch's worktree: `git fetch origin && git rebase origin/main` (for O2/D2: `--onto origin/main
<old-base>`). Resolve: modify/delete → delete; `CHANGELOG.md` → take main's (per-PR edits are gone; move
the batch's entries into its changesets with section emoji); `bugs.md`/`operator-review.md` keep both;
`design.md` by hand then `pnpm design:sync`; `component-contracts.json` keep both then
`node tooling/verify-component-contracts.mjs`. Then the diff check from §1, `pnpm check:component <name>`
for each touched component, `pnpm typecheck && pnpm lint && pnpm design:verify` locally, commit
`chore(rebase): …`, `git push --force-with-lease=<branch>:<old-sha>`. CI executes the browsers. If
`verify` fails, reproduce with `pnpm verify` — on gates3/4/5 through `$OPS/remote-gates-v3.sh <worktree>
-- pnpm verify` (it still works as a plain remote executor; the receipt check at its end is dead code and
must be removed — do that first), or on the Mac only if MK allows local browser runs. Merge on green with
both jobs executed: `gh pr merge <n> --squash --delete-branch`. Comment on epic #31 per wave.

## 4. Order of work

1. Cleanup: kill stale processes on all five boxes (session-2 handoff §4.4), `git worktree prune`,
   inspect dirty worktrees (P1 4 files, O2 1 file). Retire the obsolete briefs (move to
   `$OPS/briefs/obsolete/`), rewrite `_common.md` to §1/§3 of this file, fix `board-push.sh` (prettier +
   commit + push only; the board branch must be rebuilt from `origin/main` — see §5).
2. Land in parallel (one Opus agent per PR, ≤ 8 concurrent): #61 T1, #64 M2, #65 M1, #67 Fo1, #72 D1,
   #73 N1, #74 Mk1, #75 P1, #76 C1. Merge each on green. Serial conflicts are now rare (generated files
   are gone); when one occurs it is a real overlap — resolve at the root.
3. O2 finisher (after step 1), D2 finisher after D1 merges, then D3-1…4 (D3-4 opens a PR and STOPS).
4. Do1-b, then G1-b (re-scoped), each rebased across WP6 first.
5. End round: area-partitioned Opus reviewers with an adversarial checklist (Codex unavailable until
   2026-09-15); one fix pass over `briefs/fix-round.md` + the 15 geometry defects + focus trap;
   `pnpm verify && pnpm verify:release` green (release on a box or the Mac per MK); both-theme state probe
   (`docs/audits/2026-09-07-system-audit/probe-states.mjs`, hover-only pass first); `node $OPS/counts.mjs <repoRoot>` to zero; final
   report: merged PRs, Version PR #56 awaiting MK's publish decision, deploy awaiting dispatch, every
   Needs-MK item, anything left out.

## 5. Board branch

`audit/execution-board` carried `.gates/receipt.json` commits that now conflict with main. Rebuild it:
`git checkout -B audit/execution-board origin/main` in `$OPS/board-wt`, copy `EXECUTION.md`,
`HANDOFF-SESSION-2.md`, `HANDOFF-SESSION-3.md` from the previous tip (`6319a002`) into
`docs/audits/2026-09-07-system-audit/`, commit, `git push --force-with-lease`. Keep the board current
at every state change; it is the record MK reads.

## 6. Lessons and tools carried from sessions 1–3 (checklist — all still apply)

- **Boxes.** Five Debian Ryzen boxes (`gates`, `gates2`, `gates3`, `gates4`, `gates5`; inventory,
  aliases, sudo, provisioning in `HANDOFF-SESSION-2.md` §4 and memory `ryzen-gates-boxes`). New box:
  `$OPS/onboard-box.sh <alias> <ip> <user> <pw>` (~10 min, ends with an 8/8 acceptance). **One browser
  run per box at a time**; `gates`/`gates2` are also the GitHub Actions runners, so manual runs go to
  `gates3/4/5`. `$OPS/remote-gates-v3.sh <worktree> -- <cmd>` mirrors + rsyncs + runs any command on the
  first free box and rsyncs `.vrt-review/ .audit/` back (delete its dead receipt check first). Mirrors
  are pushed with `-c core.hooksPath=/dev/null`; never do that to `origin`.
- **Audit probes and captures** live in `docs/audits/2026-09-07-system-audit/` (`probe-states.mjs`,
  `probe-overlays.mjs`, `probe-forced-colors.mjs`, `capture.mjs`, `histogram.mjs`, `graph.mjs`), NOT in
  `tooling/`. They need a Playwright install and a docs export; run them on a box, batched per wave, and
  first confirm they still run after WP3 deleted `@playwright/test` from the docs app (use the
  `@vegastack/ui` Playwright if needed). Every `pnpm gates:push` mention in `HANDOFF-PROMPT.md` now reads
  `pnpm verify`.
- **Codex** (when credits return 2026-09-15): `node /Users/mk/.claude/remote/plugins/d103eaf5306c5227/scripts/codex-companion.mjs
task --background --write --model gpt-5.6-sol --effort high "<prompt>"` from a review worktree of the PR
  head; `status <id> --json` / `result <id>` from the SAME cwd; the sandbox is read-only/no-network without
  `--write`; validate every finding by execution before acting (`$OPS/codex-*-result.md` are the three
  past reviews and their triage).
- **Agents.** Opus 5 high reasoning; one-line prompts pointing at a brief file + worktree + HEAD + known
  state; ≤ 8 concurrent; a "completed" notice that reads as waiting is a yield — never relaunch on it;
  after a 429 wave relaunch only agents with a `failed` notice (a survivor + a relaunch = duplicate →
  `TaskStop`); no two agents in one worktree; check `ToolSearch select:SendMessage` before assuming agents
  cannot be messaged; Bash foreground max 10 min → `run_in_background` + `until … sleep` loops.
- **Git.** Worktrees fetch `main` only → push with `--force-with-lease=<branch>:<old-sha>`; after a
  rebase across the rebuild diff `turbo.json AGENTS.md .gitignore package.json` against main; modify/delete
  on generated files and `.gates/receipt.json` → delete; keep both sides of ledgers; `design.md` by hand
  then `pnpm design:sync`; `component-contracts.json` both sides then the verifier; conventional commit
  types; prettier runs in `pre-commit` (format docs before committing); a `packages/*` change needs a
  changeset whose body starts with a section emoji; PR body per `_common.md` (decisions, docs URLs read
  for the installed version, evidence by execution, left-out, Needs MK); comment CI run ids on the PR.
- **Known flakes** (recognise, then read before re-running): `relative-time` self-rescheduling fixture;
  `provider.test.tsx` toast leak (fixed in D1); cold-worktree Vite dep-optimizer storm (`useState` of
  null / iframe disconnect); `ERR_INSUFFICIENT_RESOURCES` / `Page crashed` under load; stale `.next`
  cache; `pnpm lint` needs network (`ui.shadcn.com`). The unit lane failed in 16 of 25 loaded sweeps.
- **Board and reporting.** `$OPS/board-wt` + `$OPS/board-push.sh "<subject>"`; sections Progress
  snapshot (with effort-weighted %: S1/M2/L3/XL5 × implement 60 / review 25 / merge 15), Board, Counts
  (`counts.mjs` baseline vs latest), Needs MK (1–19 so far), Log; comment on epic #31 after each wave;
  `HOLD-STATE.md` is the 03:25 snapshot taken when MK paused the session.
- **MK's working preferences** (memory `mk-audit-preferences`, `mk-dev-first-then-verify`): probe real
  interaction states, brutal/no-bloat, Geist/Linear/Raycast as benchmarks, merge on green without
  per-batch reviewers, one consolidated end round, honest answers about speed and bottlenecks.
