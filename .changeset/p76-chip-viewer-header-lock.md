---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **Grid cells and headers: file chips open the file, header menus hold the grid still, and a frozen primary header stays in its cell.** `FieldFile` gains an optional `href` (the host's file link): a grid cell's file chip opens it through the chip provider's `onOpen` (a file viewer) instead of the provider's record link, and an image thumbnail opens the same way. While a `DataGrid` header menu is open the grid is locked like an editing cell (the lock layer is exported as `CellLock`), so the grid can't scroll the menu away from its header. A frozen primary column's header label no longer reaches past its cell into the next column when the rows open (`onRowOpen`).
