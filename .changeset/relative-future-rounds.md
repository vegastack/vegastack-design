---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **date-time** / **RelativeTime** / **ApprovalCard**: a future time rounds to the nearest unit instead of cutting down, so a request that expires 7 days from now reads "Expires in 7 days" the moment after it is made (it read "in 6 days"); `formatRelative` "in 6d" becomes "in 7d" the same way. Past times still count completed units ("6 days ago").
[docs](https://design.vegastack.com/docs/components/relative-time)
