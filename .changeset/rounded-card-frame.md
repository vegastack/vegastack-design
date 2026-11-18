---
"@vegastack/ui": minor
"@vegastack/design-tokens": minor
---

⚠️ Shell: the rounded-card frame (LAY-26). From 40rem the global bar and the rail sit on the window's canvas and the column and the page share one rounded card, inset 8px from the window's end and bottom; new tokens `--shell-canvas`, `--shell-card`, `--shell-column`, `--shell-card-inset`, `--shell-card-radius` and `--shell-assistant-width`. `Shell` takes an `assistant`: an `AssistantCard` with `place="dock"` is a second card beside the page. `AssistantCard` gains `place` (`float`, `dock`, `popout`: a window the person drags by its header) and `AssistantCardHeader` offers the other places (`place`, `onPlaceChange`, `places`). The rail's two ends are new: `RailTop` and `RailTile` (the workspace's logo tile; `shape="avatar"` for the person's avatar under Settings). `GlobalBarSearch` gains `ask`, one search-or-ask box with an `Ask {name}` chip (⌘J); `GlobalBarHelp` is "? Help" with the brand-blue dot; `CommandSearch` gains `placement="bar"` and `CommandSearchInput` a `trailing` control. **Breaking:** `GlobalBarAsk` is removed, with no compatibility export: the box's Ask chip replaces it.
