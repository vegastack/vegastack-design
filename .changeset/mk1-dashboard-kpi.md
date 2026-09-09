---
"@vegastack/ui": minor
---

🔧 **dashboard-01's KPI labels no longer truncate.** Every stat label was cut at the 2-column width
("Active agen…", "Tasks compl…", "API calls (24…"). The label now wraps to two lines across the full
header and the trend badge sits on the value row, beside a short mono figure; the header breadcrumb
collapses at `maxItems={2}` so it stays one line at 320px.
[docs](https://design.vegastack.com/docs/blocks/dashboard-01)
