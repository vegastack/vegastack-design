---
"@vegastack/ui": minor
---

⚠️ **`Button` has no icon size tier.** `size="icon"` / `icon-xs` / `icon-sm` / `icon-lg`
are gone; every icon-only action is `IconButton`, which makes the missing `aria-label` a type error
and now owns `shape="square" | "round"`.
[docs](https://design.vegastack.com/docs/components/icon-button)
