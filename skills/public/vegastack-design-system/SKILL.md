---
name: vegastack-design-system
description: Build product UI with the VegaStack design system — which component to pick, the semantic token vocabulary, composition patterns for forms and overlays, and the do/don't rules that keep code on-system. Use before generating or editing any UI code in a project that consumes @vegastack/design.
---

# VegaStack design system

Base UI + Tailwind v4 + OKLCH semantic tokens, on shadcn's `base-nova` style. Components are copy-in
via a private shadcn registry; the runtime and token layer are public npm.

Load this before writing UI code. For first-time project setup (installing packages, wiring the
provider, configuring registry access), use the `vegastack-consume` skill instead.

**The shadcn reset is a clean break, with no compatibility layer** — no aliases, no deprecation
shims, no re-exports. It ships as an ordinary minor release, so the version number does not warn you;
this section does. Every component shadcn ships is now upstream's own file, so its API is upstream's
API. The complete break is in the shadcn-reset migration guide that ships with the release notes; the
live contract for any single component is its page at
<https://design.vegastack.com/docs/components>. The headlines, because they decide most code an agent
writes:

- **Retired, with no drop-in:** `IconButton` → `Button size="icon*"` · `OTPInput` → `InputOTP` ·
  `CheckboxGroup` → `FieldSet` + `Checkbox` ·
  `FieldInline` → `EditableCell` · `Segmented` → a joined `ToggleGroup` · `SplitButton` → a
  `ButtonGroup` composition · `ProgressIndicator` → `Progress` + `Spinner` · `OnboardingChecklist` →
  an `ItemGroup` of `Item` rows under a `Progress`. The ten marketing components were deleted outright.
- **Gone from the token layer:** the surface ladder (`surface-1/2/3`), every `--alpha-*` and
  `--opacity-*`, `--size-*`, `--icon-*`, `--z-*`, `--shadow-overlay`, and the role type scale
  (`text-h1`, `text-label`, `text-code`, `text-mono-label`, `text-display-*`).
- **Gone from `@vegastack/design`:** `surfaceInteractive`, `surfaceInteractiveGroup`,
  `fillInteractive`, `FillTone`, `fieldControl`, `fieldControlGroup`, `selectedChipVariants`.
  `cn`, `TIMINGS`, `FLOATING`, `mergeRefs`, `prose`/`proseClassName` and the icon runtime all stay.

## Pick a component

[references/components.md](references/components.md) is the complete roster, grouped by family, with
each component's one-line purpose. Read it when choosing between components.

You can also query the live registry, which carries `meta.whenToUse` / `meta.whenNotToUse` on every
item to disambiguate close calls (primary vs. ghost vs. destructive):

```bash
pnpm dlx shadcn@latest list @vegastack
```

Rules that decide most component questions:

- **`Button` is one axis** — `variant` is `default · outline · secondary · ghost · destructive ·
link` (upstream's set, verbatim). `destructive` is a soft tint, not a solid red fill. Icon-only
  actions are `<Button size="icon">` (or `icon-xs` / `icon-sm` / `icon-lg`) with an `aria-label`;
  an icon in a bare `<button>` is off-system. An icon-only LINK stays an `<a>` styled with
  `buttonVariants({ variant, size: "icon" })` — never a `Button`, which would put `role="button"`
  on navigation. `loading` is ours: it holds the label's box and sets `aria-busy`.
- **Leading icons are muted and follow the row** — menus, select/combobox/command items, sidebar
  buttons, nav links, toggles, ghost/outline buttons, breadcrumb links and item media mute a
  leading icon and turn it full colour on hover, focus, highlight, selection, active, open and
  pressed. Never add `text-muted-foreground` (or any colour) to those icons; only intentional
  status colours belong there. Destructive rows keep `text-destructive`.
- **People icons are the round lucide set** — `UserRound`, `UsersRound`, `CircleUserRound` (and
  their `-Plus`/`-Check` kin), never the square-shouldered `User`, `Users` or `CircleUser`, so a
  person reads the same as an `Avatar` everywhere.
- **Control sizes are upstream's names: `default · xs · sm · lg`**, plus
  `icon · icon-xs · icon-sm · icon-lg` where a square tier exists. The old `md` default is gone, and
  most of the components that are ours dropped their `size` prop entirely and take their height from
  what they compose. Four keepers still carry a small private axis over something that is not a
  control height — `Chip` (`sm`/`md`, the inline and control pill scales), `StatusIcon`, `Stat` and
  `Image`'s corner — and they say so on their own pages.
- **Compose `app-shell`** for a sidebar + header + main layout — never hand-roll the landmark trio.
- **Space a page with the page-rhythm recipe** — gutters `px-4 py-6` / `md:px-8 md:py-8`,
  `gap-6` under `PageHeader`, `gap-8` between sections, `gap-3` from a section heading or a list
  toolbar to its content, `--card-spacing` inside a card, and `FieldGroup`'s own gaps in a form
  (<https://design.vegastack.com/docs/foundations/spacing#page-rhythm>).
- **`select`** for a short fixed option set; **`searchable-select`** when the list is long enough to
  need a search field (it is the preset `country-select` and `region-select` are built from — reach
  for it before composing `combobox` by hand); **`combobox`** directly only for free text,
  suggestions or multi-select chips.
- **One view-switch rule.** A form value is a **`radio-group`**. An immediate view or scope switch
  over the same content (Mine | Team, All | Unread, Grid | List) is a single-select
  **`toggle-group`** that always keeps one item pressed — `deselectable={false}` — with
  `spacing={0}` for 2–5 options inline (`wrap` when they can outgrow the row). Swapping in-page regions is
  **`tabs`**; moving between URLs is navigation — links, not `tabs` (a route-tabs recipe is
  not shipped yet).
- **Empty is tiered** — nothing yet, no matches ("Clear filters"), couldn't load (`role="alert"`,
  "Try again"), blocked. Pick the tier from the empty-state foundation
  (<https://design.vegastack.com/docs/foundations/empty-states>); never leave a region blank.
  `Empty` always shows an icon (`icon`, `Inbox` by default). In a `DataList`, use `emptyState` for
  "nothing yet" and `noResults={{ onClear }}` for "no matches" (SearchX, "No matches", "Clear
  filters" wired to the FilterBar's `onClear`) — never hand-roll empty markup.
- **List toolbars are one recipe** — `FilterBar`: search (~320px) left; right, the Filters (n)
  toggle, then views as `Tabs` (default variant, `TabsList size="sm"`, optional leading icons), then
  the layout switch (`ViewToggle`), furthest right. Filters are `FilterBarFacet` /
  `DateRangeFilter` chips (compact, rounded-md, tinted when set) on the toggled row; people facets
  take `itemToSecondaryLabel={(p) => p.email}`. Toolbar switches use default Tabs — never a ToggleGroup or line
  Tabs: `Tabs` for scope, `ViewToggle` (default Tabs, icons) for Grid | List | Board. Tables are `DataList` with `sortable` columns (`compare`, `sortFirst`,
  `sortMode="client"`) and `rowActions` (the ⋯ column, always last); row links are never underlined.
- **`alert`** for an in-content notice — `variant` is `default · destructive · success · warning ·
info`, each an ink on the `card` surface with a required icon; **`announcement-banner`** only for
  the full-width inverse strip at the very top of the page.
- **`chip` is the ONE pill** — `hue` × `size` (`sm` inline · `md` control-scale) × `active`, with
  `onRemove` giving a real 24×24 remove control. `Tag` and `FilterChip` wrap that primitive; `ComboboxChip` is Base UI's own chip and does not share its geometry
  yet. Never hand-roll a pill with its own height, radius, or a sub-24px `×`. A **`badge`** is the different job: status, never removable, never a selection.
- **`useAnnouncer` is the one live region** — destructure `announce` and `Announcer` from it and
  render ONE `Announcer` element per component, mounted for its life. It keeps the region observed from first paint
  and re-keys it per call, so repeating an identical string still announces. Do not hand-roll a
  `role="status"` node with a `{text, seq}` counter.
- **The user menu is one standard** (as in `app-shell-01`): the footer trigger shows avatar, name
  and role; the menu header repeats avatar + name with the email instead of the role; then Profile
  and Settings, a Theme `DropdownMenuSub` whose `DropdownMenuRadioGroup` (Light · Dark · System, with
  Sun · Moon · Monitor icons) is bound to `theme`/`setTheme` from `useVegaStackTheme()`, Keyboard
  shortcuts, a separator, and Sign out. Every item has an icon. Do not hand-roll a theme toggle button.
- **`code-block`** for static syntax-highlighted source; **`terminal`** for command sessions.
- **`navigation-menu`** is top-level site navigation with panels, not a menu inside a page.

### Names hide abilities

A component's name undersells it. Before composing something by hand, check this list:

| Component                                              | What it already does                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Command`                                              | Renders inline as well as in `CommandDialog` (wide 820px palette by default). `CommandFilters` holds type chips (`ToggleGroup wrap`) and Selects under the input; bare `<CommandFooter />` shows ↵/⌘↵/Esc `Kbd` hints; `CommandLoading` shows the animated search icon. An item's check mark is `data-checked` — visual only, so it is not a form value.                                         |
| `Combobox`                                             | `multiple` with `ComboboxChips`; `filter={null}` hands filtering to your server.                                                                                                                                                                                                                                                                                                                 |
| `SearchableSelect`                                     | The Select-shaped search picker, with `clearable`. `multiple` for several values; `remote` plus `useAsyncSearch` hands search and paging to your server.                                                                                                                                                                                                                                         |
| `Item`                                                 | A link tile with `render={<a />}`; `ItemGroup` gives a set of items list semantics.                                                                                                                                                                                                                                                                                                              |
| `DialogContent` · `SheetContent`                       | `size`: `sm · default · lg · xl` (a side sheet). Never a width class.                                                                                                                                                                                                                                                                                                                            |
| `DataList`                                             | Per-column `mobile` (`merge` · `visible` · `hidden`), `minWidth`, and `mergedRender` so a merged value keeps its context (`4 to review`), `mergedLayout="line"` for one compact meta line. `DataGrid` adds editing, multi-key sort and a column picker; `Table` is static markup.                                                                                                                |
| `DataList` paging and rows                             | `loadMore` for keyset paging, `getRowHref` for rows that are links, `rowProps` for `data-*` and a `highlighted` new row, `sections` + `getRowSection` for collapsible groups, and `rowActionsColumn` for a per-row menu.                                                                                                                                                                         |
| `LoadMore` · `useAsyncSearch`                          | The Load more footer of a keyset list (keeps its width while loading, "Try again", an end caption) · the server-search engine: debounce, dropped stale responses, cursor paging.                                                                                                                                                                                                                 |
| `SortableList`                                         | `layout="grid"` reorders tiles as well as rows.                                                                                                                                                                                                                                                                                                                                                  |
| `FilterBar` / `FilterBuilder`                          | `FilterBar` is a flat chip row with search, and `FilterBarFacet` is a "Status: Open" facet on `SearchableSelect` (single or `multiple`, local or `remote`); `FilterBuilder` (the `filter-bar-managed` item) edits a nested and/or tree over your field vocabulary. All controlled.                                                                                                               |
| `Stat`                                                 | `StatDelta` for change, `StatEmpty` for nothing to report.                                                                                                                                                                                                                                                                                                                                       |
| `PropertyList` · `DataList` · `SettingsRow`            | A record's facts · many records · one setting with its control.                                                                                                                                                                                                                                                                                                                                  |
| `ActionBar`                                            | The docked bar for bulk selection ("5 selected"), unsaved changes and batch progress.                                                                                                                                                                                                                                                                                                            |
| `TruncatedText` · `IconText` · `TableCellText`         | Overflow detection, hover and keyboard reveal, and tap-to-toggle on touch.                                                                                                                                                                                                                                                                                                                       |
| `RelativeTime`                                         | `mode="ago"` ("3 minutes ago") or `mode="day"` ("Yesterday").                                                                                                                                                                                                                                                                                                                                    |
| `EditableCell` · `AutoSaveInput` · `useInlineEdit`     | Click-to-edit: `variant` `cell` in a table, `heading` (+ `flush`) for a title; `multiline`, `required`, `onSave` promise, `onNavigate` · a field that saves as you type, with its status · the hook `EditableCell` is built on.                                                                                                                                                                  |
| `AttachmentGroup` · `Dropzone` · `useFileDrop`         | A file list with per-file state · a drop target · the drop and paste engine.                                                                                                                                                                                                                                                                                                                     |
| `PageHeader`                                           | Title, description, `breadcrumb`, a back link (`backHref`) and `actions`.                                                                                                                                                                                                                                                                                                                        |
| `MultiStepForm` · `Stepper` · `Questionnaire` · `Tabs` | A form in steps · progress display (`navigable` on request) · one question at a time · peer regions.                                                                                                                                                                                                                                                                                             |
| `NativeSelect`                                         | The platform `<select>`, so a touch device opens its own picker.                                                                                                                                                                                                                                                                                                                                 |
| `Board`                                                | `height` (`fill` · `auto` · a length), `onAdd` + `addLabel`, `collapsedColumns` + `onCollapsedChange`, `getColumnActions`, `readOnly`, `moveErrorToast`; a column's `lockedReason` explains why it cannot take a card; `itemLinkRender` is a template, the card's `href` wins.                                                                                                                   |
| `AudioPlayer`                                          | `mediaRef` to drive playback, a transcript button and a waveform; `docked` pins it to the bottom of a scroll column, `variant="floating"` is the centred pill, `onOpenChange` adds its close button, `actionsRef` seeks it, and `onSourceExpired` renews an expired signed URL once. `AudioPlayerProvider` + `GlobalAudioPlayer` + `useGlobalPlayer()` keep one recording playing across routes. |
| `Tabs`                                                 | `TabsList variant="line"` and `Tabs orientation="vertical"`; route tabs draw a `nav` from `tabsListVariants` and `tabsTriggerVariants`, which need no `data-orientation`. `useTabsSwipe` adds a touch swipe between controlled tabs.                                                                                                                                                             |
| `MessageScroller`                                      | `defaultScrollPosition` (`start` · `end` · `last-anchor`), `scrollToMessage` from `useMessageScroller()`, and `useMessageScrollerVisibility()`.                                                                                                                                                                                                                                                  |

### Which component for X

- **A page** → `AppShell` › `AppShellContent` › `AppShellPage` (`size`: `narrow` for forms and
  settings, `default`, `full`) › `PageHeader` › `FilterBar` › `DataList` (or
  `DataGrid`) › the `Empty` tier that fits. The spacing between them is the page-rhythm recipe
  (<https://design.vegastack.com/docs/foundations/spacing#page-rhythm>).
- **Inline editing** → `EditableCell` with `onSave` returning a promise: `variant="cell"` inside a
  table cell, `variant="heading"` inside the `h1`, `multiline` for notes, `required` for names. Edit
  looks like view (no border, same box), so never add width, border, padding or background classes
  to it or wrap it in a styled `Input`; it rolls back and toasts Retry on failure by itself.
- **A record's details** → `PropertyList`, in `Card` sections titled with an `h2` in `CardTitle`.
- **Settings** → `SettingsSection` › `SettingsCard` › `SettingsRow`.
- **A button that navigates** → `<Link className={buttonVariants()}>` (see Composition patterns).
- **A status** → `Badge` with a status `variant`; an in-content notice → `Alert`.
- **A metric** → `Stat`.
- **A confirmation that interrupts** → `AlertDialog`; a form or detail in an overlay → `Dialog` or
  `Sheet`.
- **An overlay's footer** (`DialogFooter`, `AlertDialogFooter`, `SheetFooter`, `DrawerFooter`,
  `MultiStepFormActions`) is as plain as its header: no background, no top border, no extra padding
  or negative margins. Actions are right-aligned, primary last; every secondary action (Cancel,
  Keep editing, Back, Save draft) is `variant="secondary"`, never `outline` — `AlertDialogCancel`
  and `DialogFooter showCloseButton` already default to it. A Sheet's Cancel may sit at the start
  edge: give it `data-slot="sheet-cancel"` and `SheetFooter` pushes it left with `me-auto`.
- **Feedback after an action** → `toast.add({ title })`.
- **A recording's text beside its player** → `Transcript` (follows `currentTime`, seeks through
  `onSeek`, searches; `TranscriptSpeakers` + `onSpeakerRename` for speaker chips) with a `docked`
  `AudioPlayer` at the bottom of the column — or, when playback must survive navigation, one
  `AudioPlayerProvider` in the app shell, `GlobalAudioPlayer` at the end of the main column and
  `useGlobalPlayer().open(track, { at })` / `useGlobalPlayerTime()` on the page.
- **A record page's header** → an inline-editable title, a `MetaLine` of icon + text facts,
  `RecordChip`s for the records it links to (a picker trigger with a ↗ link), and one `StatusLine`
  for its processing state (progress, or an error with its reason and Retry inline). The body is
  default `Tabs` stretched full width (`TabsList className="w-full"`) with `useTabsSwipe` on the
  panels, and no cards around the panels.
- **A list page with a grid, list or board view** → one `DataList` with `view` + `onViewChange`
  (it mounts `ViewToggle` in the `FilterBar` `view` slot and remembers the view for the session) and
  `views` for the ones the page allows. The grid renders a `MediaCard` per row (whole card is the
  link, ⋯ on hover/focus/touch) with `sections` as headings; `view="board"` makes `sections` Board
  lanes with `onMove` and a per-section `loading` / `loadMore` / `emptyState`. Record images are a
  column `thumbnail` + `thumbnailFallback` (the app mark) — never a hand-rolled card grid, card or
  `<img>`. A count needing attention is `<Badge variant="warning"><TriangleAlert />n</Badge>`, and
  groups in a ⋯ menu are split by `{ type: "separator" }` entries; an action with `items` is a
  submenu ("Change status ›", "Assign ›").
- **A task or pipeline board** → `DataList view="board"` (or `Board` directly) with `BoardCard`
  content: `boardCard={(row) => ({ title, context, due, priority, assignee, done, onDoneChange,
source })}` — never a hand-rolled card. The board fills the viewport below the toolbar
  (`boardHeight="fill"`, cards scroll inside lanes, no page scroll); `onAddToSection` adds "+ Add
  {item}" per lane with the lane's status pre-filled; lanes collapse from their header ⋯
  (`collapsedSections` to remember it). `onMove` is optimistic — return a promise and a rejection
  snaps back with a toast, so never re-sort lanes yourself while it is pending. Drag, touch
  long-press, keyboard (Space · arrows · Space · Esc), the Move menu and the phone's one-lane view
  are built in; card actions go in `rowActions`/`getItemActions`, not on the `BoardCard`.
- **A task's status or priority** → `StatusIcon` (todo, progress — static unless `animated`,
  blocked, done, cancelled) and `PriorityIcon` (urgent, high, medium, low, none flags). To change
  them, use the Status menu / Priority menu recipes on their docs pages — a ghost icon-button
  trigger over `DropdownMenu` items with the icon leading and a `DropdownMenuShortcut` (O/P/B/D/C,
  1/2/3/4/0), ⌥/Alt-click on the circle for quick Done with an Undo toast — and the same icons
  leading `Select`/`Combobox` options and filter options. No local badges or picker components.
- **A list that pages by cursor** → `DataList` `loadMore` (or `LoadMore` under your own list), with
  `useAsyncSearch` when the search runs on the server.

### Starter blocks

A block is a page you copy once and then own (`shadcn add @vegastack/<name>`). Start from the
closest one rather than composing the page from nothing:

- **`app-shell-01`** — the shell: landmarks, skip link, a rail with search, inbox count and a user
  menu.
- **`list-page-01`** — one kind of record: a `DataList` with a `FilterBar` toolbar (search, facets,
  Mine | Team scope, the list's own Grid | List toggle), grouped by industry, Load more and three
  empty tiers.
- **`board-01`** — a `DataList` board of `BoardCard`s under a `FilterBar`: a backlog that pages as it
  scrolls, "+ Add task" per lane, a locked lane and a submenu in each card's ⋯.
- **`settings-01`** — one settings page: grouped `SettingsRow` sections and a save bar.
- **`settings-02`** — the settings hub: grids of linked tiles, grouped by area.
- **`review-split-01`** — a record reviewed beside a sticky transcript and a docked player; tabs
  when narrow.
- **`notifications-01`** — the inbox sheet: All | Unread, Today and Earlier, Load older.
- **`command-search-01`** — the ⌘K search palette: scopes, recents, grouped results and every
  state.
- **`status-pages-01`** — the 404, 403 and error pages.
- **`login-01`** — a sign-in page.

## Tokens

Semantic CSS custom properties from `@vegastack/design-tokens/theme.css` (OKLCH, `:root` + `.dark`),
on shadcn's `neutral` base. Always use the utility, never a raw value.

| Role     | Utilities                                                                                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surface  | `bg-background` (page) · `bg-card` · `bg-popover` · `bg-sidebar`                                                                                                                                                    |
| Fill     | `bg-primary` (solid action, every checked control) · `bg-secondary` (soft) · `bg-muted` (well, track, skeleton) · `bg-accent` (hover)                                                                               |
| Text     | `text-foreground` · `text-muted-foreground` · `text-{primary,secondary,accent,card,popover}-foreground`                                                                                                             |
| Status   | `bg-{destructive,success,warning,info}` · `-foreground` (ink ON the fill) · `-text` (ink on the page or on the family's own tint)                                                                                   |
| Border   | `border-border` · `border-input` — there are no rings; focus is a global background tint (Tabs alone keep a ring)                                                                                                   |
| Radius   | `rounded-{sm,md,lg,xl,2xl}` — all derived from the single `--radius`                                                                                                                                                |
| Type     | Tailwind's own `text-{xs…7xl}`. `text-sm` is 14px, `text-base` is 16px. Line-height and letter-spacing above `text-base` come from the theme — never write `tracking-*`, an arbitrary `text-[13px]`, or `uppercase` |
| Font     | `font-sans` `font-mono` `font-serif` `font-heading`                                                                                                                                                                 |
| Motion   | `duration-{fast,base,slow}` · `ease-{standard,emphasized,exit,spring}` — or Tailwind's own steps                                                                                                                    |
| Entrance | `motion-pop-in` `motion-enter-up` `motion-shake` `motion-flash`                                                                                                                                                     |
| Docked   | `motion-dock-in` / `motion-dock-out` — a control parked at a viewport edge, 150ms in / 100ms out                                                                                                                    |
| Prose    | `proseClassName` from `@vegastack/design` — the whole rendered-rich-text recipe, one class                                                                                                                          |

**Hover and pressed are written, not imported.** A component owns its own interaction chrome, the
way shadcn writes it:

```tsx
// A transparent control on a known surface.
<button className="rounded-md px-2 hover:bg-accent hover:text-accent-foreground" />;

// A solid.
<button className="bg-primary text-primary-foreground hover:bg-primary/80" />;

// A tinted status control. The ink on a tint is `-text`, never the fill.
<button className="bg-destructive/10 text-destructive-text hover:bg-destructive/20" />;
```

A pressed step is optional. `surfaceInteractive`, `fillInteractive`, `fieldControl`,
`fieldControlGroup` and `selectedChipVariants` were **deleted** from `@vegastack/design` with no
alias; if you are upgrading, replace each with the literal it expanded to.

**Rendered rich text comes from a recipe.** Anything the system did not author element by element —
markdown, a contenteditable, CMS copy — wears one class on its root:

```tsx
import { cn, proseClassName } from "@vegastack/design";

<div
  className={cn(proseClassName, className)}
  dangerouslySetInnerHTML={html}
/>;
```

`MarkdownView` and `TextEdit` both wear it, so they render identical typography. It is expressed as
descendant rules (`[&_h1]:…`), which means an element-level class on a child **loses** to it
(specificity (0,1,0) against (0,1,1)) — restyle by composing `prose` (the per-element record), never
by setting a class on the rendered element. Under the page's own headings, `MarkdownView headingOffset={n}` moves every
heading down `n` levels (capped at h6) so the outline never skips back up.

`muted`, `accent` and `secondary` share one value in this base, and all three are kept: name the one
whose ROLE you mean, so a consumer can retune one without moving the others.

**Status colour has two inks.** `-foreground` is the ink on the solid fill; `-text` is the ink on the
page and on the family's own `/10`-`/30` tint. Using the fill itself as text on a tint measures
3.98-4.35:1, which the contrast gate rejects. `info` is links and informational UI only.

`--brand` is a marker-role accent only — never a functional state colour, and never a text ink
(`--brand-text` is the readable half).

**Overriding tokens:** redefine one runtime variable in your global CSS and every component repaints
in both themes:

```css
:root {
  --primary: oklch(0.55 0.2 264);
}
```

Never override a `--color-*` variable — that is the build-inlined Tailwind bridge, not the runtime
contract.

## Composition patterns

- **Forms are composed, not configured** — `Field` is layout and copy: `FieldLabel`, the control,
  then `FieldDescription` and `FieldError` as CHILDREN. There is no `label`, `description` or `error`
  prop. `Field` wires the control through Base UI Field — the label's `for`, the description and
  error ids in `aria-describedby`, and `aria-invalid` from the Field's `data-invalid` — so pass ids
  only to override; an explicit `aria-*` prop on the control merges with the Field's, it does not
  replace it. Write `data-invalid` / `data-disabled` on the `Field`, not by hand on the control. `FieldError` is `role="alert"`, carries a leading icon so an
  error is never colour alone, and takes either children or an `errors` array it de-duplicates.
  react-hook-form's `register` wires straight to the control; there is no `Controller` indirection.
- **A set of related checkboxes is a `FieldSet` + `FieldLegend` + one `Field` per option** — that is
  the composition upstream documents, and it is what `Checkbox`'s own docs page shows. Compute
  `checked` / `indeterminate` for a select-all parent in your own state, as the Table example does.
- **Click-to-edit is `useInlineEdit`** — draft, commit, cancel, focus restoration and the
  double-commit guard, with no opinion about the editor or the display. `EditableCell` is built
  on it.
- **Overlays** — enter/exit is driven by `data-starting-style`/`data-ending-style` on the popup root,
  inside a portal + positioner. Theme, toast, tooltip, and direction providers all come from
  `<VegaStackProvider>`; your app root needs `isolation: isolate` or portaled popups can render under
  page chrome.
- **Compound parts are flat exports** — `import { DialogTrigger, DialogContent }`. There is no
  `Dialog.Trigger`: the parts are separate named exports, never sub-properties of the root.
- **Polymorphism** uses Base UI's `render` prop, never Radix's `asChild`.
- **A link that looks like a button is a link** — one recipe:
  `<Link href="…" className={buttonVariants({ variant, size })}>`. Never
  `Button render={<Link/>} nativeButton={false}`: Base UI sets `role="button"` on a non-native
  element, so navigation announces as an action. `buttonVariants` comes from a module with no
  `'use client'`, so a Server Component uses it directly.

- **Dates & times come from one module** — `@/lib/date-time` (plain functions, server + client)
  and the `RelativeTime` / `DateTime` / `Duration` / `DueLabel` components in
  `@/components/ui/relative-time`. Never `toLocaleString`, a hand-rolled "minutes ago", or a date
  library. Pick by surface: updated/last-activity columns → `formatRelative` ("2m"); created/due
  dates → `formatDate` ("Today", "Mon", "Sep 25"); detail/audit rows → `formatDateTime`
  ("Sep 25 · 2:30 PM", `separator: "comma"` inside sentences); hover tooltips → the components'
  built-in `formatTooltip` ("Sep 25, 2026 · 2:30 PM IST"); due chips → `formatDueLabel` /
  `<DueLabel>` (tone overdue/soon/normal); lengths → `formatDuration` ("1h 15m", `clock` for
  players); schedules → `formatDateRange` / `formatTimeOfDay`; feed/inbox headers → `groupByDay`.
  Pass the viewer's `timeZone` (the `tz` cookie via `getTimeZone(cookie, orgZone)` on the server,
  `useTimeZone()` on the client; render `TimeZoneScript` + `TimeZoneProvider` once at the root).
  API/JSON output stays ISO.

## Do / Don't

**Do**

- Use a semantic token for every visual value.
- Use `render` for polymorphism and `cn()` from `@vegastack/design` for class merging.
- Use `Icon`/`BrandIcon` from `@vegastack/design/icons`, or `lucide-react` directly for internal
  chrome.
- Implement every applicable state: default, hover, focus, loading, empty, error, success, disabled.
- Put `truncate` on an inner span, with `min-w-0` on the flex container.
- Let the parent decide a form control's width — every control is `w-full`.
- Set numbers — counts, dates, amounts, quantities — in the regular font with `tabular-nums`, and
  right-align a numeric column. `font-mono` is for code and identifiers (`SYS-1042`) only.
- Title a page with `PageHeader` (`font-heading text-2xl font-semibold`); a section heading is
  `font-heading text-base font-medium`, a group label `text-xs font-medium text-muted-foreground`.
- Reach for a plain Tailwind utility for size, radius, shadow, z-index, alpha, weight and motion:
  `h-8`, `size-4`, `rounded-xl`, `shadow-md`, `z-50`, `bg-foreground/10`, `opacity-50`,
  `font-semibold`, `transition-colors duration-100 ease-in-out` are all on-system now.

**Don't**

- Hardcode a hex, a px value, or a raw Tailwind palette class (`bg-neutral-900`, `text-red-500`).
- Add a focus ring, outline or glow. No focus rings anywhere except Tabs: `base.css` paints a subtle
  background tint on `:focus-visible` and text entry tints its border instead; `ring-3`,
  `ring-ring/50`, `focus-visible:ring-*` and `focus-visible:outline-*` are rejected by lint.
- Leave a neutral hover on a button inside a tinted container — a status `Alert` already gives its
  buttons the family's own hover; don't override it back to `hover:bg-muted`.
- Set `outline-none` without providing another focus affordance.
- Use a status FILL as ink on its own tint — `bg-destructive/10 text-destructive` measures 3.99:1.
  The ink on a tint is `-text`.
- Pull in a second icon library, hand-write an inline `<svg>` as an icon, or pass
  `size`/`width`/`height` to a lucide component.
- Hand-roll a removable pill, or a `role="status"` live region with its own sequence counter.
- Give a form control a fixed width (`w-56`, `w-64`) — it reads fine on the page it was tuned for
  and overflows at 320px. Constrain the parent instead.
- Write an arbitrary text size (`text-[13px]`, `text-[0.8rem]`, `text-[2rem]/9`). It bypasses the
  `--text-*` namespace, so it receives neither the ramp's line-height nor its letter-spacing, and
  lint rejects it. Take the nearest ramp step. Likewise no local `tracking-*` and no `uppercase`.
- Draw a surface edge with a ring (`ring-1 ring-foreground/10`). Cards and floating surfaces use
  `border border-border` (BRD-1); lint rejects the ring.
- Expect a compatibility shim from before the reset. There is none — see the migration guide.
- Write retired vocabulary. It compiles to **nothing** — no build error, no type error — so a heading
  silently renders as body text. `vegastack-design doctor` scans your source and lists every
  occurrence with `file:line`; run it after any upgrade or generated change.

  | Retired                                                    | Write instead                                                                                                           |
  | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
  | `text-h1` · `text-h2` · `text-h3` · `text-h4`              | `PageHeader` (page) · `font-heading text-base font-medium` (section) · `text-lg font-semibold`; `text-base font-medium` |
  | `text-label` · `text-label-sm` · `text-strong`             | `text-sm font-medium` · `text-xs font-medium` · `text-sm font-semibold`                                                 |
  | `text-mono-label` · `text-code` · `text-code-sm`           | `text-xs font-medium` (a label is sans) · `font-mono text-sm` · `font-mono text-xs`                                     |
  | `text-display-{sm,md,lg,xl}`                               | `text-4xl` · `text-5xl` · `text-6xl` · `text-7xl`                                                                       |
  | `bg-{destructive,success,warning,info}-subtle`             | `bg-destructive/10` (the family at `/10`), `-text` ink on it                                                            |
  | `--alpha-*` · `--opacity-*`                                | the literal: `bg-foreground/10`, `opacity-50`                                                                           |
  | `--z-*`                                                    | `z-10` (raised) · `z-50` (every overlay; DOM order decides)                                                             |
  | `shadow-overlay` · `backdrop-blur-glass`                   | `shadow-md` (popover, menu) · `shadow-lg` (sheet, submenu, toast) · none on a dialog · delete it                        |
  | `icon-button` · `segmented`                                | `Button size="icon"` + `aria-label` · joined `ToggleGroup`                                                              |
  | `progress-indicator` · `field-inline` · `floating-surface` | `Progress` / `Spinner` · `EditableCell` · `Popover`                                                                     |
  | `section-header` · `sonner`                                | your own heading markup · `toast` (`toast.add({ title })`)                                                              |

## Reference

Full component documentation, live previews, prop tables, and accessibility notes:
<https://design.vegastack.com/docs/components>. Machine-readable summaries for agents are at
`/llms.txt` and `/llms-full.txt` on the same host.
