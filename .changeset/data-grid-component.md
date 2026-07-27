---
"@vegastack/ui": minor
---

New component: `DataGrid` — the full-parity grid DataList's docs always pointed to. TanStack Table computes the sorted row model (multi-key sort with visible ordinals, shift-click additive); TanStack Virtual windows rows behind the `virtualize` flag; the APG grid keyboard layer — roving cell focus with RTL-aware arrows, Enter/F2 into `EditableCell` managed editing, Escape restore — is the component's own. Also: column picker + responsive column revelation (visible/hidden/merge), collapsible per-value grouping as real `tbody` sections, keyboard-continuous load-more, and row selection. Install with `shadcn add @vegastack/data-grid`.
