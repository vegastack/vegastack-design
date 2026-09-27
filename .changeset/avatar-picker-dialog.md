---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 `AvatarPicker` is now just the avatar circle that opens a "Profile photo" dialog. In the dialog a 128px circle is the file button and a drop target (with a "JPEG, PNG or WebP · up to 10 MB" hint); a chosen file is only staged as a preview, **Update** awaits `onUpload(file)` and **Remove** clears a staged file or awaits `onRemove()`. While a call is pending the dialog shows a spinner and cannot be dismissed; it closes when the call resolves and shows the error's message when it rejects. API: `onUpload(file): Promise<void>` replaces `onSelect`; `onRemove` returns a promise; `busy` and `error` are gone (the component owns pending and error state); new `title` (default "Profile photo"), `updateLabel` ("Update"); `size` is `xs · sm · md · lg · xl` (32–80px) with `sm` (40px) the new default.
