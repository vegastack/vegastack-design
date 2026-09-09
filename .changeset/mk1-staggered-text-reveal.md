---
"@vegastack/ui": minor
---

🔧 **StaggeredTextReveal waits for the scroll** (`whenVisible`, on by default). A reveal below the
fold used to finish before anyone scrolled to it. The gate only ever REMOVES the reveal — the
server-rendered markup animates and the client pulls off-screen words back before the first paint —
so a page whose JavaScript never runs still shows its text.
[docs](https://design.vegastack.com/docs/components/staggered-text-reveal)
