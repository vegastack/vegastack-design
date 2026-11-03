---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **An invalid outline button keeps its red border in dark.** Outline's `dark:border-input` outranked `aria-invalid:border-destructive`, so an invalid `DatePicker` trigger (and any invalid outline `Button`) showed a plain border in dark mode. `Button` keeps upstream's own `dark:aria-invalid:border-destructive/50`, the same dark invalid border an `Input` has.
