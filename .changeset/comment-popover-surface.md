---
"@vegastack/ui": patch
---

🐛 **`CommentPopover` has a surface.** It drew no fill, so a comment thread shown as a popover let the page read through it. It now draws `PopoverContent`'s floating surface, in light and dark. A `CommentThread` inside gives up its own border, fill and shadow, so nothing doubles, and looks as it did in the margin everywhere else. A `CommentComposer` keeps its border, its focus cue, and the popover draws none.
