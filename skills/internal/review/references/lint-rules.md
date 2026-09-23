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
this reset keeps against upstream everywhere. A second, `loader-mark`, arrived later for the same
reason on a smaller decision (ICO-8).

**When you find something the linter no longer covers, that is usually the decision, not a gap.**
Check `decisions.md` before reporting it. What survived is the set that is still true of a system
built on shadcn: no off-system colour, one icon source, no inline SVG icons, React-19 ref semantics,
the Base UI `render` contract, the client boundary, the native-control budget, and the hygiene rules
that catch bugs nobody can see in review.

## Component source rules

1. **`hex-color`** — any `#fff`/`#a1b2c3` literal. Use a semantic token. (COL-20 — kept.) One
   position is masked out, and only one: a hex inside an **attribute-selector value**
   (`[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50`) is a colour being
   TARGETED so a token can replace it, not one being authored — which is COL-20 being enforced
   rather than broken. Batch 6 of the shadcn reset added it for upstream's `chart.tsx`; a file
   allowlist would have switched the rule off for that whole file, so the mask is by position and
   every authored hex in every file is still rejected. Both halves are observed in
   `verify-design-lint-structural.mjs`.
2. **`raw-palette`** — a colour-property utility against a raw Tailwind palette (`bg-neutral-900`,
   `text-red-500`, `border-slate-200`). Use a semantic token. Note the shape: the rule requires a
   NUMBERED palette step, so upstream's `bg-black/10` modal scrim and `bg-white` pass, which is
   deliberate — OVL-3 is decided as **shadcn**.
3. **`important`** — `!important` anywhere in component source, **and Tailwind's `!` modifier**
   (`p-0!`, legacy `!p-0`, `hover:!mt-2`) in a class string, which compiles to the same thing
   (extended 2026-09-23; the regex had only ever read the literal text `!important`). The literal
   has zero exceptions; the two sanctioned raw-CSS exceptions apply only to token/app CSS (see
   below). The modifier has one table, `IMPORTANT_MODIFIER_EXEMPTIONS`, keyed by path tail from
   `/ui/` or `/blocks/` (so the canonical file and its docs copy-in share an entry) with an EXACT
   count per file, failing closed in both directions like the native-control budget: upstream's
   own verbatim uses (tooltip, command, sidebar, menubar, badge, button-group, pagination,
   attachment and five blocks) plus two of ours with the reason on their line (`data-table-parts`'
   `pe-2!`, `media-player-controls`' `*:min-h-0!`). Prose ending in `!` is not a token — a token
   must carry a `-`, `:` or `[`.
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
6. **`no-surface-ring`** (BRD-1, **ours since MK 2026-09-23**) — a 1px ring width (`ring-1`,
   `ring-px`, `ring-[1px]`, and bare `ring`, which is 1px in Tailwind v4 — matched only in a class
   string, beside another utility, since it is also an English word and a token name) or a hairline ink (`ring-foreground`,
   `ring-border`, `ring-black`, `ring-white`, `ring-input`, `ring-sidebar-border`, with or without
   an alpha), each also as its `inset-ring` twin, under any variant —
   upstream's `ring-1 ring-foreground/10` surface outline and every other spelling of it. Cards and floating
   surfaces draw a real `border border-border`; the reset had taken upstream's ring while
   `foundations/elevation.mdx` still described a border, and consumers read the ring as an unwanted
   outline. Same job as `no-focus-ring-glow`: every pull of card, dialog, alert-dialog, popover,
   hover-card, select, the menus, combobox and navigation-menu brings the ring back verbatim.
   The floating sidebar's `ring-sidebar-border` is the same outline and became
   `border border-sidebar-border` (MK 23-09-2026). Avatar's `ring-2 ring-background` is the
   page-coloured gap between stacked avatars, not an outline, and passes; so does a bare focus-ring
   colour such as `ring-sidebar-ring`, which paints nothing without a width.

7. **`loader-mark`** (AST, ICO-8, **new 2026-09-22**) — a `lucide-react` import of `Loader2`,
   `Loader2Icon`, `LoaderCircle` or `LoaderCircleIcon` in canonical registry source. Those are FOUR
   NAMES for ONE glyph — lucide re-exports the first two straight off `LoaderCircle` — and ICO-8
   gives the system one indeterminate loading mark, lucide `Loader` (`LoaderIcon`). The rule reads
   the IMPORTED name, not the local binding, so `import { LoaderCircle as Spin }` is caught. Same
   role as `no-focus-ring-glow`: byte parity already holds `spinner` and `toast` to their
   ICO-8 hunks (`sonner` carried one too, until it was retired on 2026-09-22), but nothing stopped a NEW component of ours — which has no patch — from reaching
   for the mark upstream writes everywhere. Scoped to `registry/{ui,blocks}/` and excluding
   `registry/ui/icons/`: the 467 animated mirrors are a lucide CATALOGUE, and the docs'
   `spinnerCustomization` preview mounts `LoaderCircleIcon` on purpose to show what swapping the
   mark looks like. Where a loading affordance is what you mean, compose the `spinner` registry
   item rather than importing any mark directly.

8. **`raw-tracking`** (TYP-15, **new 2026-09-22**) — any `tracking-*` except `tracking-widest`.
   The `@theme inline` bridge carries per-size `--text-*--letter-spacing` for the HEADING tier
   (`text-lg` and up, running −0.012em at 18px to −0.06em at 72px) and deliberately holds the COPY
   tier (`text-xs`/`sm`/`base`) at zero, which is Geist's own copy/heading split. The failure mode
   this catches is quiet: Tailwind compiles the ramp as
   `letter-spacing: var(--tw-tracking, <ramp value>)`, so a local `tracking-*` SILENTLY WINS and one
   component stops obeying the global authority while everything still looks fine. `tracking-widest`
   is the one allowance — the keyboard-shortcut hint idiom (`⌘K`) in Command, Menubar, DropdownMenu
   and ContextMenu, a role the ramp does not cover. Allowing the CLASS rather than pinning those
   four paths is deliberate: a fifth menu surface gets the idiom for free and every other spelling
   still fails. The registry had exactly one copy-tier offender, `empty`'s `tracking-tight` at 14px,
   removed under TYP-15.
9. **`arbitrary-text-size`** (TYP-18, **new 2026-09-22**) — `text-[13px]`, `text-[0.8rem]` and any
   other arbitrary LENGTH font size. An arbitrary value bypasses the `--text-*` namespace entirely,
   so it can receive neither the ramp's line-height nor its letter-spacing and it sits on no tier
   anyone can name. Matches a length only, so `text-[var(--x)]` and arbitrary colours are not this
   rule's business (`hex-color` owns those). Note what the rule does NOT say: upstream's ladder
   genuinely scales type with control size (`xs` h-6 → 12px, `default` h-8 → 14px), and that ladder
   is KEPT — its `sm` half-step resolved DOWN to `text-xs` rather than being flattened up to 14px.
   Inventing a 13px step instead would re-open TYP-5's deleted type vocabulary.
10. **`uppercase-transform`** (TYP-7, **new 2026-09-22**) — the `uppercase` utility or a
    `textTransform: "uppercase"` inline style. `design.md` § Voice & content is sentence case for
    EVERYTHING, and TYP-7 resolves as **shadcn**, whose column reads simply "No uppercase" — the old
    `uppercase-mono` rule was deleted because upstream has none, not because the transform became
    free. Twelve `font-mono text-xs uppercase` eyebrows had survived across the docs shell anyway.
    The decisive argument is not taste: two of them rendered real CSS custom-property names through
    the transform, so `--text-lg` displayed as `--TEXT-LG`, a false identifier on a design-system
    docs site. A CSS transform silently rewrites whatever it is handed. **If a string is uppercase,
    write it uppercase in the string.** Removing these also removed the last justification for
    positive `tracking-*`, which existed only to make uppercase legible — see `raw-tracking`.
11. **`tabular-figures`** (TYP-10, **new 2026-09-22**) — a registry file that formats a number
    through `Intl.NumberFormat` or `.toFixed(` and carries no `tabular-nums` anywhere. TYP-10 has
    been **ours** since the reset ("tabular figures on code and data") and had NO gate for four
    days, which is how `number-field` shipped proportional digits: holding its stepper made the
    value visibly jitter as digit widths changed. The signal is deliberately narrow —
    `.toLocaleString(` is EXCLUDED because `calendar` calls it with `{ month: "short" }` to produce a
    month NAME, and a rule that fires on a string is a rule that gets switched off. Components that
    render digits in a fixed-width box (`pagination`'s `size="icon"` links) or render no figure text
    at all (`slider` renders thumbs, `kbd` renders key glyphs) are out of scope: there is no jitter
    to prevent. A per-column opt-in satisfies it — `data-grid` inherits `tabular-nums` from
    `columnCellClass` when a column declares `mono`, which is correct, since not every column holds
    figures.

12. **`inline-svg-icon`** — a raw `<svg …>` JSX element used as an icon. The allowlist is ONE file:
    `empty.tsx`, which draws upstream's decorative backdrop — a non-icon graphic primitive. Two
    entries left rather than being carried: the lucide-animated mirrors, now data modules over one
    factory with no JSX at all (`tooling/verify-animated-icons.mjs` asserts that directly), and
    `progress-indicator`, whose determinate ring went with the component when Batch 7a of the shadcn
    reset retired it. (ICO-3.)
13. **`render-contract`** — `Omit<…, 'render'>` in a registry component's props type, stripping Base
    UI's polymorphic `render` prop. There is NO allowlisted exemption: `split-button.tsx` was the one
    entry, and Batch 7a of the shadcn reset retired it, so the rule now fails closed for every file.
    "Purely presentational, no single root" (Card/PageHeader/Empty/SettingsRow)
    is a valid reason to have NO `render` prop at all, which is different from stripping one via
    `Omit` — do not accept the former as justification for the latter. (API-15.)
14. **`forward-ref`** (AST) — calls through React's namespace/default import or a named `forwardRef`
    import (including aliases) are banned. React 19 components accept `ref` as a normal prop. This
    applies to generated animated icons too — normalize at the generator, never by hand-editing a
    generated file. (API-15.)
15. **`raw-interactive-html`** (AST) — canonical registry components may not render native
    `<button>`/`<input>`/`<select>`/`<textarea>` unless the file has an exact per-tag count and a
    concrete adapter/integration rationale in `RAW_INTERACTIVE_EXEMPTIONS`. Counts fail closed in both
    directions: adding or removing a reviewed native control requires re-audit. (API-15.) Batch 6 of
    the shadcn reset is what "removing" looks like: upstream's `AttachmentTrigger` reaches its button
    through `useRender({ defaultTagName: "button" })` and writes no `<button>` JSX, so the
    `/attachment.tsx` entry dropped to zero and was DELETED rather than carried at `{}` — an
    exemption that can no longer be reached is one that should not exist.
16. **`presentational-client-boundary`** (AST-assisted, file-scoped) — a canonical component with
    `'use client'` must contain a concrete client requirement: a Base UI/approved engine dependency, a
    React hook/context, an event binding, or a browser API. Pure presentational wrappers stay
    server-safe. (API-16.)
17. **`icon-button-name`** (AST, TypeScript-parsed — catches multi-line JSX) — a
    `<Button size="icon*">` with no `aria-label`/`aria-labelledby` on the same element AND no spread
    that could supply one. Upstream's Button HAS `icon`, `icon-xs`, `icon-sm` and `icon-lg` sizes
    (API-4 is decided as **shadcn**, and Batch 7a retired `IconButton`), so this rule is now the ONE
    accessible-name check for every icon-only button in the system — there is no longer a wrapper
    enforcing it at the type level.
18. **`hand-rolled-ref-merge`** (AST) — the same identifier tested with `typeof x === "function"` AND
    assigned through `x.current = …` in one file. That pair is a ref fan-out and nothing else. Under
    React 19 ref-as-prop, "I need the node and must also forward it" is the normal case, so the
    pattern reappears constantly; `mergeRefs` from `@vegastack/design` is the one implementation
    (wrap the call in `useMemo` — it is not memoized).
19. **`flex-truncate-conflict`** — `flex`/`inline-flex` co-located with `truncate`/`line-clamp-*` in
    one class literal on the same element. `.flex` always wins the display conflict (verified in the
    compiled cascade), silently defeating the ellipsis. Correct pattern: `flex min-w-0` on the
    container, `truncate` on an inner span. (LAY-11.)
20. **`restated-motion-reduce`** — `motion-reduce:transition-none`, `motion-reduce:animate-none`,
    `motion-reduce:duration-0` or `motion-reduce:transition-duration-*`. base.css already collapses
    animation and transition duration to 0.01ms under `prefers-reduced-motion`. Scoped on purpose:
    `motion-reduce:transform-none` and other END-STATE suppressions are NOT restatements — they
    remove the displacement itself, which the global reset does not — and stay legal. (MOT-5.)
21. **`class-whitespace`** — a leading, trailing or doubled space inside a class string. Invisible in
    review, survives every merge, and defeats grep (`"a  b"` does not match `/a b/`, which is how
    audit sweeps undercounted). Applies to plain string literals only: a template's spans are joined
    with a synthetic space by the parser, and a multi-line literal is prose, not a class string.
22. **`descendant-override-density`** — more than 20 `[&…]:` overrides in one class literal. Past that
    the component has stopped styling itself and started styling its children's internals from the
    outside (`audio-player` held 76). Give the child a `data-slot` and let it own the rule.
23. **`class-glue`** — two adjacent class string literals concatenated with `+` and NO separating
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
