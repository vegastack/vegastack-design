---
"@vegastack/design-tokens": patch
"@vegastack/ui": patch
---

🔧 New theme-invariant `--scrim` / `--scrim-foreground` token pair (black and white in both themes, with `bg-scrim` / `text-scrim-foreground` utilities) for the wash a photo wears under a control. The `tile-overlay` recipe — `Attachment` tile corner actions, `SortableList`'s grid handle and actions, and `AvatarPicker`'s photo overlay — now paints `bg-scrim/40 text-scrim-foreground` (`/60` on hover and open) instead of raw `bg-black/40 text-white`, so it follows the tokens-only rule and a theme can retune every tile overlay in one place. The rendered result is unchanged.
