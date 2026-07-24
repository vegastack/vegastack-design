# Docs and Showcase Findings

## Overall

Docs coverage is mechanically strong:

- 64 registry items.
- 64 component docs pages.
- 64 nav/meta entries.
- Component pages generally include install command, preview, API section, accessibility notes, and Do/Don't guidance.
- `toast` is a docs route for the `sonner` registry item.

## Findings

| Priority | Finding                                                                | Evidence                                                                                                                                                                     | Impact                                                         | Suggested fix                                                                                     |
| -------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| P1       | Consumer install workflow is incomplete.                               | Per-page install commands show direct `@vegastack/<name>` add; no page explains namespace setup, production registry URL, service-token auth, or private registry preflight. | Consumers copy commands that only work after hidden setup.     | Add an "Install From VegaStack Registry" guide and reusable callout.                              |
| P2       | API tables under-document compound components.                         | Command, Table, Sidebar, Dialog, Select, Menus, Field, Card, Pagination, Popover, Sheet, Tabs have more exported prop surfaces than documented tables.                       | API section is not a complete public contract.                 | Generate API tables from exported prop types or explicitly mark omitted native passthrough parts. |
| P2       | Focus wording drifts from implementation.                              | MDX frequently says `ring-ring/50`; docs app applies global `outline-ring` in `apps/docs/app/global.css`.                                                                    | Accessibility text is inaccurate.                              | Standardize wording around visible global focus outline.                                          |
| P2       | Data List empty preview exists but is not rendered in the MDX section. | `apps/docs/components/preview/data-list.tsx` exports empty state; `data-list.mdx` renders loading only under "Loading & Empty states".                                       | One core state is not visually documented.                     | Add `dataListEmpty` preview or combine loading/empty preview.                                     |
| P3       | Toast/Sonner naming is mechanically consistent but unexplained.        | Docs route/page is `toast`; registry item/file/import is `sonner`.                                                                                                           | Readers may search for `@vegastack/toast` and assume mismatch. | Add one sentence explaining registry item is named `sonner` because it wraps Sonner.              |
| P3       | Component count copy is stale.                                         | Home/intro say `~50 components`; inventory is 64.                                                                                                                            | Small trust leak.                                              | Use `64 components` or `60+ components`.                                                          |
| P3       | CSS comment still says "Radix-based copy-in components".               | `apps/docs/app/global.css` scroll-lock comment.                                                                                                                              | Maintainer confusion during Base UI migration.                 | Reword to "overlay/search components" or actual source.                                           |
| P3       | Preview lookup fails silently.                                         | `ComponentPreview` returns `null` when preview name is missing; page preview lookup also falls back to `null`.                                                               | Future MDX typo can ship blank content.                        | Throw in build/dev or render an explicit missing-preview error.                                   |

## View Transitions

No component-level ViewTransition usage is needed. Low-level primitives should not gain transitions by default.

Future docs-app opportunity:

- If docs navigation is animated, place transitions at page/content boundaries, not inside primitives.
- Keep sidebar/header persistent and stable.
- Prefer URL-backed navigation examples over `router.back()` where continuity matters.
- Enable Next's view transition config only when a concrete route transition is implemented.
