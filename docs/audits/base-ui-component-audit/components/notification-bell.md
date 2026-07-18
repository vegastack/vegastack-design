# Notification Bell

- Files reviewed: `packages/ui/registry/ui/notification-bell.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: icon-only button accessibility, Button/IconButton dependency.
- Primitive status: Wrapper around IconButton/Button.
- Registry status: Declares `@vegastack/icon-button`; generated integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Simple and appropriate.
- Accessibility assessment: Count naming and decorative badge tested; inherits focus/Button risks.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary expected for interactive button.
- View-transition relevance: None.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| P2 | Delegates to IconButton at `notification-bell.tsx:77`, IconButton delegates to Button at `icon-button.tsx:61`, and docs promise focus ring at `notification-bell.mdx:44`; Button lacks explicit component-local focus-visible ring. | Focus affordance contract depends on global CSS and Button fix. | Add/verify tokenized focus-visible styling through Button/IconButton and test NotificationBell focus. |

## Residual Risks

No data-fetching behavior is embedded, which is good.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- notification-bell.test.tsx`

