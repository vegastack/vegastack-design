---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **No focus ring on programmatic focus targets** — `AppShellContent`'s `<main>` (the skip-link and route-change focus target) no longer draws a focus outline, which showed as a line under the app header after navigation. The same applies to `SheetContent`'s popup, the `MultiStepForm` step heading and section list, and the `Stepper` summary; interactive controls keep their focus rings.
