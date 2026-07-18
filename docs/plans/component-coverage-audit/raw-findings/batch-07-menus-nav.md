# BATCH 7 — Menus & Navigation — Documentation Coverage Audit

Scope: dropdown-menu, context-menu, tabs, breadcrumb, pagination, sidebar.
Method: canonical `.tsx` + `.test.tsx` = API TRUTH; `.mdx` + `preview/*.tsx` = DEMONSTRATED. Gap = TRUTH − DEMONSTRATED.

## BATCH SUMMARY

- Files present: 6/6 components have all four files (canonical, test, mdx, preview). 24/24 files exist.
- Overall this batch is the strongest-documented set in the system: every component has Installation / Usage / Anatomy / API Reference (full per-subcomponent AutoTypeTable) / Accessibility (with keyboard table) / Do-Don't. No missing pages, no thin previews.
- Counts by severity of gap:
  - Components effectively clean (only nit-level gaps): **dropdown-menu, context-menu** (2)
  - Components with 1–3 real but minor demonstration gaps: **tabs, breadcrumb, pagination, sidebar** (4)
- Total distinct GAP findings: ~24 (mostly [VARIANT]/[MATRIX] demonstration gaps; a handful of [PROSE] reality mismatches; zero [API] AutoTypeTable omissions; zero [MISSING]).
- Highest-value fixes across the batch:
  1. **sidebar** — `side="right"`, `SidebarMenuButton` `size` (sm/lg), and controlled `open`/`onOpenChange`/`useSidebar` are entirely undemonstrated; the live-collapse animation is only shown via a statically-collapsed preview.
  2. **tabs** — vertical + `line` indicator-on-left-rail is described in prose but every vertical preview uses `pill`; horizontal `line` is shown but the *vertical line rail* (the whole point of the Orientation section) is not.
  3. **pagination** — `size="default"` numbered link and `size="icon"` are never shown explicitly in a sizes grid (only sm/lg looped); the `paginationFirstPage` "Edge states" preview shows a *first*-page disabled-Previous but not a disabled-Next / last-page mirror.

### Proposed category table

| Component | Proposed category | One-line reason |
| --- | --- | --- |
| dropdown-menu | Menus & Navigation | Button-triggered action menu (items, checkbox/radio, submenus, shortcuts). |
| context-menu | Menus & Navigation | Right-click/long-press action menu; same item taxonomy as dropdown. |
| tabs | Navigation (in-page) | Switches between layered panels; line/pill, horizontal/vertical. |
| breadcrumb | Menus & Navigation | Hierarchical location trail (`nav` landmark). |
| pagination | Menus & Navigation | Paged-content navigation (`nav` landmark, prev/next/numbered). |
| sidebar | Menus & Navigation | App navigation rail (collapsible `nav` landmark, menu groups). |

---

## dropdown-menu
- files: canonical ✓ | test ✓ | mdx (`dropdown-menu.mdx`) ✓ | preview ✓
- exports/subcomponents: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuGroup`, `DropdownMenuSub`, `DropdownMenuRadioGroup`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent` (+ `dropdownMenuItemVariants` export).
- proposed category: Menus & Navigation — button-triggered overlay menu of actions.
### API surface (ground truth)
- CVA axis: `dropdownMenuItemVariants.variant` = `default | destructive` (canonical L191-204).
- Boolean props: `DropdownMenuItem.inset` (L215), `DropdownMenuLabel.inset` (L317), `DropdownMenuSubTrigger.inset` (L397).
- Content positioning props: `side` (default `bottom`), `align` (default `start`), `sideOffset` (default 4), `collisionPadding` (default 8), plus pass-throughs `portalProps` / `positionerProps` / `viewportProps` (L97-129).
- `DropdownMenuSubContent` defaults: `side="right"`, `align="start"`, `sideOffset=0` (L433-447).
- States: open/closed; `data-highlighted` (keyboard/hover); `data-disabled`; checkbox `data-checked`; radio selected; `data-popup-open` (sub-trigger); roles menu/menuitem/menuitemcheckbox/menuitemradio (tests L35-145).
### Currently demonstrated
- preview `dropdownMenu` (frontmatter `preview: dropdownMenu`): icons + shortcuts + separator + one destructive item.
- preview `dropdownMenuRich` (`<ComponentPreview name="dropdownMenuRich">`, mdx L84): groups, labels, shortcuts, checkbox items, radio group, a **disabled** item, destructive item, **submenu**. Both exports consumed.
- mdx sections: Installation, Usage, Anatomy, Examples, Items, Checkbox & radio items, Submenus, API Reference (14 AutoTypeTables — every subcomponent), Accessibility (roles + full keyboard table), Do/Don't. Complete.
### GAPS
- [VARIANT] `inset` prop (on Item / Label / SubTrigger) is described in prose (mdx L71, L91-93) and code-snippet but never shown in a live preview — no rendered example aligning an inset item with checkbox/radio rows.
- [VARIANT] `side`/`align`/`sideOffset`/`collisionPadding` placement props and the `viewportProps` Viewport-wrapping path are only documented in the API table; no preview varies placement or shows a scroll-viewport menu (tested at L148-179 but not demonstrated).
- [MATRIX] none (rich preview already shows the full item taxonomy in one menu).
- [API] none — all 14 subcomponent Props have AutoTypeTables (mdx L140-208).
- [PROSE] none — prose matches API (modal/scroll-lock claim L214 is consistent with Base UI Menu).
### Verdict
- coverage: ~95% (excellent). effort: S. top 3 fixes: (1) add a small inset-alignment example, (2) optionally show `viewportProps`/placement, (3) otherwise leave as reference-grade.

---

## context-menu
- files: canonical ✓ | test ✓ | mdx (`context-menu.mdx`) ✓ | preview ✓
- exports/subcomponents: `ContextMenu`, `ContextMenuTrigger`, `ContextMenuGroup`, `ContextMenuSub`, `ContextMenuRadioGroup`, `ContextMenuContent`, `ContextMenuItem`, `ContextMenuCheckboxItem`, `ContextMenuRadioItem`, `ContextMenuLabel`, `ContextMenuSeparator`, `ContextMenuShortcut`, `ContextMenuSubTrigger`, `ContextMenuSubContent` (+ `contextMenuItemVariants`).
- proposed category: Menus & Navigation — right-click / long-press / Shift+F10 action menu.
### API surface (ground truth)
- CVA axis: `contextMenuItemVariants.variant` = `default | destructive` (L233-246).
- Boolean: `inset` on Item (L257), Label (L359), SubTrigger (L439).
- Trigger keyboard handling: synthesizes `contextmenu` from `ContextMenu`/`Menu`/`Shift+F10` keys (L53-96) — a distinguishing behavior vs dropdown.
- Content positioning props identical to dropdown; positions against pointer; `portalProps`/`positionerProps` (note: NO `viewportProps` here — that is dropdown-only).
- States: open/closed, `data-highlighted`, `data-disabled`, `data-popup-open`, checkbox/radio roles (tests L36-204).
### Currently demonstrated
- preview `contextMenu` (frontmatter `preview: contextMenu`): dashed right-click target, copy/cut/separator/destructive.
- preview `contextMenuRich` (`<ComponentPreview name="contextMenuRich">`, mdx L84): groups, labels, shortcuts, checkbox items, radio group, **disabled** item, **submenu**, destructive. Both exports consumed.
- mdx sections: Installation, Usage, Anatomy, Examples, Items, Checkbox & radio items, Submenus, API Reference (14 AutoTypeTables), Accessibility (right-click + Shift+F10/Menu key documented L213, full keyboard table), Do/Don't. Complete.
### GAPS
- [VARIANT] `inset` never demonstrated in a live preview (prose only, mdx L71/L91-93).
- [VARIANT] Keyboard-open (Shift+F10 / Menu key) is tested (test L184-226) and described (mdx L213, L220) but a docs preview can't show it interactively — acceptable; flagged only as a known DEMONSTRATED limitation.
- [VARIANT] `side`/`align`/offsets placement props undemonstrated (API-table only).
- [MATRIX] none.
- [API] none — all 14 subcomponents have AutoTypeTables (mdx L140-208).
- [PROSE] none. (Anatomy correctly contrasts with DropdownMenu, L36-38.)
### Verdict
- coverage: ~95% (excellent). effort: S. top 3 fixes: (1) add an inset example, (2) consider a note/preview for placement, (3) otherwise reference-grade.

---

## tabs
- files: canonical ✓ | test ✓ | mdx (`tabs.mdx`) ✓ | preview ✓
- exports/subcomponents: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` (+ `tabsListVariants`).
- proposed category: Navigation (in-page) — layered section switcher.
### API surface (ground truth)
- CVA axis: `tabsListVariants.variant` = `line` (default) | `pill` (L60-77). Indicator (`tabs-indicator`) only rendered for `line` (L106-120).
- Enum prop: `Tabs.orientation` = `horizontal` (default) | `vertical` (L20). Drives flex direction + indicator rail side (bottom vs left, L116-117).
- `TabsTrigger.count?: number` → trailing badge (L137, L171-181). Leading icon composed as first child.
- States: `data-active` (active trigger), `disabled` → `data-disabled` (skipped by keyboard, test L108-124), `:focus-visible` ring on panel (L204).
- Activation is manual (arrow moves focus, Enter/Space selects) — per accessibility prose + test L50-60.
### Currently demonstrated
- preview `tabs` (frontmatter `preview: tabs`): default line, 3 triggers, one with `count={3}`.
- preview `tabsVariants` (`<ComponentPreview name="tabsVariants">`, mdx L67): **line** (icons + count) AND **pill** (icons + count) side by side — good variant matrix.
- preview `tabsVertical` (`<ComponentPreview name="tabsVertical">`, mdx L75): `orientation="vertical"` but **`variant="pill"` only**.
- mdx sections: Installation, Usage, Anatomy, Variants, Orientation, API Reference (4 AutoTypeTables — all subcomponents), Accessibility (tablist/tab/tabpanel roles, roving tabindex, aria-selected/aria-controls, manual activation, disabled, full keyboard table), Do/Don't. Complete.
### GAPS
- [MATRIX] **orientation × variant grid is incomplete.** Vertical is only ever shown with `pill`. The Orientation prose explicitly sells "the line variant's indicator on the left rail" (mdx L72) — but no preview renders `orientation="vertical" variant="line"`, so the left-rail moving underline (the canonical vertical feature, L117) is **never visually demonstrated**. This is the single most concrete gap in the component.
- [VARIANT] `disabled` trigger is tested (test L108-124) but never shown in a preview — no rendered disabled tab.
- [VARIANT] `count` badge is shown; the active-tab "brightens the count" interaction (L175-177) is only visible by clicking and not called out.
- [API] none.
- [PROSE] none stale. (Orientation prose is accurate; it's just unmatched by a preview.)
### Verdict
- coverage: ~85%. effort: S. top 3 fixes: (1) add `orientation="vertical" variant="line"` preview (or switch `tabsVertical` to line, or add a 2×2 grid) to demonstrate the left-rail indicator the prose promises; (2) add a disabled-trigger example; (3) optional 2×2 orientation×variant matrix.

---

## breadcrumb
- files: canonical ✓ | test ✓ | mdx (`breadcrumb.mdx`) ✓ | preview ✓
- exports/subcomponents: `Breadcrumb` (+ dotted `.List/.Item/.Link/.Page/.Separator/.Ellipsis`), and flat `BreadcrumbList/Item/Link/Page/Separator/Ellipsis`.
- proposed category: Menus & Navigation — hierarchical location trail.
### API surface (ground truth)
- No CVA. Key props: `BreadcrumbLink.render?` (Base UI `useRender` routing composition, L82, L89-108); `BreadcrumbSeparator` accepts `children` to override the default chevron (L136-152); `BreadcrumbPage` sets `role="link" aria-disabled aria-current="page"` (L116-127); `BreadcrumbEllipsis` is decorative `aria-hidden role="presentation"` (L161-176).
- Dual API: dotted namespace (`Breadcrumb.List`) + flat named exports (L184-201).
### Currently demonstrated
- preview `breadcrumb` (frontmatter `preview: breadcrumb`): Home / Workspace / Settings → Page(Billing); default chevron separators.
- preview `breadcrumbEllipsis` (`<ComponentPreview name="breadcrumbEllipsis">`, mdx L74): trail with `Breadcrumb.Ellipsis` collapsing the middle.
- mdx sections: Installation, Usage, Anatomy, Examples (Ellipsis collapse, Routing links code-snippet), API Reference (7 AutoTypeTables — all subcomponents), Accessibility (nav landmark, ol/li, aria-current, decorative separators/ellipsis, focus ring, keyboard table), Do/Don't. Complete.
### GAPS
- [VARIANT] **Custom separator** (`BreadcrumbSeparator` with `children`, e.g. a slash `/`) is documented in prose (mdx L61: "pass `children` to override") and in canonical (L136-149) but **never demonstrated** — no preview with a non-chevron separator.
- [VARIANT] **`render` routing composition** on `Breadcrumb.Link` is shown only as a static code snippet (mdx L84-88), not in a live `<ComponentPreview>` (it is tested, test L72-88). Reasonable, since routing needs a router — but it is a real prop with zero rendered demo.
- [VARIANT] The mdx Anatomy advertises the ellipsis "often wrapping a dropdown menu trigger that reveals the hidden segments" (mdx L71-72) — the interactive ellipsis-as-menu pattern is described but not demonstrated (the preview ellipsis is purely decorative).
- [MATRIX] none meaningful.
- [API] none.
- [PROSE] none stale.
### Verdict
- coverage: ~88%. effort: S. top 3 fixes: (1) add a custom-separator (slash) preview; (2) optionally a dropdown-backed ellipsis example to match the prose; (3) leave routing as a snippet.

---

## pagination
- files: canonical ✓ | test ✓ | mdx (`pagination.mdx`) ✓ | preview ✓
- exports/subcomponents: `Pagination` (+ dotted `.Content/.Item/.Link/.Previous/.Next/.Ellipsis`) and flat exports (+ `paginationLinkVariants`).
- proposed category: Menus & Navigation — paged-content navigation landmark.
### API surface (ground truth)
- CVA axes (`paginationLinkVariants`, L84-101):
  - `isActive` = `true | false` (default false). `true` → purple fill + `aria-current="page"` + `data-active`.
  - `size` = `default (h-8)` | `sm (h-7)` | `lg (h-10)` | `icon (size-8)` — **default variant is `icon`** (L99).
- `PaginationLink.render?` routing composition (L118). `PaginationPrevious`/`Next` force `size="default"` + leading/trailing chevron + `aria-label` (L156-196). `PaginationEllipsis` decorative.
- Edge-state pattern (disabled prev/next): omit `href`, `aria-disabled`, `tabIndex={-1}` (prose L113-114, preview `paginationFirstPage`).
### Currently demonstrated
- preview `pagination` (frontmatter `preview: pagination`): Previous, 1 / **2 active** / 3, Ellipsis, 10, Next — the canonical full pager with active page + ellipsis.
- preview `paginationSizes` (`<ComponentPreview name="paginationSizes">`, mdx L106): loops **`['sm','lg']`** only, each with an active page.
- preview `paginationFirstPage` (`<ComponentPreview name="paginationFirstPage">`, mdx L116): first-page state — `Previous` disabled (`aria-disabled tabIndex={-1}`), page 1 active, Next enabled.
- mdx sections: Installation, Usage, Anatomy, Examples (default, Routing snippet, Sizes, Edge states), API Reference (7 AutoTypeTables — all subcomponents), Accessibility (nav landmark, aria-current, prev/next labels, decorative ellipsis, disabled guidance, focus ring, keyboard table), Do/Don't. Complete.
### GAPS
- [VARIANT] **`size="default"` and `size="icon"` are never explicitly shown in the Sizes grid** — `paginationSizes` loops only `sm`/`lg` (preview L45). The default numbered links use `icon` and the prev/next use `default`, so they appear in the main pager, but the Sizes section that enumerates "sm / default / lg / icon" (mdx L103) demonstrates only 2 of 4. Mild prose/preview mismatch.
- [VARIANT] **Last-page / disabled-Next mirror is not demonstrated.** `paginationFirstPage` shows a disabled *Previous*; there is no example with a disabled *Next* (last page). Edge-state coverage is one-sided.
- [VARIANT] `render` routing on `Pagination.Link/Previous/Next` is snippet-only (mdx L93-98), not a live preview (tested test L98-114). Acceptable.
- [MATRIX] none beyond the size-grid completeness above.
- [API] none.
- [PROSE] minor — mdx L103 enumerates four sizes but only two are rendered below it; tighten wording or extend the grid.
### Verdict
- coverage: ~85%. effort: S. top 3 fixes: (1) extend `paginationSizes` to include `default` and `icon` (or reword L103); (2) add a last-page (disabled-Next) edge-state example; (3) leave routing as a snippet.

---

## sidebar
- files: canonical ✓ | test ✓ | mdx (`sidebar.mdx`) ✓ | preview ✓
- exports/subcomponents: `useSidebar`, `SidebarProvider`, `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarMenuBadge`, `SidebarSeparator`, `SidebarTrigger` (+ `sidebarMenuButtonVariants`).
- proposed category: Menus & Navigation — collapsible app navigation rail.
### API surface (ground truth)
- CVA axis: `sidebarMenuButtonVariants.size` = `default (h-8)` | `sm (h-7)` | `lg (h-10)` (L305-313).
- Enum prop: `Sidebar.side` = `left` (default) | `right` (L137; `data-[side=right]:order-last border-l`, L159).
- Provider props: `defaultOpen` (default true), controlled `open`/`onOpenChange`, `keyboardShortcut` = `true | false | string` (default `b`+Cmd/Ctrl) (L43-59, L92-103).
- `SidebarMenuButton`: `render?` (renders `<a>` for nav), `isActive?` → accent bg + leading rail + `aria-current="page"` (L316-359). `SidebarMenuBadge` hidden when collapsed (L367-379).
- States: `data-state` = `expanded | collapsed`; `data-collapsible="icon"` when collapsed (L153-154); collapsed hides labels/group-labels/badges; `useSidebar()` context exposes `state/open/setOpen/toggleSidebar` (L17-41).
### Currently demonstrated
- preview `sidebar` (frontmatter `preview: sidebar`): two groups, badges (12, 3), active item via local state, header w/ trigger, footer w/ separator + Settings. Interactive collapse via the trigger.
- preview `sidebarGroups` (`<ComponentPreview name="sidebarGroups">`, mdx L115): the same two groups, no header/trigger.
- preview `sidebarCollapsed` (`<ComponentPreview name="sidebarCollapsed">`, mdx L120): `SidebarProvider defaultOpen={false}` — statically collapsed icon rail with a trigger to expand.
- mdx sections: Installation, Usage, Anatomy, Examples (groups, collapsed), API Reference (13 AutoTypeTables — every subcomponent including Provider/Trigger; note: `useSidebar` hook has no table, which is correct — it's a hook not a props type), Accessibility (nav landmark + aria-label, heading group label, aria-current, focus ring, trigger aria-label, Cmd/Ctrl+B + keyboardShortcut prop, keyboard table), Do/Don't. Complete.
### GAPS
- [VARIANT] **`Sidebar side="right"` is never demonstrated** — both prop and the `border-l`/`order-last` layout (canonical L159) are documented only in the API table; no right-edge preview and no test (test file never sets `side`). Real undemonstrated enum value.
- [VARIANT] **`SidebarMenuButton size="sm"` and `size="lg"` are never demonstrated** — `sidebarMenuButtonVariants` has three sizes (L305-313); every preview and the test use the implicit `default`. No size grid.
- [VARIANT] **Controlled mode (`open`/`onOpenChange`) and `useSidebar()` are undemonstrated in docs** — `defaultOpen` (uncontrolled) is shown; the controlled props and the `useSidebar` hook (e.g. an external trigger reading `state`) appear only in the API table/prose, not in any preview. (Controlled path IS exercised in canonical via `openProp` but untested for the controlled branch and unshown.)
- [VARIANT] **`keyboardShortcut` custom/disabled** is tested (test L99-121) and described (mdx L160-162) but, being a keyboard interaction, is not visually demonstrable — flagged as a known DEMONSTRATED limitation only.
- [MATRIX] **state × variant** — the collapse *animation* (the headline feature, `transition-[width]`, L157) is only shown as two static end-states (`sidebar` starts expanded, `sidebarCollapsed` starts collapsed). The expanded preview's trigger does animate live, so this is partially covered, but there is no side-by-side expanded/collapsed comparison and no right-side variant in either state.
- [API] none — all props types have AutoTypeTables; `useSidebar` correctly omitted (hook).
- [PROSE] Minor: Accessibility claims `SidebarMenuButton`/`SidebarTrigger` "show a visible `:focus-visible` ring (`outline-ring`)" (mdx L157-158), but the canonical classes for these (L293-303 button, L422-425 trigger) define hover/active/`data-active` styling and **no explicit `outline-ring` / `:focus-visible` utility** — focus styling appears to rely on UA/default rather than the `outline-ring` token the prose names. QUOTE: "SidebarMenuButton and SidebarTrigger show a visible `:focus-visible` ring (`outline-ring`) — never `outline: none`." Verify the ring is actually applied; if not, this is a stale/aspirational a11y claim. (Contrast with tabs, which DOES set `focus-visible:outline-ring` explicitly at L204.)
### Verdict
- coverage: ~75% (lowest in batch). effort: M. top 3 fixes: (1) add a `side="right"` preview and a `SidebarMenuButton` size grid (sm/default/lg); (2) add a controlled-mode / `useSidebar` external-trigger example; (3) verify and fix (or back with code) the `outline-ring` focus-visible a11y claim at mdx L157-158.
