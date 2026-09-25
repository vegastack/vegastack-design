---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 Toast actions close their toast: clicking the action (e.g. "Undo") runs it and dismisses the toast; `data: { keepOpen: true }` opts out. Tooltips open after 250ms everywhere (`TIMINGS.tooltipOpenDelayMs`, was 300), and RelativeTime's date tooltips now use that shared delay instead of opening instantly.
