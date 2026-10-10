---
"@vegastack/ui": patch
---

🐛 **Board** and **ActionListSkeleton** — a loading lane's skeleton cards follow the card's bands (the eyebrow, the title, a chip, then the footnote with the assignee at its end) instead of a chip row with the avatar. `ActionListSkeleton`'s title and meta bars no longer touch: each sits in its text line's height, so a loading row keeps the loaded row's height with a gap between the bars.
[docs](https://design.vegastack.com/docs/components/board)
