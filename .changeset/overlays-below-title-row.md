---
"@vegastack/ui": patch
---

🐛 Desktop app title row (LAY-24): with `data-desktop-titlebar` on `<html>`, a left, right or top `Sheet`, a side or top `Drawer` and the file viewer start below the window's title row (`--shell-globalbar-height`), so they never sit under the macOS traffic lights or the Windows caption buttons. Backdrops still cover the whole window; browsers are unchanged.
