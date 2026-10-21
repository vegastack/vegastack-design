---
"@vegastack/design-tokens": patch
---

🔧 **Type ramp**: the copy tier (`text-xs`, `text-sm`, `text-base`) declares its letter-spacing as 0, so copy-size text inside heading type — a character count under a title, a badge or a meta line in a heading — no longer inherits the heading's negative tracking. Outside heading type nothing changes (body text was already 0); across every preview fixture, no other element's tracking moves.
