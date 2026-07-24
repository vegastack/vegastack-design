# Component Coverage Audit & Docs Restructure — Master Plan

> **Status:** PLAN ONLY — no source/doc/preview files have been edited. Awaiting approval before execution.
> **Date:** 2026-06-29 · **Mode:** build local, stop at publish/deploy.
> **Method:** 12 parallel Opus subagents audited every canonical component against the ground-truth API (canonical `.tsx` + `.test.tsx`) vs what the docs actually demonstrate (`.mdx` + `preview/*.tsx`). Raw per-batch findings are preserved in [`raw-findings/`](./raw-findings/).

This plan covers two deliverables you asked for:

- **Part A — Restructure** the docs into a proper section taxonomy (today: one near-flat list of 68 components with a single `---Communication---` divider).
- **Part B — Coverage fixes** so every component demonstrates _all_ its variants / props / states, with the **"full matrix where useful"** bar you selected, plus corrects docs that are out of date.

---

## The documents in this plan

| File                                                                           | What it contains                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`README.md`](./README.md)                                                     | This overview — scope, methodology, priority tiers, decision points, execution order.                                                                                                                                                 |
| [`01-section-taxonomy.md`](./01-section-taxonomy.md)                           | **Part A.** The proposed 13-section taxonomy, the exact new `components/meta.json`, foundations/utilities/nav fixes, and the missing foundation pages worth adding.                                                                   |
| [`02-correctness-hotlist.md`](./02-correctness-hotlist.md)                     | **P0 — verified stale-doc bugs.** Docs that actively contradict the component (asterisks that don't render, rings that don't exist, wrong token names, wrong counts). Each independently grep-verified against source with file:line. |
| [`03-coverage-scorecard-and-sweeps.md`](./03-coverage-scorecard-and-sweeps.md) | The full 68-component scorecard (coverage %, severity, effort) + the 7 cross-cutting patterns to fix as repo-wide sweeps.                                                                                                             |
| [`04-per-component-fixes.md`](./04-per-component-fixes.md)                     | **Part B.** Per-component actionable fix lists, grouped by the new taxonomy. Each entry: exact gaps, new preview exports to add, AutoTypeTables to add, matrices to add, prose to correct.                                            |
| [`raw-findings/`](./raw-findings/)                                             | The 12 unedited subagent audit files (full detail, citations, per-component verdicts).                                                                                                                                                |

---

## Headline numbers

- **68 components** audited (= 68 doc pages = 68 previews). Only file-name quirk: `sonner.tsx` is documented at `toast.mdx` — **intentional and self-documented**, not a defect.
- **0 missing pages, 0 fully-missing previews** — the problem is _thin_ coverage, not absent docs.
- **11 verified correctness bugs** (stale docs contradicting the component) — see `02`.
- **~8 components with MAJOR coverage gaps** (under-demonstrate a large share of their API): `copy-button`, `country-select`, `empty-state`, `state-select`, `truncated-text`, `color-picker`, `label`, `checkbox`.
- **Strongest pages** (reference-grade, ~90%+, leave mostly alone): `dropdown-menu`, `context-menu`, `slider`, `field`, `command`, `select`, `badge`, `marker`, `progress-indicator`, `tooltip`, `alert-dialog`, `bubble`.
- **Section taxonomy:** flat list of 68 → **13 grouped sections**.

---

## Priority tiers (how to sequence Part B)

| Tier   | What                               | Why first                                                                    | Where             |
| ------ | ---------------------------------- | ---------------------------------------------------------------------------- | ----------------- |
| **P0** | Correctness bugs (stale docs)      | They mislead consumers and erode trust; cheap to fix; no new previews needed | `02`              |
| **P1** | Major coverage gaps (8 components) | Largest share of undemonstrated API; biggest reader payoff                   | `04` (flagged ⛔) |
| **P2** | Cross-cutting sweeps (7 patterns)  | Fixing once, systematically, beats fixing 30 times ad-hoc                    | `03`              |
| **P3** | Moderate per-component gaps        | The long tail of "one or two undemonstrated props/states"                    | `04`              |
| **P4** | Polish matrices on strong pages    | "Full matrix where useful" finishing touches                                 | `04` (flagged ✨) |

Part A (restructure) is independent of Part B and can ship first — it's low-risk and immediately improves findability.

---

## Decision points (need your call before/at execution)

These are the only genuinely open choices; everything else is mechanical.

1. **Taxonomy approval** — the 13-section grouping in `01`. Approve as-is, or adjust the boundary calls below.
2. **`marker` placement** — currently under `---Communication---`. It's a thread-annotation row used in message threads, but two auditors argued it's a generic indicator → Data Display. Proposal keeps it in **Chat & Communication**. Confirm or move.
3. **`toggle` / `toggle-group`** — placed in **Buttons & Actions** (they share `toggleVariants`, sit next to Button). `toggle-group` is selection-like; could move to Selection Controls. Proposal: keep in Buttons & Actions.
4. **`filter-bar`** — placed in **Data Display** (it filters lists/tables). One auditor suggested Navigation (page chrome). Proposal: Data Display.
5. **`select` `multiple` ambiguity** — `Select` has a `multiple` type param, yet its Do/Don't says "never pick multiple values inline." This is a _product_ decision, not a doc bug: either (a) document multi-select and drop the contradictory Don't, or (b) mark `multiple` intentionally unsupported and note it. **Needs your intent.**
6. **Restructure mechanism** — proposal uses `---Section---` dividers in a single flat `components/meta.json` (preserves every `/docs/components/<name>` URL; zero file moves). Alternative is sub-folders (breaks URLs). Proposal: dividers.
7. **Missing foundation pages** (`01`) — Radius, Elevation/Shadow, Spacing, Theming/Dark-mode, Accessibility, Design Principles, Changelog are all standard and the tokens already ship. In scope for this effort, or a separate follow-up?

---

## Coverage bar (as you selected: "full matrix where useful")

For Part B, the standard each component is held to:

- Every **CVA variant value**, every **size**, every **boolean/enum prop value**, and every **interactive state** (default / hover / focus / loading / disabled / error-invalid / empty / checked / indeterminate / open / …) is demonstrated **at least once in a live `<ComponentPreview>`** — not just a code block.
- Where **two axes interact meaningfully** (e.g. `badge` variant×color, `switch` size×on/off, `status-icon` status×size, `button` variant×size), add a **combination grid** — but only where it reveals a real visual difference. Per-component matrix recommendations are in `04`; cases where a matrix adds _no_ signal are explicitly marked "skip."
- Every **public exported type / subcomponent / data helper** appears in an `<AutoTypeTable>` (or a hand-written `<TypeTable>` where the type can't introspect), or carries an explicit "accepts standard `<element>` props" note.

---

## Execution model (when approved)

Per the single-source-of-truth rule (AGENTS.md): components live in 3 synced places. For Part B, **most fixes touch only `apps/docs/components/preview/*.tsx` (preview compositions) and `apps/docs/content/docs/*.mdx` (prose/sections/tables)** — neither is the canonical component, so `registry:build` is **not** required for those. The handful of fixes that touch a canonical component (none are currently required — all gaps are doc/preview-side) would follow edit-canonical → `npm run registry:build`.

- `preview/*.tsx` — add new named exports for missing variants/states/matrices; fix the stale comments.
- `*.mdx` — add/replace `<ComponentPreview>` references, add `<AutoTypeTable>`/`<TypeTable>` rows, fix stale prose, add missing sections.
- `*/meta.json`, `index.mdx`, `app/(home)/page.tsx` — Part A restructure + count fix.

Suggested order: **Part A** (restructure, low-risk) → **P0 correctness** → **P1 majors** → **P2 sweeps** → **P3/P4 tail**. Recommend executing in batches mirroring the audit batches so each is independently reviewable.
