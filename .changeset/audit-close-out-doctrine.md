---
"@vegastack/design": patch
"@vegastack/ui": patch
---

📚 **The `input` and `textarea` summaries no longer promise a focus ring they never had.** Both
text-entry controls signal focus with a border tint, not an outline — that is the rule in
[Accessibility](https://design.vegastack.com/docs/foundations/accessibility) and it is what the
shared field recipe implements — but `component-contracts.json`, the machine authority that feeds
the shipped design-system skill, still described "a focus-visible ring" for each. Both summaries are
corrected, so an agent reading the packaged skill roster is told what the components actually do.
The other 114 component summaries were audited for the same class of claim and hold.

Doctrine, in the same pass: `react-markdown` and `remark-gfm` are now sanctioned renderer engines
rather than an undocumented exception, and two version decisions are written down with their
evidence — TypeScript stays at 6.0.3 while no shipped `typescript-eslint` supports TypeScript 7, and
`tw-animate-css` stays bundled in `preset.css` because it is consumer-facing API that
[Quickstart](https://design.vegastack.com/docs/guides/quickstart) and
[Troubleshooting](https://design.vegastack.com/docs/guides/troubleshooting) both document.
