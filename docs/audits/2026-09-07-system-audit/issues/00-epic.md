---
title: "Epic: system-wide component audit 2026-09-07 — fix batches"
labels: [audit-2026-09, epic]
---

## What this is

On 2026-09-07 the whole design system was audited component by component (110 components, 6 hooks,
1 block, 439 icons, docs chrome, tooling, dependencies) against the project's own doctrine and
against Vercel Geist / Linear / Raycast / Radix. Every finding, its evidence and MK's decisions are
on disk under `docs/audits/2026-09-07-system-audit/`:

| file                                                       | contents                                                                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `00-decisions.md`                                          | every doubt and MK's answer (D1–D30, DD-1–5, TD-1–7) — **the decisions are final; do not re-open them** |
| `00-register.md`, `00-graph.md`                            | the component inventory and dependency graph (tiers, consumers)                                         |
| `01-system.md`, `01-deps.md`, `01-class-histogram.md`      | token layer, global CSS, API conventions, dependency report with 10 ordered update batches              |
| `02-batch-01…09-*.md`                                      | per-component findings with `file:line` evidence, motion register, verified-fine lists                  |
| `03-proposals.md`                                          | P1 surface-token ladder and P2 Button `variant × tone` (with the migration table)                       |
| `04-cross-cutting.md`                                      | the consolidation map, before-counts, spacing/type rules, lint rules to add                             |
| `05-docs-chrome.md`, `06-tooling-gates.md`                 | docs shell and gates audits                                                                             |
| `07-state-probe.md`                                        | hover/pressed/focus/radius probe over 817 elements (+ dark pass)                                        |
| `08-docs-structure.md`                                     | the docs page canon and agent export design                                                             |
| `99-change-list.md`                                        | this epic's batch table, doctrine amendments, counts to drive to zero                                   |
| `capture.mjs`, `probe-*.mjs`, `graph.mjs`, `histogram.mjs` | the harnesses; `captures/` is gitignored — rerun to regenerate                                          |

## Batches (one issue each, execution order)

1. F1 Surface ladder tokens
2. F2 Button `variant × tone`, sizes, IconButton everywhere
3. D1 Dependencies: security + alignment + Next + Base UI/shadcn
4. M1 Media players
5. M2 Rich text, prose, toolbars
6. T1 Tables and grids
7. T2 Chips, filters, pagination, announcer
8. Fo1 Forms
9. O1 Overlays
10. O2 Toasts on Base UI Toast
11. Di1 Display leaves
12. N1 Navigation and layout
13. C1 Composition and feedback
14. P1 Pickers and drag
15. I1 Icons factory
16. Mk1 Marketing, hooks, block
17. Do1 Docs structure and chrome
18. G1 Gates, lint rules, tooling
19. D2 Dependencies: Fumadocs, lucide, axe, Playwright, recharts
20. D3 Dependencies: majors

F1 and F2 are foundations: every later batch consumes their tokens and variants. D1 is early because
it carries security patches. G1's lint rules land **after** the code migrations they enforce (they
would fail the tree before). Do1 can run in parallel with anything after F2.

## Rules for every batch

- Work under the `component` skill for component changes and the `review` skill before declaring a
  batch done; `/ship` is always MK's decision and is **not** part of any batch.
- Edit canonical sources only (`packages/ui/registry/ui/*`), then `pnpm registry:build` and
  `pnpm design:derived`; the tree must be clean after both.
- Each batch includes its `design.md` edits (listed in the issue) and its `/CHANGELOG.md` entry
  under the fixed section vocabulary; run `node tooling/sync-changelog.mjs`.
- Verify with the ladder: `pnpm gates:component <name>` per touched component, `pnpm gates:push`
  before the PR, `pnpm gates:ship` only when MK asks to ship.
- After a batch, rerun the audit harness on the touched routes and confirm the relevant counts in
  `99-change-list.md` §Counts went down:
  `node docs/audits/2026-09-07-system-audit/probe-states.mjs --routes a,b` and
  `node docs/audits/2026-09-07-system-audit/capture.mjs --routes a,b`.
- No new sanctioned dependency without an MK decision; the ones this audit sanctioned are listed in
  `00-decisions.md` (D25, D30).

## Done when

All 20 batch issues are closed, the "counts to drive to zero" in `99-change-list.md` are zero (or at
their stated allowlist), and a fresh `gates:ship` receipt (schema v2) covers `main`.

## Created issues (2026-09-07)

Epic: https://github.com/VegaStack/vegastack-design/issues/31

- F1 Surface ladder tokens → #32
- F2 Button variant × tone, sizes, IconButton → #33
- D1 Dependencies: security + alignment + Next + Base UI/shadcn → #34
- M1 Media players → #35
- M2 Rich text, prose, toolbars → #36
- T1 Tables and grids → #37
- T2 Chips, announcer, pagination → #38
- Fo1 Forms → #39
- O1 Overlays → #40
- O2 Toasts on Base UI Toast → #41
- Di1 Display leaves → #42
- N1 Navigation and layout → #43
- C1 Composition and feedback → #44
- P1 Pickers and drag → #45
- I1 Icons factory → #46
- Mk1 Marketing, hooks, block → #47
- Do1 Docs structure and chrome → #48
- G1 Gates, lint rules, tooling → #49
- D2 Dependencies: Fumadocs, lucide, axe, Playwright, recharts → #50
- D3 Dependencies: majors → #51
