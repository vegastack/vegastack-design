# Plan — Commissioned components: `data-grid`, `filter-bar-managed`, `board` + 13 supporting items

> **Status:** DRAFT — awaiting MK approval. No code written.
> **Authored:** 2026-07-26.
> **Operating mode:** build LOCAL, stop at publish/deploy. This plan never runs `npm publish`,
> the Deploy workflow, a shipping `changeset version`, or any push beyond a working branch.
> Those are MK's to trigger, per `AGENTS.md` §Escalation.
> **Blocked on:** three dependency decisions and four scope calls in §2. Two of them
> (the DnD engine, TanStack) change component designs, not just implementation details, so
> nothing should be scheduled before they are settled.

---

## 1. Why this plan exists

**MK is exercising an option the ledger deliberately left open.** Round 3 raised an impasse; round 4
closed it by re-scoping, and recorded what remained available:

> "The round-3 DataList/TextEdit impasse is resolved by Codex's own accepted path (b): I FORMALLY
> re-scoped them … with full-parity `data-grid` / `text-edit-collab` as SEPARATE deferred inventory
> items. … **MK can still later commission the deferred full-parity components**, but the completion
> gate is now honest WITHOUT requiring that — so it is no longer a blocker."
> — `docs/ledger/operator-review.md:121` (2026-06-21, Codex round 4)

So this is **not** the resolution of a standing blocker, and the plan should not be read as unblocking
anything. Nothing is broken today. This is the commission that round 4 said could come later, arriving.
The locked inventory records the same two items as deferred-pending-commission:

> "DataList — `data-list` presentational core v1 …; the full data-grid (search/paging/drag/**Kanban**/
> grouping/persistence) is a separate **deferred `data-grid`**" — `docs/requirements.md:487`
>
> "A full-featured **`data-grid`** that owns those is a separate **deferred** component (build only if
> commissioned)." — `docs/requirements.md:497`
>
> "a fully-stateful `filter-bar-managed` is a separate, deferred inventory item."
> — `docs/requirements.md:518`, `apps/docs/content/docs/components/filter-bar.mdx:150`

**What the demand actually is, stated honestly.** VegaStack CRM's phase specs
(`~/projects/vegastack-crm/docs/plans/phase-0*.md`) describe 47 routable surfaces, of which 9 use a
data grid, 7 a filter builder and 6 a timeline. Those totals come from
`vegastack-crm/docs/implementation/01-ui-inventory.md:10`, a doc derived from the phase specs on
2026-07-26 by the author of this plan — so the corroboration is **circular, not independent**.
**That repository currently contains one commit and no source code** — the surfaces are rows in a
markdown table written the day before this plan, and
`vegastack-crm` is not among the sanctioned reference repos (`AGENTS.md` §Repo map). It is a credible,
specific and dated _forecast_ by the same owner who commissions this work — but it is intent, not
observed demand, and this plan does not dress it up as the latter. Where an item's only justification
is a CRM markdown row, §3.2 says so explicitly and argues the item on design-system grounds instead.

`DataList` and `FilterBar` remain correct at their declared presentational-core scope. Every item
below either **is** one of the deferred siblings G7 anticipated, or is a genuinely absent primitive.
One item — `sortable-list` — does reclassify a behaviour the shipped docs currently call app-coupled;
that is argued openly in §7.9 rather than asserted away.

### What this plan is not

- Not a port of `engg-vegastack-platform`'s `VegaDataList`. That component
  (`src/components/common/vega-data-list.tsx`, **3,805 lines**) fuses table, kanban, DnD, selection
  bar, grouping, roving nav and pagination into one file with hardwired `next-intl`, `VegaButton`
  and `VegaEmptyState` dependencies. It is an excellent **behaviour reference** — its board API in
  particular (§7.2) — and a poor architectural one.
- Not a rewrite of `DataList` or `FilterBar`. Both stay, unchanged in scope. §8 lists small
  **non-breaking** improvements to `DataList` that stand on their own merit.

---

## 2. Decisions required before any code

### 2.1 Dependency sign-offs (`AGENTS.md` §Escalation — "Needs MK, always")

Current sanctioned list per `AGENTS.md:150-155`: `@shadcn/react/message-scroller` ("the ONLY
non-Base-UI headless primitive"); `react-resizable-panels`, `recharts`, `motion`, `tiptap`, `sonner`
(renderer/behaviour engines). **Note the prose is already stricter than the registry:**
`registry.json` also carries `react-day-picker@^10` — a headless date engine — plus `next-themes`,
`react-markdown` and `remark-gfm`, none of which appear in either bullet. So the "nothing else" line
describes an intent that shipped items have already stretched; that is an argument for restating the
boundary deliberately (§2.1 below), not for quietly widening it again. All versions, licences and peer ranges below re-verified **2026-07-27** via `npm view`.

| #      | Ask                                                                                                                                                               | Class                  | For                                                                  | Recommendation                                                                                                                                                                                                                                                                                 |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D1** | `@tanstack/react-table` **8.21.3** (MIT, 1 dep)                                                                                                                   | **headless primitive** | `data-grid` row models: sorting, grouping, faceting, column ordering | **Take it.** 14.6 kB of table maths we would otherwise reimplement. shadcn/ui ships its Data Table _as a guide over TanStack Table_, not as a component — the same call. v9 is at `9.0.0-beta.58`; ship v8, plan the migration. Peer is `react >=16.8` — it does not name React 19 explicitly. |
| **D2** | `@tanstack/react-virtual` **3.14.8** (MIT; peer `^16.8                                                                                                            |                        | ^17                                                                  |                                                                                                                                                                                                                                                                                                | ^18 |     | ^19`) | measurement engine | long grids, long timelines | **Take it, same sign-off as D1** — one vendor, headless, documented together. `timeline` may not need it (§7.3). |
| **D3** | `@atlaskit/pragmatic-drag-and-drop` **2.0.1** + `-hitbox` **2.0.0** + `-react-accessibility` **3.1.4** (Apache-2.0; the three sub-packages version independently) | **headless primitive** | `board`, `sortable-list`, grid column reorder                        | **Take it — §2.2 has the comparison.** Stable major, framework-agnostic, production-proven at Jira/Trello scale, entry-point-split so unused adapters cost nothing.                                                                                                                            |
| **D4** | `react-dropzone` **19.1.1** (5.6 kB gz, MIT, released 2026-07-19; peer `react >= 18`)                                                                             | **headless primitive** | `use-file-drop`, `dropzone`                                          | **Take it.** Hand-rolling gets the drag-depth counter wrong, skips directory traversal via the FileSystem Access entries API, and usually ships a keyboard-inoperable drop target. Kibo UI — the main advanced shadcn registry — made the same call.                                           |

**These are NOT in-pattern, and the ask must not be dressed up as if they were.** An earlier draft
claimed they matched the existing `chart`→`recharts` / `text-edit`→`tiptap` precedent. They do not.
`AGENTS.md:150-155` draws a hard line between two classes:

> "**Headless primitive** — `@shadcn/react/message-scroller` (MessageScroller) is the ONLY
> non-Base-UI headless primitive. **Nothing else.**
> **Renderer / behavior engines** — `react-resizable-panels`, `recharts`, `motion`, `tiptap`, and the
> pre-existing `sonner`. … **These render or animate; they do not own interaction semantics**, which
> is why they are a narrower class than the primitive exception above."

By that test: Pragmatic DnD owns drag lifecycle and hit-testing; react-dropzone owns the drop
lifecycle and `accept` matching; TanStack Table owns row models. All three render nothing. They are
**headless primitives** — the class AGENTS.md closed with two words. Only D2 is arguably a
measurement engine rather than a primitive.

**So the ask is explicit: widen the headless-primitive allowlist from one entry to four.** That is a
larger decision than "add a dependency", and it should be made as such, with the line in AGENTS.md
§Sanctioned dependency exceptions rewritten to name them.

**Fallback if MK declines**, so the plan is complete either way: `use-drag-reorder` (§7.11) becomes a
hand-rolled pointer + keyboard model — §7.11 already contemplates this and it is the reason that hook
exists; `use-file-drop` (§7.13) hand-rolls the drag-depth counter and forgoes directory traversal;
and `data-grid` owns its own sort/group/faceting row models, adding roughly a component's worth of
work to the largest item in the plan. None of the three becomes impossible; all three become
slower and more of our code to maintain. `board`'s and `sortable-list`'s **designs** do not change,
because the menu-equivalent path is mandatory regardless (§2.2).

### 2.2 D3 in detail — the DnD engine

There is **no drag-and-drop code or dependency anywhere in the registry today**: a grep for
`onDrop|onDragOver|draggable|DataTransfer` across non-test `registry/ui/*.tsx` returns only
`resizable.tsx` (react-resizable-panels) and prose in `slider.tsx`.

| Option                                  | Version / last release                                 | React 19                    | Licence    | Keyboard a11y                                                                                                                                                                   | Verdict                                                                                           |
| --------------------------------------- | ------------------------------------------------------ | --------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `@dnd-kit/react` + `@dnd-kit/dom`       | **0.5.0**, 2026-06-11 (0.5.1 betas through 2026-07-13) | peer `^18 \|\| ^19` ✅      | MIT        | `KeyboardSensor` (Space lift, arrows, Space drop, Esc cancel) + `DndContext` live region with customisable `announcements` + `@dnd-kit/accessibility`                           | **Recommended**, with eyes open: pre-1.0, API still moving                                        |
| **`@atlaskit/pragmatic-drag-and-drop`** | **2.0.1**, 2026-06-17 (very active)                    | ✅ framework-agnostic       | Apache-2.0 | **pointer-only by default**; keyboard ships as `-react-accessibility`, and Atlassian's own user testing pushed them toward "Move to…" action menus rather than directional keys | **Recommended — see below**                                                                       |
| `@dnd-kit/core` v6.3.1                  | **2024-12-05 — 19 months, no release**                 | peer `>=16.8`; RSC friction | MIT        | good                                                                                                                                                                            | **Reject.** This is what `engg-vegastack-platform` runs today; the org is on an unmaintained line |
| `@hello-pangea/dnd`                     | 18.0.1, 2025-02-09 — 17 months                         | ✅                          | Apache-2.0 | best-in-class                                                                                                                                                                   | **Reject** — stagnant, and weak on multi-column grid/flex layouts                                 |
| `motion` (already sanctioned)           | 12.42.2                                                | ✅                          | MIT        | **none**                                                                                                                                                                        | **Cannot substitute — see below**                                                                 |

**On `motion`: I checked whether the already-sanctioned dependency could cover this, because that
would avoid the ask entirely. It cannot.** `Reorder` is still shipped and current, but it is
documented as _"drag-to-reorder lists, like reorderable tabs or todo items"_ — single list, single
axis. Cross-list dragging is a long-standing open request
([motiondivision/motion#1435](https://github.com/motiondivision/motion/issues/1435)), multi-axis is
[#1400](https://github.com/motiondivision/motion/issues/1400), and the docs never mention keyboard
at all — `Reorder.Item` is pointer-drag only, so a keyboard or screen-reader user cannot move a
card. A kanban needs exactly those three things. Motion stays the right tool for the board's
_animation_ (layout projection on reflow), not its input model.

**Recommendation: `@atlaskit/pragmatic-drag-and-drop`, for four reasons.**

1. **A design system must not ship a 0.x dependency in a copy-in component.** `@dnd-kit/react` is at
   0.5.0 with a moving API; consumers own the copied source forever and cannot easily re-take a
   breaking upgrade. Pragmatic is on a stable major with a published deprecation policy. This point
   alone decides it for a registry whose whole premise is copy-in ownership.
2. **Production validation at a scale nothing else here has.** It powers Jira and Trello boards —
   the exact workload `board` is being built for.
3. **Framework-agnostic and entry-point-split.** It attaches to DOM elements rather than wrapping a
   React tree, so it survives a React major and does not fight Base UI's own event handling; unused
   adapters cost nothing at the barrel.
4. **What looks like its weakness is actually our requirement.** Pragmatic is pointer-first, with
   keyboard delivered through `-react-accessibility` and Atlassian's documented preference for
   "Move to…" action menus. The CRM spec **already mandates exactly that**: a lossless menu
   equivalent (`phase-04 §5.1`), with drag disabled below 768px (`§5.9`), because a board must be fully
   operable by keyboard and on mobile. We were going to build that menu regardless. With dnd-kit we
   would build it _in addition to_ its directional-key model; with Pragmatic it _is_ the model.

`use-drag-reorder` (§7.11) wraps it, so the engine stays swappable if that judgement ages badly.

**We still own the keyboard layer, and the plan budgets for it.** Pragmatic gives drag mechanics and
hit-testing; the Space-lift/arrow-move/Space-drop path, the live-region announcements, and the
"Move to…" menu are ours. That is deliberate: it is the part that must match this system's
interaction voice, and it is the part no library gets right for a specific product.

### 2.3 Scope calls

| #      | Question                                                                                                                                                                                | Recommendation                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **S1** | Kanban inside `data-grid`, or a separate `board`? `requirements.md:497` implies the former.                                                                                             | **Separate `board`.** A column of deal cards shares no rendering, no column model, no cell model and no keyboard model with a data grid. Fusing them yields one component with two unrelated modes and a prop surface where most props are invalid in the other mode. They should share only the drag primitive (§7.11).                                                                                           |
| **S2** | Does `filter-bar-managed` include the nested and/or **group builder**? Its recorded scope is narrower ("active-filter state, clear-all, editable chip popovers, AI-suggested filters"). | **Yes, widen it** — but keep the _grammar_ host-injected. The component owns the builder tree (group/condition rows, add/remove, depth capping, a per-type editor registry); the host supplies a field vocabulary describing which fields exist and which operators they accept. That keeps the CRM's filter AST out of the design system while making the component reusable by any app with a different grammar. |
| **S3** | `bulk-bar`: standalone, or part of `data-grid`'s selection API?                                                                                                                         | **Standalone and purely presentational.** `DataList` already owns `selectable` / `selectedIds: Set<string>` / `onSelectionChange` / `getRowId` (`data-list.tsx:88-114`) and documents its `toolbar` slot as the mount point for _"bulk actions"_ (`:166-173`). `bulk-bar` must **consume** that selection, never fork it. It also serves campaign-member surfaces that are not grids.                              |
| **S4** | `money-input` as specified, or something better?                                                                                                                                        | **Replace it with `number-field`.** See §7.5 — the roster has no numeric input at all, Base UI ships a complete `NumberField`, and "money" is a `format` prop away. A CRM-specific `money-input` in a general design system is the wrong shape.                                                                                                                                                                    |

---

## 3. Inventory & verdicts

Structured in three layers (§3.2). **16 items, not 10** — the increase is deliberate decomposition,
not scope growth: five behaviours that were buried inside larger components are pulled out because
each has consumers beyond the component that motivated it. **Nothing is deferred and nothing ships
as a workaround** — where an earlier draft proposed "compose it from existing parts", the item is
now built properly, because a documented recipe is a cost every consumer pays forever.

**Layer 1 — behaviour hooks** (`registry:hook`, no DOM, no styling)

| #   | Item               | Consumers                                                                                              | Depends on |
| --- | ------------------ | ------------------------------------------------------------------------------------------------------ | ---------- |
| 1   | `use-list-nav`     | `data-grid`, `board`, `sortable-list`, ⌘K-style lists, **and the two existing sites it de-duplicates** | —          |
| 2   | `use-drag-reorder` | `board`, `sortable-list`, `data-grid` column reorder                                                   | D3         |
| 3   | `use-file-drop`    | `dropzone`, **rich-text paste/drop**, any bespoke drop target                                          | D4         |
| 4   | `use-platform`     | `shortcut-overlay`, `Kbd`'s `os` prop, `Command`, any modifier-key copy                                | —          |

**Layer 2 — single-purpose primitives** (`registry:ui`, usable standalone)

| #   | Item               | Consumers                                                                        | Depends on |
| --- | ------------------ | -------------------------------------------------------------------------------- | ---------- |
| 5   | `editable-cell`    | `data-grid`, **`PropertyList`, `SettingsRow`, `Item` rows, record detail pages** | —          |
| 6   | `number-field`     | money, quantities, percentages, limits                                           | —          |
| 7   | `chip-input`       | domains, emails, tags, webhook events, recipients                                | —          |
| 8   | `action-bar`       | bulk selection, **unsaved-changes bars, batch-progress bars**                    | —          |
| 9   | `timeline`         | activity feeds, audit trails, delivery logs                                      | D2         |
| 10  | `stepper`          | onboarding, wizards, checkout, import flows, **and the CRM's `StageStepper`**    | —          |
| 11  | `dropzone`         | file upload surfaces                                                             | 3, D4      |
| 12  | `sortable-list`    | settings reordering, ordered taxonomies                                          | 2          |
| 13  | `shortcut-overlay` | any app with keyboard shortcuts                                                  | 4          |

**Layer 3 — compositions** (`registry:ui`, multi-part, own genuine cross-part state)

| #   | Item                 | Status                              | CRM surfaces unblocked | Depends on                         |
| --- | -------------------- | ----------------------------------- | ---------------------- | ---------------------------------- |
| 14  | `data-grid`          | **Commission** (deferred inventory) | 9                      | 1, 5, D1, D2, 2 for column reorder |
| 15  | `filter-bar-managed` | **Commission** (deferred inventory) | 7                      | —                                  |
| 16  | `board`              | New                                 | 1 (the centrepiece)    | 1, 2, D3, S1                       |

### 3.1 Two reversals — `stepper` and `shortcut-overlay` are built, not documented

An earlier draft recommended shipping these as composition recipes because existing parts get close.
That was the wrong call, and the reasoning is worth recording so it is not re-made.

**A documented recipe is not free — it is a cost moved onto every consumer, forever.** It has no
prop table, no `AutoTypeTable`, no axe test, no behaviour-contract route, no VRT coverage, and no
`meta.whenToUse` for an agent to find. It cannot be improved centrally: a focus bug found in the
CRM's wizard stays fixed only in the CRM's wizard. And "compose these four primitives yourself"
guarantees four subtly different implementations across four apps — which is precisely the failure
this design system exists to prevent. A recipe is the right answer when the composition is trivial
and the semantics are obvious. Neither is true here.

**`stepper`.** What the existing parts give you is the _progress display_:
`ProgressIndicator segments` is purpose-built for step counts (`progress-indicator.tsx:62-71`) and
`OnboardingChecklist` ships a stepped card (`onboarding-checklist.tsx:112-164`). What none of them
gives you is the part that is actually hard and actually easy to get wrong:

- **focus management on step change** — move focus to the new step's heading, not to the first
  field, or a screen-reader user hears nothing and a keyboard user is thrown to the top of the form;
- **`aria-current="step"`** plus a correctly-labelled ordered list, which `Tabs` does _not_ provide
  (tabs are a different pattern with different semantics — using `role="tab"` for a linear wizard
  actively misleads assistive tech);
- **advance gating** — a `canAdvance` contract per step, with the blocked reason announced;
- **step state** — complete / current / upcoming / **error**, where error is the state every
  hand-rolled stepper forgets;
- **orientation**, since a vertical stepper and a horizontal one are the same semantics.

Base UI has no stepper and shadcn has none, so there is no upstream to defer to. Two CRM consumers
exist today (`/setup`, the import wizard) and a third is adjacent (`StageStepper` on the deal
record). Build it.

**`shortcut-overlay`.** Same shape of argument. `Kbd` + `Dialog` + `ScrollArea` + `Item` render it,
but the component's real content is a **shortcut registry** — declare a shortcut once, with a
category, and have it appear in the overlay, in tooltips, and in `Command` — which is exactly what
the platform built (`lib/keyboard-shortcuts.ts`, 333 lines, registry-driven) because hand-listing
shortcuts in a dialog goes stale the day someone adds a binding. That registry, plus the `os`
detection `Kbd` exposes as a manual `os` prop with no detector behind it (`kbd.tsx:67-72` is the
prop's JSDoc and nothing more — the source states no rationale), is a real component.

It also surfaces a genuine hole: **nothing in the system detects the platform**, so every consumer
of `Kbd`'s `os` prop is currently guessing or hardcoding. Hence `use-platform` (item 4) — small, but
it makes `Kbd` correct by default everywhere rather than correct only where someone remembered.

**The one thing that stays a Guides page** is _how to assemble a multi-step form_ — `stepper` +
`Field` + validation + the CRM's command layer. That is genuinely app-specific orchestration, and it
now documents a real component rather than substituting for one.

### 3.2 Decomposition — what ships standalone, and why

The cautionary tale is in the reference implementation. `engg-vegastack-platform`'s `VegaDataList`
is **3,805 lines in one file** holding table + kanban + drag-and-drop + selection bar + grouping +
roving keyboard navigation + pagination. It has ~20 unrelated consumers, so the _concept_ is
proven — but nothing inside it can be used on its own. Its selection bar is not exported. Its roving
navigation is inlined twice, once for list mode and once for board mode. Its board and its table
share a props object in which most keys are invalid for the other mode. A design system that ported
that shape would inherit the coupling and none of the reuse.

So every item is placed against three tests:

1. **Does a second consumer exist?** Graded by evidence, not treated as one thing (§1): **observed**
   = code in this registry or in `engg-vegastack-platform`; **forecast** = a row in the CRM's phase
   specs, which today are markdown with no source behind them. Observed evidence carries an item on
   its own. Forecast evidence has to be paired with a design-system argument that stands without it.
2. **Is it behaviour or is it chrome?** Behaviour with no DOM opinion becomes a `registry:hook`, so
   an app that wants entirely different chrome still gets the hard part. Chrome becomes a component.
3. **Would inlining it force a future consumer to copy code?** The roving-tabindex block already
   exists twice in this registry (`color-picker.tsx:166-232`, `emoji-picker.tsx:566-630`). That is
   the failure mode, already happening, at a small scale.

Applying those tests moved four things out of the components that motivated them. Evidence grade is
stated per row, so a reviewer can discount the forecast ones:

| Pulled out of             | Item                   | Evidence       | Second consumer that justifies it                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------- | ---------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data-grid` + `board`     | **`use-list-nav`**     | **observed**   | The roving-tabindex block exists **today, twice, in this registry** (`color-picker.tsx:166-232`, `emoji-picker.tsx:566-630`). This one needs no forecast at all — it is de-duplication of shipped code                                                                                                                                                                             |
| `dropzone`                | **`use-file-drop`**    | **observed**   | `engg-vegastack-platform` has **two** independent drop implementations — the comment composer (`issue-activity.tsx:1116-1531`) and TipTap image paste (`vega-text-edit.tsx:774-870`) — precisely because no shared hook existed. A rich-text editor accepting a pasted image does not want a `Dropzone`'s visual surface, only its acquisition logic                               |
| `board` + `sortable-list` | **`use-drag-reorder`** | **structural** | Two consumers inside this plan, plus grid column reorder. Independent of demand: it isolates the D3 dependency behind one file, which is the only thing that makes an engine swap cheap                                                                                                                                                                                            |
| `data-grid`               | **`editable-cell`**    | **forecast**   | The CRM edits inline on `PropertyList`/`Card` record pages, not tables. The design-system argument that stands without the CRM: `FieldInline` covers one control with no async state, and every optimistic inline edit anywhere needs pending/saved/error plus conflict revert — the vocabulary `AutoSaveInput` already ships (`auto-save-input.tsx:18`) for exactly one component |

And one item was **generalised rather than specialised**:

- **`bulk-bar` → `action-bar`.** The CRM needs a floating contextual bar for bulk selection
  ("5 selected · Tag · Archive"), but the same object serves an unsaved-changes bar
  ("Unsaved changes · Discard · Save") and a batch-progress bar ("Importing 340 of 1,000 · Cancel").
  Naming it for one caller would have guaranteed a near-duplicate later. `action-bar` takes a
  status slot and action children; bulk selection is a documented recipe over it, not its identity.

**The converse discipline matters just as much: these three stay whole.** `data-grid`,
`filter-bar-managed` and `board` each own genuine cross-part state — a cell focus registry, a
condition tree, a column/drag model — where splitting would mean exporting a context and asking
consumers to wire it. That is the shape of `SidebarContext` (`sidebar.tsx:46-61`), and it is a
deliberate exception in this system, not a default.

**One shared-geometry note.** A vertical `timeline` rail and a vertical `stepper` draw the same
thing: a connector line with a node per entry, first/last half-rails, and a content gutter. They are
**not** the same component — a timeline is a chronological record with timestamps and actors, a
stepper is a bounded linear process with current/complete/upcoming/error states and advance gating —
but they share that geometry. Build `timeline` first (§6 phase 3), and if the rail turns out to be
genuinely identical rather than merely similar, extract it as a shared internal module at that
point. **Do not pre-abstract it**: two consumers is the threshold this plan uses everywhere else
(§3.2), and guessing at the seam before either exists is how design systems acquire a `Rail`
primitive nobody can explain.

### 3.3 Reference harvest — what to take from the platform, and what to leave

`engg-vegastack-platform` is a working, production-tested implementation of much of this. It is a
**behaviour reference**: port the hard-won interaction decisions, re-express them on Base UI +
semantic tokens, discard the app coupling (`next-intl`, `VegaButton`, `VegaEmptyState`, Electric SQL,
zustand). Nothing is copied verbatim.

| Reference                                                                                                                                                     | Take                                                                                                                                                                                                                                                                           | Leave                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vega-data-list.tsx:1020-1360` (`BoardColumnComponent`, `SortableBoardCard`, `DroppableColumn`, `CollapsedColumnStrip`, `EmptyColumnTarget`, `BoardSkeleton`) | The **content/chrome split** — the app renders card content only, the component owns all chrome, collapsed strips, per-column skeletons. This is the cleanest boundary in that codebase                                                                                        | The fused props object; `framer-motion` for drag; the single-file packaging                                                                                                                      |
| `vega-data-list.tsx:948` `boardCollisionDetection`                                                                                                            | The custom collision strategy — default rect-intersection mis-targets narrow columns                                                                                                                                                                                           | dnd-kit v6 specifics (D3 may change the engine)                                                                                                                                                  |
| `vega-data-list.tsx:2610-2700` + `:3201-3402`                                                                                                                 | The roving-nav model, including Shift+Arrow range extension and the **board variant's cross-column `←`/`→`**                                                                                                                                                                   | That it is inlined twice → this becomes `use-list-nav`                                                                                                                                           |
| `vega-data-list.tsx:77` `hasOpenOverlay()` (18 lines)                                                                                                         | The **suppress-navigation-while-an-overlay-is-open** rule. Roving nav is broken without it and nobody remembers until a dialog eats arrow keys                                                                                                                                 | The global DOM scan → expose as a `shouldHandle?: () => boolean` predicate                                                                                                                       |
| `vega-data-list.tsx:866` `SelectionBar`, `:773` `floatingBarVariants`                                                                                         | Container-measured horizontal centring via `getBoundingClientRect` (**not** `left: 50%`, which mis-centres against a sidebar), and the desktop-only posture                                                                                                                    | `framer-motion` `AnimatePresence` → the system's `data-[active=false]:translate-y-full` + `ease-exit`/`ease-emphasized` recipe (`message-scroller.tsx:219`) already does this in CSS             |
| `vega-data-list.tsx:435` `computeDesktopVisibleKeys` + per-column `mobile: "visible"\|"hidden"\|"merge"`                                                      | **Responsive column revelation** — measuring the container against per-column `minWidth` and merging low-priority columns into the primary cell on narrow screens. Genuinely good, and it is _not_ the same thing as a user-facing column picker; `data-grid` should have both | The `next-intl` coupling                                                                                                                                                                         |
| `data-lists-client.tsx:1820`                                                                                                                                  | The documented constraint _"Don't mix draggable with selectionActions on the same list"_ — encode as a dev-time warning                                                                                                                                                        | —                                                                                                                                                                                                |
| `vega-relative-day.tsx` (`VegaRelativeDay`, `getDayKey`) + `notifications-panel.tsx:112` `groupByCalendarDay`                                                 | The **day-grouping model** for feeds, including the midnight-rollover refresh                                                                                                                                                                                                  | The component itself — `RelativeTime` already covers it (`relative-time.tsx:99-155`), and its deliberate no-`aria-live` policy (`:173-177`) is the better call                                   |
| `src/lib/upload/hooks/use-staged-files.ts` (452 lines)                                                                                                        | The per-file state machine `validating → presigning → uploading → uploaded → confirming → confirmed \| error` and real XHR progress — align `use-file-drop`'s rejection vocabulary and `AttachmentState` with it                                                               | The R2/presign specifics — that is app territory, and stays app territory                                                                                                                        |
| `issue-activity.tsx:1116-1531`                                                                                                                                | The **drag-depth counter** (child-element `dragleave` flapping) and the window-level `preventDefault` that stops a missed drop navigating the browser away. Both are bugs everyone hits once                                                                                   | 2,765 lines of Electric SQL, TipTap, reactions and approvals                                                                                                                                     |
| `shortcuts-dialog.tsx` + `lib/keyboard-shortcuts.ts`                                                                                                          | The **registry-driven** overlay model — shortcuts declared once, grouped by category, rendered from data rather than hand-listed                                                                                                                                               | zustand; and note `Kbd` already owns key rendering + the `os` modifier map (`kbd.tsx:33-47`)                                                                                                     |
| `inline-cell-popovers.tsx` (346 lines)                                                                                                                        | The observation that real inline editors are **popover-based per type** (status, priority, assignee, date), not a single text input — this shapes `editable-cell`'s `EditorSpec`                                                                                               | The app-specific editors themselves                                                                                                                                                              |
| `vega-filter-bar.tsx` (476 lines)                                                                                                                             | Chip-row presentation patterns                                                                                                                                                                                                                                                 | The data model — it is flat, implicitly AND-ed, and serialises to comma-joined URL params (`filter-params.ts`) that **cannot express nesting**. `filter-bar-managed` needs a tree from the start |

**Not in the platform at all** — no prior art to harvest, build from Base UI up: stepper, money/number
input, chip input, nested filter builder, multi-key sort, user-facing column picker, virtualization.

---

## 4. Design-system constraints that shape these components

Not a general style reminder — these are the specific rules from `design.md`,
`tooling/design-lint.mjs` (34 rules) and `AGENTS.md` that **change the design** of the items below.
Each one below has bitten a plausible first implementation.

| Constraint                                                                                                                                                                                                                                                                                                                                                                        | Where                                                                                                                                                                   | What it forbids in these components                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `style={}` may set **only** `--*` custom properties; any `#hex`/`Npx`/`Nrem` literal inside a style expression fails unconditionally (`:589-594`). Two carve-outs exist and neither helps here: dynamic `backgroundColor`/`background` for the color-picker swatch (`:602-608`), and a bare variable reference `style={obj}` which is validated at its construction site (`:599`) | design-lint `inline-style`                                                                                                                                              | The obvious implementation of board column widths and grid `gridTemplateColumns`. Both must go through CSS custom properties set on the root and consumed by a class.                             |
| Arbitrary values `*-[…]` are legal in exactly four forms: `var(--token)`, `calc()` containing a `var()`, a layout primitive of `fr`/`%`/`auto`/`min-content`/`max-content`/`0` (incl. `minmax()`, finite `repeat()`), or a CSS-wide keyword                                                                                                                                       | design-lint `arbitrary-value`                                                                                                                                           | `w-[280px]` column widths; `h-[13px]` row heights. `grid-cols-[repeat(3,minmax(0,1fr))]` **is** legal.                                                                                            |
| `flex`/`inline-flex` and `truncate`/`line-clamp-N` may **never** co-occur in one class literal                                                                                                                                                                                                                                                                                    | design-lint `flex-truncate-conflict`                                                                                                                                    | Every grid cell and board card that truncates. Pattern: `flex min-w-0` on the container, `truncate` on an inner span.                                                                             |
| `transition*` must carry `duration-*` **and** `ease-*` in the **same class literal**; `transition-colors` and `transition-all` are banned                                                                                                                                                                                                                                         | design-lint `transition-pairing` (:469-489), `color-transition` (:120-123), `transition-all` (:115-118) — three separate rules                                          | Drag-shimmer, bulk-bar slide-in, chip enter/exit. List properties explicitly, and list `scale` separately from `transform` (`combobox.tsx:476-478`).                                              |
| Only `z-(--z-raised)` and `z-(--z-overlay)`; no raw `z-N`                                                                                                                                                                                                                                                                                                                         | design-lint `raw-z-index`                                                                                                                                               | Drag overlays, the floating action bar, sticky grid headers — **three stacking needs, two bands. Resolved in §4.1 below**, not deferred.                                                          |
| No raw `h-7`/`h-8`/`h-10`, `size-7                                                                                                                                                                                                                                                                                                                                                | 8                                                                                                                                                                       | 10`; use `--size-*`. `h-6`/`size-6` **is** allowed                                                                                                                                                | design-lint `raw-control-size` | Row heights, chip heights, handle sizes. |
| No `size` prop and no `size-3\|4\|5\|6` className on a lucide component                                                                                                                                                                                                                                                                                                           | design-lint `direct-lucide-size` (:905-921). Separately, `raw-icon-size` (:110-113) bans raw sizes in `svg…]:size-N` **selectors** — a different rule, not the same one | Every drag handle, sort glyph, and rail node.                                                                                                                                                     |
| `React.forwardRef` banned; React 19 ref-as-prop; type with `ComponentPropsWithRef`, never `WithoutRef`                                                                                                                                                                                                                                                                            | design-lint `forward-ref`, `docs/ledger/ref-forwarding-spec.md`                                                                                                         | Every export. Multiple refs → `mergeRefs` from `use-animation-replay.ts:274-287`, memoised at the call site.                                                                                      |
| `Omit<…, 'render'>` banned on single-polymorphic-root components                                                                                                                                                                                                                                                                                                                  | design-lint `render-contract`                                                                                                                                           | `TimelineItem`, `BoardCard`, `SortableItem` — all must expose Base UI `render`.                                                                                                                   |
| Weights 400/500 only                                                                                                                                                                                                                                                                                                                                                              | design-lint `raw-heavy-weight`                                                                                                                                          | Column headers, board column titles. Use `text-label-sm` (12/500) for table headers per `design.md` §Typography.                                                                                  |
| Radius caps at `rounded-lg`; `rounded-full` is for tag-like objects and **never** container highlights; nested corners concentric when the gap ≤8px (`outer = inner + padding`)                                                                                                                                                                                                   | `design.md` §Shapes, design-lint `removed-radius-xl`                                                                                                                    | Board cards inside columns; chips inside the chip-input field.                                                                                                                                    |
| Flat by default. Only true overlays get `shadow-overlay`; only the primary action may use `shadow-lit`                                                                                                                                                                                                                                                                            | `design.md` §Elevation                                                                                                                                                  | A dragged card **must not** acquire a drop shadow. Use the surface ladder (Canvas → `secondary` → `card` → Overlay) and the one border.                                                           |
| Focus: text-entry controls get a border-tint on plain `focus`; **everything else** gets the centralized 2px `:focus-visible` outline. Never a colour, never a glow                                                                                                                                                                                                                | `design.md` §Accessibility                                                                                                                                              | Grid cells, board cards, chips, rail nodes. The only permitted deviation is `focus-visible:-outline-offset-2` when an `overflow-hidden` ancestor or a mask would clip the outline entirely.       |
| ≥24px touch targets via an **invisible** hit area (`relative` + `before:absolute before:-inset-N`) — **except inside a native `<button>`**, where Preflight's `appearance: button` clips the pseudo and you must grow the real border box with compensating margins                                                                                                               | `filter-bar.tsx:245-263` (verified write-up)                                                                                                                            | Chip remove buttons, drag handles, rail nodes.                                                                                                                                                    |
| Native `<button>`/`<input>`/`<select>`/`<textarea>` in registry source require an entry in `RAW_INTERACTIVE_EXEMPTIONS` with an exact per-tag count and rationale — **fails closed in both directions**                                                                                                                                                                           | design-lint `raw-interactive-html`                                                                                                                                      | `dropzone`'s hidden file input and `chip-input`'s text input each need a reviewed exemption entry.                                                                                                |
| `'use client'` iff the file calls one of exactly eleven React APIs (`createContext`, `useContext`, `useState`, `useRef`, `useEffect`, `useLayoutEffect`, `useReducer`, `useImperativeHandle`, `useSyncExternalStore`, `useTransition`, `useDeferredValue`) **or** imports `@base-ui/react/use-render`. Forbidden otherwise                                                        | `verify-rsc-safety.mjs` + design-lint `presentational-client-boundary`                                                                                                  | `useCallback`/`useMemo`/`useId`/`use`/`memo` are server-safe. Keep the directive at the lowest leaf: `TimelineItem` can be server-safe even when `Timeline` is not.                               |
| Cross-part state flows via `group/<name>` + `data-*`, **not** React context, unless real behaviour requires it                                                                                                                                                                                                                                                                    | `attachment.tsx:19-23`                                                                                                                                                  | `timeline`, `bulk-bar`, `chip-input` chrome. Context is justified in `data-grid`, `board`, `filter-bar-managed` (real shared behaviour) — matching `SegmentedContext`/`SidebarContext` precedent. |
| No shared `useControlled` helper exists; the inline idiom is written out every time                                                                                                                                                                                                                                                                                               | verified: grep returns nothing                                                                                                                                          | Do not introduce one unilaterally. Either follow the idiom (`onboarding-checklist.tsx:63-72`) or propose the helper as its own hook item.                                                         |
| `role="listbox"` may contain only `option`/`group`; `role="list"` only `listitem`                                                                                                                                                                                                                                                                                                 | `combobox.tsx:432-435`, `tag-group.tsx:205-208`                                                                                                                         | `filter-bar-managed`'s operator pickers; `timeline`'s `ItemGroup`; `bulk-bar` inside a toolbar.                                                                                                   |
| An `aria-label` on a control with visible text violates WCAG 2.5.3 — use `sr-only` text                                                                                                                                                                                                                                                                                           | `onboarding-checklist.tsx:81-88`                                                                                                                                        | Bulk-bar actions, board column menus.                                                                                                                                                             |
| Voice: sentence case; actions are verb + noun; toasts drop the trailing period and never say "successfully"; empty states point to the first action; progress is present participle + ellipsis                                                                                                                                                                                    | `design.md` §Voice                                                                                                                                                      | Every string in every empty state, announcement and default label below.                                                                                                                          |

**One trap specific to grids.** `data-list.test.tsx:676-696` records a verified invariant: the small
checkboxes' 6px hit-area expansion survives inside `TableHead`/`TableCell` for **two** reasons —
those cells have no `overflow-hidden`, **and** the checkbox column's `pl-3` (12px) absorbs the 6px
`before:-inset-1.5`. Adding `overflow-hidden` to a cell — the obvious move for CRM text truncation —
would break the first. **And no test would catch it:** the style mirror (`:700-707`) sets no
`overflow`, and the sole `elementFromPoint` probe (`:758-784`) samples 4px _above_ the box, inside
the cell's `py-2`. The invariant is documented but **unguarded** — treat it as a rule to follow, not
a gate to rely on, and add the probe if a cell ever gains overflow clipping. Truncation must use the
`min-w-0` + inner `truncate` span pattern, never cell-level overflow clipping.

**One coverage claim that must not be repeated.** The behaviour-contract suite's focus-indicator
check runs under `forcedColors: "active"`, where Chromium paints its own ≥2px ring — it
**currently cannot fail**, even with the design system's `:focus-visible` rule deleted
(`docs/ledger/bugs.md`, 2026-07-25). Reflow, RTL and the 24px floor are unaffected. Every component
below therefore needs its **own** focus test; do not cite the 768 contract checks as focus coverage.

### 4.1 The z-band resolution — three stacking needs, two bands

`AGENTS.md:170` allows exactly `z-(--z-raised)` and `z-(--z-overlay)`. This plan introduces three
things that want to float, and they must not all be assigned the same band by default:

| Need                               | Band                                                         | Why                                                                                                                                                                                                                         |
| ---------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sticky grid header / pinned column | `z-(--z-raised)`, **inside the grid's own stacking context** | It must cover scrolling cells and nothing else. The grid's scroll container creates the context (§8.7), so `raised` here cannot compete with a `raised` element elsewhere on the page                                       |
| `action-bar`                       | `z-(--z-raised)`, page level                                 | Floats over page content; must still be covered by any dialog                                                                                                                                                               |
| Drag preview / drop indicator      | `z-(--z-overlay)`, **portalled to `<body>`**                 | A card dragged out of a scrolling column would otherwise be clipped by that column's `overflow`, and no in-flow band can escape an ancestor's clip. Portalling is the only correct answer, and `overlay` is the portal band |

**The apparent conflict, and why it isn't one.** §7.4 says a dragged card must not gain a shadow,
while `z-overlay` is the band `shadow-overlay` lives in. Those are independent: `--z-overlay` is a
stacking token, `shadow-overlay` is a separate shadow token, and nothing couples them. The drag
preview is portalled at `z-(--z-overlay)` **and stays flat** — its separation from the page comes
from the scrim-free surface ladder plus the one border, exactly as `design.md` §Elevation requires.
That combination is unusual enough to be worth a line in the component's own source comment.

Ordering _within_ a band is DOM order, so the grid's sticky header and a page-level `action-bar`
never contend: they are in different stacking contexts by construction.

---

## 5. The canonical add-a-component pipeline

Per `skills/internal/component/SKILL.md` and `docs/ledger/authoring-guide.md`. This runs once per
item. Reference item: `filter-bar` — 7 tracked files (`git ls-files | grep filter-bar`) plus entries
inside four shared files (`preview/index.tsx`, `content/docs/components/meta.json`, `registry.json`,
`component-contracts.json`).

### 5.1 Hand-authored — in this order

1. `packages/ui/registry/ui/<name>.tsx` — **the only component source you edit.** `.ts` for a pure
   hook. Line 1 is reserved for the generated integrity stamp. Then `'use client'` if earned, then
   imports, then a `/* --- … --- */` block comment stating why the component exists and **what was
   deliberately not done** (this prose is load-bearing: `attachment.tsx:14-24`,
   `combobox.tsx:96-103`). JSDoc every exported prop; `@default` is **gated on optional props only**
   (`verify-public-api-docs.mjs:108-110` keys off `member.questionToken`) — document required ones anyway. Export `<Name>`, `<Name>Props`, `<name>Variants`.
   `{@link}` is allowed here — banned only in MDX.
2. `packages/ui/registry/ui/<name>.test.tsx` — `.tsx` even for a hook. **Must contain the literal
   string `expectNoA11yViolations`** (`verify-component-contracts.mjs:580`).
3. `apps/docs/components/preview/<name>.tsx` — **must carry a leading `'use client';` line** regardless of
   interactivity — the regex is multiline (`verify-component-contracts.mjs:563`), so any line start
   satisfies it; imports the **copy-in**
   `@/components/ui/<name>`, not the canonical path; each example wrapped in `<Wrapper>`.
4. `apps/docs/components/preview/index.tsx` — append `export * from "./<name>";`.
5. `apps/docs/content/docs/components/<name>.mdx` — see §9.
6. `apps/docs/content/docs/components/meta.json` — add under one of the eleven nav groups.
7. `packages/ui/registry.json` — the **full** item object, not just deps:
   `name` · `type` · `title` · `description` · `categories` · `dependencies` (version-pinned **from
   `packages/ui/package.json`**, never copied from a neighbouring item — see the §12 hazard) ·
   `registryDependencies` namespaced `@vegastack/<name>` ·
   `files: [{ path, type, target: "@ui/<name>.tsx" }]` — **the `@ui/` placeholder, never a hard-coded
   path** (`authoring-guide.md` marks this CRITICAL; a hard-coded target breaks `shadcn add` for every
   consumer on a non-default alias layout) · `meta: { whenToUse, whenNotToUse, version }`.
   `whenToUse`/`whenNotToUse` are how an agent picks between close calls — they are not optional prose.
   **Blocks are the one exception**: they use hard-coded `target`s and per-file `registry:page` /
   `registry:file` / `registry:component` types.
8. `packages/ui/component-contracts.json` — the record, **plus four fail-closed counters**:
   `expectedCounts.totalRegistryItems`, `expectedCounts.components` (or `.hooks`),
   `expectedWaveCounts.<Wave>`, and an append to `expectedWaveMembers.<Wave>`. The record itself
   carries `family` · `wave` · `sourceFiles[]` · `publicSymbols[]` (each with
   `ref: {status, target|rationale}`) · `variants` / `sizes` · `states.{behavior,accessibility,visual}`
   (all three, non-empty, with evidence) · `responsive` · `motion.reducedMotion` · `engines[]` ·
   `docsSlug` · `registryDependencies[]` · `npmDependencies[]` · `testFiles[]` · the seven `coverage`
   keys · `previewModule`. Copy the shape from an existing record of the same `registryType`.
9. `packages/ui/package.json` — only if a new npm dep is sanctioned (§2.1).
10. **`design.md`** — this plan changes system direction, so it is part of the change, not a
    follow-up (`AGENTS.md:33-34`; `component` SKILL §"design.md is living"). Specifically: **§Elevation**
    gains the drag posture (a dragged card stays flat; separation comes from the surface ladder, §4.1),
    **§Motion** gains the async drop lifecycle (pending shimmer, snap-back on rejection),
    **§Accessibility** gains the APG grid and board keyboard models, and **§Components** gains the new
    families. Then `pnpm design:sync`. `design:sync:check` gates the derived surfaces but **cannot tell
    you the prose went stale** — that judgement is the author's.
11. **`/CHANGELOG.md`** — canonical and hand-authored, with the fixed section vocabulary
    (`🧩/🔧/🗑/🛠/📦/📚/🐛/⚠️`); then `node tooling/sync-changelog.mjs`. Never touch the generated docs
    page. Sixteen registry items is the largest `🧩` entry in the repo's history. This is a build-local
    edit, so §13's publish exclusion does not exempt it.
12. `.changeset/<name>.md` via `pnpm changeset`.
13. `packages/ui/vitest.smoke.config.ts` — **only** for an item with an evidenced cross-engine risk;
    pair it with `coverage.crossBrowserSmoke: "selected"` in the contract (§10).

Generated, **never hand-edited**: `apps/docs/public/r/<name>.json`, `public/r/registry.json`,
`integrity-manifest.json`, the byte-for-byte docs copy-in `apps/docs/components/ui/<name>.tsx`,
line 1 of the canonical source, `contract-routes.generated.ts`,
`home-component-catalog.generated.ts`, `contract-smoke-tests.generated.json`,
`docs/ledger/component-matrix.md`, the public skill's `components.md`, and the `NUMBERS`/`INVENTORY`
blocks in `AGENTS.md` + `README.md`.

### 5.2 Commands, in order

```bash
pnpm classify                        # FIRST — which gates this change requires, and why. Run it;
                                     # do not reason about it. An unset output reads as false in an
                                     # `if:` and RELAXES a requirement — that has happened twice.
pnpm gates:component <name>          # ~25s — design-lint + this component's test + its contract routes
node tooling/design-lint.mjs packages/ui/registry
cd packages/ui && pnpm exec vitest run registry/ui/<name>.test.tsx && cd ../..
cd packages/ui && pnpm exec tsc --noEmit && cd ../..

pnpm registry:build && git status --porcelain     # MUST be clean — the build is idempotent
pnpm design:derived && git status --porcelain     # MUST be current
pnpm design:sync                                  # design.md → its derived surfaces (item 10 above)
pnpm design:verify                                # 18 verifiers incl. RSC safety, contract reconciliation
pnpm registry:verify-consume                      # real `shadcn add` round-trip, two alias layouts
pnpm typecheck
node tooling/sync-changelog.mjs                   # after editing /CHANGELOG.md (item 11)

pnpm contracts                                    # BLOCKING, scoped to the diff
node tooling/vrt-review.mjs                       # review only — READ the images; SKIPPED ≠ clean
pnpm lint
pnpm gates:verify-receipt                         # LAST — the receipt must cover this tree.
                                                  # A non-empty `skips[]` voids the run; it is a
                                                  # finding, not a warning.
```

**`design-lint` + `tsc` + `vitest` + `registry:build` all green is not "done"** — `design:verify`
fails independently of all four. Never call Playwright directly; `tooling/contracts-run.mjs` owns
the turbo-cached build, reserves a free port, and cross-checks `--grep` against `--list` so a scoped
run cannot pass by matching zero tests.

### 5.3 Test-harness facts that change how tests are written

- `render()` is **async** — always `await` it. `userEvent` comes from `vitest/browser`.
- The harness compiles **no Tailwind CSS** for most files, so `size-4` collapses to zero. Prefer
  native `.click()`/`dispatchEvent` over geometry-dependent pointer clicks.
- For real computed-style or hit-area assertions use the **style-mirror** technique — inject a
  `<style>` tag hand-transcribing the exact compiled values, keyed off `data-slot`/`data-size`
  (canonical: `injectCheckboxHitAreaMirror` in `checkbox.test.tsx`) — combined with
  `document.elementFromPoint(x,y)` boundary probes. `getComputedStyle` alone has lied before.
- axe (`expectNoA11yViolations`) runs **once per meaningfully-different UI state**, not once at rest.
- One ref-forwarding test per DOM-root export:
  `expect(ref.current?.dataset.slot).toBe("<slot>")`.

---

## 6. Build order

**Each item after its own dependencies, then by unblocked surfaces.** (An earlier draft claimed
"layer 1 before layer 2 before layer 3", which its own table contradicts — three of the four hooks
land after `data-grid`, because they are dependencies of items scheduled later, not of it.)

| Phase  | Items                                                                                                             | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------ | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0a** | **Make the verification ladder runnable** — ✅ **done 2026-07-27, except the WebKit lane**                        | Was unmet: the clone was `--depth 1` with no `node_modules`, and `vrt-review.mjs` (merge-base) plus `receipt-guard`/`gate-receipt-carry.mjs` (git-derived proofs) all need real history. Now: unshallowed to 84 commits, `pnpm install --frozen-lockfile` clean, husky hooks installed, Playwright chromium **1228** (the pinned build — 1217 was cached and failed), firefox-1532, webkit-2311. **Proven green on an untouched tree:** `design-lint` clean · `typecheck` 7/7 · `registry:build` idempotent (538 items, 545 provenance headers, registryDependencies match) · browser unit + axe **1255 tests / 105 files** · `design:verify` **all 18 verifiers** · `contracts:all` **768/768 in 5.1m**. See 0a-note. |
| **0b** | D1–D4 decisions (§2.1); the §8 improvements — incl. **8.7 `Table` container hook**, which phase 2 hard-depends on | Nothing else can start. `RAW_INTERACTIVE_EXEMPTIONS` entries are **not** pre-registered here — see the note below.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **1**  | `use-list-nav`, `editable-cell`                                                                                   | The two things `data-grid` needs that are also useful without it. `use-list-nav` de-duplicates two shipped sites, so it pays for itself immediately — but **adopting it in `color-picker` and `emoji-picker` is a content change to two shipped components**, tracked as §8.8, not as a free side-effect of this phase.                                                                                                                                                                                                                                                                                                                                                                                                |
| **2**  | `data-grid` (pass 1: sort · visibility · responsive columns · grouping · load-more)                               | 6 of 9 CRM surfaces. Deliberately excludes the cell edit model.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **3**  | `filter-bar-managed`, `timeline`                                                                                  | 7 and 6 surfaces. Independent of each other and of phase 2.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **4**  | `chip-input`, `number-field`, `action-bar`                                                                        | Small, independent, no shared dependencies. `action-bar` unblocks bulk selection on both grid and non-grid surfaces.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **5**  | `data-grid` (pass 2: cell focus model + edit mode)                                                                | Separately reviewed, because the APG edit layer is the subtlest work in the plan and has no reference implementation. Consumes `editable-cell` from phase 1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **6**  | `use-drag-reorder`, then `board`, then `sortable-list`                                                            | All gated on D3. The hook lands first and both components consume it — the one place the plan would otherwise grow a second drag implementation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **7**  | `use-file-drop`, then `dropzone`                                                                                  | Hook first for the same reason: rich-text paste/drop wants the hook without the surface.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **8**  | `stepper`                                                                                                         | Two CRM consumers (`/setup`, import wizard) plus `StageStepper`. Lands after `timeline` so any shared rail geometry is extracted with both cases visible (§3.2).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **9**  | `use-platform`, then `shortcut-overlay`                                                                           | `use-platform` also fixes `Kbd`'s `os` prop everywhere it is currently guessed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **10** | Guides page: assembling a multi-step form (`stepper` + `Field` + validation)                                      | Documents the component; does not substitute for one.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

**0a-note — the WebKit lane cannot run on this host, and that is a hard scheduling constraint on
phase 6.** `pnpm --filter @vegastack/ui test:smoke` runs WebKit + Firefox. **Firefox passes; WebKit
launches and then times out** on its inspector-pipe handshake (20/30 files, 312 tests pass; 1 error).
The install is correct — revision 2311 matches Playwright 1.61.0, `DEPENDENCIES_VALIDATED` present,
macOS 15.6. The cause is the environment, and it is the same one `AGENTS.md` already records for the
minis:

- `launchctl managername` in an SSH session returns **`Background`**, not `Aqua`;
- WebKit spawns real XPC helpers (`com.apple.WebKit.WebContent.xpc`, `.Networking.xpc`, `.GPU.xpc`)
  which need a **per-user Mach bootstrap namespace** that only a GUI login session provides;
- Chromium's headless shell and Firefox do not, which is why they pass over SSH;
- and the console user on this host is a **different account**, so `launchctl asuser $(id -u mk)` has
  no Aqua session to attach to.

**Fix, when it is needed:** give the build account a GUI session (Screen Sharing, or auto-login),
then run the suite there — or from SSH via
`sudo launchctl asuser $(id -u <user>) pnpm --filter @vegastack/ui test:smoke`.
This is the same "reinstall the runner as a LaunchAgent in a logged-in session" remedy `AGENTS.md`
already prescribes. Do **not** reach for a Linux container: job containers are banned outright by a
locked decision.

**Why it does not block phases 0–5.** `coverage.crossBrowserSmoke` defaults to
`"not-selected-intentional-subset"` and is opt-in only for _evidenced_ cross-engine risk. Nothing in
`use-list-nav`, `editable-cell`, `data-grid`, `filter-bar-managed`, `timeline`, `chip-input`,
`number-field`, `action-bar` or `stepper` qualifies. **It becomes blocking at phase 6**, where
`use-drag-reorder`, `board`, `sortable-list` and then `dropzone` all carry genuine pointer-event and
`DataTransfer` divergence — those are exactly the items §10 nominates for `crossBrowserSmoke:
"selected"`. **Resolve the GUI session before phase 6 starts**, not after. Note also that
`gates:ship` includes this lane, so it will fail until then — which is acceptable only because
shipping is a separate, explicit MK step.

**On `RAW_INTERACTIVE_EXEMPTIONS`: author the entry in the component's own PR, never in advance.**
`design-lint.mjs` compares the entry's **exact per-tag counts** against the file and fails closed in
**both** directions — a pre-registered guess that is off by one fails the build until the source is
bent to match the guess, which is backwards. Only `dropzone`'s hidden `<input type="file">` is
expected to need one (§7.8); `chip-input` should first try composing `Input` (§7.6). Any exemption
that does land also needs a matching negative fixture in `verify-design-lint-structural.mjs` — a gate
never observed failing is an assumption, not a gate.

---

## 7. Per-item specifications

Each item states: **scope**, **composes** (what it must reuse, not reinvent), **new surface** (its
only justifiable additions), **API sketch**, **states**, **a11y**, and **risks**. API sketches are
directional, to be settled at implementation.

Ordered roughly largest-first, because the compositions set the constraints the smaller items must
satisfy. It is **not** strictly layered — `timeline` (7.3) sits between two compositions and
`editable-cell` (7.12) between two hooks — and it deliberately differs from the **build** order in
§6, where hooks and primitives ship first so the compositions consume proven APIs.

### 7.1 `data-grid` — the commission

**Scope.** Everything `DataList` declares out of scope that is _presentational_: a cell focus model
with inline editing, two-key sort, column visibility and reordering, row grouping with collapsible
groups, and keyboard-continuous load-more. It does **not** own data fetching, filter state, view
persistence, or the mutation — G7 holds.

**Why not extend `DataList` (evidence).** Four of the six needs are structurally blocked:

- **Two-key sort is breaking.** `SortState` is a scalar `{key, direction}` in at least six places
  (`data-list.tsx:30-35`, `:122`, `:129`, `:219-226`, `:335`, `:444-460`), and
  `onClick={() => handleSort(col.key)}` (`:466`) **discards the MouseEvent** — `shiftKey` is not
  even observable. Widening to an array changes the `onSortChange` signature: a major.
- **Grouping cannot be retrofitted.** `Collapsible` renders a `<div>` by default
  (`collapsible.tsx:41`, `:122`), and a `<div>` between `<tbody>` and `<tr>` is invalid HTML the
  parser reparents. (Strictly, `CollapsibleProps extends ComponentProps<typeof BaseCollapsible.Root>`
  (`:22-24`) so Base UI's `render` could pass a `<tbody>` through — but the root's `flex flex-col`
  and the panel's `h-[var(--collapsible-panel-height)]` both fight table layout. The HTML-validity
  argument stands regardless.) Real grouping means multiple `<tbody>` elements. The flat selection
  maths (`:350-374`) also assumes one id list, so per-group select-all does not exist.
- **Tab-advance needs a table-owned focus manager.** `FieldInline` already ships Enter-commit /
  Esc-cancel / blur-commit with a double-commit guard (`field-inline.tsx:155-157`, `:174-187`,
  `:246-255`) — roughly 70% of an editor for free. But it has no Tab branch, and its display span is
  `role="button" tabIndex=0` when editable (`:269-277`; both are conditional on `isButton = !readOnly`,
  `:212`), which yields **one tab stop per editable cell per row** —
  a real ergonomics regression on a CRM table. `DataList` has no cell refs, no roving `tabIndex`, no
  `aria-rowindex`/`aria-colindex`, and no `onKeyDown` on `<tbody>`/`<tr>`/`<td>`.
- **No styling hook for a scroll viewport.** `DataList`'s `className` lands on `<table>`
  (`:424`), not on `data-slot="table-container"` (`table.tsx:63-66`) which owns `overflow-x-auto`.
  Sticky headers, fixed-height viewports and virtualization have nowhere to attach today.

Two needs are **already satisfied** and must not be rebuilt: column visibility and reordering work
by filtering/reordering the `columns` array (three `columns.map` calls keyed on `col.key`,
`:443`/`:515`/`:593`; `colSpan` recomputes from `columns.length` at `:403`), and the `footer` slot
is the documented load-more mount point with rows keyed by `getRowId` so appends don't remount.

**One structural gotcha to design around:** `col.render(row, index)` is invoked as a **plain
function inside `DataList`'s own render** (`:594`), not as a component element. Hooks written
directly in a render body become `DataList`'s hooks and corrupt hook order the moment the
loading/empty branch flips. `data-grid` should render cells as **elements** (`<Cell …/>`), and its
docs must state this difference explicitly for anyone migrating a `DataList` `render` fn.

**Composes.** `Table` + all parts (including `grid`/`headerTone`/`density` — the spreadsheet voice
already exists); `Checkbox`; `Skeleton`; `Empty`; `DropdownMenuCheckboxItem`
(`dropdown-menu.tsx:298-330`) for the column picker; **`editable-cell` (§7.12)** in `focusMode="managed"`
for every editable cell — the grid owns focus, the cell owns the editor and its async status;
`use-list-nav` (§7.10) for row navigation; `use-drag-reorder` (§7.11) for column reorder;
TanStack Table v8 (D1) for row models; TanStack Virtual (D2) behind a flag.

**Two column behaviours, not one.** Harvest the platform's `computeDesktopVisibleKeys`
(`vega-data-list.tsx:435`) plus per-column `mobile: "visible" | "hidden" | "merge"`: **responsive
column revelation** measures the container against each column's `minWidth` and merges low-priority
columns into the primary cell on narrow screens. That is a _layout_ behaviour and is distinct from a
**user-facing column picker**, which is a _preference_. `data-grid` needs both, and conflating them
is why the platform has no picker.

**New surface.** The WAI-ARIA APG **grid keyboard layer**, which no library ships and which is ours
regardless of D1: `role="grid"/"row"/"gridcell"/"columnheader"`, roving tabindex across cells,
arrows to navigate, **Enter or F2 to enter edit mode (suspending grid nav), Escape to exit and
restore it**, `aria-readonly` per cell, and an `aria-live` announcement on mode change. Plus the
cell focus registry that makes `Tab` deterministic, `aria-rowcount`/`aria-colcount` for virtualized
or paged sets, and multiple-`<tbody>` grouping.

```tsx
<DataGrid
  columns={[{ key, header, render?, sortable?, editable?: EditorSpec,
              width?, minWidth?, mobile?, group?: boolean }]}
  data={rows} getRowId={r => r.id}
  sort={[{ key, direction }, …]}                    // ≤N keys; ordinal rendered per key
  onSortChange={…}
  onCellCommit={(row, key, value) => Promise<void>} // host owns the write and the conflict
  cellStatus={(rowId, key) => "idle" | "saving" | "saved" | "error"}
  columnVisibility={…} onColumnVisibilityChange={…}
  columnOrder={…} onColumnOrderChange={…}           // reorder UI needs D3; the prop does not
  groups={…} groupState={…} onGroupStateChange={…}
  loadMore={{ hasMore, onLoadMore, loading }}       // arrow-down past the last row continues
  virtualize={false}
  toolbar={…} footer={…} selectable selectedIds={…} onSelectionChange={…}
/>
```

**States.** default · hover · focus (cell and row) · cell edit-mode · cell saving/saved/error ·
row pending · loading (skeleton) · empty · filter-empty (host-supplied `emptyState`) · disabled ·
group collapsed/expanded · load-more idle/loading/exhausted.

**a11y.** Full APG grid semantics; every state axe-tested; the mode-change live region announces
destination only, never intermediate frames; 24px targets verified with `elementFromPoint` probes,
not `getComputedStyle`; RTL via logical properties with arrow-key direction read from
`getComputedStyle(el).direction` (`color-picker.tsx:201` is the house precedent).

**Risks.** Largest item by far. The APG edit-mode layer is subtle and has no reference
implementation in either Base UI or TanStack. `Base UI internals/composite` is the natural
substrate for roving focus but is **internals-only with no semver guarantee** — recommend not
depending on it. Mitigation: land sort + visibility + grouping + load-more first, and put the cell
edit model behind a second, separately-reviewed pass.

### 7.2 `filter-bar-managed` — the commission

**Scope.** The stateful, structured filter builder: nested `and`/`or` groups with a configurable
depth cap, condition rows whose operator set and value editor are chosen by field type, add/remove
at any level, and a chip summary. Per S2, the **grammar is injected** — the component knows nothing
about any specific app's fields.

**Composes.** `FilterChip` (`filter-bar.tsx:197`, exported standalone precisely for this) as the leaf
summary renderer; `FilterBar` itself for the collapsed chip row; `Popover` for per-condition
editing (the pattern `filter-bar.mdx:144` already prescribes); `Select`/`Combobox` for field and
operator pickers; `Button`/`IconButton` for add/remove; `Separator` for group rules.

**New surface.** The node model and its rendering:

```tsx
type FilterNode<V> =
  | { type: "group"; op: "and" | "or"; children: FilterNode<V>[] }
  | { type: "condition"; field: string; operator: string; value?: V };

<FilterBuilder
  vocabulary={fields}          // [{ key, label, type, operators[], editor }]
  editors={{ text: TextEditor, date: DateEditor, … }}  // per-type registry
  value={node} onValueChange={setNode}
  maxDepth={3} maxConditions={25}
  renderSummary={…}
/>
```

**States.** empty (no conditions) · one condition · nested groups · depth-cap reached (add-group
disabled with a reason) · condition-cap reached · invalid condition (missing value) · disabled ·
read-only summary.

**a11y.** The tree is a nested `<fieldset>`/`<legend>` structure, not a `role="tree"` — editing
controls inside a tree item is a known screen-reader trap. Operator and field pickers are ordinary
listboxes, so `Empty`/`Status` must remain **siblings** of the list
(`combobox.tsx:432-435`). Removing a condition moves focus to the next sibling, or the parent's
add-button when it was the last — assert this.

**Risks.** Scope creep toward owning a grammar. The vocabulary prop must stay opaque; the moment
the component validates a field type it has adopted someone's AST.

### 7.3 `timeline`

**Scope, deliberately narrow: rail geometry only.** The audit was unambiguous — `Marker` and `Item`
already cover almost everything a timeline needs, and duplicating their anatomy would split the
`data-slot` vocabulary in two.

| Timeline need                                            | Already covered by                                                                                                                                                |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Date/section divider ("Today")                           | `Marker variant="separator"` — its own documented example (`marker.tsx:86-87`)                                                                                    |
| Event row: icon + actor + title + detail + trailing time | `Item` + `ItemMedia`/`ItemContent`/`ItemTitle`/`ItemDescription`/`ItemActions`; a second `ItemContent` auto-`flex-none` for the timestamp column (`item.tsx:219`) |
| Whole row as a link                                      | `Item render={<a/>}` (`item.tsx:99-103`)                                                                                                                          |
| List semantics                                           | `ItemGroup` (`role="list"`)                                                                                                                                       |
| Relative timestamps                                      | `RelativeTime` — pass `now` + `refresh={false}` for deterministic SSR (`relative-time.tsx:122-134`)                                                               |

**New surface — the only justifiable additions:** the continuous vertical connector with a node dot
aligned to each row's media slot, first/last half-rails, and the content gutter offset. `Marker`'s
hairlines are horizontal-only (`marker.tsx:26-27`) and `ItemSeparator` divides _between_ rows
(`item.tsx:376-385`).

```tsx
<Timeline>
  <TimelineSeparator>Today</TimelineSeparator>       {/* → Marker variant="separator" */}
  <TimelineItem node={<StatusIcon status="done"/>}>  {/* rail + node; children are Item parts */}
    <ItemMedia …/><ItemContent …/><ItemActions …/>
  </TimelineItem>
</Timeline>
```

Do **not** declare `TimelineTitle`/`TimelineDescription`/`TimelineMedia`.

**Long lists.** Copy the two-class `content-visibility` trick from `message-scroller.tsx:163`
verbatim — `[content-visibility:auto] [contain-intrinsic-size:auto_calc(var(--spacing)*40)]` — which
is browser-level render-skipping with zero dependency. Reach for `MessageScroller` **only** if the
timeline is a genuinely live, bottom-pinned, prepend-on-scroll-up feed; for a static chronological
timeline the primitive is dead weight. D2 (`react-virtual`) is a third tier, likely unnecessary.

**a11y.** `<ol>`/`<li>` with a `<time datetime>` per entry; the connector is a pseudo-element and
`aria-hidden`; group headers are real headings. Superseded/struck entries need a text or
`aria-label` signal, never strike-through alone (never signal by colour or decoration alone).

### 7.4 `board`

**Gated on D3.** Do not schedule before the DnD decision.

**Scope.** Column layout, the drag/move model, the keyboard equivalent, and the pending/rejected
affordances. The host owns cards, ordering and the move command.

**API precedent worth inheriting.** `engg-vegastack-platform`'s board is the cleanest split in that
codebase — `board={{ renderCard, onMove(item, fromGroup, toGroup, groupByKey), renderColumnAction,
columnWidth }}`, with the app rendering card _content only_ while the component owns all chrome,
collapsed strips, skeletons and cross-column arrow navigation. Adopt that shape.

**Composes.** `Card size="sm"` + `CardHeader`/`CardTitle`/`CardAction`/`CardContent` for the column
shell; `Item render={<button/>}` for the card (its `role="listitem"` is auto-dropped when `render`
composes an interactive element — `item.tsx:117-122`); `Badge variant="subtle" size="sm"` for
counts; `Avatar`/`AvatarGroup`; `TagGroup`; `Empty bordered` for an empty column — `bordered` is
documented as _"the classic drop zone look"_ (`empty.tsx:99-102`); `ScrollArea` for column bodies;
`DropdownMenu` for the per-card `⋯` and the "Move to…" menu; `useIsMobile` (`use-mobile.ts:27`) for
the drag-disabled breakpoint; `use-list-nav` for within/across-column focus.

**New surface.** Column layout with per-column width driven by a CSS custom property (not
`style={{width}}` — §4); the drag lifecycle with a **pending state that does not block input**
(the CRM spec requires the card to sit in the target column with a shimmer while the transition is
in flight, and to snap back on rejection); a **lossless menu equivalent** — arrows within a column,
`←`/`→` across, `M` opening "Move to stage…" with per-column availability and lock reasons; a muted
parked lane that is **not** a drop target; collapsed terminal columns that expand read-only.

**Elevation.** A dragged card must **not** gain a shadow (`design.md` §Elevation — only overlays get
`shadow-overlay`). Express lift through the surface ladder and the one border. This will feel wrong
to anyone coming from other kanbans; it is the system's position and the plan should hold it.

**Risks.** The keyboard path is not a fallback here — below 768px it is the _only_ path, so it must
be lossless by construction. If D3 lands on Pragmatic DnD, budget extra for the keyboard layer.

### 7.5 `number-field` (replaces `money-input` — scope call S4)

**The roster has no numeric input at all.** Base UI ships a complete `NumberField`: parts `Root`,
`Group`, `Input`, `Increment`, `Decrement`, `ScrubArea`, `ScrubAreaCursor`, with **`format:
Intl.NumberFormatOptions`** and **`locale: Intl.LocalesArgument`** on Root, plus `min`/`max`/
`allowOutOfRange`, `step`/`largeStep`/`smallStep`, `snapOnStep`, `allowWheelScrub`, `readOnly`,
`required`, `onValueChange`/`onValueCommitted`, and native form integration.

So `format={{ style: "currency", currency: "INR" }}` **is** the money input. A CRM-specific
`money-input` in a general design system is the wrong shape; a `number-field` fills a real roster
hole and money becomes a documented recipe.

**Composes.** Base UI `NumberField` for behaviour; `Input`'s addon chrome idiom for appearance —
`prefix`/`suffix` switch `Input` into a bordered wrapper (`data-slot="input-group"`) that owns
border/focus/invalid via `has-*` selectors while the inner control goes borderless
(`input.tsx:40-55`, `:96-101`, `:186-231`), the same flattening technique `field.tsx:336-344` uses.
The currency-code `Select` drops into the `suffix` slot. `Field` supplies label/description/error.
`useShakeOnInvalid` (`use-animation-replay.ts:213-266`) for the reject cue.

**Recipe to document, not to build:** minor-units policy. The CRM stores integer minor units; the
component works in display units. The conversion belongs at the field layer and must be written
into the docs page, not hidden in the component.

**Gotcha.** `Input`'s `size` prop **replaces** the native numeric `size` attribute
(`input.tsx:19-25`) — `number-field` must not re-expose it ambiguously.

### 7.6 `chip-input`

**Verdict: standalone.** Neither existing component can be extended, for three concrete reasons:

1. **`TagGroup` has no input.** No `<input>`, no `onValueChange`, no Enter/comma commit, no
   paste-splitting — it renders `React.Children.toArray(children)` (`tag-group.tsx:165`). It is a
   display list.
2. **`Combobox` cannot commit an arbitrary token.** Base UI's value model is _selection from
   `items`_; filtering, `itemToStringLabel` and `ComboboxEmpty` all key off the `items` prop
   (`combobox.tsx:29-32`). There is no `allowCustomValue`/`onCreate` seam, and `ComboboxEmpty` is documented only as
   "shown when the current query matches no items" (`:644`) — it offers no create affordance, though
   the source states no intent either way; this is inference, not a quoted decision.
3. **Validity is per-_field_, never per-_chip_, in both.** `ComboboxInputGroup` carries one
   `data-[invalid]` for the whole group (`:253`); `ComboboxChip` has only `data-[disabled]` (`:805`).
   `Tag`'s `hue` is explicitly _"never a status signal (that's `Badge`'s job)"_
   (`tag-group.tsx:57-60`), so tinting a bad email red would violate the tag/badge voice split.
   Nothing exposes a per-item `invalid` hook, and `FieldError` is one message for one control
   (`field.tsx:158-169`) — there is no channel for "chip 3 of 7 is malformed".

**Composes.** `comboboxInputGroupVariants` (`combobox.tsx:248-269`) **literally**, including the
`[&_[data-slot=…]]:border-none` flattening, so the field is pixel-identical to a multi-select
Combobox. `Tag` (`tag-group.tsx:82-120`) as the chip — it already ships `onRemove`, `removeLabel`
and a compliant 24px hit area. `Field` for the field-level error. `useShakeOnInvalid` for the reject
cue, `mergeRefs` for the input ref.

**New surface.** Per-chip `data-invalid` styled with the `border-destructive/(--alpha-outline-border)`
token pair (`attachment.tsx:31`); the commit model (Enter, comma, blur, paste-split on a
configurable delimiter); a per-chip normalise/validate callback; and an `aria-live` announcement for
accepted/rejected entries.

**Do not** re-export or subclass `TagGroup` — its `max`/`+N` collapse and focus-on-expand behaviour
(`:170-182`) is display-list semantics that conflicts with an editable field where every chip must
stay reachable. An optional `Combobox`-backed suggestion popup should be a **separate composition**,
not built in; otherwise `chip-input` re-implements filtering Base UI already owns.

**Needs a `RAW_INTERACTIVE_EXEMPTIONS` entry** for its text input.

### 7.7 `action-bar` (generalises `bulk-bar` — §3.2)

**A floating contextual bar: a status region on one side, actions on the other.** Bulk selection is
its most common recipe, not its identity. Three consumers exist in the CRM alone — selection
("5 selected"), unsaved changes ("Unsaved changes · Discard · Save"), and batch progress
("Importing 340 of 1,000 · Cancel") — and naming it `bulk-bar` would have guaranteed a
near-duplicate within a quarter.

**Purely presentational; it must not own selection** (S3). `DataList`/`data-grid` already own
`selectedIds` (`data-list.tsx:88-114`) and document their `toolbar` slot as the mount point for
_"bulk actions"_ (`:166-173`). `action-bar` consumes a count; it never forks the selection model.

**Composes.** `Button`/`IconButton`; `Separator orientation="vertical"`; `Badge` for the count;
`Kbd` for shortcut hints; `DropdownMenu` for overflow; `AlertDialog` for destructive confirms;
`Progress` for the batch-progress recipe. The floating enter/exit recipe already exists — copy
`MessageScrollerButton`'s class literal verbatim (`message-scroller.tsx:219`):
`data-[active=false]:translate-y-full` with `ease-exit` / `ease-emphasized`, already
`transition-pairing`-compliant and CSS-only.

**New surface.** Positioning (fixed, or absolute within a measured container — take the platform's
`getBoundingClientRect` centring, **not** `left: 50%`, which mis-centres against a sidebar); the
status slot; a disabled-while-pending state; and a **partial-result summary** slot. Note the CRM spec
actually prescribes a _toast_ here — "a summary toast reports outcomes ('5 dismissed · 1 failed') and
failed rows stay selected for retry" (`phase-03-leads.md:261`) — so this is proposed on its own
merit, not inherited from the spec: a toast is transient while the retained selection is not, which
leaves the user holding state the notification has already discarded.

```tsx
<ActionBar open={count > 0} status={<>{count} selected</>}>
  <Button variant="ghost" size="sm">
    Tag
  </Button>
  <Separator orientation="vertical" />
  <Button variant="destructive" size="sm">
    Archive
  </Button>
</ActionBar>
```

**Stacking.** Only two z-bands exist. The bar belongs in `z-(--z-raised)`; it must never compete
with `z-(--z-overlay)`, which means a dialog opened from a bulk action correctly covers it.

**a11y.** `role="toolbar"` with `aria-label`; the count announced via a polite live region;
actions with visible text must **not** carry `aria-label` (WCAG 2.5.3 —
`onboarding-checklist.tsx:81-88`).

### 7.8 `dropzone`

**Scope: acquisition only.** `Attachment` already owns rendering and states its own boundary —
_"it owns no upload logic, only the visual `state` machine"_ (`attachment.tsx:92-93`). The two meet
at a plain `File[]` callback.

```tsx
<Dropzone accept multiple onFilesAccepted={files => …} onFilesRejected={rejections => …}>
  <Empty bordered> …idle affordance… </Empty>
</Dropzone>
<AttachmentGroup>{files.map(f => <Attachment state={f.state}>…</Attachment>)}</AttachmentGroup>
```

`Dropzone` must **not** accept an `attachments` prop or render `Attachment` internally, and must
**not** re-implement a dashed container — `Empty bordered` renders `border border-dashed
border-border` and its prop doc literally reads _"the classic 'drop zone' look"_
(`empty.tsx:99-102`).

**New surface — thin, because the logic lives in `use-file-drop` (§7.13).** `Dropzone` is the visual
shell: it consumes the hook's `dropProps`/`inputProps`/`isDragging`/`isDragInvalid`, renders the
hidden `<input type="file">` and the click-to-browse bridge, and exposes `data-dragging` /
`data-drag-invalid` on the root for the `group-data-[…]` idiom. Everything behavioural — drag-depth
counting, the window-level `preventDefault`, validation, paste, announcements — belongs to the hook,
so a rich-text editor can have the behaviour without the surface.

**Needs a `RAW_INTERACTIVE_EXEMPTIONS` entry** for the file input. Note the a11y story is _simpler_
with a visually-hidden real `<input type="file">` than with a div-based drop target — the input is
the control.

**Reference, not a dependency:** `engg-vegastack-platform/src/lib/upload/hooks/use-staged-files.ts` (452
lines) is a working per-file state machine (`validating → presigning → uploading → uploaded →
confirming → confirmed | error`) with real XHR progress. That belongs in the _app_, not the design
system, but its state vocabulary is worth aligning with `AttachmentState`.

### 7.9 `sortable-list`

**Gated on D3**, and shares the drag primitive with `board` (§7.11).

**Composes.** `ItemGroup`/`Item`/`ItemSeparator`; `IconButton` for the handle (its `aria-label` is
required at the _type_ level — `attachment.tsx:388-392` explains why `Attachment` doesn't re-wrap
it); `ScrollArea` for long lists; `use-list-nav`.

**New surface.** Reorder semantics with a **required menu equivalent** (move up / move down /
move to position…), a live-region announcement of the new position, and drop-position indicators.

**This item reclassifies a G7 boundary, and says so.** `data-list.mdx`'s Scope table currently reads
_"Drag-and-drop reordering | App-coupled (persisted order) | future composed addon"_. The argument for
moving it in-system: what is app-coupled is the **persisted order** — which stays app-side, since
`sortable-list` is controlled and emits `onReorder` without storing anything. The **mechanism**
(pointer + keyboard + live-region announcement + drop indicators) is presentational and is exactly
the kind of thing G7 says the design system should own. That is a defensible reading, but it is a
_reading_, not a given: §8.9 tracks reconciling the shipped docs page, and if the design-system owner
disagrees, `sortable-list` drops out and `board` keeps the mechanism privately.

**Inherit one documented constraint** from the platform implementation: _"Don't mix draggable with
selectionActions on the same list"_ — reordering and multi-select selection on one surface produce
ambiguous drag intent. Encode it as a dev-time warning, not just prose.

### 7.10 `use-list-nav` (`registry:hook`)

**This extracts logic that already exists twice.** `color-picker.tsx:166-232` and
`emoji-picker.tsx:566-630` both implement the identical shape: `activeIndex` state + a refs array +
a clamped `focusX` callback + `switch (event.key)` over `ArrowLeft/Right/Up/Down/Home/End` with a
per-case `preventDefault()`, `tabIndex={isActive ? 0 : -1}`, and
`onFocus={() => setActiveIndex(index)}`. RTL is read as
`getComputedStyle(event.currentTarget).direction === "rtl"` (`color-picker.tsx:201`). The refs array
is typed `HTMLElement`, not `HTMLButtonElement`, because `Button` is `render`-polymorphic
(`:176-178`).

**The API decision this hook must settle.** Both existing sites deliberately make `Home`/`End`
whole-grid rather than row-local, each with a written call-out that a row-relative variant is wanted
once a consumer renders many rows (`color-picker.tsx:194-197`, `emoji-picker.tsx:593-596`).
`data-grid` is that consumer. Recommend a `homeEndScope?: "collection" | "row"` option defaulting to
`"collection"` so both existing call sites can adopt the hook with no behaviour change.

Reuse — do not reimplement — `mergeRefs` (`use-animation-replay.ts:274-287`).

Also worth lifting: `engg-vegastack-platform` has an 18-line `hasOpenOverlay()` helper buried in its
monolith that suppresses list navigation while a dialog is open. Roving navigation needs this; a
`shouldHandle?: () => boolean` escape hatch is the composable form.

**Contract note:** every hook PR increments `expectedCounts.hooks` and
`expectedCounts.totalRegistryItems` by one and appends to `expectedWaveMembers.Hooks`. Quote no
target number here — §9 carries the arithmetic, and `AGENTS.md:29` says never quote a count from
prose.

### 7.11 `use-drag-reorder` (`registry:hook`)

`board`, `sortable-list` and `data-grid`'s column reorder all need the same thing. **Build one
mechanism, not three** — and ship it as a hook so the D3 dependency is isolated behind one file and
a future engine swap touches one place.

Depending on D3 it is either a thin wrapper over the chosen engine or a hand-rolled
pointer/keyboard model. Either way:

- pointer, **keyboard** (Space lift → arrows → Space drop → Esc cancel) and touch paths;
- a live region with customisable announcements — take dnd-kit's `announcements` shape as the
  reference even if the engine differs;
- a `disabled` predicate (below the mobile breakpoint, or by permission);
- **async pending/rejected states**, because the CRM's drops hit a server gate and can be refused —
  the card sits in the target with a shimmer, then snaps back. Most DnD libraries assume drops
  succeed; this is the one thing none of them models;
- a cross-container variant (`board`) and a single-list variant (`sortable-list`) from one API.

Take `boardCollisionDetection` (`vega-data-list.tsx:948`) as the reference for hit-testing —
default rect-intersection mis-targets narrow columns, which the platform hit and solved.

**Decide this shape as part of D3**, not after — a rejected dependency changes the design of all
three consumers, and a menu-only fallback changes it most of all.

### 7.12 `editable-cell`

**Pulled out of `data-grid` because its second consumer is not a table** (§3.2). The CRM edits
fields inline on Account 360, Person and Deal record pages, which are `Card`/`PropertyList`
surfaces. Any optimistic inline edit — in a grid, a property list, a settings row or an `Item` —
needs the same four things, and `FieldInline` supplies only the first.

**Composes.** `FieldInline` as the leaf: it already ships Enter-commit / Esc-cancel / blur-commit
with a double-commit guard (`field-inline.tsx:155-157`, `:174-187`, `:246-255`) and focus-and-select on
open (`:196-201`). `AutoSaveInput`'s status union verbatim — `"idle" | "saving" | "saved" | "error"`
(`auto-save-input.tsx:18`) — **reuse it, do not invent a second vocabulary**. `Spinner`,
`StatusIcon`, `Tooltip` for the status affordance.

**New surface.**

1. **The async status layer** — pending, saved, error, with the indicator inline and non-toast-coupled.
2. **Conflict revert** — the value snaps back and the surface announces it, which is what the CRM's
   `version_conflict` path needs on every editable field.
3. **A typed `EditorSpec`**, because real inline editors are popover-based per type, not one text
   input — the platform proves this with `inline-cell-popovers.tsx` (status, priority, assignee,
   date). Text, select, date, actor, currency and multi-select each get an editor; the registry is
   open so an app can add its own.
4. **A `tabIndex` policy prop.** Standalone (in a card) it wants its own tab stop, exactly like
   `FieldInline`. Inside a grid it must **not** have one — one tab stop per editable cell per row is
   a real ergonomics regression — and defers to the grid's roving focus. This single prop is why
   `data-grid` can consume it instead of forking it.

```tsx
<EditableCell
  value={v} editor={{ type: "select", options }}
  status="idle" | "saving" | "saved" | "error"
  onCommit={next => Promise<void>}   // reject → revert + announce
  focusMode="standalone" | "managed"  // managed = no tab stop; host owns focus
/>
```

**a11y.** `aria-readonly` toggling on mode change; the mode change announced politely; Escape
restores the prior value _and_ returns focus to the display element; error state carries text, never
colour alone.

### 7.13 `use-file-drop` (`registry:hook`)

**Pulled out of `dropzone` because the platform already needed it twice** and, lacking it, wrote two
independent implementations: the comment composer (`issue-activity.tsx:1116-1531`) and TipTap image
paste (`vega-text-edit.tsx:774-870`). A rich-text editor accepting a pasted image wants the
acquisition logic without any of `Dropzone`'s visual surface.

**Owns:** `onDragEnter/Over/Leave/Drop` with a **drag-depth counter** (the child-element `dragleave`
flapping bug); a window-level `preventDefault` so a missed drop does not navigate the browser away;
`dataTransfer.items` → `File[]` including directory traversal when available; `onPaste` →
`clipboardData.files`; per-file validation (MIME, extension, size, count) returning a typed rejection
reason; and the accepted/rejected announcement payload.

**Returns:** `{ dropProps, inputProps, isDragging, isDragInvalid }` — so a consumer styles whatever
it likes with the `data-*` flags, and `dropzone` (§7.8) becomes a thin visual shell over it.

**Wraps `react-dropzone` (D4) rather than reimplementing it.** Its `getRootProps`/`getInputProps`
prop-getter shape composes cleanly into the return value above, and it already solves directory
traversal, the drag-depth counter and `accept` matching correctly. What this hook adds on top is the
system's own vocabulary: typed rejection reasons aligned with `AttachmentState`, the paste path, and
the announcement payload.

### 7.14 `stepper`

**Scope.** A bounded linear process: an ordered list of steps with complete / current / upcoming /
**error** states, horizontal or vertical orientation, an advance-gating contract, and correct focus
movement on step change.

**Composes.** `ProgressIndicator segments` for the compact progress voice where a full step list is
too heavy (`progress-indicator.tsx:157-197`); `StatusIcon` for the per-step glyph — its
`todo | progress | blocked | done` vocabulary maps 1:1 to step states (`status-icon.tsx:15-32`);
`Separator orientation="vertical"` for connector rails; `Button` for Back/Next; `Field`/`FieldGroup`
for step bodies. **Not `Tabs`** — see below. **Not `Segmented`** — it is radio semantics for
view switching, and re-clicking the active segment is a deliberate no-op (`segmented.tsx:125-141`).

**Why not `Tabs`.** `role="tab"`/`role="tabpanel"` announces "tab 2 of 6" and implies free
navigation between peers. A wizard is an ordered process where step 4 may be unreachable until step
3 validates. Reusing the tab pattern actively misleads assistive tech. The correct semantics are an
ordered list with `aria-current="step"`, which is what this component ships.

**New surface.**

- `steps[]` with `id`, `label`, optional `description`, and `state` (`complete | current | upcoming |
error`), plus `disabled` for unreachable steps.
- `orientation="horizontal" | "vertical"`.
- A **`canAdvance` contract** — the host returns `true`, or a reason string that the component
  announces and renders against the blocked step. Gating is the host's logic; _communicating_ the
  block is the component's.
- **Focus policy on step change**: focus moves to the new step's heading (not its first field), which
  is the accessible default most hand-rolled steppers get wrong. Overridable via `onStepChange`.
- Linear vs navigable modes: in navigable mode, completed steps are real buttons; in linear mode
  they are not interactive.

**States.** complete · current · upcoming · error · disabled/unreachable · gated (advance blocked
with a reason) · loading (a step whose gating is async).

**a11y.** `<ol>` with `aria-current="step"` on the current item; step state carried by icon **and**
text, never colour alone; the blocked reason wired via `aria-describedby` on the advance control;
vertical orientation keeps the same reading order.

### 7.15 `shortcut-overlay`

**Scope.** The `?`-triggered dialog listing keyboard shortcuts, driven by a **registry** rather than
a hand-written list.

**Why the registry is the component.** The platform's version (`lib/keyboard-shortcuts.ts`, 333
lines) exists because a hand-listed dialog goes stale the day someone adds a binding. Declaring a
shortcut once — key, label, category — and rendering it in the overlay is what makes the surface
maintainable, and it is reusable well beyond the overlay: the same declarations feed tooltip hints
and `Command` rows.

**Composes.** `Dialog` (+ `CommandDialog`'s visually-hidden title/description pattern,
`command.tsx:145-226`); `Kbd`/`KbdGroup` — **the real `Kbd`**, since `CommandShortcut` is
deliberately plain text (`command.tsx:518-528`) and `TooltipKbd` hand-rolls its own markup
(`tooltip.tsx:281-299`), making this the one surface that should use the actual component;
`ScrollArea`; `Separator` + `Item` for sections; `use-platform` (§7.16) to drive `Kbd`'s `os`.

**New surface.** The shortcut declaration shape (`{ keys, label, category, when? }`), grouping and
ordering by category, a search/filter for large sets, and the open/close binding itself (`?`, `Esc`)
with the same suppress-while-an-overlay-is-open rule `use-list-nav` uses.

**a11y.** Shortcuts rendered as a description list so key/label pairs are announced as pairs;
`<kbd>` elements are real; the dialog is labelled; the trigger binding does not fire while focus is
in a text field.

### 7.16 `use-platform` (`registry:hook`)

**Fills a real hole, not just this plan's.** `Kbd`'s `os` prop rewrites `⌘⇧⌥⌃⏎↵⌫` to
`Ctrl/Shift/Alt/Enter/Bksp` (`kbd.tsx:33-47`) but is **manual**, and `kbd.tsx:68-72` deliberately
leaves detection to the caller because a hook did not exist. Today every consumer of `Kbd` either
guesses, hardcodes `⌘`, or ships the wrong modifier to half its users.

**Returns** `{ os: "mac" | "windows" | "linux" | "other", isTouch }`, resolved from
`navigator.userAgentData.platform` with a `navigator.platform` fallback, **SSR-safe**: it returns a
caller-supplied default on the server and corrects after hydration without a layout jump. That
hydration detail is the entire reason this is a hook rather than a one-liner — getting it wrong
produces a hydration mismatch on the first `Kbd` render on every page.

**`Kbd` stays server-safe, and this hook is caller-side only.** `kbd.tsx` has no `'use client'`
today; wiring a `navigator`-reading hook _inside_ it would force one (`useSyncExternalStore`/
`useEffect`/`useState` are all in the eleven, §4) and break RSC import for every existing consumer —
a change to non-negotiable #3 applied to a shipped component, which this plan does not propose.
Note also that `Kbd`'s prop is a **two-value** union, `os?: "mac" | "other"` (`kbd.tsx:72`), not four.
So the documented recipe is:

```tsx
const { os } = usePlatform();
<Kbd keys={["⌘", "K"]} os={os === "mac" ? "mac" : "other"} />;
```

Consumers: `shortcut-overlay`, `Command` footers, and any copy naming a modifier key — each calling
the hook itself. An earlier draft claimed this would make `Kbd` "correct by default everywhere";
it will not, and cannot, without a separate client wrapper item and its own decision.

---

## 8. Non-breaking improvements to existing items

Independently useful, no new dependency, no API break. Recommend landing these in phase 0 regardless
of the D-decisions.

| #       | Change                                                                                                                                                                                                                 | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Risk                                                                                                                                                                |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8.1     | `DataListProps` extends `Omit<TableProps, "children">` instead of `Omit<ComponentPropsWithRef<"table">, "children">`, exposing `grid` / `headerTone` / `density`                                                       | They already reach `Table` at runtime — `{...tableProps}` is spread last onto `<Table>` (`data-list.tsx:316`, `:427`) — but TypeScript rejects them today. This is the single cheapest change for a dense CRM table                                                                                                                                                                                                                                                                             | none; purely additive typing                                                                                                                                        |
| 8.2     | Add a per-cell `data-*` hook and/or `cellClassName?: (row, index) => string` to `DataListColumn`                                                                                                                       | The only per-cell hook today is `col.className`, which is per-_column_                                                                                                                                                                                                                                                                                                                                                                                                                          | additive optional field                                                                                                                                             |
| 8.3     | Add a third parameter to `render`: `(row, index, cell) => ReactNode`                                                                                                                                                   | TS accepts existing 2-arg functions against a 3-param signature                                                                                                                                                                                                                                                                                                                                                                                                                                 | none                                                                                                                                                                |
| 8.4     | Document in `data-list.mdx` that `col.render` is **invoked as a function, not mounted as a component**, so hooks belong in a returned component element                                                                | `data-list.tsx:594`; this is a real footgun with no current warning                                                                                                                                                                                                                                                                                                                                                                                                                             | docs only                                                                                                                                                           |
| 8.5     | **Fix a stale doc:** `table.mdx:120-124` claims the Table parts "add no props of their own", contradicting `grid`/`headerTone`/`density` shipped at `table.tsx:7-28` and documented twelve lines earlier at `:108-116` | verified                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | docs only                                                                                                                                                           |
| 8.6     | Reconcile the `lucide-react` pin (§12 hazard)                                                                                                                                                                          | verified                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | see §12                                                                                                                                                             |
| **8.7** | **`Table` gains a container styling hook** — `containerClassName`, or a `containerProps` object forwarded to the existing `data-slot="table-container"` element                                                        | **Phase 2 hard-depends on this.** `table.tsx:62-66` hardcodes `<div data-slot="table-container" className="relative w-full overflow-x-auto">` — no `className`, no `ref`, no props. §7.1 correctly diagnoses that sticky headers, fixed-height viewports and virtualization have nowhere to attach, but the blocker lives in **`table.tsx`, not `data-list.tsx`**, so composing `Table` inherits it verbatim. Without this, `data-grid`'s `virtualize` and sticky header cannot be built at all | additive prop, but it re-stamps `table`'s integrity hash → contract-record update + changeset, and every consumer sees `table` as `update`                          |
| **8.8** | **Adopt `use-list-nav` in `color-picker` and `emoji-picker`**                                                                                                                                                          | This is the de-duplication that justifies the hook, and it is a **content change to two shipped components** — not a free side-effect of phase 1. Both gain `@vegastack/use-list-nav` in `registryDependencies` (enforced by `verify-registry-deps.mjs`), both contract records change, both need their unit suites + contract routes + `vrt-review` run                                                                                                                                        | **re-stamps both integrity hashes**, so every downstream consumer sees an `update` for a refactor with no user-visible change. Two changesets. See the §11 risk row |
| **8.9** | **Reconcile `data-list.mdx`'s Scope table** when `board` and `sortable-list` land                                                                                                                                      | It currently classifies *"Drag-and-drop reordering                                                                                                                                                                                                                                                                                                                                                                                                                                              | App-coupled (persisted order)                                                                                                                                       | future composed addon"* and *"Board / Kanban layout, grouping & collapsible groups | Separate layout component | future scope"*. `board` satisfies the second; `sortable-list` **reclassifies** the first (§7.9). A shipped docs page outranks `requirements.md` in the truth hierarchy, so leaving it stale is a contradiction in the system's own record | docs only, but it is the visible record of a G7 boundary — do not skip it |

**Explicitly not proposed:** adding `tabIndex` to `<td>` (invalidates the documented keyboard
contract at `data-list.mdx:282-285` and changes tab order for every consumer), or rendering
`col.render` as a component type (would remount every cell on every parent render unless hosts
memoize — a silent behavioural break).

---

## 9. Docs IA

Three **independent** taxonomies, all required per item:

| Item                                                                   | Nav group (`meta.json`, 11 options) | Contract `wave` (10 options) | `family`       |
| ---------------------------------------------------------------------- | ----------------------------------- | ---------------------------- | -------------- |
| `data-grid`                                                            | Data Display                        | Data display                 | `data`         |
| `filter-bar-managed`                                                   | Data Display                        | Forms/editing                | `data`         |
| `timeline`                                                             | Data Display                        | Data display                 | `data-display` |
| `board`                                                                | Layout & Structure                  | Navigation/layout            | `layout`       |
| `editable-cell`                                                        | Inputs & Controls                   | Forms/editing                | `form`         |
| `chip-input`                                                           | Inputs & Controls                   | Forms/editing                | `form`         |
| `number-field`                                                         | Inputs & Controls                   | Forms/editing                | `form`         |
| `action-bar`                                                           | Feedback & Status                   | Overlays                     | `feedback`     |
| `dropzone`                                                             | Inputs & Controls                   | Forms/editing                | `form`         |
| `sortable-list`                                                        | Data Display                        | Forms/editing                | `data`         |
| `stepper`                                                              | Navigation                          | Navigation/layout            | `navigation`   |
| `shortcut-overlay`                                                     | Feedback & Status                   | Overlays                     | `overlay`      |
| `use-list-nav` · `use-drag-reorder` · `use-file-drop` · `use-platform` | — (not in `meta.json`)              | Hooks                        | `hook`         |

`expectedCounts.hooks` goes **2 → 6**; `expectedCounts.components` **+12**;
`expectedCounts.totalRegistryItems` **+16**. All four counter families in
`component-contracts.json` fail closed, so each item's PR carries its own increment.

**MDX structure** (section strings are literally asserted by `verify-component-contracts.mjs:532-543` —
note the **spaces around the slash** in `## Do / Don't`):

The `## API Reference` heading is asserted **separately** (`:544-548`) and has an escape hatch —
`<!-- api-reference-exemption: … -->` — for items with no exported props interface. Hooks are the
likely users; components should not need it.

Frontmatter `title` (unique across all docs, ≤70 chars) · `description` (60–160 chars, plain text) ·
`audience: public` · `preview: <camelCaseExport>`, then:
`## Installation` → `## Usage` → `## Examples` (with `### Anatomy` for compound components) →
`## API Reference` (one `<AutoTypeTable>` per exported props interface, `path` relative to the MDX
and pointing at the **canonical** source) → `## Accessibility` (prose + a keyboard table using
`<kbd>`) → `## Do / Don't` (a single `<DoDont>`).

**No `{@link}` in MDX** — it parses as JS and breaks the build. It is fine in the component's own
JSDoc.

Every item below needs a `Scope` section in its docs, in the style of `data-list.mdx:199-230`,
stating what it deliberately does not own. That section is how G7 stays legible to the next reader.

Plus one Guides page: **"Assembling a multi-step form"** — `stepper` + `Field` + validation +
async gating. It documents the component; it does not substitute for one (§3.1).

---

## 10. Verification gates

Per item, in order: **`pnpm classify` first** (which lanes this change requires — run it, do not
reason about it) → `pnpm gates:component <name>` → full `packages/ui` unit suite →
`pnpm registry:build` + clean `git status` → `pnpm design:derived` + clean `git status` →
`pnpm design:sync` → `pnpm design:verify` → `pnpm registry:verify-consume` → `pnpm typecheck` →
`pnpm contracts` → `node tooling/vrt-review.mjs` (**read the images**; `SKIPPED` is not a clean
diff) → `pnpm lint` → **`pnpm gates:verify-receipt` last**.

**The receipt is a review target, not a formality.** `.gates/receipt.json` is committed and CI
re-derives its coverage from the pushed tree; a run whose `skips[]` is non-empty is a **finding**,
whatever the logs look like. Do not treat a green terminal as coverage without checking it.

Full sweep before any ship: `pnpm gates:ship` (~20 min, includes `contracts:all` at
96 routes / 768 checks).

**Cross-browser smoke** (`coverage.crossBrowserSmoke: "selected"` + `vitest.smoke.config.ts`): opt in
only for evidenced cross-engine risk. Candidates: **`use-drag-reorder`** (pointer-event semantics differ
meaningfully across engines — and precedent is `use-animation-replay`, a _hook_, being the selected
one), plus `board`, `sortable-list`, and `dropzone` (`DataTransfer` behaviour). The rest stay on the
default intentional subset.

**Additional per-item assertions this plan commits to**, since the shared contract suite cannot
cover them:

- An explicit **focus-indicator test per component** — the contract suite's check cannot currently
  fail (§4).
- **Keyboard-only operability tests** for `data-grid` (cell nav + edit mode + Tab advance),
  `board` (move without a pointer), `sortable-list` (reorder without a pointer), `filter-bar-managed`
  (build and remove a nested condition), and `chip-input` (add/remove/reject).
- **Hit-area probes** via `elementFromPoint` for every new ≥24px target (chip remove, drag handle,
  rail node, action-bar action) — `getComputedStyle` alone has lied here before, and the existing
  `data-list` invariant is unguarded (§12.6).
- **RTL** assertions wherever arrow keys map to a direction.

---

## 11. Risks

| Risk                                                                                                                                                                             | Mitigation                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data-grid` is large enough to stall the whole plan                                                                                                                              | Ship it in two reviewed passes: (1) sort + visibility + grouping + load-more; (2) the cell focus/edit model. Pass 1 alone unblocks 6 of 9 CRM surfaces                                                                                                                          |
| Pragmatic DnD is pointer-first, so the keyboard layer is ours to write                                                                                                           | Budgeted explicitly (§2.2). It is also the layer the CRM spec mandates anyway, so it is not additional work — only work that lands here instead of coming from the library                                                                                                      |
| Any DnD engine choice ages                                                                                                                                                       | `use-drag-reorder` (§7.11) is the only file that imports it; a swap touches one module and its tests                                                                                                                                                                            |
| The APG grid edit-mode layer has no reference implementation to copy                                                                                                             | Budget for it explicitly; do not assume TanStack helps (it never touches DOM or focus). Consider a spike before committing pass 2                                                                                                                                               |
| Base UI `internals/composite` is tempting for roving focus but carries no semver guarantee                                                                                       | Do not depend on it; `use-list-nav` is ours                                                                                                                                                                                                                                     |
| These components are the first in the system to be commissioned by a _specific_ app                                                                                              | Every API above is stated in app-neutral terms and injects app knowledge (vocabulary, ordering, gates) as props. Review each against that test before merge                                                                                                                     |
| **§8.8 changes two shipped components' content**, so every downstream consumer sees `color-picker` and `emoji-picker` as `update` for a refactor with **no user-visible change** | Unavoidable — it is the de-duplication that justifies `use-list-nav`. Mitigate by landing both in one changeset with a CHANGELOG line that says explicitly "internal refactor, no visual or API change", so a consumer reading `check-updates` knows it is safe to take or skip |
| **MK declines the dependency widening (§2.1)** — a live possibility, since `AGENTS.md` closed the headless-primitive list with "Nothing else"                                    | The fallback design is written down (§2.1) rather than discovered late: hand-rolled drag and drop-target logic, and our own row models. `board`'s and `sortable-list`'s public APIs do not change                                                                               |
| The plan leans on a verification ladder **never observed running on this machine**                                                                                               | Phase 0a: unshallow, install, prove `gates:ship` green on an untouched tree before any component work                                                                                                                                                                           |
| Editing a copied component downstream registers as drift forever                                                                                                                 | Nothing here asks the CRM to edit a copy; it consumes registry items and wraps them locally                                                                                                                                                                                     |

---

## 12. Hazards discovered during research

Worth fixing regardless of whether this plan is approved.

1. **`lucide-react` is pinned inconsistently across a major boundary.** `registry.json` declares both
   `^1.20.0` (35 items) and `^0.525.0` (6 items), while `packages/ui/package.json` actually installs
   `^1.24.0`. `verify-registry-deps.mjs` does **not** check version ranges, so nothing catches a
   wrong one. Any new item must take its pin from `packages/ui/package.json` — never from a
   neighbouring registry item. Recommend a reconciliation pass and, ideally, a range check in
   `verify-registry-deps.mjs`.
2. **`docs/ledger/authoring-guide.md:65`** — the floor itself (`^1.20.0`, 35 items) is accurate; the
   stale token is its parenthetical "satisfied by the installed **^1.21.0**", against an actual
   `^1.24.0`.
3. **`docs/ledger/authoring-guide.md:68`** says "the **ten** group headings in use";
   `apps/docs/content/docs/components/meta.json` has **eleven**.
4. **`apps/docs/content/docs/components/table.mdx:120-124`** is stale (§8.5).
5. **The focus-indicator contract check cannot fail** (`docs/ledger/bugs.md`, 2026-07-25) — it passes
   with the focus ring **deleted**, affecting 192 of the 768 checks. Already documented; restated
   because this plan adds sixteen items that would otherwise appear covered by it.
6. **The `data-list.tsx` hit-area invariant is documented but unguarded** (§4) — no test would fail
   if a cell gained `overflow-hidden`.

---

## 13. Out of scope

- Publishing, deploying, `changeset version`, or any push beyond a working branch — MK's, per step.
- `text-edit-collab` and the other deferred `text-edit` addons (unrelated commission, F4 still open).
- Migrating `engg-vegastack-platform` onto any of these. That repo's `VegaDataList` keeps working;
  a migration would be its own plan with its own tests.
- A `data-grid` view-persistence layer (saved views, URL state) — app-coupled by G7, and the CRM
  owns it.
- Virtualization inside `board` — columns are bounded by design at the CRM's scale.
- Any AI/suggested-filter behaviour in `filter-bar-managed` — G7 app-coupled, as
  `filter-bar.mdx:146-147` already records.
