# Color Picker

- Files reviewed: `packages/ui/registry/ui/color-picker.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: shadcn Popover/Button composition, semantic-token rule.
- Primitive status: Native/custom composed with Popover/Button.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Useful controlled/uncontrolled color selection.
- Accessibility assessment: Swatches are buttons; contrast of selected indicator is the risk.
- Token/styling assessment: Raw Tailwind CSS vars appear in default palette.
- React/Next performance assessment: Client boundary required.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                                                                                                                  | Impact                                                        | Suggested fix                                                                                    |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| P2       | Default palette uses raw Tailwind palette vars such as `--color-gray-500` at `color-picker.tsx:57`; docs bless arbitrary values at `color-picker.mdx:43`. | Weakens semantic-token-only contract for registry components. | Move raw palette to docs-only examples or define approved semantic swatch tokens/lint exception. |
| P3       | Selected check uses `text-background` on arbitrary swatches at `color-picker.tsx:203`; tests disable color contrast for swatches.                         | Checkmark can be low contrast on light/custom colors.         | Use a contrast-safe badge/outline or compute foreground per swatch.                              |

## Residual Risks

No third-party picker dependency, which is good for bundle size.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- color-picker.test.tsx`
