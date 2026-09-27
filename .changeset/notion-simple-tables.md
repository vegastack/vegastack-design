---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 `TextEdit` and `MarkdownView` tables are Notion's simple table: a rounded outer border, a rule between every cell, and a header row on a muted ground at medium weight — the same `prose.table` styles in the read view and the editor. The floating table toolbar is gone; hovering a table shows a row grip and a column grip (click for a menu — insert, move, duplicate, clear, delete; drag to reorder), a corner grip where every block's handle sits (select the table, clear, delete; drag to move it; header row/column toggles in HTML), and "+" bars that add a row or column at the end. Column borders drag to resize. `Shift+F10` opens the menu from the keyboard, Tab in the last cell adds a row, and markdown round-trips unchanged. The stray block handle over a table is gone.
