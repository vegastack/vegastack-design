---
"@vegastack/design-tokens": patch
"@vegastack/design": patch
---

🔧 `base.css` stops the page bouncing under a mouse or trackpad (INT-12): on `pointer: fine`, `html, body` get `overscroll-behavior-y: none`, so the page no longer rubber-bands at its top and bottom edges and an inner scroller at its end no longer chains into the page. Vertical only, so a trackpad two-finger swipe still goes back/forward; touch devices keep pull-to-refresh and the native bounce.
