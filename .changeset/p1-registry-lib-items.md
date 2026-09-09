---
"@vegastack/ui": minor
---

🧩 **`geo-data` and `drag-item`** — the first two `registry:lib` items: plain `.ts` modules that
install under a consumer's `lib` alias and are pulled in automatically as dependencies. `geo-data`
holds the ISO 3166-1 country list, the states/provinces map and their two lookups, so a consumer
installing both geography selects copies the data once (`region-select.json` 67 KB → 7.4 KB).
`drag-item` holds the one visual recipe for a `use-drag-reorder` item — drop-edge hairlines, lift
dim, pending shimmer — which `Board` and `SortableList` had each copied.
[docs](/docs/guides/components)
