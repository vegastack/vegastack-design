# Tabs

- Files reviewed: `packages/ui/registry/ui/tabs.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: Base UI Tabs, shadcn Base Tabs.
- Primitive status: Base UI (`@base-ui/react/tabs`).
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Good compound API; comments/classes need cleanup.
- Accessibility assessment: Keyboard behavior tested; content focus docs need alignment.
- Token/styling assessment: Semantic tokens; one dead variant token.
- React/Next performance assessment: Client boundary expected.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                               | Impact                                                 | Suggested fix                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------- |
| P3       | Dead/invalid Tailwind variant token at `tabs.tsx:164`.                                                                                                 | Maintenance noise and possible CSS scanning confusion. | Remove `group-data-[variant=pill]/tabs-list:`.                      |
| P3       | Vertical comments mention right-side rule at `tabs.tsx:70`, but classes place left border/indicator around `tabs.tsx:117`.                             | Visual/API expectation drift.                          | Align comments/docs with left rail or move indicator.               |
| P3       | Content comments/docs mention focus-visible ring at `tabs.tsx:193` and `tabs.mdx:88`, but content class has no explicit focus style at `tabs.tsx:204`. | Docs may overstate local focus treatment.              | Add focus-visible styling or update docs to global outline wording. |

## Residual Risks

Core Base UI anatomy and keyboard tests are healthy.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- tabs.test.tsx`
