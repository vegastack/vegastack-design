---
"@vegastack/ui": patch
---

🐛 **A rail item keeps the name you give it** (`shell`). `ShellRailItem` used to replace a caller's `aria-label` with its own; an explicit `aria-label` now wins (the account item reads "<name>, account"), and the label with its count or dot is the name only when none is given.
