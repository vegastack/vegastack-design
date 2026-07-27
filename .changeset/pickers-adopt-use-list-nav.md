---
"@vegastack/ui": patch
---

`color-picker` and `emoji-picker` adopt the shared `use-list-nav` hook for their roving-tabindex
grids — internal refactor, no visual or API change. Both items gain `@vegastack/use-list-nav` in
`registryDependencies`, so `check-updates` will report an update for each; it is safe to take or
skip. Home/End behaviour is unchanged (whole-grid, the hook's default). One correction rides along:
emoji-picker's ArrowLeft/ArrowRight are now RTL-aware, matching color-picker — previously they were
LTR-only in RTL contexts.
