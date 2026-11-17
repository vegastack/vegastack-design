---
"@vegastack/ui": patch
---

🐛 **A column that slid over the page closes when you pick a place in it, again** (`shell`): the controller still looked for the retired column item, so a `NavTreeItem` that is a button (not a link) left the column open. A parent that folds open keeps it open.
