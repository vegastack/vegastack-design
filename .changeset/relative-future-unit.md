---
"@vegastack/ui": patch
---

🐛 **date-time** / **RelativeTime** / **ApprovalCard**: a future time moves up a unit only once it rounds past that unit's size, so a request that expires in 7 days reads "Expires in 7 days" before and after the exact 7-day mark, never "in 1 week" for one of them.
[docs](https://design.vegastack.com/docs/components/relative-time)
