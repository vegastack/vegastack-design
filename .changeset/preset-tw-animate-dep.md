---
'@vegastack/design': patch
---

`tw-animate-css` is now a regular dependency (was an optional peer): `preset.css` hard-imports
it, so a fresh pnpm consumer's build failed with "Can't resolve 'tw-animate-css'" the moment it
imported `@vegastack/design/preset.css`. Found by the reference starter's first build.
