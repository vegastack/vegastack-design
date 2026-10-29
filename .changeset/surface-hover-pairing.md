---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **StatGroup** and **RecentStrip** cells are transparent with a border in both themes (they were `bg-card`: filled in dark, invisible on a white page in light; StatGroup now draws its dividers with borders instead of a `bg-border` grid). A **RecentStrip** card's hover is `bg-muted` and its icon tile turns `bg-background` on hover, so the tile no longer disappears into the hover fill (same pairing in **Inbox** item icons); the strip's scroll buttons keep a visible border and foreground chevron in dark.
