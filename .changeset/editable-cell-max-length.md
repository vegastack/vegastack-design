---
"@vegastack/ui": patch
---

🧩 **EditableCell**: the `text` editor takes `maxLength`, the field's `maxlength`. Typing stops at the limit; a paste keeps the characters that fit, and when the limit cut it short the count says "Only the first N characters fit" and the cell announces it; from 90% of the limit a quiet `n/max` count shows under the field (its description), as wide as the field and laid over what follows, so nothing moves. What is typed or pasted in place can no longer run past what the store accepts and then be lost to a failed save.
