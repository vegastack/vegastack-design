---
"@vegastack/ui": minor
---

🐛 **useStickToBottom + MessageFold + Heatmap**: a full-page chat can scroll with the page — `useStickToBottom({ scroller: "page" })` follows the nearest scrolling ancestor instead of an inset pane and returns `atBottom` for the page's own Jump to latest button. Opening something in the thread (Show more, an activity block) no longer jumps the view to the bottom: the hook holds the view, and the browser's scroll anchoring, for that growth. `MessageFold` ends its fold between two lines of text instead of through one (`foldLineCut`). `Heatmap` thins its column names by measuring its own width (every 2nd, 3rd, 4th, 6th… name, each whole) instead of truncating them to "0…" in a half-width card.
[docs](https://design.vegastack.com/docs/components/message-scroller)
