---
"@vegastack/ui": patch
---

🐛 **markdown-as-typed (new lib) + ChatComposer**: `markdownAsTyped(markdown)` turns stored Markdown into the text as the person typed it, for a reader that isn't a Markdown renderer (a model reading a chat message, a bubble): real formatting stays, escapes the writer added only to keep plain text from reading as syntax are dropped (`\_\_init\_\_` → `__init__`), hard breaks become newlines, and code keeps every backslash. The serializer itself is unchanged, so comments, pages and a composer's Edit still round-trip.
