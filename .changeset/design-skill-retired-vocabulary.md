---
"@vegastack/design": patch
---

📚 The shipped `vegastack-design-system` and `vegastack-design-audit` agent skills now name the retired vocabulary and the rules lint enforces.

The design-system skill's Don't list adds no arbitrary text sizes (`text-[13px]`), no ring as a
surface edge, and a table of every retired utility, token and component with what to write instead,
pointing at `vegastack-design doctor` to find them. The audit skill runs `doctor` in its first pass
and states one rule for copied-in components: don't edit one; if you must, it becomes yours and
`check-updates` reports it as drifted.
