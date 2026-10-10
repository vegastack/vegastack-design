---
"@vegastack/ui": patch
---

🧩 Add `ShareDialog` as an installable component, with `canPublish` and `hints`.

- `ShareDialog` — the Share dialog from the `share-01` block — is now its own component. Add it with `shadcn add @vegastack/share-dialog` (it installs to `components/ui/share-dialog.tsx`) and keep it current through the integrity flow instead of maintaining a copy. Every prop and type the block's dialog exported is unchanged.
- `canPublish` gates the Publish tab's controls (the switch, Reset, Expires and Stop publishing) separately from `canManage`, and follows `canManage` when unset.
- `hints` places an optional help node, such as an `InfoHint`, right after the People with access heading, the Space access heading and the Publish label.
- The `share-01` block now imports the dialog from `@/components/ui/share-dialog` and lists it as a registry dependency; its demo and page are unchanged.
