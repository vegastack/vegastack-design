---
---

📚 **The markdown export is real markdown.** The per-page `.md` route and `llms-full.txt`
previously emitted `<AutoTypeTable …/>` and `<ComponentPreview …/>` verbatim — 107 of 110 component
pages and 260 occurrences in `llms-full.txt` — so an agent reading the docs saw no props and no
example code at all. Every MDX component now renders to markdown: the exact fixture source the Code
tab shows, the flat prop tables, the install steps, the do/don't pairs. Browser-only surfaces are
replaced by a one-line note rather than dropped silently.
[guide](/docs/guides/agent-skills)
