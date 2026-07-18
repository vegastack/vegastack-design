---
name: vegastack-design-audit
description: Use to audit a codebase for VegaStack design-system alignment — mirrors every rule `tooling/design-lint.mjs` enforces, plus the review-only rules (VRT baseline discipline, registry integrity, docs completeness). Read-only — reports, never edits. Post-overhaul canon (2026-07).
metadata:
  author: vegastack
  version: "0.2.0"
---

# vegastack-design-audit — read-only audit

**Reports findings; never edits.** Produces a prioritized, file:line list of design-system violations.
This checklist is a deliberate mirror of `tooling/design-lint.mjs` — every enforced rule below has a
matching `id` in that script; if the script and this list ever disagree, the script is the ground truth
and this file is stale (re-sync it, don't trust memory). Run the real gate first, then use this list to
explain/triage findings and to catch the things the regex-based linter structurally can't (raw CSS
outside the two lint-covered CSS roots, review-only VRT/registry discipline, docs completeness).

## Run the gate

```bash
node tooling/design-lint.mjs packages/ui/registry                    # component source (Tailwind rules)
node tooling/design-lint.mjs --token-css packages/design-tokens/src         # token CSS (!important only)
node tooling/design-lint.mjs --token-css apps/docs/app                # docs app CSS (!important only)
```
`packages/ui/registry` also runs the AST icon-button-name pass (needs real TypeScript parsing, not a
regex). Both `--token-css` roots run ONLY the `!important` check (the Tailwind-utility rules would
false-positive on legitimate `oklch()`/custom-property CSS).

## Rules enforced on component source (`packages/ui/registry`, no `--token-css`)

Every rule below is `id`-tagged in `design-lint.mjs`'s `RULES` array or a dedicated pass; cite the `id`
when reporting a finding.

1. **`hex-color`** — any `#fff`/`#a1b2c3` literal. Use a semantic token.
2. **`raw-palette`** — a color-property utility against a raw Tailwind palette (`bg-neutral-900`,
   `text-red-500`, `border-slate-200`, …). Use a semantic token (`bg-primary`, `border-border`).
3. **`important`** — `!important` anywhere in component source. Zero exceptions in Tailwind component
   source (the two sanctioned `!important` exceptions below apply ONLY to raw token/app CSS).
4. **`icon-source`** — an import from a non-sanctioned icon library (`@heroicons/`, `@tabler/icons`,
   `react-icons`, `phosphor-react`, `@phosphor-icons/`, `feather-icons`, `react-feather`,
   `@radix-ui/react-icons`, `@fortawesome/`, `ionicons`, `@ant-design/icons`, `@mui/icons-material`,
   `boxicons`, `@iconify/`). Sanctioned: `lucide-react`, the `lucide-animated` mirrors under
   `registry/ui/icons/**`, `@vegastack/design/icons` `Icon`/`BrandIcon` (thesvg).
5. **`removed-radius-xl`** — any `rounded-xl`. The 5th radius step was removed (silently fell back to
   Tailwind's unthemed default before the ban existed); containers cap at `rounded-lg`, the marketing
   sharp gesture is `rounded-(--radius-sharp)`.
6. **`raw-control-size`** — raw `h-7`/`h-8`/`h-10` (or `size-`/`min-w-` mirrors). The 28/32/40 control
   scale is tokenized (`h-(--size-sm|md|lg)`). `h-6`/`size-6` (24px) is deliberately NOT banned — it's
   shared by non-control scales (badge, switch track, select scroll strips); the `xs` control tier uses
   `--size-xs` by convention, not a bare `size-6`.
7. **`raw-icon-size`** — a raw size (`3`, `3.5`, `4`, `5`, `6`) inside an `svg` descendant selector
   (`]:size-4`). Route through `]:size-(--icon-compact|inline|default|action|feature)`. `size-1` and
   fractional sizes are geometry (dot glyphs), not icon scale, and stay allowed.
8. **`raw-z-index`** — any `z-N` literal. Two bands only: `z-(--z-raised)` (10, local) and
   `z-(--z-overlay)` (50, portaled). Sonner is the one documented library-level exception (not a source
   finding — its z is asserted by test, not lint-suppressed).
9. **`raw-alpha`** — a color-alpha modifier as a raw `/NN` step on any color-property utility
   (`bg-foreground/20`). Route through an `--alpha-*` role token (`bg-foreground/(--alpha-ink-tint)`).
10. **`raw-opacity`** — a raw `opacity-NN` other than `opacity-0`/`opacity-100` (exempt structural
    endpoints). Route through an `--opacity-*` role token (`opacity-(--opacity-dim)`).
11. **`off-scale-text`** — `text-4xl` and above. The scale ends at `text-3xl` (24px); use
    `text-display-sm/md/lg/xl` for anything larger.
12. **`inline-svg-icon`** — a raw `<svg …>` JSX element used as an icon. Allowlisted: `progress-
    indicator.tsx` (a non-icon graphic primitive — a determinate progress ring) and
    `registry/ui/icons/**` (the vendored lucide-animated mirrors, which self-assert no hex/raw-palette
    at generation time).
13. **`render-contract`** — `Omit<…, 'render'>` in a registry component's props type, which strips Base
    UI's polymorphic `render` prop (§7.6). Every single-polymorphic-root component must keep it. The
    ONLY allowlisted exemption is `split-button.tsx` (a genuine multi-root composite). Cross-check any
    new exemption claim against `docs/ledger/component-matrix.md`'s §7.6 section before accepting it —
    "purely presentational, no single root" (Card/PageHeader/Empty/SettingsRow) is a valid reason to
    have NO `render` prop at all, but that's different from stripping one via `Omit`.
14. **`arbitrary-value`** — a `*-[…]` arbitrary value that is NOT one of the four sanctioned forms: (1)
    `var(--token)`/a Base UI runtime var (`--available-height`, `--anchor-width`, `--transform-origin`),
    (2) a `calc()` containing `var(--…)`, (3) a layout primitive (`fr`/`%`/`min-content`/`max-content`/
    `auto`/`0`), (4) a CSS-wide keyword. `h-[13px]`, `bg-[#fff]`, `calc(100px-2rem)` all fail; a fixed
    offset inside `calc()` must itself be a token, not a bare literal — `calc(100dvh-2rem)` still fails
    even though it has a viewport unit.
15. **`transition-pairing`** — a string literal containing a `transition*` utility without BOTH a
    `duration-*` and an `ease-*` token in the SAME literal (`transition-none`/`-discrete` exempt — no
    animation to pair). Catches the silent-inherit-default-curve bug class.
16. **`flex-truncate-conflict`** — `flex`/`inline-flex` co-located with `truncate`/`line-clamp-*` in one
    class literal on the same element. `.flex` always wins the display conflict (verified in the
    compiled cascade), silently defeating the ellipsis. Correct pattern: `flex min-w-0` on the
    container, `truncate` on an inner span.
17. **`raw-motion`** — `animate-[…]`, `cubic-bezier(…)`, a bare `linear(…)`, `duration-[…]`, or
    `ease-[…]` inside a class string. Route through the motion tokens (`duration-fast/base/slow`,
    `ease-standard/emphasized/exit/spring`) or a sanctioned `motion-*` utility (`motion-pop-in`,
    `motion-enter-up`, `motion-shake`). `animate-spin`/`animate-pulse` are the documented platform-
    default loader exception and stay allowed.
18. **`outline-none`** (file-scoped) — a file that strips the native focus outline anywhere
    (`outline-none`) MUST provide some focus affordance ELSEWHERE in the file: `focus-visible:`/
    `focus-within:` ring, the sanctioned text-entry `focus:border-…` tint pattern, or Base UI's
    `data-[highlighted]`/`data-[selected]`/`data-[focused]` roving-tabindex styling. File-scoped (not
    per-element) on purpose — flag it when the ENTIRE file has zero such affordance. `alert-dialog.tsx`
    /`dialog.tsx`/`sheet.tsx` carry a documented exemption for their non-focusable fixed viewport
    containers only (never keyboard-reachable); a new blanket exemption needs its own one-line
    rationale, don't accept one without it.
19. **`inline-style`** (§7.1, multi-line-aware) — a `style={…}` attribute whose object literal sets any
    key that ISN'T a `--*` CSS custom property, UNLESS it's the one documented exception (a dynamic
    `backgroundColor`/`background` on `color-picker.tsx`'s swatch fill — no Tailwind utility can express
    a runtime user-supplied color). Any hex/px/rem literal inside a style expression fails regardless.
    `registry/ui/icons/**`'s `style={{ transformOrigin, transformBox }}` (vendored Motion component
    setup) is exempt.
20. **`icon-button-name`** (AST rule, TypeScript-parsed — not a regex, catches multi-line JSX) — a
    `<Button size="icon*">` with no `aria-label`/`aria-labelledby` on the same element AND no spread
    (`{...props}`) that could supply one. Flag; suggest `aria-label` or switching to `IconButton`
    (type-level enforced).
21. **`uppercase-mono`** (D20 — brand voice discipline) — `uppercase` co-located with a type-setting
    `text-*` utility must ALSO carry `font-mono`/`text-mono-label` in the same literal, and must not
    pair with sizes past `text-base` (the voice layer is 10–14px labels; large mono is reserved for
    non-uppercase DATA NUMERALS). Uppercase content-transforms with no type utility on the element
    (avatar initials) are deliberately exempt — casing user content is not setting brand voice.

## Rules enforced on raw CSS (`--token-css` mode — `packages/design-tokens/src`, `apps/docs/app`)

Only the `!important` check runs here (Tailwind-utility rules would false-positive on legitimate
`oklch()`/custom-property declarations). `!important` in plain CSS is banned with **exactly two**
sanctioned, narrow exceptions — flag anything outside these two:
- **(A)** Inside a `@media (prefers-reduced-motion: reduce)` block — the WCAG reduced-motion
  accessibility reset (`packages/design-tokens/src/base.css`).
- **(B)** The scroll-lock scrollbar-compensation zero-out — ONLY `margin-right: 0(px) !important` and
  `--removed-body-scroll-bar-size: 0(px) !important`, ONLY inside the exact
  `html > body[data-scroll-locked]` selector block, in `apps/docs/app/global.css` (cancels
  `react-remove-scroll-bar`'s runtime-injected `!important`, which nothing else can beat).

## Non-lint rules (require judgment / cross-file reasoning)

21. **No raw interactive HTML** — flag bare `<button>`/`<input>`/`<select>` where a `@vegastack`
    component exists for it; prefer the component (gets tokens, a11y, and state styling for free).
22. **Deprecated usage** — flag `@deprecated` APIs and any copy-in below its registry item's current
    `meta.version`.
23. **Docs completeness** — flag components missing a Fumadocs page, an `AutoTypeTable`, or JSDoc on a
    public prop (breaks the API Reference table). Cross-check section order against
    `skills/add-component/SKILL.md` §6: Installation → Usage → Examples → API Reference →
    Accessibility → Do/Don't.
24. **Naming-canon drift** — flag a new synonym prop for an existing semantic axis (e.g. a `color` or
    `status` prop where `intent` is the established name — see `skills/add-component/SKILL.md` §3), a
    dotted sub-component export (`Foo.Bar` instead of a flat `FooBar`), or a lingering
    `React.forwardRef` (deprecated in React 19 — the system is 100% ref-as-prop; see
    `docs/ledger/ref-forwarding-spec.md`).

## Registry integrity drift

Every copied-in component carries a provenance header on line 1:
`// @vegastack <name>@<version> sha256-<integrity>`. Read it to identify which item+version a file was
copied from, then re-hash the copied-in component against the matching registry item
(`tooling/registry-hash.mjs`'s `itemHash` — strips the header before hashing, so the embedded sha is
self-consistent with `meta.integrity`) and the signed manifest. Flag:
- a header whose version is below the current registry `meta.version` (**stale** — an update is
  available, not consumed),
- a header sha ≠ the recomputed hash (**locally modified** — someone hand-edited the copy-in, which is
  itself a violation of the single-source-of-truth workflow),
- a missing header (**untracked copy** — never went through `shadcn add`/`registry:build`).
Also cross-check `registryDependencies` against actual `@/components/ui/*` imports (what
`tooling/verify-registry-deps.mjs` does at build time) — a phantom dep (declared, unused) or a missing
one (imported, undeclared — breaks a downstream `shadcn add`) is a finding even if the build gate would
eventually catch it.
Surface `shadcn add <comp> --diff` (into a scratch dir, read-only) so a maintainer can deliberately
cherry-pick upstream improvements — this system is Model A (own it), no auto-tracking.

## VRT (visual regression) review discipline

These are review-only rules for whoever is evaluating a VRT run or a set of new/changed baselines —
not something a static lint pass can catch:
- **Individually review every diff.** A VRT run reporting N failures is N decisions, not one: for each,
  classify intended (the change that motivated this PR) vs. unintended (a regression) BEFORE touching
  any baseline. Never bulk-accept a batch of diffs.
- **Delete-then-regenerate for a suspect baseline — never trust `--update-snapshots` to "fix" one.**
  `--update-snapshots` overwrites in place even when the CURRENT baseline was already wrong (e.g.
  captured mid-animation); on a tall page, `maxDiffPixelRatio: 0.01` can mask a large absolute pixel
  count as "within tolerance" and silently perpetuate the bad baseline. When you suspect a baseline is
  wrong (not just outdated), delete the PNG and let the suite regenerate it fresh, then review that
  fresh capture explicitly — don't rely on the diff-update path.
- **Fresh-build requirement.** VRT's `webServer.reuseExistingServer` must stay `false`. A reused/stale
  dev server has served pre-rewrite pages into a "passing" baseline twice in this program's history
  (a chart page's animation state, a sidebar rewrite) — flag any local repro or CI config that reuses a
  server for VRT as a correctness risk, not just a performance one.
- **Both lanes.** Every route in `PAGES` (`apps/docs/vrt/components.spec.ts`) runs on BOTH the desktop
  (`chromium`, 1280×720) and mobile (`mobile-chromium`, 375×812, touch-enabled) Playwright projects from
  one entry — a route present in only one lane's committed baselines is incomplete coverage, flag it.
- **No skipped visual test describe (the `.skip` modifier on a `describe`/`test` call), and no
  deferred-coverage TODO marker referencing VRT**, in a VRT spec or an authoring skill — the
  deferred-coverage workflow is gone; `tooling/content-lint.mjs` already lint-rejects both patterns, but
  flag any prose (a plan doc, a PR description) that still describes deferred/skipped VRT coverage as an
  acceptable interim state.

## Output

A grouped report: file · line · rule id · suggested fix · severity.
- **error** — hardcoded visual value, a11y violation, registry integrity drift, a lint rule the gate
  would actually fail on.
- **warning** — raw interactive HTML, deprecated usage, a VRT review-discipline lapse.
- **info** — docs gap, a drift candidate worth a deliberate `shadcn add --diff` review.
Never auto-fix.
