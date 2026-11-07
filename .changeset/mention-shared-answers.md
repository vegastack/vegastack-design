---
"@vegastack/ui": minor
---

🧩 `TextEdit`'s `@` menu keeps its answers for the whole tab under `mentions.cacheKey`, shared by every editor with that key; a focus prefetches the bare `@` answer (`prefetchMentions`, `clearMentionCache`), so the menu opens on rows that typing filters until the answer comes. A query starting with a kind (`@task `) or <kbd>Tab</kbd> asks for that kind only (`search`'s `only`), shown as a chip in the menu's header. A failed search offers Retry. `mentions.order: "answer"` keeps the source's group order. `SuggestionMenu` takes `header` and `statusAction`.
