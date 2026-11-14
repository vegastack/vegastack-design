---
"@vegastack/design-tokens": patch
---

🐛 INT-13's 16px text-entry rule on touch pointers also covers `contenteditable="plaintext-only"`, so a plain-text editor can't bring back iOS focus zoom now that the viewport's scale stays uncapped.
