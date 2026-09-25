---
"@vegastack/design": patch
---

🔧 Person status badge: `PersonOption` takes `badge`, and `Person` (for `PersonCard`, `PersonHoverCard` and `AvatarStack`) takes `badge` — a status right after the name on the same line; a string such as "Inactive" renders as a small muted outline `Badge`. `SearchableSelect` and `FilterBarFacet` pass it to person options with `itemToBadge`. `PersonBadge` is exported for person cells that compose their own avatar, name and email.
