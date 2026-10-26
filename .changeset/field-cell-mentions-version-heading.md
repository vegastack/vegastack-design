---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 **field-cell**, **version-list**: a long-text field takes `@` mentions. `FieldConfig` gains `mentions`, `mentionHref` and `mentionImage`, passed to the long-text `TextEdit` in both `FieldInput` (a row panel) and `FieldCellEditor`'s popover (a grid cell), where choosing in the mention menu keeps the popover open. `VersionList` gains `heading` (default "Version history"), so a host can call the list "History". [docs](https://design.vegastack.com/docs/components/field-cell)
