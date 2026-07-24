# Accordion

- Files reviewed: `packages/ui/registry/ui/accordion.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Accordion, shadcn Base Accordion.
- Primitive status: Base UI (`@base-ui/react/accordion`).
- Registry status: Generated copy and integrity present; no Radix import.
- Docs/showcase status: Covered, but keyboard docs need correction.
- Public API assessment: Owns an `openMultiple` alias and defaults multi-open.
- Accessibility assessment: Base UI handles core semantics; docs overstate roving focus behavior.
- Token/styling assessment: Semantic tokens, lucide chevron, no raw palette issue found.
- React/Next performance assessment: Client boundary is expected for interactive accordion.
- View-transition relevance: None for primitive.

## Findings

| Priority | Evidence                                                                                                               | Impact                                                           | Suggested fix                                                                               |
| -------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| P2       | `accordion.tsx:45` and `accordion.tsx:49` default to `openMultiple=true`, while Base UI default `multiple` is false.   | Default behavior differs from official Base/shadcn expectations. | Either default single-open or document VegaStack's multi-open default with migration notes. |
| P2       | `accordion.mdx:97` claims Arrow/Home/End trigger navigation, but current Base UI docs deprecate roving focus behavior. | Docs promise keyboard behavior the primitive may not provide.    | Remove or qualify those keyboard rows unless VegaStack implements roving focus.             |

## Residual Risks

No registry or Radix drift found beyond the system-wide shadcn config issue.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- accordion.test.tsx`
- `pnpm dlx shadcn@latest docs accordion --base base --json -c apps/docs`
