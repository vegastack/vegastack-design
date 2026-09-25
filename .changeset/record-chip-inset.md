---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 RecordChip: the picker and the ↗ link now sit inside one shared `p-0.5` inset, both 24px tall and rounded-full, so their hover and open backgrounds keep the same gap from the pill's border on every side (the pill grows from 28px to 30px). The shell is exported as `SplitChip` with `SplitChipButton`, `SplitChipSeparator` and `splitChipIconActionClassName` for any main-action-plus-icon-action pill; documented under Record Chip.
