---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 TextEdit blocks and media. Code blocks always show the language picker and get icon-only wrap and copy buttons (a check confirms the copy); wrap is saved after the language in the fence info string (`ts wrap`) and `CodeBlock` takes `wrap`; unwrapped lines scroll inside the block with a thin scrollbar. Editor tables use a fixed layout, so typing wraps inside the cell. Toggles get a clickable chevron that opens and closes them (saved as `<details open>`), with hints in an empty title or body; `MarkdownView` draws the same chevron. New video and audio blocks (`<video src>` / `<audio src>`, native players, also in `MarkdownView`); a dropped video or audio file lands as one. The slash menu's Image, Video, Audio and File open an insert panel with Upload and Link tabs.
