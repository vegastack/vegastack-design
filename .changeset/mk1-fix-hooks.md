---
"@vegastack/ui": minor
---

🐛 **`useIsMobile` reported `false` on the server**, so SSR rendered the desktop layout on a phone
until the effect ran — Board enabled pointer drag and then disabled it. It now renders the
`serverFallback` the caller declares. `usePlatform`'s `isTouch` was frozen at the post-hydration
value; the primary pointer can change mid-session — a 2-in-1 detaching its keyboard — and a drag
affordance gated on `isTouch` has to follow it, so that half is now the live `(pointer: coarse)`
query.
[docs](https://design.vegastack.com/docs/guides/components)
