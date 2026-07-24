# design-lint rule reference

A 1:1 mirror of `tooling/design-lint.mjs`. Every rule below is `id`-tagged in that script's `RULES`
array or a dedicated pass — cite the `id` when reporting a finding. **If this list and the script
disagree, the script is ground truth and this file is stale.** Re-sync it; never trust memory.

## Contents

- [Component source rules](#component-source-rules) — everything `design-lint` runs against
  `packages/ui/registry`
- [Raw CSS rules](#raw-css-rules) — `--token-css` mode

`tooling/skill-lint.mjs` gates the rule ids here against the ids `design-lint.mjs` actually reports,
in both directions, so an added or removed rule fails the build until this file is re-synced.

## Component source rules

1. **`hex-color`** — any `#fff`/`#a1b2c3` literal. Use a semantic token.
2. **`raw-palette`** — a color-property utility against a raw Tailwind palette (`bg-neutral-900`,
   `text-red-500`, `border-slate-200`). Use a semantic token.
3. **`important`** — `!important` anywhere in component source. Zero exceptions here; the two
   sanctioned exceptions apply only to raw token/app CSS.
4. **`icon-source`** — an import from a non-sanctioned icon library (`@heroicons/`, `@tabler/icons`,
   `react-icons`, `phosphor-react`, `@phosphor-icons/`, `feather-icons`, `react-feather`,
   `@radix-ui/react-icons`, `@fortawesome/`, `ionicons`, `@ant-design/icons`, `@mui/icons-material`,
   `boxicons`, `@iconify/`). Sanctioned: `lucide-react`, the `lucide-animated` mirrors under
   `registry/ui/icons/**`, and `Icon`/`BrandIcon` from `@vegastack/design/icons`.
5. **`removed-radius-xl`** — any `rounded-xl`. The 5th radius step was removed (it silently fell back
   to Tailwind's unthemed default); containers cap at `rounded-lg`, the marketing sharp gesture is
   `rounded-(--radius-sharp)`.
6. **`raw-control-size`** — raw `h-7`/`h-8`/`h-10` or their `size-`/`min-w-` mirrors. The 28/32/40
   control scale is tokenized. `h-6`/`size-6` is deliberately NOT banned — it is shared by non-control
   scales (badge, switch track, select scroll strips); the `xs` tier uses `--size-xs`.
7. **`raw-icon-size`** — a raw size (`3`, `3.5`, `4`, `5`, `6`) inside an `svg` descendant selector.
   Route through `]:size-(--icon-compact|inline|default|action|feature)`. `size-1` and fractional
   sizes are dot-glyph geometry, not icon scale, and stay allowed.
8. **`direct-lucide-size`** — a `size`/`width`/`height` prop passed directly to a lucide component.
   That bypasses the `--icon-*` roles.
9. **`raw-z-index`** — any `z-N` literal. Two bands only: `z-(--z-raised)` (10, local) and
   `z-(--z-overlay)` (50, portaled). Sonner is the one documented library-level exception — asserted
   by test, not lint-suppressed.
10. **`raw-alpha`** — a color-alpha modifier as a raw `/NN` step (`bg-foreground/20`). Route through
    an `--alpha-*` role token.
11. **`raw-opacity`** — a raw `opacity-NN` other than `opacity-0`/`opacity-100` (exempt structural
    endpoints). Route through an `--opacity-*` role token.
12. **`alpha-opacity-role`** / **`opacity-alpha-role`** — alpha and opacity are different roles and
    are not interchangeable. Colour compositing takes `--alpha-*`; whole-element opacity takes
    `--opacity-*`. Crossing them fails.
13. **`off-scale-text`** — `text-4xl` and above. The scale ends at `text-3xl` (24px); use
    `text-display-sm/md/lg/xl` for anything larger.
14. **`raw-heavy-weight`** — `font-bold`/`font-semibold`. The weight ladder is 400/500; use a named
    typography role.
15. **`raw-tracking`** — raw `tracking-*`. Letter-spacing is owned by the typography roles.
16. **`raw-effect`** — raw `blur-*`/`shadow-*`. Use a named semantic effect or elevation role.
17. **`faint-text-role`** — `text-muted-foreground-faint` is sub-AA and restricted to
    placeholder/disabled copy.
18. **`uppercase-mono`** (D20, brand voice) — `uppercase` co-located with a type-setting `text-*`
    utility must ALSO carry `font-mono`/`text-mono-label` in the same literal, and must not pair with
    sizes past `text-base`. Uppercase content-transforms with no type utility on the element (avatar
    initials) are deliberately exempt — casing user content is not setting brand voice.
19. **`inline-svg-icon`** — a raw `<svg …>` JSX element used as an icon. Allowlisted:
    `progress-indicator.tsx` (a non-icon graphic primitive — a determinate progress ring) and
    `registry/ui/icons/**` (the vendored lucide-animated mirrors, which self-assert no hex/raw-palette
    at generation time).
20. **`render-contract`** — `Omit<…, 'render'>` in a registry component's props type, stripping Base
    UI's polymorphic `render` prop. The ONLY allowlisted exemption is `split-button.tsx` (a genuine
    multi-root composite). "Purely presentational, no single root"
    (Card/PageHeader/Empty/SettingsRow) is a valid reason to have NO `render` prop at all, which is
    different from stripping one via `Omit` — do not accept the former as justification for the
    latter.
21. **`arbitrary-value`** — a `*-[…]` that is NOT one of the four sanctioned forms: (1) `var(--token)`
    or a Base UI runtime var (`--available-height`, `--anchor-width`, `--transform-origin`), (2) a
    `calc()` containing `var(--…)`, (3) a layout primitive (`fr`/`%`/`min-content`/`max-content`/
    `auto`/`0`), (4) a CSS-wide keyword. `h-[13px]`, `bg-[#fff]`, `calc(100px-2rem)` all fail; a fixed
    offset inside `calc()` must itself be a token — `calc(100dvh-2rem)` still fails despite the
    viewport unit.
22. **`transition-pairing`** — a string literal containing a `transition*` utility without BOTH a
    `duration-*` and an `ease-*` token in the SAME literal (`transition-none`/`-discrete` exempt).
    Catches the silent-inherit-default-curve bug class.
23. **`color-transition`** / **`transition-all`** — `transition-colors`, any `transition-[…]` naming a
    colour property, and `transition-all` are banned. Colour changes are immediate; enumerate the
    causal opacity/transform/geometry properties instead.
24. **`raw-motion`** — `animate-[…]`, `cubic-bezier(…)`, a bare `linear(…)`, `duration-[…]`, or
    `ease-[…]` inside a class string. Route through the motion tokens or a sanctioned `motion-*`
    utility. `animate-spin`/`animate-pulse` are the documented loader exception.
25. **`flex-truncate-conflict`** — `flex`/`inline-flex` co-located with `truncate`/`line-clamp-*` in
    one class literal on the same element. `.flex` always wins the display conflict (verified in the
    compiled cascade), silently defeating the ellipsis. Correct pattern: `flex min-w-0` on the
    container, `truncate` on an inner span.
26. **`outline-none`** (file-scoped) — a file that strips the native focus outline anywhere MUST
    provide some focus affordance ELSEWHERE in the file: a `focus-visible:`/`focus-within:` ring, the
    sanctioned text-entry `focus:border-…` tint, or Base UI's
    `data-[highlighted]`/`data-[selected]`/`data-[focused]` roving-tabindex styling. File-scoped on
    purpose — flag it when the ENTIRE file has zero such affordance.
    `alert-dialog.tsx`/`dialog.tsx`/`sheet.tsx` carry a documented exemption for their non-focusable
    fixed viewport containers only. A new blanket exemption needs its own one-line rationale.
27. **`inline-style`** (§7.1, multi-line-aware) — a `style={…}` attribute whose object literal sets any
    key that is not a `--*` custom property, unless it is the one documented exception (a dynamic
    `backgroundColor`/`background` on `color-picker.tsx`'s swatch fill — no Tailwind utility can
    express a runtime user-supplied color). Any hex/px/rem literal inside a style expression fails
    regardless. `registry/ui/icons/**`'s `style={{ transformOrigin, transformBox }}` (vendored Motion
    setup) is exempt.
28. **`icon-button-name`** (AST, TypeScript-parsed — catches multi-line JSX) — a
    `<Button size="icon*">` with no `aria-label`/`aria-labelledby` on the same element AND no spread
    that could supply one. Suggest `aria-label`, or switching to `IconButton` (type-level enforced).
29. **`raw-interactive-html`** (AST) — canonical registry components may not render native
    `<button>`/`<input>`/`<select>`/`<textarea>` unless the file has an exact per-tag count and a
    concrete adapter/integration rationale in `RAW_INTERACTIVE_EXEMPTIONS`. Counts fail closed in
    both directions: adding or removing a reviewed native control requires re-audit. `Textarea`'s
    owned native adapter and Markdown's non-checkbox input passthrough are examples of narrow valid
    exemptions.
30. **`forward-ref`** (AST) — calls through React's namespace/default import or a named `forwardRef`
    import (including aliases) are banned. React 19 components accept `ref` as a normal prop. This
    applies to generated animated icons too — normalize at the generator, never by hand-editing a
    generated file.
31. **`standard-control-cursor`** (AST) — do not force `cursor-default` onto native standard controls
    or restate `cursor-pointer` on a native navigation link. `cursor-default` on a text-entry control
    destroys its I-beam affordance.
32. **`presentational-client-boundary`** (AST-assisted, file-scoped) — a canonical component with
    `'use client'` must contain a concrete client requirement: a Base UI/approved engine dependency, a
    React hook/context, an event binding, or a browser API. Pure presentational wrappers stay
    server-safe.

## Raw CSS rules

`--token-css` mode runs ONLY the `!important` check — the Tailwind-utility rules would false-positive
on legitimate `oklch()`/custom-property declarations.

`!important` in plain CSS is banned with **exactly two** sanctioned exceptions. Flag anything outside
these:

- **(A)** Inside a `@media (prefers-reduced-motion: reduce)` block — the WCAG reduced-motion reset in
  `packages/design-tokens/src/base.css`.
- **(B)** The scroll-lock scrollbar-compensation zero-out — ONLY `margin-right: 0(px) !important` and
  `--removed-body-scroll-bar-size: 0(px) !important`, ONLY inside the exact
  `html > body[data-scroll-locked]` selector block in `apps/docs/app/global.css`. It cancels
  `react-remove-scroll-bar`'s runtime-injected `!important`, which nothing else can beat.
