---
name: vegastack-add-component
description: Use when authoring a NEW component in the VegaStack repo — the complete authoring contract (tokens, motion, naming, responsive, a11y, tests, registry) so a component is never half-shipped. Post-overhaul canon (2026-07).
metadata:
  author: vegastack
  version: "0.2.0"
---

# vegastack-add-component — authoring a component

This is the full authoring contract as of the 2026-07 system overhaul (`docs/plans/2026-07-decisions-log.md`
is the canon this skill is synthesized from — re-read it if a rule here looks stale). Reference
implementations: `packages/ui/registry/ui/combobox.tsx` (modern Base UI wrapper + CVA + full JSDoc),
`packages/ui/registry/ui/empty.tsx` (compound presentational component), `packages/ui/registry/ui/
animated-number.tsx` (client hook-driven primitive with a documented mechanism choice). The binding
spec is [`docs/ledger/authoring-guide.md`](../../docs/ledger/authoring-guide.md) — read it too.

## 0. Single source of truth (the workflow)

Every component exists in **three synced places**; you edit **one**:

1. **Canonical (EDIT THIS):** `packages/ui/registry/ui/<name>.tsx` (or `packages/ui/registry/blocks/<name>/`
   for a block).
2. **Docs copy-in (GENERATED, never hand-edit):** `apps/docs/components/ui/<name>.tsx` — byte-for-byte
   re-synced from canonical.
3. **Registry JSON (GENERATED):** `apps/docs/public/r/<name>.json` — built by `shadcn build`, carries
   `meta.integrity` (SHA-256) and the `// @vegastack <name>@<ver> sha256-…` provenance header stamped
   onto both canonical and the copy-in.

Workflow: write/edit canonical → run `pnpm run registry:build` (`shadcn registry validate` → `shadcn
build` → `registry-stamp` → `registry-header` → `verify-headers` → `verify-registry-deps`). This
regenerates the copy-in + JSON, re-stamps headers, and is idempotent + fully local. **Never** hand-edit
`apps/docs/components/ui/<name>.tsx` or fix component styling in `apps/docs/components/preview/*.tsx` —
previews only COMPOSE the component.

## 1. Token vocabulary (zero hardcoded visual values — enforced by `design-lint`)

Every visual value routes through a token utility or a `var(--token)` arbitrary. Token names verified
against `packages/design-tokens/dist/theme.css`:

- **Semantic colors** — `bg-primary` / `text-muted-foreground` / `border-border` / `bg-accent
  text-accent-foreground` (highlighted state) / per-family `{success,warning,destructive,info}` each
  with `-hover`/`-active`/`-subtle`/`-subtle-hover`/`-text`/`-foreground` variants / `bg-popover
  text-popover-foreground` / `bg-card` / `bg-muted` / `bg-sidebar*` / `--brand` (marker-role accent
  ONLY — never a functional-state color; never hue-alone, see colors.mdx). No hex, no raw Tailwind
  palette (`bg-neutral-900`, `text-red-500`).
- **`--size-*` control scale** (28/32/40, plus `--size-xs` 24px for the kept `xs` control tier):
  `h-(--size-sm|md|lg)`, `size-(--size-xs)`. Raw `h-7/h-8/h-10` (and `size-`/`min-w-` mirrors) are
  lint-banned (`raw-control-size`) — 24px (`h-6`/`size-6`) is NOT banned, it's shared by non-control
  scales (badge, switch track, select scroll strips).
  Physical rhythm: xs 24 · sm 28 · md 32 (default) · lg 40.
- **`--icon-*` role tokens**: `--icon-compact` 12 (xs-tier controls only) · `--icon-inline` 14 ·
  `--icon-default` 16 · `--icon-action` 20 · `--icon-feature` 24. Apply via an `svg` descendant
  selector, e.g. `[&_svg:not([class*='size-'])]:size-(--icon-default)`. Raw sizes inside an svg
  selector (`]:size-3`, `-3.5`, `-4`, `-5`, `-6`) are lint-banned (`raw-icon-size`) — `size-1`/fraction
  glyphs (dots) are geometry, not icon scale, and stay allowed.
- **Radius**: `rounded-sm` (`--radius-sm`) · `rounded-md` (`--radius-md`, most controls) ·
  `rounded-lg` (`--radius-lg`, containers/popups — the scale's CAP) · `rounded-(--radius-xs)` (2px) ·
  `rounded-(--radius-sharp)` (2px, the marketing "sharp" gesture — same value today, a distinct role).
  **`rounded-xl` was REMOVED and is lint-banned** (`removed-radius-xl`) — it used to silently fall back
  to Tailwind's unthemed default. Containers cap at `rounded-lg`.
  Icon-only 24×24 "xs" controls exist (Button `xs`), the `xs` control-scale tier they share is why
  `--size-xs` exists.
- **`--alpha-*` (color-mix modifiers, `%`, via Tailwind's `/(--var)` syntax) vs `--opacity-*` (element
  opacity steps)** — two distinct classes, per CX-7. Never a raw `/NN` alpha step (`raw-alpha` lint) or
  a raw `opacity-NN` (`raw-opacity` lint; `opacity-0`/`opacity-100` are exempt structural endpoints).
  Role tokens (not exhaustive — see theme.css): `--alpha-tint-border` (focus/invalid border tint),
  `--alpha-input`/`--alpha-input-hover` (dark-mode input wash), `--alpha-wash`/`--alpha-wash-faint`/
  `--alpha-wash-strong` (hover washes), `--alpha-surface-faint`/`--alpha-surface-subtle`,
  `--alpha-soft-hover`/`--alpha-soft-surface` (theme-split), `--alpha-ink-tint`/`--alpha-ink-tint-strong`,
  `--alpha-border-soft`/`--alpha-border-subtle`/`--alpha-outline-border`/`--alpha-outline-soft`,
  `--alpha-glass`/`--alpha-glass-hover`, `--alpha-backdrop-soft`, `--alpha-link-hover`,
  `--alpha-fill-hover`. Element-opacity tokens: `--opacity-dim` (50%, the uniform disabled-state
  opacity — NOT design.md's stale 45%), `--opacity-hint`/`--opacity-hint-soft`, `--opacity-track`.
  Precomposed `{family}-subtle-hover` colors exist where an alpha-over-surface composite would fail AA
  — prefer them over hand-rolling a new alpha composite for a hover state.
- **z-index — two bands only**: `z-(--z-raised)` (10, local raises inside a component's own stacking
  context) and `z-(--z-overlay)` (50, every portaled surface — DOM order resolves nesting since Base UI
  appends portals to `<body>`, which is `isolate`). Raw `z-N` is lint-banned (`raw-z-index`). Sonner is
  the ONE documented exception (mounts before dialog portals; its library z is load-bearing).
- **Type scale** — `text-xs…3xl` (xs 11/16 · sm 12/16 · base 14/21 · lg 16/24 · xl 18/26 · 2xl 20/28 ·
  3xl 24/32), role utilities `text-h1…h4` (24/20/18, weight 400 except h4) / `text-label` /
  `text-label-sm` / `text-code` / `text-code-sm` / `text-mono-label` (12/16 mono +0.05em, the "voice"
  role — apply `uppercase` at the call site, it's not baked in), and the display tier
  `text-display-sm/md/lg/xl` (32/40/56/72, weight 400, tracking −0.04→−0.06em). **Two-layer scale
  awareness**: the ladder is SCOPED — `.vs-type-product` (previews + anything under
  `[data-base-ui-portal]`) resolves the tighter product ladder (`--type-product-*`); the Fumadocs doc
  shell resolves the roomier `--type-doc-*` ladder (16px-prose). If you're adding a preview or a
  portaled popup and text renders at doc-shell size, you're missing the `vs-type-product` scope — see
  `apps/docs/components/preview/wrapper.tsx` for where it's applied. `text-4xl` and above are
  off-scale and lint-banned (`off-scale-text`) — use a display-tier utility instead.
- **Motion durations/eases**: `duration-fast/base/slow` (3-step scale, NOT 4) + `ease-standard/
  emphasized/exit/spring`. A `transition*` utility in a class string MUST pair a `duration-*` AND an
  `ease-*` token in the SAME string literal (`transition-pairing` lint) — `transition-none`/
  `-discrete` are exempt. `--ease-spring` is the audit's `linear()` curve, used by `motion-pop-in`.
  Never `duration-[…]`/`ease-[…]`/`cubic-bezier()`/bare `linear()` in a class string (`raw-motion`
  lint) — `animate-spin`/`animate-pulse` are the one documented loader exception.
- **Sizing/spacing constants that aren't tokens but are shared**: `TIMINGS` (`feedbackRevertMs` 1500,
  `autoSaveDebounceMs` 800, `hoverOpenDelayMs` 700, `hoverCloseDelayMs` 300) and `FLOATING`
  (`sideOffsetAttached` 4 for attached-reading popups, `sideOffsetDetached` 8 for detached-reading
  ones, `collisionPadding` 8) — both exported from `@vegastack/design`. Import and reuse them instead of
  a new magic number.

**Arbitrary-value contract** (`arbitrary-value` lint): a `*-[…]` is allowed ONLY when it's (1) a
`var(--token)` / Base UI runtime positioner var (`--available-height`, `--anchor-width`,
`--transform-origin`), (2) a `calc()` that itself contains a `var(--…)`, (3) a layout primitive
(`fr`/`%`/`auto`/`min-content`/`max-content`/`0`), or (4) a CSS-wide keyword. A hardcoded literal
(`h-[13px]`, `calc(100dvh-2rem)`) fails.

**Inline `style={}` contract** (`inline-style` lint): allowed ONLY when it assigns EXCLUSIVELY CSS
custom properties (every key is `--*`, consumed by an arbitrary-value class), or is the ONE documented
exception (color-picker's dynamic swatch fill). Any direct visual property (`width`, `gridTemplateColumns`,
`minHeight`, …) fails, dynamic or literal.

## 2. Motion mechanism matrix (when to use which)

| Mechanism | Use for | How |
|---|---|---|
| **Base UI lifecycle** | Overlay/disclosure enter-exit (dialog, popover, dropdown, select, tooltip, accordion, tabs) | `data-starting-style`/`data-ending-style` + `transition-[…] duration-fast ease-standard` on the popup root — already the reference pattern, don't reinvent it |
| **Keyed presence** | Mount-triggered one-shot arrivals (icon/text swap, badge pop, chat message arrival, skeleton→content reveal) | Apply `motion-pop-in` (scale .9→1 + fade, `--ease-spring`) or `motion-enter-up` (fade + 4px rise, `--ease-standard`) from `packages/design-tokens/src/utilities.css`; remount the element via a changing React `key` so the CSS animation replays |
| **Replay APIs** | Re-triggering an animation WITHOUT remounting (focus/caret/value must survive — e.g. shaking an already-focused invalid input) | `useAnimationReplay(animationClassName)` (class-toggle + `animationend` cleanup, from `use-animation-replay.ts`) is the low-level primitive; `useShakeOnInvalid({ shakeSignal? })` wraps it for the "auto-shake on invalid transition" pattern (watches `aria-invalid`/`data-invalid` via `MutationObserver` — Base UI's Field context writes those straight to the DOM, never through props) |
| **Animated-icon handles** | Stroke-draw / complex icon motion (e.g. a success check draw-in) | The `lucide-animated` mirrors under `registry/ui/icons/**` (e.g. `check.tsx`) expose an imperative `startAnimation()` via `useImperativeHandle` on a forwarded ref — call it from your own event handler. **Do not** hand-roll `pathLength` animation onto a plain `lucide-react` icon: it spreads props onto the SVG root only, never reaches the inner `<path>` (verified in its compiled source), and hand-authored inline `<svg>` is icon-rule-banned anyway |
| **`AnimatedNumber`** | Tweening a displayed number on `value` change (stat-card counters, live metrics) | Compose `<AnimatedNumber value={n} format={intlOptions} />` — a `requestAnimationFrame` tween (NOT CSS `@property`+`counter()` — that route can't render `Intl.NumberFormat` output), reads `--duration-*`/`--motion-ease-standard` live via `getComputedStyle`, instant under reduced motion, `aria-hidden` ticking text + a polite live region announcing only the settled value |

Motion contract for every new animated element:
- Honor `prefers-reduced-motion: reduce` — the global reset in `base.css` collapses `motion-*` keyframes
  to their end state automatically (every keyframe's `to` equals the resting style) as long as you don't
  fight it with a component-local override.
- `animate-spin`/`animate-pulse` are the only sanctioned raw Tailwind animation utilities (loader
  exception); everything else routes through the tokens/utilities above.
- EXCLUDED by design (don't add speculatively): avatar hover-lift, card 3D tilt, FAB morph. Toast motion
  is sonner-owned.

## 3. Naming / API canon

- **Flat exports only** — no dotted sub-component namespaces (`Foo.Bar`). Compound parts are separate
  named exports (`AlertTitle`, `DialogTrigger`, `EmptyHeader`, `ItemMedia`, …).
- **React 19 ref-as-prop, never `React.forwardRef`** (deprecated in React 19). Full patterns (A: props
  spread onto the host, B: `useRender`'s `ref` param, C: explicit placement, D: delegating wrapper) are
  in [`docs/ledger/ref-forwarding-spec.md`](../../docs/ledger/ref-forwarding-spec.md) — apply the one
  that matches your component's shape. Type with `ComponentPropsWithRef<'div'>` (never
  `ComponentPropsWithoutRef`).
- **`intent`** names a semantic color family (`'default' | 'success' | 'warning' | 'destructive' |
  'info'`) — used by Alert, Badge, Empty's icon-chip. Keep it orthogonal to a genuinely separate fill
  axis if one exists (Badge's `variant`: `'subtle' | 'solid' | 'minimal'`). Don't invent a synonym prop
  name (`color`, `status`) for the same concept — there is no `color` prop anywhere in the system.
  Button is the one documented exception: its single 14-value `variant` enum deliberately bakes
  style×family into one axis, not a synonym case.
- **`data-slot`** on every part (`data-slot="foo-header"`), plus `data-variant`/`data-size`/`data-state`
  reflecting the resolved CVA variant/prop so consumers can target state in CSS (`data-[state=open]:…`)
  without new props. Highlighted/selected/focused Base UI state comes for free via `data-highlighted`/
  `data-selected`/`data-focused` — style off those, don't duplicate them with a custom data attribute.
- **§7.6 render-prop contract**: a component that owns a SINGLE polymorphic root must expose Base UI's
  `render` prop — either it's a thin Base UI wrapper (props extend the Base UI component's own props,
  never `Omit<…, 'render'>`), or you own the root yourself via `useRender` (`render?: useRender.RenderProp`
  threaded through). `Omit<…, 'render'>` is banned by the `render-contract` lint UNLESS the file is on
  the explicit allowlist (`split-button.tsx` — a genuine multi-root composite with no single element to
  replace). Purely-presentational multi-element shells with no single root (Card, PageHeader, Empty) are
  not a regression — they never had `render` to begin with. See component-matrix.md §7.6 for the full
  primitives/exemptions inventory before adding a new exemption.
- **`'use client'`** at the LOWEST interactive leaf only — a pure presentational compound (Badge, Card,
  Kbd, Empty's static parts) stays server-safe with no directive. If a hook (`useAnimationReplay`,
  `useIsMobile`, a `MutationObserver`) is wired in unconditionally, the file needs the directive —
  that's an accepted, intentional cost (see `useShakeOnInvalid`'s JSDoc), not a defect to work around.
- **CVA** for variants, **`cn()`** from `@vegastack/design` for class merging (its `twMerge` config
  extends the `font-size` classGroup with the custom type utilities — `text-h1…h4`, `text-code*`,
  `text-display-*` — so they merge correctly against `text-foreground` etc; don't reintroduce that bug
  by hand-rolling class concatenation).
- **Icons**: only `lucide-react` (direct import fine for internal chrome — chevrons, spinners) or
  `@vegastack/design/icons` `Icon`/`BrandIcon` (thesvg brand marks, lucide-animated motion icons). No other
  icon library (`icon-source` lint denylists the common ones), no inline `<svg>` as an icon
  (`inline-svg-icon` lint) — the allowed exceptions are `progress-indicator.tsx` (a non-icon graphic
  primitive) and the vendored `registry/ui/icons/**` mirrors.
- **Icon-only accessible names**: `<Button size="icon*">` with no visible text MUST carry `aria-label`
  or `aria-labelledby` on the same element, or a spread (`{...props}`) that could supply one — enforced
  by an AST rule (`icon-button-name`) that parses JSX, not just regex. Prefer `IconButton`, which
  requires the label at the TYPE level so this can never regress.
- **Chevron policy**: `ChevronsUpDown` marks combobox-style triggers that filter/search (Combobox,
  CountrySelect, RegionSelect, DataList sortable headers). `ChevronDown` marks select-style triggers
  that just open a fixed list (Select, DatePicker, SplitButton, Accordion — rotates 180° open/closed).
  Don't mix the two within one trigger family.
- **Size scale mirrors Button's**: `xs`/`sm`/`default`/`lg` where applicable, on the `--size-*` tokens.

## 4. Responsive checklist

- **`min-w-0`/`truncate` discipline**: a flex child that should truncate needs `min-w-0` on itself (flex
  items default to `min-width: auto`, which blocks shrinking below content size); `truncate`/
  `line-clamp-*` goes on an INNER text span, never combined with `flex`/`inline-flex` on the same
  element — `flex` always wins the display conflict, silently defeating the ellipsis
  (`flex-truncate-conflict` lint enforces this split). Pattern: `<div className="flex min-w-0 …"><span
  className="truncate">…</span></div>`.
- **Unbounded text**: don't hand-roll overflow detection — compose `TruncatedText`/`IconText`/
  `TableCellText` (`truncated-text.tsx`). It already handles hover-only expansion, keyboard access, AND
  the no-hover-device tap-to-toggle case below.
- **Container queries for parent-width-driven layout** (NOT viewport breakpoints) whenever a
  component's own responsive behavior should follow the width of its actual container, not the
  viewport — e.g. a settings row inside a narrow sidebar card should stack even on a wide desktop
  viewport. Pattern (from `settings-row.tsx`/`app-shell.tsx`/`field.tsx`): name your own container
  (`@container/my-component`) and write `@sm/my-component:flex-row` etc. Only reach for a
  `ResizeObserver`-driven variant if a container query genuinely can't express it (ship the simpler
  mechanism first — the app-shell content region evaluated and deferred a ResizeObserver breadcrumb
  variant for exactly this reason).
- **Touch targets ≥24px** (WCAG 2.5.8) via an INVISIBLE hit-area expansion, not a bigger visual control:
  `relative` on the control, `before:absolute before:-inset-N before:content-['']` sized so the
  resulting box is ≥24×24, with the visual glyph unchanged. Verify with the elementFromPoint technique
  in §7 (real Chromium hit-testing) — `getComputedStyle` alone can lie (a native `<button>`'s
  `appearance:button` Preflight clips overflowing `::before` content when nested; you need a real
  boundary probe to catch that).
- **Safe-area insets**: any fixed/pinned-to-viewport-edge surface (toast offsets, a flush sheet edge)
  should add `env(safe-area-inset-*)` alongside its own spacing — pattern: `calc(var(--spacing) * N +
  env(safe-area-inset-top))` (see `sonner.tsx`/`sheet.tsx`). Zero cost where the env var is 0.
- **`dvh` not `vh`** for viewport-relative heights that must survive mobile browser chrome
  show/hide (`max-h-[calc(100dvh-var(--spacing)*8)]`, per the arbitrary-value contract — the fixed
  offset inside `calc()` must itself be a token). `svh` is the deliberate exception for a shell that
  should collapse to the SMALLEST viewport (e.g. Sidebar), not the dynamic one.
- **Viewport clamps for popups**: menus/comboboxes/selects should cap width at
  `max-w-[var(--available-width)]` (a Base UI runtime var) so they never overflow a narrow viewport.

## 5. Accessibility checklist

- **WCAG 2.1 AA.** One `expectNoA11yViolations(...)` test per meaningfully-different UI STATE your
  component implements (default, open, loading, disabled, checked/selected, error/invalid, collapsed —
  whatever applies), not just one smoke test at rest.
- **`:focus-visible` is centralized** — `base.css` provides a global 2px outline. If you strip a popup's
  native outline (`outline-none`), the file-scoped `outline-none` lint rule requires SOME focus
  affordance to exist elsewhere in the file: a `focus-visible:`/`focus-within:` ring, the sanctioned
  text-entry `focus:border-…` tint pattern (Input/Textarea/OTP — deliberately `focus` not
  `focus-visible` so click and Tab read identically in a text field), or Base UI's own
  `data-[highlighted]`/`data-[selected]`/`data-[focused]` state styling on roving-tabindex items.
  `outline-none` on a genuinely non-focusable fixed VIEWPORT container (a dialog's outer positioner) is
  fine and doesn't need one — but don't add a new blanket file exemption without a one-line rationale
  (see `OUTLINE_NONE_EXEMPT` in `design-lint.mjs`).
- **Icon-only controls need an accessible name** — see §3; prefer `IconButton`.
- **Live regions**: for status/progress announcements, mirror the established pattern — a visually
  hidden (`sr-only`) `role="status" aria-live="polite"` node holding ONLY the text that should be
  announced (see `copy-button.tsx`'s "Copied" announcement, `auto-save-input.tsx`'s save-state
  announcement, `AnimatedNumber`'s settled-value-only announcement). Never stream every intermediate
  frame of an animation into a live region — announce the destination, not the ticks.
  Base UI's own `Combobox.Empty`/`Combobox.Status` (and Command's `CommandEmpty`/`CommandLoading`) are
  ALREADY live regions — they must stay mounted in the DOM; toggle their CHILDREN, never wrap the
  component itself in a conditional, and keep them as SIBLINGS of the listbox (nesting a `role="status"`
  inside `role="listbox"` trips `aria-required-children` — verified, this was a real bug fixed in the
  Command rebuild).
- **Keyboard**: every interactive affordance must be reachable and operable by keyboard alone — Base UI
  primitives give you this for free for their own interaction model; anything you hand-roll (a custom
  roving-tabindex group, a hit-area expansion) needs its own keyboard test.
- **Auto-shake / auto-motion should never fire on mount** — `useShakeOnInvalid` only fires on a live
  false→true transition, deliberately, so a form pre-rendered with server-side errors doesn't shake
  unprompted on first paint. Follow the same "reacts to a live user-triggered transition, not to initial
  state" discipline for any new auto-triggered motion.

## 6. Files to write (per component `<name>`, PascalCase `<Name>`)

1. **`packages/ui/registry/ui/<name>.tsx`** (or `packages/ui/registry/ui/<name>.ts` for a pure hook,
   `type: registry:hook`) — the component. `'use client'` only if interactive. JSDoc every exported
   prop (`@default` where relevant) so `AutoTypeTable` renders correctly; JSDoc the component itself
   with an `@example`. Export a named `<Name>Props` interface (or type) and any `<name>Variants` CVA.
2. **`packages/ui/registry/ui/<name>.test.tsx`** — Vitest browser mode. See §7 for conventions. Cover:
   default render, every interactive behavior, every variant/size data attribute, every applicable
   state (disabled/loading/invalid/…), ref forwarding (per `ref-forwarding-spec.md`), and at least one
   `expectNoA11yViolations` per distinct state.
3. **`apps/docs/components/preview/<name>.tsx`** — starts with `'use client';` (RSC-safety for compound
   sub-part access, not just interactivity). Named example functions, each wrapped in `<Wrapper>`
   (`import { Wrapper } from './wrapper'`), importing the copied-in component from
   `@/components/ui/<name>`. Export `<name>()` (default) plus `<name>Variants()`/`<name>Sizes()`/
   `<name>States()` as applicable.
4. **`apps/docs/content/docs/components/<name>.mdx`** — frontmatter `title`/`description`/
   `preview: <name>`; section order: Installation → Usage → Examples
   (`<ComponentPreview name="…" file="components/preview/<name>.tsx" />`) → API Reference
   (`<AutoTypeTable path="../../packages/ui/registry/ui/<name>.tsx" name="<Name>Props" />`) →
   Accessibility (a keyboard table) → Do/Don't (`<DoDont do="…" dont="…" />`). Add an Anatomy section
   for compound components. **No `{@link}`** — MDX parses `{…}` as JS; use inline code instead.
5. **`registry.json` item** (`packages/ui/registry.json`, orchestrator-owned but you must hand back the
   exact object): `type: "registry:ui"` (or `registry:hook`/`registry:block`), `title`, `description`,
   `categories`, `dependencies` (verified current pins — check an existing recent item for the live
   version, e.g. `@base-ui/react@^1.6.0`, `class-variance-authority@^0.7.1`, `lucide-react@^1.20.0` if
   used, `@vegastack/design@^0.1.0`, `@vegastack/design-tokens@^0.1.0`), **`registryDependencies` namespaced
   `@vegastack/<name>`** for every OTHER `@vegastack` component you import from `@/components/ui/*`
   (bare `"toggle"` resolves to shadcn's own radix component and overwrites ours — always namespace).
   `verify-registry-deps.mjs` (wired into `registry:build`) fail-closes on both phantom AND missing
   deps by cross-checking your actual imports — don't hand-guess this list, let the gate catch drift.
   `files: [{ path: "packages/ui/registry/ui/<name>.tsx", type: "registry:ui", target:
   "@ui/<name>.tsx" }]` — the `@ui/` placeholder (NEVER a hard-coded `components/ui/<name>.tsx`)
   resolves to each consumer's configured `aliases.ui`. `meta: { whenToUse, whenNotToUse, version:
   "0.1.0" }`.
6. **A changeset** (`pnpm changeset`).
7. **`apps/docs/components/preview/index.tsx`** barrel re-export + the components `meta.json` nav entry
   (`apps/docs/content/docs/components/meta.json` — pick the right group heading; see the current file
   for the grouping convention: Buttons & Actions / Inputs & Controls / Overlays / Menus & Commands /
   Navigation / Layout & Structure / Data Display / Feedback & Status / Content & Typography / Chat &
   Communication).
8. **VRT coverage** — add the showcase route to the `PAGES` array in
   [`apps/docs/vrt/components.spec.ts`](../../apps/docs/vrt/components.spec.ts) (e.g.
   `'/docs/components/<name>'`). The shared suite self-activates (snapshot-dir probe OR `VRT_UPDATE=1`)
   and covers BOTH Playwright projects (`chromium` desktop 1280×720, `mobile-chromium` 375×812) from the
   one route entry — don't author a per-page `describe` block, and never leave a skipped visual test
   describe (the `.skip` modifier on a `describe`/`test` call) or a deferred-coverage TODO marker
   referencing VRT (both are lint-rejected by `content-lint.mjs` — the deferred-coverage workflow no
   longer exists).

## 7. Test conventions

- **`vitest-browser-react`**: `const screen = await render(<Foo />)` — `render` is ASYNC, always
  `await` it. Query via `screen.getByRole(...)`, assert via `await expect.element(locator)
  .toBeInTheDocument()/.toHaveAttribute(...)/.toHaveClass(...)`. `userEvent` comes from
  `vitest/browser`, not `@testing-library/user-event`.
- **This harness compiles NO Tailwind CSS** for most files (only `test/contrast.css` is compiled, for
  the real-color contrast gate) — layout classes like `size-4` collapse to zero size, so:
  - Prefer a native `.click()`/`dispatchEvent` on `element()` over a Playwright-style pointer click that
    depends on real visible geometry for interaction tests.
  - For anything that needs a REAL computed-style or hit-area assertion, use the **style-mirror
    technique**: inject a literal `<style>` tag that is a 1:1 hand-transcription of what the exact
    Tailwind utility values you shipped compile to (keyed off `data-slot`/`data-size`, which are real
    regardless of compiled CSS), then assert against `getComputedStyle` for real. See
    `injectCheckboxHitAreaMirror` in `checkbox.test.tsx` for the canonical example (also used by
    `radio-group.test.tsx`, `slider.test.tsx`, `sidebar.test.tsx`, `filter-bar.test.tsx`,
    `data-list.test.tsx`, `password-input.test.tsx`, `auto-save-input.test.tsx`).
  - Combine the style-mirror with **`document.elementFromPoint(x, y)` boundary probes** to verify an
    expanded hit-area for real: sample a point just inside vs. just outside the claimed hit-area
    boundary (computed from `getBoundingClientRect()`) and assert which element resolves. This is what
    caught the real Chromium-only bug where a native `<button>`'s `appearance:button` Preflight clips an
    overflowing `::before` — `getComputedStyle` alone reported the right box, but the real hit-test
    didn't match it.
  - The one compiled-CSS exception: color-contrast and cross-overlay z-stacking assertions live in the
    small set of `*.browser.test.tsx` files that DO import compiled CSS (`test/contrast.browser.test.tsx`,
    `test/stacking.browser.test.tsx`) — don't duplicate that setup per-component; add a case there if
    you're introducing a new overlay/portal interaction, not a new file.
- **A11y**: `expectNoA11yViolations(el, disableRules?)` from `../../test/a11y` runs real `axe-core`
  (WCAG 2.1 AA rule tags). Only pass `disableRules` for checks that literally cannot evaluate in this
  CSS-less harness (e.g. `color-contrast`, since semantic tokens don't resolve to real colors here) —
  document why at the call site; the compiled-CSS contrast gate covers real contrast separately.
- **Scoped runs**: `pnpm exec vitest run registry/ui/<name>.test.tsx` from `packages/ui` while
  iterating; `pnpm test` (full suite) before the gate.
- **Smoke lane** (`pnpm --filter @vegastack/ui test:smoke`): a deliberate SUBSET of motion-exercising
  files run against real WebKit + Firefox (not just Chromium) via `vitest.smoke.config.ts`. Add your
  file to its `include` list only if it exercises a motion mechanism (replay APIs, keyed presence,
  `AnimatedNumber`) or a cross-engine-risky interaction pattern — not every new component needs this,
  the full unit suite already runs on every PR in Chromium.

## Verify (the local gate — run before considering the component done)

```bash
node tooling/design-lint.mjs packages/ui/registry            # token-only + a11y AST rules
cd packages/ui && pnpm exec tsc --noEmit && pnpm exec vitest run
cd ../..
pnpm registry:build                                          # validate → hash → stamp → verify-deps
pnpm dlx shadcn@latest add @vegastack/<name> -y -o            # copy-in renders (serve public/r locally)
```
Then visually verify in the Fumadocs showcase, and generate the VRT baseline for the new route:
1. Run the `update_baselines` job of `.github/workflows/vrt.yml` (pinned Playwright image,
   `VRT_UPDATE=1`) — or locally, delete-then-regenerate rather than trusting `--update-snapshots` to fix
   a suspect baseline (see `docs/plans/2026-07-decisions-log.md` Phase X2: a mid-animation baseline
   "passed" `--update-snapshots` because the page was tall enough that `maxDiffPixelRatio: 0.01` masked
   the missing content).
2. Commit `apps/docs/vrt/**/*-snapshots/*.png`.
3. Confirm the normal (non-bootstrap) VRT run passes.
