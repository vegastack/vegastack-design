---
"@vegastack/ui": minor
---

Marketing leaves, hooks and the dashboard block.

New `use-media-query` registry hook — the system's one `matchMedia` subscription, on
`useSyncExternalStore` with a caller-declared `serverFallback`, replacing five hand-rolled
`useState(false)` + `useEffect` copies that all reported `false` on the server (so a phone rendered
the desktop branch of every JS-driven layout until an effect ran). `usePrefersReducedMotion` is its
named reduced-motion reader; `useIsMobile` and `usePlatform`'s touch half become one-liners over it,
and `usePlatform`'s pointer read is now live because the primary pointer can change mid-session.
`mergeRefs` moves to `@vegastack/design` and replaces the nine inline merges.

PlanCard's promoted plan is a `surface-3` rung with an alpha-`primary` hairline instead of a
full-strength chromatic border. LogoRow drops the underline, draws logical seams so RTL keeps its
inner rules, and treats `wallColumns` as a maximum over an `auto-fill` track with a cell floor.
ParticleField reads the canvas's resolved colour per frame instead of freezing `--brand` at mount.
StaggeredTextReveal gains `whenVisible` (default on), gated so the reveal is only ever removed by
the client. Testimonial takes its quotation marks from CSS `quotes` via `<q>`. `SettingsSection`
gains `titleAs`. ShortcutOverlay uses the Dialog `size` vocabulary. dashboard-01's KPI labels wrap
to two lines with the trend badge on the value row, and its header trail collapses at `maxItems=2`.
