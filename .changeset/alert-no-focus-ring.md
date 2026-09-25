---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **Alert has no focus ring** — an app can move focus to an error `Alert` so screen readers announce it; the alert no longer shows the focus ring, since it is not an interactive control. `SheetContent` takes `showOverlay={false}` to drop the backdrop for a non-modal panel docked beside the page.
