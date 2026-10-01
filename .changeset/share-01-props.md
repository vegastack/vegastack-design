---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 `share-01`: new `generalLevelReadOnly` prop on `ShareDialog` shows General access's level as text while a manager can still switch between "Everyone in ‹space›" and "Only people invited". `defaultInvitees` is now reactive — when it changes (compared by id) the invite chips follow it, so a "Share with Priya" prompt can open the mounted dialog with Priya chosen; chips the viewer edits stay until the prop changes again. The dialog body's section gap moves from the off-scale `gap-5` to `gap-4`.
