# Handoff — execute the 2026-09-07 audit end to end (Fable 5.1 orchestrator)

You are the orchestrator for executing the VegaStack design-system audit of 2026-09-07 in
`/Users/mk/projects/vegastack-design`. You run sub-agents (model: Fable 5.1, `model: "fable"`)
that each own one GitHub issue, and reviewer sub-agents that verify each batch before it is handed
to the next. You do the planning, sequencing, integration and reporting. You write no production
code yourself except integration fixes after a review.

## 0. Read before doing anything (in this order, fully)

1. `CLAUDE.md`, `AGENTS.md` (every section — the truth hierarchy, the five non-negotiables, the
   locked decisions, the verification ladder, the sanctioned-dependency lists).
2. `design.md` (the doctrine; it is a living document and every batch edits it).
3. `docs/audits/2026-09-07-system-audit/00-decisions.md` — **every decision is final. Never
   re-open D1–D30, DD-1–5, TD-1–7.**
4. `docs/audits/2026-09-07-system-audit/99-change-list.md` (batch table, doctrine amendments,
   counts to drive to zero), then `04-cross-cutting.md`, `07-state-probe.md`,
   `08-docs-structure.md` (the docs canon is approved as written: §2, §3, §4).
5. GitHub epic #31 and issues #32–#51 (bodies also in `docs/audits/2026-09-07-system-audit/issues/`).
   Each issue is self-contained: problem with `file:line`, what to do, acceptance, out of scope.
6. The skills: `.claude/skills/component`, `review`, `gates`, `ship` (read `SKILL.md` and their
   `references/`). Sub-agents work under `component` and `review`; `ship` is **never** run by an
   agent.
7. `docs/ledger/bugs.md`, `docs/ledger/operator-review.md`, `docs/ledger/codex-rounds.md` — the
   formats you append to.

## 1. Mandate (from MK, verbatim intent)

- Production-grade, clear, clean code end to end. **No backward compatibility, no deprecation
  shims, no aliases kept "for safety"** — the one exception is the token aliases F1 explicitly keeps
  (`secondary`/`muted`/`accent`/`sidebar-*` as ladder aliases) because that is a design decision,
  not a compatibility one. Delete what the audit says to delete.
- One consistent, coherent design with nothing missing: code, tokens, `design.md`, the docs site,
  the markdown/agent export, `AGENTS.md`, `CLAUDE.md`, the skills (`skills/internal/**`,
  `skills/public/**` and its mirror in `packages/design/skills/**`), the changelog and the ledgers
  must all agree when a batch is done. A batch that leaves any of them behind is not done.
- Every issue is executed by its own sub-agent; a reviewer sub-agent verifies it by execution
  (not by reading) before the next dependent batch starts. Parallelise wherever there is no
  file overlap and no dependency; never parallelise batches that touch the same files.
- **Do not assume library behaviour from memory.** For every library touched, read the docs for
  the version actually installed (check `package.json`/`pnpm-lock.yaml` first): Base UI, Tailwind
  v4, Next 16, React 19, shadcn CLI, Fumadocs (`fumadocs-core/ui/mdx/typescript`), react-day-picker,
  next-themes, TanStack Table/Virtual, Pragmatic DnD, react-dropzone, recharts, motion, tiptap,
  Playwright, Vitest, Changesets, pnpm. Use the docs tool (`query-docs` / `resolve-library-id`),
  `WebFetch` on the official docs, and `WebSearch` when a page is not known. Record the URL and
  version you relied on in the PR description.
- Shipping (push of changeset-bearing commits, Version PR merge, `deploy.yml` dispatch) is MK's
  decision. MK has **pre-approved**: opening PRs, and merging batch PRs into `main` once the
  reviewer sub-agent has signed off and CI is green with `receipt-guard` executed. MK has **not**
  approved any npm publish or deploy; when a batch creates changesets, stop at the Version PR and
  report. D3's Changesets/pnpm sub-PR stops before merge (MK-gated).

## 2. How to run it

### Board

Create `docs/audits/2026-09-07-system-audit/EXECUTION.md` on a branch `audit/execution-board` and
keep it current (commit + push after every state change): one row per issue with wave, sub-agent
name, branch, PR, reviewer verdict, merge SHA, and the "counts to zero" it moved. This file is how
MK follows progress and how a resumed session picks up.

### Waves (dependencies are real; file overlap is the other constraint)

| wave | batches (parallel within a wave)                                                                                                                                                                                                                                                        | why                                                                                                                                                                                                                                                                                                   |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | **F1** #32 · **D1** #34 · **G1-a** (#49 gate fixes only: TG-01…TG-09, turbo inputs, `tooling/lib/fs.mjs`, receipt v2 — **no lint rules yet**) · **Do1-a** (#48 docs chrome + agent export + frontmatter schema + generated sections + `verify-docs-export` — **no page migration yet**) | disjoint files: tokens / deps+AGENTS / tooling / docs shell                                                                                                                                                                                                                                           |
| 2    | **F2** #33                                                                                                                                                                                                                                                                              | needs F1's hover/pressed recipe                                                                                                                                                                                                                                                                       |
| 3    | **M1** #35 · **T1** #37 · **Fo1** #39 · **O1** #40 · **Di1** #42 · **I1** #46                                                                                                                                                                                                           | all need F1+F2; components are disjoint. O1 and Fo1 both touch `combobox`/`select` — O1 owns the floating parts, Fo1 owns `fieldControl` on the trigger; coordinate by giving O1 `select.tsx`/`combobox.tsx` and having Fo1 land its Select-trigger change as a follow-up commit on top of O1's merge |
| 4    | **O2** #41 · **T2** #38 · **M2** #36 · **N1** #43 · **C1** #44 · **P1** #45 · **Mk1** #47                                                                                                                                                                                               | O2 after O1; T2 after T1/F2; N1/C1/P1/Mk1 after F1/F2; M2 after M1 (Slider) and Fo1 (Toolbar in FilterBar)                                                                                                                                                                                            |
| 5    | **Do1-b** (#48 page-canon migration of all pages, Playground/Explorer policy, `component:new`) · **D2** #50                                                                                                                                                                             | after every component batch (pages settle); D2's Fumadocs migration lands **before** Do1-b's page migration (same files) — run D2 first within the wave                                                                                                                                               |
| 6    | **G1-b** (#49 lint rules + contract-lane geometry checks + `verify-docs-export` wired into `pnpm lint`)                                                                                                                                                                                 | the rules must find zero offenders                                                                                                                                                                                                                                                                    |
| 7    | **D3** #51 (four sub-PRs; the last one stops before merge)                                                                                                                                                                                                                              | release plumbing                                                                                                                                                                                                                                                                                      |

Adjust the plan if a reviewer finds an unexpected overlap, and write the adjustment to the board.

### Per-issue sub-agent protocol (give this to every implementer, plus its issue number)

1. Work in an isolated git worktree on branch `audit/<issue-key>` (e.g. `audit/f1-surface-tokens`)
   from the current `main`. Never commit to `main`.
2. Read §0 items 1–4, the issue, and the audit files the issue cites. Then read the official docs
   for every library version you will touch (see §1) — quote the URL in your plan.
3. Write a short plan first (files to change, tokens/props added and removed, doctrine edits,
   docs pages, tests, gates to run). Put it at the top of your final report.
4. Implement in canonical sources only (`packages/ui/registry/ui/*`, tokens, tooling, docs
   content). `pnpm registry:build && pnpm design:derived` after component/contract changes; the
   tree must be clean afterwards. Never hand-edit generated files.
5. Every batch also updates, where the issue or the change makes them stale: `design.md` (+
   `pnpm design:sync`), the foundations pages under `apps/docs/content/docs/foundations/`, the
   component MDX pages (canon in `08-docs-structure.md` §2), `AGENTS.md` (build rules, sanctioned
   lists, numbers block is generated — never hand-edit it), `CLAUDE.md` if session guidance
   changes, `skills/internal/**` and `skills/public/**` (then `node tooling/sync-package-skills.mjs`;
   `tooling/skill-lint.mjs` must pass), `/CHANGELOG.md` under the fixed vocabulary + `node
tooling/sync-changelog.mjs`, and a changeset (`pnpm changeset`) for every consumer-visible
   package change (`@vegastack/ui` minor for any registry item change).
6. Verify by execution, never by reading: `pnpm gates:component <name>` per touched component,
   `pnpm gates:push` before opening the PR, the issue's acceptance commands, and the audit
   harness on touched routes (`node docs/audits/2026-09-07-system-audit/probe-states.mjs --routes
…` light and `--dark`; `capture.mjs --routes …`; `probe-overlays.mjs`/`probe-media.mjs` where
   relevant). Read the reports, not the exit codes. Run `pnpm gates:push` **before** the final
   commit and include `.gates/receipt.json`.
7. Self-review under the `review` skill; append to `docs/ledger/bugs.md` anything you found that
   the audit missed, and to `docs/ledger/operator-review.md` every judgment call.
8. Open a PR (`gh pr create --base main`) whose body has: the plan, what changed, doc/skill/
   doctrine edits, the docs URLs relied on, the acceptance evidence (commands + observed output),
   the counts moved, and anything deliberately left out with the reason. Return that body as your
   final report. Do not merge.

### Reviewer sub-agent protocol (one per implementer PR, a different agent)

1. Check out the PR branch in a fresh worktree. Read the issue and the implementer's report.
2. Re-run every acceptance command in the issue and `pnpm gates:push`; run the audit harness on
   the touched routes; grep for the "counts to zero" the batch claims; open the touched docs pages
   in the built export (`apps/docs/out`) and the `.md` export and confirm they render as the canon
   says; confirm `design.md`, skills, `AGENTS.md`, changelog and changeset were updated.
3. Look specifically for: leftover compatibility shims, `TODO`, duplicated recipes the batch was
   meant to remove, a doctrine sentence that now contradicts the code, a generated file edited by
   hand, a gate that passes because it did not run.
4. Verdict `APPROVE` or `CHANGES` with a numbered list. On `CHANGES`, send the list back to the
   same implementer agent (`SendMessage`), let it fix, and re-review. Max two rounds; escalate to
   the orchestrator after that.

### Orchestrator loop

- Launch a wave's implementers in parallel (`Agent`, `model: "fable"`, `isolation: "worktree"`).
  As each finishes, launch its reviewer. On `APPROVE`, wait for CI, confirm `receipt-guard`
  executed (`gh run view <id> --json jobs`), merge (`gh pr merge --squash --delete-branch`), then
  tell every still-running implementer in the wave to rebase onto `main`.
- Before a wave starts, hand each implementer the merge SHAs it depends on and the exact list of
  files owned by its siblings in the wave (so nobody touches them).
- After each wave: run `pnpm gates:push` on `main` locally, rerun `probe-states.mjs --all` and
  update the counts in the board. If a count went up, stop and investigate before the next wave.
- Keep the board current; post a summary comment on epic #31 after every wave (batches merged,
  counts, anything deferred, anything needing MK).
- If a decision genuinely not covered by `00-decisions.md` is needed, do not guess and do not
  re-open a locked one: write the question with options and a recommendation to the board under
  "Needs MK", continue everything that does not depend on it, and surface it in your report.

## 3. Definition of done (for you)

- Issues #32–#51 closed with merged PRs (except the D3 release-plumbing sub-PR left open for
  MK), epic #31 updated with the final counts.
- `99-change-list.md` "Counts to drive to zero" all zero or at their allowlist, verified by
  rerunning the scan in `04-cross-cutting.md` §2 and the state probe (both themes).
- `pnpm lint`, `pnpm typecheck`, `pnpm gates:push` green on `main`; `design:sync:check`,
  `design:derived:check`, `registry:build` idempotent; `skill-lint` and the public-skill mirror
  clean; both `SITE_VISIBILITY` builds succeed; `verify-docs-export` finds no JSX tag in any `.md`.
- `design.md`, `AGENTS.md`, `CLAUDE.md`, every skill, the changelog and the ledgers describe the
  system as it now is.
- A final report to MK: what shipped to `main`, the Version PR(s) waiting for MK's publish
  decision, the deploy dispatch waiting for MK, and anything you could not finish with the reason.
