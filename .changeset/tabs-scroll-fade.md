---
"@vegastack/ui": patch
---

🐛 **Tabs / RouteTabs**: a scrolling strip that overflows by only a little shows its full end fade, so its last tab reads as more to scroll, never as clipped (the fade's reveal distance is 16px in a tab list, not the utility's 96px).
[docs](https://design.vegastack.com/docs/components/tabs)
