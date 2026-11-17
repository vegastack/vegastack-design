---
"@vegastack/ui": minor
---

⚠ **`Shell` is the Layout v2 frame**: `globalBar` on top, then the rail, the column and the page. `railHeader`, `columnHead` and `titleBarControls` are removed; the column toggle is `ShellColumnToggle` (hidden on a screen with no column) in the global bar, and the desktop title row (LAY-24) is the global bar's alone. `ShellColumnHeader` is the column's 48px title row, level with the page's top bar. The page's top bar keeps one order, the title then presence · tools · primary · Share · ☆ · ⋯ (`ShellTopBarShare`, `ShellTopBarFavorite` and `ShellTopBarMore` are new; ⋯ is always last), and its tools, Share, ☆ and ⋯ share one 28px button shape. `HelpMenu` opens under the global bar's Help button (`side` `bottom`, `align` `end`), and `ShellBottomBarItem`'s count is `RailBadge`.
