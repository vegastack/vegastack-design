---
name: component
description: The authoring contract for adding a NEW component to the vegastack-design repo or changing an existing one — single-source-of-truth workflow, motion mechanism choice, naming/API canon, responsive and accessibility checklists, the four artefacts every PR carries, and the local verify loop. Use when asked to add, build, scaffold, update, change, fix, or refactor a component, hook, or block in this repo.
---

# Authoring or changing a component

**First question, always: does upstream ship this component?**

```bash
ls vendor/shadcn/4.21.0/ui/<name>.tsx                              # upstream ships it?
node -p "!!require('./packages/ui/upstream/ours.json').items['<name>']"   # or is it one of ours?
```

If it exists in `vendor/`, the file you ship is **upstream's file plus an approved patch**, and the
per-component loop below is the whole procedure. If it does not, it is one of ours: § 1 onward is the
authoring contract, and it must be recorded in `packages/ui/upstream/ours.json` or the parity gate
fails it.

Reference implementations — read the source, not a description of it. Upstream-backed:
`packages/ui/registry/ui/button.tsx` with `packages/ui/upstream/patches/button.patch` beside it (six
decision IDs, one hunk each). Ours: `date-picker.tsx` (a keeper that composes upstream's `calendar`,
`popover` and `button`), `animated-number.tsx` (a client hook-driven primitive with a documented
mechanism choice). The per-file checklist is
[`docs/ledger/authoring-guide.md`](../../../docs/ledger/authoring-guide.md).

**What is authoritative, in order:** `vendor/shadcn/4.21.0/` and the `tooling/upstream/*` gates (they
decide what a shared component may contain) → existing component source and `tooling/design-lint.mjs`
(they define what passes) → `design.md` (the gated doctrine) → the official docs for the Base UI /
Tailwind / React versions in `package.json`. Anything in `docs/plans/` is a point-in-time record of a
past decision, not a description of the system today.

**No new decisions.** A difference from upstream is legal only if
`packages/ui/upstream/decisions.json` marks its ID **ours**. If the case is not covered, stop and ask
MK; never invent a row, and never re-open a settled one because the code is awkward. Two subagents
invented `A11Y-14` and `A11Y-15` during the reset; both were reverted and the numbers are permanently
burned.

**`design.md` is living, and a direction change owes it an update — in the wave PR, not this one.**
`pnpm design:sync:check` gates only the derived surfaces and cannot tell you the prose went stale, so
that judgment is yours and skipping it is how the doctrine rots.

Deep reference, loaded on demand:

- [references/tokens.md](references/tokens.md) — the complete token vocabulary and the
  arbitrary-value / inline-style contracts. Read before writing any class string.
- [references/testing.md](references/testing.md) — browser-mode conventions, the style-mirror
  technique, `elementFromPoint` probes, a11y assertions, the smoke lane.

## The per-component loop (upstream-backed components)

Every component shadcn ships is **upstream's file plus an approved patch**. Do exactly this, every
time — including when you are only changing one class:

```bash
N=button
cp vendor/shadcn/4.21.0/ui/$N.tsx packages/ui/registry/ui/$N.tsx   # 1. upstream, verbatim
#                                                                    2. apply mapped exceptions only
pnpm upstream:diff $N                                              # 3. regenerate the patch
#                                                                    4. tests  5. docs  6. contract
pnpm registry:build && pnpm check:component $N                     # 7. build and verify
```

1. **Copy upstream verbatim.** Never edit the previous VegaStack file, never merge the two by hand,
   never "port" or improve upstream in passing. Starting from upstream every time is what makes the
   diff readable and the gate meaningful.
2. **Apply only the exceptions this component is assigned.**
   `packages/ui/upstream/exception-map.json` is the assignment: its `required` map lists, per
   decision ID, the components whose patch header must name it. In practice the recurring hunks are:
   strip the `ring-3 ring-ring/50` focus glow (FOC-1/FOC-6), strip every focus-variant border
   colour so no border moves on focus or while open (FOC-14 — invalid keeps
   `aria-invalid:border-destructive` in every state, with no `not-focus:` guard), delete upstream's `cursor-default` (INT-1), drop
   `disabled:pointer-events-none` (FRM-4), add the theme scope inside the portal (OVL-13), move a
   tinted status surface onto the `-text` ink (A11Y-13), and swap the `cn` import (DOC-2).
   **If an exception seems to need a structural rewrite, stop and ask MK** rather than rewriting the
   component. A component whose patch ends up empty is the expected outcome, not a missed step.
3. **`pnpm upstream:diff <name>`**, then write the header. It is mandatory and the tool refuses a
   patch without it:

   ```
   # component: sheet
   # decisions: FOC-1, FOC-6, OVL-13, DOC-2
   # hunks:
   #   1: drop the focus-visible ring glow (FOC-1, FOC-6)
   ```

   A **no-hunk** decision is legitimate and is recorded in the header with its reason plus a test
   that pins the engine's own behaviour — that is how A11Y-6 on `scroll-area` and API-5 on `tabs` are
   recorded. A row satisfied by an engine is still a claim, and a claim needs a test.

4. **Test file**, rewritten: renders, every exported part, every variant and size data attribute, one
   behaviour test per upstream docs section, `expectNoA11yViolations` per distinct state, and **one
   assertion per exception the patch implements** (no `ring-3` anywhere in the tree; `aria-disabled`
   set with pointer events alive; the `-text` ink on the tint).
5. **Docs page**, mirroring upstream's own section list — see § 6.
6. **Contract record**, then `pnpm design:derived`.
7. **`pnpm registry:build`**, then `pnpm check:component <name>`.

Three questions before every commit: does this file equal upstream plus its patch? does every hunk
name an ID the register marks **ours**? does the page carry every section upstream's page has?

`pnpm upstream:check` answers all three mechanically, and runs inside `pnpm lint`.

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
re-stamped integrity IS the change signal downstream) → affected tests → a targeted look at the page
→ changeset. Pull-request CI supplies the one authoritative full-static plus affected-browser proof.

## 1. Tokens

Zero hardcoded visual values — enforced by `tooling/design-lint.mjs`. Full vocabulary in
[references/tokens.md](references/tokens.md). The rules that bite most often:

- Semantic colours only — no hex, no numbered Tailwind palette. `bg-black/10` and `bg-white` are
  upstream's own scrim vocabulary and are fine.
- **No focus-ring glow, anywhere** — no `ring-3`, no `ring-ring/NN`, no `focus-visible:ring-*`, no
  `shadow-[0_0_0_…]`. **No focus border either (FOC-14)**: no focus- or open-variant border
  colour; every control keeps its resting `border-border`/`border-input`. base.css owns the one cue,
  an `accent`/50 background tint, text entry included (a `data-field-group` wears it on the group).
  This is the rule that keeps the reset from unwinding on the next pull.
- Sizes, radii, shadows, z-index, alpha and opacity are **plain Tailwind** now: `h-8`, `size-4`,
  `rounded-xl`, `shadow-md`, `z-50`, `bg-foreground/10`, `opacity-50`. The token families that used
  to own them are deleted.
- Type SIZES are Tailwind's stock scale and `font-semibold`/`text-4xl` are ordinary utilities; the
  role tokens (`text-h1`, `text-label`, `text-code`, `text-mono-label`) are gone. **The metrics are
  not yours to set**: the `@theme` bridge owns line-height and letter-spacing for `text-lg` and up
  and holds the copy tier at zero, so never write `tracking-tight` (it beats the ramp through
  `var(--tw-tracking, …)`), never write an arbitrary `text-[13px]`, and never use `uppercase` —
  sentence case, always. Mono is for code; a label or a sentence is `font-sans`.
- Motion pairs nothing: `transition-all duration-100 ease-in-out` is upstream's own vocabulary and
  is legal. Our `duration-fast`/`ease-standard` tokens remain for the `motion-*` utilities.

## 2. Motion mechanism matrix

| Mechanism                 | Use for                                                                                                                            | How                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Base UI lifecycle**     | Overlay/disclosure enter-exit (dialog, popover, dropdown, select, tooltip, accordion, tabs)                                        | `data-starting-style`/`data-ending-style` + a `transition-[…]` on the popup root — the reference pattern, do not reinvent it. **Since Batches 4 and 5 of the shadcn reset every shared overlay writes its own, because it IS upstream's file**: popover, hover-card, the two menus, menubar, select, combobox, tooltip, the four modal surfaces and navigation-menu each carry upstream's timings verbatim, and none of them composes `FloatingSurface` any more. Batch 7a retired that composer outright; its last two callers, `emoji-picker` and `shortcut-overlay`, own their popup chrome and share only the OVL-11 search row, which Batch 7c gave one owner in `panel-search.tsx` |
| **Keyed presence**        | Mount-triggered one-shot arrivals (icon/text swap, badge pop, chat message arrival, skeleton→content reveal)                       | `motion-pop-in` (scale .9→1 + fade, `--ease-spring`) or `motion-enter-up` (fade + 4px rise) from `packages/design-tokens/src/utilities.css`; remount via a changing React `key` so the CSS animation replays                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Docked presence**       | A control parked at a viewport edge that stays mounted and flips `data-active` (bottom action bar, floating scroll-to-edge button) | `data-[active=true]:motion-dock-in` + `data-[active=false]:motion-dock-out` — 150ms in on `emphasized`, 100ms out on `exit`, translate + fade, **no scale** (an exit is never slower than its enter). The pair owns the timing, the fade and the parked `pointer-events: none`; state the travel DISTANCE yourself as ordinary `translate-*` utilities, because it is per-dock geometry and a `translate` in the utility would clobber a centred bar's composed transform                                                                                                                                                                                                                |
| **Replay APIs**           | Re-triggering without remounting, when focus/caret/value must survive (shaking an already-focused invalid input)                   | `useAnimationReplay(animationClassName)` is the primitive; `useShakeOnInvalid({ shakeSignal? })` wraps it, watching `aria-invalid`/`data-invalid` via `MutationObserver`. **No canonical component calls it as of Batch 3 of the shadcn reset**: `field.tsx` is upstream's file now and upstream's Field has no validation motion (FRM-9 is an **ours** row that `implementation.md` § 5.2 does not assign to any component, so the reset does not reintroduce it). The hook ships as a registry item for consumers; if a component ever shakes again, the shake belongs to ONE owner in a field — two owners make the field shake twice (audit D5).                                     |
| **Animated-icon handles** | Stroke-draw / complex icon motion (a success check drawing in)                                                                     | The `lucide-animated` mirrors under `registry/ui/icons/**` are data modules over one factory (`@vegastack/design/create-animated-icon`); each exposes an imperative `startAnimation()`/`stopAnimation()` on a React 19 ref prop — call it from your own handler. Attaching a ref also stands the icon's own hover/focus triggers down, so your handler is the only driver                                                                                                                                                                                                                                                                                                                |
| **`AnimatedNumber`**      | Tweening a displayed number on `value` change                                                                                      | `<AnimatedNumber value={n} format={intlOptions} />` — a `requestAnimationFrame` tween, reads `--duration-*`/`--motion-ease-standard` live via `getComputedStyle`, instant under reduced motion, `aria-hidden` ticking text plus a polite live region announcing only the settled value                                                                                                                                                                                                                                                                                                                                                                                                   |

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

Before adding a prop, part, component or block to one that is ours, run the checklist and the
decision tree in [references/conventions.md](references/conventions.md).

- **Flat exports only** — no dotted sub-component namespaces. Compound parts are separate named
  exports (`AlertTitle`, `DialogTrigger`, `EmptyHeader`, `ItemMedia`).
- **React 19 ref-as-prop, never `React.forwardRef`** (banned by the `forward-ref` AST rule). The four
  patterns — props spread onto the host, `useRender`'s `ref` param, explicit placement, delegating
  wrapper — are in
  [`docs/ledger/ref-forwarding-spec.md`](../../../docs/ledger/ref-forwarding-spec.md). Type with
  `ComponentPropsWithRef<'div'>`, never `ComponentPropsWithoutRef`.
- **`intent`** (API-17) names a hue-only axis on a component that is **ours** — never a synonym
  (`color`, `status`); there is no `color` prop anywhere in the system. **A component reset onto
  upstream does not get an `intent` axis**: API-2 resolves as shadcn, so it takes upstream's flat
  `variant` list verbatim, and our four status families surface as EXTRA `variant` values written in
  upstream's own `destructive` shape (COL-12) — `Badge` and `Alert` are the model. A tinted status
  surface takes the family's `-text` ink, never the fill used as ink (A11Y-13).
- **`data-slot`** on every part, plus `data-variant`/`data-size`/`data-state` reflecting the resolved
  CVA variant so consumers can target state in CSS without new props. Base UI already supplies
  `data-highlighted`/`data-selected`/`data-focused` — style off those, do not duplicate them. There
  is no `data-tone` and no `data-shape`: both axes went with the reset, and their mirrors with them.
- **Render-prop contract** — a component owning a SINGLE polymorphic root must expose Base UI's
  `render` prop: either a thin Base UI wrapper (props extend the Base UI component's own, never
  `Omit<…, 'render'>`), or you own the root via `useRender` with `render?: useRender.RenderProp`
  threaded through. `Omit<…, 'render'>` is banned (`render-contract`) with no exemptions at all —
  the one entry, `split-button.tsx`, went with Batch 7a of the shadcn reset.
  Purely-presentational multi-element shells (Card, PageHeader, Empty) never had
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
- **Icon-only controls are `<Button size="icon">`** — plus `icon-xs`, `icon-sm` and `icon-lg`,
  upstream's four square tiers, each needing an explicit `aria-label`, which `icon-button-name`
  checks. There is no `IconButton`: Batch 7a of the shadcn reset retired it, so the accessible name
  is a lint guarantee rather than a type-level one, and a round control is `className="rounded-full"`
  on the same Button.
- **Chevron policy** — `ChevronsUpDown` marks combobox-style triggers that filter/search (Combobox,
  CountrySelect, RegionSelect, DataList sortable headers). `ChevronDown` marks select-style triggers
  that open a fixed list (Select, DatePicker, ButtonGroup's menu trigger, Accordion — rotates
  180°). Never mix the two within one trigger family.
- **Size names are upstream's** — `default` is the tier name, with `xs`, `sm` and `lg` around it, plus
  `icon`, `icon-xs`, `icon-sm` and `icon-lg` where a square tier exists. The old `xs · sm · md · lg`
  vocabulary and the `--size-*` tokens behind it are deleted; heights are plain utilities (`h-6`,
  `h-7`, `h-8`, `h-9`). A component that is ours and needs a size axis uses upstream's names, and most
  of ours dropped the axis entirely rather than invent a private scale (`number-field`, `chip-input`,
  `copy-button`).
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
- **`:focus-visible` is centralized** — `base.css` provides a global background tint (`accent` at
  50%, laid as an image over the fill), text entry included. A focus cue base.css cannot reach must
  be restated as that same background tint, never a border: the OTP active slot's
  `data-[active=true]:bg-accent/50`, the questionnaire choice card's `accent`/50 gradient, or Base
  UI's `data-[highlighted]`/`data-[selected]`/`data-[focused]` background styling. A bordered field
  group carries `data-field-group` so base.css tints the group; a caret-only editor declares
  `data-focus-cue="caret"`. `outline-none` on a
  genuinely non-focusable fixed viewport container (a dialog's outer positioner) is fine. There is
  no file-level exemption list any more — the shadcn reset deleted it along with the rule that
  read it — so a file that needs one is a stop-and-ask, not an entry to add.
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
  swaps. Base UI's `Combobox.Empty`/`Combobox.Status` are ALREADY live regions: they must stay
  mounted — toggle their CHILDREN, never wrap the component in a conditional, and keep them as
  SIBLINGS of the listbox (nesting `role="status"` inside `role="listbox"` trips
  `aria-required-children`). Since Batch 4 of the shadcn reset, `command` is upstream's **cmdk**
  build, and cmdk ships NO live region at all: the palette mounts one `useAnnouncer` region and
  announces the filtered result count (A11Y-3/A11Y-4, `packages/ui/upstream/patches/command.patch`).
  Upstream's `toast` needs no such hunk — Base UI's `Toast.Viewport` already IS one polite region,
  mounted for the life of the toaster. (`sonner` carried the same exemption until it was retired
  on 2026-09-22; Toast is now the only notification engine.)
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

**A BLOCK carries the same four, in a different shape** (Batch 8 of the shadcn reset,
2026-09-18). A block is a copy-once PAGE with no prop surface, so: its source is
`packages/ui/registry/blocks/<name>/page.tsx` plus `components/*.tsx`, and those parts import each
other RELATIVELY (`./components/<x>`) — never `@/components/<x>`, which upstream uses and which
would make fifteen blocks fight over one flat `components/app-sidebar.tsx` on install. Its test
asserts that the composition mounts, shows its own content and is axe-clean; the behaviour of each
part belongs to that part's suite. Its page lives under `apps/docs/content/docs/blocks/` and is NOT
under the docs canon. Its contract record goes in `contracts.blocks`, and a block whose source is
upstream's (it is named in `vendor/shadcn/4.21.0/manifest.json`) is exempt from
`verify-public-api-docs` for the same reason a migrated component is — adding JSDoc to upstream's
file would be a hunk with no decision ID behind it. A block that mounts a `Sidebar` needs the
desktop `matchMedia` mock in its suite, or the rail mounts as a closed Sheet and nothing is in the
DOM.

For component `<name>` (PascalCase `<Name>`), in dependency order:

1. **`packages/ui/registry/ui/<name>.tsx`** — or `.ts` for a pure hook (`type: registry:hook`).
   A module with **no React in it at all** — a dataset, a lookup, an exported class-string recipe —
   is a `registry:lib` instead: it lives in `packages/ui/registry/lib/<name>.ts`, targets
   `@lib/<name>.ts`, is imported as `@/lib/<name>`, and is modeled in the contract's `libs` bucket
   (family `lib`, wave `Libs`) with `docs: "shared-guide-only"` — no docs page, no preview, no VRT
   route, but a test file is still required. `geo-data` and `drag-item` are the two. Reach for it
   when two components would otherwise carry the same bulk data or the same class string.
   `'use client'` only if interactive. JSDoc every exported prop (`@default` where relevant) so
   `ApiTable` renders correctly; JSDoc the component with an `@example`. Export a named
   `<Name>Props` and any `<name>Variants` CVA.
2. **`packages/ui/registry/ui/<name>.test.tsx`** — default render, every interactive behavior, every
   variant/size data attribute, every applicable state, ref forwarding, and at least one
   `expectNoA11yViolations` per distinct state. Conventions in
   [references/testing.md](references/testing.md).
3. **`apps/docs/components/preview/<name>.tsx`** — starts with `'use client';` (RSC-safety for
   compound sub-part access, not just interactivity). Named example functions each wrapped in
   `<Wrapper>`, importing from `@/components/ui/<name>`. Export `<name>()` plus
   `<name>Variants()`/`<name>Sizes()`/`<name>States()` as applicable.
4. **`apps/docs/content/docs/components/<name>.mdx`** — written to `design.md` § Docs canon, which
   `tooling/content-lint.mjs` enforces. Frontmatter (row 0): `title`, `description`, `audience`,
   `registry` (the item name — required, never inferred from the slug), `status`, `since`, `a11y`,
   `preview`. Sections, in this order and no others:
   Install (`<InstallSteps name="<name>" />`) → Usage → Scope (composites) →
   Anatomy (`<Anatomy name="<name>" />`, required when the item exports more than one component
   part) → Examples (`<ComponentPreview …/>`) → Playground (a curated `<…Playground />`, or the
   Story explorer where none exists, or neither — never both, DD-3) → API Reference
   (`<ApiTable path="../../packages/ui/registry/ui/<name>.tsx" name="<Name>Props" />`) →
   Accessibility (keyboard table + `<StatesTested name="<name>" />`) → Do/Don't (`<DoDont …/>`) →
   Deviations. The generated halves are never hand-typed.
   **No `{@link}`** — MDX parses `{…}` as JS; use inline code.

   **For an upstream-backed component the Examples section is not yours to shape.** Its `###`
   headings are upstream's own docs sections, in upstream's order, taken from
   `vendor/shadcn/4.21.0/docs/<name>.json`, and each one carries its own live
   `<ComponentPreview name="…" />` whose fixture is built from upstream's example code (adapted only
   for our import paths). `tooling/upstream/verify-variant-coverage.mjs` matches them occurrence by
   occurrence in document order — so upstream's two same-titled `Custom Items` sections on `combobox`
   need two headings and two different previews — and rejects a preview name the barrel does not
   export. Upstream has a section we cannot support is a **stop-and-ask**, never a silent omission.

   **The page then closes with `## Deviations`** (canon row 10): one bullet per decision ID the
   component's patch implements, in the patch header's order, one line each. A component whose patch
   is only the `cn` import says so and lists DOC-2 alone. Nothing follows it. A component that is
   **ours** has no Deviations section and closes on Do / Don't instead.

   **A component that is ours writes its own section list**, since there is no upstream page to
   mirror, and it must be recorded in `packages/ui/upstream/ours.json`.

5. **`registry.json` item** — `type`, `title`, `description`, `categories`, `dependencies`, and
   **`registryDependencies` namespaced `@vegastack/<name>`**
   for every other `@vegastack` component imported from `@/components/ui/*` (a bare `"toggle"`
   resolves to shadcn's own radix component and overwrites ours). `files: [{ path: "…", type: "…",
target: "@ui/<name>.tsx" }]` — the `@ui/` placeholder, never a hard-coded path, resolves to each
   consumer's configured `aliases.ui`. `meta: { whenToUse, whenNotToUse, version }`.
   `verify-registry-deps.mjs` fail-closes on phantom AND missing deps — let the gate catch drift
   rather than hand-guessing _which_ deps to list.

   It also checks version ranges, against the version `pnpm-lock.yaml` actually resolves for
   `packages/ui` — so take each `dependencies` pin from `packages/ui/package.json`, which declares
   that version, and never from a neighbouring registry item, which was stamped at a different time.
   A pin that does not admit the installed version fails the gate by name. (Until 2026-09-18 the
   check compared against the FLOOR of the workspace's own range, which a range always admits, so it
   could only notice two declarations disagreeing — that is how `lucide-react` once shipped at both
   `^1.20.0` and `^0.525.0` across a major boundary.)

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

Local tests are optional feedback. `check:component` delegates to the affected planner: it runs the
component, its transitive reverse dependents, their owned cross-cutting suites, and only their preview
geometry fixtures. `check:affected` derives the same scope from the working tree. Both use an
incremental UI typecheck.

```bash
pnpm upstream:check                            # vendor integrity + byte parity + variant coverage
pnpm upstream:diff <name>                      # (re)generate a patch; refuses a header with no IDs
pnpm check:component <name>                    # explicit component + reverse dependents
pnpm check:affected                            # derive from staged, unstaged, and untracked work
pnpm registry:build                            # after any canonical edit: validate → hash → stamp → verify-deps
pnpm design:derived                            # after any contract-record edit; commit what it changes
pnpm -F @vegastack/docs dev                    # targeted light/dark + narrow/wide agent review
```

The required PR job runs `verify:static` once, then `verify:affected --base <sha> --head <sha>` in
Chromium. `component-contracts.json` supplies source, test, preview and dependency ownership;
`verify-registry-deps` reconciles dependency declarations against real imports. An unknown path,
stale owner, empty fixture selection, or generated-file drift fails rather than selecting nothing.

1. The geometry contracts are the blocking visual-surface gate, in
   `packages/ui/test/geometry.browser.test.tsx`. Affected CI mounts only fixtures exported by the
   changed component and its dependents, while always running the CSS/token sentinels and metadata
   guards. Reproduce one fixture with
   `pnpm --filter @vegastack/ui exec vitest run test/geometry.browser.test.tsx -t <fixture>`.
2. Agent visual review is targeted and temporary: inspect the affected previews in light/dark and
   narrow/wide, exercising applicable states. Never commit captures.
3. The complete suite is manual-only: `pnpm test:full --engines chromium|all`. It is for rare audits
   and diagnosis, not a normal PR or release requirement.
