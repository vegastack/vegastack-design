---
name: component
description: The authoring contract for adding a NEW component to the vegastack-design repo or changing an existing one — single-source-of-truth workflow, motion mechanism choice, naming/API canon, responsive and accessibility checklists, the four artefacts every PR carries, and the local verify loop. Use when asked to add, build, scaffold, update, change, fix, or refactor a component, hook, or block in this repo.
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

**`design.md` is living, and a direction change owes it an update — in the wave PR, not this one.**
If a component's direction changes (a new variant axis, a retired token, a different interaction
model), record what `design.md` now has to say and carry it in the doctrine PR that closes the wave;
`pnpm design:sync:check` gates only the derived surfaces and cannot tell you the prose went stale, so
that judgment is yours and skipping it is how the doctrine rots.

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
re-stamped integrity IS the change signal downstream) → tests → `pnpm verify` → a look at the page →
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

| Mechanism                 | Use for                                                                                                          | How                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Base UI lifecycle**     | Overlay/disclosure enter-exit (dialog, popover, dropdown, select, tooltip, accordion, tabs)                      | `data-starting-style`/`data-ending-style` + `transition-[…] duration-* ease-standard` on the popup root — the reference pattern, do not reinvent it. **An ANCHORED overlay does not write this itself:** it composes `FloatingSurface` (`registry/ui/floating-surface.tsx`), whose `motion` variant carries the D11 timings — `fast` (150ms) for every floating surface, `base` (200ms) only for NavigationMenu, which resizes rather than appears. Modal surfaces (dialog, alert-dialog, sheet) own their own transition at `duration-base` |
| **Keyed presence**        | Mount-triggered one-shot arrivals (icon/text swap, badge pop, chat message arrival, skeleton→content reveal)     | `motion-pop-in` (scale .9→1 + fade, `--ease-spring`) or `motion-enter-up` (fade + 4px rise) from `packages/design-tokens/src/utilities.css`; remount via a changing React `key` so the CSS animation replays                                                                                                                                                                                                                                                                                                                                 |
| **Docked presence**       | A control parked at a viewport edge that stays mounted and flips `data-active` (bottom action bar, floating scroll-to-edge button) | `data-[active=true]:motion-dock-in` + `data-[active=false]:motion-dock-out` — 150ms in on `emphasized`, 100ms out on `exit`, translate + fade, **no scale** (an exit is never slower than its enter). The pair owns the timing, the fade and the parked `pointer-events: none`; state the travel DISTANCE yourself as ordinary `translate-*` utilities, because it is per-dock geometry and a `translate` in the utility would clobber a centred bar's composed transform |
| **Replay APIs**           | Re-triggering without remounting, when focus/caret/value must survive (shaking an already-focused invalid input) | `useAnimationReplay(animationClassName)` is the primitive; `useShakeOnInvalid({ shakeSignal? })` wraps it, watching `aria-invalid`/`data-invalid` via `MutationObserver` (Base UI's Field context writes those straight to the DOM, never through props). **Only `field.tsx` may call it** — validation motion belongs to `Field`, once, for every control it wraps; a control that shakes itself makes the field shake twice (audit D5). |
| **Animated-icon handles** | Stroke-draw / complex icon motion (a success check drawing in)                                                   | The `lucide-animated` mirrors under `registry/ui/icons/**` are data modules over one factory (`@vegastack/design/create-animated-icon`); each exposes an imperative `startAnimation()`/`stopAnimation()` on a React 19 ref prop — call it from your own handler. Attaching a ref also stands the icon's own hover/focus triggers down, so your handler is the only driver                                                                                                                                                                    |
| **`AnimatedNumber`**      | Tweening a displayed number on `value` change                                                                    | `<AnimatedNumber value={n} format={intlOptions} />` — a `requestAnimationFrame` tween, reads `--duration-*`/`--motion-ease-standard` live via `getComputedStyle`, instant under reduced motion, `aria-hidden` ticking text plus a polite live region announcing only the settled value                                                                                                                                                                                                                                                       |

Do **not** hand-roll `pathLength` animation onto a plain `lucide-react` icon: it spreads props onto
the SVG root only and never reaches the inner `<path>` (verified in its compiled source), and
hand-authored inline `<svg>` is icon-rule-banned anyway.

Contract for every new animated element:

- Honor `prefers-reduced-motion: reduce`. The global reset in `base.css` collapses `motion-*`
  keyframes to their end state automatically (every keyframe's `to` equals the resting style) — as
  long as a component-local override does not fight it.
- `animate-spin`/`animate-pulse` are the only sanctioned raw Tailwind animation utilities.
- Excluded by design, do not add speculatively: avatar hover-lift, card 3D tilt, FAB morph.

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
  prop anywhere in the system. **Button is the model to copy, not an exception:** it splits the two
  concerns into `variant` (the SHAPE — `solid · soft · outline · ghost · link · cta`) × `tone` (the
  HUE — `neutral · destructive · success · warning · info`), writes each recipe once, and lets the
  tone set `--btn-*` custom properties the recipe reads. When a component genuinely needs both axes,
  do that; when it only needs the hue, it is `intent`. The one cell Button's TYPE forbids is
  `tone="destructive"` with `variant="solid"` (D4).
- **`data-slot`** on every part, plus `data-variant`/`data-tone`/`data-size`/`data-state` reflecting the resolved
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
- **Icon-only controls are `IconButton`, always.** `Button` has no icon size tier; `IconButton`
  makes the missing `aria-label` a TYPE error and owns `shape="square" | "round"` (a `rounded-full`
  override on a Button is not the way to get a circle). The legacy AST rule `icon-button-name` still
  guards any `<Button size="icon*">` that a consumer's older copy might carry.
- **Chevron policy** — `ChevronsUpDown` marks combobox-style triggers that filter/search (Combobox,
  CountrySelect, RegionSelect, DataList sortable headers). `ChevronDown` marks select-style triggers
  that open a fixed list (Select, DatePicker, SplitButton, Accordion — rotates 180°). Never mix the
  two within one trigger family.
- **One size vocabulary, system-wide** — `xs`/`sm`/`md`/`lg`, on `--size-*`, with `md` the default
  tier. No component may name a tier `default`, and none may invent a private scale.
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
- **CSS first, `useIsMobile` last.** The ladder is: a container query (follows the component's own
  width) → a viewport breakpoint (follows the page) → `useMediaQuery`/`useIsMobile` from
  `use-media-query.ts`. Only the third one costs a `'use client'` boundary and a hydration pass, so
  it is reserved for branches CSS cannot express — mounting a different component tree (a modal
  `Sheet` instead of a rail), enabling pointer drag, skipping a `requestAnimationFrame` loop. If both
  branches render and only their layout differs, it is a CSS job.
- **A JS media branch must DECLARE its server answer.** `useMediaQuery(query, { serverFallback })`
  reports `serverFallback` on the server render and the client's hydration render, then reconciles.
  The default `false` is a decision, not a neutral value: on a mobile-first surface it renders the
  DESKTOP branch on a phone until hydration finishes. Pass `serverFallback: true` there. Never add a
  second `matchMedia` subscription — `use-media-query.ts` is the system's only one, and
  `usePrefersReducedMotion` is its named reduced-motion reader.
- **Touch targets ≥24px** (WCAG 2.5.8) via an INVISIBLE hit-area, not a bigger visual control:
  `relative` on the control plus `before:absolute before:-inset-N before:content-['']` sized so the
  box is ≥24×24. Verify with a real `elementFromPoint` boundary probe — `getComputedStyle` alone can
  lie (see [references/testing.md](references/testing.md)).
- **Safe-area insets** — any surface pinned to a viewport edge adds `env(safe-area-inset-*)` alongside
  its own spacing: `calc(var(--spacing) * N + env(safe-area-inset-top))` (see `toast.tsx`,
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
- **Live regions — use `useAnnouncer`; do not hand-roll one.** Destructure `announce` and
  `Announcer` from `useAnnouncer()` (`registry/ui/use-announcer.ts`) and render ONE `Announcer`
  element per component, mounted for its whole life. The hook owns the three things a hand-rolled region gets wrong: it is mounted
  **empty from first paint** (a region inserted at the moment it gains text is often never
  announced), its child is **keyed by a monotonic sequence** so repeating an identical string still
  re-announces (a same-value `setState` is a React bail-out), and its state lives in the hook's own
  store so an announcement re-renders the region rather than the host. It replaced five identical
  `{text, seq}` copies in this registry — writing a sixth is the defect, not the fix. Announce the
  **destination**, never every intermediate frame; `role="alert"` stays a separate, per-component
  decision (polite `status` by default, `alert` only for destructive/warning content rendered after
  mount). A visible status slot is never also the live region — it would announce its own icon
  swaps. Base UI's `Combobox.Empty`/`Combobox.Status` (and `CommandEmpty`/`CommandLoading`) are
  ALREADY live regions: they must stay mounted — toggle their CHILDREN, never wrap the component in
  a conditional, and keep them as SIBLINGS of the listbox (nesting `role="status"` inside
  `role="listbox"` trips `aria-required-children` — a real bug fixed in the Command rebuild).
- **Live regions are polite by default; assertive is opt-in and rare (D23).** A region already in the
  DOM at page load announces nothing, so `role="status"` is free on a static surface — while
  `role="alert"` is ASSERTIVE and interrupts the screen reader mid-sentence. So a visible status
  surface (Alert) is `role="status"` for every intent, and takes the assertive `alert` role only when
  the caller passes an explicit `live` prop AND the intent is `destructive`/`warning` — i.e. the
  message appeared after mount because of something the user did. **Page chrome present at load gets
  no live role at all** (`AnnouncementBanner`): announcing it competes with the page's own heading.
  Test the policy, not the markup: a static banner must resolve to `status`, a live destructive one
  to `alert`.
- **A role that requires a parent is licensed by a CONTEXT, never by a default.** `role="listitem"`
  needs a `list` ancestor, `option` a `listbox`, `gridcell` a `grid`. A part that applies such a role
  unconditionally is an axe `aria-required-parent` critical the moment anyone uses it standalone —
  and the workaround it forces on consumers (`role="none"`) is the tell. Have the container provide a
  React context and the child take the role only inside it; outside, render no role at all. `Item` /
  `ItemGroup` is the reference case (B7-01).
- **Keyboard** — every interactive affordance reachable and operable by keyboard alone. Base UI gives
  this for free for its own interaction model; anything hand-rolled (a custom roving-tabindex group,
  a hit-area expansion) needs its own keyboard test.
- **Auto-motion never fires on mount** — `useShakeOnInvalid` (called by `Field`, and only by
  `Field`) fires only on a live false→true
  transition, so a form pre-rendered with server-side errors does not shake on first paint. Apply the
  same "reacts to a live transition, not to initial state" discipline to any new auto-triggered
  motion. Two mechanisms are wrong and were removed from `NotificationBell` (B7-03): a ref read
  during render (the effect that flips it schedules no re-render, so the class lands on whatever
  unrelated re-render happens next), and replaying by `key`-remount (a class toggle cannot reach a
  freshly remounted node). Hold the previous value in STATE, compare it in an effect, and drive the
  replay through `useAnimationReplay` — and gate the cue on what the user can actually SEE changing,
  not on the raw prop.
- **Cursor cues** — do not force `cursor-default` onto native standard controls or restate
  `cursor-pointer` on a native link (`standard-control-cursor`); `cursor-default` on a text-entry
  control destroys its I-beam affordance.

## 6. What a PR carries

**Four artefacts per PR: the source, its test, its MDX page, and a changeset.** Everything else in
this list travels WITH one of those four — the preview and barrel entry belong to the page, the
registry item and the contract record belong to the source — and none of them is a separate errand.
What does NOT belong in a component PR: `design.md`, the skills and their mirror, the ledgers, and
`AGENTS.md`. Those move once per wave or release, in a PR that touches nothing else, so that a
component change is never blocked on doctrine prose and doctrine is never edited eight times a week
by eight branches.

For component `<name>` (PascalCase `<Name>`), in dependency order:

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

6. **A changeset** — `pnpm changeset`. Its body OPENS with one of the eight CHANGELOG section
   emoji (`🧩 🔧 🗑 🛠 📦 📚 🐛 ⚠️`), which is how the release entry is assembled at version time;
   `tooling/changeset-lint.mjs` fails the lint chain without one. Do **not** hand-edit
   `/CHANGELOG.md` — `tooling/changelog-assemble.mjs` writes the entry once per release.
7. **`apps/docs/components/preview/index.tsx`** barrel re-export + the nav entry in
   `apps/docs/content/docs/components/meta.json` (pick the right group heading; see the file for the
   convention).
8. **The contract record** — add (for a new component) or UPDATE (for a change to variants, sizes,
   states, motion, engines, or test files) the component's record in
   [`packages/ui/component-contracts.json`](../../../packages/ui/component-contracts.json), then run
   `pnpm design:derived`. It refreshes the committed prose surfaces (the component matrix, the
   public skill roster, the audit register, AGENTS.md § Numbers, README § Inventory) — commit those
   — and it writes the two **untracked build outputs**,
   `apps/docs/lib/home-component-catalog.generated.ts` and
   `apps/docs/components/animated-icon-gallery.generated.tsx` (`tooling/lib/derived-build-outputs.mjs`
   is the list). `prepare:content` writes those, `.gitignore` excludes them, and there is nothing to
   stage — the authority you commit is the contract record. No lane consumes a generated route list
   any more: the contract and pixel suites that did were deleted, and the blocking visual gate
   (`packages/ui/test/geometry.browser.test.tsx`) reads the preview barrel directly. Never
   hand-edit a generated file, and never leave a skipped visual test (rejected by
   `tooling/content-lint.mjs`).

## 7. Verify

**Two commands, and one of them is a person.** `pnpm check:component <name>` is the inner loop —
design-lint over the registry, a workspace typecheck, and this component's own unit test, measured
~10s — so run it after every meaningful edit rather than saving verification for the end. `pnpm verify`
is what you run before opening the PR: typecheck, lint, `design:verify`, and the whole browser suite
including the geometry contracts. It is byte-for-byte what CI executes, so there is nothing further to
run and nothing to attest.

```bash
pnpm check:component <name>                    # ~10s, after every edit
pnpm registry:build                            # after any canonical edit: validate → hash → stamp → verify-deps
pnpm design:derived                            # after any contract-record edit; commit what it changes
pnpm verify                                    # BLOCKING, before the PR. Includes 320px reflow · RTL · 24px targets
pnpm -F @vegastack/docs dev                    # REVIEW. open the page and look at it
```

A green `design-lint` + `tsc` + `vitest` + `registry:build` is **not** the gate: `pnpm design:verify`
(inside `pnpm verify`) can fail while all four are green, because it owns RSC safety, contract
reconciliation, public API docs, theme parity, and the portal/mirror checks. Two release-only checks
are worth running by hand when a change touches distribution — `pnpm registry:verify-consume` (the
real `shadcn add` round-trip) and `pnpm dlx shadcn@latest add @vegastack/<name> -y -o` against a
locally served `public/r` — but `pnpm verify:release` runs both before any deploy.

1. The geometry contracts are the blocking visual-surface gate, in
   `packages/ui/test/geometry.browser.test.tsx` — inside the vitest browser suite, so `pnpm verify`
   runs them and so does CI, on the LAN Linux runners in the pinned Playwright container. A red result
   is a defect in the component, not in the suite. Reproduce one fixture with
   `pnpm --filter @vegastack/ui exec vitest run test/geometry.browser.test.tsx -t <fixture>`.
2. There is **no pixel-capture tool** — that lane was removed on 2026-09-08
   (`docs/plans/2026-09-08-verification-rebuild.md` § 3.3) and no screenshot is taken or committed
   anywhere. The visual half is a person opening the docs page in light and dark, at narrow and wide,
   exercising every state — rest, hover, pressed, focus-visible, disabled.
3. "The gate is green" is not a visual verdict. Say what you looked at, or say you did not look.
