---
"@vegastack/ui": minor
"@vegastack/design-tokens": minor
---

🧩 **Layout v2's frame parts** (Regent Layout v2, D1, D2, D9): [`GlobalBar`](/docs/components/global-bar), the 44px bar across the top of every page (column toggle, back and forward, workspace · search with ⌘K · Ask with ⌘J, Help, account), which is also the desktop app's draggable title row and is hidden on phones; [`Rail`](/docs/components/rail), the module rail with a bottom group and `RailBadge`, a compact 14px count of 10px tabular numerals that bites only the icon's corner (TYP-18's one exception, operator 17-11-2026); and [`NavTree`](/docs/components/nav-tree), a column's navigation with titled sections, items level with their title, children one 12px step in and threaded to their parent like the Inbox's events, counts, a fold control at a parent's end, arrow keys and a 44px touch size. New token `--shell-globalbar-height` (2.75rem).
