---
"@vegastack/ui": minor
---

⚠️ **`CountrySelect` / `RegionSelect` internals.** `COUNTRIES`, `Country`, `getCountryByCode`,
`REGIONS_BY_COUNTRY`, `Region`, `getRegionsByCountry` and `hasRegions` are no longer exported from
`country-select` / `region-select`, and `region-select-data.ts` is gone — import `COUNTRIES`,
`REGIONS`, `getCountryByCode` and `getRegions` from `@/lib/geo-data` (`getRegionsByCountry` →
`getRegions`; `hasRegions(c)` → `getRegions(c).length > 0`). `RegionSelect` no longer clears by
re-selecting the current state; clearing is the explicit `clearable` control on the trigger, on by
default. Both selects now render a wrapper, so `data-slot="country-select"` / `"region-select"` is
on the wrapper and the trigger carries the `-trigger` suffix.
[docs](/docs/components/region-select)
