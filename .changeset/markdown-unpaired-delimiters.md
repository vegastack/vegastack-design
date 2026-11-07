---
"@vegastack/ui": patch
---

🐛 `text-edit-markdown` escapes a `[`, a backtick, `*`, `_` or `~` only where Markdown could read it as syntax. A `[` is escaped at a line's start, inside link text, or in a block that holds a `](`, `][` or `]:`; a backtick, `*`, `_` or `~` is escaped only when its block holds another one, the writer's own delimiters included. Plain text such as `["a", "b"]`, `see [1]`, `~5 min` or `a*b` is now written as typed, so a chat message or comment reaches its reader unchanged instead of with `\[` and `\~`.
