---
name: vegastack-design-system
description: Use when building product UI with VegaStack components — which component to pick, the token reference, composition patterns, and do/don't heuristics. Load before generating component code.
metadata:
  author: vegastack
  version: "0.2.0"
---

# VegaStack Design System — use-the-system

The skill downstream agents load to build correctly with `@vegastack/*`.

## Component selection (83 components + 2 hooks + 1 block)

Query the registry first: `pnpm dlx shadcn@latest list @vegastack` (or the shadcn MCP) — 525 items
total (the 440 `icon-<name>` items are the animated-icon mirrors). Categories:

- **Actions** — `button` (15 variants × 8 sizes + loading + `render`), `icon-button`, `copy-button`,
  `split-button`, `toggle`, `toggle-group`.
- **Form** — `input`, `textarea`, `field` (label+desc+error, RHF `Controller`), `field-inline`,
  `label`, `checkbox`, `switch`, `radio-group`, `slider`, `select`, `combobox`, `country-select`,
  `region-select`, `date-picker`, `color-picker`, `emoji-picker`, `password-input`, `otp-input`,
  `auto-save-input`.
- **Display** — `badge`, `avatar`, `card`, `empty`, `item`, `kbd`, `status-icon`, `progress-indicator`,
  `skeleton`, `spinner`, `truncated-text`, `animated-number`, `separator`, `progress`, `collapsible`,
  `accordion`, `relative-time`, `table`, `markdown-view`, `scroll-area`.
- **Overlay** — `dialog`, `alert-dialog`, `sheet`, `popover`, `tooltip`, `hover-card`, `dropdown-menu`,
  `context-menu`.
- **Navigation** — `tabs`, `breadcrumb`, `pagination`, `page-header`, `sidebar`, `command`.
- **Data** — `data-list`, `filter-bar`, `chart`. **Feedback** — `alert`, `sonner` (toast). **Layout** —
  `settings-row`, `resizable`, `app-shell` (compose it — don't hand-roll a sidebar+header+main shell).
  **Media** — `image`, `notification-bell`, `attachment`. **Rich text** — `text-edit` (base; collab deferred).
- **Chat** — `marker`, `message`, `bubble`, `message-scroller`.
- **Marketing** (`.vs-marketing` scope only, never product UI) — `marketing-surface`, `section-header`,
  `figure-frame`, `terminal`, `logo-row`, `testimonial`, `staggered-text-reveal`, `particle-field`,
  plus Button's `cta` variant.
- **Hooks** — `use-mobile`, `use-animation-replay`. **Block** — `dashboard-01` (copy-once starter;
  consumer-owned after install, not update-tracked).

Use each item's `meta.whenToUse` / `whenNotToUse` to disambiguate (primary vs ghost vs destructive, etc.).

## Tokens

Semantic CSS vars from `@vegastack/design-tokens/theme.css` (OKLCH, `:root` + `.dark`). Use the utilities:
`bg-background`/`text-foreground`, `bg-card`/`bg-popover`, `bg-primary`/`text-primary-foreground`,
`bg-secondary`/`bg-muted`/`bg-accent`, status `bg-destructive|success|warning|info` (soft tints via
`bg-{family}-subtle` or an `--alpha-*` modifier — never a raw `/NN`), `border-border`/`border-input`
(no rings — focus is the native outline, or a `focus:border-…` tint on text fields), `bg-sidebar-*`,
`--brand` (phosphor accent, marker roles only), radius `rounded-{xs,sm,md,lg}` + the marketing
`rounded-(--radius-sharp)` (`xl` is removed and lint-banned), fonts `font-{sans,mono,serif}`,
easing `ease-{standard,emphasized,exit,spring}` paired with `duration-{fast,base,slow}` (named
utilities — arbitrary `duration-[…]` is lint-banned), mount animations via `motion-pop-in`/
`motion-enter-up`/`motion-shake`.

**Override model:** redefine one runtime var (`--primary: oklch(...)`) in the consumer's global CSS →
every component repaints (light + dark). Never override `--color-*` (the build-inlined bridge).

## Composition patterns
- Forms: Base UI `Field` + react-hook-form `Controller` + Zod 4 (`z.email()`); `Field.Control` emits
  `onValueChange`. See `field`'s docs.
- Overlays: enter/exit via `data-starting-style`/`data-ending-style`; portal + positioner; the providers
  (theme/toast/tooltip/direction) come from `<VegaStackProvider>`.
- Compound parts: import flat (`DialogTrigger`, `DialogContent`) — RSC-safe; `<Dialog.Trigger>`
  sub-property access only works inside `'use client'` files.

## Do / Don't
- **Do** use semantic tokens, `render` for polymorphism, `Icon`/`BrandIcon`, every UI state.
- **Don't** hardcode hex/px, use raw palettes, pull other icon libraries, or set `outline-none` without
  an alternative focus affordance (the system has no rings — native outline, or the text-entry
  `focus:border-…` tint).

Deeper reference: `design.md` (the design canon), `docs/ledger/component-matrix.md` (per-component
status), and each component's MDX page in `apps/docs/content/docs/components/`.
