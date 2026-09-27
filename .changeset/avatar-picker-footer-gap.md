---
"@vegastack/ui": patch
---

🐛 `AvatarPicker`'s dialog no longer leaves extra space under its footer: the hidden file input sat in the dialog's grid as a zero-height row and added a 16px gap, so it now lives, not displayed, inside the drop circle, whose wrapper is `flex` so the dialog no longer grows 4px when a photo replaces the initials. A pending call's spinner now sits in the button that started it (Update or Remove, via `loading`), not over the photo; the other button and the circle are disabled until it settles.
