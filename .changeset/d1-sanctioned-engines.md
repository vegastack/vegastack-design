---
---

📚 **`react-day-picker` and `next-themes` are now named sanctioned engines** in AGENTS.md
§ Sanctioned dependency exceptions and in `design.md`, with their one-file isolation written down.
Both were already shipping and neither was on the list. `react-day-picker` v10 is the calendar state
machine behind `date-picker` — Base UI ships no Calendar, and shadcn's Calendar is this package under
every base; `next-themes` is the theme engine mounted only by `provider`, which `sonner` reads
through `useTheme()` rather than mounting a second time.
[docs](https://design.vegastack.com/docs/components/date-picker) ·
[`0eb7eca`](https://github.com/VegaStack/vegastack-design/commit/0eb7eca)
