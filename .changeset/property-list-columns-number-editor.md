---
"@vegastack/ui": patch
---

🔧 `PropertyList` takes `columns={2}`: rows flow into two columns once the list's own container is `@xl` (36rem) wide and stay one column in a narrower pane, with both the `stacked` and `inline` variants. `EditableCell` gains a `number` editor (`{ type: "number", unit, min, max, step, placeholder }`): the string value displays as `1,234 mm` (locale-formatted, unit muted), edits with a decimal keyboard and the unit trailing the caret in the same box, and a draft that is not a number, is outside `min`/`max` or off `step` stays open with `aria-invalid` and an announcement instead of saving; an empty draft saves `""`. `Attachment` takes `size="lg"`: a 10rem vertical tile, and a larger media box when horizontal. A `select` EditableCell inside a `PropertyValue` lines its option text up with plain values.
