---
"@vegastack/ui": patch
---

🐛 **AutoSaveIndicator** no longer shows "Saved" beside a field's own error: `invalid` replaces the tick (and the spinner) with a visible "Not saved" in the warning ink, in both variants (`labels.invalid`). New `useInvalidRevert({ invalid, onRevert, delay = 1000 })` returns `onBlur`/`onFocus` for the field: leaving it while invalid puts the last saved value back a second later through `onRevert`, which shows the host's message; returning to the field or fixing the value cancels it. `AutoSaveInput` reads a value `validate` rejects as "Not saved" rather than "Save failed", and `onInvalidRevert(savedValue)` (with `revertDelay`) turns on the revert. [docs](https://design.vegastack.com/docs/components/auto-save-input)
