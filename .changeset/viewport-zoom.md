---
"@vegastack/design-tokens": patch
---

📚 INT-13's 16px text-entry rule on touch pointers stops iOS focus zoom by itself, so the install docs and `base.css` no longer advise a viewport `maximumScale: 1`: keep the viewport's scale uncapped (no `maximumScale`, no `user-scalable=no`), since a cap blocks pinch-zoom where browsers honour it (WCAG 1.4.4). Apps that set it should remove it.
