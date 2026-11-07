---
"@vegastack/ui": patch
---

🐛 `MarkdownView` takes `linkOrigin` and `onNavigate`. A link on the app's own origin renders as its in-app path (no new tab, no domain after it), and a plain click on an in-app link calls `onNavigate`, so a host's router changes the page without a reload and a side panel around the view stays open. Modified clicks stay the browser's; external links still open a new tab.
