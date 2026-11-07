---
"@vegastack/ui": patch
---

🐛 Fixes from a viewport sweep at 1440 and 390 px:

- `AppShellAside`: a closed panel lays out no resize handle. The handle's hit area reached 12px past a closed docked panel at the window's edge, so every page without the panel open scrolled sideways.
- `ActivityValue`: a field's own display inside it (a status chip, a number a cell right-aligns) reads inline at its own width, so "Quote value to ₹5,88,000.00" stays one phrase instead of breaking onto a line of its own with the value at the far edge.
- `DocumentLayoutDecisionBarActions`: on a phone a lone answer (Cancel review) stays at the end of the text's line; two or more still take a full row. A one-answer bar is about 58px tall instead of 80.
- `AgentPanel` takes `reasonHelp` (a Learn more link): it follows a paused, failed or blocked card's reason, outside a failure's quotes, instead of inside them.
