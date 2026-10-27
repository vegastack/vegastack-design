---
"@vegastack/ui": patch
---

🐛 **Calendar** makes today easy to see (decision A11Y-25). Today used to be `bg-muted`, the same grey as hover and the range middle, so it was almost invisible in the neutral theme, dark mode most of all. An unselected today now has no fill: a thin `border-foreground/40` outline and medium weight. A selected today keeps the normal filled selection, and range start, end and middle look as before. Today's day button also carries `aria-current="date"`. Every date picker built on Calendar picks this up. [docs](https://design.vegastack.com/docs/components/calendar)
