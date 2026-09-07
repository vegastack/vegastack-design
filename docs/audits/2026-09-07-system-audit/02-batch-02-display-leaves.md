# 02 — Batch 2: display leaves

**Items:** badge · avatar · kbd · separator · skeleton · spinner · progress · marker · status-icon ·
stat · relative-time · truncated-text (+ IconText, TableCellText, SkeletonReveal, AvatarGroup, KbdGroup)
**Evidence:** source read; all routes captured in five lanes; computed metrics; axe clean on every
fixture in this batch; internal-consumer grep for each item.

Overall: small, mostly correct components. The findings are one real defect (indeterminate progress),
several "client component for no reason" boundaries, duplicated micro-styles, and one a11y trade-off
that deserves a decision.

## Findings

### B2-01 · HIGH · defect · Indeterminate `Progress` renders as 100% complete

- **Where:** `progress.tsx:128-134`. `value={null}` makes Base UI set `data-indeterminate`, but nothing
  styles it; the indicator paints a full solid bar (`captures/progress/progressIndeterminate__1280-light-ltr.png`).
  An indeterminate upload looks finished.
- **Fix:** style `data-indeterminate`: a 30–40% wide segment sliding along the track on a looping
  keyframe (`motion-indeterminate`, 1.2s `ease-standard`), frozen to a static 30% segment under
  reduced motion (the global reset handles it). Add a test asserting the indicator is not full-width
  when `value` is `null`. **Motion register M-06.**

### B2-02 · MEDIUM · bloat · Badge carries two looks that are not badges and one size that is not a size

- `minimal` variant (`badge.tsx:29,111-120`): coloured text with pill padding and no container. It is a
  styled `<span>`; delete and let callers use `text-{family}-text`.
- `sm` and `default` sizes are both `h-5`; they differ only by 2px of horizontal padding (`badge.tsx:50-52`,
  measured 20px tall for both). Either make `sm` a real 16px tier (`h-4`, `text-xs`) for dense tables, or
  drop it. **Doubt D8.**
- `bordered` is a boolean fifth look on top of four variants. Keep it (it is the documented Attio chip
  formula and is used by TagGroup/ChipInput), but the docs page's "Tag chips" section must move above
  Do/Don't (B2-14).

### B2-03 · MEDIUM · boundary · Four presentational leaves are client components for no runtime reason

- `separator.tsx` — Base UI `Separator` for a `<div role="separator">`; ships JS for a hairline. Render a
  plain element, keep the `decorative` semantics, become server-safe.
- `stat.tsx` — `'use client'` only for a size context. Replace with `data-size` on the root and
  `group-data-[size=lg]/stat:` selectors on `StatValue`; server-safe, no context.
- `badge.tsx` / `marker.tsx` — client only for `useRender`. Acceptable _if_ `render` polymorphism is
  actually used; grep shows `Marker render` used by Timeline (link rows) and Badge `render` by nothing
  outside its own docs. Keep Marker's; for Badge, offer `render` only through a documented pattern and
  make the default path server-safe (a plain `<span>`), so a badge in a server-rendered table costs no JS.

### B2-04 · MEDIUM · a11y/UX · Truncated text turns every clipped cell into a tab stop

- **Where:** `truncated-text.tsx:231,373`, `relative-time.tsx:258`. When text is clipped (or a tooltip is
  on), the element gets `tabIndex=0` so keyboard users can open the tooltip. In a 50-row table with
  `TableCellText` that is 50 extra tab stops, on top of DataGrid's own roving cell focus.
- **Facts:** CSS truncation does not hide text from screen readers; the tooltip only serves sighted
  keyboard users. Geist and Linear do not make truncated cells focusable.
- **Options:** (a) keep, a11y-maximal; (b) `focusable` prop, default `false` inside grids/lists and
  `true` standalone; (c) never focusable, hover-only. **Recommend (b). Doubt D9.**

### B2-05 · MEDIUM · UX · `RelativeTime` renders empty until hydration

- **Where:** `relative-time.tsx:238-244`. Uncontrolled instances render `""` with `aria-busy` on the
  server, then the label appears after mount — a visible pop and layout shift on every list row.
- **Fix:** server-render the absolute short date (`Intl.DateTimeFormat`, deterministic) and swap to the
  relative label on hydrate; or accept a `now` from a server-provided clock. Keeps content stable.

### B2-06 · LOW · consistency · Reduced-motion overrides are restated per component

- 11 files carry `motion-reduce:animate-none` / `motion-reduce:transition-none` (`skeleton.tsx:14`,
  `spinner.tsx:18`, `status-icon.tsx:120`, `progress.tsx:131`, `slider.tsx:224`, …). The global reset in
  `base.css` already zeroes every animation and transition with `!important`. Delete the per-component
  copies; Phase 3 lint: `motion-reduce:` banned in registry source except the two
  `motion-reduce:data-drag-pending` behaviour switches in `use-drag-reorder`.

### B2-07 · LOW · duplication · Three kbd chips, one component

- `kbd.tsx:15` (the component), `tooltip.tsx:292` (`TooltipKbd` re-styles its own `<kbd>`), and
  `command.tsx` shortcut chips (checked in Batch 3). `TooltipKbd` must render `Kbd size="xs"`. Kbd's
  own `default` size sets `text-sm` while `xs`/`sm` set `text-code-sm` — same 12px via two roles; use
  `text-code-sm` throughout. `pointer-events-none` on a `<kbd>` is meaningless; remove.

### B2-08 · LOW · tokens · `StatusIcon` sizes bypass the icon role tokens

- `status-icon.tsx:24-27` uses `size-3.5/4/5/6` where `--icon-inline/default/action/feature` exist for
  exactly these steps. Same in `spinner.tsx` (correctly uses the tokens) — align StatusIcon to Spinner.
  Lint gap: `raw-icon-size` only fires inside an `svg` descendant selector.

### B2-09 · LOW · consistency · Skeleton line radius

- `skeleton.tsx:19` `line` is `h-4 rounded-md` (8px on a 16px bar reads as a pill). Geist/Linear use a
  small radius on text skeletons; `rounded-sm` (6px) matches Kbd/menu-item geometry. Taste; low.

### B2-10 · LOW · API · `Kbd` defaults to mac glyphs

- `kbd.tsx:131` `os = "mac"` means Windows/Linux users see `⌘` unless every caller wires
  `use-platform`. The server-safe design is deliberate; the docs must say so and `ShortcutOverlay` /
  `Command` must be verified to pass the resolved platform (Batch 3/9).

### B2-11 · LOW · docs · Section-order and coverage nits

- `badge.mdx`: "Tag chips — bordered & outline" sits after Do/Don't. `stat.mdx` lists `statTiles`
  twice and has only 4 tests (no `StatEmpty`, no `size="lg"` metric assertion). `marker.mdx` and
  `truncated-text.mdx` carry Explorer/Playground/Anatomy sections — fine, they precede Examples.
- `avatar.mdx` previews load remote images that 404 offline (console errors in every capture lane) —
  use bundled sample images so the page is deterministic.

### Verified fine

Badge/Marker `animateIn` is opt-in and off by default (correct: static lists must not pop); Avatar
fallback surface + `AvatarGroup` ring; Spinner colour inheritance in solid buttons; StatusIcon
`role="img"`+label; Separator `decorative` semantics; Skeleton `aria-hidden`; RelativeTime uses
`Intl` only and is deliberately silent to AT; TruncatedText's touch tap-to-toggle is a genuinely good
pattern; no axe violations; no overflow at 320; RTL correct for AvatarGroup and Kbd rows.

## Motion register — Batch 2

| id   | where                     | motion                                            | verdict                         |
| ---- | ------------------------- | ------------------------------------------------- | ------------------------------- |
| M-06 | Progress indeterminate    | **proposed**: sliding segment loop, 1.2s standard | **MK to approve** (fixes B2-01) |
| M-07 | Progress determinate      | width transition 200ms standard                   | keep                            |
| M-08 | Skeleton                  | `animate-pulse`                                   | keep (sanctioned loader)        |
| M-09 | SkeletonReveal content    | `motion-enter-up` on swap                         | keep                            |
| M-10 | Badge/Marker `animateIn`  | `motion-pop-in`, opt-in                           | keep                            |
| M-11 | Spinner / StatusIcon busy | `animate-spin`                                    | keep                            |

## Doubts for MK (Batch 2) — decided 2026-09-07

| id   | question                               | decision                                                                                                                                                                                                                                                                                       |
| ---- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D8   | Badge `sm` / `minimal`                 | **`sm` becomes a real 16px tier. `minimal` stays** — MK wants it for tables: no background, no border, coloured text with a **leading dot by default** and a configurable leading icon. B2-02 amended: `minimal` gets `dot` defaulting to `true` and accepts an icon child in the dot's place. |
| D9   | Truncated cells as tab stops           | **`focusable` prop, off inside grids/lists** (option b).                                                                                                                                                                                                                                       |
| M-05 | Slider value readout on drag/focus     | **Approved** (opt-in prop).                                                                                                                                                                                                                                                                    |
| M-06 | Indeterminate progress sliding segment | **Approved.**                                                                                                                                                                                                                                                                                  |
