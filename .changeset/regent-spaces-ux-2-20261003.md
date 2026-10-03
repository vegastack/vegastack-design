---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 Give toasts a second action, the emoji picker a footer, and the space and share parts a way to name a space the viewer cannot see.

- Toast: `data.actions` takes one or two `{ label, onClick }` buttons after the text, with the type icon kept, each closing its toast once taken unless `data.keepOpen`. The `toast` manager's `data` is typed as `ToastData` (also exported, with `ToastActionItem`), so a second action needs no hand-rendered `data.render` body.
- EmojiPicker: a `footer` slot renders a row at the bottom of the panel, such as "Remove icon".
- New `SpaceHint` type, `spaceHintLabel()` and `SpaceHintIcon` in space-avatar name a hidden space by kind — "Priya's My space" or "Private space" — never by name. `AccessChip` gains `{ kind: "hidden", hint }`, `SpaceChip` gains `hint`, and share-01's `generalAccess.spaceHint` turns the Space access row into a plain statement with no mode or level.
- share-01 shows a one-line "Published to the web" notice on the Share tab while published, with Manage opening the Publish tab.
- Removed unneeded API: `AccessChip` `labels` / `AccessChipLabels` (the hidden kind replaces the relabelling), `SpacePicker` `labels` / `SpacePickerLabels`, and share-01's unused `share`, `publicSection`, `publicHeading`, `publicOff`, `stopSharing`, `done` and `unknownSpace` labels. SpacePicker's empty trigger now reads "Space: none chosen", and the toast Action example no longer closes its own toast by hand.
