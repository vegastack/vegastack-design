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

| token                                                                            | role                                                            |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `bg-background` / `text-foreground`                                              | the page and its ink                                            |
| `bg-card` / `text-card-foreground`                                               | a card                                                          |
| `bg-popover` / `text-popover-foreground`                                         | every floating surface                                          |
| `bg-primary` / `text-primary-foreground`                                         | the solid action fill and every checked control                 |
| `bg-primary-hover` / `bg-primary-pressed` / `text-primary-text`                  | its hover, its press, and the accent as ink (COL-27)            |
| `text-link` / `hover:text-link-hover`                                            | a link inside text, always underlined                           |
| `bg-unread`                                                                      | an unread dot or bar                                            |
| `bg-nav-selected` / `text-nav-selected-foreground` / `-icon`                     | the selected row of navigation only                             |
| `text-check` / `bg-mark` / `bg-ink text-ink-foreground`                          | done checks, highlights, neutral solids: no accent changes them |
| `bg-secondary` / `text-secondary-foreground`                                     | the soft neutral fill                                           |
| `bg-muted` / `text-muted-foreground`                                             | wells, tracks, skeletons; and the secondary ink                 |
| `bg-accent` / `text-accent-foreground`                                           | the hover wash                                                  |
| `border-border` / `border-input`                                                 | the hairline, and the field hairline                            |
| `outline-ring`                                                                   | the focus ring — near-black light, near-white dark (**FOC-2**)  |
| `bg-sidebar` and its `-foreground`/`-accent`/`-border`/`-ring`/`-primary` family | the sidebar rail                                                |

**Inside an arbitrary value, read the runtime token, never the bridge.** Write
`var(--foreground)`, `var(--border)`, `var(--chart-single)` — not `var(--color-foreground)`. The
`--color-*` names come from the `@theme inline` bridge, which is declared once on `:root` and
resolves there, so inside a `.dark` subtree or a scoped portal (OVL-13) it paints the root theme's
value. `design-lint` `no-color-bridge` rejects it in registry source; a `--color-*` the file assigns
itself (a chart series key, chart.tsx's `--color-bg`) is a local variable and passes.

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
it, except the primary fill, whose hover and press are `bg-primary-hover` and `bg-primary-pressed`
(COL-27: an accent would fade under an alpha; `design-lint` `accent-role`). A pressed
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
- **`--glass-ink`, `--glass-ink-muted`, `--glass-edge`, `--glass-dim`** — desktop glass (operator
  2026-11-14), read through the `surface-glass` utility for desktop windows on native OS glass, never
  in a component or a web page. Both inks are gated at AA text on `popover` and on a modelled
  worst-case native backdrop; `--glass-dim` is reserved.
- **`--scrim`, `--scrim-foreground`** — theme-invariant photo scrim (black / white in both themes)
  for icon controls over a tile's image. Always read through an opacity modifier — `bg-scrim/40`,
  `hover:bg-scrim/60` — via the `tile-overlay` recipe. Not AA-gated (icons over arbitrary imagery);
  text over media uses `media-scrim`. Modal backdrops keep upstream's `bg-black/10`.

## Radius

**A corner is a role, and the shape says what the thing is** (BRD-12, round 2 2026-11-19,
`design.md` § Corners). Decide in order: a token or state (chip, badge, tag, count, reaction, filter
chip and the filter row's + Filter / Clear, quick-filter toggle, switch) → pill (`rounded-chip`);
the app frame or anything floating (the top bar, floating bars, controls over media) → `rounded-capsule
capsule-scope`, its buttons circles; an action or input in the page → `rounded-control` (10px), or
`rounded-segment` (8px) at the 24px compact tier (Button `xs`, `icon-xs`, inline cell editors); a row
in a list without dividers → `rounded-item` (10px, inset); a row in a table → `row-fill` (a square
band, edge to edge, hairline to hairline); inside anything → concentric, erring round.

The roles: `rounded-control` (10px), `rounded-icon` (10px rounded square: icon-only buttons),
`rounded-segment` (8px: a control nested in a control, 2px inset — tab triggers, Menubar items,
buttons inside a field — and every 24px control), `rounded-capsule` (pill: the frame and what
floats; a floating panel that wraps or holds a form is `rounded-card`), `rounded-chip` (pill),
`rounded-inline` (6px: tokens in running text), `rounded-mark` (4px: highlights, the checkbox, chart
swatches), `rounded-item` (10px: list rows, tooltips), `rounded-block` (12px: blocks in content,
nested cards), `rounded-card` (16px), `rounded-bubble` (20px), `rounded-overlay` (24px),
`rounded-tile` (25%: square media). Side forms (`rounded-t-overlay`, `rounded-s-item`) are fine;
`none`, `full` (dots, people) and `[inherit]` are structural.

**One shape per row; shape comes from the component.** A button in a row of chips is a pill
(`Button shape="pill"`, or `FILTER_ROW_ACTION` on the filter row); a field in the frame or a row of
pills is `Input`/`InputGroup shape="pill"`; quick-filter toggles are `ToggleGroup shape="pill"`; a
subtree that is all capsules carries `capsule-scope`. A component never lets app code reshape it with
`rounded-*`, and height never picks the shape except the 24px tier. The filter row is one tier:
28px pills, 12px medium text. A bordered menu is `rounded-card border p-1.25`
around `rounded-item` rows — a part in a corner is the container's corner minus the inset from its
outer edge (border plus padding): 16 − (1 + 5) = 10. A part whose result reaches half its height is
round (the dialog's close: 24 − 9 = 15 on 28px). `foundations/radius.mdx` § The arithmetic.

`--radius` (0.625rem) and the ramp derived from it (`sm`…`4xl`) exist only so upstream's math holds;
`design-lint` `no-radius-ramp` rejects a ramp step, bare `rounded`, an arbitrary length, a radius
variable and the retired `rounded-chat-card` in registry source.

## Type

**Stock SIZES; the metrics above the copy tier are ours.** `text-sm` is 14px here, in a preview, in
the docs shell and in a pasted shadcn snippet. `text-base` is 16px. Sizes never move, so TYP-1 stays
shadcn.

What does move is line-height and letter-spacing, declared once in the `@theme inline` bridge and
never in a component (TYP-15, MK 2026-09-22). Geist splits a COPY tier from a HEADING tier and so
does this:

- **`text-xs` / `text-sm` / `text-base` — stock size and leading, zero letter-spacing.** Geist's
  `copy-*` scale specifies exactly that. The bridge declares only the zero, so copy-size text inside
  heading type does not inherit the heading's tracking — never reach for `tracking-*` to undo it. A
  slash form (`text-xs/6`) sets no tracking; inside heading type write `text-xs leading-6`.
- **`text-lg` and above — optical metrics.** Tracking runs −0.012em at 18px to −0.06em at 72px, and
  leading is a designed ramp rather than Tailwind's stock ratios.

**Never write your own `tracking-*`.** Tailwind compiles the ramp as
`letter-spacing: var(--tw-tracking, <ramp value>)`, so a local utility silently wins and your
component quietly stops obeying the global ramp; `design-lint`'s `raw-tracking` rejects it.
`tracking-widest` is the single allowance, for the keyboard-shortcut hint idiom. **And never write
an arbitrary size** (`text-[13px]`) — it bypasses the `--text-*` namespace and receives neither half
of the ramp (`arbitrary-text-size`). Upstream's control ladder — `xs` (h-6) at 12px, `default` (h-8)
at 14px — is real and is kept; its `sm` half-step resolves down onto the ramp.

`body` carries a declared 14px default and `-webkit-font-smoothing: antialiased` (TYP-16/TYP-17), on
`body` and never on `html`: `rem` resolves against the root, so an `html` size would rescale every
token and override the reader's browser preference.

There are no role utilities but one: `text-page-title` (26/32, TYP-21), the size of a page's title
(`PageHeader`'s) and of nothing else. For the rest, write the two or three stock utilities each one stood for:

| was               | write                                                                      |
| ----------------- | -------------------------------------------------------------------------- |
| `text-h1`         | `font-heading text-page-title font-semibold` (a page title — `PageHeader`) |
| `text-h2`         | `font-heading text-base font-medium` (a section heading)                   |
| `text-h3`         | `text-lg font-semibold`                                                    |
| `text-h4`         | `text-base font-medium`                                                    |
| `text-label`      | `text-sm font-medium`                                                      |
| `text-label-sm`   | `text-xs font-medium`                                                      |
| `text-code`       | `font-mono text-sm`                                                        |
| `text-code-sm`    | `font-mono text-xs`                                                        |
| `text-mono-label` | `text-xs font-medium` (a label is sans)                                    |
| `text-display-*`  | `text-4xl` … `text-7xl`                                                    |

`font-semibold`, `font-bold` and `text-4xl`+ are ordinary utilities: TYP-4 and TYP-8 are decided as
shadcn. `tracking-*` is NOT — TYP-6's "tracking is owned by roles" is gone, but TYP-15 puts tracking
on the ramp instead, so it is owned globally rather than per component. Fonts are still Geist
(TYP-10) through `font-sans`, `font-mono`, `font-serif` and `font-heading`, and TYP-10's other half
is enforced now too: a component that formats a number through `Intl.NumberFormat` or `.toFixed(`
must carry `tabular-nums` (`tabular-figures`).

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
| `primary-hover` / `primary-active`                            | `bg-primary-hover` / `bg-primary-pressed` (COL-27)     |
| `<family>-subtle` / `-subtle-hover` / `-border`               | `bg-<family>/10` · `/20` · `border-<family>`           |
| every `--alpha-*`                                             | the literal percentage (`bg-foreground/10`)            |
| every `--opacity-*`                                           | the literal step (`opacity-50`)                        |
| `--size-*` / `--icon-*` / `--panel-width-*`                   | `h-8` · `size-4` · `w-72`                              |
| `--z-raised` / `--z-overlay` / `--z-toast`                    | `z-10` · `z-50` · `z-60`                               |
| `--shadow-overlay`                                            | `shadow-sm` / `shadow-md` / `shadow-lg`, per component |
| `--radius-sharp` / `--radius-xs`                              | `rounded-mark` (BRD-12)                                |
| `--overlay`                                                   | `bg-black/10` (upstream's scrim)                       |
| the `--type-product-*` / `--type-doc-*` ladders               | Tailwind's own `--text-*`                              |
| `--font-family-pixel`, `--motion-blur`, `--effect-blur-glass` | deleted with the marketing layer and its effects       |
