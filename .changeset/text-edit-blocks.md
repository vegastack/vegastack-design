---
"@vegastack/ui": minor
---

📝 `TextEdit` memory mode. `blocks` limits an editor to the kinds it names: the `/` menu, Turn into, the bubble, the block menu, uploads, embeds, bookmarks, mentions and Markdown shortcuts offer nothing else, and a paste or drop is rewritten to fit before it lands (a table becomes "cell · cell" lines, an image a link, a code block plain lines, an H1 an H2), with `onBlockConverted` naming what changed. `toAllowedBlocks(doc, blocks)` in `text-edit-schema` is the same rewrite for a server. `lineAside` shows quiet facts at the end of a list line on hover or focus (a tap on touch), never moving or covering text; `lineMenu` adds a ⋯ menu per list line, its rows also first in the block menu.
