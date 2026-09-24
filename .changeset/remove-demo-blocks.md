---
"@vegastack/ui": minor
"@vegastack/design": patch
---

🗑 **Demo blocks** — the registry no longer serves 28 demo blocks that did not meet the rulebook (27 upstream compositions and our `onboarding-01`), and the `@dnd-kit` drag engine they needed is gone with them.

- Removed: `dashboard-01`, `login-02`…`login-05`, `signup-01`…`signup-05`, `sidebar-01`…`sidebar-16`, `preview-03` and `onboarding-01`.
- Kept: `login-01`, `app-shell-01`, `board-01`, `settings-01` and the 68 chart blocks.
- Where each recipe went: shells and the sidebar variants → `app-shell-01` and the Sidebar page; sign-in → `login-01`; sign-up → compose it from `login-01`'s frame with Field and PasswordInput; the dashboard and `preview-03` showcase → `app-shell-01` plus the Chart and Stat pages; the getting-started checklist → the Item page's Checklist example.
- `@dnd-kit/*` and `thesvg` leave `@vegastack/ui`; `@atlaskit/pragmatic-drag-and-drop` stays the one drag engine, and `Icon`/`BrandIcon` in `@vegastack/design` keep their own `thesvg`.
- An installed copy of a removed block is yours and keeps working; `shadcn add` of a removed name now fails.
  [docs](https://design.vegastack.com/docs/blocks/app-shell-01)
