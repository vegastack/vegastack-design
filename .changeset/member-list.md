---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 **MemberList** (new): one list for every "people in X" — a team, a space, a share list, an invite list. `MemberListAdd` is the add row (a `picker` slot · an optional role from `roles` · Add, stacking below 28rem); `MemberList` rows are 36px — avatar · name over a muted `description` sub line ("2 people", "Creator") · the role as a `PermissionMenu` chip (or plain text without `roles`, or read-only without `canManage`) · a ⋯ menu with Remove (`onRemove`) and the host's `menuItems`. `locked` rows show the role with a lock and `lockedReason` and no ⋯, while the ⋯ column keeps its width so the chips line up; past `maxRows` (8) the list scrolls inside itself; `loading`, `empty` and every string (`labels`) are props. [docs](https://design.vegastack.com/docs/components/member-list)
