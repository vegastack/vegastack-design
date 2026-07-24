# Preview toolbar fullscreen + PropsPlayground rollout — 2026-07-16

MK directive: fullscreen preview toggle + a props playground on **every component where one is
meaningful, covering all variant axes to the maximum** — nothing deferred. This file is the PG0
classification (all 83 `registry:ui` components assessed from extracted CVA axes + union/boolean
prop surfaces, verified against canonical source by the authoring agents).

## Infrastructure changes

- `preview-controls.tsx` gains `FullscreenToggle` — CSS overlay mode (`fixed inset-0
z-(--z-overlay) bg-background`, Esc + close, body scroll-lock). Deliberately NOT native
  `requestFullscreen()`: Base UI portals popups to `document.body`, which a natively-fullscreened
  element would hide. Composes with the width toggle (fullscreen + mobile = device frame).
- `motion.mdx` gains the plain-language "Motion at a glance" table (utility → what it looks like →
  where it's used → how to trigger it).
- `skills/design-system/SKILL.md` Button line corrected to **15 variants** (the 4 `*-outline`
  compound intents + `cta` were miscounted as 11 in the previous resync).

## Playgrounds — 45 components (44 new + Button expanded)

| Group                    | Components                                                                                                                                                                                                                   | Axes covered                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Form                     | checkbox, switch, radio-group, input, textarea, field, field-inline, select, combobox                                                                                                                                        | size/orientation axes + disabled/invalid/readOnly/borderless/autoGrow/required switches |
| Display 1                | badge, avatar, spinner, kbd, status-icon, skeleton, card, separator, image                                                                                                                                                   | every CVA axis (badge 3×5×3 + dot/loading/animateIn; image ratio×rounded; kbd os; …)    |
| Display 2 / data         | empty (5 axes), item, attachment, progress, progress-indicator, truncated-text, relative-time, animated-number, scroll-area                                                                                                  | full CVA + value/mode/duration selects so tweens/states are visible                     |
| Overlay / nav / feedback | dialog (size), sheet (side), tooltip (side+arrow), popover (side+arrow), tabs (variant+orientation), pagination (link size), toast (intent, fire-button), alert (intent+hideIcon+dismissable), notification-bell (count+dot) |                                                                                         |
| Actions / chat / misc    | **button (expanded: all 15 variants × 8 sizes incl icon-\*)**, icon-button, copy-button, split-button, toggle, toggle-group, otp-input (mask+length), resizable (direction+handle), bubble (7 variants+align+animateIn)      |                                                                                         |

`animateIn` components key-remount the rendered node per state change so toggling replays the
entrance animation live.

## Skipped — with reasons (the other 38)

- **Menus (dropdown-menu, context-menu, command):** no root-level axes — `variant`/`inset` are
  per-item composition props; menu content is authored structure, not a prop matrix.
- **Overlay near-duplicates (alert-dialog, hover-card):** alert-dialog's only axis is `loading`
  (already in its States demo; dialog playground owns overlay sizing); hover-card is
  hover-triggered (awkward in a controls frame) and popover covers the same positioning axes.
- **Single-trivial-axis (label, slider, date/color/emoji pickers, country/region-select,
  password-input, auto-save-input, text-edit):** only `disabled`-class booleans or internal
  behavioral state; existing state demos already show them.
- **Composition/layout-scale (sidebar, app-shell, page-header, breadcrumb, settings-row,
  data-list, filter-bar, table, chart, accordion, collapsible, markdown-view, scroll-fade-less
  pages):** their "props" are authored children/structure; dashboard-01 + their demos are the
  right showcase. Chart's `indicator` axis is tooltip-hover-only — invisible in a static frame.
- **Marketing family (marketing-surface, section-header, figure-frame, terminal, logo-row,
  testimonial, staggered-text-reveal, particle-field) + chat marker/message:** marketing renders
  inside the `.vs-marketing` dark scope (a product-UI playground would misrepresent it);
  marker/message variants are covered by the bubble playground + composed chat demos.

## Gate

Docs-only change set (no canonical/registry edits → no `registry:build`): `pnpm lint`,
`pnpm typecheck`, `pnpm test`, content-lint, then full VRT delete-then-regen for affected pages
(toolbar button changes every preview page; Playground sections change 45 pages) with diff review.
