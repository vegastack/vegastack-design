---
"@vegastack/ui": patch
---

🐛 **TextEdit**: a table column's width is its own (Notion) — the first resize, and every column added (160px), stores each column's width, so widening or adding a column no longer squeezes the others and a wide table scrolls inside its box. A document ending in a table, audio, video or image keeps room below it: clicking there, ↓ from the table's last row, or ↓ / → on the selected block adds an empty paragraph to type in. A `variant="composer"` comment box no longer shows a scrollbar after a mention (the chip's hit area overflowed its last line). (Regent operator, 23-10-2026.)
