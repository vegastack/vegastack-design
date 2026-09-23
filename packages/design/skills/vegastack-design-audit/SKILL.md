---
name: vegastack-design-audit
description: Read-only audit of an application that consumes the VegaStack design system — finds hardcoded colours and sizes, off-system utility classes, raw HTML where a component exists, accessibility gaps, provider/setup mistakes, and component copies that have drifted from the registry. Reports file:line findings with severity; never edits. Use when asked to audit a project for design-system alignment, check token compliance, or find stale VegaStack components.
---

# Consumer design audit (read-only)

**Reports findings; never edits.** Output is a grouped `file:line · rule · fix · severity` list.

This audits an application that consumes VegaStack. Scope it to your own UI source — **exclude
`components/ui/`**, which holds copied-in VegaStack components you do not own. Drift there is a
separate check (§5), not a styling finding.

## 1. Drift and setup first

These are mechanical and catch the highest-value problems:

```bash
npx --package=@vegastack/design vegastack-design check-updates
npx --package=@vegastack/design vegastack-design doctor
```

`doctor` checks setup and also scans the app's own source (skipping `node_modules`, build output
and the `components.json` `ui` directory) for vocabulary the shadcn reset retired — `text-h1`,
`text-label`, `bg-destructive-subtle`, `--z-toast`, an `icon-button` import — and exits non-zero
with `file:line` and the replacement for each. Its findings are §3's retired-vocabulary **errors**;
cite them rather than re-deriving them.

`⬆ update` means the registry has a newer version. `≈ drift` means the installed file differs from
the registry item — either an upstream change or a local edit. Both are findings. The rule for
edits is the one the Components guide states: **don't edit a copied-in component; if you must, it
becomes yours** — `check-updates` reports it as drifted from then on and every update is a `--diff`
re-applied by hand (§5).

Then verify setup, since these failures look like component bugs:

- Is `@vegastack/design/theme.css` (or `preset.css`) imported before your own CSS?
- Does the app root have `isolation: isolate` — either via `base.css` or `className="isolate"`?
  Without it, portaled popups render under page chrome.
- Is `<VegaStackProvider>` mounted once at the app root, with `suppressHydrationWarning` on `<html>`?
- Are there two providers, or a provider mounted below a route boundary? Both cause theme and toast
  bugs that present as random.

## 2. Hardcoded visual values

Every visual value must resolve through a semantic token.

**The searches below produce candidates, not findings.** Open every hit before reporting it. A `#`
match inside a comment, a URL fragment, a CSS id selector, or a string that documents some library's
default is not a hardcoded colour. A `[…]` arbitrary value is legitimate when it holds a
`var(--token)`, a `calc()` containing one, a layout primitive (`fr`, `%`, `auto`, `min-content`), or
a CSS keyword. Reporting a comment as an error costs the owner more trust than the finding is worth.

```bash
rg -n '#[0-9a-fA-F]{3,8}\b' --glob '!components/ui/**' --glob '*.{ts,tsx,css}'
rg -n '\b(bg|text|border|fill|stroke|ring)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}' --glob '!components/ui/**'
rg -n '\[[0-9]+(px|rem|em)\]' --glob '!components/ui/**'
rg -n 'style=\{\{' --glob '!components/ui/**'
```

- **hardcoded colour** — a hex literal used as a style value. Use a semantic token. **error**
- **raw palette** — a Tailwind palette class. Use `bg-primary`, `text-muted-foreground`,
  `border-border`, or a status family. **error**
- **hardcoded dimension** — an arbitrary px/rem value where a stock utility says the same thing
  (`h-[32px]` for `h-8`, `rounded-[10px]` for `rounded-lg`). An arbitrary value that no utility
  expresses is not a finding; upstream writes several itself. **warning**
- **inline style** — allowed only when every key is a `--*` custom property. Any direct visual
  property is a finding. **error**

## 3. Off-system utilities

```bash
rg -n '#[0-9a-fA-F]{3,8}\b|\b(bg|text|border|ring|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b' --glob '!components/ui/**'
rg -n 'ring-3\b|ring-\[3px\]|ring-ring/[0-9]+|focus-visible:ring-|shadow-\[0_0_0_' --glob '!components/ui/**'
```

- a hex literal or a numbered Tailwind palette utility — use a semantic token. **error**
- **a focus-ring glow** — `ring-3`, `ring-[3px]`, `ring-ring/NN`, `focus-visible:ring-*` or a
  `0 0 0` box-shadow ring. The system has ONE focus affordance, the global `:focus-visible` outline;
  text entry tints its border instead. A glow usually means a component was pasted from upstream's
  docs without the patch. **error**
- a status FILL used as a text ink on that family's own tint — `bg-destructive/10 text-destructive`
  measures 3.98:1. The readable half is `text-destructive-text`. **error**
- `text-brand` used as a label — `brand` is a 3:1 marker; labels take `text-brand-text`. **error**
- a raw `<svg>` used as an icon — use lucide or `Icon`/`BrandIcon`. **error**
- `React.forwardRef` — React 19 takes `ref` as a normal prop. **error**

**Things that are NOT findings any more**, and reporting them is noise: `rounded-xl`, `shadow-md`,
`text-4xl`, `font-semibold`, `transition-all`, `transition-colors`, `duration-100`, `ease-in-out`,
`z-50`, `opacity-50`, a raw `/NN` alpha, `h-8`/`size-4`, `cursor-default` on a menu row, an
arbitrary `h-[18.4px]`, and a `hover:` with no `active:` beside it. Every one of those is upstream's
own vocabulary, which this system now adopts.

**`tracking-tight` left that list on 2026-09-22 and IS a finding again.** The `@theme` bridge now
declares the heading tier's letter-spacing per size, and Tailwind compiles it as
`letter-spacing: var(--tw-tracking, …)` — so a local `tracking-*` silently beats the ramp and that
element stops matching the system. Only `tracking-widest` (a keyboard-shortcut hint) is allowed.
Two more in the same family:

- an arbitrary font size (`text-[13px]`, `text-[0.8rem]`) — it bypasses the `--text-*` namespace and
  receives neither the ramp's line-height nor its letter-spacing. **error**
- the `uppercase` utility or a `textTransform: "uppercase"` — this system is sentence case
  everywhere, and the transform rewrites whatever it is handed (it once turned the token name
  `--text-lg` into `--TEXT-LG`). If a string is uppercase, write it uppercase. **error**

## 3b. Names and tokens the shadcn reset removed

A project upgrading across the reset carries these until someone changes them, and **there is no
compatibility layer** — an import resolves to nothing and a deleted token silently compiles to
nothing, which is the worse half. Both searches are mechanical:

```bash
rg -n 'IconButton|OTPInput|CheckboxGroup|FieldInline|Segmented|SplitButton|ProgressIndicator|OnboardingChecklist|FloatingSurface|MarketingSurface|ComparisonMatrix|FigureFrame|LogoRow|ParticleField|PricingSection|RuledBand|SectionHeader|Testimonial|StaggeredTextReveal' --glob '!components/ui/**'
rg -n 'surface-(1|2|3|raised)|--alpha-|--opacity-|--size-|--icon-|--panel-width-|--z-(raised|overlay|toast)|shadow-overlay|text-(h[1-4]|label|label-sm|code|mono-label|display-)|muted-foreground-faint|surfaceInteractive|fillInteractive|fieldControl|selectedChipVariants' --glob '!components/ui/**'
```

- **a retired component name** — each has a replacement, listed in the shadcn-reset migration guide;
  the marketing ten have none and their markup is the app's now. **error**
- **a deleted token or utility** — a `bg-surface-2` or a `text-h1` resolves to nothing and paints the
  inherited value, so the page looks subtly wrong rather than broken. **error**
- **a deleted `@vegastack/design` export** — `surfaceInteractive`, `fillInteractive`, `fieldControl`,
  `fieldControlGroup`, `selectedChipVariants`. Replace each with the literal it expanded to. **error**

## 4. Component substitution and accessibility

- **Raw HTML where a component exists** — a native `<button>`, `<input>`, `<select>`, `<textarea>`,
  or a hand-rolled dialog, dropdown, tooltip, or tab set. Use the VegaStack component; it carries the
  states, keyboard model, and ARIA. **warning**
- **A second icon library**, or a hand-written inline `<svg>` used as an icon. Only `lucide-react`
  and `Icon`/`BrandIcon` from `@vegastack/design/icons` are sanctioned. **error**
- **`outline-none` with no replacement focus affordance** anywhere in the file. **error**
- **Icon-only controls with no accessible name** — a button with no visible text needs `aria-label`
  or `aria-labelledby`. `<Button size="icon">` (and `icon-xs`/`icon-sm`/`icon-lg`) is the one
  icon-only control; the name is never optional. **error**
- **Missing states** — a surface that fetches data needs loading, empty, and error states, not just
  the success path. **warning**
- **Truncation** — `truncate`/`line-clamp-*` on the same element as `flex`/`inline-flex` silently
  does nothing, because `flex` wins the display conflict. Put `min-w-0` on the flex container and
  `truncate` on an inner span. **warning**
- **Touch targets** below 24×24 — expand with an invisible hit area
  (`relative` + `before:absolute before:-inset-N`), not a larger visual control. **warning**

## 5. Local edits to copied-in components

```bash
rg -n '@vegastack' components/ui/ -l
```

Don't edit a copied-in component; if you must, it becomes yours. Report every `≈ drift` as a
**warning** — the file no longer receives registry fixes and the next `--overwrite` replaces the
edit — and name the way back: move the customisation into a token override, a wrapper component,
or a `className` at the call site, then re-pull. A drifted file whose edit nobody meant to make
(no commit or comment owns it) is an **error**: it is lost work waiting to happen.

A missing `// @vegastack …` provenance header is **normal** and never a finding on its own: the
shadcn CLI strips leading comments during copy-in.

## 6. Output

Group by file. Each finding: `file:line` · rule · suggested fix · severity.

- **error** — a hardcoded visual value, an accessibility violation, retired vocabulary, or an
  unintended edit to a copied-in component.
- **warning** — raw HTML where a component exists, a missing state, an off-system utility with a
  working fallback, a deliberately edited (now owned) copied-in component.
- **info** — a component with an available update worth a deliberate `--diff` review.

Never auto-fix. Report, and let the owner decide.
