---
"@vegastack/ui": patch
---

🧩 **MarkdownView**: comment on a selection in read mode — `onCreateAnnotation(anchor)` shows a floating **Comment** button over a selection inside the view (`TextEdit`'s read-only selection bubble; `commentLabel` renames it) and hands over `{ quote, prefix, suffix, start, end }` computed over the same text `annotations` resolve against, so the anchor passed straight back highlights exactly the selected words. Mentions and images count whole; whitespace, atoms or code alone show nothing. It flips and slides into view, hides while the selection is scrolled out, opens below the selection on a coarse pointer, closes on Escape, and Tab reaches it from a keyboard selection; the view stays server-safe. **TextEdit**, **MarkdownView** and **SuggestionMenu**: `floatingSafeArea` (`{ top, bottom }` px) keeps every floating part — selection bubble, link panel, slash and mention menus — clear of a sticky header or a bottom bar; TextEdit's selection bubble opens below the selection on a coarse pointer.
[docs](https://design.vegastack.com/docs/components/markdown-view)
