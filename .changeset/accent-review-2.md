---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 `NavTreeItem` takes `quiet`: the same place listed again (Favourites, Recent) keeps the neutral selected fill, so one row wears the accent. A filled button in `AlertAction` is ink in every accent, and inline chips in prose keep their own colour (COL-27). Black is unchanged.
