---
"@vegastack/ui": minor
---

🔧 **IconButton everywhere.** The dismiss, pager and toggle controls that were hand-rolled
`<button>` elements in Alert, AnnouncementBanner, Dialog, Sheet, Pagination, OnboardingChecklist and
FilterBar are now `IconButton`, and CopyButton, MessageScrollerButton, ColorPicker, EmojiPicker and
SplitButton's chevron half compose it too — so they all inherit the matrix, the focus ring, the
loading contract and the required accessible name. New `iconButtonGeometry(size, shape)` styles an
icon-only **link**: navigation stays a real `<a>` (PageHeader's back affordance) instead of acquiring
`role="button"`.
[docs](https://design.vegastack.com/docs/components/icon-button)
