---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **RecentStrip**'s ‹ › scroll buttons and the **DocumentLayoutJumpCue** pill no longer jump down when pressed. Both positioned their Button with a y-translate (`-translate-y-1/2`, `-translate-y-full`), and Button's press nudge (`active:translate-y-px`) sets the same `translate` property, so a press replaced the positioning and dropped the control by half (or all) of its height. The strip's buttons now centre with `inset-y-0 my-auto` (the idiom DatePicker, SearchableSelect and Carousel already use) and the jump cue's band aligns the pill with `items-end`; no other registry Button positions itself with a y-translate.
