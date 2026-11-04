---
"@vegastack/ui": patch
---

🐛 **NumberField** no longer looks disabled at its `min` or `max`. Base UI disables the stepper at a bound, and `InputGroup` dimmed the whole field for any disabled descendant, so a field holding its minimum showed at half opacity and failed text contrast. Only a disabled input dims the field now; the stepper at its bound is still muted on its own.
