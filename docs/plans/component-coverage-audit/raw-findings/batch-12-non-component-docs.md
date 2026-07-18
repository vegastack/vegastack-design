# Batch 12 — Non-Component Docs + Navigation Structure Audit

READ-ONLY audit of the VegaStack design-system docs at `/Users/kmanojkumar/code/org-design`.
Scope: landing/install, foundations (colors/typography/icons/motion), utilities (shimmer/scroll-fade),
and all navigation `meta.json` files. Cross-referenced against the real token/utility/CLI implementation.

## SUMMARY

- **Pages audited:** 8 content pages (`index`, `install`, 4 foundations, 2 utilities) + 4 nav `meta.json` files + 2 MDX preview components (`foundations.tsx`, `icon-gallery.tsx`) + 1 homepage (`app/(home)/page.tsx`).
- **Pages with Major issues:** 1 (`components/meta.json` — flat, ungrouped 68-component list). The prose pages are mostly **accurate** — most foundation/utility content matches the real implementation byte-for-byte (token names, utility class names, CLI subcommands, icon count all verified correct).
- **Confirmed PROSE bug:** `index.mdx:6` and `app/(home)/page.tsx:8` both say **"64 components"** — there are actually **68** (`ls components/*.mdx` = 68; `components/meta.json` non-divider entries = 68). Stale count, 2 files.
- **Biggest structural problems:**
  1. `components/meta.json` is a **near-flat list of 68 components** with a single `---Communication---` divider near the bottom — no sub-grouping by role (forms, overlays, data display, etc.). 64 of 68 components sit in one ungrouped run.
  2. **Missing whole foundation pages** for tokens that already ship: **Radius** (`--radius`, `--radius-sm/md/lg/xl` exist), **Elevation/Shadow** (`--shadow-overlay` exists), **Spacing/Layout**, **Theming & Dark Mode**, **Accessibility**, **Design Principles**, **Changelog**. The implementation has these tokens but no page documents them.
  3. `meta.json` dividers are inconsistent: Utilities and (proposed) Communication use `---X---` section labels, but Foundations has none and Components has only one — taxonomy is applied unevenly.

---

## Per-page findings

### apps/docs/content/docs/index.mdx
- **Purpose / sections:** Landing/intro. Sections: Architecture (Tokens/Components/Showcase), Foundations, Components, Installation.
- **GAPS:**
  - [PROSE] `index.mdx:6-7` — stale count. Quoted: `"VegaStack Design is the internal design system: **design tokens** (public npm), **64 components**"`. **Correction: 68 components** (verified: 68 MDX pages, 68 non-divider entries in `components/meta.json`).
  - [STRUCTURE] The "Foundations" prose section (`:18-20`) only links Colors + Typography, omitting the two foundation pages that DO exist (Icons, Motion). Quoted: `"Start with [Colors](/docs/foundations/colors) and [Typography](/docs/foundations/typography)."` — should also surface Icons + Motion.
  - [STRUCTURE] "Components" prose (`:22-24`) links only Button: `"Browse [Button](/docs/components/button) and the rest of the component library."` — no path into the 68-component catalog or any grouping; relies entirely on the flat sidebar.
  - [MISSING] No link to Foundations/Utilities sub-pages that exist (icons, motion, shimmer, scroll-fade). Utilities section not mentioned at all in the body even though it's a top-level nav section.
- **Verdict:** Minor. **Effort: S** (fix count 64→68, add Icons/Motion/Utilities links).

### apps/docs/content/docs/install.mdx
- **Purpose / sections:** Registry consumer setup. Sections: Public Packages, shadcn Base UI, Registry Namespace, Integrity Preflight, Add Components, Updating components.
- **GAPS:**
  - [PROSE] **VERIFIED ACCURATE** — all CLI commands match the real bin. `packages/utils/package.json` bin = `vegastack-design` (`bin/vegastack-design.mjs`) + deprecated alias `vegastack-verify-registry-item`. Subcommands `verify`, `check-updates` and flags `--save`, `--post-write`, `--item`, `--target-dir`, `--hash-only`, `--fail-on-update` all line up with `docs/RELEASING.md:44-52`. No stale CLI prose found.
  - [PROSE] **VERIFIED ACCURATE** — `pnpm add @vegastack/tokens @vegastack/tailwind-preset @vegastack/utils @vegastack/icons` (`:14`) matches the locked "public npm" package set in AGENTS.md.
  - [PROSE] Minor inconsistency: examples mix `npx --package=@vegastack/utils vegastack-design verify` (`:80,99`) with bare `npx vegastack-design check-updates` (`:114`). Both work, but the `check-updates` example omits the `--package` qualifier the `verify` examples use — could confuse a reader into thinking they're different binaries. Low severity.
  - [STRUCTURE] This page lives at the **top level** (`meta.json` lists `"install"` before the section spreads). Reasonable, but it is the only top-level non-index page — could move under a "Getting Started" group if a Guides section is introduced.
  - [MISSING] No "Theming / override your tokens" pointer here even though the override model is a headline feature (documented only in `colors.mdx`). An install page is where consumers expect "now customize it."
- **Verdict:** Minor. **Effort: S**.

### apps/docs/content/docs/foundations/colors.mdx
- **Purpose / sections:** Semantic OKLCH color tokens. Sections: intro + `<ColorPalette/>`, Per-family variants, Override model, DoDont.
- **GAPS:**
  - [PROSE] **VERIFIED ACCURATE** — "six real tokens" per family claim (`:14`) matches `foundations.tsx` `COLOR_GROUPS`: each of purple/info/destructive/success/warning lists exactly 6 (`fill, foreground, hover, active, subtle, text`). The `--primary-hover`/`--primary-active`, `--muted-foreground-faint`, `--track`, `--overlay` tokens referenced in prose **all exist** in `dist/theme.css` (`:16,29,24,56`).
  - [PROSE] **VERIFIED ACCURATE** — `@theme inline` bridge example `--color-primary: var(--primary)` (`:32`) matches the bridge pattern in `theme.css:255-263`.
  - [STRUCTURE] `<ColorPalette/>` renders a **Charts** group (`chart-1..8`) and a **Sidebar surface** group (8 tokens) that the prose never mentions — the live swatch grid is richer than the written copy. Not wrong, but the page text under-describes what it renders.
  - [MISSING] No documentation of the **radius**, **shadow/elevation**, or **ring** treatment that also live in `theme.css` — colors page is the closest "foundations" home but doesn't cross-link them (they have no page at all).
- **Verdict:** Complete (accurate). **Effort: S** if expanding prose to cover charts/sidebar groups.

### apps/docs/content/docs/foundations/typography.mdx
- **Purpose / sections:** Type system. Sections: intro + `<TypeScale/>`, Tokens, DoDont.
- **GAPS:**
  - [PROSE] **VERIFIED ACCURATE** — documented vars `--font-family-sans` (Geist), `--font-family-mono` (Geist Mono), `--font-family-serif` (Lora) at `:14-16` exactly match `dist/theme.css:84-86`. The "bridged" claim matches `theme.css:255-257` (`--font-sans: var(--font-family-sans)` etc.). `<TypeScale/>` in `foundations.tsx:78-88` renders real font-serif/sans/mono specimens.
  - [MISSING] No **type scale tokens / sizes** documented (no `--text-*` or size step table). The page describes weight discipline but not a numeric scale, line-heights, or letter-spacing tokens. A typography foundation usually lists the size ramp.
  - [MISSING] No mention of how fonts are loaded (next/font, `@font-face`, or self-hosted) — consumers integrating the preset get var names but no loading guidance.
- **Verdict:** Minor (accurate but thin). **Effort: M** to add a size/line-height scale.

### apps/docs/content/docs/foundations/icons.mdx
- **Purpose / sections:** Three icon sources. Sections: intro (Icon/BrandIcon/AnimatedIcon), code samples, reduced-motion note, `<IconGallery/>`, DoDont.
- **GAPS:**
  - [PROSE] **VERIFIED ACCURATE** — the **"439 icons"** claim (`:13`) is exactly right: `ls packages/ui/registry/ui/icons/*.tsx` = 439. Size tokens `xs/sm/md/lg (14/16/20/24px)` and the three sanctioned sources match AGENTS.md ("ONLY lucide-react, lucide-animated, thesvg").
  - [PROSE] **VERIFIED ACCURATE** — `<IconGallery/>` (`icon-gallery.tsx`) renders real `Icon` (lucide), `BrandIcon` (thesvg: github/slack/figma), and `AnimatedIcon` (8 lucide-animated icons from `@/components/ui/icons/*`) — gallery is live, not stubbed.
  - [PROSE] Code sample `:24-31` imports `ActivityIcon` from `@/components/ui/icons/activity` after `shadcn add @vegastack/activity` — matches the registry layout (`registry/ui/icons/activity.tsx` exists).
  - [STRUCTURE] None — well-structured page.
- **Verdict:** Complete. **Effort: S** (no changes needed).

### apps/docs/content/docs/foundations/motion.mdx
- **Purpose / sections:** CSS-first motion. Sections: intro, Tokens (Duration/Easing), code sample, reduced-motion note.
- **GAPS:**
  - [PROSE] **VERIFIED ACCURATE** — duration tokens `--duration-fast (150ms)`, `--duration-base (200ms)`, `--duration-slow (300ms)` (`:13`) match `theme.css:87-89` exactly. Easing `--ease-standard/emphasized/exit` "bridged from `--motion-ease-*`" (`:14`) matches `theme.css:90-92` (raw `--motion-ease-*`) + `:258-260` (bridge `--ease-standard: var(--motion-ease-standard)`). Naming convention matches AGENTS.md locked decision ("Runtime ... vars are ... `--motion-ease-*`").
  - [PROSE] **VERIFIED ACCURATE** — `prefers-reduced-motion: reduce` "enforced globally in `@vegastack/tokens/base.css`" (`:19`) confirmed at `dist/base.css:59` (`@media (prefers-reduced-motion: reduce)`).
  - [STRUCTURE] **No live preview/specimen** — unlike colors/typography/icons (which use `<ColorPalette/>`/`<TypeScale/>`/`<IconGallery/>`), motion has no demo component. Shortest foundation page; an animation foundation benefits from a visible easing/duration demo.
  - [MISSING] The code sample (`:15-17`) uses `duration-[var(--duration-fast)]` arbitrary syntax but the `--transition-duration-fast` bridge (`theme.css:261-263`) would enable a cleaner `duration-fast` utility — page doesn't mention it. Minor.
- **Verdict:** Minor (accurate but thinnest, no live demo). **Effort: M** to add a motion specimen.

### apps/docs/content/docs/utilities/shimmer.mdx
- **Purpose / sections:** Animated text shimmer. Sections: Installation, Usage, Examples (8 variants), Classes table, Accessibility, DoDont.
- **GAPS:**
  - [API] **VERIFIED ACCURATE** — every documented class exists as a real `@utility` in `dist/utilities.css`: `shimmer` (`:472`), `shimmer-once` (`:513`), `shimmer-reverse` (`:517`), `shimmer-none` (`:521`), `shimmer-color-*` (`:526`), `shimmer-duration-*` (`:535`), `shimmer-spread-*` (`:539`), `shimmer-angle-*` (`:544`). Defaults documented (duration `2000`, angle `20`) match the impl. The Classes table (`:89-98`) is complete and correct.
  - [PROSE] **VERIFIED ACCURATE** — `@import "@vegastack/tokens/utilities.css"` (`:20`) matches the real export (`packages/tokens/package.json:25` `"./utilities.css": "./dist/utilities.css"`). "ship with `@vegastack/tokens` — no `shadcn add`" claim is correct.
  - [STRUCTURE] Examples reference `<ComponentPreview name="..." file="components/preview/utilities.tsx" />` (8 of them) — NOT audited here (preview wiring is out of this batch's scope), but the named previews (`shimmer`, `shimmerWithMarker`, `shimmerColor`, `shimmerDuration`, `shimmerSpread`, `shimmerAngle`, `shimmerReverse`, `shimmerOnce`, `shimmerRtl`) should be confirmed to exist in that file by the component batch.
- **Verdict:** Complete (API-accurate). **Effort: S**.

### apps/docs/content/docs/utilities/scroll-fade.mdx
- **Purpose / sections:** Mask-based edge fades. Sections: Installation, Usage, Examples (Horizontal/Single-edge/Fixed-size), Classes table, Notes, DoDont.
- **GAPS:**
  - [API] **VERIFIED ACCURATE** — documented classes all exist as `@utility` in `dist/utilities.css`: `scroll-fade` (`:83`), `scroll-fade-y` (`:123`), `scroll-fade-x` (`:163`), `scroll-fade-t` (`:212`), `scroll-fade-b` (`:242`), `scroll-fade-l` (`:275`), `scroll-fade-r` (`:305`), `scroll-fade-s` (`:338`), `scroll-fade-e` (`:376`), `scroll-fade-*` (`:417`), `scroll-fade-none` (`:442`). Classes table (`:59-67`) is complete and correct.
  - [API] **INCOMPLETE (minor)** — the impl ALSO ships **per-edge sized** utilities `scroll-fade-t-*` (`:422`), `scroll-fade-b-*` (`:427`), `scroll-fade-s-*` (`:432`), `scroll-fade-e-*` (`:437`) that the Classes table does NOT list. The table only shows the global `scroll-fade-*` depth. Correction: add the four per-edge sized variants to the table.
  - [PROSE] **VERIFIED ACCURATE** — scroll-driven `animation-timeline: scroll()` + static fallback claim (`:71-72`) matches the `@keyframes scroll-fade-reveal-*` + fallback structure in utilities.css. Cross-link to Message Scroller (`:74`) is valid (component page exists).
  - [STRUCTURE] `utilities/meta.json` has a `---Utilities---` divider as the FIRST entry — a redundant section label inside the already-titled "Utilities" section. Cosmetic.
- **Verdict:** Minor (one missing class family in the table). **Effort: S**.

---

## Current navigation structure (verbatim summary of all meta.json)

**Root — `content/docs/meta.json`:**
```json
{ "title": "VegaStack Design", "root": true,
  "pages": ["index", "install", "...foundations", "...components", "...utilities"] }
```
→ Top-level order: **index → install → Foundations → Components → Utilities**. Only THREE content sections exist.

**`content/docs/foundations/meta.json`:**
```json
{ "title": "Foundations", "pages": ["colors", "typography", "icons", "motion"] }
```
→ 4 pages, no sub-dividers.

**`content/docs/utilities/meta.json`:**
```json
{ "title": "Utilities", "pages": ["---Utilities---", "shimmer", "scroll-fade"] }
```
→ 2 pages + 1 redundant `---Utilities---` divider (label duplicates the section title).

**`content/docs/components/meta.json`:** `title: "Components"`, **68 component entries + ONE divider**. The order is roughly: button → toggle/toggle-group → badge/alert → form inputs (input, textarea, field, label, checkbox, switch, radio-group, slider, select) → overlays (dialog, alert-dialog, popover, tooltip, dropdown-menu) → tabs/breadcrumb/accordion/collapsible → card/avatar/kbd/skeleton/spinner/progress/separator/empty-state → sheet/hover-card/context-menu/pagination/scroll-area/table → status-icon/progress-indicator/truncated-text → icon-button/copy-button/password-input/otp-input/split-button/field-inline/relative-time/settings-row/image/notification-bell/markdown-view/toast/command/page-header/sidebar/filter-bar/auto-save-input/country-select/state-select/date-picker/color-picker/emoji-picker/data-list/text-edit → **`---Communication---`** → marker/message/bubble/message-scroller.

**Integrity check (verified):** every `components/meta.json` entry maps 1:1 to an existing `.mdx` file — **no orphan pages, no broken nav entries**. Note `meta.json` uses `"toast"` (`:55`); the prompt's 68-list calls it `sonner(toast)` — same component, the page slug is `toast`.

**Structural assessment:** The taxonomy is **effectively flat**. A loose role-ordering exists by position (forms cluster early, overlays mid, etc.) but there are **no group headers** — 64 of 68 components render as one undivided scroll. Only the 4 chat components are explicitly grouped (`---Communication---`). For a 68-component library this is a real navigation/findability problem.

---

## PROPOSED SECTION TAXONOMY (all 68 components)

Implement via `---Group Name---` dividers in `components/meta.json` (the existing divider mechanism), or split into sub-folders each with their own `meta.json`. Recommended section order top-to-bottom, components ordered most-common-first within each:

**1. Buttons & Actions** — `button`, `icon-button`, `split-button`, `copy-button`, `toggle`, `toggle-group`
*Rationale: primary interactive triggers; what a consumer reaches for first.*

**2. Forms & Inputs** — `input`, `textarea`, `password-input`, `otp-input`, `auto-save-input`, `text-edit`, `field`, `field-inline`, `label`, `slider`
*Rationale: text-entry + field-wrapping primitives.*

**3. Selection Controls** — `checkbox`, `radio-group`, `switch`, `select`, `country-select`, `state-select`
*Rationale: bounded-choice inputs (toggle/toggle-group could also live here, but read as actions).*

**4. Pickers** — `date-picker`, `color-picker`, `emoji-picker`
*Rationale: specialized popover-driven value pickers.*

**5. Overlays** — `dialog`, `alert-dialog`, `sheet`, `popover`, `hover-card`, `tooltip`
*Rationale: floating/portalled surfaces.*

**6. Menus & Commands** — `dropdown-menu`, `context-menu`, `command`
*Rationale: actionable menu surfaces / command palette.*

**7. Navigation** — `breadcrumb`, `pagination`, `tabs`, `sidebar`, `page-header`, `filter-bar`
*Rationale: wayfinding + page-level chrome.*

**8. Disclosure** — `accordion`, `collapsible`
*Rationale: expand/collapse content regions.*

**9. Layout & Structure** — `card`, `separator`, `scroll-area`, `settings-row`
*Rationale: containers and structural dividers.*

**10. Data Display** — `table`, `data-list`, `avatar`, `image`, `kbd`, `badge`, `marker`, `relative-time`, `truncated-text`
*Rationale: rendering values/content (marker/relative-time/truncated-text are content-display helpers).*

**11. Feedback & Status** — `alert`, `toast` (sonner), `progress`, `progress-indicator`, `spinner`, `skeleton`, `status-icon`, `empty-state`, `notification-bell`
*Rationale: loading/empty/status/notification states.*

**12. Content & Typography** — `markdown-view`
*Rationale: rich-text rendering. (Could fold into Data Display if a one-item section feels thin.)*

**13. Chat & Communication** — `message`, `bubble`, `message-scroller`
*Rationale: the existing `---Communication---` group; `marker` was moved to Data Display since it's a generic indicator, not chat-specific — confirm with maintainers since it's currently grouped under Communication.*

**Notes on the proposal:**
- This regroups all 68 into 13 sections; every one of the prompt's 68 components is placed exactly once.
- `marker` reassignment (Communication → Data Display) is the one judgment call — flag for owner confirmation.
- If 13 sections feel heavy, merge **Pickers→Selection Controls**, **Disclosure→Layout**, and **Content→Data Display** to land at ~10 sections.
- Top-level docs order should become: **index → install → Foundations → Components (grouped) → Utilities**, optionally adding a **Guides** and **Resources** top-level later (see below).

---

## Missing foundational pages worth adding

These tokens/concepts already exist in the implementation (or are standard for a design system) but have **no documentation page**:

- **[MISSING] Radius** — `--radius (0.75rem)`, `--radius-sm/md/lg`, `--radius-xl` all ship in `theme.css:76-79` + bridge `:219-222`. **Zero docs.** High value, low effort.
- **[MISSING] Elevation / Shadow** — `--shadow-overlay` ships in `theme.css:83` + bridge `:223`. The system is "borders-only, one shadow for overlays" per the design brief — worth a short page documenting the single sanctioned shadow.
- **[MISSING] Spacing & Layout** — the 4px spacing scale is a documented design principle but has no page; utilities reference `var(--spacing)`. A spacing/sizing scale page is standard.
- **[MISSING] Theming & Dark Mode** — the one-file `--primary` override is the headline feature (mentioned only inside `colors.mdx`). Deserves its own page: how `.dark` works, `@theme inline` bridge, building a custom theme, `<MotionConfig>`/reduced-motion.
- **[MISSING] Accessibility** — AGENTS.md mandates WCAG 2.1 AA, `:focus-visible`, axe-clean, every UI state. No overview page stating the a11y contract consumers inherit.
- **[MISSING] Design Principles** — the "neutral primary, rationed purple accent, serif headings never bold, borders-only" philosophy is enforced in lint but never written down for consumers.
- **[MISSING] Changelog / Releases** — `RELEASING.md` exists for maintainers; consumers have no in-docs changelog or "what's new / version" page despite the copy-in-update workflow being central.
- **[MISSING] Type scale** — (see typography findings) numeric size/line-height ramp not documented.
- **[MISSING] Getting Started / Guides** top-level section — `install` is the only onboarding page; a "first component" walkthrough + "consuming updates" guide would round it out.

**Also fix (cross-cutting):**
- [PROSE] Update **"64 components" → "68"** in BOTH `index.mdx:6` and `app/(home)/page.tsx:8`.
- [STRUCTURE] Remove the redundant `---Utilities---` divider in `utilities/meta.json` (duplicates the section title), OR keep dividers consistent by adding role dividers to Foundations + Components too.
- [API] Add `scroll-fade-{t,b,s,e}-*` per-edge sized variants to the scroll-fade Classes table.
