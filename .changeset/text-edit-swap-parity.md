---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 TextEdit read view and editor are pixel-identical. A callout lays out in one row with its icon at the same x in both (the read icon no longer spans two rows; the editor's tone button takes the icon's 16px column), and a read-only code block's language label sits where the editor's picker does. The swap browser test now compares every block of a rich document (headings, lists, tasks, quote, callout, code, table, toggle, file chip, rule) — position, height and first-character x — between the read view and the editor.
