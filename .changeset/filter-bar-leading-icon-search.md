---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 **FilterBar**: `leading` puts content before the search on the tools' row — a table's `ViewTabs` — taking the room the tools leave and scrolling sideways when squeezed; on a phone-width bar it keeps the first row with the tools and a search field moves below them. `searchMode="icon"` (default `"field"`) shows the search as a Search button that expands into the field when pressed; the field stays while it holds a query, and an empty one folds back when focus leaves it or on Escape, with focus back on the button. On a phone-width window (below the `tablet` layout tier) the View menu opens as a bottom `Sheet` instead of a popover. [docs](https://design.vegastack.com/docs/components/filter-bar)
