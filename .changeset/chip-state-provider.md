---
"@vegastack/ui": patch
---

🔧 **InlineChip**: `InlineChipResolver.state(kind, id)` gives every chip without state of its own its record's state — a done task's check, a canceled or duplicate task struck through with its status — so one `InlineChipProvider` shows a record alike in an editor, a rendered body and a comment. A surface's own `mentionStatus` still wins. `TextEdit` and `MarkdownView` pass no state when theirs answers none.
