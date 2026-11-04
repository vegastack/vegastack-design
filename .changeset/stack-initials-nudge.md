---
"@vegastack/ui": patch
---

🐛 Two-letter initials are no longer cut by the next avatar in a stack ("MK", not "MI"): an avatar the next one overlaps centres its initials on the part still showing. `PERSON_AVATAR_STACK_RING` carries the rule for avatars that are the stack's own children, and the new `PERSON_AVATAR_STACK_ITEM` for an item that wraps its avatar (`AvatarStack`'s hover-card triggers). `InboxItem`'s 28px avatar steps its initials down to 10px and up a pixel when it wears a corner badge, so the letters sit clear of it.
