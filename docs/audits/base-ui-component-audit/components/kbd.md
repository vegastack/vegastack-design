# Kbd

- Files reviewed: `packages/ui/registry/ui/kbd.tsx`, tests, MDX page, preview, registry item JSON.
- Upstream reference checked: shadcn Kbd.
- Primitive status: Native/custom.
- Registry status: Generated copy and integrity present.
- Docs/showcase status: Covered.
- Public API assessment: Useful OS-aware convenience, but auto-detection forces client.
- Accessibility assessment: Keyboard text is visible; no major issue found.
- Token/styling assessment: Semantic tokens.
- React/Next performance assessment: Client boundary due to OS detection.
- View-transition relevance: None.

## Findings

| Priority | Evidence                                                         | Impact                                                                              | Suggested fix                                                               |
| -------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| P3       | `'use client'` at `kbd.tsx:3`; OS detection around `kbd.tsx:58`. | Static key chips ship JS and may show Mac glyphs until hydration for non-Mac users. | Split static `Kbd` from opt-in `KbdAuto`, or default docs to explicit `os`. |

## Residual Risks

No registry issue found.

## Follow-Up Validation

- `pnpm --filter @vegastack/ui test -- kbd.test.tsx`
