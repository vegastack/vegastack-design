# System-wide component audit — every component, one standard

**Owner:** MK · **Agent:** Claude Code · **Drafted:** 2026-09-07 · **Status:** awaiting approval

## 1. Goal

Examine all 110 components, 6 hooks, the block, every docs page and test, the docs site chrome,
the tooling, and every dependency across the stack, against one fixed standard, and produce an
end-to-end actionable change list. The output of this exercise is **not code**. It is:

1. An audit record on disk (`docs/audits/2026-09-07-system-audit/`).
2. A set of GitHub issues on `VegaStack/vegastack-design`, one per fix batch, each self-contained
   enough that a fresh session can execute it without this conversation.

## 2. Decisions taken in the interview (2026-09-07)

| Topic      | Decision                                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| Approach   | Audit everything first. No fixes during the audit.                                                    |
| Method     | Code **and** live browser. Playwright headless against the local docs build.                          |
| Brutality  | Full: defects, API renames, variant merges, component deletions/merges. No consumer to protect;       |
|            | breaking changes are acceptable. Bloat-free and optimal is the bar.                                   |
| Doctrine   | `design.md` is on trial too. Token/rule changes are separate MK decisions before any code.            |
| Benchmark  | Vercel/Geist, Linear, Raycast. Flat, precise, dense-but-calm, keyboard-first.                         |
| Elevation  | Flat + one overlay shadow (floating layers only). `shadow-lit` is a retirement candidate.             |
| Motion     | Subtle, minimal, functional, smooth. MK is shown every motion added or changed, no surprises.         |
| Deps       | Full stack: are we current, and are we using the newest released features (Next, Fumadocs,            |
|            | Base UI, Tailwind, shadcn, React, TS, Playwright, Vitest, Turbo, pnpm …). Separate section.           |
| Scope      | 110 components + docs pages + tests · 6 hooks + block · docs chrome + tooling · deps.                 |
|            | Animated icons: sample ~20 + generator/runtime check, findings apply to the whole set.                |
| Rhythm     | Batches of ~12 in dependency order, leaves first. Review + doubts list after each batch.              |
| Priorities | Dependency order, but media (audio/video), data (grid/table/list/filter-bar) and forms surface early. |
| Theme      | Light and dark are equal. Every finding is checked in both.                                           |
| Output     | Findings to disk first. After clarification, GitHub issues: one per fix batch (~15–30 issues).        |

## 3. Non-goals

- No component code changes, no token changes, no dependency bumps during the audit.
- No pixel baselines committed. Screenshots are evidence in the audit folder only (gitignored or
  attached to issues, decided in Phase 0).
- No re-opening of locked decisions (stack, distribution model, auth topology, CI topology).

## 4. Phases

### Phase 0 — Inventory and dependency graph (½ day)

- Generate the graph from source, not memory: internal imports (`./x`, `@/components/ui/x`),
  Base UI primitives used, third-party engines per component, hooks consumed, and which docs
  page/preview/test belongs to each item.
- Tier it: **T0** no internal deps (button, input, tooltip, …) → **T1** composes T0 → **T2** → **T3**
  large surfaces (data-grid, sidebar, board, players).
- Output: `00-graph.md` (mermaid + table) and `00-register.md` (one row per item: tier, LOC, deps,
  engines, docs page, test file, contract route). Batches are cut from the tiers here.
- Stand up the browser harness: docs build, Playwright script that captures each route at
  320 / 768 / 1280, light + dark, LTR + RTL, and dumps computed padding/gap/radius/font per
  component root. Reused for every batch.

### Phase 1 — System pass (1 day)

Audit the shared layer before any component so per-component findings share one ruler.

- **Tokens and scales as actually used**: histogram every `p-*`, `gap-*`, `m-*`, `rounded-*`,
  `text-*`, `h-*` value across all 110 files. Off-scale and near-duplicate values become global
  findings.
- **design.md on trial**: type ladder, spacing scale, radius cap, alpha/opacity split, motion
  vocabulary, elevation model, colour roles. Each challenge written as: current rule, problem,
  proposed rule, pros/cons, recommendation.
- **Lint rules**: what `design-lint` cannot see today (the gaps this audit will find by hand
  should become rules later).
- **Dependencies and modern features**: every package in every workspace, current vs latest,
  and for the core stack a "newest features we are not using" review (Next 16, React 19.2,
  Tailwind 4.3, Base UI 1.6, shadcn 4.13, Fumadocs 16, TS 6). Output: `01-deps.md`.
- **Docs chrome and tooling**: site shell, navigation, search, theme switch, code blocks,
  preview frame; gate scripts for fail-open paths.

### Phase 2 — Component pass (the bulk, ~9 batches)

Every item gets the same checklist, applied identically, with each finding citing `file:line`
and how it was verified (read / rendered / measured / axe / keyboard).

1. Purpose and overlap: does it earn its place, or is it a variant of another component?
2. API and naming: props, defaults, controlled/uncontrolled, `render` composition, ref-as-prop.
3. Variants: CVA structure, dead variants, missing sizes.
4. States: default, hover, focus-visible, active, loading, empty, error, success, disabled.
5. Tokens: colour, size, radius, alpha/opacity, z-index, type, motion.
6. Spacing: padding, gap, margin consistent with siblings of the same role.
7. Responsiveness: 320px reflow, truncation, touch targets, container queries where due.
8. RTL, long text, zero/one/many data, overflow.
9. Accessibility: APG pattern, keyboard map, labels, live regions, focus management, axe, forced
   colours, reduced motion.
10. Dark mode parity.
11. Motion: mechanism, duration/ease pairing, reduced-motion path. Every motion is listed for MK.
12. Server safety and `'use client'` placement.
13. Engine boundary (for the sanctioned exceptions): is the engine isolated to one file.
14. Test quality: what the test proves, what it cannot fail on.
15. Docs page: section order, examples cover the states, API table accurate, do/don't present.
16. Bloat: dead code, duplicated helpers, oversized files that should split.

Batch order (cut from Phase 0 tiers; media/data/forms leaves come early by construction):

- B1 T0 form leaves: button, icon-button, input, textarea, label, field, checkbox, radio-group,
  switch, slider, number-field, otp-input
- B2 T0 display leaves: badge, avatar, kbd, separator, skeleton, spinner, progress, marker,
  status-icon, stat, relative-time, truncated-text
- B3 overlays: tooltip, popover, hover-card, dialog, alert-dialog, sheet, dropdown-menu,
  context-menu, command, combobox, select, sonner
- B4 media + rich text: audio-player, video-player, attachment, image, figure-frame, code-block,
  terminal, markdown-view, text-edit, copy-button, tool-call-chip, message
- B5 data: table, data-grid, data-list, editable-cell, filter-bar, filter-bar-managed,
  pagination, property-list, comparison-matrix, chart, tag-group, chip-input
- B6 navigation + layout: app-shell, sidebar, navigation-menu, breadcrumb, tabs, segmented,
  toggle, toggle-group, page-header, section-header, resizable, scroll-area
- B7 composition + feedback: card, item, collapsible, accordion, alert, announcement-banner,
  empty, notification-bell, stepper, progress-indicator, onboarding-checklist, timeline
- B8 pickers + drag: date-picker, color-picker, emoji-picker, country-select, region-select,
  board, sortable-list, dropzone, auto-save-input, password-input, split-button, action-bar
- B9 marketing + motion + rest: marketing-surface, pricing-section, testimonial, logo-row,
  ruled-band, bubble, particle-field, staggered-text-reveal, animated-number, settings-row,
  shortcut-overlay, field-inline, message-scroller, provider, the 6 hooks, dashboard-01,
  icons sample

After each batch: `NN-batch.md` on disk, then a short review with MK: findings summary, the
doubts list (each doubt: options, pros/cons, recommendation), and the motion register delta.

### Phase 3 — Cross-cutting consistency (1 day)

Compare same-role patterns across components now that all are seen: all floating surfaces
(padding, radius, shadow, border), all text inputs (height, focus treatment), all icon slots,
all headers, all empty states, all list rows, all close buttons. This is where the spacing
inconsistencies MK noticed become one rule each rather than 30 local fixes.

### Phase 4 — Change list and issues

- `99-change-list.md`: every finding with severity (high/medium/low), effort, breaking or not,
  kind (global / group / component), and batch assignment.
- Clarification round with MK on the remaining doubts.
- Then GitHub issues, one per fix batch, via the `dev-intake` skill format: goal, exact files,
  the findings it closes, acceptance criteria, and the gates to run (`pnpm gates:component`,
  `pnpm contracts`, `pnpm gates:push`). Global issues first (tokens, design.md, deps, lint
  rules), then group issues, then component issues. An epic links them in execution order.

## 5. Verification that the audit itself is sound

- Every finding names how it was observed. "Read" alone is not enough for visual claims.
- A finding that a gate should have caught is also logged as a gate gap.
- Batch 1 is reviewed by MK before Batch 2 starts, to calibrate severity and taste.
- Counts come from `component-contracts.json`, never from prose.

## 6. Risks

- **Time.** 110 items × two theme × three widths × RTL is large. Mitigation: the Playwright
  harness is built once in Phase 0 and every batch reuses it.
- **Calibration drift.** Later batches judged harder than earlier ones. Mitigation: the fixed
  checklist, Phase 3 re-pass, and re-reading B1 findings at the end.
- **Doctrine churn.** Challenging `design.md` mid-audit could move the ruler. Mitigation:
  doctrine challenges are recorded in Phase 1 but components are judged against current
  `design.md` plus the challenges flagged, not against an unapproved new doctrine.
- **Local dev environment.** Node in this shell is 25.9 while the repo wants ≥24.14; the docs
  build and Playwright must be proven working in Phase 0 before anything is claimed.
