---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 Keep the share-01 dialog the same height when switching between its Share and Publish tabs. Both panels stay mounted in one grid cell, with the inactive one invisible and inert, and the Share tab's footer keeps its space on the Publish tab. The dialog and the phone sheet are as tall as the taller panel, whether the people list is long or empty.
