---
"@vegastack/ui": patch
---

🐛 Two-letter initials are no longer cut by the next avatar in a stack ("MK", not "MI"): an avatar the next one overlaps centres its initials on the part still showing. `PERSON_AVATAR_STACK_RING` carries the rule for avatars that are the stack's own children, and the new `PERSON_AVATAR_STACK_ITEM` for an item that wraps its avatar (`AvatarStack`'s hover-card triggers). `InboxItem`'s 28px avatar steps its initials down to 10px and up a pixel when it wears a corner badge, so the letters sit clear of it.

`InboxItem`'s thread rail drops from under the avatar's centre and each expanded event curves into its own avatar with a 10px radius, like a thread's connectors; the rail runs on past middle events and stops at the last one's curve.
Every vertical of the thread (the rail and each connector) is a 1px start border at the same whole-pixel offset, so the rail and a connector never show as two lines side by side at any zoom.
