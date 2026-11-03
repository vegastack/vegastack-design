---
"@vegastack/ui": patch
---

🔧 `DataGrid` takes `fill="flex"`: the grid fills the room its flex-column parent leaves by layout instead of measuring it, so a filter row or banner that comes or goes above it resizes the viewport in the same frame and the horizontal scroll bar stays at the bottom instead of jumping and settling back. The host gives it a bounded column (`AppShellPage size="full"`, `AppShellBleed className="flex-1"`); `fill` (measured) is unchanged.
