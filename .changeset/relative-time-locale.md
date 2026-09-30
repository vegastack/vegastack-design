---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 Dates no longer differ between the server and the browser. `RelativeTime`'s `locale` defaults to `DEFAULT_LOCALE` (`en-US`, now exported from the `date-time` lib) instead of the runtime's, so a server under a non-US `LANG` renders the same text as the browser and the page hydrates cleanly. This covers every DS part that shows a `RelativeTime` (inbox, comments, version list, media card, item, data list, truncated text). `DatePicker`'s display and a comment's "Edited" time use the same default.
