---
"@vegastack/ui": minor
---

New `timeline` component — rail geometry only, deliberately: a continuous vertical connector with a
node per entry (`Timeline`/`TimelineItem`/`TimelineSeparator`), while rows compose the existing
`Item` parts, timestamps are `RelativeTime`, and group headers render through `Marker`'s separator
variant. No `TimelineTitle`/`TimelineDescription` — that would fork `Item`'s vocabulary. Entries
carry the `content-visibility` render-skipping recipe for long feeds with zero dependencies, the
rail is `aria-hidden` decorative geometry, and the whole family is server-safe (no `'use client'`).
