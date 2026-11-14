---
"@vegastack/design-tokens": patch
"@vegastack/design": patch
---

🐛 INT-13's 16px text-entry rule on touch pointers also covers `contenteditable="plaintext-only"`, so a plain-text editor can't bring back iOS focus zoom now that the viewport's scale stays uncapped. `@vegastack/design` ships beside it, so its `@vegastack/design-tokens` range names the tokens it is released with.
