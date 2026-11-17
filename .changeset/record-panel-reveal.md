---
"@vegastack/ui": patch
---

🐛 Record Layout: `useRecordPanel().reveal` asked before the record is measured (a `#comment-` link on load) waits for the panel's mode, so on a record too narrow to dock it opens floating instead of a docked panel that never shows.
