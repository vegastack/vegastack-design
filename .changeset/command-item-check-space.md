---
"@vegastack/ui": patch
---

🐛 Command rows no longer keep an empty 24px slot at their end for a checkmark they never show. The slot is now opt-in: a checkable list passes `data-checked` (`"true"` or `"false"`) on its rows, as `PeoplePicker` does, so its checks still line up. A plain row's trailing text, such as the search palette's type and id, now reaches the row's end.
