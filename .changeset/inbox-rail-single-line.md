---
"@vegastack/ui": patch
---

🐛 `InboxItem`'s thread rail no longer doubles up beside a middle event's curve. `--border` is translucent, so the rail and the connector's own start border read as a brighter stretch where they overlapped; the rail now takes over from the curve 6px down, where the curve leaves its pixel column, so each height draws one line.
