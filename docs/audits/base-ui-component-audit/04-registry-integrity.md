# Registry Integrity

## Current State

The registry integrity story is mostly strong.

| Check | Result |
| --- | --- |
| `PATH="/opt/homebrew/opt/node@24/bin:$PATH" pnpm run registry:verify-headers` | Passed: 64 component files carry valid provenance header `v0.1.0`. |
| `PATH="/opt/homebrew/opt/node@24/bin:$PATH" pnpm run registry:verify-parity` | Passed. |
| `PATH="/opt/homebrew/opt/node@24/bin:$PATH" pnpm run registry:verify-consume` | Passed: real `shadcn add` for `button`, `split-button`, `data-list`; simulated 64/64 items across default and non-default layouts. |
| `PATH="/opt/homebrew/opt/node@24/bin:$PATH" pnpm --filter @vegastack/ui test` | Passed: 67 files, 617 tests. |
| `PATH="/opt/homebrew/opt/node@24/bin:$PATH" pnpm run typecheck` | Passed: 10/10 tasks. |
| `PATH="/opt/homebrew/opt/node@24/bin:$PATH" pnpm run lint` | Failed: 7 design-lint focus violations. |

## Findings

| Priority | Finding | Evidence | Suggested fix |
| --- | --- | --- | --- |
| P1 | `field` has a hidden registry dependency on `input`. | `packages/ui/registry/ui/field.tsx:9` imports `@/components/ui/input`; `field.tsx:88` renders `Input`; `packages/ui/registry.json` field item has no `registryDependencies`. | Add `@vegastack/input` to the field registry item or remove the hidden `Input` dependency. Add `field` to the real CLI representative consume set. |
| P1 | `sonner` registry component and npm package Toaster are separate divergent sources. | `packages/ui/registry/ui/sonner.tsx` and `packages/ui/src/provider/toaster.tsx` differ in CSS variables, icon token classes, padding, and shadow. | Generate/mirror one from the other or create a single shared source. |
| P2 | The all-items consume simulation can mask undeclared dependencies. | The simulation writes all registry items into one scratch consumer; an item with an undeclared dependency may still typecheck because the dependency file is present from another item. | Keep all-items simulation, but add targeted real-CLI representatives for known dependency-sensitive items: `field`, `country-select`, `state-select`, `sonner`, `text-edit`. |
| P2 | Docs app shadcn config points `@vegastack` to local `http://localhost:4000/{name}.json`. | `apps/docs/components.json:21`. | Keep local dogfood config if needed, but document production/private registry setup for consumers. |
| P3 | VRT is scaffolded but inactive without baselines. | `apps/docs/vrt/components.spec.ts` enumerates all routes; `test:vrt -- --list` shows 68 skipped. | Bootstrap and commit deterministic baselines via CI flow. |

## Do Not Change Without Approval

- Do not hand-edit generated copy-in files in `apps/docs/components/ui`.
- Do not replace copy-in with symlinks or path aliases; copy-in is part of the registry distribution proof.
- Do not run publish/deploy/push actions from audit work.

