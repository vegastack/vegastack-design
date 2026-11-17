---
"@vegastack/ui": minor
"@vegastack/design": patch
---

🗑 **Shell clean-up — the parts the shell replaced, and items no app uses, are removed**, with no compatibility aliases (shell layout L22). Replaced by the shell: `app-shell` (every `AppShell*` part, `pageGutterClasses`) and its block `app-shell-01`, `record-peek` and its `use-record-peek-row` hook, `settings-layout` and `sidebar-menu-flyout`; `page-layout` drops `pageGutterOf`. Never used by a consuming app: `access-chip`, `animated-number`, `announcement-banner`, `country-select`, `region-select` and their `geo-data` lib, `field-type-link-step`, `formula-input`, `level-meter`, `rating-bars`, `timeline`, `upload-dialog` and the `use-optimistic-action` hook; `table` no longer ships the orphaned `table-scroll-region.tsx`. The blocks sit in `ShellPage` (and `notifications-01` in `Shell`), parts that read the old shell's slots (`page-header`, `audio-player`, `auto-save-input`, `upload-panel`) read the shell's, and `vegastack-design doctor` checks `ShellPage`. A consumer that still holds a copy of a removed item deletes it before `ds:pull`.
