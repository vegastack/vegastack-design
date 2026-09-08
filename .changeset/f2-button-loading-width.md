---
"@vegastack/ui": minor
---

🔧 **A loading Button no longer changes width.** The spinner is taken out of flow and stacked
over the label, which keeps its box behind `opacity-0` — not `visibility: hidden`, which would drop
the label out of the accessibility tree and leave a pending button with no name; previously a "Save
changes" button jumped about 20px the moment a request started.
[docs](https://design.vegastack.com/docs/components/button)
