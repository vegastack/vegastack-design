---
"@vegastack/ui": minor
---

🧩 **`searchable-select`** — the one Select-shaped Combobox preset: a full-width trigger, the shared
in-panel search row, a check on the selected row, a `--anchor-width` panel and an optional clear
control. `CountrySelect` and `RegionSelect` are now thin data-fed wrappers over it. Two rules it
exists to hold: selection runs through Base UI's `value`/`onValueChange` and nothing else (the old
`RegionSelect` computed the value inside each row's click handler with the root deliberately
unwired, so keyboard <kbd>Enter</kbd> and a pointer click reached it by two different paths), and
the clear control is a SIBLING of the trigger, never a child, because an interactive control may not
contain another. [docs](/docs/components/searchable-select)
