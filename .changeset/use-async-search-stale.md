---
"@vegastack/ui": patch
---

🐛 `useAsyncSearch` aborts the in-flight request as soon as the query changes, so a slow response for the previous text can no longer fill the list while the new query waits out its debounce.
