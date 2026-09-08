---
"@vegastack/ui": minor
---

Button becomes two axes: `variant` (`solid · soft · outline · ghost · link · cta`) × `tone`
(`neutral · destructive · success · warning · info`), written as ten class strings instead of
fifteen hand-maintained variants. `glass`, `finish="lit"` and the seven colour-in-the-name variants
are deleted; `tone="destructive"` with `variant="solid"` is a type error. The size vocabulary is one
scale everywhere — `xs · sm · md · lg`, no tier named `default`, and Button has no icon size at all.
Icon-only controls are `IconButton`, which gains `shape="square" | "round"` and replaces the
hand-rolled `<button>` dismiss/pager/toggle controls across Alert, AnnouncementBanner, Dialog,
Sheet, Pagination, OnboardingChecklist, FilterBar, ColorPicker, EmojiPicker, PageHeader, CopyButton,
MessageScroller and SplitButton, with a new `iconButtonGeometry(size, shape)` helper for icon-only
LINKS (navigation stays a real `<a>`). A loading button no longer changes width, and `disabled` is
`aria-disabled` so a Tooltip can explain why an action is unavailable.
