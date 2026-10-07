---
"@vegastack/ui": patch
---

🐛 `ActivityEvent` and `VersionList` show a person's `badge` after their name, like every other place a person is named. An actor or version author with `badge: "Inactive"` (someone deactivated, or whose invite is pending) now reads "Jamie Rao `Inactive` changed status…" with the small muted outline badge from `PersonBadge`, instead of dropping it. Both items now depend on `searchable-select`.
