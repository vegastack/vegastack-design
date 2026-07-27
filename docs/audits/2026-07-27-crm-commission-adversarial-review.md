# Adversarial review — CRM commission branch (2026-07-27)

> Round run by three independent opus reviewers over `feat/crm-commissioned-components`
> (diff vs `origin/main`), per the `review` skill: sources, docs/metadata, and
> plan-compliance/tests. Every finding below was triaged; **Resolution** records what was
> done in this same round. Deterministic gates at review time: design-lint clean ·
> typecheck 7/7 · unit 1367/1367 (115 files) · contracts:all 832/832 (104 routes) ·
> `pnpm lint` (18 verifiers) clean · consume round-trip clean · smoke: Firefox 312/312,
> WebKit blocked by the documented 0a-note environment gap (no Aqua session over SSH).

## Reviewer 1 — component sources

### High

1. **number-field stepper buttons had no focus indicator** (`number-field.tsx` stepper class
   carried `outline-none`, which defeats the centralized `:focus-visible` outline; the
   `focus-visible:-outline-offset-2` never restores outline-style — bug class P0-02).
   **Resolution: FIXED** — `outline-none` removed; focus test added asserting the class is absent.
2. **Closed ActionBar kept focusable, activatable controls** (hidden state was only
   pointer-events/opacity/translate; Tab could reach an invisible destructive action).
   **Resolution: FIXED** — the bar is `inert` while `open={false}`; test added.
3. **ActionBar `pending` did not actually inert the actions** (test name claimed "inerts",
   asserted only `aria-busy` + a class — a false coverage claim).
   **Resolution: FIXED** — actions container is `inert` while pending; test now asserts `inert`.
4. **Stepper `blockedReason` live region mounted together with its content**, so the
   idle→blocked transition announced nothing on real AT.
   **Resolution: FIXED** — the region is always mounted against the current step; only its text
   changes. Test now exercises the idle→blocked transition.
5. **EditableCell: committing back to the persisted value during an in-flight save wedged the
   cell** (compared against `value` instead of the displayed optimistic value; stale spinner +
   dropped user intent). **Resolution: FIXED** — commit compares against `displayValue` and every
   commit attempt bumps the sequence; regression test added.

### Medium

- ActionBar `containerRef` one-shot measurement (ref not reactive; no scroll tracking).
  **Resolution: FIXED (scoped)** — measurement re-runs via a layout-effect on every commit of the
  ref element and listens to scroll; residual "container moves without resize/scroll/resize event"
  is documented in the prop JSDoc.
- ActionBar `role="toolbar"` promised APG arrow-key traversal it didn't have.
  **Resolution: FIXED** — root is `role="group"` (labelled); no keyboard promise is made.
- chip-input `aria-description` has no shipped AT support → invalid chips were colour-only for AT.
  **Resolution: FIXED** — sr-only ", invalid entry" text inside the chip label.
- chip-input: describedby target doubled as the transient live region (stale descriptions,
  re-read announcements). **Resolution: FIXED** — split into a static description element and a
  separate always-mounted live region.
- chip-input: identical consecutive announcements were swallowed by the React state bail-out
  (second duplicate reject announced nothing). **Resolution: FIXED** — announcement state carries
  a sequence and re-renders on every event; same fix applied to editable-cell.
- chip-input: caller-supplied `/g` regex made `splitOn.test()` stateful (second paste dropped).
  **Resolution: FIXED** — paste splits unconditionally and chips when ≥2 parts; no `.test()`.
- chip-input: Enter committed mid-IME-composition. **Resolution: FIXED** — `isComposing` guard.
- filter-builder: cap reasons unreachable (native `disabled` removes buttons from tab order, so
  `aria-describedby` was never read). **Resolution: FIXED** — visible reason text renders next to
  the add affordances at the cap (better than focusable-disabled); sr-only spans removed.
- filter-builder: "Value required" not associated with the editor; `FilterValueEditorProps` had no
  aria channel. **Resolution: FIXED** — editors receive `id`/`aria-invalid`/`aria-describedby`,
  wired to the error span.
- filter-builder: `readOnly` + `disabled` chips were still keyboard-removable.
  **Resolution: FIXED** — the whole summary is `inert` while `disabled` (FilterChip's remove
  handler is required at the type level, so gating happens at the container). Test added.
- filter-builder: `pendingFocusId` could fire on an unrelated later render, and a
  disabled/absent target dropped focus to `<body>`.
  **Resolution: FIXED** — the id is armed for one commit only (double-rAF expiry), consumed
  unconditionally in the effect, and a disabled target is never focused.
- filter-builder: switching to a `requiresValue: false` operator left a stale `value` in the tree.
  **Resolution: FIXED** — value cleared when the next operator takes none.
- filter-builder: fallback text editor generically unsound for `FilterBuilder<number>`.
  **Resolution: DOCUMENTED** — the fallback is typed/documented as string-valued; non-string `V`
  requires an `editors` entry (stated in the `editors` JSDoc and the docs page). A parse/serialize
  pair on `FilterField` was considered and rejected as speculative API.
- use-platform: Android on Firefox (no `userAgentData`) reports `navigator.platform`
  "Linux armv8l" → classified `linux`, contradicting the doc. **Resolution: FIXED** — falls back
  to a `userAgent` substring check for Android/iPhone/iPad before classifying the platform string.
- editable-cell: `select` editor ignored `editing`/`onEditingChange`/`readOnly`.
  **Resolution: FIXED** — readOnly renders plain text via FieldInline; the select editor reports
  open/close through `onEditingChange`. Managed grids get events for all editor types.
- Kbd renders `⌘` with no accessible name on mac (pre-existing in `kbd.tsx`, surfaced by
  shortcut-overlay — the one surface built on real Kbd).
  **Resolution: FIXED at the root** — `Kbd` now pairs mac glyphs with sr-only words
  (Command/Shift/Option/Control…) while keeping the visual glyph aria-hidden; kbd tests updated.

### Low (all triaged)

- Props-passthrough asymmetry (editable-cell/chip-input/filter-builder/shortcut-overlay don't
  extend ComponentPropsWithRef): **ACCEPTED for this round** — deliberate narrow surfaces; each
  exposes className/ref (shortcut-overlay is portal-rooted and exposes neither by design, matching
  its Dialog composition). Noted for a future pass if consumers need passthrough.
- `filter-bar-managed` item vs `FilterBuilder` export naming: **ACCEPTED** — the item name is the
  inventory's deferred-sibling name (requirements record); the export names the thing it is. The
  docs page title says "Filter Builder" and states the item name.
- editable-cell type-only dep on auto-save-input: **ACCEPTED, documented** — the copy-in cost of
  one extra file buys a single system-wide status vocabulary; splitting a types-only registry item
  was rejected as a worse trade.
- stepper: error steps not navigable: **FIXED** — `navigable` now includes `error` steps (a failed
  step is exactly the one to revisit).
- stepper focus target `:focus-visible` nuance + `A→undefined→A` suppression: **ACCEPTED** —
  matches intent (no ring flash on programmatic move; an emptied steps array is a host data bug).
- use-list-nav `focusIndex` on count 0, refs not truncated: **FIXED** — `focusIndex` no-ops when
  the collection is empty.
- color-picker comment overclaiming re-open behaviour: **FIXED** — comment corrected.
- timeline connector dangling when a trailing separator is the last child:
  **RESOLVED BY DOCUMENTATION** — the docs page now states separators belong between items,
  never as the final child (the connector hides via `:last-child`).
- table container spread order could overwrite `data-slot`: **FIXED** — identity attributes are
  applied after the spread.
- shortcut-overlay `when` doc wording: **FIXED** — doc now says "excluded only when `false`".
- filter-builder "Add group" blocked at condition cap: **FIXED** — depth cap alone gates add-group.
- `Object.fromEntries` per render (PLAUSIBLE perf): **ACCEPTED** — memoised where trivial.
- `updateGroup` silent no-op on malformed path: **ACCEPTED** — unreachable through the UI; a dev
  warning would fire in render paths.

## Reviewer 2 — docs, previews, metadata

(Findings and resolutions appended when the reviewer completed; see below.)

## Reviewer 3 — plan compliance and tests

(Findings and resolutions appended when the reviewer completed; see below.)

## Reviewer 2 — docs, previews, metadata

- **H1 (critical): the documented Timeline composition failed axe `aria-required-parent`** —
  `Item`'s default `role="listitem"` inside `TimelineItem`'s `<li>` nests listitem-in-listitem;
  reproduced empirically with the repo's axe 4.12.1. **Resolution: FIXED everywhere** — every
  first-party composition (MDX usage, all previews, both JSDoc examples, the design.md bullet)
  now passes `role="none"` to non-interactive `Item` rows; `TimelineItem`'s JSDoc and the docs
  Accessibility section prescribe it; a real-composition axe test was added to `timeline.test.tsx`
  (it fails without the override).
- **M2** shortcut-overlay.mdx paragraph split mid-sentence by an MDX blank line. **FIXED**.
- **M3** EditableCell never announced a CONTROLLED `status` — the exact grid recipe the docs
  recommend. **FIXED** — controlled status transitions announce (live transitions only, never
  mount); test added.
- **M4** FilterBuilder `readOnly`+`disabled` chips keyboard-removable — **FIXED** (inert; see
  reviewer 1).
- **M5** action-bar hero preview missing `relative` on its container. **FIXED**.
- **M6** chip-input invalid chips colour-only for AT (`aria-description`). **FIXED** (sr-only
  text; see reviewer 1).
- **L7** guides/components.mdx now names all four hooks in the item-kinds table. **FIXED**.
- **L8** new items carry `meta.version 0.1.0` vs embedded `@0.3.0` headers — **ACCEPTED**:
  `tooling/version-sync.mjs` rewrites every meta.version at release; the branch state is interim
  by design.
- **L9** CHANGELOG pin-reconciliation bullet overclaimed ("every pin") — **FIXED**: now scoped to
  the pins the installed versions could not satisfy. The pickers bullet's self-contradiction
  ("no visual or API change" + a behaviour change) — **FIXED**: reworded as "API and visuals
  unchanged, one behavioural correction riding along".
- **L10** number-field.mdx had no Scope section — **FIXED** (minor units, ScrubArea, labels,
  free-text digits).
- **L11** TimelineSeparator had no API note — **FIXED** (prose line; it adds no props).
- **L12** field-inline.mdx didn't mention the new controlled-edit surface — **FIXED** (new
  "Controlled edit mode" section, including the keyboard-commit focus-return behaviour).
- **L13** chip-input description implied any paste commits — **FIXED** ("delimited pastes").
- **L14/L15** filter-bar-managed.mdx: bare "(G7)" now links the split; the summary's flattening
  of nested groups is stated. **FIXED**.
- **L16** action-bar `role="toolbar"` without APG keyboard — **FIXED** (`role="group"`; docs and
  tests updated).
- **L17** none of the new tests ran axe — superseded: every new component suite carries
  `expectNoA11yViolations` across states (and timeline now runs it over the real composition);
  `use-platform.test.tsx` gained one for consistency.

## Reviewer 3 — plan compliance and tests

- **#1** number-field stepper `outline-none` — same as reviewer 1 H1. **FIXED** (+ the sweep
  test below).
- **#2** the plan's per-component focus-indicator commitment was unmet/weak. **FIXED** — every
  new component suite now carries a focus sweep asserting nothing outside text-entry controls
  strips the outline (the exact check that catches the number-field bug), plus the existing
  focused-element assertions. The compiled-CSS truth remains the contract probes.
- **#3** no keyboard-only test for filter-builder — **FIXED**: build + remove a nested condition
  entirely by keyboard, including the focus-policy assertion.
- **#4** editable-cell §7.12 a11y gaps — **PARTIALLY FIXED, remainder recorded**:
  keyboard commit/cancel now returns focus to the display element (fixed at the root in
  FieldInline, blur-commit never steals focus; tested); controlled/internal status announcements
  cover the async layer. `aria-readonly` toggling was **deliberately not added**: the display
  element is a `role="button"` span (aria-readonly is not valid on it) and read-only cells render
  plain text — the plan bullet presumed a grid-cell context that arrives with data-grid pass 2.
  Announcing the mode change itself was folded into the focus behaviour (focus lands on the named
  editor/display, which AT announces) rather than a redundant live region.
- **#5** select editor ignored the managed contract — **FIXED** (see reviewer 1).
- **#6** `elementFromPoint` probes — **SATISFIED BY THE COMPILED CONTRACT PROBES, recorded**:
  every new component route runs the real 24px `elementFromPoint` probe in the contract suite
  (it demonstrably fails — chip-input's sm input was caught at 18px and fixed during this
  branch). Unit-level probes without compiled CSS measure nothing; the one unstyled-harness
  probe pattern (style mirror) was not duplicated per component.
- **#7** filter-bar.mdx stale "deferred inventory item" sentence — **FIXED** (links FilterBuilder).
- **#8** the plan §12 retraction of §8.5 was itself wrong (both its claims are false against
  origin/main); the branch applied the fix. **RECORDED** here and in the ledger — the plan is a
  point-in-time record and is not edited.
- **#9** §8.8 zero-behaviour-change vs the RTL correction — **FIXED**: CHANGELOG reworded; an
  RTL arrow test was added to `emoji-picker.test.tsx`.
- **#10** stepper deviations from §7.14 (`canAdvance` → `blockedReason`; no `loading` step state;
  no `onStepChange` override) — **RECORDED AS ACCEPTED DEVIATIONS**: gating is host logic (the
  plan's own words), a loading step is expressible as `current` + host copy until a real consumer
  shapes it, and the focus policy is fixed by design (override-by-prop invites the anti-pattern
  the component exists to prevent). The plan stays unamended (point-in-time record).
- **#11** number-field Scope — **FIXED** (see L10).
- **#12** use-platform axe — **FIXED**.
- **#13** chip-input/number-field chrome forked from combobox/input variants with nothing keeping
  them in sync — **ACCEPTED, recorded**: the variants target different slots and state selectors
  (focus-within vs data-focused), so a shared literal would need parameterising; revisit if either
  chrome changes. Flagged for the next design-lint idea list.
- **#14** chip removal dropped focus to `<body>` — **FIXED**: focus returns to the field's input;
  keyboard-removal test added.
- **#15** filter-builder does not compose Popover/FilterBar as §7.2 sketched — **RECORDED AS AN
  ACCEPTED DEVIATION**: inline rows are keyboard-simpler than per-condition popovers and the API
  sketches were declared directional; FilterChip (the part exported for this) is composed for the
  summary.
- **#16** shortcut-overlay `when` JSDoc contradiction — **FIXED**; the brief's `() => boolean`
  concern was itself wrong (the plan never specified a predicate), as the reviewer noted.
- **#17** timeline headings deferred to the host — matches the plan's own API sketch; docs updated
  to say when to wrap in a heading. **RECORDED**.
- Counters, wave membership, nav groups, npm pins, `registryDependencies`, publicSymbols,
  docsSlugs: **verified reconciled by both reviewers and the gates** — no action.

## Post-fix verification

All fixes re-verified in this round: design-lint clean · typecheck clean · full browser unit
suite green (including the ~20 new regression tests added above) · registry:build idempotent ·
design:derived/design:sync current · design:verify 18/18 · changelog-lint + content-lint clean ·
contracts re-run green on all touched routes. Numbers are in the ship-prep report.
