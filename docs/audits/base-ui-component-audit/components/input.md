# Input

- Files reviewed: `packages/ui/registry/ui/input.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Input, shadcn Base Input.
- Primitive status: Native/custom, not Base UI Input.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Ergonomic addons, but lacks Base UI Input `render`/`onValueChange`.
- Accessibility assessment: Native input semantics are fine; focus contract is global/border-heavy.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Server-safe.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                                         | Impact                                                                                      | Suggested fix                                                               |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| P2       | Canonical renders native input at `input.tsx:61` and `input.tsx:95`; registry has no `@base-ui/react` dependency. Official shadcn Base Input uses Base UI Input. | Standalone Input lacks Base UI Input `render`, `onValueChange`, and Field state data attrs. | Migrate to Base UI Input or document native Input as an approved exception. |

## Residual Risks

Native choice may be acceptable if Base UI Input features are not needed, but it should be explicit.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- input.test.tsx`
- `pnpm dlx shadcn@latest docs input --base base --json -c apps/docs`
