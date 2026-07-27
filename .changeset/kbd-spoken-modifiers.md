---
"@vegastack/ui": patch
---

`Kbd` mac modifier glyphs now pair the visual glyph with visually hidden spoken names ("Command",
"Shift", "Option", "Control", "Return", "Delete") while the glyph itself goes `aria-hidden` — screen
readers no longer hear "place of interest sign" (or nothing) for `⌘`. Non-mac word rewriting is
unchanged. Surfaced by shortcut-overlay, the one surface built on the real `Kbd`; fixed at the root.
