# Field

- Files reviewed: `packages/ui/registry/ui/field.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Field, shadcn Base Field/Form.
- Primitive status: Base UI (`@base-ui/react/field`).
- Registry status: Integrity present, but hidden dependency issue.
- Docs/showcase status: Covered; compound API tables should be expanded.
- Public API assessment: Good primitive composition; `FieldControl` hides `Input`.
- Accessibility assessment: Base UI auto-wiring is appropriate; tests cover RHF form flow.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary likely required by form integrations, but primitives could be split later.
- View-transition relevance: None.

## Findings

| Priority | Evidence | Impact | Suggested fix |
| --- | --- | --- | --- |
| P1 | `field.tsx:9` imports `@/components/ui/input`; `field.tsx:88` renders `Input`; field registry item has empty `registryDependencies`. | Standalone `shadcn add @vegastack/field` can leave an unresolved input import. | Add `@vegastack/input` registryDependency or remove hidden Input dependency. |
| P2 | Field exports multiple public parts, but docs API coverage is partial. | Consumers cannot rely on API section as the complete contract. | Add AutoTypeTable coverage for exported parts or mark native passthrough intentionally omitted. |

## Residual Risks

Add `field` to the real CLI consume representative set because the current all-items simulation can mask this gap.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- field-form.test.tsx`
- Targeted real `shadcn add @vegastack/field` consume test in a clean scratch project.

