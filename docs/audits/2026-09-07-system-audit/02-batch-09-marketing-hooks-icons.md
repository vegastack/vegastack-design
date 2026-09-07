# 02 — Batch 9: marketing, utilities, hooks, block, icons

**Items:** marketing-surface · pricing-section (+ PlanCard) · testimonial · logo-row · ruled-band ·
bubble · particle-field · staggered-text-reveal · animated-number · settings-row · shortcut-overlay ·
field-inline · message-scroller · provider · hooks (`use-animation-replay`, `use-drag-reorder`,
`use-file-drop`, `use-list-nav`, `use-mobile`, `use-platform`) · block `dashboard-01` · the 439
animated icons (sample: `icons/bell.tsx`) and their generator (`tooling/mirror-animated-icons.mjs`,
`tooling/verify-animated-icons.mjs`)
**Evidence:** source read (comments stripped); five-lane captures for every component and the
block; a Chromium probe proving `width="var(--icon-default)"` on an `<svg>` resolves to 16px
(so the icon sizing contract holds); registry.json dependency dump; tests/previews/docs inventory;
axe from the sweep (no violations in this batch).

Overall: the small marketing leaves are disciplined (server-safe, mono-uppercase labels only where
allowed, serif only for the pull-quote). The hooks are the best-written code in the system. The
cost centre is the icon corpus: 439 files that each re-implement the same 120-line controller, which
is 79,000 lines and 3.4 MB of canonical source for what is, per icon, two arrays of path data.

## Findings

### B9-01 · HIGH · bloat · Every animated icon carries its own copy of the controller

- **Where:** `packages/ui/registry/ui/icons/*.tsx` — 439 files, 79,078 lines, 3.4 MB; 440 generated
  `public/r/icon-*.json`. `bell.tsx:33-170` is representative: the `useAnimation` /
  `useReducedMotion` controller, `runAnimation`/`resetAnimation`, the five pointer/focus handlers,
  the `isControlledRef` trick and a `<div>` wrapper are identical in every file; only
  `SVG_VARIANTS` and the `<path>` list differ (~15 lines). Each file also has a `useEffect` with
  **no dependency array** (`:83-85`) that runs after every render of every icon, and renders the
  icon as a block `<div>` around the svg (the `AnimatedIcon` wrapper then puts `role="img"` on that
  div). The mirror script already rewrites upstream bytes (`mirror-animated-icons.mjs`), so the shape
  is ours to choose; `verify-animated-icons.mjs:179-191` currently _requires_ the duplicated shape.
- **Fix:** the mirror emits a data module per icon (`variants`, `paths`, optional per-path
  variants) and `@vegastack/design/icons` exports one `createAnimatedIcon()` factory that owns the
  controller, an inline-flex `<span>` (or the svg itself) as host, the `[]`-dependency
  reduced-motion effect, and the `pointerType` rules. Each icon becomes ~20 lines; the registry
  JSON shrinks by roughly 5×; a controller bug is fixed once. `verify-animated-icons.mjs` moves its
  assertions to the factory and checks each data module against the manifest hash. **Doubt D28**
  (upstream-fidelity vs factory).

### B9-02 · HIGH · dependency · `next-themes` is an unlisted runtime dependency

- **Where:** `provider.tsx:3`, `registry.json` item `provider` (`next-themes@0.4.6`, pinned exact).
  AGENTS.md's sanctioned lists do not mention it, and `design.md` does not either. It is the right
  library (0.4.6 is current) but it is a locked decision that was never written down; it also fixes
  the theme strategy to `attribute="class"`, which every token file assumes.
- Also in the provider: `Tooltip.Provider` mounts with no `delay`/`closeDelay`, so the B3 tooltip
  timing decision has no home; the mounted `Toaster` is sonner's and moves with the Base UI toast
  migration (B3). `@shadcn/react` (message-scroller's sanctioned engine) is `^0.2.1` with 0.3.1
  published — in the deps batch.
- **Fix:** add `next-themes` to the sanctioned list as the "theme engine" behind `provider` (one
  file), set the tooltip delays in the provider from `TIMINGS`, and swap the Toaster with B3.

### B9-03 · MEDIUM · bloat · `usePrefersReducedMotion` ×3, `mergeRefs` ×5, matchMedia ×5

- `animated-number.tsx`, `message-scroller.tsx`, `particle-field.tsx` each define
  `usePrefersReducedMotion`; `use-mobile.ts` and `use-platform.ts` are two more matchMedia
  subscriptions with the same shape. `mergeRefs` is exported from `use-animation-replay.ts` (an odd
  home) while `animated-number`, `particle-field`, `field-inline`, `dropzone` and `board` hand-merge
  refs inline.
- **Fix:** `use-media-query.ts` (`useMediaQuery(query, { serverFallback })` on
  `useSyncExternalStore`, with `usePrefersReducedMotion` and `useIsMobile` as one-liners over it);
  `mergeRefs` moves to `@vegastack/design`. `useIsMobile`'s `false` initial state also means SSR
  renders the desktop layout on a phone until the effect runs (Board enables pointer drag, then
  disables it); the `serverFallback` option is the fix.

### B9-04 · MEDIUM · doctrine · `PlanCard highlighted` and the dashboard use `info` for promotion

- `pricing-section.tsx` highlighted card: `border-info/(--alpha-outline-border)` + `Badge
intent="info"`. Same misuse as B5-06 (ComparisonMatrix): `info` is for links and informational
  messages; a promoted plan is `primary`/`surface-3` with a neutral or `primary` badge.
  `dashboard-01/page.tsx` empty state uses `EmptyMedia intent="info"` for "No agents yet" — a
  neutral empty state, not information.

### B9-05 · MEDIUM · UX · The block truncates its KPI labels and wraps its header

- **Measured:** `captures/dashboard-01/dashboard01Demo__1280-light-ltr.png` shows "Active agen…",
  "Tasks compl…", "API calls (24…", "Avg. respons…" — every stat label truncates at the 2-column
  width because `stat-cards.tsx:80` forces `truncate` next to a `shrink-0` badge. At 320px the
  breadcrumb wraps to two lines under the sidebar trigger. A KPI label is the one thing on a stat
  card that must never be cut.
- **Fix:** label wraps (two lines max via `line-clamp-2`) and the trend badge sits on the value
  row; `BreadcrumbTrail maxItems={2}` in the block header. The single-series area chart uses
  `chart-1` (saturated blue) in an otherwise neutral shell — Geist draws a single series in
  foreground ink and reserves hue for multi-series; **Doubt D29**.

### B9-06 · MEDIUM · a11y/bloat · `FieldInline` re-implements EditableCell's state machine

- `field-inline.tsx` `startEdit`/`commit`/`cancel`/`restoreFocusRef`/`committedRef` and the
  Enter/Escape/blur policy duplicate `editable-cell.tsx`'s (Batch 5); its error uses `role="alert"`
  (assertive) for inline validation, against the B7-02 policy (`status`); its rest-state hover is
  `hover:bg-muted` (invisible on card, P1).
- **Fix:** one `useInlineEdit` hook shared by FieldInline and EditableCell (draft, commit, cancel,
  focus restore, double-commit guard); `role="status"`; P1 hover.

### B9-07 · MEDIUM · design/RTL · LogoRow renders logos as underlined links

- `logo-row.tsx` items are `text-lg font-medium underline underline-offset-4` links. A logo wall
  of underlined text reads as a paragraph of links; Geist/Linear/Vercel show marks at rest in
  `muted-foreground` and lift to `foreground` on hover with no underline. The `wall` variant uses
  physical `-ml-px border-l` (`:45`), so in RTL the outer edge double-borders and the inner seams
  vanish — logical `-ms-px border-s`. `wallColumns` is fixed (2|3|4) with no responsive fallback;
  at 320px a 4-column wall gives 80px cells. Use `grid-cols-[repeat(auto-fill,minmax(…))]`.

### B9-08 · LOW · consistency · Docked-control motion is copied again

- `message-scroller.tsx` `MessageScrollerButton` carries the same `transition-[translate,scale,
opacity] duration-base … data-[active=false]:duration-slow ease-exit` recipe as `action-bar.tsx`
  (B8-11). One `motion-dock` utility pair (in/out) with the corrected timings, used by both. The
  button also sets `variant="secondary"` then overrides `bg-background border-border hover:bg-muted`
  inline — after P2 it is `variant="outline"` with no override.

### B9-09 · LOW · defect · ParticleField freezes the brand colour of the theme it mounted in

- `particle-field.tsx` reads `--brand` once inside the draw effect (keyed on `ready`, `count`,
  `seed`, reduced-motion) and never again; the light brand is `oklch(0.6 …)` and the dark one
  `oklch(0.86 …)`, so toggling the theme leaves dark-mode particles at the light value until the
  component remounts. The canvas already has `text-brand`; read `getComputedStyle(canvas).color` per
  frame (cheap) or on a theme mutation.

### B9-10 · LOW · UX · Reveal animations run off-screen

- `staggered-text-reveal.tsx` starts `motion-enter-up` on mount regardless of visibility, so a
  reveal below the fold has finished before anyone scrolls to it; `particle-field` already gates on
  `IntersectionObserver`. Add the same gate (`whenVisible`, default on). `animateIn` on `Bubble` and
  `Message` is opt-in, fine.

### B9-11 · LOW · i18n/structure · Marketing leaves

- `testimonial.tsx` hard-codes `“…”` around the quote; quotation marks are locale-specific (`„“`,
  `« »`). Use `<q>`/CSS `quotes` or a `quotes` prop. `settings-row.tsx` `SettingsSection` hard-codes
  `<h3>` (same as `EmptyTitle`, B7-07) — expose `render`/`as`. `shortcut-overlay.tsx` repeats the
  `max-h-[calc(100dvh-var(--spacing)*64)]` magic (B8-06) and `max-w-lg` on `DialogContent`, which
  becomes `size="md"` with B3's Dialog size prop; its filter input is a boxed `Input size="sm"`
  (B8-04 panel-search recipe applies).

### B9-12 · LOW · docs/tests · Coverage and canon

- `use-file-drop` has **no unit test** (paste path, `accept` matching, directory traversal,
  `maxSize` rejections are only exercised through `dropzone`); `use-platform` (4) and `use-mobile`
  (5) are thin. `pricing-section` (3 tests, 1 preview) and `ruled-band` (3, 1) are thin;
  `pricing-section.mdx` has a "Notes" section and `ruled-band.mdx` a "Voice" section outside the
  canon — fold into Usage. `bubble.mdx` has "Playground" (D26). `particle-field` has one preview.

### Verified fine

`MarketingSurface` scopes the theme via `InternalThemeScopeProvider` and composes with `render`.
`RuledBand`, `Testimonial`, `LogoRow`, `PricingSection`, `SettingsRow`, `StaggeredTextReveal` are
server-safe. Uppercase appears only on mono labels (`text-mono-label`), serif only on the pull-quote
(`--font-family-serif` is documented as a display accent). `AnimatedNumber` reads the real
`--duration-*`/`--motion-ease-standard` tokens, honours reduced motion, and announces only the
settled value. `SettingsRow` uses a container query to stack below `@sm`. `ShortcutOverlay` is a
registry-driven `<dl>` with real `Kbd` and platform-correct modifiers, ignores the trigger key
inside editable targets. `MessageScroller` items use `content-visibility: auto` with an intrinsic
size; the button respects reduced motion for `scrollBehavior`. `use-list-nav` is RTL-aware and
clamps on count change; `use-animation-replay` restarts via rAF and ignores bubbled
`animationend`; `use-drag-reorder` gates drops through `canDropInContainer`, keeps the keyboard and
menu paths alive when pointer drag is disabled, and announces every step; `use-file-drop` keeps the
file input a display:none sibling and announces accepted/rejected batches; `use-platform` prefers
`userAgentData`. The block is server-safe with a client sidebar leaf, honours the no-Next-imports
rule, and ships loading/error/empty states per region. Icons: `width="var(--icon-default)"` on the
svg measures 16×16 in Chromium (probe), reduced motion settles via `stopAnimation`, touch triggers
on pointer-down instead of hover.

## Motion register — Batch 9

| id   | where                   | motion                                                     | verdict                                                                                            |
| ---- | ----------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| M-45 | animated icons (439)    | motion/react variants on hover/focus/touch, 0.5s easeInOut | keep; the factory (B9-01) centralises the timing so it can adopt `--duration-slow`/`ease-standard` |
| M-46 | animated-number         | rAF tween over `--duration-*` + `ease-standard`            | keep                                                                                               |
| M-47 | particle-field          | rAF drift, static frame under reduced motion               | keep (fix B9-09)                                                                                   |
| M-48 | staggered-text-reveal   | `motion-enter-up` per word, stagger `fast×n`               | keep, gate on visibility (B9-10)                                                                   |
| M-49 | message-scroller button | dock in/out (copy of M-39)                                 | change with M-39                                                                                   |
| M-50 | bubble `animateIn`      | `motion-enter-up`, opt-in                                  | keep                                                                                               |

## Doubts for MK (Batch 9)

| id  | question                   | options                                                                                                                                                                  | recommendation                                                                                      |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| D28 | Icon corpus shape          | (a) data modules + one `createAnimatedIcon` factory (~20 lines per icon, verify script moves to the factory) · (b) keep 439 self-contained mirrors for upstream fidelity | **(a)** — the mirror already transforms upstream; fidelity is the manifest hash, not the file shape |
| D29 | Single-series chart colour | (a) foreground ink for one series, `chart-*` hues only from two series up · (b) keep `chart-1` blue                                                                      | **(a)**                                                                                             |
| D30 | `next-themes`              | (a) sanction as the provider's theme engine · (b) replace with an in-house class toggler                                                                                 | **(a)**                                                                                             |
