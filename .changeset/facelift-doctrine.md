---
"@vegastack/design": patch
"@vegastack/ui": patch
---

📚 The docs and the agent skills now state one convention per concern: numbers, page headings, link buttons, theme choice, empty states, view switches, page spacing and the conventions for components we own.

- Numbers (counts, dates, amounts) are the regular font with `tabular-nums`; `font-mono` is for code and identifiers only. [docs](https://design.vegastack.com/docs/foundations/typography)
- One page heading: `PageHeader`, `font-heading text-2xl font-semibold`; a section is `font-heading text-base font-medium`.
- One link-button recipe: `<Link className={buttonVariants({ variant, size })}>`, never `Button render={<Link/>}`. [docs](https://design.vegastack.com/docs/components/button)
- Theme choice is a Light / Dark / System radio group in the user menu. [docs](https://design.vegastack.com/docs/guides/provider-setup)
- Two new empty-state tiers, "No matches" and "Couldn't load", plus default copy rules. [docs](https://design.vegastack.com/docs/foundations/empty-states)
- One view-switch rule: RadioGroup for a form value, ToggleGroup for a view or scope switch, Tabs for page regions, links for URLs.
- A page-rhythm recipe for gutters and gaps. [docs](https://design.vegastack.com/docs/foundations/spacing)
- `design.md` gains the conventions for components we own and a component / part / block / example decision tree; the public skill gains "Names hide abilities" and "Which component for X".
- Registry metadata for button, label, chip, filter-bar-managed, select, command, emoji-picker, chip-input, message-scroller, badge, toggle-group and radio-group now says only what the components do.
- The shadcn-reset decision register is tracked in git, with true counts (180 rows: 108 shadcn, 72 ours).
