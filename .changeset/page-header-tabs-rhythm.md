---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **Page header tabs keep the list page rhythm** (`page-header`): the `tabs` row sits 24px under the title and, in an `AppShellPage`, 12px above the page below — the same title → tabs → toolbar spacing as a `ListToolbar`'s tabs row — instead of 8px under the title and 24px above the page below. No prop change.
