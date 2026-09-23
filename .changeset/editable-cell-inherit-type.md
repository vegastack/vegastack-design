---
"@vegastack/ui": minor
---

🔧 `EditableCell` inherits the surrounding type instead of fixing its display and editor at `text-sm`, so it can edit a page title at the heading's size and weight (`<h1 className="text-3xl font-semibold"><EditableCell … /></h1>`) without descendant-selector overrides. At the 14px body default it looks as before; below `md` the editor still never drops under 16px.
