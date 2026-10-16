---
"@vegastack/ui": patch
---

🐛 **MermaidBlock and TextEdit find**:

- **MermaidBlock prints from dark mode:** each diagram is laid out in its own off-screen box with real layout, so a print stylesheet that hides the rest of the page no longer draws its labels at `translate(NaN, NaN)` (a blank diagram on paper), and a drawing that couldn't be measured is never cached. A diagram first drawn while printing takes its colours from the design tokens, not the print-time CSS.
- **No `flushSync`:** the dark drawing's light copy is swapped in by CSS for print; React no longer warns "flushSync was called from inside a lifecycle method".
- **Wide diagrams:** the diagram scrolls sideways in its own box with the table scroll cue (the overflowing edge fades) and is a named, focusable region ("Diagram, scrolls sideways") while it scrolls.
- **Find bar:** the find field gives way first, so the bar stays on one row in a 27rem text column.
