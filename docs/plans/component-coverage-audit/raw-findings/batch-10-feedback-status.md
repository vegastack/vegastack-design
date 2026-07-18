# BATCH 10 — Feedback & Status (alert, skeleton, spinner, progress, progress-indicator, status-icon, empty-state)

## BATCH SUMMARY

- Components audited: 7. All have canonical + test + mdx + preview present (no missing pages, no thin previews).
- Files: 7/7 canonical ✓ | 7/7 test ✓ | 7/7 mdx ✓ | 7/7 preview ✓
- Total findings: 29 gaps across 7 components (0 components fully clean).
- Severity highlights:
  - **alert** — STALE token strings in 2 prose locations (`bg-X/10`, `bg-X-subtle` mismatch); `purple` variant + `icon`/`hideIcon`/`onDismiss`/`dismissLabel` props undemonstrated; no with-icon/with-title matrix.
  - **empty-state** — STALE token string `bg-X/10` in prose; `size` + `surface` variants entirely undemonstrated (preview only ever uses defaults + `bordered`).
  - **progress** — indeterminate + custom-scale only shown as code blocks, never live preview; `trackClassName`/`indicatorClassName`/`render` undemonstrated.
  - **skeleton** — `card` shape only inside composed card; no standalone count/Usage live preview; missing API rows are fine (single Props type).
  - **status-icon / spinner / progress-indicator** — strong; minor matrix gaps only.

### Proposed category table

| Component | Proposed category | One-line reason |
| --- | --- | --- |
| alert | Feedback & Status | Inline status banner with role=alert + dismiss. |
| skeleton | Feedback & Status | Loading placeholder for content not yet ready. |
| spinner | Feedback & Status | Indeterminate loading indicator. |
| progress | Feedback & Status | Determinate measurable-task progress bar. |
| progress-indicator | Feedback & Status | Compact radial/pie determinate percentage glyph. |
| status-icon | Feedback & Status | Canonical task-state status glyph (todo/progress/blocked/done). |
| empty-state | Feedback & Status | Zero-data placeholder with icon/title/actions. |

---

## alert
- files: canonical ✓ | test ✓ | mdx (`apps/docs/content/docs/components/alert.mdx`) ✓ | preview ✓
- exports/subcomponents: `Alert` (root), `Alert.Title`/`AlertTitle`, `Alert.Description`/`AlertDescription`, `Alert.Actions`/`AlertActions`; types `AlertProps`, `AlertTitleProps`, `AlertDescriptionProps`, `AlertActionsProps`, `AlertVariant`, `alertVariants`
- proposed category: Feedback & Status — inline status banner with `role="alert"`, semantic variants, optional self-managing dismiss.

### API surface (ground truth)
- CVA axis `variant`: `default` | `purple` | `info` | `success` | `warning` | `destructive` (alert.tsx:28-35).
- Props: `icon?: ReactNode` (custom leading icon), `hideIcon?: boolean` (default false), `dismissable?: boolean` (default false), `onDismiss?: () => void`, `dismissLabel?: string` (default `"Dismiss"`) (alert.tsx:62-87).
- Behavior: when `dismissable` and no `onDismiss`, self-removes from DOM (`open` state → returns null) (alert.tsx:121-128). Default icon per variant via `VARIANT_ICON` (alert.tsx:45-52).
- States: default / with-icon (default) / hideIcon / custom-icon / dismissable (controlled via onDismiss) / dismissable (self-dismiss).

### Currently demonstrated
- preview exports: `alert` (single info, default usage) → MDX `preview: alert` frontmatter; `alertVariants` (all 6 variants, each with-title+with-description) → Variants section; `alertDismissable` (warning + default, both dismissable, no onDismiss = self-dismiss) → Dismissable section.
- mdx sections: Installation, Usage, Anatomy, Variants, Dismissable, API Reference (4 AutoTypeTable: AlertProps + Title/Description/Actions), Accessibility, Do/Don't. Good structure.
- API table status: all four subcomponent prop types covered. ✓

### GAPS
- [PROSE] STALE TOKEN: frontmatter `description` and Variants prose both contradict canonical. mdx:45-46 says `each with ... status color tokens (bg-X/10 text-X-text border-X/20)` but canonical uses `bg-X-subtle` not `bg-X/10` (alert.tsx:31-34). The `/10` background recipe is wrong/stale.
- [PROSE] STALE TOKEN: alert.tsx JSDoc itself (alert.tsx:20-21) claims `bg-X-subtle text-X-text border-X/20` which is correct — but the MDX Variants line `bg-X/10` diverges; pick canonical (`bg-X-subtle`).
- [VARIANT] `icon` prop (custom leading icon, e.g. `<Bell />`) never demonstrated in any preview or MDX example — a documented override (alert.tsx:62-66) with zero coverage.
- [VARIANT] `hideIcon` never demonstrated in preview (only tested). A no-icon alert is a real layout (no leading gutter); show it.
- [VARIANT] `Alert.Actions` never rendered in any live preview — the Anatomy + JSDoc example (alert.tsx:104-108) show a Renew button, but no preview export composes Actions. Action-row layout (button + dismiss together) is undemonstrated.
- [VARIANT] Controlled dismiss (`onDismiss` updating external state) not shown live — both `alertDismissable` previews omit `onDismiss` (self-dismiss path only). The controlled pattern is the recommended production path.
- [VARIANT] `dismissLabel` override never shown (default "Dismiss" only).
- [MATRIX] No variant × (with-icon / dismissable / with-actions) matrix. The variants grid shows title+description only; it never crosses a status variant with Actions or with a custom icon, hiding how the icon gutter + action row interact per tone.
- [API] none — all subcomponent prop tables present and correct.
- [STRUCTURE] none — sections present and well ordered (adds Anatomy, appropriate for compound).

### Verdict
- coverage: ~70% (variants strong; icon/actions/controlled-dismiss + stale tokens are the holes)
- effort: M
- top 3 fixes: (1) fix the `bg-X/10` → `bg-X-subtle` stale token in frontmatter + Variants prose; (2) add a preview demonstrating `Alert.Actions` + controlled `onDismiss` (and a `hideIcon`/custom `icon` example); (3) note the `purple` variant's intended use (rationed accent) in Variants prose so it isn't read as just another status.

---

## skeleton
- files: canonical ✓ | test ✓ | mdx (`apps/docs/content/docs/components/skeleton.mdx`) ✓ | preview ✓
- exports/subcomponents: `Skeleton` (single export); types `SkeletonProps`, `SkeletonShape`, `skeletonVariants`
- proposed category: Feedback & Status — token-driven loading placeholder, decorative, reduced-motion-aware.

### API surface (ground truth)
- CVA axis `shape`: `line` | `circle` | `rect` | `card` (skeleton.tsx:17-26).
- Prop `count?: number` (default 1; `>1` renders a stacked block, last `line` shortened to `w-4/5`) (skeleton.tsx:50-56, 117-126).
- Behavior: `count` clamped to ≥1 (`Math.max(1, Math.floor(count))`), invalid → single element (skeleton.tsx:90-104). Decorative: `role="presentation"` + `aria-hidden` (skeleton.tsx:96-97). Pulse + `motion-reduce:animate-none`.
- States: single / stacked (count>1) / each shape.

### Currently demonstrated
- preview exports: `skeleton` (count={3} default-shape stack) → frontmatter; `skeletonShapes` (line, circle+line row, rect, card) → Shapes section; `skeletonCard` (composed loading card: circle + 2 lines + rect + count=3 + 2 button placeholders) → "Composing a loading card" section.
- mdx sections: Installation, Usage, Shapes, Composing a loading card, Line count (code only), API Reference (SkeletonProps), Accessibility, Do/Don't. Good a11y prose (container `aria-busy`, reduced motion).
- API table status: single `SkeletonProps` table — complete (no subcomponents). ✓

### GAPS
- [VARIANT] `card` shape is demonstrated only *inside* the `skeletonShapes` stack and the composed card — it reads fine, OK. But `count` (the headline prop) has NO standalone live preview: the "Line count" section (mdx:49-55) is a bare code block `<Skeleton count={4} />` with no `<ComponentPreview>`. Add a live count preview.
- [MATRIX] No matrix crossing `shape × count` — e.g. `count` only ever applies to the default `line` shape; the docs never show whether `count` with `shape="circle"`/`rect` stacks (it does, per skeleton.tsx:117-122, and only `line` gets the shortened last row). A small grid would reveal the shape-specific last-line behavior.
- [PROSE] none material — accessibility section is accurate (matches `role="presentation"`/`aria-hidden`/`motion-reduce`).
- [API] none — single Props type, fully tabled.
- [STRUCTURE] none — standard sections present and ordered.

### Verdict
- coverage: ~85% (shapes + composition strong; count lacks a live demo)
- effort: S
- top 3 fixes: (1) convert the "Line count" code block to a live `<ComponentPreview>`; (2) optionally show `count` with a non-`line` shape to document the last-line-shorten-only-for-line behavior; (3) no other changes needed.

---

## spinner
- files: canonical ✓ | test ✓ | mdx (`apps/docs/content/docs/components/spinner.mdx`) ✓ | preview ✓
- exports/subcomponents: `Spinner` (single export); types `SpinnerProps`, `spinnerVariants`
- proposed category: Feedback & Status — indeterminate loading indicator, accessible by default.

### API surface (ground truth)
- CVA axis `size`: `xs` | `sm` | `default` | `lg` (spinner.tsx:18-27).
- Prop `label?: string` (default `"Loading"`; `label=""` → decorative `aria-hidden`, drops `role="status"`) (spinner.tsx:40-49, 68-79).
- Behavior: default `text-muted-foreground`, inherits `currentColor` (recolor via ancestor/className). Forwards ref to `<svg>`. `motion-reduce:animate-none`.
- States: default (role=status, "Loading") / custom label / decorative (label="") / each size.

### Currently demonstrated
- preview exports: `spinner` (bare default) → frontmatter; `spinnerSizes` (xs/sm/default/lg, all `label=""`) → Sizes section.
- mdx sections: Installation, Usage (+ currentColor recolor example), Sizes, API Reference (SpinnerProps), Accessibility (role/name/reduced-motion table), Do/Don't. Good a11y prose.
- API table status: single `SpinnerProps` table — complete. ✓

### GAPS
- [VARIANT] Custom `label` ("Saving changes") never shown in a live preview — only described in prose (mdx:44) and the Usage currentColor example. The labelled-status path (the default, accessible behavior) is documented in code text but not visually demoed.
- [VARIANT] `currentColor` recoloring (e.g. `text-primary`/inside a button) shown as a code snippet only (mdx:23-29) — no live `<ComponentPreview>` proving the color inheritance. A small "in a button / colored" preview would close this.
- [MATRIX] No matrix; minor — size is the only axis and it's fully shown. The decorative-vs-announced distinction (the only behavioral fork) is prose-only.
- [PROSE] none — accessibility table matches canonical exactly (role="status", aria-label default "Loading", reduced motion).
- [API] none.
- [STRUCTURE] none — standard sections present.

### Verdict
- coverage: ~85% (size axis fully shown; label/color behaviors are prose-only)
- effort: S
- top 3 fixes: (1) add a live preview pairing a labelled spinner with visible "Saving…" text (the recommended pattern); (2) add a colored/in-context preview to demonstrate `currentColor` inheritance; (3) otherwise complete.

---

## progress
- files: canonical ✓ | test ✓ | mdx (`apps/docs/content/docs/components/progress.mdx`) ✓ | preview ✓
- exports/subcomponents: `Progress` (single export, internally Base UI Root→Track→Indicator); types `ProgressProps`, `ProgressSize`, `progressVariants`
- proposed category: Feedback & Status — determinate horizontal progress for measurable tasks.

### API surface (ground truth)
- CVA axis `size`: `sm` (h-1.5) | `default` (h-2) | `lg` (h-3) (progress.tsx:18-26).
- Props: `value?: number | null` (default null = indeterminate), `max?: number` (default 100), `trackClassName?`, `indicatorClassName?`, `render?` (Base UI composition) (progress.tsx:38-72).
- Behavior: `role="progressbar"` + `aria-valuenow/min/max` from Base UI; `value={null}` → `data-indeterminate`, drops valuenow. Indicator `transition-[width]` + `motion-reduce:transition-none`. Forwards ref to Root.
- States: determinate (value) / indeterminate (null) / custom max / each size / custom track+indicator styling / render composition.

### Currently demonstrated
- preview exports: `progress` (value=60) → frontmatter+Usage; `progressValues` (0/33/66/100) → Examples › Values; `progressSizes` (sm/default/lg) → Examples › Sizes.
- mdx sections: Installation, Usage, Anatomy (Root/Track/Indicator + which className prop hits which part), Examples (Values, Sizes, Custom scale [code], Indeterminate [code]), API Reference (ProgressProps), Accessibility (attribute table), Do/Don't. Strong structure.
- API table status: single `ProgressProps` table — complete. ✓

### GAPS
- [VARIANT] **Indeterminate** state shown as a CODE BLOCK only (mdx:60-65), never a live `<ComponentPreview>`. Indeterminate is a primary, behaviorally-distinct state (animated, no valuenow) and deserves a live demo — code text can't show the animation.
- [VARIANT] **Custom scale** (`max={5}`, step 3 of 5) also code-block-only (mdx:52-57) — no live preview.
- [VARIANT] `trackClassName` / `indicatorClassName` (recolor the fill, e.g. success `bg-success`) never demonstrated in preview or example — only mentioned in Anatomy prose. The indicator is hardwired `bg-purple` (progress.tsx:129); a "status-colored fill" preview would show the documented override.
- [VARIANT] `render` (Base UI root composition) undemonstrated in docs (tested only). It's a real API surface (progress.tsx:65-72) with an AutoTypeTable row but no example.
- [MATRIX] No matrix; size × value or size × indeterminate not crossed — minor, the two axes are independently shown.
- [PROSE] none — accessibility attribute table is accurate (valuenow omitted while indeterminate, motion-reduce on the fill).
- [API] none — `render` appears in the Props type so it lands in the AutoTypeTable; subcomponents are internal (flat API), correctly not separately tabled.
- [STRUCTURE] none.

### Verdict
- coverage: ~70% (sizes + values live; indeterminate, custom-max, custom-fill, render are all code-only or absent)
- effort: M
- top 3 fixes: (1) promote Indeterminate from code block to a live `<ComponentPreview>` (it's the key non-determinate state); (2) add a live custom-scale (`max`) preview; (3) add an `indicatorClassName` status-colored-fill preview to demonstrate the override.

---

## progress-indicator
- files: canonical ✓ | test ✓ | mdx (`apps/docs/content/docs/components/progress-indicator.mdx`) ✓ | preview ✓
- exports/subcomponents: `ProgressIndicator` (single export); types `ProgressIndicatorProps`, `ProgressIndicatorSize`, `ProgressIndicatorShape`, `progressIndicatorVariants`
- proposed category: Feedback & Status — compact radial/pie determinate percentage glyph (radial counterpart to Progress).

### API surface (ground truth)
- CVA axis `size`: `xs` (14px) | `sm` (16px) | `default` (20px) | `lg` (24px) (progress-indicator.tsx:18-24).
- Props: `value?: number` (default 0, clamped to [0,max]), `max?: number` (default 100), `shape?: 'circle' | 'squircle'` (default circle), `aria-label?` (default `"{percent}% complete"`) (progress-indicator.tsx:39-69).
- Behavior: `role="progressbar"` + `aria-valuenow/min/max` (always 0–100 normalized), `data-value` percent. `currentColor`, default `text-purple-text`, recolor via `text-*`. Server-safe, ref → root `<span>`.
- States: each value / each shape / each size / recolored / custom max / clamped (≤0, ≥max).

### Currently demonstrated
- preview exports: `progressIndicator` (60) → frontmatter+Usage; `progressIndicatorValues` (0/25/50/75/100) → Values; `progressIndicatorShapes` (circle vs squircle) → Shapes; `progressIndicatorSizes` (xs/sm/default/lg) → Sizes; `progressIndicatorColors` (purple/success/warning/destructive) → Colors.
- mdx sections: Installation, Usage (+ radial-vs-linear cross-link, server-safe note), Examples (Values, Shapes, Sizes, Colors, Custom scale [code]), API Reference (ProgressIndicatorProps), Accessibility (attribute table), Do/Don't. Very strong — best-covered in the batch.
- API table status: single `ProgressIndicatorProps` table — complete. ✓

### GAPS
- [VARIANT] Custom scale (`max={5}`) shown as a CODE BLOCK only (mdx:56-61), no live preview. Minor — the normalization (3/5 → 60%) is the only thing it adds and it's already a11y-tested.
- [MATRIX] No `shape × size` or `shape × value` matrix — circle-only is used for sizes/values/colors and squircle appears only at value=60. A small shape×value grid would show how the squircle pie-fill reads at low/high values vs the circle. Low priority (purely visual).
- [PROSE] none — accessibility table accurate (0–100 normalization, svg aria-hidden, currentColor).
- [API] none.
- [STRUCTURE] none — exemplary.

### Verdict
- coverage: ~90% (all axes shown live; only custom-max is code-only)
- effort: S
- top 3 fixes: (1) optionally promote the custom-scale code block to a live preview; (2) optionally add a shape×value mini-grid; (3) otherwise the strongest doc in the batch — leave as-is.

---

## status-icon
- files: canonical ✓ | test ✓ | mdx (`apps/docs/content/docs/components/status-icon.mdx`) ✓ | preview ✓
- exports/subcomponents: `StatusIcon` (single export); types `StatusIconProps`, `statusIconVariants`
- proposed category: Feedback & Status — canonical task-state status glyph (todo/progress/blocked/done).

### API surface (ground truth)
- CVA axis `status`: `todo` (Circle, muted) | `progress` (spinning Loader, info) | `blocked` (CircleAlert, destructive) | `done` (CircleCheck, success) (status-icon.tsx:16-31, 34-39).
- CVA axis `size`: `xs` | `sm` | `default` | `lg` (status-icon.tsx:23-28).
- Prop `label?: string` (default from `STATUS_LABEL`; `label=""` → decorative `aria-hidden`, drops `role="img"`) (status-icon.tsx:62-74, 95-111).
- Behavior: `progress` adds `animate-spin` + `motion-reduce:animate-none`. `role="img"` + `aria-label` by default. Ref → `<svg>`.
- States: each status / each size / labelled / decorative (label="").

### Currently demonstrated
- preview exports: `statusIcon` (progress) → frontmatter; `statusIconStates` (todo/progress/blocked/done) → States; `statusIconSizes` (xs/sm/default/lg, all status=done) → Sizes.
- mdx sections: Installation, Usage, States, Sizes, API Reference (StatusIconProps), Accessibility (role/name/reduced-motion table), Do/Don't. Solid.
- API table status: single `StatusIconProps` table — complete. ✓

### GAPS
- [MATRIX] `status × size` not crossed — Sizes uses `done` only; the spinning `progress` status at `lg` (the one with motion) is never shown at any size other than `default`. A status×size grid would reveal that only `progress` animates. Low/medium priority.
- [VARIANT] Custom `label` and decorative `label=""` never shown in a live preview (prose + test only). Pairing the icon with adjacent text (`label=""`) is the recommended a11y pattern (Do/Don't) but has no visual demo — e.g. a "● In progress" row.
- [PROSE] none — accessibility table matches canonical (role="img", default label from status, progress motion-reduce). Do/Don't accurately stresses not relying on color alone.
- [API] none.
- [STRUCTURE] none — standard sections present.

### Verdict
- coverage: ~85% (both axes shown; label behavior + status×size grid are the gaps)
- effort: S
- top 3 fixes: (1) add a preview showing a status icon next to a text label with `label=""` (the documented a11y pattern); (2) optionally cross status×size so the `progress` animation reads at multiple sizes; (3) otherwise complete.

---

## empty-state
- files: canonical ✓ | test ✓ | mdx (`apps/docs/content/docs/components/empty-state.mdx`) ✓ | preview ✓
- exports/subcomponents: `EmptyState` (root), `.Icon`/`EmptyStateIcon`, `.Title`/`EmptyStateTitle`, `.Description`/`EmptyStateDescription`, `.Actions`/`EmptyStateActions`; types `EmptyStateProps`, `EmptyStateIconProps`, `EmptyStateTitleProps`, `EmptyStateDescriptionProps`, `EmptyStateActionsProps`, `EmptyStateIntent`, `emptyStateVariants`, `emptyStateIconVariants`
- proposed category: Feedback & Status — zero-data placeholder with icon/title/description/actions.

### API surface (ground truth)
- Root CVA: `size` `sm`(py-8) | `default`(py-12) | `lg`(py-16); `bordered` true|false (dashed outline); `surface` `card`(bg-card) | `transparent` (empty-state.tsx:14-32).
- Icon CVA: `intent` `default`(muted) | `info`(info-subtle) | `destructive`(destructive-subtle) (empty-state.tsx:38-50).
- Props: root `size`/`bordered`/`surface`; `EmptyState.Icon` `intent`. Server-safe (no hooks).
- States: each size / bordered on-off / each surface / each icon intent / with/without actions / with/without icon.

### Currently demonstrated
- preview exports: `emptyState` (bordered, Inbox icon default intent, title+desc+Compose action) → frontmatter; `emptyStateIntents` (default/info/destructive intents, all `bordered`, each with actions) → Intents section.
- mdx sections: Installation, Usage, Anatomy (all 5 parts + slots), Intents, API Reference (5 AutoTypeTable — all subcomponents), Accessibility (h3 heading, decorative icon, focusable actions table), Do/Don't. Strong structure, full API tables.
- API table status: all five subcomponent prop tables present. ✓

### GAPS
- [PROSE] STALE TOKEN: Intents prose (mdx:53) says intents map to `(bg-X/10 text-X)` but canonical uses `bg-info-subtle text-info-text` / `bg-destructive-subtle text-destructive-text` (empty-state.tsx:44-46) — the `bg-X/10` recipe is wrong/stale (same class of error as alert.mdx). Also `text-X` should be `text-X-text`.
- [VARIANT] `size` axis (`sm`/`default`/`lg`) entirely undemonstrated — every preview uses the default. The Anatomy code (mdx:35) names `size="default"` but no `sm`/`lg` is ever shown. Density variants invisible.
- [VARIANT] `surface` axis (`card` vs `transparent`) entirely undemonstrated — every preview relies on the `transparent` default + `bordered`. The `card` surface (filled panel) is never shown; a user can't see the bg-card look.
- [VARIANT] `bordered={false}` never shown — all 4 previews pass `bordered`. The borderless default (the CVA default) has no demo, so the dashed-vs-plain difference isn't visible.
- [VARIANT] Icon-less empty state (no `EmptyState.Icon`) never shown — every preview includes an icon. A title+description-only empty is a common compact form.
- [MATRIX] No `size × surface` or `bordered × surface` matrix — these three root axes (size/bordered/surface) interact visually (padding + panel + outline) but are only ever shown in one combination (default size, bordered, transparent). At minimum a surface=card example is needed.
- [API] none — all five subcomponent prop tables present and correct.
- [STRUCTURE] none — standard sections present and ordered (Anatomy appropriate for compound).

### Verdict
- coverage: ~55% (intents + composition strong, but size/surface/bordered-off/icon-less are all unshown + a stale token string)
- effort: M
- top 3 fixes: (1) fix the `bg-X/10 text-X` → `bg-X-subtle text-X-text` stale token in the Intents prose; (2) add a preview crossing `size` (sm/default/lg) and `surface` (card vs transparent) — at least show the `card` surface and an `lg` full-page empty; (3) add a borderless and/or icon-less variant so the defaults are visible.
