# Sonner

- Files reviewed: `packages/ui/registry/ui/sonner.tsx`, `packages/ui/src/provider/toaster.tsx`, docs provider, toast MDX page, preview, registry item JSON.
- Upstream reference checked: Sonner, shadcn Sonner/Toast registry pattern.
- Primitive status: Third-party Sonner wrapper.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Documented as Toast route, registry item/file is `sonner`.
- Public API assessment: Good provider/toast surface; duplicate source drift is serious.
- Accessibility assessment: Sonner owns toast live regions; docs should clarify provider setup.
- Token/styling assessment: Registry source has stronger CSS-var semantic bridge than package source.
- React/Next performance assessment: Client portal/toaster expected.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                                                                                                                                                                                                                                                      | Impact                                                                             | Suggested fix                                                                                                                    |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| P1       | Npm entry exports package Toaster at `packages/ui/src/index.ts:5`; package implementation uses `text-success` icons and no CSS-var bridge at `packages/ui/src/provider/toaster.tsx:64`; registry implementation wires Sonner CSS vars at `sonner.tsx:69` and uses `text-success-text` at `sonner.tsx:78`; docs mount registry copy at `apps/docs/components/provider.tsx:17`. | Docs show registry behavior, while npm provider consumers get a different Toaster. | Generate/mirror package Toaster from canonical registry source or share one implementation.                                      |
| P3       | Docs route/page is `toast`, but install/import paths use `sonner` at `toast.mdx:10`; registry item is `sonner`.                                                                                                                                                                                                                                                               | Readers may search for `@vegastack/toast`.                                         | Add one sentence explaining the registry file is named `sonner` because it wraps Sonner, while design-system docs call it Toast. |

## Residual Risks

Not a Base UI primitive; third-party dependency is appropriate for toast.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- sonner.test.tsx`
- Compare package and registry Toaster behavior in docs build.
