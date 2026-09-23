---
"@vegastack/ui": minor
---

🔧 Cards and floating surfaces draw a real border instead of a ring outline, destructive menu rows clear AA, and three components mirror under RTL.

- **Border, not ring (BRD-1).** `card`, `dialog`, `alert-dialog`, `popover`, `hover-card`,
  `select`, `combobox`, `dropdown-menu`, `context-menu`, `menubar` (content and sub-content) and
  `navigation-menu` swap upstream's `ring-1 ring-foreground/10` box-shadow for a 1px
  `border border-border`, so `SettingsCard` and `Board` columns follow. The ring read as a stray
  outline and disappeared in forced-colours mode. A border takes 1px of layout on each side, so a
  surface you sized to the pixel grows by 2px. `Board`'s drop-over highlight now recolours that
  border (`data-drop-over:border-primary/50`). See [Elevation](/docs/foundations/elevation).
- **Destructive menu rows (A11Y-13).** A focused `variant="destructive"` item in `dropdown-menu`,
  `context-menu` and `menubar` reads `text-destructive-text` on its `/10` wash (it read 3.99:1 in
  light). `QuestionnaireError` takes the same `-text` ink as `FieldError`.
- **Logical direction.** `PageHeader`'s actions and `FilterBar`'s search and trailing slot push with
  `ms-auto`, and `DatePicker`'s preset rail divides with `border-e`, so all three mirror under a
  `DirectionProvider`.
