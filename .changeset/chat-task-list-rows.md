---
"@vegastack/ui": patch
---

🐛 `ChatTaskList` renders its rows without a curried render function, so apps that lint `react/display-name` over registry copies stay clean.
