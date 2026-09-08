---
"@vegastack/ui": minor
---

One `Chip` primitive replaces four recipes for a labelled pill. `Tag`, `FilterChip`,
`ComboboxChip` and ChipInput's chips now compose `chip` through Base UI `render`, so height,
radius, rest fill and the remove control are spelled once: `hue` (10 decorative tag hues, or
neutral) × `size` (`sm` 28px inline · `md` 32px control-scale) × `active` (the neutral chip's
promotion to the `surface-2` selection rung). The remove control is a round ghost
`IconButton size="xs"` whose **real** border box is 24×24 — which fixes `ComboboxChipRemove`, a
bare 16px box with no hit-area expansion at all (a WCAG 2.5.8 failure), and retires `Tag`'s
`::before` hit area, which a nested native `<button>` clipped and so never actually expanded
anything. `TagHue` is gone; the type is `ChipHue`, exported from `chip`.

A new `use-announcer` hook is the one polite live region: `const { announce, Announcer } =
useAnnouncer()`. It replaces five identical hand-rolled `{ text, seq }` regions (EditableCell,
ChipInput, DataGrid, `use-drag-reorder`, `use-file-drop`) plus CopyButton's, keeps the region
mounted and observed from first paint, re-keys it per call so a repeated identical string is still
announced, and holds its state outside the host so an announcement no longer re-renders a whole
DataGrid. `useDragReorder` and `useFileDrop` return `Announcer` instead of `getLiveRegionProps()`.

`Pagination` renders a plain `<nav>`: the redundant `role="navigation"` is gone and the
hard-coded `aria-label="pagination"` is now an overridable prop defaulting to "Pagination", so a
page with two pagers is no longer an axe `landmark-unique` failure. `paginationLinkVariants` takes
its hover/pressed from the shared `surfaceInteractive` recipe rather than restating the literals.
