---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **Filter chips: hover and open fill the whole chip** (`filter-row`): an unset `ListFacet`, `PeopleFacet`, `DateRangeFilter` or `unset` `FilterChip` drops its dashed line while hovered or open, so the fill reaches the chip's edge like a chip with a value instead of sitting inside the dashes. `DateRangeFilterValue` takes an optional `label` the chip reads in place of a custom range's dates ("Due: Last 2 days"), for relative ranges a host keeps as one token.
