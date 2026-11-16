---
"@vegastack/ui": minor
"@vegastack/design": patch
---

🗑 **Shell clean-up — the parts the shell replaces, and items no app uses, are removed**, with no compatibility aliases (shell layout L22). Removed registry items, none of which any consuming app imports: `access-chip`, `animated-number`, `announcement-banner`, `country-select`, `region-select` and their `geo-data` lib, `field-type-link-step`, `formula-input`, `level-meter`, `rating-bars`, `timeline`, `upload-dialog` and the `use-optimistic-action` hook. `table` no longer ships the orphaned `table-scroll-region.tsx`. A consumer that still holds a copy of a removed item deletes it before `ds:pull`.
