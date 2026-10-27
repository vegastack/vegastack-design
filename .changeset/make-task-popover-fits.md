---
"@vegastack/ui": patch
---

🐛 **MakeTaskPopover** fits the window: it is never taller than the room the window leaves (`--available-height`), the lines scroll between the heading and the actions, and Create and Cancel stay in view however many lines there are (up to 50). Its title inputs stop at `titleMaxLength` characters (new, default 500), so an over-long title can't be typed. [docs](https://design.vegastack.com/docs/components/task-inline)
