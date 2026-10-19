---
"@vegastack/ui": patch
---

🐛 **InlineChip**, **MermaidBlock**, **SortableList**: a task chip shows the task glyph and only a finished task its check (`done`, set by `TextEdit` and `MarkdownView` from `mentionStatus`'s new `done`); a chip's icon and its label's first word never part on a wrap; a mermaid diagram scales down to fit its column (never above its drawn size) and scrolls sideways only below 0.6 of that size; `SortableList`'s `minTileWidth` raises a tile grid's 8.5rem floor so wider cards sit one a row on a phone.
