---
"@vegastack/ui": minor
---

⚠️ **Badge speaks the same variant vocabulary as Button.** `variant` is now `solid · soft
· outline · minimal`: `subtle` is renamed **`soft`**, with no alias — a stale `variant="subtle"` is a
type error. The three sizes become three REAL heights, `sm` **16px** · `md` **20px** · `lg` **24px**;
`sm` used to be `md` with 2px less horizontal padding, which is a padding value, not a size.
`minimal` becomes ink only — no fill, no border, no horizontal padding — so it sits flush in a table
cell instead of faking a pill, and it now carries a **leading dot by default**, because a badge with
no container has nothing but colour left to signal status with (WCAG 1.4.1). Pass `dot={false}` to opt
out, or the new `icon` prop to take the dot's place.
[docs](https://design.vegastack.com/docs/components/badge)
