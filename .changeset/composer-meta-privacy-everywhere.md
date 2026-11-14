---
"@vegastack/ui": patch
---

🐛 `ComposerMeta`'s privacy note gives its full sentence on every input: a tap toggles it on a touch screen (a tooltip alone never opened there), keyboard focus and hover show it as before, and a screen reader hears it as the note's description whether or not it shows. The note is a ghost `Button` when it has a detail.
