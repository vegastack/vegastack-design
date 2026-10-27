---
"@vegastack/ui": patch
---

🧩 **ShortcutOverlay** takes page-scoped `groups={[{ id, label, active, items }]}` as an alternative to `shortcuts`: groups with `active: true` (this page) come first, groups without `active` (General, Go to) follow, and `active: false` groups (other pages) appear only with the new **All shortcuts** switch (`allShortcutsLabel`), which resets at every opening. A filter query searches every group. The line under the title is now `description` (default unchanged). `shortcuts` is optional; existing callers are unchanged. [docs](https://design.vegastack.com/docs/components/shortcut-overlay)
