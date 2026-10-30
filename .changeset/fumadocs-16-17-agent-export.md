---
"@vegastack/ui": patch
---

🛠 **Docs site on Fumadocs 16.17**: the agent export (each page's `.md`, `llms.txt`, `llms-full.txt`) now renders MDX components through Fumadocs' `output: "function"` markdown API instead of the removed `stringify` hook; the exported content is unchanged. The real `shadcn add` consume proof installs public npm deps through the runner LAN cache (npmjs fallback) and reads shadcn's own registry JSON from the pinned `vendor/shadcn` snapshot instead of ui.shadcn.com.
