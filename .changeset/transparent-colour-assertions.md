---
---

🛠 Browser assertions test whether something is painted, not how Chromium spells "nothing".

Chromium serialises a fully transparent colour as `rgba(0, 0, 0, 0)` or as `oklab(0 0 0 / 0)`
depending on the colour space the value came through, and this token system's colours routinely come
through OKLCH. Fourteen sites compared against the first spelling as a literal string.

Two of them asserted equality and broke loudly when the spelling changed — one of them flipped red
and then green again across three CI runs on identical source. **The other ten asserted
`not.toBe("rgba(0, 0, 0, 0)")` to mean "something is painted here", which passes on an element that
lost its fill entirely whenever Chromium spells the nothing differently.** A Badge, Button, Switch
track, Toast action or Bubble surface could have gone completely unpainted with its test green.

`packages/ui/test/color.ts` now answers the question by meaning rather than by spelling, and its own
contract is pinned in `color.browser.test.tsx` — including the original defect as an executable
claim, and a real element read in the engine without naming which spelling it produced. No call site
changed meaning: every file was green before and after, so this removes the possibility rather than
uncovering an instance.
