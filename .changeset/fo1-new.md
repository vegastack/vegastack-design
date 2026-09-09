---
"@vegastack/ui": minor
---

🧩 **CheckboxGroup** — shared state for a set of checkboxes, with first-class "select all". Base UI
ships the parent/child arithmetic (`allValues` plus a `parent` child gives the mixed state and the
whole-set toggle) and the system had no wrapper for it, so DataGrid, DataList and every permissions
block computed it by hand. There is no `CheckboxGroupItem` — a child is a plain `Checkbox` with a
`value`.
[docs](https://design.vegastack.com/docs/components/checkbox-group)

**`useInlineEdit`** — the click-to-edit machine: draft, commit, cancel, focus restoration and the
double-commit guard (Enter closes the edit, which unmounts the input, which fires blur, which would
commit a second time). `FieldInline` and `EditableCell` had each written it, and the copies had
already drifted — only one re-armed the guard when a controlled host flipped `editing` on, and only
one restored focus after a keyboard commit. It owns no DOM and no persistence, so it also serves a
cell editor that is a `Select` popup with no text input at all.
[docs](https://design.vegastack.com/docs/guides/components)
