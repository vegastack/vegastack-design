---
"@vegastack/ui": minor
---

🔧 Board lanes and cards have names. A lane takes a plain-text `label` (required when its `title` is not a string; development warns without one), and `getItemLabel` names each card. The lane's card list is named "In progress, 4 cards", the Move menu says "Move to In progress", each card's menu control is "Move Write spec", and move announcements name the card and the lane instead of a column id. "Drag a card here" shows only where a pointer drag can start, and card content no longer adds a second tab stop through `TruncatedText`. [docs](https://design.vegastack.com/docs/components/board)
