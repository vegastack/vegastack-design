---
"@vegastack/ui": minor
---

⚠️ **ShellAssistant** — two places instead of three (LAY-26). `AssistantPlace` is `"float" | "dock"`: `"popout"` is gone and the floating card takes its job, opening at the page area's corner, dragging by its header to anywhere in the window and resizing from its top-start corner (Alt and an arrow key still move it). `AssistantCardHeader` offers the one other place — docked, "Float over the page"; floating, "Dock beside the page" — and its `places` prop is removed: a host that moves the chat elsewhere (its own window, a phone's sheet) omits `onPlaceChange` and adds its own tool in `actions`. The ↙↗ "Float as a card" button is gone, so nothing in the header reads as minimise next to Open full chat.
