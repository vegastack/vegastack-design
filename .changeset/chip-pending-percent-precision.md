---
"@vegastack/ui": patch
---

🐛 No more lost input. `ChipInput` gains `onPendingChange(pending)`: the text still in the input (`null` when empty) and whether a commit refused it (too long, past `max`), with the input `aria-invalid` while refused, and entries a paste could not add past `max` back in the input — so a form can hold its submit instead of dropping what was typed (all opt-in with the prop). A percent cell editor scales by 100 on the digits instead of in floats (`toPrecision(12)` rounded `1234567.890123` to `1234567.89012`), and a number, currency or percent edit left untouched writes back the exact value it opened with.
