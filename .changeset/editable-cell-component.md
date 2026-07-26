---
"@vegastack/ui": minor
---

New `editable-cell` component — an inline-editable value with an async commit lifecycle. Composes
`FieldInline` as the text leaf and reuses `AutoSaveInput`'s `AutoSaveStatus` vocabulary
(`idle | saving | saved | error`) for its status indicator. A promise-returning `onCommit` shows the
committed value optimistically, then flips to saved — or reverts to `value` and politely announces
the revert on rejection (the version-conflict path). Editors are typed and open:
`text` (FieldInline), `select` (a Select whose popover is the editor), and `custom` for app editors.
`focusMode: "standalone" | "managed"` decides whether the cell owns its tab stop or defers to a
grid's roving focus model.

`FieldInline` gains three additive props to support this without being forked: controlled
`editing` / `onEditingChange`, and a `tabIndex` override for the display element. No behaviour
change for existing consumers.
