---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 One page layout. `AppShellPage` has three widths — `prose` (720px of content, centred; `narrow` is its deprecated old name for one release), `default` (1280px, centred) and `full` (edge to edge) — and one gutter, `--page-gutter` (16px, 24px from 640px, 32px from 1024px), which `AppShellHeader` pads with too and `RecordLayoutRail` sticks below, so the header, page and rail edges line up. The new `page-layout` lib's `definePageWidths` declares every route's width once for the page, its loading skeleton (`widthOfPath`) and a route test, and `vegastack-design doctor` fails on an `AppShellPage` that sets its own `max-w-*`, `mx-*` or padding class and warns on `size="narrow"`. New docs page: Foundations › Page layout.
