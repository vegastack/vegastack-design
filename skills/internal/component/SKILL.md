---
name: component
description: The authoring contract for adding a NEW component to the vegastack-design repo or changing an existing one — single-source-of-truth workflow, motion mechanism choice, naming/API canon, responsive and accessibility checklists, the eight files every component needs, and the local verify gate. Use when asked to add, build, scaffold, update, change, fix, or refactor a component, hook, or block in this repo.
---

# Authoring or changing a component

Reference implementations — read the source, not a description of it:
`packages/ui/registry/ui/combobox.tsx` (Base UI wrapper + CVA + full JSDoc), `empty.tsx` (compound
presentational), `animated-number.tsx` (client hook-driven primitive with a documented mechanism
choice). The per-file checklist is
[`docs/ledger/authoring-guide.md`](../../../docs/ledger/authoring-guide.md).

**What is authoritative, in order:** existing component source and `tooling/design-lint.mjs` (they
define what actually passes) → `design.md` (the canonical, gated design doctrine) → the official docs
for the Base UI / Tailwind / React versions in `package.json`. Anything in `docs/plans/` is a
point-in-time record of a past decision, not a description of the system today — use it to learn why
something was chosen, never to confirm that it still holds.

**`design.md` is living, and it is part of the change.** If a component's direction changes —
a new variant axis, a retired token, a different interaction model — `design.md` must move with it in
the same change. `pnpm design:sync:check` gates the derived surfaces, but it cannot tell you the
prose has gone stale; that judgment is yours.

Deep reference, loaded on demand:

- [references/tokens.md](references/tokens.md) — the complete token vocabulary and the
  arbitrary-value / inline-style contracts. Read before writing any class string.
- [references/testing.md](references/testing.md) — browser-mode conventions, the style-mirror
  technique, `elementFromPoint` probes, a11y assertions, the smoke lane.

## 0. Single source of truth

Every component exists in **three synced places**; you edit **one**:

1. **Canonical (EDIT THIS)** — `packages/ui/registry/ui/<name>.tsx`, or
   `packages/ui/registry/blocks/<name>/` for a block.
2. **Docs copy-in (GENERATED)** — `apps/docs/components/ui/<name>.tsx`, re-synced byte-for-byte.
3. **Registry JSON (GENERATED)** — `apps/docs/public/r/<name>.json`, built by `shadcn build`,
   carrying `meta.integrity` and the `// @vegastack <name>@<ver> sha256-…` provenance header.

```bash
pnpm run registry:build   # validate → build → stamp → header → verify-headers → verify-registry-deps
```

Idempotent and fully local. **Never** hand-edit the copy-in or the JSON, and never fix component
styling in `apps/docs/components/preview/*.tsx` — previews only COMPOSE the component.

Two mechanics worth knowing. JSON payloads carry no provenance header — a `//` comment would break
them, so `registry-header`/`verify-headers` skip `.json` files and item-level `meta.integrity`
covers them instead. And `public/r` is pruned to current items on every build: `shadcn build` is
additive-only, so a renamed or removed item's stale JSON would otherwise linger and could re-stamp a
source file with a dead identity.

Changing an existing component follows the same path: edit canonical → `registry:build` (the
re-stamped integrity IS the change signal downstream) → tests → contract suite → visual review →
changeset.

## 1. Tokens

Zero hardcoded visual values — enforced by `tooling/design-lint.mjs`. Full vocabulary in
[references/tokens.md](references/tokens.md). The rules that bite most often:

- Semantic colors only — no hex, no raw Tailwind palette.
- `--size-*` for control heights, `--icon-*` for icon sizes, `rounded-lg` is the cap.
- `--alpha-*` for colour compositing, `--opacity-*` for whole-element opacity; never interchangeable.
- Two z-bands: `z-(--z-raised)`, `z-(--z-overlay)`.
- A `transition*` must pair a `duration-*` AND an `ease-*` in the same string literal.
- Weight ladder is 400/500; uppercase is mono-exclusive and ≤14px.
- Arbitrary values only for `var()`, token-bearing `calc()`, layout primitives, CSS keywords.

## 2. Motion mechanism matrix

| Mechanism                 | Use for                                                                                                          | How                                                                                                                                                                                                                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Base UI lifecycle**     | Overlay/disclosure enter-exit (dialog, popover, dropdown, select, tooltip, accordion, tabs)                      | `data-starting-style`/`data-ending-style` + `transition-[…] duration-fast ease-standard` on the popup root — the reference pattern, do not reinvent it                                                                                                                                 |
| **Keyed presence**        | Mount-triggered one-shot arrivals (icon/text swap, badge pop, chat message arrival, skeleton→content reveal)     | `motion-pop-in` (scale .9→1 + fade, `--ease-spring`) or `motion-enter-up` (fade + 4px rise) from `packages/design-tokens/src/utilities.css`; remount via a changing React `key` so the CSS animation replays                                                                           |
| **Replay APIs**           | Re-triggering without remounting, when focus/caret/value must survive (shaking an already-focused invalid input) | `useAnimationReplay(animationClassName)` is the primitive; `useShakeOnInvalid({ shakeSignal? })` wraps it, watching `aria-invalid`/`data-invalid` via `MutationObserver` (Base UI's Field context writes those straight to the DOM, never through props)                               |
| **Animated-icon handles** | Stroke-draw / complex icon motion (a success check drawing in)                                                   | The `lucide-animated` mirrors under `registry/ui/icons/**` expose an imperative `startAnimation()` via `useImperativeHandle` on a forwarded ref — call it from your own handler                                                                                                        |
| **`AnimatedNumber`**      | Tweening a displayed number on `value` change                                                                    | `<AnimatedNumber value={n} format={intlOptions} />` — a `requestAnimationFrame` tween, reads `--duration-*`/`--motion-ease-standard` live via `getComputedStyle`, instant under reduced motion, `aria-hidden` ticking text plus a polite live region announcing only the settled value |

Do **not** hand-roll `pathLength` animation onto a plain `lucide-react` icon: it spreads props onto
the SVG root only and never reaches the inner `<path>` (verified in its compiled source), and
hand-authored inline `<svg>` is icon-rule-banned anyway.

Contract for every new animated element:

- Honor `prefers-reduced-motion: reduce`. The global reset in `base.css` collapses `motion-*`
  keyframes to their end state automatically (every keyframe's `to` equals the resting style) — as
  long as a component-local override does not fight it.
- `animate-spin`/`animate-pulse` are the only sanctioned raw Tailwind animation utilities.
- Excluded by design, do not add speculatively: avatar hover-lift, card 3D tilt, FAB morph. Toast
  motion is sonner-owned.

## 3. Naming and API canon

- **Flat exports only** — no dotted sub-component namespaces. Compound parts are separate named
  exports (`AlertTitle`, `DialogTrigger`, `EmptyHeader`, `ItemMedia`).
- **React 19 ref-as-prop, never `React.forwardRef`** (banned by the `forward-ref` AST rule). The four
  patterns — props spread onto the host, `useRender`'s `ref` param, explicit placement, delegating
  wrapper — are in
  [`docs/ledger/ref-forwarding-spec.md`](../../../docs/ledger/ref-forwarding-spec.md). Type with
  `ComponentPropsWithRef<'div'>`, never `ComponentPropsWithoutRef`.
- **`intent`** names a semantic color family (`'default' | 'success' | 'warning' | 'destructive' |
'info'`). Keep it orthogonal to a genuinely separate fill axis if one exists (Badge's `variant`:
  `'subtle' | 'solid' | 'minimal'`). Never invent a synonym (`color`, `status`) — there is no `color`
  prop anywhere in the system. Button is the one documented exception: its single 14-value `variant`
  enum deliberately bakes style×family into one axis.
- **`data-slot`** on every part, plus `data-variant`/`data-size`/`data-state` reflecting the resolved
  CVA variant so consumers can target state in CSS without new props. Base UI already supplies
  `data-highlighted`/`data-selected`/`data-focused` — style off those, do not duplicate them.
- **Render-prop contract** — a component owning a SINGLE polymorphic root must expose Base UI's
  `render` prop: either a thin Base UI wrapper (props extend the Base UI component's own, never
  `Omit<…, 'render'>`), or you own the root via `useRender` with `render?: useRender.RenderProp`
  threaded through. `Omit<…, 'render'>` is banned (`render-contract`) except for the allowlisted
  `split-button.tsx`. Purely-presentational multi-element shells (Card, PageHeader, Empty) never had
  `render` — that is not a regression, and it is different from stripping one via `Omit`. A new
  exemption goes in the lint's allowlist with a one-line rationale, and needs review — do not add one
  to work around a type error.
- **`'use client'` at the LOWEST interactive leaf only.** A pure presentational compound stays
  server-safe with no directive; a file that unconditionally wires a hook needs it (an accepted cost,
  not a defect to work around). `presentational-client-boundary` lint rejects a directive with no
  concrete client requirement.

  "Server-safe" is a _runtime_ claim, enforced by `tooling/verify-rsc-safety.mjs`. Under the
  `react-server` condition React exports `createContext`, `useContext`, `useState`, `useRef`,
  `useEffect`, `useLayoutEffect`, `useReducer`, `useImperativeHandle`, `useSyncExternalStore`,
  `useTransition`, and `useDeferredValue` as **`undefined`** — so touching any of them, or importing
  `@base-ui/react/use-render` (which calls `useRef` internally), without the directive throws a
  `TypeError` on import in an RSC. `useCallback`, `useMemo`, `useId`, `use`, `forwardRef`, and `memo`
  are available server-side. The same rule binds the published entries: `@vegastack/design`'s root
  entry must stay RSC-importable, because server-safe components import `cn` from it — which is why
  the client-only theme-scope plumbing lives at the `@vegastack/design/theme-scope` subpath and is
  never re-exported from the root.

- **CVA** for variants, **`cn()`** from `@vegastack/design` for merging — its `twMerge` config
  extends the `font-size` classGroup with the custom type utilities so they merge correctly against
  `text-foreground`. Do not hand-roll class concatenation.
- **Icons** — `lucide-react` (direct import is fine for internal chrome: chevrons, spinners) or
  `Icon`/`BrandIcon` from `@vegastack/design/icons`. No other library (`icon-source`), no inline
  `<svg>` as an icon (`inline-svg-icon`).
- **Icon-only accessible names** — `<Button size="icon*">` with no visible text MUST carry
  `aria-label`/`aria-labelledby` on the same element, or a spread that could supply one (AST rule
  `icon-button-name`). Prefer `IconButton`, which requires the label at the type level.
- **Chevron policy** — `ChevronsUpDown` marks combobox-style triggers that filter/search (Combobox,
  CountrySelect, RegionSelect, DataList sortable headers). `ChevronDown` marks select-style triggers
  that open a fixed list (Select, DatePicker, SplitButton, Accordion — rotates 180°). Never mix the
  two within one trigger family.
- **Size scale mirrors Button's** — `xs`/`sm`/`default`/`lg` where applicable, on `--size-*`.
- **No native interactive HTML** — canonical components may not render native
  `<button>`/`<input>`/`<select>`/`<textarea>` without an exact per-tag count and rationale in
  `RAW_INTERACTIVE_EXEMPTIONS` (`raw-interactive-html`). Compose the VegaStack control instead.

## 4. Responsive checklist

- **`min-w-0`/`truncate` split** — a flex child that should truncate needs `min-w-0` on itself (flex
  items default to `min-width: auto`, blocking shrink below content size); `truncate`/`line-clamp-*`
  goes on an INNER span, never on the same element as `flex`/`inline-flex` (`flex` always wins the
  display conflict and silently defeats the ellipsis — `flex-truncate-conflict` enforces this).
  Pattern: `<div className="flex min-w-0 …"><span className="truncate">…</span></div>`.
- **Unbounded text** — compose `TruncatedText`/`IconText`/`TableCellText` (`truncated-text.tsx`)
  rather than hand-rolling overflow detection. It already handles hover-only expansion, keyboard
  access, and the no-hover-device tap-to-toggle case.
- **Container queries, not viewport breakpoints**, whenever responsive behavior should follow the
  component's actual container — a settings row in a narrow sidebar card should stack even on a wide
  viewport. Name your own container (`@container/my-component`) and write `@sm/my-component:flex-row`
  (see `settings-row.tsx`, `app-shell.tsx`, `field.tsx`). Reach for a `ResizeObserver` variant only
  if a container query genuinely cannot express it.
- **Touch targets ≥24px** (WCAG 2.5.8) via an INVISIBLE hit-area, not a bigger visual control:
  `relative` on the control plus `before:absolute before:-inset-N before:content-['']` sized so the
  box is ≥24×24. Verify with a real `elementFromPoint` boundary probe — `getComputedStyle` alone can
  lie (see [references/testing.md](references/testing.md)).
- **Safe-area insets** — any surface pinned to a viewport edge adds `env(safe-area-inset-*)` alongside
  its own spacing: `calc(var(--spacing) * N + env(safe-area-inset-top))` (see `sonner.tsx`,
  `sheet.tsx`). Zero cost where the env var is 0.
- **`dvh` not `vh`** for viewport-relative heights that must survive mobile browser chrome
  show/hide. `svh` is the deliberate exception for a shell that should collapse to the SMALLEST
  viewport (Sidebar).
- **Viewport clamps for popups** — menus/comboboxes/selects cap width at
  `max-w-[var(--available-width)]` (a Base UI runtime var) so they never overflow a narrow viewport.

## 5. Accessibility checklist

- **WCAG 2.2 AA**, preserving every existing 2.1 assertion. One `expectNoA11yViolations(...)` per
  meaningfully-different UI state, not one smoke test at rest.
- **`:focus-visible` is centralized** — `base.css` provides a global 2px outline. A file that strips
  it (`outline-none`) must provide some focus affordance elsewhere in the same file: a
  `focus-visible:`/`focus-within:` ring, the sanctioned text-entry `focus:border-…` tint (Input,
  Textarea, OTP — deliberately `focus` not `focus-visible` so click and Tab read identically), or
  Base UI's `data-[highlighted]`/`data-[selected]`/`data-[focused]` styling. `outline-none` on a
  genuinely non-focusable fixed viewport container (a dialog's outer positioner) is fine; a new
  blanket file exemption needs a one-line rationale in `OUTLINE_NONE_EXEMPT`.
- **Live regions** — a visually hidden `role="status" aria-live="polite"` node holding ONLY the text
  that should be announced (see `copy-button.tsx`, `auto-save-input.tsx`, `AnimatedNumber`). Announce
  the destination, never every intermediate frame. Base UI's `Combobox.Empty`/`Combobox.Status` (and
  `CommandEmpty`/`CommandLoading`) are ALREADY live regions: they must stay mounted — toggle their
  CHILDREN, never wrap the component in a conditional, and keep them as SIBLINGS of the listbox
  (nesting `role="status"` inside `role="listbox"` trips `aria-required-children` — a real bug fixed
  in the Command rebuild).
- **Keyboard** — every interactive affordance reachable and operable by keyboard alone. Base UI gives
  this for free for its own interaction model; anything hand-rolled (a custom roving-tabindex group,
  a hit-area expansion) needs its own keyboard test.
- **Auto-motion never fires on mount** — `useShakeOnInvalid` fires only on a live false→true
  transition, so a form pre-rendered with server-side errors does not shake on first paint. Apply the
  same "reacts to a live transition, not to initial state" discipline to any new auto-triggered
  motion.
- **Cursor cues** — do not force `cursor-default` onto native standard controls or restate
  `cursor-pointer` on a native link (`standard-control-cursor`); `cursor-default` on a text-entry
  control destroys its I-beam affordance.

## 6. Files to write

For component `<name>` (PascalCase `<Name>`):

1. **`packages/ui/registry/ui/<name>.tsx`** — or `.ts` for a pure hook (`type: registry:hook`).
   `'use client'` only if interactive. JSDoc every exported prop (`@default` where relevant) so
   `AutoTypeTable` renders correctly; JSDoc the component with an `@example`. Export a named
   `<Name>Props` and any `<name>Variants` CVA.
2. **`packages/ui/registry/ui/<name>.test.tsx`** — default render, every interactive behavior, every
   variant/size data attribute, every applicable state, ref forwarding, and at least one
   `expectNoA11yViolations` per distinct state. Conventions in
   [references/testing.md](references/testing.md).
3. **`apps/docs/components/preview/<name>.tsx`** — starts with `'use client';` (RSC-safety for
   compound sub-part access, not just interactivity). Named example functions each wrapped in
   `<Wrapper>`, importing from `@/components/ui/<name>`. Export `<name>()` plus
   `<name>Variants()`/`<name>Sizes()`/`<name>States()` as applicable.
4. **`apps/docs/content/docs/components/<name>.mdx`** — frontmatter `title`/`description`/`preview`;
   section order Installation → Usage → Examples (`<ComponentPreview …/>`) → API Reference
   (`<AutoTypeTable path="../../packages/ui/registry/ui/<name>.tsx" name="<Name>Props" />`) →
   Accessibility (keyboard table) → Do/Don't (`<DoDont …/>`). Add Anatomy for compound components.
   **No `{@link}`** — MDX parses `{…}` as JS; use inline code.
5. **`registry.json` item** — `type`, `title`, `description`, `categories`, `dependencies`, and
   **`registryDependencies` namespaced `@vegastack/<name>`**
   for every other `@vegastack` component imported from `@/components/ui/*` (a bare `"toggle"`
   resolves to shadcn's own radix component and overwrites ours). `files: [{ path: "…", type: "…",
target: "@ui/<name>.tsx" }]` — the `@ui/` placeholder, never a hard-coded path, resolves to each
   consumer's configured `aliases.ui`. `meta: { whenToUse, whenNotToUse, version }`.
   `verify-registry-deps.mjs` fail-closes on phantom AND missing deps — let the gate catch drift
   rather than hand-guessing _which_ deps to list.

   It does **not** check version ranges, so the range is on you: take each `dependencies` pin from
   `packages/ui/package.json`, which is the version actually installed and tested. Do not copy the
   range from a neighbouring registry item — items were stamped at different times and disagree
   (`lucide-react` appears as both `^1.20.0` and `^0.525.0` in `registry.json` today, across a major
   boundary), so copying is a coin flip that no gate will catch.

6. **A changeset** — `pnpm changeset`.
7. **`apps/docs/components/preview/index.tsx`** barrel re-export + the nav entry in
   `apps/docs/content/docs/components/meta.json` (pick the right group heading; see the file for the
   convention).
8. **The contract record** — add (for a new component) or UPDATE (for a change to variants, sizes,
   states, motion, engines, or test files) the component's record in
   [`packages/ui/component-contracts.json`](../../../packages/ui/component-contracts.json), then run
   `pnpm design:derived`. It generates `apps/docs/vrt/contract-routes.generated.ts`, the route list
   consumed by BOTH the contract gate (`contracts.spec.ts`) and the local before/after capture
   (`components.spec.ts`); never hand-edit the generated file. Both suites cover all four Playwright
   lanes from that one route — do not author a per-page `describe`, and never leave a skipped visual
   test (rejected by `tooling/content-lint.mjs`).

## 7. Verify

**The inner loop while you work** — design-lint plus every unit test and contract route reached by
the common dependency planner. Run it after every meaningful edit rather than saving verification
for the end:

```bash
pnpm gates:component <name>
```

Then the full local gate before calling the component done:

```bash
node tooling/design-lint.mjs packages/ui/registry     # token-only + a11y AST rules
pnpm typecheck                                        # workspace-wide supported typecheck
pnpm gates:push                                       # supported unit/smoke/scoped-contract wrappers
pnpm registry:build                                    # validate → hash → stamp → verify-deps
pnpm design:derived                                    # contract-derived surfaces stay current
pnpm design:verify                                     # RSC safety, contract reconciliation, +14 more
pnpm registry:verify-consume                           # real `shadcn add` round-trip
pnpm dlx shadcn@latest add @vegastack/<name> -y -o     # copy-in renders (serve public/r locally)
```

`design-lint` + `tsc` + `vitest` + `registry:build` passing is **not** the whole gate —
`pnpm design:verify` can fail while all of those are green (it owns RSC safety, contract
reconciliation, public API docs, theme parity, and the portal/mirror checks). Run it before calling
a component done, or `pnpm lint`, which includes it.

Then prove the behaviour contract and review the pixels. These are different things and neither
substitutes for the other.

```bash
pnpm contracts                                 # BLOCKING. 320px reflow · RTL · 24px targets (see below re: focus)
node tooling/vrt-review.mjs                    # REVIEW. before/after on this machine; exits 0 either way
```

1. The contract suite is the gate, and it is now a LOCAL gate — no CI runner executes a browser, so
   `.husky/pre-push` is where it blocks and `.gates/receipt.json` is how CI knows it ran. A red result
   is a defect in the component, not in the suite. Reproduce one route with
   `node tooling/contracts-run.mjs --routes /docs/components/<name>`; always go through that wrapper
   rather than Playwright directly, because it owns the turbo-cached build, reserves a free port, and
   cross-checks its own `--grep` so a scoped run cannot pass by matching nothing.
2. The review tool captures the branch's merge-base and the working tree, then writes
   `.vrt-review/report.json` plus before/after/diff PNGs. **Read the images** for every entry whose
   `status` is not `unchanged`, classify each intended / unintended / uncertain, and present the
   verdict. No screenshot is committed — `.gitignore` excludes both output directories.
3. A run that captured nothing prints SKIPPED. That is not evidence of a clean diff.
