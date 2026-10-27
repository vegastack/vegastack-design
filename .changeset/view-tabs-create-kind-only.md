---
"@vegastack/ui": patch
"@vegastack/design": patch
---

⚠️ **ViewTabs**: the `+` menu offers just **Grid view** and **Board view**, each with its icon, instead of "Shared" and "Personal" groups of both. `onCreate` is now `(kind) => void` — it takes the kind alone; the host's own create step names the new view and decides who sees it (an "Only visible to me" switch). `canCreateShared` and the `createShared` / `createPersonal` labels are removed. Migrate `onCreate={(kind, scope) => …}` to `onCreate={(kind) => …}` and drop `canCreateShared`. The tab row's shared and personal grouping ("Mine") is unchanged. [docs](https://design.vegastack.com/docs/components/view-tabs)
