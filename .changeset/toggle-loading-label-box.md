---
"@vegastack/ui": patch
---

🐛 A loading [Toggle](/docs/components/toggle) no longer paints its label underneath the spinner.

- The label wrapper was `display: contents`, which generates no box and therefore accepts no `opacity`, so `opacity-0` had nothing to apply to and the label stayed fully visible. It is now a real `inline-flex` box inheriting the control's own `gap`, matching Button.
- This is the same defect that was fixed on Button; Toggle was the only other component carrying the pattern.
