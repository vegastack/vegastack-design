---
"@vegastack/ui": patch
---

🧩 `RunUsagePanel` and `RunUsageTable` render their error announcer as an element, not a component made in render, so apps linting with React's `static-components` rule accept them. No visible change.
