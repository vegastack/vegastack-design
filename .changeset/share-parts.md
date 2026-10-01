---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 Sharing parts. `PersonAvatar` gains `kind: "team"` (a rounded-square tile with the team icon on its hue), and `AvatarStack` stacks and lists teams beside people. New `SpaceAvatar` (a space's tile — icon or initial on its hue, a corner lock when private, the lock itself for a personal space) with `SpaceOption`, the space row for pickers and menus. New `PeopleInput`: add people or teams as removable chips, searched as you type through the host's `search(query)`, with Backspace removing the last chip. New `PermissionMenu`: an access level with one-line descriptions, a check on the current one, an optional destructive Remove access, and a read-only mode for built-in rows. New block `share-01`: a data-agnostic Share dialog (a bottom Sheet on phones) with an invite mode that gives the whole batch one level, people with access and why, general access in the item's space, and a view-only public link with copy, reset, expiry and Stop sharing.
