# Token vocabulary

Every visual value routes through a token utility or a `var(--token)` arbitrary — zero hardcoded
visual values, enforced by `tooling/design-lint.mjs`. Token names verified against
`packages/design-tokens/dist/theme.css`; that file is the ground truth if anything here looks stale.

## Contents

- [Semantic colors](#semantic-colors)
- [Control size scale](#control-size-scale)
- [Icon role tokens](#icon-role-tokens)
- [Radius](#radius)
- [Alpha vs. opacity](#alpha-vs-opacity)
- [Z-index](#z-index)
- [Type scale](#type-scale)
- [Motion durations and eases](#motion-durations-and-eases)
- [Shared constants](#shared-constants)
- [Arbitrary-value contract](#arbitrary-value-contract)
- [Inline style contract](#inline-style-contract)

## Semantic colors

### The surface ladder — the only neutral vocabulary

Neutral surfaces and every interaction step are ONE ladder. Reach for a rung by name:

| token           | role                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| `bg-background` | the page                                                                                                       |
| `bg-card`       | every surface — card, popover, sheet, dialog, sidebar rail (`popover`/`sidebar` ARE `card`)                    |
| `bg-surface-1`  | the rest fill of a filled control (soft button, kbd, chip, tab rail) and every well (not the switch off-track) |
| `bg-surface-2`  | **hover**                                                                                                      |
| `bg-surface-3`  | **pressed / selected** (`data-selected:bg-surface-3`)                                                          |

`secondary`, `muted`, `accent` and every `sidebar-*` name are **ALIASES** of these rungs
(`secondary` = `muted` = `surface-1`, `accent` = `sidebar-accent` = `surface-2`, `sidebar` = `card`).
They compile, but new code names the rung. There is no `track` token: the slider rail, progress track,
skeleton and every well are `surface-1`; the **switch off-track is `surface-3`** (a pressed-weight
affordance, not a well).

**Never write a `hover:bg-*` literal.** Both washes come from the recipes exported by
`@vegastack/design`:

```tsx
import { cn, surfaceInteractive, fillInteractive } from "@vegastack/design";

surfaceInteractive; // "hover:bg-surface-2 active:bg-surface-3" — a control on a known surface
fillInteractive.destructive; // "hover:bg-destructive/(--alpha-hover) active:bg-destructive/(--alpha-pressed)"
```

Use `fillInteractive.<tone>` when the backdrop is NOT a ladder surface (a kbd inside a hovered row,
a chip on a well, chrome over media) or when the control hovers in its own hue. A SOLID fill uses
neither — it owns darker `-hover`/`-active` steps already; a soft fill steps through its precomposed
`{family}-subtle-hover` / `{family}-subtle-active`.

**Every control needs a pressed step.** Hover moves one rung, pressing moves one more; a hover wash
is inset ≥4px from any container hairline and inherits the container's inner radius.

**A "raised chip on a muted track" has its own recipe — do not hand-roll a fifth one.**
`selectedChipVariants` is the single formula behind Tabs `pill`/`chip`, `Segmented`, and pressed
`Toggle`/`ToggleGroup`:

```tsx
import { cn, selectedChipVariants } from "@vegastack/design";

selectedChipVariants.track; // "bg-surface-1" — the well the chips sit in
selectedChipVariants.item; // reserved transparent hairline + the muted→ink text step
selectedChipVariants.pressed; // the state rules keyed on Base UI's `data-pressed`
selectedChipVariants.active; // …and the same rules keyed on `data-active` (Tabs)
```

The chip is the pressed/selected rung in its ALPHA form, because the backdrop is a well — and
because that is the only form with anywhere left to climb: a SELECTED chip must still hover
(`--alpha-ink-tint-strong`) and still press (back to the resting tint). Never guard the selected
state out of hover/press with `not-data-pressed:` / `not-data-[active]:`; that is the defect this
recipe exists to prevent, not a pattern.

### The rest

`bg-primary` / `text-muted-foreground` / `border-border` / per-family
`{success,warning,destructive,info}` each with
`-hover`/`-active`/`-subtle`/`-subtle-hover`/`-subtle-active`/`-text`/`-foreground` variants /
`--brand` (marker-role accent ONLY — never a functional-state color; never hue-alone, see
`colors.mdx`) / `--chart-single` (a ONE-series chart is drawn in foreground ink; `chart-1…8` start
at two series) / theme-invariant media chrome `bg-media-scrim`, `bg-media-scrim-strong`,
`text-media-foreground` (never `primary` over video — it inverts with the theme).

`info` is **links and informational UI only**. Promotion, selection and emphasis take a ladder rung
or `primary` — never `info`.

`border` is DERIVED as `foreground` at `--alpha-border` (8% light / 14% dark): one translucent
hairline that reads on page, card, well and dark band. `input` and `sidebar-border` alias it.

No hex, no raw Tailwind palette (`bg-neutral-900`, `text-red-500`).

`text-muted-foreground-faint` is sub-AA and restricted to placeholder/disabled copy.

## Control size scale

`--size-*` is 28/32/40, plus `--size-xs` 24px for the kept `xs` control tier:
`h-(--size-sm|md|lg)`, `size-(--size-xs)`.

Raw `h-7`/`h-8`/`h-10` (and `size-`/`min-w-` mirrors) are lint-banned (`raw-control-size`).
`h-6`/`size-6` (24px) is NOT banned — it is shared by non-control scales (badge, switch track,
select scroll strips).

Physical rhythm: xs 24 · sm 28 · md 32 (default) · lg 40.

## Icon role tokens

`--icon-compact` 12 (xs-tier controls only) · `--icon-inline` 14 · `--icon-default` 16 ·
`--icon-action` 20 · `--icon-feature` 24.

Apply via an `svg` descendant selector: `[&_svg:not([class*='size-'])]:size-(--icon-default)`.
Raw sizes inside an svg selector (`]:size-3`, `-3.5`, `-4`, `-5`, `-6`) are lint-banned
(`raw-icon-size`). `size-1`/fractional glyphs (dots) are geometry, not icon scale, and stay allowed.

Never pass `size`/`width`/`height` directly to a lucide component (`direct-lucide-size`) — that
bypasses the role tokens.

## Radius

`rounded-sm` (`--radius-sm`) · `rounded-md` (`--radius-md`, most controls) · `rounded-lg`
(`--radius-lg`, containers/popups — the scale's CAP) · `rounded-(--radius-xs)` (2px) ·
`rounded-(--radius-sharp)` (2px, the marketing "sharp" gesture — same value today, a distinct role).

**`rounded-xl` was REMOVED and is lint-banned** (`removed-radius-xl`) — it used to silently fall back
to Tailwind's unthemed default. Containers cap at `rounded-lg`.

## Alpha vs. opacity

Two distinct roles that are **not** interchangeable (CX-7). Color compositing takes an `--alpha-*`
role; whole-element opacity takes an `--opacity-*` role. Crossing them fails lint
(`alpha-opacity-role` / `opacity-alpha-role`).

Never a raw `/NN` alpha step (`raw-alpha`) or a raw `opacity-NN` (`raw-opacity`; `opacity-0`/
`opacity-100` are exempt structural endpoints).

Alpha role tokens (not exhaustive — see `theme.css`): `--alpha-tint-border` (focus/invalid border
tint), `--alpha-input` (dark-mode input wash), `--alpha-wash`/
`--alpha-wash-faint`/`--alpha-wash-strong` (hover washes), `--alpha-surface-faint`,
`--alpha-soft-hover`/`--alpha-soft-surface` (theme-split),
`--alpha-ink-tint`/`--alpha-ink-tint-strong`, `--alpha-border-soft`/`--alpha-border-subtle`/
`--alpha-outline-border`/`--alpha-outline-soft`, `--alpha-glass`/`--alpha-glass-hover`,
`--alpha-backdrop-soft`, `--alpha-link-hover`, and the ladder's own twins
`--alpha-hover` (7%) / `--alpha-pressed` (10%) / `--alpha-border` (8% light, 14% dark).

Element-opacity tokens: `--opacity-dim` (50%, the uniform disabled-state opacity — NOT design.md's
stale 45%), `--opacity-hint`/`--opacity-hint-soft`, `--opacity-track`.

Precomposed `{family}-subtle-hover` and `{family}-subtle-active` colors exist where an
alpha-over-surface composite would fail AA — prefer them over hand-rolling a new alpha composite for
a hover or pressed state.

Layout dimension tokens: `--layout-header-height` (3.5rem), `--sidebar-width` / `--sidebar-width-icon`
/ `--sidebar-width-mobile`, `--layout-overlay-max-height` (the ceiling for a scrolling overlay body),
`--panel-width-sm/md/lg` (14/18/20rem floating panels).

## Z-index

Three bands: `z-(--z-raised)` (10, local raises inside a component's own stacking context),
`z-(--z-overlay)` (50, every portaled surface — DOM order resolves nesting since Base UI appends
portals to `<body>`, which is `isolate`), and `z-(--z-toast)` (60, the toast stack alone).

The toast band exists because DOM order cannot express its rule: the toast viewport mounts with the
app provider, before any dialog opens, so on mount order every later dialog would cover it — yet a
toast fired from inside a modal must stay visible. `toast.tsx` is the only file allowed to name it,
and the stack counts DOWN from it by `--toast-index`.

Raw `z-N` is lint-banned (`raw-z-index`), with no library-level exception left.

## Type scale

`text-xs…3xl` (xs 11/16 · sm 12/16 · base 14/21 · lg 16/24 · xl 18/26 · 2xl 20/28 · 3xl 24/32).

Role utilities: `text-h1…h4` (24/20/18, weight 400 except h4) · `text-label` · `text-label-sm` ·
`text-code` · `text-code-sm` · `text-mono-label` (12/16 mono +0.05em, the "voice" role — apply
`uppercase` at the call site, it is not baked in).

Display tier: `text-display-sm/md/lg/xl` (32/40/56/72, weight 400, tracking −0.04→−0.06em).

`text-4xl` and above are off-scale and lint-banned (`off-scale-text`) — use a display-tier utility.

**Two-layer scale awareness**: the ladder is SCOPED. `.vs-type-product` (previews + anything under
`[data-base-ui-portal]`) resolves the tighter product ladder (`--type-product-*`); the Fumadocs doc
shell resolves the roomier `--type-doc-*` ladder (16px prose). If a preview or portaled popup renders
at doc-shell size, the `vs-type-product` scope is missing — see
`apps/docs/components/preview/wrapper.tsx` for where it is applied.

**Weight and tracking are owned by the roles.** The ladder is 400/500 — `font-bold`/`font-semibold`
are lint-banned (`raw-heavy-weight`), as is raw `tracking-*` (`raw-tracking`) and raw
`blur-*`/`shadow-*` (`raw-effect`).

**Uppercase is mono-exclusive** (D20): any uppercase `text-*` utility must carry
`font-mono`/`text-mono-label` in the same literal and stay ≤14px (`uppercase-mono`). Uppercase
content-transforms (avatar initials) are exempt.

## Motion durations and eases

`duration-fast/base/slow` (a 3-step scale, NOT 4) + `ease-standard/emphasized/exit/spring`.

A `transition*` utility in a class string MUST pair a `duration-*` AND an `ease-*` token in the SAME
string literal (`transition-pairing`) — `transition-none`/`-discrete` are exempt. `--ease-spring` is
the audit's `linear()` curve, used by `motion-pop-in`.

Never `duration-[…]`/`ease-[…]`/`cubic-bezier()`/bare `linear()` in a class string (`raw-motion`) —
`animate-spin`/`animate-pulse` are the one documented loader exception.

**Colour changes are immediate, not animated**: `transition-colors` and any `transition-[…]` naming a
colour property are banned (`color-transition`), as is `transition-all` (`transition-all`) —
enumerate the causal opacity/transform/geometry properties instead.

## Shared constants

Not tokens, but shared and exported from `@vegastack/design` — import and reuse rather than
introducing a new magic number:

- `TIMINGS` — `feedbackRevertMs` 1500 · `autoSaveDebounceMs` 800 · `hoverOpenDelayMs` 700 ·
  `hoverCloseDelayMs` 300
- `FLOATING` — `sideOffsetAttached` 4 (attached-reading popups) · `sideOffsetDetached` 8
  (detached-reading) · `collisionPadding` 8

## Arbitrary-value contract

(`arbitrary-value` lint) A `*-[…]` is allowed ONLY when it is:

1. a `var(--token)` or a Base UI runtime positioner var (`--available-height`, `--anchor-width`,
   `--transform-origin`),
2. a `calc()` that itself contains a `var(--…)`,
3. a layout primitive (`fr`/`%`/`auto`/`min-content`/`max-content`/`0`), or
4. a CSS-wide keyword.

A hardcoded literal fails: `h-[13px]`, `calc(100dvh-2rem)`. A fixed offset inside `calc()` must
itself be a token.

## Inline style contract

(`inline-style` lint) `style={}` is allowed ONLY when it assigns EXCLUSIVELY CSS custom properties
(every key is `--*`, consumed by an arbitrary-value class), or is the ONE documented exception
(color-picker's dynamic swatch fill).

Any direct visual property (`width`, `gridTemplateColumns`, `minHeight`, …) fails, dynamic or
literal. Any hex/px/rem literal inside a style expression fails regardless.
