---
"@vegastack/ui": patch
---

🐛 **RecordAsideSection**, **SectionToggle**, **AgentPanel** and **ShareDialog** no longer paint an expanded section's header grey. A ghost Button paints `aria-expanded:bg-muted` to say a menu or popover is open, but on a section that expands in place, expanded is the resting state, so every open section (the task page's "Subtasks 3" header, for example) looked pressed. The fix lives in a new lib, `@vegastack/disclosure-trigger`. Put its `disclosureTriggerClasses` on any ghost Button that toggles a section in place. It clears the fill while the pointer is elsewhere, and hover still shows. [docs](https://design.vegastack.com/docs/guides/components)
