---
"@vegastack/ui": patch
---

🐛 `Board` lanes no longer scroll sideways: the lane body was `overflow-y-auto`, which turns `overflow-x` to `auto` too, so a few px of card overflow made the cards jiggle sideways and swallowed horizontal trackpad, Shift+wheel and touch pans. The lane body is now `overflow-x-hidden overflow-y-auto overscroll-y-contain`, and the board scroller is `touch-pan-x touch-pan-y`, so a sideways pan anywhere on the board scrolls the board. Each lane now has a subtle top-to-bottom `muted` fade (drop-over still swaps to the solid `accent` wash), and "+ Add" moved from the lane's foot into the scrolling content: full width and centred right after the last card (after `LoadMore`), or as the empty state's action under "Nothing here".
