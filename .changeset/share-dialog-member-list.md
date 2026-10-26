---
"@vegastack/ui": patch
---

🔧 **ShareDialog** is built on `MemberList`: the invite row is a `MemberListAdd` and People with access are 36px `MemberList` rows (avatar · name over its reason · level chip), with **Remove access** moved from the level menu into each row's ⋯ menu (`More for {name}`; new `labels.removeAccess` and `labels.moreFor`). The "Who can see this" summary (`audience`) is now the first thing on the Share tab, above the invite row. The props are unchanged. [docs](https://design.vegastack.com/docs/components/share-dialog)
