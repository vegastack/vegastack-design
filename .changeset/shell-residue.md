---
"@vegastack/ui": minor
"@vegastack/design": patch
---

🗑 **The shell's last predecessors are removed**, with no compatibility aliases (shell layout L22). `sidebar` (upstream; now in `excluded.json`, its patch gone) and `page-layout`'s `RAIL_COLLAPSED_QUERY`; `notification-bell`'s bell and its `use-animation-replay` hook (`useAnimationReplay`, `useShakeOnInvalid`); `RecordLayoutRail`, `RecordDetailsSheet`, `useRecordLayoutWide` and `RecordLayout`'s `stack`, so a record page is one column and its details open in the shell panel; `DocumentLayoutAside` and `DocumentLayout`'s `aside`; `SheetContent`'s `beside`; `AudioPlayer`'s `--audio-player-inset-end`, which only cleared a rail. `NotificationDot` moves to its own item, `notification-dot`. `HelpMenu` no longer builds on the sidebar: its `trigger` is required and is the shell's rail item (`ShellRailItem`). No consuming app uses any removed part; a consumer deletes its copies of `sidebar`, `notification-bell` and `use-animation-replay` before `ds:pull`.
