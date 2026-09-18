# Migrating to the shadcn reset

**This file is a pointer. The guide itself is a docs page, and that page is the only authority.**

- Published: <https://design.vegastack.com/docs/guides/migrating-shadcn-reset>
- Source, and the file to edit: `apps/docs/content/docs/guides/migrating-shadcn-reset.mdx`

There is deliberately no second copy of the text here. A 1,400-line duplicate with no gate holding
the two halves together is the drift this repo's truth hierarchy exists to prevent, and one document
is simpler than a sync script plus its `--check`.

## What it is

The consumer-facing migration from 0.4.x to the shadcn reset — `@vegastack/design` 0.5.0,
`@vegastack/design-tokens` 0.5.0, `@vegastack/ui` 0.10.0. A minor bump with a breaking surface, not a
1.0, and there is no compatibility layer: a retired import fails to resolve, and a deleted CSS token
compiles to nothing while the page keeps rendering, just wrong.

It is written to be **executed by an agent** (Claude Code, Codex) against a real consumer project:
every rule is an exact before and after, every stage of the upgrade has a verification step, and
every category of holdover has an `rg` pattern that proves a project is clean of it.

## Its sections

1. How an agent should use this page
2. What changes visually
3. The upgrade procedure — five stages, each with its own verification
4. Deleted tokens, with an exact replacement for each
5. Typography: the whole scale shifted one step
6. Status colour now has two inks
7. Removed exports — `@vegastack/design`, the variant recipes, the `<Name>Props` aliases
8. The ten retired components, each with its prop map and runnable code
9. Removed outright: the marketing layer
10. API changes, component by component
11. What is new
12. Proving a project is clean — the ten searches
13. If you see X, it means Y — the silent failures
14. A full file, migrated end to end
15. Why this happened
