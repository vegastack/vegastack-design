---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 Inbox rows say more at a glance: an unread row carries a small dot in its start gutter (beside the tint and the sr-only "Unread:"), and `InboxItem` takes a `badge` — a small glyph on the avatar's corner naming the kind of event (assigned, a mention, a comment), decorative so the title carries the meaning. `SettingsSection` keeps its actions (an autosave status, a button) on the title row beside a long description instead of wrapping them onto a row of their own. A person `InlineChip`'s initials no longer break onto two lines in a narrow, break-anywhere column (a mention in a comment on a phone).
