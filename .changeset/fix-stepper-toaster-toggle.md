---
"@vegastack/ui": patch
---

🐛 **Stepper, Toast, Toggle**: the current step now carries the same 1px transparent border as the clickable steps, so the node and label no longer shift by a pixel when the step changes. A bottom `Toaster` stack also rises by `--toaster-offset-bottom` (default `0px`) — set it on `:root` while a sticky footer is mounted so toasts stop covering it. A pressed `Toggle` and `ToggleGroupItem` name their `foreground` ink instead of inheriting it, so a selected chip stays at AA contrast on the `muted` fill.
[docs](https://design.vegastack.com/docs/components/stepper)
