---
"@vegastack/design": patch
---

🛠 `vegastack-design check-updates` also checks registry files outside the components dir — `@lib/…` targets under `aliases.lib` (`date-time`, `page-layout`, `tile-overlay`, `drag-item`, `emoji-data`, `geo-data`) and `@hooks/…` under `aliases.hooks` — so a locally edited lib file is drift and fails `--fail-on-update` like an edited component. `--dir` still scans only that directory.
