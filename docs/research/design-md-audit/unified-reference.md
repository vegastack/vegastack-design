# Unified design reference

This document reconciles the current VegaStack contract with the three approved external references.
It does not reopen project decisions: the DTCG sources, `AGENTS.md`, and the human doctrine in
`design.md` remain authoritative. External guidance is adopted only where it strengthens that contract.

## Source keys

| Key             | Snapshot                                              | Integrity and license record                                     |
| --------------- | ----------------------------------------------------- | ---------------------------------------------------------------- |
| `VERCEL-DESIGN` | `docs/research/design-md-references/Vercel_DESIGN.md` | `source-manifest.json` → `vercel-design-md`                      |
| `KUMO`          | `sources/kumo-design.SKILL.md`                        | `source-manifest.json` → `cloudflare-kumo-design` (MIT)          |
| `VERCEL-WIG`    | `sources/vercel-web-interface-guidelines.command.md`  | `source-manifest.json` → `vercel-web-interface-guidelines` (MIT) |

Disposition vocabulary is exact: **adopt** adds the source rule unchanged in intent; **adapt** keeps the
intent but binds it to VegaStack tokens or a locked divergence; **reject** records a conflicting source
rule that must not leak into VegaStack; **already-covered** means the rule was already explicit and no
doctrine change was needed.

## Stable rule ledger

IDs are append-only. Do not renumber an existing `VS-*` ID when adding or retiring guidance.

### Content and typography

| ID               | VegaStack rule                                                                                                                                                                      | Provenance and disposition                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `VS-CONTENT-001` | Use sentence case for headings, controls, labels, and messages; preserve product-name casing.                                                                                       | `KUMO/heading-case` — **adopt**. `VERCEL-WIG/Content & Copy: Title Case` — **reject** because it conflicts with the locked voice. |
| `VS-CONTENT-002` | Use active, specific verb+noun actions; errors include a next step; loading uses the ellipsis character.                                                                            | `VERCEL-WIG/Typography + Content & Copy` — **already-covered** by Voice & content.                                                |
| `VS-TYPE-001`    | Product content defaults to 14px; documentation prose defaults to 16px through the scoped product/doc ladders.                                                                      | `KUMO/content-text-size` — **adapt**: 14px is adopted for product chrome, while the locked Fumadocs reading surface remains 16px. |
| `VS-TYPE-002`    | Weight roles are named: 400 default, 500 labels/h4, 600 rare deliberate emphasis; never use 700/bold as UI hierarchy.                                                               | `KUMO/font-weight` — **adapt** to VegaStack’s lighter locked hierarchy rather than Kumo’s semibold heading default.               |
| `VS-TYPE-003`    | Tracking is role-owned: copy stays default, `text-label` owns −0.01em, display roles own their negative tracking, and `text-mono-label` owns +0.05em. No ad-hoc tracking utilities. | `KUMO/font-tracking` — **adapt**: reject arbitrary local tracking while retaining the audited named roles.                        |
| `VS-TYPE-004`    | Inline monospace is optically smaller than surrounding body copy; use `text-code`/`text-code-sm`, not a one-off size.                                                               | `KUMO/inline-monospace-size` — **already-covered** by the 13px/12px mono roles against 14px product copy.                         |
| `VS-SPACE-001`   | Related heading/body text is closer together than the surrounding section or action.                                                                                                | `KUMO/related-text-spacing` — **adopt**.                                                                                          |
| `VS-SPACE-002`   | Account for line height optically; vertical padding may be smaller than horizontal padding.                                                                                         | `KUMO/text-spacing` — **adopt** through named recipes and the 4px scale.                                                          |

### Colour, shape, and elevation

| ID                   | VegaStack rule                                                                                                                                    | Provenance and disposition                                                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VS-COLOR-001`       | Use resolved semantic DTCG tokens in both co-primary themes; never copy external palette literals.                                                | `VERCEL-DESIGN/colors` — **adapt** from a one-theme reference into VegaStack’s generated symmetric light/dark model.                                                                                                  |
| `VS-INTERACTION-001` | Hover, active, and focus colour changes are immediate; never animate colour for a fast interaction.                                               | `KUMO/hover-color-transitions` — **adopt**. `VERCEL-WIG/Hover & Interactive States` — **already-covered** for the required feedback state.                                                                            |
| `VS-SHAPE-001`       | The only radius values are 2, 6, 8, 12, and full. `radius-xs` and the rationed marketing `radius-sharp` are separate roles at the same 2px value. | `VERCEL-DESIGN/rounded` — **adapt** to the locked tighter scale; external 16px+ container radii are **reject**.                                                                                                       |
| `VS-SHAPE-002`       | When nested edges are at most 8px apart, use concentric corners: outer radius = inner radius + padding.                                           | `KUMO/concentric-border-radius` — **adopt**, expressed with the nearest named VegaStack radii.                                                                                                                        |
| `VS-ELEVATION-001`   | Surfaces stay flat. Only overlays use `shadow-overlay`; only primary actions use `shadow-lit`. No generic elevation ladder.                       | `VERCEL-DESIGN/shadows` — **adapt** from three elevation tiers to two named roles. `KUMO/shadow-borders` — **reject** literally: VegaStack overlays intentionally combine the one solid border with `shadow-overlay`. |
| `VS-SURFACE-001`     | Sticky regions use the one `border` token to separate from scrolling content.                                                                     | `KUMO/sticky-borders` — **already-covered** by the one-border doctrine; made explicit here.                                                                                                                           |
| `VS-SURFACE-002`     | Do not nest card-like elevated containers merely to create hierarchy; group content and use spacing/surface roles.                                | `KUMO/layer-card-nesting` — **adopt** with `Card`/panel terminology.                                                                                                                                                  |

### Interaction, motion, and overlays

| ID               | VegaStack rule                                                                                                                                                      | Provenance and disposition                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `VS-FOCUS-001`   | Focus is neutral: a 2px `:focus-visible` outline using `ring = primary`, except text-entry fields use the named neutral border tint. Never use a chromatic or glow. | `VERCEL-DESIGN/focus` and `VERCEL-WIG/Focus States` — **adapt**: visible focus is adopted; Vercel’s blue/two-layer treatment is **reject**. |
| `VS-MOTION-001`  | Honor `prefers-reduced-motion`; list animated properties explicitly and never use `transition: all`.                                                                | `VERCEL-WIG/Animation` — **already-covered** by motion tokens, reset, and lint.                                                             |
| `VS-MOTION-002`  | Prefer transform/opacity. Size animation is allowed only when geometry communicates state, with stable inner content and no closing reflow.                         | `VERCEL-WIG/Animation` + `KUMO/collapse-content-size` — **adapt** to sanctioned disclosure/resizable engines.                               |
| `VS-OVERLAY-001` | Keep dialog roots mounted and drive visibility through `open`/lifecycle state so entry and exit semantics run.                                                      | `KUMO/dialog-rendering` — **adapt** to Base UI lifecycle ownership.                                                                         |
| `VS-OVERLAY-002` | Dialogs, sheets, and drawers contain overscroll; auto-focus is desktop-only and justified.                                                                          | `VERCEL-WIG/Touch & Interaction` — **adopt**.                                                                                               |

### Responsive layout, touch, and internationalization

| ID              | VegaStack rule                                                                                                                                                                    | Provenance and disposition                                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `VS-LAYOUT-001` | Every layout works mobile through desktop using CSS layout/container queries; truncating flex children use `min-w-0`, with truncation on an inner non-flex span.                  | `VERCEL-WIG/Content Handling + Safe Areas & Layout` — **already-covered**, consolidated with project lint rules.                   |
| `VS-LAYOUT-002` | Full-bleed fixed/sticky layouts consume safe-area insets and must not hide controls or create accidental horizontal scroll.                                                       | `VERCEL-WIG/Safe Areas & Layout` — **adopt**.                                                                                      |
| `VS-TOUCH-001`  | Interactive targets meet WCAG 2.2 AA’s 24×24px minimum or spacing exception; prefer 44×44px for primary mobile actions and verify invisible hit areas with a real boundary probe. | `VERCEL-WIG/Touch & Interaction` — **adapt** to the locked target model and repository probe requirement.                          |
| `VS-RTL-001`    | Use logical properties/start-end alignment; mirror directional affordances and test navigation, mixed scripts, numbers, and long localized labels in RTL.                         | `VERCEL-WIG/Locale & i18n` — **adapt**: `Intl.*`/language handling is adopted and explicit bidirectional layout coverage is added. |
| `VS-I18N-001`   | Format dates, time, numbers, and currency with `Intl.*`; protect brands/code identifiers with `translate="no"`.                                                                   | `VERCEL-WIG/Locale & i18n` — **adopt**.                                                                                            |

### Accessibility, icons, forms, and robustness

| ID              | VegaStack rule                                                                                                                                                        | Provenance and disposition                                                                                    |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `VS-A11Y-001`   | WCAG 2.2 AA is the contract in both themes; contrast and token resolution fail closed.                                                                                | `VERCEL-DESIGN/accessibility` — **adapt** from WCAG 2.1-era guidance to 2.2 AA.                               |
| `VS-A11Y-002`   | Use semantic elements first; labels, accessible names, skip links, heading order, alt text, live regions, and keyboard behavior are mandatory where applicable.       | `VERCEL-WIG/Accessibility` — **already-covered** by component rules and axe; retained as the audit checklist. |
| `VS-ICON-001`   | Use the sanctioned icon libraries through `Icon`/`BrandIcon`, currentColor, and the named 12/14/16/20/24 size roles.                                                  | Local locked decision — **already-covered**.                                                                  |
| `VS-ICON-002`   | With wrapping text, align an optically text-sized icon to the first line using an `items-start` row and line-height wrapper.                                          | `KUMO/icon-alignment` — **adopt**.                                                                            |
| `VS-FORM-001`   | Controls have clickable labels, meaningful names, correct type/inputmode/autocomplete, paste remains available, and submit disables only after work starts.           | `VERCEL-WIG/Forms` — **adopt** where not already enforced by Base UI.                                         |
| `VS-ROBUST-001` | Empty, short, average, and very long content remain usable; media reserves dimensions; large lists virtualize; hydration mismatches are fixed rather than suppressed. | `VERCEL-WIG/Content Handling + Images + Performance + Hydration Safety` — **adopt** as verification guidance. |
| `VS-STATE-001`  | Stateful filters/tabs/pagination are deep-linkable where durable navigation state is expected; destructive actions provide confirmation or undo.                      | `VERCEL-WIG/Navigation & State` — **adapt**: ephemeral local disclosure state need not enter the URL.         |

## Machine contract

`tooling/sync-design-md.mjs` resolves the complete semantic light model and the dark override model with
the same Style Dictionary hooks used by the token build, inherits theme-independent values into dark,
serializes deterministic YAML, and preserves the human doctrine below the frontmatter. The public copy
at `apps/docs/public/design.md` must byte-match the root. `--check` validates JSON/YAML parseability,
source snapshot hashes, generated drift, and public-copy parity without writing files.
