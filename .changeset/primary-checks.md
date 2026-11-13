---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 Checks are `primary`, never green (COL-25, as the operator confirmed): every check that 0.77.0 drew in the blue accent — `StatusGlyph` done, `ChatMenu`'s selected ✓, task lists, plan, request and approval cards, memory notes, uploads, the success toast, `StatusIcon` done, `CopyButton` and `Terminal` copied — is `text-primary` now: a near-black circle-check in light and a white circle with a white check in dark. The lint and doctor messages, the decision register and the foundations pages say so.
