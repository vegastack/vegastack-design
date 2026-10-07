---
"@vegastack/ui": patch
---

🐛 `ActivityEvent`, `VersionList` and `CommentThread`'s "Resolved by" header show a person's `badge` after their name, like every other place a person is named. An actor, version author or resolver with `badge: "Inactive"` (someone deactivated, or whose invite is pending) now reads "Jamie Rao `Inactive` changed status…" with the small muted outline badge from `PersonBadge`, instead of dropping it. `activity-feed` and `version-list` now depend on `searchable-select` (`comments` already did).
