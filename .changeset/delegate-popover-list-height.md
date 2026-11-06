---
"@vegastack/ui": patch
---

🐛 `DelegatePopover`'s agent list takes the window's height it can (at least 6rem, at most 20rem) instead of a fixed 12rem, so a short window still shows more than two agents.
