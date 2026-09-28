---
"@vegastack/ui": patch
---

🐛 `RecordLayoutRail` keeps its gap when the page scrolls: it sticks `--record-rail-gap` (default `--spacing(8)`, `AppShellPage`'s top gutter) below the top of the scroll container instead of touching the header, and its own scroll height leaves that gap above and below (`--record-rail-offset` now defaults to `--spacing(14)`, the `AppShellHeader`). `useRecordLayoutWide()` also returns `rail` and `sheet` mount flags — both `true` until the layout is measured — so a server-rendered record page paints its rail on first load instead of popping it in after hydration.
