---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **RecentStrip**'s ‹ › scroll buttons no longer jump down when pressed. They were centred with `-translate-y-1/2`, and Button's press nudge (`active:translate-y-px`) sets the same `translate` property, so a press replaced the centring and dropped the arrow by half its height. They now centre with `inset-y-0 my-auto`, the idiom DatePicker, SearchableSelect and Carousel already use; no other registry Button positions itself with a translate.
