---
"@vegastack/ui": minor
---

🔧 Cards and floating surfaces draw a real border instead of a ring outline, destructive menu rows clear AA, three components mirror under RTL, and FilterBar and DatePicker fit their space.

- **Border, not ring (BRD-1).** `card`, `dialog`, `alert-dialog`, `popover`, `hover-card`,
  `select`, `combobox`, `dropdown-menu`, `context-menu`, `menubar` (content and sub-content) and
  `navigation-menu` swap upstream's `ring-1 ring-foreground/10` box-shadow for a 1px
  `border border-border`, and the floating `sidebar` swaps its `ring-sidebar-border` outline for
  `border border-sidebar-border`, so `SettingsCard` and `Board` columns follow. The ring read as a stray
  outline and disappeared in forced-colours mode. A border takes 1px of layout on each side: under
  Tailwind's `border-box` sizing a surface with a fixed width or height keeps that size and its
  content area shrinks by 2px, while a content-sized surface grows by 2px. `Board`'s drop-over highlight now recolours that
  border (`data-drop-over:border-primary/50`). See [Elevation](/docs/foundations/elevation).
- **Destructive menu rows (A11Y-13).** A focused `variant="destructive"` item in `dropdown-menu`,
  `context-menu` and `menubar` reads `text-destructive-text` on its `/10` wash (it read 3.99:1 in
  light). `QuestionnaireError` takes the same `-text` ink as `FieldError`.
- **Logical direction.** `PageHeader`'s actions and `FilterBar`'s search and trailing slot push with
  `ms-auto`, and `DatePicker`'s preset rail divides with `border-e`, so all three mirror under a
  `DirectionProvider`.
- **FilterBar never overflows.** `SearchInput`'s clear button sat in an addon whose box ended about
  4px outside the input (upstream's inline-end `-0.3rem` margin), so a search filling a narrow
  `FilterBar` pushed the bar 4px past its container at 320px. The addon now stays inside; the clear
  button keeps its position.
- **DatePicker's popup is one surface.** The calendar inside `DatePicker` / `DateRangePicker` is
  transparent, so it no longer paints `bg-background` over the popup's `bg-popover` (a visible second
  tone in dark). With `presets`, the rail now sits beside the calendar from `sm` up, as documented —
  it had stacked above it at every width — and its one divider sits between rail and calendar
  instead of doubling the popup's edge.
