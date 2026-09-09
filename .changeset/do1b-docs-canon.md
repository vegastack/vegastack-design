---
"@vegastack/ui": minor
---

📚 **Every component page now follows the page canon, and a gate says so.** All 116 pages carry the
canon's frontmatter (`registry`, `status`, `since`, `a11y`), the `## Installation` heading is now
`## Install`, and the five generated sections — install steps, anatomy, API tables, states tested
and the per-item changelog — are rendered from `registry.json`, `component-contracts.json` and
`CHANGELOG.md` on every page instead of being hand-typed on three. `tooling/content-lint.mjs`
enforces the section vocabulary, the section order, "nothing after Do / Don't except the
Changelog", and generated-not-typed, with a `--self-test` that observes each rule failing;
`tooling/verify-docs-export.mjs` additionally requires a playground or Story explorer to render
under the page's `## Playground` heading. The `registry` frontmatter field is required and is no
longer inferred from the page slug, so a wrong or missing item name fails the build rather than
composing the wrong `shadcn add` target. The `AutoTypeTable` alias for `ApiTable` is gone. On the
Command page the live dialog demo moved to ⌘J, because the docs site itself owns ⌘K and both
dialogs were opening at once.
[docs](https://design.vegastack.com/docs/components/button)
