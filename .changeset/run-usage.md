---
"@vegastack/ui": minor
---

🧩 `RunUsage`: what one agent run used, in three parts over one data shape. `RunUsageChip` is one muted line under an answer ("3 steps · 62k context (62 %) · 92 % cached · $0.03"); `RunUsagePanel` shows totals, each model's new, cache read, cache write, 1-hour cache write and output tokens (thinking within it), searches, scripts, Subagents and retries, the cache result per step with why it missed, and the total with Subagents; `RunUsageTable` has one row per model call with a total. Money is optional everywhere, estimates read "~", and the panel and table have empty, loading and error states.
