---
"@vegastack/ui": minor
---

🔧 **Toasts and tooltip delays can sit in the layouts that use them** (`provider`). `VegaStackProvider` takes `toasts={false}` and `tooltips={false}` to leave them out of the root, and the new `VegaStackToasts` and `VegaStackTooltips` mount them lower — so a route group that never toasts mounts no toast viewport. The defaults are unchanged.
