# 02 — Batch 6: navigation and layout

**Items:** app-shell · sidebar · navigation-menu · breadcrumb · tabs · segmented · toggle ·
toggle-group · page-header · section-header · resizable · scroll-area
**Evidence:** source read; five-lane captures; axe from the sweep (duplicate `main` on every
shell/sidebar fixture); token dump for the `sidebar-*` family; consumer grep.

Overall: solid landmarks and keyboard behaviour (skip link, real `<nav>`, roving toggles, resizable
separators with ARIA values). The findings are a token family that duplicates the main palette
(and quietly contains the hover step the rest of the system lacks), three overlapping "selected
chip" recipes, an app-policy side effect inside a component, and an ARIA misuse inherited from
shadcn.

## Findings

### B6-01 · HIGH · tokens · The `sidebar-*` family is a second palette, and it has the hover step

- **Where:** `theme.css` — `sidebar` 0.985/0.145, `sidebar-accent` **0.955**/0.205,
  `sidebar-border` = `border`, `sidebar-ring` = `ring`, `sidebar-primary` ≈ `foreground`,
  `sidebar-foreground` 0.269/0.87. `design.md` §Surfaces says the sidebar "reuses the main
  `primary` / `accent` / `ring`", but the tokens are separate values, and `sidebar-accent` (0.955)
  is a _darker_ hover than `accent` (0.97) — the only real hover step in the system, hiding in one
  component's namespace.
- **Fix:** fold into P1's ladder: `sidebar` = `card`, `sidebar-accent` = `surface-2` (hover),
  `sidebar-border`/`sidebar-ring`/`sidebar-primary`/`sidebar-foreground` become aliases. Keep the
  names for shadcn-shaped code; delete the duplicate values from the token source.

### B6-02 · HIGH · bloat · Three "raised chip on a muted track" recipes

- `Tabs variant="pill"` (`tabs.tsx:84,220-221`), `Segmented` (`segmented.tsx:30-61`) and
  `Tabs variant="chip"` (`tabs.tsx:87,224-226`) are the same formula (muted track, `bg-background`
  raised chip with hairline) at slightly different sizes; `Toggle` pressed (`toggle.tsx:22`) adds a
  fourth "selected chip" look (`bg-foreground/10`).
- **Fix:** one `selectedChipVariants` recipe shared by Segmented, Tabs `pill`, ToggleGroup pressed
  and Toggle pressed (P1 `surface-3`). Delete Tabs `chip` (it is Segmented at 28px). **Doubt D20.**

### B6-03 · MEDIUM · boundary · `SidebarProvider` writes a cookie

- `sidebar.tsx:140-143` writes `document.cookie` on every toggle. Persistence policy (cookie name,
  path, max-age, whether to persist at all) is the host's; a design-system component should not
  touch `document.cookie`. Expose `onOpenChange` (already there) and document the cookie recipe; add
  an opt-in `persist="cookie"` only if MK wants the convenience kept.

### B6-04 · MEDIUM · a11y · `BreadcrumbPage` is a fake link

- `breadcrumb.tsx:149-151` renders `<span role="link" aria-disabled="true" aria-current="page">`.
  A non-interactive current-page marker must not claim `role="link"` (screen readers announce a
  disabled link). Use `<span aria-current="page">` only. Inherited from shadcn.

### B6-05 · MEDIUM · consistency · Hand-rolled icon buttons and physical margins

- `sidebar.tsx:785-790` (`SidebarTrigger`) and `page-header.tsx:236-247` (back link via
  `buttonVariants`) hand-roll icon buttons — use `IconButton` (`render={<a/>}` for the link).
  `page-header.tsx:229,243` `-ml-2` is a physical margin (mirrors wrong in RTL) → `-ms-2`.

### B6-06 · MEDIUM · UX · `ScrollArea` viewport is always a tab stop

- `scroll-area.tsx:115` `tabIndex={0}` regardless of overflow. A ScrollArea whose content fits
  still adds a tab stop. Make it focusable only when scrollable (measure once on mount + resize, the
  `useOverflow` hook from TruncatedText already exists) — same rule for the Table container (B5-01).

### B6-07 · MEDIUM · docs · Duplicate `<main>` in every shell fixture

- axe `landmark-no-duplicate-main` on `sidebarInset`, `sidebarMobile`, and every AppShell fixture:
  the docs page already has a `<main>`, so the preview's `<main>` duplicates it. Real apps are fine;
  the docs and the contract lane are not. Give `AppShellContent`/`SidebarInset` a `landmark`
  escape (`render={<div role="region"/>}` in previews) or wrap previews in an iframe-like sandbox.
  Fumadocs 16.14.5 adds its own `<main>` and makes this worse (deps report).

### B6-08 · LOW · tokens · Layout sizes outside the scale

- `app-shell.tsx:194` header `h-14` (56px), `sidebar.tsx:292` `--sidebar-width-mobile` fallback
  `18rem` inline, `--sidebar-width`/`-icon` exist as tokens. Add `--layout-header-height` and
  `--sidebar-width-mobile` tokens.

### B6-09 · LOW · doctrine · Favourite star is warning-coloured

- `page-header.tsx:151` fills the active star with `text-warning-text`. Doctrine rations status
  hues; Linear/Vercel use a neutral filled star (`fill-current text-foreground`). **Doubt D21.**

### B6-10 · LOW · redundancy · Focus utilities restated

- `tabs.tsx:271` (`focus-visible:outline-2 outline-offset-1 outline-ring`) and
  `breadcrumb.tsx:297` (`focus-visible:outline-ring`) restate the global rule. Remove.

### B6-11 · LOW · tests/docs · Thin coverage

- `navigation-menu`: 3 tests, 1 preview (no keyboard-open, no RTL, no mobile fixture). `segmented`:
  1 preview (no sizes/disabled/icon fixture) and no dark capture in the contract lane. `toggle`: 1
  preview. `sidebar.mdx` "Mobile" and "SSR persistence" sections sit between Examples and API
  Reference — fine as example sub-sections; rename "SSR persistence" once B6-03 lands.

### Verified fine

Skip link is first-focusable and targets a `tabIndex=-1` main; header stays a `banner` sibling of
main; `Sidebar` is always a real `<nav>` (also inside the mobile Sheet) with `sr-only` labels when
collapsed; roving focus and `aria-current` on menu buttons; `SidebarRail` is a real button; Tabs
indicator uses Base UI's `--active-tab-*` vars with the RTL right-edge fix; horizontal tab lists
scroll with edge fades; Segmented enforces radio semantics over the array model; ToggleGroup joins
corners logically; Resizable handles expose `aria-valuenow`, 24px hit areas and keyboard resizing;
Breadcrumb collapse is deterministic and its hidden segments are real links; AppShellContent uses
container queries.

## Motion register — Batch 6

| id   | where                        | motion                                                     | verdict                                                  |
| ---- | ---------------------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| M-29 | sidebar rail collapse/expand | width + transform 200ms standard                           | keep                                                     |
| M-30 | sidebar group label          | margin + opacity 200ms                                     | keep                                                     |
| M-31 | sidebar menu button          | width/height/padding 150ms; active rail scale-y            | keep (rail scale is the only decorative one; acceptable) |
| M-32 | tabs indicator               | inset/size 150ms                                           | keep                                                     |
| M-33 | navigation menu              | positioner move 200ms; popup scale/fade + content fade 150 | keep                                                     |
| M-34 | scroll-area scrollbar        | opacity 150ms on hover/scroll                              | keep                                                     |

## Doubts for MK (Batch 6)

| id  | question                   | options                                                                                       | recommendation |
| --- | -------------------------- | --------------------------------------------------------------------------------------------- | -------------- |
| D20 | Tabs variants              | (a) `line` + `pill` (pill shares Segmented's recipe), delete `chip` · (b) keep all three      | **(a)**        |
| D21 | Favourite star colour      | (a) neutral filled star · (b) keep warning yellow                                             | **(a)**        |
| D22 | Sidebar cookie persistence | (a) remove from the component, document the recipe · (b) keep behind an opt-in `persist` prop | **(a)**        |
