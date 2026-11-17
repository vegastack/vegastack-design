---
"@vegastack/ui": patch
---

🐛 Phone sheets: closing a peek sheet no longer sends focus to the list's search field when iOS Safari had focused the page's `<main>` on the tap (no keyboard pops up), and the shell's column sheet follows a downward drag and closes past a short distance or on a flick, without scrolling the page behind or starting Safari's pull-to-refresh. The assistant's card now stacks above a side peek instead of opening hidden behind it.
