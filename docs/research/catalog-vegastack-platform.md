# Catalog — `engg-vegastack-platform` component layer (full)

> Durable reference. Source: `/Users/kmanojkumar/code/engg-vegastack-platform`, read 2026-06-20. This is the **source material for the ~50-component port** and the exact token values to migrate into `@vegastack/tokens`. Preserve in full.

## Stack & tooling (from package.json)
- **Next.js** `^16.2.6`, **React** `19.2.0`, **TypeScript** `5.9.3`, pnpm `10.28.2`.
- **Deploy:** OpenNext + Cloudflare — `@opennextjs/cloudflare ^1.19.10`; `open-next.config.ts` uses `r2IncrementalCache`.
- **Tailwind v4** (`@tailwindcss/postcss ^4`, no config file, CSS `@theme`), `@tailwindcss/typography ^0.5.19`, PostCSS 8.5.15.
- **UI:** `radix-ui ^1.4.3` (unified pkg, not individual `@radix-ui/*`), `class-variance-authority ^0.7.1`, `clsx ^2.1.1`, `tailwind-merge ^3.4.0`, Radix Slot. `components.json` style = **`radix-nova`**, baseColor neutral, cssVariables true, iconLibrary lucide; already consumes an external registry `@lucide-animated`.
- **Icons:** `lucide-react ^0.555.0` (only; @tabler forbidden).
- **Rich text:** Tiptap `3.20.5` full suite (core/react/extensions/starter-kit + blockquote, bold, code, code-block, collaboration, drag-handle-react, file-handler, floating-menu, heading, highlight, image, italic, link, list, mention, placeholder, strike, sub/superscript, table, task-list, typography, underline, `@tiptap/markdown`, `@tiptap/y-tiptap ^3.0.4`, suggestion).
- **Other:** Sonner `^2.0.7`, next-themes `^0.4.6`, next-intl `^4.12.0`, cmdk `^1.1.1`, framer-motion `^12.23.26`, `@floating-ui/dom`, `@dnd-kit/{core,sortable,utilities}`, date-fns `^4.1.0`, react-day-picker `^9.14.0`, emoji-picker-react `^4.18.0`, input-otp `^1.4.2`, Zod `^4.1.13`, Zustand `^5.0.9`, `@tanstack/react-query ^5.90.20`, AI SDKs (`@ai-sdk/google`, `@ai-sdk/openai`, `ai ^6`), shiki `^4.2.0`, lowlight, remark-{parse,stringify,gfm,frontmatter}, dompurify `^3.4.5`, nanoid, unicode-emoji-json.

## Component layers
```
src/components/
  ui/         # 40 shadcn primitives (radix-nova) — DO NOT EDIT, extend via common/
  common/     # ~50 Vega* wrappers (all CVA) — the real design system
  logos/  providers/  theme-provider.tsx  client-only.tsx  CLAUDE.md
src/lib/utils.ts          # cn() = twMerge(clsx(...))
src/lib/component-meta.ts  # PropMeta, ComponentMeta, defineProps (showcase props system)
```

### `src/components/ui/` — 40 shadcn primitives
alert, avatar, badge, button, calendar, card, checkbox, collapsible, command(cmdk), dialog, drawer(vaul), dropdown-menu, empty, field, hover-card, input, input-otp, kbd, label, popover, scroll-area, select, separator, sheet(vaul), shortcuts-dialog, sidebar, skeleton, spinner, switch, table, tabs, textarea, toggle, toggle-group, tooltip, breadcrumb, auth-wrapper, brand-logo-header, sonner. Most wrap Radix (unified pkg); badge/card/empty/field/kbd/breadcrumb are div-based.

### `src/components/common/` — ~50 Vega wrappers
**Primary (mandatory in app code):**
| Component | Features |
|---|---|
| VegaButton | 11 variants (default, secondary, outline, ghost, link, glass, destructive, success, warning, info, +outline versions), 8 sizes (xs, sm, default, lg, icon-*), loading spinner, icon support, kbd shortcut display (OS-aware ⌘/Ctrl), dropdown split-menu |
| VegaBadge | 3 variants (outline, solid, minimal), **dynamic `color-mix()` for unlimited colors** from CSS vars, 4 sizes, dot indicator, loading, icon, preset+Tailwind palette |
| VegaField | vertical/horizontal orientation, label + inline labelAction, error/success msg, description, borderless, gap-2, child-input styling via `[data-slot]` selectors |
| VegaInput | prefix mode (e.g. "app.vegastack.com/"), error/disabled, all input types, wraps `<Input>` |
| VegaTextarea | rich (Tiptap+markdown) or plain, compact/inline, toolbar slots, onSubmit, auto-grow |
| VegaTextEdit | full Tiptap editor: slash commands, bubble menu, @mentions, emoji, markdown I/O, inline variant, Yjs collab-ready |
| VegaMarkdownView | static render: interactive task checkboxes, code highlight, blockquotes, @mentions, DOMPurify |
| VegaDatePicker | single/range, presets (Today/Tomorrow/Last 7d…), DOB dropdown, integrates VegaField |
| VegaDialog | 5 sizes (xs, sm, default, lg, full), mobile drawer (vaul), header/footer styling, kbd nav |
| VegaAlertDialog | 4 intents (default, destructive, success, warning), confirm/cancel auto-layout |
| VegaDropdownMenu | actions array, destructive variant, custom trigger, sub-menus, separators, shortcuts, a11y |
| VegaCommand | single/multi-select, grouped, search/filter, icons, kbd nav |
| VegaPageHeader | back nav, breadcrumb (ellipsis collapse), actions row, secondary menu, centered, favorite star |
| VegaTooltip | smart delay, kbd display, rich content, button action, staggered reveal |
| VegaAvatar | auto R2 URL resolution, 3 sizes, group/stack, badge overlay, tooltip |

**Extended:** VegaEmptyState (3 intents, dashed border) · VegaTabs (line+pill, icons, count badges, vertical) · VegaHoverCard (4 dirs, +User/Agent/Team variants) · VegaAlert (5 variants, dismissable, actions) · VegaSkeleton (lines/circles/tables/cards) · VegaProgressIndicator (pie-fill: circle/squircle, 3 sizes) · VegaStatusIcon (todo/progress/blocked/done) · VegaColorPicker (14-color grid, Tailwind palette, CSS-var output) · VegaFilterBar (removable chips, sub-dropdown, AI query input) · VegaScroll (macOS auto-hide, dual axis) · VegaDataList (row selection, sortable cols, board/Kanban, grouping, dnd-kit, loading, mobile-responsive) · VegaFieldInline (click-to-edit, borderless/bordered) · VegaEmojiPicker (theme-aware, skin-tone persist) · CopyButton · TruncatedText (single/multi + IconText + TableCellText) · PasswordInput (eye toggle, requirements) · SettingsRow/Card/Section · AutoSaveInput (debounced, validation, toast) · VegaUserHoverCard/AgentHoverCard/TeamHoverCard (ID → resolves name/email/avatar/role) · VegaRelativeDay · VegaTimeAgo · CommandMenu (⌘K singleton) · CountrySelect (240+ countries, flags) · StateSelect (country-aware) · R2Image · NotificationBell · OAuthIcons · VegaOTPInput · auth-showcase/.

## Design tokens (exact values — migrate to `@vegastack/tokens`)
`src/app/globals.css` (`@theme inline`) + `src/app/tailwind-palette.css` (`@theme static`). **OKLCH throughout.**

**Backgrounds:** `--background: oklch(1 0 0)` · `--foreground: oklch(14.5% 0 0)` · `--card: oklch(98.5% 0 0)` · `--card-foreground: oklch(14.5% 0 0)` · `--popover: oklch(1 0 0)` · `--popover-foreground: oklch(14.5% 0 0)`.
**Primary (near-black):** `--primary: oklch(20.5% 0 0)` · `--primary-foreground: oklch(98.5% 0 0)`.
**Secondary/muted/accent:** `--secondary: oklch(97% 0 0)` / `-foreground: oklch(20.5% 0 0)` · `--muted: oklch(97% 0 0)` / `-foreground: oklch(43.9% 0 0)` · `--accent: oklch(97% 0 0)` / `-foreground: oklch(20.5% 0 0)`.
**Semantic status:** `--destructive: oklch(50.5% 0.213 27.518)` (red-700) /fg `oklch(98.5% 0 0)` · `--success: oklch(52.7% 0.154 150.069)` (green-700) /fg `98.5%` · `--warning: oklch(55.5% 0.163 48.998)` (amber-700) /fg `oklch(41.4% 0.112 45.904)` · `--info: oklch(48.8% 0.243 264.376)` (blue-700) /fg `98.5%`.
**Overlay/border/input/ring:** `--overlay: oklch(0 0 0 / 50%)` · `--border: oklch(92.2% 0 0)` · `--input: oklch(87% 0 0)` · `--ring: oklch(78% 0 0)`.
**Charts:** `--chart-1: oklch(64.6% 0.222 41.116)` · `-2: oklch(60% 0.118 184.704)` · `-3: oklch(39.8% 0.07 227.392)` · `-4: oklch(82.8% 0.189 84.429)` · `-5: oklch(76.9% 0.188 70.08)`.
**Sidebar:** `--sidebar: oklch(98.5% 0 0)` · `-foreground: oklch(26.9% 0 0)` · `-primary: oklch(14.5% 0 0)` · `-primary-foreground: oklch(98.5% 0 0)` · `-accent: oklch(95.5% 0 0)` · `-accent-foreground: oklch(14.5% 0 0)` · `-border: oklch(92.2% 0 0)` · `-ring: oklch(50% 0.134 242.749)`.
**Radius:** `--radius: 0.625rem` (10px); sm = `calc(var(--radius) - 4px)`, md = `-2px`, lg = `var(--radius)`, xl = `+4px`.
**Palette (`tailwind-palette.css`):** full 22-family OKLCH scale (red…rose, 50–950) via `@theme static`.
**Dark mode** (`.dark{}`): bg → `oklch(17.5% 0 0)`; text inverts; borders/semantics toned for AA.

## Typography & utilities
- Fonts: `--font-sans` Geist Sans, `--font-mono` Geist Mono, `--font-lora` Lora serif (headings only).
- Headings (all serif, tracking-tight, **no bold/semibold** — serif weight carries hierarchy): h1 `text-xl sm:text-2xl`, h2 `text-base sm:text-lg`, h3 `text-sm sm:text-base`, h4 `text-sm`.
- Component classes: `.text-page-title/.text-section-title/.text-card-title/.text-body/.text-caption`.
- Status utilities: `.status-{success,warning,destructive,info,neutral}` = `bg-X/10 text-X border-X/20`.
- Spacing: 4px scale (gap-1..8). **Borders-only, no shadows.**
- Animations: `statusFadeIn`, `statusScaleIn`, `statusSpin`, `vegaAvatarAuroraDrift`, `vegaAvatarBlink`.
- Data attributes for styling: `data-slot`, `data-variant`, `data-state`, `data-size`, `data-disabled`.

## ⚠️ A11y defect to FIX (not carry forward)
`globals.css` base reset: `* { outline: none !important; }` and globally disabled focus states; cursor-pointer on all interactive, not-allowed on disabled. **The `outline: none !important` + killed focus is a WCAG keyboard-nav regression** — the locked system must use proper `:focus-visible` rings. (requirements §7.5)

## CVA pattern (carry over, formalized)
```ts
const vegaButtonVariants = cva("inline-flex items-center justify-center … outline-none", {
  variants: {
    variant: { default: "bg-primary text-primary-foreground hover:bg-primary/90", secondary: "…", outline: "border-border bg-background hover:bg-muted", /*…*/ },
    size: { xs: "h-6 gap-1 rounded-md px-2 text-xs", sm: "h-7 …", default: "h-8 gap-1.5 px-2.5", lg: "h-9 …" },
  },
  defaultVariants: { variant: "default", size: "default" },
});
type VegaButtonProps = React.ComponentProps<"button"> & VariantProps<typeof vegaButtonVariants>;
```
`cn()` = `twMerge(clsx(inputs))` in `src/lib/utils.ts`.

## Showcase (the page we productize)
Route `src/app/[locale]/components/`: overview gallery (cards: icon, name, description, variant count, feature tags, hover arrow) + ~40 **per-component pages** in dedicated dirs (each `page.tsx` server + `*-client.tsx`). Helpers in `_showcase-helpers/`: `SectionHeader`, `DemoRow`, `DemoGrid`, `OverviewSection`, `PropsTable`, `SourceLink`. Props metadata via `src/lib/component-meta.ts` (`defineProps`, `ComponentMeta`, `PropMeta`). Per-page structure: PageHeader+back → SectionHeader+source link → demo sections by variant (base/semantic/size/state) → PropsTable → guidelines.

**Verdict:** this is ~80% of a design system already — it just lives inside an app. The port = lift `common/` onto Base UI primitives, externalize tokens to `@vegastack/tokens`, productize the showcase as Fumadocs.
