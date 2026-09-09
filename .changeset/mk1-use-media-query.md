---
"@vegastack/ui": minor
---

🧩 **`use-media-query`** — the system's one `matchMedia` subscription, on `useSyncExternalStore`
with a caller-declared `serverFallback`. Five files each hand-rolled the same `useState(false)` +
`useEffect` shape, and every one of them reported `false` on the server, so a phone rendered the
DESKTOP branch of every JS-driven layout until an effect ran. Ships `usePrefersReducedMotion` as its
named reduced-motion reader; `useIsMobile` and `usePlatform`'s touch half are now one-liners over it.
[docs](https://design.vegastack.com/docs/guides/components)
