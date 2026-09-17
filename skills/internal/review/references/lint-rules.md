# design-lint rule reference

A 1:1 mirror of `tooling/design-lint.mjs`. Every rule below is `id`-tagged in that script's `RULES`
array or a dedicated pass — cite the `id` when reporting a finding. **If this list and the script
disagree, the script is ground truth and this file is stale.** Re-sync it; never trust memory.

`tooling/skill-lint.mjs` gates the rule ids here against the ids `design-lint.mjs` actually reports,
in both directions, so an added or removed rule fails the build until this file is re-synced.

## The shadcn reset changed what this file can say

Batch 1 of `docs/plans/2026-09-18-shadcn-reset/` rebuilt the linter around one question: **would this
rule reject the upstream file this system is now built from?** Every rule whose decision row in
`decisions.md` resolves to **shadcn** was deleted, because upstream writes exactly what it banned —
`transition-all`, `transition-colors`, `duration-100`, `ease-in-out`, `rounded-xl`, `shadow-md`,
`bg-muted/50`, `opacity-50`, `z-50`, `h-[18.4px]`, `rounded-[4px]`, `text-4xl`, `font-semibold`,
`tracking-tight`, `cursor-default` on menu rows, and a `hover:` with no `active:` beside it. Seventeen
rules went; one arrived, `no-focus-ring-glow`, which is the machine half of the one visual decision
this reset keeps against upstream everywhere.

**When you find something the linter no longer covers, that is usually the decision, not a gap.**
Check `decisions.md` before reporting it. What survived is the set that is still true of a system
built on shadcn: no off-system colour, one icon source, no inline SVG icons, React-19 ref semantics,
the Base UI `render` contract, the client boundary, the native-control budget, and the hygiene rules
that catch bugs nobody can see in review.

## Component source rules

1. **`hex-color`** — any `#fff`/`#a1b2c3` literal. Use a semantic token. (COL-20 — kept.)
2. **`raw-palette`** — a colour-property utility against a raw Tailwind palette (`bg-neutral-900`,
   `text-red-500`, `border-slate-200`). Use a semantic token. Note the shape: the rule requires a
   NUMBERED palette step, so upstream's `bg-black/10` modal scrim and `bg-white` pass, which is
   deliberate — OVL-3 is decided as **shadcn**.
3. **`important`** — `!important` anywhere in component source. Zero exceptions here; the two
   sanctioned exceptions apply only to raw token/app CSS (see below).
4. **`icon-source`** — an import from a non-sanctioned icon library (`@heroicons/`, `@tabler/icons`,
   `react-icons`, `phosphor-react`, `@phosphor-icons/`, `feather-icons`, `react-feather`,
   `@radix-ui/react-icons`, `@fortawesome/`, `ionicons`, `@ant-design/icons`, `@mui/icons-material`,
   `boxicons`, `@iconify/`). Sanctioned: `lucide-react`, the `lucide-animated` mirrors under
   `registry/ui/icons/**`, and `Icon`/`BrandIcon` from `@vegastack/design/icons`. (ICO-1.)
5. **`no-focus-ring-glow`** (FOC-1 / FOC-6, **new in the reset**) — `ring-3`, `ring-[3px]`,
   `ring-ring/NN`, any `focus-visible:ring-*`, or a `shadow-[0_0_0_…]` box-shadow ring. shadcn writes
   `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` on button, input,
   checkbox, switch, badge, accordion, slider, scroll-area and the field cards; this system has
   exactly ONE focus affordance, the global 2px `:focus-visible` outline in
   `@vegastack/design-tokens/base.css`, and text entry shows a `focus:border-ring` tint instead.
   **This is the rule that makes the reset hold.** Every batch from 2 onward starts by copying an
   upstream file that carries the glow verbatim, so without a machine check the halo returns on the
   next pull and nothing says so. It is not scoped to focus contexts on purpose: FOC-6 bans a
   box-shadow ring _anywhere_, which is why `bubble`'s decorative `ring-3 ring-card` cutout became
   `outline-3 outline-card` (identical paint, no box-shadow) in Batch 1.
6. **`inline-svg-icon`** — a raw `<svg …>` JSX element used as an icon. Allowlisted: `empty.tsx` and
   `progress-indicator.tsx` (non-icon graphic primitives) and `registry/ui/icons/**` (the vendored
   lucide-animated mirrors, which are data modules with no JSX at all). (ICO-3.)
7. **`render-contract`** — `Omit<…, 'render'>` in a registry component's props type, stripping Base
   UI's polymorphic `render` prop. The ONLY allowlisted exemption is `split-button.tsx` (a genuine
   multi-root composite). "Purely presentational, no single root" (Card/PageHeader/Empty/SettingsRow)
   is a valid reason to have NO `render` prop at all, which is different from stripping one via
   `Omit` — do not accept the former as justification for the latter. (API-15.)
8. **`forward-ref`** (AST) — calls through React's namespace/default import or a named `forwardRef`
   import (including aliases) are banned. React 19 components accept `ref` as a normal prop. This
   applies to generated animated icons too — normalize at the generator, never by hand-editing a
   generated file. (API-15.)
9. **`raw-interactive-html`** (AST) — canonical registry components may not render native
   `<button>`/`<input>`/`<select>`/`<textarea>` unless the file has an exact per-tag count and a
   concrete adapter/integration rationale in `RAW_INTERACTIVE_EXEMPTIONS`. Counts fail closed in both
   directions: adding or removing a reviewed native control requires re-audit. (API-15.)
10. **`presentational-client-boundary`** (AST-assisted, file-scoped) — a canonical component with
    `'use client'` must contain a concrete client requirement: a Base UI/approved engine dependency, a
    React hook/context, an event binding, or a browser API. Pure presentational wrappers stay
    server-safe. (API-16.)
11. **`icon-button-name`** (AST, TypeScript-parsed — catches multi-line JSX) — a
    `<Button size="icon*">` with no `aria-label`/`aria-labelledby` on the same element AND no spread
    that could supply one. Upstream's Button HAS `icon`, `icon-xs`, `icon-sm` and `icon-lg` sizes
    (API-4 is decided as **shadcn** and `IconButton` is retired in Batch 7), so from Batch 2 this
    rule stops being a residual guard and becomes the live accessible-name check for every icon-only
    button in the system.
12. **`hand-rolled-ref-merge`** (AST) — the same identifier tested with `typeof x === "function"` AND
    assigned through `x.current = …` in one file. That pair is a ref fan-out and nothing else. Under
    React 19 ref-as-prop, "I need the node and must also forward it" is the normal case, so the
    pattern reappears constantly; `mergeRefs` from `@vegastack/design` is the one implementation
    (wrap the call in `useMemo` — it is not memoized).
13. **`flex-truncate-conflict`** — `flex`/`inline-flex` co-located with `truncate`/`line-clamp-*` in
    one class literal on the same element. `.flex` always wins the display conflict (verified in the
    compiled cascade), silently defeating the ellipsis. Correct pattern: `flex min-w-0` on the
    container, `truncate` on an inner span. (LAY-11.)
14. **`restated-motion-reduce`** — `motion-reduce:transition-none`, `motion-reduce:animate-none`,
    `motion-reduce:duration-0` or `motion-reduce:transition-duration-*`. base.css already collapses
    animation and transition duration to 0.01ms under `prefers-reduced-motion`. Scoped on purpose:
    `motion-reduce:transform-none` and other END-STATE suppressions are NOT restatements — they
    remove the displacement itself, which the global reset does not — and stay legal. (MOT-5.)
15. **`class-whitespace`** — a leading, trailing or doubled space inside a class string. Invisible in
    review, survives every merge, and defeats grep (`"a  b"` does not match `/a b/`, which is how
    audit sweeps undercounted). Applies to plain string literals only: a template's spans are joined
    with a synthetic space by the parser, and a multi-line literal is prose, not a class string.
16. **`descendant-override-density`** — more than 20 `[&…]:` overrides in one class literal. Past that
    the component has stopped styling itself and started styling its children's internals from the
    outside (`audio-player` held 76). Give the child a `data-slot` and let it own the rule.
17. **`class-glue`** — two adjacent class string literals concatenated with `+` and NO separating
    space, so JavaScript welds them into one word and the utility on BOTH sides of the seam is
    destroyed (`"…p-0.5" + "bg-muted …"` ships `p-0.5bg-muted`, which Tailwind never emits and the
    browser silently drops). **AST-only, and it has to be**: every other rule reads one literal at a
    time. Four instances shipped to consumers under a clean `design-lint` — the Switch measured
    `background-color: rgba(0, 0, 0, 0)` in both states (2026-09-09). The ONLY sanctioned fix is
    `[…].join(" ")`, the form `input.tsx` uses: padding the seam with a space is itself a
    `class-whitespace` violation. Not a violation: `"text-" + size` (a deliberate build, not two
    literals) and a prose message split across lines (no class context on either side).

### Deleted by the reset, and why (do not report these)

`removed-radius-xl` (BRD-6), `raw-control-size` (LAY-1), `raw-icon-size` and `direct-lucide-size`
(ICO-2), `raw-z-index` (OVL-2), `raw-alpha` / `raw-opacity` / `alpha-opacity-role` /
`opacity-alpha-role` (the alpha and opacity ladders are gone), `off-scale-text` (TYP-8),
`raw-heavy-weight` (TYP-4), `raw-tracking` (TYP-6), `raw-effect` (BRD-4), `faint-text-role` (FRM-2 —
the token is gone), `uppercase-mono` (TYP-7), `arbitrary-value` and `inline-style` (DOC-10),
`transition-pairing` / `raw-motion` (MOT-2), `color-transition` / `transition-all` (MOT-3),
`outline-none` (FOC-11), `standard-control-cursor` (INT-10), `restated-focus` (replaced by
`no-focus-ring-glow`), `viewport-magic` (LAY-7), `hover-without-pressed` (INT-4),
`fill-token-as-text` (COL-17), and `field-group-pairing` (its trigger, `fieldControlGroup`, was
deleted with the shared recipes — the contract it guarded is intact, and the geometry lane measures
the forced-colours outline on a real focused addon field).

### Adjacent gates, not design-lint rules

- **`tooling/verify-token-references.mjs`** — every `--token` a component NAMES must exist. An
  undefined custom property is not an error anywhere: Tailwind emits the `var()`, the browser drops
  the declaration, and the element paints its inherited value. design-lint checks the token
  vocabulary; only this checks existence. Contract = the built token theme plus Tailwind's own, plus
  file-locals, a closed list of Base UI runtime variables, and the chart series keys (scoped by FILE
  — a bare `/^--color-/` exemption would swallow every colour-token typo). Its roots are the
  registry, the two docs component trees, and `packages/design/src`.
- **`tooling/contrast-check.mjs`** — the fail-closed WCAG gate over the built token theme (A11Y-1),
  with its own `--self-test`. It gates the TOKEN CONTRACT, not every composition: upstream's soft
  status pattern (`bg-destructive/10 text-destructive`) composites below AA in light with shadcn's
  own red, and ships that way because COL-13 and COL-17 are both decided as **shadcn**.
- **`tooling/verify-test-css-layers.mjs`** — every compiled-CSS test lane must import the layer set
  `packages/design/preset.css` ships. A lane missing `utilities.css` measures fixtures stripped of
  every custom `@utility`, silently.

## Raw CSS rules

`--token-css` mode runs ONLY the `!important` check — the Tailwind-utility rules would false-positive
on legitimate `oklch()`/custom-property declarations.

`!important` in plain CSS is banned with **exactly two** sanctioned exceptions. Flag anything outside
these:

- **(A)** Inside a `@media (prefers-reduced-motion: reduce)` block — the WCAG reduced-motion reset in
  `packages/design-tokens/src/base.css` (MOT-5).
- **(B)** The scroll-lock scrollbar-compensation zero-out — ONLY `margin-right: 0(px) !important` and
  `--removed-body-scroll-bar-size: 0(px) !important`, ONLY inside the exact
  `html > body[data-scroll-locked]` selector block in `apps/docs/app/global.css`. It cancels
  `react-remove-scroll-bar`'s runtime-injected `!important`, which nothing else can beat.
