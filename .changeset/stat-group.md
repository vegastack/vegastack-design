---
"@vegastack/ui": patch
---

🧩 **StatGroup** in `stat`: a hairline-divided row of inline stats (`items={[{ label, value, href }]}`), one row from 24rem of its own width and a 2×2 grid below. A cell with an `href` is a link through `linkRender`; `value: undefined` is loading (a skeleton, `aria-busy`), `null` a failed read ("—" and `errorLabel`); `hideWhenAllZero` renders nothing when every value is 0. [docs](https://design.vegastack.com/docs/components/stat)
