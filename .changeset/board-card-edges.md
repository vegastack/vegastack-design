---
"@vegastack/ui": patch
---

🐛 **BoardCard** and **Board**: every band starts at the card's edge. That covers the eyebrow, the status icon (not its hit area), the context, the chips and the footnote. A wrapped title hangs under its own first line beside the status, and stops at two lines with an ellipsis. Bands keep fixed heights: the eyebrow and title line are 20px, and the chips and footnote are 24px with an even 8px gap. A card without chips or without an assignee keeps the same rhythm. On a `Board`, only the first band leaves room for the ⋯ menu (`data-board-card-menu`). The rows under it run to the card's end padding, so a footnote avatar sits flush and in line with the ⋯, which moves onto the end padding. The loading card mirrors these bands.
[docs](https://design.vegastack.com/docs/components/board-card)
