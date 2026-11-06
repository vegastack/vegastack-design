---
"@vegastack/ui": patch
---

🐛 `DataGrid`'s sticky header and summary row keep their rules. The header's bottom line and the summary row's top line vanished while the grid scrolled, and the summary row's bottom line showed under some cells only: in the collapsed table model a row border stays with the table, and opaque sticky cells painted over it. Both rows now draw their rules in their own cells (the summary row above and below; in an embedded grid with nothing after the table, the frame's border is the line below), drawn once with no double line against the body. `GridSummaryCell`'s result truncates in a narrow column instead of overflowing into the next one; the function's name gives way first.
