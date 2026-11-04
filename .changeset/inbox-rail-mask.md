---
"@vegastack/ui": patch
---

🐛 `InboxItem`'s thread rail is one unbroken line past a middle event. The rail runs that event's full height and the connector masks off the rail's pixel column, leaving only the curve, which removes the small gap where the curve left the rail before the rail resumed. The last event has no rail and keeps its whole connector.
