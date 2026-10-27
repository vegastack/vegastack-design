---
"@vegastack/ui": patch
---

🔧 **VersionCompare**: the host can choose the side a phone shows — `defaultPhoneView` (`"list"` by default) or controlled `phoneView` with `onPhoneViewChange`, which reports `"preview"` on a pick and `"list"` from the back button. A "View changes" link to one checkpoint passes `defaultPhoneView="preview"` with `selectedId` and `showChanges`, so a phone opens on that version's changes instead of the list. Nothing changes when none is passed. [docs](https://design.vegastack.com/docs/components/version-compare)
