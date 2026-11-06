---
"@vegastack/ui": minor
---

🧩 `PopoverContent` takes `anchor` (an element, or a virtual element with `getBoundingClientRect`), forwarded to the positioner: a popover pointing at a point in the window lands right inside a transformed panel such as a side peek. `MakeTaskPopover` anchors to its line through it instead of a fixed 0×0 box, and follows the line as the page scrolls.
