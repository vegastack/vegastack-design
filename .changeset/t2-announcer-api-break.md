---
"@vegastack/ui": minor
---

⚠️ **`useDragReorder` and `useFileDrop` return `Announcer`, not `getLiveRegionProps()`.**
Render `<reorder.Announcer />` / `<drop.Announcer />` in place of `<span
{...reorder.getLiveRegionProps()} />`. The props-getter shape could not keep the region mounted
across an announcement, which is the property that makes it audible.
[docs](https://design.vegastack.com/docs/components/sortable-list)
