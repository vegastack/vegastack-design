# Token vocabulary

The token contract, rebuilt on shadcn `base-nova`'s `neutral` base by Batch 1 of the shadcn reset
(`docs/plans/2026-09-18-shadcn-reset/`). Names verified against
`packages/design-tokens/dist/theme.css`; that file is the ground truth if anything here looks stale,
and `tooling/verify-token-references.mjs` fails the build on any `--token` a component names that
does not exist in it.

**Read this first.** The vocabulary shrank by roughly two thirds. A surface ladder, an alpha ladder,
an opacity ladder, a size family, an icon family, a panel family, z bands and a whole type scale
were deleted — not renamed. Where a token used to carry a design decision, **upstream's own plain
Tailwind utility carries it now**, because the decision register resolved that row to shadcn. If you
are reaching for a token this file does not list, the answer is almost always "write the utility".

## Contents

- [Semantic colours](#semantic-colours)
- [Status families](#status-families)
- [Chart, tag and brand](#chart-tag-and-brand)
- [Radius](#radius)
- [Type](#type)
- [Size, spacing, z-index, shadow](#size-spacing-z-index-shadow)
- [Motion](#motion)
- [Shared constants](#shared-constants)
- [What was deleted, and what replaced it](#what-was-deleted-and-what-replaced-it)

## Semantic colours

shadcn's `neutral` base, verbatim except for the two rows the register marks **ours**.

| token                                                                            | role                                                           |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `bg-background` / `text-foreground`                                              | the page and its ink                                           |
| `bg-card` / `text-card-foreground`                                               | a card                                                         |
| `bg-popover` / `text-popover-foreground`                                         | every floating surface                                         |
| `bg-primary` / `text-primary-foreground`                                         | the solid action fill and every checked control                |
| `bg-secondary` / `text-secondary-foreground`                                     | the soft neutral fill                                          |
| `bg-muted` / `text-muted-foreground`                                             | wells, tracks, skeletons; and the secondary ink                |
| `bg-accent` / `text-accent-foreground`                                           | the hover wash                                                 |
| `border-border` / `border-input`                                                 | the hairline, and the field hairline                           |
| `outline-ring`                                                                   | the focus ring — near-black light, near-white dark (**FOC-2**) |
| `bg-sidebar` and its `-foreground`/`-accent`/`-border`/`-ring`/`-primary` family | the sidebar rail                                               |

`muted`, `accent` and `secondary` carry the SAME value in this base. They are all kept anyway,
because a consumer retuning one of them must not silently retune the other two — name the one whose
role you mean.

Two deviations from upstream, both recorded in the token source:

- **`--ring` is the ink, not a mid-grey** (FOC-2). shadcn ships `oklch(0.708 0 0)` light, which only
  reads as a focus cue because it is wrapped in a 3px glow. There is no glow here, so the ring has
  to carry its own contrast.
- **`--muted-foreground` is `0.539`, not `0.556`.** Upstream's value measures 4.34:1 on `muted`,
  below the AA floor A11Y-1 gates fail-closed. The headroom is deliberate: axe measures the 8-bit
  sRGB round-trip, which reads about 0.04 lower than the OKLCH computation.

### Hover and pressed

There is no ladder and no shared recipe. A component writes its own hover, the way upstream writes
it: `hover:bg-accent`, `hover:bg-muted`, `hover:bg-primary/80`, `dark:hover:bg-muted/50`. A pressed
rung is optional — INT-4 is decided as shadcn, and `design-lint`'s `hover-without-pressed` rule is
gone with it.

## Status families

Four families (COL-12, **ours**), each written in the shape shadcn gives `destructive`:

| token                                                      | role                                              |
| ---------------------------------------------------------- | ------------------------------------------------- |
| `bg-destructive` / `bg-success` / `bg-warning` / `bg-info` | the solid fill                                    |
| `text-<family>-foreground`                                 | the ink ON that fill                              |
| `text-<family>-text`                                       | the ink on the PAGE, and on the family's own tint |

A tinted status surface is `bg-<family>/10` at rest, `/20` on hover, `/30` pressed — upstream's own
vocabulary. **The ink on a tint is `-text`, never the fill**: the fill measures 3.98-4.35:1 on its
own tint, which the rendered axe lane rejects. `contrast-check.mjs` gates `-text` on background,
card, popover and on all three tints over each.

`destructive` is shadcn's value verbatim. The other three sit in the same chroma band and are
AA-gated rather than eyeballed.

## Chart, tag and brand

- **`--chart-1` … `--chart-8` plus `--chart-single`** (MK, 2026-09-18). shadcn's `neutral` base ships
  a GREYSCALE chart ramp, which cannot carry multi-series data, so our 8-hue palette is kept —
  retuned for the pure-white page and the 0.97 `muted` ground, both themes, every hue over the
  1.4.11 3:1 floor. `chart-single` is `foreground`: one series is drawn in ink.
- **`--tag-<hue>` / `-subtle` / `-text`**, ten hues. `-text` on `-subtle` and on the page at AA;
  `-<hue>` as a 3:1 non-text accent.
- **`--brand`** is a 3:1 MARKER (dot, sparkline endpoint, prompt glyph). Brand TEXT reads
  `--brand-text`, which is AA-gated. Never use `text-brand` for a label.
- **`--media-scrim`, `--media-scrim-strong`, `--media-foreground`** — theme-invariant media chrome,
  both scrims gated at the AA TEXT floor because labels are drawn on them.

## Radius

**One token.** `--radius` is `0.625rem`, and Tailwind's ramp is derived from it exactly as upstream
derives it: `sm` 0.6x, `md` 0.8x, `lg` 1x, `xl` 1.4x, `2xl` 1.8x, `3xl` 2.2x, `4xl` 2.6x.

`rounded-xl` is a normal utility again — a card and a dialog wear it. The 12px cap, the
`removed-radius-xl` lint and `--radius-sharp` are gone.

## Type

**Tailwind's stock scale, unremapped.** `text-sm` is 14px here, in a preview, in the docs shell and
in a pasted shadcn snippet. `text-base` is 16px.

There are no role utilities. Write the two or three stock utilities each one stood for:

| was               | write                    |
| ----------------- | ------------------------ |
| `text-h1`         | `text-3xl font-semibold` |
| `text-h2`         | `text-2xl font-semibold` |
| `text-h3`         | `text-xl font-semibold`  |
| `text-h4`         | `text-base font-medium`  |
| `text-label`      | `text-sm font-medium`    |
| `text-label-sm`   | `text-xs font-medium`    |
| `text-code`       | `font-mono text-sm`      |
| `text-code-sm`    | `font-mono text-xs`      |
| `text-mono-label` | `font-mono text-xs`      |
| `text-display-*`  | `text-4xl` … `text-7xl`  |

`font-semibold`, `font-bold`, `tracking-*` and `text-4xl`+ are ordinary utilities: TYP-4, TYP-6 and
TYP-8 are all decided as shadcn. Fonts are still Geist (TYP-10) through `font-sans`, `font-mono`,
`font-serif` and `font-heading`.

## Size, spacing, z-index, shadow

All plain Tailwind. A control is `h-6`/`h-7`/`h-8`/`h-9`, an icon is `size-3`/`size-3.5`/`size-4`, a
popover is `w-72`, a portal is `z-50`, a menu casts `shadow-md`. The `--size-*`, `--icon-*`,
`--panel-width-*`, `--z-*` and `--shadow-overlay` families are deleted; spacing was always
Tailwind's `--spacing`.

Three stacking bands survive as a convention rather than tokens: `z-10` local, `z-50` portaled,
`z-60` the toast stack alone. `test/stacking.browser.test.tsx` measures the toast rule.

## Motion

Kept, because our own utilities consume them (MOT-6/MOT-7): `--duration-fast|base|slow`
(150/200/300ms), `--duration-indeterminate`, and `--motion-ease-standard|emphasized|exit|spring`,
bridged as `duration-fast`, `ease-standard` and friends.

**Nothing pairs them any more.** MOT-2 and MOT-3 are decided as shadcn, so `transition-all`,
`transition-colors`, `duration-100` and `ease-in-out` are all legal, and the `transition-pairing`
and `color-transition` lints are gone. The keyed-presence utilities — `motion-pop-in`,
`motion-enter-up`, `motion-shake`, `motion-flash`, `motion-dock-in`, `motion-dock-out`,
`motion-indeterminate` — are ours and live in `packages/design-tokens/src/utilities.css`.

## Shared constants

`@vegastack/design` exports `cn`, `mergeRefs`, `prose`/`proseClassName`, `TIMINGS` and `FLOATING`.

`surfaceInteractive`, `surfaceInteractiveGroup`, `fillInteractive`, `FillTone`, `fieldControl`,
`fieldControlGroup` and `selectedChipVariants` were **deleted with no replacement and no alias**
(mandate non-negotiable 2). Each was a shared class string over the deleted ladders; the component
owns its own chrome now.

## What was deleted, and what replaced it

| deleted                                                       | write instead                                          |
| ------------------------------------------------------------- | ------------------------------------------------------ |
| `surface-1` / `surface-2` / `surface-3`                       | `muted` (rest/well) · `accent` (hover, pressed)        |
| `muted-foreground-faint`                                      | `muted-foreground` (FRM-2 = shadcn)                    |
| `primary-hover` / `primary-active`                            | `hover:bg-primary/80` · `active:bg-primary/70`         |
| `<family>-subtle` / `-subtle-hover` / `-border`               | `bg-<family>/10` · `/20` · `border-<family>`           |
| every `--alpha-*`                                             | the literal percentage (`bg-foreground/10`)            |
| every `--opacity-*`                                           | the literal step (`opacity-50`)                        |
| `--size-*` / `--icon-*` / `--panel-width-*`                   | `h-8` · `size-4` · `w-72`                              |
| `--z-raised` / `--z-overlay` / `--z-toast`                    | `z-10` · `z-50` · `z-60`                               |
| `--shadow-overlay`                                            | `shadow-sm` / `shadow-md` / `shadow-lg`, per component |
| `--radius-sharp` / `--radius-xs`                              | `rounded-[2px]` (marketing is deleted) · `rounded-sm`  |
| `--overlay`                                                   | `bg-black/10` (upstream's scrim)                       |
| the `--type-product-*` / `--type-doc-*` ladders               | Tailwind's own `--text-*`                              |
| `--font-family-pixel`, `--motion-blur`, `--effect-blur-glass` | deleted with the marketing layer and its effects       |
