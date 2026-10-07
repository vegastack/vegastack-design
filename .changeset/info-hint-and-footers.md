---
"@vegastack/ui": patch
---

🔧 Add `InfoHint`, a footer slot on `ShortcutOverlay`, and a linkable email footer note.

- `InfoHint` is a muted icon-only info button that opens one sentence in a popover, with an optional `href` link that opens in a new tab. `label` names the trigger ("About spaces"). Add it with `shadcn add @vegastack/info-hint`.
- `ShortcutOverlay` takes an optional `footer`, rendered below the shortcut list.
- The email kit's `EmailLayout` footer takes `noteHref`, which links "VegaStack" in the default "Sent with VegaStack" note, and `note` now accepts inline content.
