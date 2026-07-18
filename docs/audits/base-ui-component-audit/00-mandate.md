# Base UI Component Audit Mandate

Status: Approved by MK
Date: 2026-06-24
Mode: Go dark, read-only audit pack, no source fixes

## Mission

Meticulously audit the VegaStack design system as a shadcn registry and first-party Fumadocs showcase, with special focus on whether the implementation truly matches the locked Base UI direction.

The audit must produce evidence-backed findings for every component and for cross-cutting project patterns. It must be adversarial, current with official docs, and actionable enough that a later build agent can fix issues without rediscovering context.

The audit must have no bias except truth. Do not protect prior implementation choices, do not assume Base UI is better merely because it is newer, and do not assume Radix residue is wrong merely because Base UI is the locked target. Prove every material claim with code evidence, official documentation, or reproducible local command output.

If context compacts during the work, continue from this mandate as the source of truth. Preserve the approved scope, output structure, no-fix constraint, adversarial review requirement, and Base UI drift investigation.

## Immediate P0 Suspicion: Base UI vs Radix Drift

The repo instructions lock the primitive decision to `@base-ui/react` via shadcn Base UI. However, preliminary local evidence shows:

- `apps/docs/components.json` currently has `"style": "new-york"` and no explicit Base UI style/base marker.
- `pnpm dlx shadcn@latest info -c apps/docs --json` reports `"base": "radix"` and upstream Radix docs/code links.
- `packages/ui/registry.json` declares `@base-ui/react` dependencies for many registry items.
- The canonical components may be a mixed state of Base UI, native elements, custom wrappers, and possible Radix-era API patterns.

The audit must determine, component by component and system-wide, whether this is:

- config drift only,
- partial Base UI migration,
- generated/docs registry mismatch,
- legacy Radix lift-and-shift residue,
- native/custom implementation that is appropriate for the component,
- or an intentional but undocumented compatibility layer.

The target state is Base UI only unless a specific exception is approved by MK and documented.

Official baseline: shadcn supports both Radix and Base UI, with separate docs/examples and CLI `--base` selection. shadcn describes this as the same visual abstraction with different primitives. Base UI itself is an unstyled React component library focused on accessibility, performance, and developer experience.

## Scope

Audit the whole design-system surface:

- Canonical components: `packages/ui/registry/ui/*.tsx`
- Component tests beside canonical files
- Source registry: `packages/ui/registry.json`
- Generated docs copy-in: `apps/docs/components/ui/*.tsx`
- Generated registry JSON: `apps/docs/public/r/*.json`
- Fumadocs component pages: `apps/docs/content/docs/components/*.mdx`
- Preview/demo files: `apps/docs/components/preview/*.tsx`
- Docs app shell, navigation, provider, search, and global CSS where they affect registry rendering or component demos
- Tokens, tailwind preset, icons package, utils package, provider package, and registry tooling only as needed to explain component findings
- CI/scripts relevant to registry integrity, headers, design lint, typecheck, a11y, VRT, and consume verification

## Non-Goals

- No component source fixes in this pass.
- No npm publish, Cloudflare deploy, git push, or irreversible public action.
- No hand-editing generated copies.
- No replacing the hybrid shadcn registry distribution model unless the audit recommends it as a finding for separate approval.
- No suppressing uncomfortable findings because the current code is mid-flight or already modified.

## Evidence Standard

Every finding must cite concrete evidence:

- file path and line references,
- local command output where relevant,
- upstream official docs or CLI output for shadcn/Base UI behavior,
- local skill-rule references when applicable,
- observed docs/showcase behavior when visually relevant.

Avoid speculative findings. If uncertain, mark as `Needs validation`, explain what evidence is missing, and propose the validation command or inspection path.

Use multiple adversarial review passes. High-severity findings require at least one cross-check against the code and one cross-check against official/current standards before they enter the executive summary.

## Official References To Use

Required:

- shadcn Base UI changelog
- shadcn registry docs
- shadcn `llms.txt`
- shadcn CLI docs and live `pnpm dlx shadcn@latest` output
- Base UI official component/API docs
- React/Next official docs where ViewTransition or RSC/client-boundary issues arise
- Local skills:
  - `shadcn`
  - `vercel-react-best-practices`
  - `vercel-react-view-transitions`

## Review Lenses

Classify each issue through these lenses:

1. Base UI correctness
   - imports from `@base-ui/react`,
   - Base UI anatomy,
   - `render` composition instead of Radix-only `asChild` where applicable,
   - Base UI prop differences such as Select `items`, ToggleGroup arrays, Slider scalar/range behavior, Accordion arrays/multiple,
   - no accidental Radix primitive dependency,
   - no unsupported assumption that Base UI is always the better primitive when evidence says otherwise.

2. shadcn registry correctness
   - source registry item definitions,
   - dependencies and registryDependencies,
   - target paths,
   - built JSON integrity,
   - provenance headers,
   - generated copy-in parity,
   - downstream `shadcn add` consume behavior.

3. VegaStack design-system contract
   - semantic Tailwind tokens only,
   - no raw palettes/hex/off-scale arbitrary styling,
   - CVA variants where meaningful,
   - `cn()` from `@vegastack/utils`,
   - `data-*` state styling,
   - forwarded refs,
   - server-safe by default,
   - lowest-leaf `'use client'`.

4. Accessibility
   - WCAG 2.1 AA,
   - focus-visible states,
   - correct roles/labels/descriptions,
   - required overlay titles,
   - keyboard behavior,
   - disabled/invalid states,
   - axe coverage or test gaps.

5. API design and downstream ergonomics
   - classify props as necessary flexibility, accidental surface area, or candidate for composition.
   - identify where components should split, merge, remove props, add child subcomponents, or prefer variants.
   - preserve realistic downstream flexibility where it materially supports consistent UI/UX.
   - do not recommend breaking API without migration notes.

6. Performance and React/Next best practices
   - only cite Vercel rules when triggered by code evidence.
   - watch for barrel import risk, heavy client components, client boundary spread, inline components, expensive derived state, global listeners, hydration risks, and unnecessary effects.

7. View transitions
   - do not blindly add transitions to low-level primitives.
   - audit docs/showcase navigation, Suspense, overlays/floating UI, popovers/tooltips/select menus, persistent elements, and demo transitions for correct placement/isolation.
   - recommend ViewTransition use only when it communicates continuity.

8. Visual and docs quality
   - component demos should show realistic states without becoming prop soup.
   - docs should communicate when to use, when not to use, public props, examples, accessibility notes, and registry install behavior.
   - flag excessive or confusing props tables if they reduce usability.

9. Dead, unused, or unoptimized implementation
   - flag unused exports, unreachable branches, stale compatibility props, redundant abstractions, avoidable wrapper layers, duplicated logic, and expensive dependencies that do not earn their cost.
   - distinguish cleanup candidates from breaking API removals.

## Severity

- P0: Blocks Base UI target state, registry consumption, build/typecheck, or severe accessibility/runtime failure.
- P1: High-risk API drift, widespread design-token violation, client/server boundary flaw, broken generated parity, or likely downstream breakage.
- P2: Component-specific correctness, a11y, docs, visual, or ergonomics issue that should be fixed before broad adoption.
- P3: Polish, docs clarity, optional cleanup, future enhancement.

## Required Outputs

Create this audit pack:

- `docs/audits/base-ui-component-audit/00-mandate.md`
- `docs/audits/base-ui-component-audit/01-executive-summary.md`
- `docs/audits/base-ui-component-audit/02-common-findings.md`
- `docs/audits/base-ui-component-audit/03-base-ui-radix-drift.md`
- `docs/audits/base-ui-component-audit/04-registry-integrity.md`
- `docs/audits/base-ui-component-audit/05-docs-showcase-findings.md`
- `docs/audits/base-ui-component-audit/06-prop-api-ergonomics.md`
- `docs/audits/base-ui-component-audit/07-fix-roadmap.md`
- `docs/audits/base-ui-component-audit/components/<component>.md` for all 64 components

Every component gets a file, even if clean.

## Component Finding Template

Each component file must include:

- Component name
- Files reviewed
- Upstream reference checked
- Primitive status: Base UI, Radix, native, custom, mixed, unknown
- Registry status
- Docs/showcase status
- Public API assessment
- Accessibility assessment
- Token/styling assessment
- React/Next performance assessment
- View-transition relevance
- Findings table with priority, evidence, impact, suggested fix
- Clean bill of health or residual risks
- Follow-up validation commands

## Subagent Strategy

Use aggressive parallel subagents with clear non-overlapping ownership.

Suggested slices:

- Agent A: primitives/config drift, shadcn CLI, upstream Base UI/Radix comparison.
- Agent B: form controls and inputs.
- Agent C: overlays and floating UI.
- Agent D: navigation/layout/data display.
- Agent E: feedback/status/utility components.
- Agent F: docs MDX, previews, Fumadocs UX, prop table quality.
- Agent G: registry integrity, generated parity, consume workflow.
- Agent H: tokens/icons/a11y/VRT test coverage.
- Agent I: synthesis and false-positive review.

Multiple agents must cross-check high-severity findings before they enter the final summary. The main agent remains accountable for synthesis, deduplication, evidence quality, and final truthfulness.

## Validation Commands

Use commands such as:

- `pnpm dlx shadcn@latest info -c apps/docs --json`
- `pnpm dlx shadcn@latest docs <component> --base base --json -c apps/docs`
- `pnpm dlx shadcn@latest add <component> --dry-run`
- `pnpm run registry:build`
- `pnpm run registry:verify-consume`
- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run test`
- `pnpm --filter @vegastack/docs test:vrt`
- targeted `rg` checks for Radix imports, `asChild`, raw colors, arbitrary values, inline svg, `use client`, and generated drift.

Run validation read-only or local-only. Do not publish/deploy/push.

## Acceptance Criteria

The audit is complete only when:

- all 64 components have individual findings files,
- common systemic findings are synthesized,
- Base UI vs Radix drift is explicitly resolved or scoped with evidence,
- every P0/P1 has a concrete fix recommendation,
- generated registry/docs parity is assessed,
- docs/showcase quality is assessed,
- dead, unused, and unoptimized code candidates are identified,
- false positives are challenged by at least one synthesis pass,
- the final roadmap gives a practical fix order for future agents.
