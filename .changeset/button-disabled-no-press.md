---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **A disabled button no longer presses.** `Button` keeps pointer events while disabled (FRM-4), so a click still matched `:active` and shifted it 1px; inside a scroll container such as `PopoverBody` that transform counted toward overflow and grew a scroll bar on Windows. The press translate and the default/destructive press fills now skip a disabled or loading button.
