# Executive Summary

Status: complete read-only audit synthesis
Date: 2026-06-24
Scope: 64 registry components plus docs, generated registry JSON, copy-in files, provider/package entrypoints, and validation tooling.

## Bottom Line

No P0 blocker was found in first-party component source.

The repo is **not** a mixed Radix/Base first-party component codebase. The canonical registry components are Base UI-backed where a Base primitive is used, or native/custom where that is reasonable. Targeted search found no first-party `radix-ui` or `@radix-ui/*` imports in `apps`, `packages`, or `tooling`.

The serious issue is that the **docs app shadcn config still resolves as Radix**. `pnpm dlx shadcn@latest info -c apps/docs --json` reports `"base": "radix"` and Radix upstream links, and `pnpm dlx shadcn@latest add button --dry-run -c apps/docs` proposes overwriting `components/ui/button.tsx` and adding `radix-ui`. That makes future maintenance commands unsafe unless the Base UI project config is corrected or guarded.

## Highest Priority Findings

| Priority | Finding | Why it matters |
| --- | --- | --- |
| P1 | shadcn project config drift: docs app resolves as Radix | Future `shadcn add`, `docs`, or `diff` work can pull Radix-shaped upstream references into a Base UI registry. Evidence: `apps/docs/components.json:3`, CLI output, dry-run output. |
| P1 | `Button` manually wraps `useRender` instead of Base UI Button semantics | It exposes `render={<a />}` while still applying native button props such as `type` and `disabled`; Base UI Button exists specifically to handle `nativeButton` and `focusableWhenDisabled`. Evidence: `packages/ui/registry/ui/button.tsx:7`, `button.tsx:97`, `button.tsx:103`, Base UI Button docs. |
| P1 | `Field` imports `Input` without declaring `@vegastack/input` as a registry dependency | Standalone downstream install of `@vegastack/field` can produce an unresolved `@/components/ui/input` import. Evidence: `field.tsx:9`, `field.tsx:88`, `packages/ui/registry.json` field item has no `registryDependencies`. |
| P1 | Package Toaster and registry `sonner` Toaster have drifted | Docs dogfood the registry copy, while npm exports a different provider Toaster with different token/icon/shadow behavior. Evidence: `packages/ui/src/provider/toaster.tsx:64`, `packages/ui/registry/ui/sonner.tsx:69`, `apps/docs/components/provider.tsx:17`. |
| P2 | Lint fails on focus-affordance rule | `pnpm run lint` fails for seven component files with `outline-none` and no local focus affordance according to `design-lint`: alert-dialog, dialog, hover-card, otp-input, popover, sheet, textarea. |
| P2 | Docs install instructions are incomplete for real consumers | Component pages show `shadcn add @vegastack/<name>`, but do not explain namespace setup, production registry URL, service-token auth, or local-vs-private registry flow. |
| P2 | Compound component API tables are incomplete | Many docs pages describe parts in anatomy but document only one or two exported prop types, so consumers cannot treat API sections as complete. |

## Healthy Signals

- `PATH="/opt/homebrew/opt/node@24/bin:$PATH" pnpm run typecheck` passed: 10/10 tasks.
- `PATH="/opt/homebrew/opt/node@24/bin:$PATH" pnpm --filter @vegastack/ui test` passed: 67 files, 617 tests.
- `PATH="/opt/homebrew/opt/node@24/bin:$PATH" pnpm run registry:verify-headers` passed: 64 valid provenance headers.
- `PATH="/opt/homebrew/opt/node@24/bin:$PATH" pnpm run registry:verify-parity` passed.
- `PATH="/opt/homebrew/opt/node@24/bin:$PATH" pnpm run registry:verify-consume` passed real representative CLI installs and simulated 64/64 items across two layouts.
- Docs coverage is mechanically strong: all 64 registry components have docs pages and nav entries.

## Important Caveats

- The broad consume verifier passes, but its all-items simulation writes every item into one scratch workspace. That can mask undeclared registry dependencies such as `field` needing `input`. Add a targeted real-CLI representative for `field`.
- VRT is scaffolded for every component route, but no baseline PNGs exist in this checkout. `pnpm --filter @vegastack/docs test:vrt -- --list` reports 68 skipped tests.
- `cmdk` is an approved-looking but undocumented transitive Radix exception: first-party source imports `cmdk`, and `cmdk` brings `@radix-ui/react-dialog`. This is not first-party Radix code, but "zero Radix anywhere" is false until documented or replaced.

## Official Baseline Used

- shadcn Base UI changelog: https://ui.shadcn.com/docs/changelog/2026-01-base-ui
- shadcn registry getting started: https://ui.shadcn.com/docs/registry/getting-started
- shadcn CLI docs: https://ui.shadcn.com/docs/cli
- shadcn llms.txt: https://ui.shadcn.com/llms.txt
- Base UI quick start: https://base-ui.com/react/overview/quick-start
- Base UI Button: https://base-ui.com/react/components/button
- Base UI useRender: https://base-ui.com/react/utils/use-render
- React ViewTransition: https://react.dev/reference/react/ViewTransition
- Next viewTransition config: https://nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition

