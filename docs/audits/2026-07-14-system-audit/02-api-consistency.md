# API & Code-Pattern Consistency Audit — VegaStack UI (68 components)

Scope: every file in `packages/ui/registry/ui/*.tsx` (canonical source), cross-checked
against `docs/ledger/component-matrix.md`, `docs/ledger/authoring-guide.md`, and
`docs/ledger/ref-forwarding-spec.md`. All 68 non-test files were read in full.
No source files were modified.

---

## (a) Summary of top inconsistencies

1. **Two components use `useRender` without the `'use client'` directive that every
   sibling `useRender` component treats as mandatory.** `marker.tsx` and `bubble.tsx`
   (`BubbleContent`) call `useRender` from `@base-ui/react/use-render` with no client
   boundary, while `badge.tsx`, `breadcrumb.tsx`, `pagination.tsx`, and `sidebar.tsx`
   all carry `'use client'` *specifically because* they use the same hook (documented
   in `breadcrumb.tsx`'s own JSDoc). This is very likely a real SSR/RSC bug, not just
   a style nit — see §(c).
2. **`React.forwardRef` vs React-19 ref-as-prop is split roughly 50/50**, in direct
   contradiction of `docs/ledger/ref-forwarding-spec.md`, which says forwardRef is
   "deprecated in React 19" and mandates the ref-as-prop pattern. ~24 components still
   use `forwardRef`; ~30+ use the newer pattern. See §(c) for the full list.
3. **The "semantic color family" concept has three different prop names** across the
   system: `variant` (Button, Alert), `color` (Badge), `intent` (AlertDialog,
   EmptyState). A consumer moving between components has to relearn the axis name
   every time.
4. **Compound-component export style is inconsistent.** 5 components (`Card`, `Alert`,
   `Breadcrumb`, `EmptyState`, `Pagination`) expose both a dotted namespace
   (`Card.Header`) *and* flat named exports. Every other multi-part component
   (`Dialog`, `AlertDialog`, `Sheet`, `DropdownMenu`, `ContextMenu`, `Select`, `Tabs`,
   `Accordion`, `Collapsible`, `RadioGroup`, `ToggleGroup`, `Command`, `Table`) exposes
   **only** flat names — no `Object.assign` namespace at all.
5. **Button's `variant` enum conflates two independent axes** (visual treatment ×
   semantic color) into 13 flat string values (`destructive`,
   `destructive-outline`, `success-outline`, …), whereas `Badge` factors the same two
   axes cleanly into orthogonal `variant` (3 values) × `color` (5 values) props.
6. **Form-control sizing is inconsistent**: `Input`, `Textarea`, `RadioGroupItem`, and
   the `OTPInput` slot expose **no** `size` prop at all (fixed height), while
   `Button`, `Select`, `Checkbox`, `Switch`, `Toggle`, `Kbd`, `Avatar` all expose a
   scalable `size`. A form built from `Input` + `Select` + `Checkbox` cannot uniformly
   resize.
7. **`ComponentProps` / `ComponentPropsWithRef` / `ComponentPropsWithoutRef` are used
   interchangeably** for the exact same purpose (typing a Base UI wrapper's props),
   even within a single file (e.g. `marker.tsx`'s `Marker` uses `ComponentPropsWithRef`
   correctly but its siblings `MarkerIcon`/`MarkerContent` use bare `ComponentProps`).
8. **`docs/ledger/component-matrix.md`'s §7.6 render-contract list is stale.** It
   names `Badge`, `Breadcrumb.Link`, `Pagination.Link`, `Sidebar.MenuButton`,
   `Sidebar.Trigger` as the `useRender` primitives, but doesn't mention `Marker` or
   `BubbleContent`, which use the identical pattern. The exemption list also names
   only `SplitButton` as a documented "no single root, no `render`" exception, but
   `ColorPicker`, `CountrySelect`, `StateSelect`, `DatePicker`/`DateRangePicker`, and
   `EmojiPicker` are architecturally identical (composite pickers, no `render` prop)
   and are undocumented.
9. Two nearly-identical "async lifecycle" concepts are named differently:
   `AutoSaveInput` exposes `data-status` (`idle`/`saving`/`saved`/`error`) while
   `Image` exposes `data-state` (`loading`/`loaded`/`error`) for the same kind of
   "in-flight async result" idea.
10. **`EmojiPicker.onSelect` vs `ColorPicker.onValueChange`** — both are "pick one
    item from a popover grid" components with near-identical shape, but use different
    callback names for the same concept.

---

## (b) Size / variant naming matrix

### Control-height scale (the shared 24/28/32/40 px ladder)

| Component | xs (24px) | sm (28px) | default (32px) | lg (40px) | notes |
|---|---|---|---|---|---|
| `Button` | ✅ h-6 | ✅ h-7 | ✅ h-8 | ✅ h-10 | canonical scale + `icon-*` mirror |
| `IconButton` | ✅ (→icon-xs) | ✅ (→icon-sm) | ✅ (→icon) | ✅ (→icon-lg) | delegates to Button |
| `SplitButton` | ✅ | ✅ | ✅ | ✅ | delegates to Button |
| `Select` trigger | ❌ none | ✅ h-7 | ✅ h-8 | ✅ h-10 | missing `xs` |
| `Toggle` / `ToggleGroupItem` | ❌ none | ✅ h-7 | ✅ h-8 | ✅ h-10 | missing `xs` |
| `Pagination.Link` | ❌ none | ✅ h-7 | ✅ h-8 | ✅ h-10 | + a separate `icon` size |
| `Sidebar.MenuButton` | ❌ none | ✅ h-7 | ✅ h-8 | ✅ h-10 | missing `xs` |
| `Input` | ❌ | ❌ | fixed h-8 only | ❌ | **no `size` prop at all** |
| `Textarea` | ❌ | ❌ | fixed min-h-16 | ❌ | **no `size` prop at all** |
| `RadioGroupItem` | ❌ | ❌ | fixed size-4 | ❌ | **no `size` prop at all** |
| `OTPInput` slot | ❌ | ❌ | fixed size-8 | ❌ | **no `size` prop at all** |

### Icon / indicator scale (separate, smaller ladder)

| Component | xs | sm | default | lg | notes |
|---|---|---|---|---|---|
| `Spinner` | size-3 (12) | size-3.5 (14) | size-4 (16) | size-6 (24) | |
| `StatusIcon` | size-3.5 (14) | size-4 (16) | size-5 (20) | size-6 (24) | |
| `ProgressIndicator` | size-3.5 (14) | size-4 (16) | size-5 (20) | size-6 (24) | identical to StatusIcon — good |
| `Avatar` | size-6 (24) | size-7 (28) | size-8 (32) | size-10 (40) + `xl` size-12 (48) | matches Button's control scale, plus an extra `xl` |
| `Checkbox` | ❌ | size-3.5 (14) | size-4 (16) | ❌ | only 2 steps, no `xs`/`lg` |
| `Kbd` | h-4 (16) | h-5 (20) | h-6 (24) | ❌ | only 3 steps, no `lg` |
| `Switch` | ❌ | h-4/w-7 | h-5/w-9 | h-6/w-11 | 3 steps, no `xs` (expected — smaller control) |
| `Progress` (bar) | ❌ | h-1.5 (6) | h-2 (8) | h-3 (12) | 3 steps, no `xs` |
| `Badge` | ❌ | h-5 (20) | h-5 (20) | h-6 (24) | **`sm` and `default` render the same height** — differ only in horizontal padding (`px-1.5` vs `px-2`) |

**Finding:** "Same visual size = same token value" mostly holds for the icon-scale
group (Spinner/StatusIcon/ProgressIndicator/Avatar all agree at each step), but the
**control-height group has a real split**: `Button`/`IconButton`/`SplitButton` support
4 steps (`xs`/`sm`/`default`/`lg`); `Select`/`Toggle`/`Pagination`/`Sidebar` support
only 3 (missing `xs`); and `Input`/`Textarea`/`RadioGroupItem`/`OTPInput` support 0 —
so "put an `Input` next to a `Button size="sm"`" cannot be done without manually
overriding the Input's fixed `h-8`.

### "Semantic color family" prop naming

| Component | Prop name | Values |
|---|---|---|
| `Button` | `variant` | `default/secondary/outline/ghost/link/destructive/success/warning/info/glass/destructive-outline/success-outline/warning-outline/info-outline` (13, conflates style+color) |
| `Alert` | `variant` | `default/info/success/warning/destructive` |
| `Badge` | `color` (+ separate `variant` for style) | `default/success/warning/destructive/info` |
| `AlertDialog(Action)` | `intent` | `default/destructive/success/warning` |
| `EmptyState.Icon` | `intent` | `default/info/destructive` |
| `StatusIcon` | `status` | `todo/progress/blocked/done` (different domain, but same "pick a semantic tint" shape) |

Three names (`variant`, `color`, `intent`) for what is architecturally the same
"pick a semantic status family" decision — see Finding (a)3.

---

## (c) Per-check findings with file:line evidence

### 1. CVA usage

- Nearly universal for components with visual variants; ~30 `cva()` call sites found
  across the registry (button, badge, alert, avatar, avatarGroup, checkbox,
  contextMenuItem, dropdownMenuItem, dialogContent, sheet, emptyState,
  emptyStateIcon, field, image, kbd, marker, bubble, bubbleReactions,
  paginationLink, progress, progressIndicator, radioGroup, selectTrigger, skeleton,
  spinner, statusIcon, switch, switchThumb, tabsList, toggle, sidebarMenuButton).
- **Every single `cva()` call site includes `defaultVariants`** — 100% compliance,
  a genuine strength, no violations found.
- Components with visual state but **no `cva()`** (inline conditional classes
  instead): `color-picker.tsx` (isSelected ternary), `filter-bar.tsx`
  (`FilterChip`'s `active` ternary at `filter-bar.tsx:192-200`), `data-list.tsx`
  (`alignClass()` helper function instead of a variant), `date-picker.tsx`
  (`CalendarDayButton` builds a huge literal `cn(buttonVariants(...), "data-[...]:...")`
  string instead of its own `cva`). These are defensible (small, 1-2 axis toggles)
  but are a real pattern split from the cva-everywhere convention used by comparably
  simple components like `Skeleton` or `StatusIcon`.

### 2. `defaultVariants`

- ✅ No violations — see above.

### 3. `data-*` state attributes

- `data-slot` is applied essentially everywhere — a real strength.
- No single canonical attribute name for "this is the active/selected one":
  `data-active` (`TabsTrigger` via Base UI, `SidebarMenuButton` at
  `sidebar.tsx:353`, `Pagination.Link` at `pagination.tsx:141`, `FilterChip` at
  `filter-bar.tsx:191`, `PageHeader`'s `FavoriteStar` at `page-header.tsx:123`),
  `data-selected` (`DataList` row at `data-list.tsx:532`, `Table` row hook at
  `table.tsx:128` — consumer-set, Table itself doesn't set it), `data-checked` /
  `data-pressed` / `data-panel-open` (all native Base UI attrs, unmodified, fine).
  The overlap between `data-active` and `data-selected` for what is conceptually
  the same "is this the chosen one" idea across list/table/menu contexts is real
  drift, though partially explained by Base UI's own native vocabulary differing
  per primitive.
- Async-lifecycle naming split: `AutoSaveInput` → `data-status` (`idle/saving/
  saved/error`, `auto-save-input.tsx:203`) vs `Image` → `data-state`
  (`loading/loaded/error`, `image.tsx:139`). Same shape of concept, different
  attribute name.
- One-off state attributes that are fine as-is (distinct concepts, no real sibling
  to align with): `data-copied` (`copy-button.tsx:101`), `data-unread`
  (`notification-bell.tsx:74`), `data-fallback` (`state-select.tsx:1507`,
  free-text-input branch), `data-loading` (`badge.tsx:204`, `button.tsx:112` — these
  two *do* agree with each other, good).

### 4. Ref forwarding — the ref-forwarding-spec vs actual code

`docs/ledger/ref-forwarding-spec.md:4` states plainly: *"React 19 ref-as-prop is the
idiom here (NOT `React.forwardRef`, which is deprecated in React 19)."* Gold
references cited are `button.tsx` (useRender/Pattern B) and `alert.tsx` (Pattern A
type-swap). Actual code is split:

**Still uses `React.forwardRef` (spec violation, ~24 files):**
`accordion.tsx` (all 4 exports), `auto-save-input.tsx`, `avatar.tsx` (both `Avatar`
and `AvatarGroup`), `card.tsx` (all 7 exports), `checkbox.tsx`, `collapsible.tsx`
(all 3 exports), `image.tsx`, `input.tsx`, `label.tsx`, `otp-input.tsx`,
`password-input.tsx`, `progress-indicator.tsx`, `progress.tsx`, `radio-group.tsx`
(both exports), `settings-row.tsx` (all 3 exports), `slider.tsx`, `spinner.tsx`,
`status-icon.tsx`, `switch.tsx`, `table.tsx` (all 8 exports), `tabs.tsx` (all 4
exports), `textarea.tsx`, `toggle-group.tsx` (both exports).

**Uses React-19 ref-as-prop correctly (per spec):** `button.tsx`, `alert.tsx`,
`badge.tsx` (Pattern B / useRender), `breadcrumb.tsx` (`BreadcrumbLink`),
`bubble.tsx` (`BubbleContent`), `marker.tsx`, `kbd.tsx`, `pagination.tsx`
(`PaginationLink`), `sidebar.tsx` (`SidebarMenuButton`, `SidebarTrigger`), `toggle.tsx`,
`skeleton.tsx`, `color-picker.tsx`, `country-select.tsx`, `state-select.tsx`,
`emoji-picker.tsx`, `field-inline.tsx`, `truncated-text.tsx`/`IconText`,
`relative-time.tsx`, `data-list.tsx` (via `ComponentPropsWithRef` + spread).

**Missing ref support entirely (neither pattern, DOM-root component with no ref
path):**
- `bubble.tsx`'s `Bubble` and `BubbleGroup` — typed `React.ComponentProps<"div">`
  (not `WithRef`), and the function bodies don't destructure/forward `ref` at all
  (`bubble.tsx:12-26`, `bubble.tsx:111-126`). `BubbleReactions` too
  (`bubble.tsx:187-229`, typed `React.ComponentProps<"div">`).
- `marker.tsx`'s `MarkerIcon` and `MarkerContent` — typed `React.ComponentProps<"span">`
  (not `WithRef`) and don't destructure `ref` (`marker.tsx:97-136`). Note `Marker`
  itself (the root) *does* correctly support ref via `useRender`.
- `message.tsx` — every export (`MessageGroup`, `Message`, `MessageAvatar`,
  `MessageContent`, `MessageHeader`, `MessageFooter`) is typed
  `React.ComponentProps<"div">`, no ref support (whole file, `message.tsx:14-141`).

These three files (`bubble.tsx`, `marker.tsx`, `message.tsx`) are the newest
additions (the sanctioned chat-component exception per `AGENTS.md`) and were
evidently authored to a different, less-strict template than the rest of the
registry — for host-tag components elsewhere (e.g. `card.tsx`, `table.tsx`), even
though those use the deprecated `forwardRef` pattern, they at least DO forward a
ref. The chat components in several cases forward **no ref at all** on `div`/`span`
leaf parts, which is a strict regression versus the ref-forwarding-spec's blanket
requirement ("every exported DOM-root component must forward a consumer ref").

**Typing inconsistency layered on top:** even among files that do the right thing,
the *type* used to describe props varies three ways for what should be one
decision:
- `ComponentPropsWithRef<'x'>` (spec-correct, e.g. `alert.tsx:52`, `kbd.tsx:50`,
  `truncated-text.tsx:23`)
- `ComponentPropsWithoutRef<'x'>` (old style, still used in a dozen files even
  outside the forwardRef group, e.g. `card.tsx:10`, `accordion.tsx:14`)
- bare `ComponentProps<'x'>` (ambiguous — relies on React 19's intrinsic-element
  ref inference for host tags, but doesn't reliably carry ref typing for Base UI
  primitive references), e.g. `message.tsx:14`, `bubble.tsx:12`, `marker.tsx:97`,
  and the majority of the overlay wrappers (`dialog.tsx`, `popover.tsx`,
  `tooltip.tsx`, `hover-card.tsx`, `sheet.tsx`, `dropdown-menu.tsx`,
  `context-menu.tsx` all type their sub-parts as bare `React.ComponentProps<typeof
  Base…>`).

### 5. className merging

- ✅ Strong, consistent compliance: `cn(baseClasses, className)` with user
  `className` always last was found in essentially every component checked. No
  counter-examples found where a component drops or reorders the consumer
  `className`.
- Function-form `className` (Base UI's `className: (state) => string` API) is
  handled correctly and consistently in `button.tsx:99-102`, `toggle.tsx:48-51`,
  `toggle-group.tsx:100-103` and `:169-172`, `input.tsx:64-73` — all wrap with the
  same `typeof className === 'function' ? (state) => cn(base, className(state)) :
  cn(base, className)` idiom. Good consistency for a subtle pattern.

### 6. `'use client'` placement

- **Bug candidate — `marker.tsx` and `bubble.tsx` (`BubbleContent`) use `useRender`
  without `'use client'`.** Compare:
  - `badge.tsx:1-9` — has `'use client'`, uses `useRender` (`badge.tsx:195`).
  - `breadcrumb.tsx:1-8` — has `'use client'`; its own JSDoc at
    `breadcrumb.tsx:15-16` explicitly says *"`Breadcrumb.Link` uses Base UI
    `useRender` composition for router links, so the module keeps a client
    boundary even though the DOM it emits is presentational."*
  - `pagination.tsx:1-10` — has `'use client'`, uses `useRender` at `pagination.tsx:134`.
  - `sidebar.tsx:1-10` — has `'use client'`, uses `useRender` at `sidebar.tsx:346`
    and `:410`.
  - `marker.tsx:1-6` — **no `'use client'`**, yet calls `useRender` at
    `marker.tsx:84`.
  - `bubble.tsx:1-6` — **no `'use client'`**, yet `BubbleContent` calls `useRender`
    at `bubble.tsx:148`.
  This is the single clearest, highest-confidence finding in the audit: two files
  break an established, self-documented convention that four sibling files follow
  precisely because of the same hook. Left as-is, importing `Marker` or
  `BubbleContent` from a Server Component boundary is likely to throw ("hooks can
  only be used in Client Components" or an equivalent Base UI runtime error).
- Otherwise, `'use client'` placement is largely correct and matches the "only at
  interactive/hook-using leaves" rule: `card.tsx`, `table.tsx`, `label.tsx`,
  `kbd.tsx`, `empty-state.tsx`, `settings-row.tsx`, `skeleton.tsx`,
  `status-icon.tsx`, `spinner.tsx`, `progress-indicator.tsx`, `truncated-text.tsx`'s
  non-hook helper types, `message.tsx` are all correctly server-safe (no
  directive).
- `separator.tsx:3` carries `'use client'` despite the component having zero hooks
  and zero interactivity (it only branches on a prop to decide static ARIA attrs,
  `separator.tsx:34-58`). Worth a second look — either Base UI's `Separator`
  genuinely requires a client boundary internally (plausible, unverified from this
  file alone) or this is an unnecessary client marking that could be relaxed,
  unlike `label.tsx`/`kbd.tsx` which wrap no Base UI primitive and stay server-safe.

### 7. Export patterns

- **Compound-namespace split** (see Finding (a)4): `Object.assign(Root, {...})`
  used by exactly 5 files — `card.tsx:183-190`, `alert.tsx:204-208`,
  `breadcrumb.tsx:184-191`, `empty-state.tsx:185-190`, `pagination.tsx:229-236`.
  Every other multi-part component (`dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`,
  `dropdown-menu.tsx`, `context-menu.tsx`, `select.tsx`, `tabs.tsx`,
  `accordion.tsx`, `collapsible.tsx`, `radio-group.tsx`, `toggle-group.tsx`,
  `command.tsx`, `table.tsx`) is flat-only. There is no documented rule anywhere
  in the ledger for *when* a compound component should get the dotted namespace —
  it appears to be author preference rather than a system decision.
- `<Name>Props` type export: consistently present and consistently named
  `<PascalName>Props` across all 68 files — a real strength, no violations.
- A handful of components declare an explicit function return type
  (`React.ReactElement` for `icon-button.tsx:56`, `page-header.tsx:169`,
  `notification-bell.tsx:65`, `split-button.tsx:124`; but `state-select.tsx:1492`
  uses `React.JSX.Element` instead) while the vast majority of components (Badge,
  Button, Card, Alert, …) declare no return type at all and rely on inference. Two
  different spellings of "this returns JSX" for the ~5 components that bother
  annotating it at all.

### 8. Base UI `render` prop support

- Matches the ledger's documented list (`Badge`, `Breadcrumb.Link`,
  `Pagination.Link`, `Sidebar.MenuButton`, `Sidebar.Trigger`) plus the Base UI
  single-root wrappers it names generically (`Button`, `Checkbox`, `Switch`,
  `RadioGroupItem`, `Slider`, `Progress`, and the rest of the overlay/menu/tabs
  family via unrestricted prop spreading).
- **Undocumented in the ledger but present in code:** `Marker` (`marker.tsx:55,
  84`) and `BubbleContent` (`bubble.tsx:133, 148`) both expose `render` via
  `useRender` — the exact same pattern as `Badge`/`Breadcrumb.Link`, but absent
  from `component-matrix.md`'s §7.6 list. The matrix needs an update pass for the
  chat-component addition.
- **`SplitButton` is the only documented `render`-exemption** in the ledger
  (`component-matrix.md:131`), but at least 5 other components share the identical
  shape — a composite with no single polymorphic root, hence no `render` prop:
  `ColorPicker`, `CountrySelect`, `StateSelect`, `DatePicker`/`DateRangePicker`,
  `EmojiPicker` (all pickers composing `Popover` + `Button`/`Command` internally,
  none exposing `render`). None of these `Omit<…, 'render'>` from a Button-derived
  type the way `SplitButtonProps` explicitly does (so `design-lint`'s
  `[render-contract]` rule, which only fires on an explicit `Omit`, wouldn't catch
  them either way) — but from a "does this look like one system" standpoint, the
  exemption reasoning is identical and should be documented identically.
- Single-root **leaf** presentational components that never had a `render` prop at
  all (and hence never trip the lint's `Omit` check) include `Kbd`, `StatusIcon`,
  `Spinner`, `Skeleton`, `ProgressIndicator`, `TruncatedText`, `RelativeTime`,
  `NotificationBell`. `Kbd` and `Badge` are the most directly comparable pair here
  (both small inline chips with a single host element) — `Badge` supports `render`,
  `Kbd` does not. This may be an intentional scope call (Kbd rarely needs to become
  an `<a>`), but it's not documented as a decision anywhere, and the design-lint
  rule as described in the ledger (`component-matrix.md:134`) can't actually detect
  "missing render on a single-root component" — only "explicitly Omitted render" —
  so this category of drift is structurally invisible to CI.

### 9. Prop naming drift

- `onValueChange` is the dominant, well-adopted convention for controlled value
  changes: `Select`, `RadioGroup`, `ToggleGroup`, `Tabs`* (Base UI native),
  `Accordion`* (Base UI native), `Collapsible`* (native), `DatePicker`,
  `DateRangePicker`, `ColorPicker`, `CountrySelect`, `StateSelect`,
  `AutoSaveInput`, `FilterBar` (for `search.onValueChange`), `Slider`.
- `Checkbox` and `Switch` both use `onCheckedChange` (Base UI's boolean-specific
  name) — consistent with each other, and defensible as a distinct semantic
  ("checked", a boolean, not a generic "value").
- **`EmojiPicker.onSelect`** (`emoji-picker.tsx:427`) breaks from
  `ColorPicker.onValueChange` (`color-picker.tsx:88`) despite both being
  "click one option out of a popover grid, close the popover" components with
  near-identical shape (`Popover` + grid of icon `Button`s + optional
  `closeOnSelect`/auto-close). One should probably follow the other.
- `FieldInline.onCommit` (`field-inline.tsx:17`) is deliberately distinct
  (fires on blur/Enter, not per-keystroke) and is well-documented as such — not
  flagged as drift, just noted as a real, intentional third shape.
- `disabled` (never `isDisabled`) and `loading` (never `isLoading`) are used with
  100% consistency across the registry — a genuine strength, no violations found.
- `open` / `defaultOpen` / `onOpenChange` is applied uniformly across every
  overlay-style component (`Dialog`, `AlertDialog`, `Sheet`, `Popover`,
  `HoverCard`, `Collapsible`, `EmojiPicker`, `SidebarProvider`) — another
  strength.
- `DataList`'s per-column `align` only supports `"start" | "end"`
  (`data-list.tsx:57`) while the overlay family's `align` supports
  `"start" | "center" | "end"`. Reasonable for a table column, but it means
  `align` isn't a uniformly-typed concept across the system.

### 10. JSDoc / displayName / file structure

- JSDoc coverage is excellent and consistent system-wide: every exported prop has
  a description, `@default` is used correctly wherever a prop has a runtime
  default, and every component has a top-level doc comment with at least one
  `@example`. This is a clear strength — no material violations found.
- `displayName` is set only on `forwardRef`-based components (where it's needed
  because forwardRef obscures the function name) and correctly omitted from plain
  function-component exports (which get their name from the function declaration
  automatically) — this is actually the *correct*, non-redundant behavior, not an
  inconsistency, despite looking asymmetric at first glance.
- File structure (imports → cva → types → component → exports) is followed
  consistently across all 68 files — no violations found.

### 11. TypeScript quality

- No `any` usage found in any of the 68 files.
- Type assertions are rare and each is narrowly scoped and commented:
  `kbd.tsx:104` (`ref as React.Ref<HTMLSpanElement>` for the multi-key group
  path), `truncated-text.tsx:101,190` (`ref as React.Ref<never>` to merge a
  consumer ref onto a variable JSX tag — `IconText` and `TruncatedText`),
  `color-picker.tsx:181` and `sonner.tsx:87` (`as React.CSSProperties` /
  `as CSSProperties`, both scoped to setting only `--*` custom properties, per
  the documented inline-style exception).
- `React.ReactElement` vs `React.JSX.Element` used for the same purpose in
  different files (see §7 above) — minor but real.
- `DataList<T>` and `TruncatedText`'s helper (`useOverflow`) are the only real
  generics in the registry; both are used correctly and narrowly.

---

## (d) Violations of the repo's own stated conventions

| Convention (source) | Violated by |
|---|---|
| "React 19 ref-as-prop is the idiom here (NOT `React.forwardRef`, which is deprecated in React 19)" — `ref-forwarding-spec.md:4` | 24 files still use `forwardRef` (full list in §c.4) |
| "Every exported DOM-root component must forward a consumer `ref`" — `ref-forwarding-spec.md:3` | `bubble.tsx` (`Bubble`, `BubbleGroup`, `BubbleReactions`), `marker.tsx` (`MarkerIcon`, `MarkerContent`), `message.tsx` (all 6 exports) forward no ref at all |
| "`'use client'` at the top ONLY for interactive components (anything using hooks/Base UI interactive parts)" — `authoring-guide.md:15`, and the file-local precedent set by `badge.tsx`/`breadcrumb.tsx`/`pagination.tsx`/`sidebar.tsx` for `useRender` specifically | `marker.tsx`, `bubble.tsx` use `useRender` (a hook) with no `'use client'` |
| "8. Consistent variant/size naming across components (mirror Button's scale where applicable: sizes xs/sm/default/lg)" — `authoring-guide.md:17` | `Select`, `Toggle`, `Pagination.Link`, `Sidebar.MenuButton` omit `xs`; `Input`, `Textarea`, `RadioGroupItem`, `OTPInput` omit `size` entirely; `Checkbox` and `Kbd` use truncated scales |
| §7.6 render-contract primitive list — `component-matrix.md:126` | Doesn't list `Marker` / `BubbleContent`, which use the identical `useRender` pattern (stale doc, not a code bug, but a doc/code drift item) |
| §7.6 render-contract exemption list — `component-matrix.md:131` | Only documents `SplitButton`; `ColorPicker`/`CountrySelect`/`StateSelect`/`DatePicker`/`DateRangePicker`/`EmojiPicker` share the identical "composite, no single root, no `render`" shape and are undocumented |

---

## (e) Proposed canonical conventions where drift exists

1. **Ref forwarding:** finish the React-19 migration. Convert the 24 remaining
   `forwardRef` components to the ref-as-prop pattern per the spec (mechanical,
   low-risk — the spec's Pattern A/B/C/D already cover every shape present in this
   codebase). Add ref support to `bubble.tsx`, `marker.tsx`, and `message.tsx`'s
   leaf `div`/`span` parts using Pattern C (explicit `ref={ref}` on the host
   element) so every exported part, not just the roots, is ref-capable — matching
   `card.tsx`'s per-part ref support, which is the closest existing template for a
   "family of div-based compound parts."
2. **`'use client'` + `useRender`:** treat "uses `useRender`" as an unconditional
   trigger for `'use client'`, and add it as a `design-lint` rule (grep for
   `useRender(` in a file with no `'use client'` directive) so this class of bug
   can't recur. Fix `marker.tsx` and `bubble.tsx` immediately — this is the
   highest-confidence, easiest, highest-value fix in this audit.
3. **Semantic-color prop naming:** standardize on one name. `intent` is the best
   candidate (already used by 2 components, reads clearly as "the tone this
   communicates," and doesn't collide with Badge's separate visual-style axis).
   Migrate `Button.variant`'s color-carrying values and `Badge.color` to `intent`
   in a future major version; keep `variant` reserved exclusively for
   *visual treatment* (`solid`/`outline`/`ghost`/`subtle`/`minimal`/`glass`, no
   color words in the enum).
4. **Compound namespace exports:** either (a) drop `Object.assign` everywhere and
   go flat-only (simplest, matches the 13-component majority), or (b) add it to
   every multi-part component for a consistent dotted-and-flat API. Given 13
   components are already flat-only and would need to be extended vs. 5 needing to
   be simplified, (a) is the lower-risk, lower-diff choice — document the decision
   in the authoring guide either way so future components stop being 50/50 on this.
5. **Form-control size scale:** give `Input`, `Textarea`, `RadioGroupItem`, and
   `OTPInput` the same `sm`/`default`/`lg` (at minimum) size prop that `Select` and
   `Checkbox` already have, mapped onto the same 28/32/40px control-height ladder
   `Button` defines. This is probably the single highest-value visual-consistency
   fix in the whole registry, since forms mixing `Input` + `Select` + `Button` are
   the single most common composition in the system.
6. **Prop-type spelling for Base UI wrappers:** adopt `ComponentPropsWithRef<typeof
   X>` uniformly (per the ref-forwarding-spec) instead of the current 3-way mix of
   `ComponentProps` / `ComponentPropsWithRef` / `ComponentPropsWithoutRef`; add a
   lint rule banning bare `React.ComponentProps<typeof Base…>` in
   `packages/ui/registry/ui/*.tsx` outside of intrinsic-element props (`'div'`,
   `'span'`, etc., where the distinction matters less).
7. **`EmojiPicker.onSelect` → `onValueChange`:** rename for consistency with
   `ColorPicker`; keep a deprecated `onSelect` alias for one release if backward
   compat matters.
8. **Update `component-matrix.md` §7.6** to include `Marker`/`BubbleContent` in the
   `useRender` list and add `ColorPicker`/`CountrySelect`/`StateSelect`/
   `DatePicker`/`DateRangePicker`/`EmojiPicker` to the exemption list alongside
   `SplitButton`, with the same one-line rationale ("composite, no single
   polymorphic root").
