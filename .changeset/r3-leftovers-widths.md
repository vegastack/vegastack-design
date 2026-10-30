---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **Folded view tabs and menu editors size themselves** (`view-tabs`, `option-list-editor`): folded `ViewTabs` keep the pill row's 32px so the toolbar stays 12px below on a phone; an `inMenu` `OptionListEditor` brings its own 280px width.
