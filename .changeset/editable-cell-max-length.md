---
"@vegastack/ui": patch
---

🧩 **EditableCell**: the `text` editor takes `maxLength`, the field's `maxlength`. Typing stops at the limit, a paste keeps the characters that fit and says "Only the first N characters fit", and from 90% of the limit a quiet `n/max` count shows under the field (its description), laid over what follows so nothing moves. A title edited in place can no longer take more than its store accepts and then lose it to a failed save.
