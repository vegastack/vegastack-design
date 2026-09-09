---
"@vegastack/ui": minor
---

⚠️ **Seven animated icons drop a deprecated handle alias; an eighth renames its handle
type.** `BotMessageSquareHandle`, `ConciergeBellHandle`, `KeyIconHandle` (on both `key-circle` and
`key-square`), `RefreshCCWIconWIcon` (on `refresh-cw`), `ActivityIconHandle` (on `square-activity`)
and `ZapHandle` were `@deprecated` aliases left behind by upstream naming quirks; each of those icons
still exports its `<Name>IconHandle` and only the alias is gone. `chevron-first` is the different
case and is a **rename, not an alias removal**: upstream had copy-pasted a `displayName` from another
icon, so the primary interface was called `ChevronsDownUpIconHandle` and `ChevronFirstIconHandle` was
the `@deprecated` alias of it. The exported component symbol is authoritative, so the name that
survives is the one that matches it — **`ChevronsDownUpIconHandle` → `ChevronFirstIconHandle`**.
Consumers of the old name must rename; no compatibility alias is kept.
[docs](https://design.vegastack.com/docs/foundations/icons)
