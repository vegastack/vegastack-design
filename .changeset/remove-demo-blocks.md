---
"@vegastack/ui": minor
"@vegastack/design": patch
---

🗑 **Demo blocks** — the registry no longer serves the 28 upstream demo blocks that did not meet the rulebook, and the `@dnd-kit` drag engine they needed is gone with them.

- Removed: `dashboard-01`, `login-02`…`login-05`, `signup-01`…`signup-05`, `sidebar-01`…`sidebar-16`, `preview-03` and `onboarding-01`.
- Kept: `login-01`, `app-shell-01`, `board-01`, `settings-01` and the 68 chart blocks.
- Where each recipe went: shells and sidebars → `app-shell-01`; sign-in → `login-01`; the dashboard → `app-shell-01` plus the Chart and Stat pages; the getting-started checklist → the Item page's Checklist example.
- `@dnd-kit/*` and `thesvg` leave `@vegastack/ui`; `@atlaskit/pragmatic-drag-and-drop` stays the one drag engine, and `Icon`/`BrandIcon` in `@vegastack/design` keep their own `thesvg`.
- An installed copy of a removed block is yours and keeps working; `shadcn add` of a removed name now fails.
  [docs](https://design.vegastack.com/docs/blocks/app-shell-01)
