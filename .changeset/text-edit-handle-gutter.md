---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 TextEdit's block drag handle stays inside its container. The ⋮⋮ grip is now 10px wide and sits 3px before the text (was 18px, 4px out), so it fits in the 16px padding of a Dialog, Sheet, Popover or Card instead of touching the edge, and it is clamped just inside a `boxed` editor's border or the container when the padding is narrower. The text keeps its column: nothing indents while the handle is hidden.
