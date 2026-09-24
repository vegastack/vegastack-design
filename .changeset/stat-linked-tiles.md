---
"@vegastack/ui": patch
---

📚 The Stat page gains a "Linked stat tiles" example: each count is a whole-tile link to the list it counts.

- **Stat**: tiles are `Item variant="outline"` rendered as a link, in a container-query grid. The name reads label first ("Overdue tasks 3"), the value is `tabular-nums` in the regular font, and a `Skeleton` holds each tile's box while loading (DS-59). [docs](https://design.vegastack.com/docs/components/stat)
- **Empty**: the docs example's "404 - Not Found" now reads "Page not found". [docs](https://design.vegastack.com/docs/components/empty)
