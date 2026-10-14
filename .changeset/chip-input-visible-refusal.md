---
"@vegastack/ui": patch
---

🔧 **ChipInput**: a refused entry (a duplicate, or one past `max`) and an invalid entry now also show as one short line under the field, cleared by the next keystroke, so a sighted user sees why the typed text stayed put. The polite announcement is unchanged. The field now renders inside a `data-slot="chip-input-root"` column; `className` and `ref` still go to the box.
[docs](https://design.vegastack.com/docs/components/chip-input)
