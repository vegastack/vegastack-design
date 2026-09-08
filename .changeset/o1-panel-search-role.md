---
"@vegastack/ui": minor
---

⚠️ **In-panel search fields are a `searchbox`.** Every panel-search row renders
`type="search"`, so `ShortcutOverlay`'s filter (and any other field inside the shared row) exposes the
`searchbox` role rather than a generic textbox. Selecting one by role in a test or script must change
with it.
[docs](https://design.vegastack.com/docs/components/shortcut-overlay)
