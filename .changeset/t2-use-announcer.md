---
"@vegastack/ui": minor
---

🧩 **`use-announcer`** — the one polite live region. Destructure `announce` and `Announcer`
from `useAnnouncer()` and render the `Announcer` element once per component. It keeps the region
mounted and observed from first paint, re-keys it per call so an identical consecutive announcement
is still spoken, and holds its state outside the host so announcing no longer re-renders a whole
DataGrid.
[docs](https://design.vegastack.com/docs/guides/components)
