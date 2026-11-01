---
"@vegastack/ui": patch
---

🐛 An invalid `Input` or `Textarea` keeps its destructive border while hovered (FOC-16), instead of swapping it for the grey `input-hover` border under the pointer. `InputGroup` and the `Combobox` chips field already held it; a test now pins that.
