---
"@vegastack/ui": patch
---

🧩 Citation pills hold their place.

- `MarkdownView` `streaming`: a whole `[[n]]` marker in the block still arriving renders as its pill straight away (a list answer no longer shows raw `[[1]]` until it ends); a half-written marker still waits.
- `MarkdownView` citations: the word before a pill and the pill sit in one `citation-run` that never wraps (`data-slot="markdown-citation-run"`), so a pill never starts a line alone; a no-break space couldn't hold a button.
