---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 **Overlay footers are as plain as their headers** — `DialogFooter` and `AlertDialogFooter` drop the muted, top-bordered band and sit in the popup's own padding. `SheetFooter` right-aligns its actions at every width instead of stacking them full width; give a Cancel `data-slot="sheet-cancel"` to seat it at the start edge. Secondary actions use `variant="secondary"`: `AlertDialogCancel`, `DialogFooter showCloseButton`, and `MultiStepForm`'s Back, Skip and Exit now default to it, and the `MultiStepFormActions` row is right-aligned with no divider. See [Sheet](/docs/components/sheet) and [Dialog](/docs/components/dialog).
