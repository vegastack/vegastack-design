---
"@vegastack/ui": patch
---

🐛 Photos show instantly. `PersonAvatar` now renders the photo as a plain `<img>` in the server HTML, layered over the initials, instead of Base UI's `AvatarImage` (which mounts its `<img>` only after a JS loader reports it loaded) — so the browser fetches it from the markup and a cached photo is there on first paint, with no flash of initials; the initials come back if the photo fails. `Image` no longer hides a server-rendered image until hydration: it paints as soon as it decodes, and only a client-mounted image that has not loaded yet fades in; a load or error that fired before hydration is read from the element. New `priority` prop on `Image` (`loading="eager"` + `fetchPriority="high"`) for above-the-fold images.
