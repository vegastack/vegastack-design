---
"@vegastack/ui": patch
---

🔧 `AvatarPicker` is an avatar-edit control: the circle is the button (named "Upload photo" or "Change photo"), with a dark scrim and pencil fading in on hover and keyboard focus, and a small pencil badge on the edge on devices without hover. The separate Upload / Change photo button is gone. While `busy` the scrim holds a spinner over an instant local preview of the chosen file; `person.image` shows again when `busy` ends. `size` is now `sm` (40px) · `md` (48px, the new default) · `lg` (64px) · `xl` (80px), with initials scaled to match. "Remove" is a small ghost button beside the circle.
