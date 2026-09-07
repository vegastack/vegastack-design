# 02 — Batch 7: composition and feedback

**Items:** card · item · collapsible · accordion · alert · announcement-banner · empty ·
notification-bell · stepper · progress-indicator · onboarding-checklist · timeline
**Evidence:** source read; five-lane captures; axe from the sweep (`item` critical ×6); tests and
docs inventories.

Overall: the composition primitives are clean and mostly server-safe. One critical axe defect
(Item's default role), one ARIA semantics choice that makes every static alert announce itself,
one documented-but-unfixed animation bug, and a couple of duplications.

## Findings

### B7-01 · HIGH · a11y · `Item` claims `role="listitem"` outside any list

- **Where:** `item.tsx:122` sets `role="listitem"` whenever `render` is absent. axe
  `aria-required-parent` (critical) on every standalone Item fixture; `Timeline` has to document
  `role="none"` as a workaround (`timeline.tsx:86-91`).
- **Fix:** `ItemGroup` provides context; `Item` sets `listitem` only inside it (or accept an
  explicit `role`). Remove the Timeline workaround note.

### B7-02 · MEDIUM · a11y · Every `Alert` is `role="alert"`

- `alert.tsx:160`. `role="alert"` is an assertive live region: a static info/success banner
  rendered on page load is announced as an interruption, and a page with three alerts announces
  three. WAI-ARIA: use `alert` only for time-sensitive, important messages; `status` for
  informational ones; none for static content.
- **Fix:** default `role="status"` for `info`/`success`/`default`, `role="alert"` for
  `destructive`/`warning` when rendered _after_ mount (a `live` prop like `AttachmentDescription`),
  and no live role for statically rendered alerts. Same review for `AnnouncementBanner`
  (`role="status"` on a page-top strip that exists at load is noise).

### B7-03 · MEDIUM · defect · `NotificationBell`'s pop-in never fires on the right render

- `notification-bell.tsx:80-97` documents the bug: `mountedRef` is read during render and the
  effect that sets it schedules no re-render, so the badge pops on the _next unrelated_ render.
- **Fix:** track `previousCount` in state; when `count` increases after mount, set an `animate`
  flag (state, so it re-renders) and clear it on `animationend` via `useAnimationReplay`. Remove
  the remount-by-key trick.

### B7-04 · MEDIUM · bloat · Two segmented progress bars

- `onboarding-checklist.tsx:142-160` hand-rolls the dash progress bar that
  `ProgressIndicator segments` (`progress-indicator.tsx:243-296`) already provides, with its own
  `role="progressbar"`. Compose the primitive.

### B7-05 · MEDIUM · consistency · List-row type sizes disagree

- `ItemTitle` and `ItemDescription` are `text-sm` (12px, `item.tsx:241,267`); Sidebar menu rows,
  DataList cells, menu items and Message rows are `text-base` (14px). A 12px title row next to a
  14px sidebar row reads as two systems. Geist list rows are 14/13.
- **Fix:** `ItemTitle` `text-base`/500, `ItemDescription` `text-sm`; keep `size="sm"` for the
  denser 12/12 tier.

### B7-06 · MEDIUM · consistency · Hand-rolled dismiss/collapse buttons

- `alert.tsx:186-195`, `announcement-banner.tsx:87-97`, `onboarding-checklist.tsx:123-133` each
  roll a `<button>` with `opacity-hint` + `before:-inset-2`. Use `IconButton variant="ghost"
size="xs"` (which owns the 24px target) — same class as B3-05.

### B7-07 · LOW · API · `Empty` has two props for one border

- `bordered` (dashed) and `surface="card"` (solid border + card fill) overlap (`empty.tsx:21-31`);
  the compound "dashed wins via tw-merge" comment is the tell. One `variant: plain | card | dashed`.
  `EmptyTitle` hardcodes `<h3>` — a heading level the page may not have; expose `render`/`as`.

### B7-08 · LOW · consistency · Disclosure triggers hover with an underline

- `collapsible.tsx:82`, `accordion.tsx:115` `hover:underline` on buttons. Underline-on-hover is
  the _link_ affordance in the doctrine; disclosures should hover with the row wash (`surface-2`),
  as Geist and Linear do.

### B7-09 · LOW · type · `Stepper` navigable label re-shapes a Button

- `stepper.tsx:281-283` strips a `Button`'s height/padding with `h-auto py-0 -mx-1` to look like
  inline text. Use `variant="link"` (neutral ink) or a plain button with the focus outline.

### B7-10 · LOW · docs/tests · Order and coverage

- `alert.mdx` has eight example sections between Examples and API Reference plus a "Strip variant"
  section _after_ Do/Don't (order violation). `empty.mdx` ends with "Illustration & value tiers"
  after Do/Don't. `announcement-banner` (4 tests), `onboarding-checklist` (4 tests, `w-72` fixed
  width, one preview), `card` (6 tests, two previews) are thin. `timeline` has one preview.

### Verified fine

Card is server-safe with a real footer wash and `size` density; Accordion/Collapsible animate
height on Base UI's vars with correct start/end frames and rotate the chevron; Empty is server-safe
and its illustrations are `currentColor` monolines; Stepper uses `aria-current="step"` on an `<ol>`,
moves focus on step change (never on mount), keeps a live region mounted for the blocked reason
and pins the current glyph `animate-none`; Timeline is rail-only, server-safe, with
`content-visibility` skipping; ProgressIndicator is server-safe SVG with a sweeping arc; the bell
folds the count into the accessible name.

## Motion register — Batch 7

| id   | where                           | motion                                 | verdict          |
| ---- | ------------------------------- | -------------------------------------- | ---------------- |
| M-35 | accordion / collapsible         | height 150ms standard + chevron rotate | keep             |
| M-36 | alert / banner dismiss          | opacity hint→100 on hover              | keep             |
| M-37 | notification badge              | `motion-pop-in` on new activity        | keep (fix B7-03) |
| M-38 | progress indicator arc/segments | stroke-dasharray / opacity 200ms       | keep             |

## Doubts for MK (Batch 7)

| id  | question                 | options                                                                                                             | recommendation |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------------- | -------------- |
| D23 | Alert live-region policy | (a) `status` by default, `alert` only for destructive/warning rendered after mount · (b) keep `role="alert"` on all | **(a)**        |
| D24 | Item row type            | (a) title 14/500, description 12 · (b) keep 12/12                                                                   | **(a)**        |
