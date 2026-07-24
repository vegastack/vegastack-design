# Part A — Section Taxonomy & Docs Restructure

> **APPROVED & APPLIED 2026-06-29.** Final taxonomy = **10 sections** (owner merged Selection Controls + Pickers into a renamed **Inputs & Controls**; folded Disclosure into Data Display; kept **Menus & Commands** as its own section). Order: Buttons & Actions · Inputs & Controls · Overlays · Menus & Commands · Navigation · Layout & Structure · Data Display (+ accordion/collapsible) · Feedback & Status · Content & Typography · Chat & Communication. The Part A edits — `components/meta.json`, `utilities/meta.json`, `index.mdx`, `app/(home)/page.tsx` — are DONE in the working tree. The "13-section" proposal below is the original; the applied `components/meta.json` reflects the approved 10-section version.

## Problem (verified)

- `content/docs/components/meta.json` is a **near-flat list of 68 components** with a **single** `---Communication---` divider near the bottom. **64 of 68 components render as one undivided scroll.** A loose role-ordering exists by position (forms cluster early, overlays mid) but there are no group headers — a real findability problem for a 68-component library.
- Only **3 top-level sections** exist: Foundations / Components / Utilities.
- Dividers are applied unevenly: Utilities has a redundant `---Utilities---` divider (duplicates the section title); Foundations has none; Components has one.
- Nav integrity is otherwise clean: **every `meta.json` entry maps 1:1 to an existing `.mdx`** — no orphans, no broken entries.

## Mechanism

Use the existing `---Label---` divider mechanism in a **single flat `components/meta.json`**. This:

- preserves every `/docs/components/<name>` URL (zero file moves, zero broken links / integrity headers),
- is the lowest-risk change,
- matches how `---Communication---` already works.

(Sub-folders were considered and rejected — they'd change slugs and break the registry's URL contract.)

---

## Proposed taxonomy — 13 sections, all 68 components placed exactly once

Order top-to-bottom; components ordered most-common-first within each section.

### 1. Buttons & Actions

`button`, `icon-button`, `split-button`, `copy-button`, `toggle`, `toggle-group`

> Primary interactive triggers — what a consumer reaches for first. `toggle`/`toggle-group` share `toggleVariants` and sit next to Button. _(Boundary: `toggle-group` is selection-like — see Decision #3.)_

### 2. Forms & Inputs

`input`, `textarea`, `password-input`, `otp-input`, `auto-save-input`, `text-edit`, `field`, `field-inline`, `label`, `slider`

> Text-entry + field-wrapping primitives. `text-edit` is a rich-text input (produces HTML); `slider` is a numeric input.

### 3. Selection Controls

`checkbox`, `radio-group`, `switch`, `select`, `country-select`, `state-select`

> Bounded-choice inputs.

### 4. Pickers

`date-picker`, `color-picker`, `emoji-picker`

> Specialized popover-driven value pickers.

### 5. Overlays

`dialog`, `alert-dialog`, `sheet`, `popover`, `hover-card`, `tooltip`

> Floating / portalled surfaces.

### 6. Menus & Commands

`dropdown-menu`, `context-menu`, `command`

> Actionable menu surfaces + command palette.

### 7. Navigation

`breadcrumb`, `pagination`, `tabs`, `sidebar`, `page-header`

> Wayfinding + page-level chrome.

### 8. Disclosure

`accordion`, `collapsible`

> Expand/collapse content regions.

### 9. Layout & Structure

`card`, `separator`, `scroll-area`, `settings-row`

> Containers + structural dividers.

### 10. Data Display

`table`, `data-list`, `filter-bar`, `avatar`, `image`, `badge`

> Rendering values/records. _(Boundary: `filter-bar` — see Decision #4.)_

### 11. Feedback & Status

`alert`, `toast`, `progress`, `progress-indicator`, `spinner`, `skeleton`, `status-icon`, `empty-state`, `notification-bell`

> Loading / empty / status / notification states. (`toast` is the `sonner` registry item.)

### 12. Content & Typography

`markdown-view`, `kbd`, `truncated-text`, `relative-time`

> Rich-text + inline content-display helpers.

### 13. Chat & Communication

`marker`, `message`, `bubble`, `message-scroller`

> The existing `---Communication---` group. _(Boundary: `marker` — see Decision #2.)_

**Count check:** 6+10+6+3+6+3+5+2+4+6+9+4+4 = **68** ✓

> If 13 sections feel heavy, the natural merges to reach ~10 are: Pickers→Selection Controls, Disclosure→Layout & Structure, Content & Typography→Data Display.

---

## Exact replacement for `content/docs/components/meta.json`

```json
{
  "title": "Components",
  "pages": [
    "---Buttons & Actions---",
    "button",
    "icon-button",
    "split-button",
    "copy-button",
    "toggle",
    "toggle-group",
    "---Forms & Inputs---",
    "input",
    "textarea",
    "password-input",
    "otp-input",
    "auto-save-input",
    "text-edit",
    "field",
    "field-inline",
    "label",
    "slider",
    "---Selection Controls---",
    "checkbox",
    "radio-group",
    "switch",
    "select",
    "country-select",
    "state-select",
    "---Pickers---",
    "date-picker",
    "color-picker",
    "emoji-picker",
    "---Overlays---",
    "dialog",
    "alert-dialog",
    "sheet",
    "popover",
    "hover-card",
    "tooltip",
    "---Menus & Commands---",
    "dropdown-menu",
    "context-menu",
    "command",
    "---Navigation---",
    "breadcrumb",
    "pagination",
    "tabs",
    "sidebar",
    "page-header",
    "---Disclosure---",
    "accordion",
    "collapsible",
    "---Layout & Structure---",
    "card",
    "separator",
    "scroll-area",
    "settings-row",
    "---Data Display---",
    "table",
    "data-list",
    "filter-bar",
    "avatar",
    "image",
    "badge",
    "---Feedback & Status---",
    "alert",
    "toast",
    "progress",
    "progress-indicator",
    "spinner",
    "skeleton",
    "status-icon",
    "empty-state",
    "notification-bell",
    "---Content & Typography---",
    "markdown-view",
    "kbd",
    "truncated-text",
    "relative-time",
    "---Chat & Communication---",
    "marker",
    "message",
    "bubble",
    "message-scroller"
  ]
}
```

---

## Non-component doc fixes (verified)

### `content/docs/utilities/meta.json`

- Remove the redundant `---Utilities---` divider (it duplicates the section title). Either drop it, or — if we keep section dividers consistent — Utilities only has 2 entries so a divider adds nothing. **Drop it.**

### `index.mdx` (landing)

- **[P0 PROSE]** `index.mdx:6` — "**64 components**" → **68**. _(Verified: 68 mdx pages, 68 non-divider meta entries.)_
- **[STRUCTURE]** `:18-20` Foundations prose links only Colors + Typography — add Icons + Motion.
- **[STRUCTURE]** `:22-24` Components prose links only Button — add a path into the catalog / mention the new sections.
- **[STRUCTURE]** No mention of Utilities in the body though it's a top-level section — add.

### `app/(home)/page.tsx`

- **[P0 PROSE]** `page.tsx:8` — "**64 components**" → **68** (same stale count as index.mdx).

### Foundations pages (accurate but thin — verified byte-for-byte correct, just incomplete)

- `colors.mdx` — accurate. `<ColorPalette/>` also renders **Charts** (`chart-1..8`) and a **Sidebar surface** group the prose never mentions; expand prose to cover them. Cross-link the (to-be-added) Radius/Shadow pages.
- `typography.mdx` — accurate but missing a **numeric type scale** (sizes / line-heights / letter-spacing) and **font-loading guidance**.
- `icons.mdx` — **complete** (the "439 icons" count is verified exactly right). No change.
- `motion.mdx` — accurate but the **thinnest** page and the only foundation with **no live specimen** (colors/typography/icons all have one). Add an easing/duration demo. Optionally mention the `duration-fast` utility bridge.

### Utilities pages (API-accurate — verified against `dist/utilities.css`)

- `shimmer.mdx` — **complete & correct** (all `@utility` classes verified). The 9 named previews in `preview/utilities.tsx` should be confirmed present (cross-checked in Part B).
- `scroll-fade.mdx` — **[API]** Classes table omits the shipped **per-edge sized** utilities `scroll-fade-t-*`, `scroll-fade-b-*`, `scroll-fade-s-*`, `scroll-fade-e-*`. Add these four rows.

### `install.mdx`

- **Verified accurate** — every CLI command matches the real `vegastack-design` bin + `RELEASING.md`. Minor: examples mix `npx --package=@vegastack/utils vegastack-design verify` with bare `npx vegastack-design check-updates`; make the qualifier consistent. Optionally add a "now customize your tokens" pointer (theming).

---

## Missing foundation pages worth adding (tokens already ship; zero docs)

| Page                     | Backing (already in `theme.css`)                                                                                                          | Value / effort |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| **Radius**               | `--radius`, `--radius-sm/md/lg/xl` (`theme.css:76-79` + bridge `:219-222`)                                                                | High / Low     |
| **Elevation / Shadow**   | `--shadow-overlay` (`theme.css:83` + bridge `:223`) — "borders-only, one overlay shadow" philosophy                                       | Med / Low      |
| **Spacing & Layout**     | 4px scale, `var(--spacing)`                                                                                                               | Med / Low      |
| **Theming & Dark Mode**  | the one-file `--primary` override (headline feature, only mentioned inside `colors.mdx`); `.dark`, `@theme inline` bridge, reduced-motion | High / Med     |
| **Accessibility**        | AGENTS.md mandates WCAG 2.1 AA / `:focus-visible` / axe-clean — no consumer-facing overview                                               | Med / Med      |
| **Design Principles**    | "neutral primary, rationed purple, serif headings never bold, borders-only" — enforced in lint, never written down                        | Med / Low      |
| **Changelog / Releases** | `RELEASING.md` is maintainer-only; consumers have no in-docs "what's new" despite the copy-in-update model                                | Med / Med      |

> These are **out of the strict component-coverage scope** — recommend confirming (Decision #7) whether to fold them in now or schedule as a foundations follow-up. Radius + Design Principles + Theming are the highest-leverage.
