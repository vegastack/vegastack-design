---
"@vegastack/ui": patch
---

🔧 **Toggle** (and every **ToggleGroup** item): a pressed toggle is now filled with `bg-primary/10` instead of upstream's `bg-muted` — which was also its hover fill, so pressed read as hover — deepening to `bg-primary/15` on hover, with the outline variant's pressed border at `border-primary/30` (decision API-39). Unpressed toggles are unchanged. [docs](https://design.vegastack.com/docs/components/toggle)
