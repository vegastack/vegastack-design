---
"@vegastack/ui": patch
---

🐛 Inside a `Field`, a **RadioGroup** is the control the Field names and each radio item keeps its own name, instead of every item answering to the Field's label.

- An item in a `Field` of its own (the per-item pattern) still takes that Field's label. [docs](https://design.vegastack.com/docs/components/radio-group)
