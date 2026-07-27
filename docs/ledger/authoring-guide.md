# Component Authoring Guide (for parallel authoring agents)

**Condensed binding spec.** For the FULL post-overhaul contract — the complete token vocabulary
(`--size-*`/`--icon-*`/`--alpha-*`/`--opacity-*`/z-bands/type scale/motion tokens), the motion mechanism
matrix, the naming/API canon, the responsive + a11y checklists, and test conventions (style-mirror,
elementFromPoint, smoke lane) — read [`skills/internal/component/SKILL.md`](../../skills/internal/component/SKILL.md)
first; this file stays the terse per-file checklist for an agent already primed with that context.
Follow this EXACTLY. Button (`packages/ui/registry/ui/button.tsx` + `.test.tsx`,
`apps/docs/components/preview/button.tsx`, `apps/docs/content/docs/components/button.mdx`) is the
original reference; `combobox.tsx`/`empty.tsx`/`animated-number.tsx` are more recent exemplars for a
Base UI wrapper, a compound presentational component, and a client-hook-driven primitive respectively.

## Source of truth (PORT + REFINE, never blind-copy)

- Read the platform source in `/Users/kmanojkumar/code/engg-vegastack-platform/src/components/common/<vega-x>.tsx` and `/src/components/ui/<x>.tsx` to capture the EXACT variants/sizes/states/features/props/behavior (the functional spec — do NOT drop variants).
- RE-AUTHOR cleanly on **Base UI** (`@base-ui/react@1.6.0`) + `@vegastack` tokens, **unprefixed** (Model A: own the component API under its final name).

## Hard rules (enforced by design-lint + CI — see `skills/internal/review/references/lint-rules.md` for the full enumerated rule list, this is the short form)

1. **No hardcoded styles**: no inline `style={}` (except CSS custom properties, or the one documented color-picker swatch-fill exception), no hex (`#fff`), no arbitrary color/size values (`bg-[#..]`, `h-[13px]`, `text-[0.8rem]`), no raw palettes (`bg-neutral-900`). EVERY visual value = a SEMANTIC token utility (`bg-primary`, `text-muted-foreground`, `border-border`, `rounded-lg` — NOT `rounded-xl`, removed from the scale — the `--size-*`/`--icon-*` scales, `z-(--z-raised|overlay)`, `--alpha-*`/`--opacity-*` for any alpha/opacity value). `var(--token)` arbitraries are allowed (`duration-[var(--duration-fast)]` — though prefer the `duration-fast` token utility directly where one exists).
2. **No `!important`. No `outline:none`/disabled-focus** → the shared `:focus-visible` outline in `base.css` (2px at `outline-offset-1`) is the affordance; components add nothing. The only sanctioned local deviations are the text-entry `focus:border-…` tint and `focus-visible:-outline-offset-2` on a container whose outline would otherwise be clipped by an `overflow-hidden` ancestor or a `mask-image` utility (see `apps/docs/content/docs/foundations/accessibility.mdx`). A `transition*` utility must pair a `duration-*` AND `ease-*` token in the SAME class string.
3. **Idiomatic Base UI**: compound parts (`Dialog.Root/Trigger/Portal/Popup/...`), enter/exit via `data-starting-style`/`data-ending-style` + `transition-*` (NO Radix `asChild`). For polymorphic composition use the official Base UI `render` prop or primitive-specific `render` support; do not add compatibility aliases.
4. **CVA** for variants; **`cn`** from `@vegastack/design`; **`data-slot`/`data-variant`/`data-size`/`data-state`** attributes; forwarded refs where native — **React 19 ref-as-prop only** (`ref` as a plain destructured prop typed via `ComponentPropsWithRef<...>` / explicit `ref?: React.Ref<...>`), never `React.forwardRef` (deprecated in React 19). See `docs/ledger/ref-forwarding-spec.md` for the exact patterns (props-spread vs. `useRender`'s `ref` param vs. explicit placement). Exports stay **flat-only** — no dotted sub-component namespaces (`Foo.Bar`); compound parts are separate named exports (`FooBar`).
5. **Icons**: only `lucide-react` (direct import for internal chrome like chevrons/spinners is fine), or `@vegastack/design/icons` `Icon`/`BrandIcon`. No other icon libs, no inline `<svg>` as an icon.
6. **`'use client'`** at the top ONLY for interactive components (anything using hooks/Base UI interactive parts). Pure presentational (Badge/Card/Kbd) stay server-safe (no directive).
7. **JSDoc** every exported prop (`@default` on props with defaults) so AutoTypeTable renders. Export a named `interface <Name>Props`.
8. Consistent variant/size naming across components (mirror Button's scale where applicable: sizes xs/sm/default/lg).

## Imports (CRITICAL for copy-in + tests)

- `import { cn } from '@vegastack/design';`
- Sibling components: `import { Foo } from '@/components/ui/foo';` (shadcn rewrites on add; aliased in our tsconfig/vitest).
- Base UI: `import { Dialog } from '@base-ui/react/dialog';` (per-part subpath).

## Files to WRITE (per component `<name>`, PascalCase `<Name>`)

1. `packages/ui/registry/ui/<name>.tsx` — the component. Export the component(s) + `<Name>Props` + any `<name>Variants` cva.
2. `packages/ui/registry/ui/<name>.test.tsx` — Vitest browser-mode tests. Pattern:
   ```tsx
   import { render } from "vitest-browser-react";
   import { expect, test, vi } from "vitest";
   import { expectNoA11yViolations } from "../../test/a11y";
   import { Foo } from "./foo";
   test("renders", async () => {
     const s = await render(<Foo>x</Foo>);
     await expect.element(s.getByText("x")).toBeInTheDocument();
   });
   test("no a11y violations", async () => {
     const s = await render(<Foo aria-label="x" />);
     await expectNoA11yViolations(s.container);
   });
   ```
   - `render(...)` is ASYNC — always `await render(...)`. Use `await expect.element(locator).toBeInTheDocument()/toHaveAttribute(...)`. For overlays, open them first (`.click()`), and wrap a11y subjects with required ARIA context.
   - Cover: default render, each interactive behavior (click/open/change), variant/size data attrs, disabled/loading where applicable, and **one a11y test (0 violations)**.
3. `apps/docs/components/preview/<name>.tsx` — **MUST start with `'use client';`** (previews are interactive demos; this also makes compound sub-part access like `Dialog.Trigger`/`Alert.Title` RSC-safe — without it, a server-rendered preview sees a client _reference_ and sub-properties are `undefined`). Named example functions, each wrapped in `<Wrapper>` (`import { Wrapper } from './wrapper'`) and importing the copied-in component from `@/components/ui/<name>`. Export `<name>()` (default example) + `<name>Variants()`/`<name>Sizes()`/`<name>States()` as applicable.
4. `apps/docs/content/docs/components/<name>.mdx` — frontmatter `title/description/preview: <name>` + sections: Installation, Usage, Examples (`<ComponentPreview name="<name>Variants" file="components/preview/<name>.tsx" />`), API Reference (`<AutoTypeTable path="../../packages/ui/registry/ui/<name>.tsx" name="<Name>Props" />`), Accessibility (keyboard table), Do/Don't (`<DoDont do="..." dont="..." />`). For compound components add an Anatomy section. No `{@link}` in MDX (parses as JS) — inline code instead.
5. Add the component's record to `packages/ui/component-contracts.json` and run `pnpm design:derived`. That generates `apps/docs/vrt/contract-routes.generated.ts`, the single route authority consumed by both the blocking behaviour gate (`apps/docs/vrt/contracts.spec.ts`) and the local before/after capture (`apps/docs/vrt/components.spec.ts`), across all four Playwright projects. Never hand-edit the generated file, and never add a skipped `describe.skip(` block — it is lint-rejected (`tooling/content-lint.mjs`).

## Do NOT touch (the orchestrator aggregates these)

- `packages/ui/registry.json`, `apps/docs/content/docs/components/meta.json`, `apps/docs/components/preview/index.tsx`.

## Return in your final message (for the orchestrator)

- The exact `registry.json` item object to add (name/type=registry:ui [or `registry:hook` for a plain-hook `.ts` file, `registry:block` for a multi-file starter]/title/description/categories/dependencies[incl @base-ui/react@^1.6.0 + class-variance-authority@^0.7.1 + lucide-react@^1.24.0 if used (take the pin from packages/ui/package.json — never from a neighbouring registry item) + @vegastack/design@^0.1.0 + @vegastack/design-tokens@^0.1.0]/registryDependencies/files[{path:"packages/ui/registry/ui/<name>.tsx", type:"registry:ui", target:"@ui/<name>.tsx"}]/meta{whenToUse,whenNotToUse,version:"0.1.0"}).
  - **The `files[].target` uses the `@ui/` placeholder — `"@ui/<name>.tsx"`, NEVER a hard-coded `"components/ui/<name>.tsx"`.** It resolves to each consumer's configured `aliases.ui` on `shadcn add`, portable across `src/components/ui` and package-import layouts.
  - **CRITICAL: cross-component `registryDependencies` MUST be namespaced `"@vegastack/<name>"`** (e.g. `["@vegastack/toggle"]`). A bare `"toggle"` resolves to shadcn's built-in (radix) component and overwrites ours on copy-in. `tooling/verify-registry-deps.mjs` (wired into `registry:build`) fail-closes on any mismatch between declared `registryDependencies` and actual `@/components/ui/*` imports — don't hand-guess this list.
- The preview export names (for the barrel + matrix) and the `meta.json` nav group you'd add the page under (see the current file for the eleven group headings in use).
- Any platform features intentionally deferred/split (app-coupled per G7) + why.
- Confirmation the component record was added to `component-contracts.json` and `pnpm design:derived` was run.
