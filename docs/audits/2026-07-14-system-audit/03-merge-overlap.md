# System Audit 03 — Component Overlap, Merge Candidates & shadcn Parity

**Scope:** all 68 non-icon registry items in `packages/ui/registry/ui/*.tsx` (confirmed count: `packages/ui/registry.json` has 507 `registry:ui` entries, 439 of which are `categories: ["icons"]` — 507 − 439 = 68 real components). Read-only audit; no source files were modified.

**Method:** five parallel deep-read passes over the suspected clusters (full component + test file reads, `file:line` citations, LOC counts, `@base-ui/react` import verification) plus a direct WebFetch/WebSearch pass against `ui.shadcn.com` (July 2026 state) for parity, and a light grep-level scan of the remaining components not called out in the brief (accordion/collapsible, dialog/sheet/alert-dialog, dropdown-menu/context-menu, checkbox/radio-group/switch, color-picker/emoji-picker) to confirm no additional overlap was missed.

---

## 1. Verdict table — every audited cluster

| Cluster | Component | LOC | Verdict | One-line rationale |
|---|---|---|---|---|
| Action controls | `button.tsx` | 122 | KEEP (root primitive) | Owns 15-variant×8-size CVA; every other action component composes it |
| | `icon-button.tsx` | 62 | **MERGE INTO Button** | Zero `cva()` calls; pure size-name remap (`icon-button.tsx:11-16`) + TS-only required-`aria-label`. `Button` already exposes `size="icon"`/`icon-xs`/`icon-sm`/`icon-lg` (`button.tsx:48-51`), and docs already bypass IconButton and call `Button` directly (`apps/docs/components/preview/button.tsx:45-54`) |
| | `split-button.tsx` | 185 | KEEP SEPARATE | Thin composition of `Button`+`DropdownMenu`, but the seam-alignment CSS (`split-button.tsx:74-83,156,172`) and the `actions`-XOR-`menu` discriminated union (`:55-71`) are real, easy-to-botch design work worth integrity-hashing |
| | `copy-button.tsx` | 109 | KEEP SEPARATE | Owns real async/timer state: unmount-safe timeout cleanup, cancelable `onPress`, silent clipboard-failure handling (`copy-button.tsx:70-92`) — not just styling |
| | `toggle.tsx` | 56 | KEEP SEPARATE | Base UI ships `Toggle` as its own primitive (`toggle.tsx:7`); binary `aria-pressed` semantics Button has no concept of |
| | `toggle-group.tsx` | 187 | KEEP SEPARATE | Base UI ships `ToggleGroup` as its own primitive; roving focus + array-based multi/single selection has no Toggle equivalent |
| Loading state | `progress.tsx` | 137 | KEEP SEPARATE | Base UI-backed linear bar, nullable/indeterminate `value` |
| | `progress-indicator.tsx` | 203 | KEEP SEPARATE | Hand-rolled server-safe SVG radial ring — deliberate linear/radial *pair*, own docs say so (`progress-indicator.mdx:22`) |
| | `spinner.tsx` | 84 | KEEP (as component); **fix 3 consumers** | Correct canonical indeterminate-loader, but `button.tsx:118`, `badge.tsx:210-213`, `status-icon.tsx:105` each re-inline `Loader`+`animate-spin motion-reduce:animate-none` instead of composing `<Spinner>` — 4 independent copies of the same CSS string |
| | `skeleton.tsx` | 130 | KEEP SEPARATE | Distinct affordance (content-shaped placeholder vs indeterminate glyph), zero overlap |
| Status/indicator | `badge.tsx` | 230 | KEEP (reuse target) | Only primitive with color×variant×size×dot×loading semantics; correct reuse target for other components' counters |
| | `bubble.tsx` | 229 | KEEP SEPARATE | Chat-surface primitive (sanctioned, `docs/plans/add-chat-components.md`); no status/dot concept to overlap with anything |
| | `marker.tsx` | 136 | KEEP SEPARATE | Row-layout container (default/separator/border), orthogonal to status-icon's glyph role, not redundant |
| | `status-icon.tsx` | 116 | KEEP SEPARATE | Closed 4-state (todo/progress/blocked/done) glyph; a candidate *child* of `MarkerIcon`, not a competing implementation |
| | `notification-bell.tsx` | 96 | KEEP primitive; **merge inner badge** | Non-trivial `99+` clamp + aria-label folding logic justifies the component, but its hand-rolled counter `<span>` (`notification-bell.tsx:81-93`) duplicates `Badge`'s CSS instead of rendering `<Badge>` |
| Field family | `field.tsx` | 292 | KEEP | Canonical Base UI-backed field primitive, RHF/Zod-tested |
| | `field-inline.tsx` | 215 | KEEP SEPARATE | Display↔edit **mode toggle** (`isEditing` state), not a layout variant of Field — zero code shared with `field.tsx` (`field-inline.tsx:7`), and rightly so |
| | `label.tsx` | 58 | KEEP | Genuinely reused bare `<label>` outside Field contexts |
| | `settings-row.tsx` | 170 | KEEP SEPARATE | Inverse control/label ordering + responsive stacking that neither `Field` nor `FieldInline` has; page-layout composition, not a field-family member |
| | `field-form.test.tsx` | — | **N/A — not an orphaned component** | RHF+Zod integration contract test for `Field`, confirmed via `docs/ledger/codex-rounds.md:130` and the file's own header comment; deliberately has no companion `.tsx` |
| Text entry | `input.tsx` | 130 | KEEP | Base primitive |
| | `textarea.tsx` | 57 | KEEP | Multi-line, `autoGrow` via `field-sizing: content` |
| | `password-input.tsx` | 162 | KEEP SEPARATE | Real composed value beyond `type` switching: a11y-wired toggle + live-region requirements checklist (`password-input.tsx:59-162`) |
| | `otp-input.tsx` | 218 | KEEP SEPARATE | Built on a wholly separate Base UI primitive family (`OTPField`), does not wrap `Input` at all |
| | `auto-save-input.tsx` | 248 | KEEP SEPARATE | Debounced async persistence + saving/saved/error status UI; single-line, plain-text |
| | `text-edit.tsx` | 522 | KEEP SEPARATE | Tiptap rich-text (HTML) WYSIWYG editor — **the brief's premise that it overlaps `auto-save-input` does not hold**: no debounce, no `onSave`, no persistence concept anywhere in the file |
| Select/command | `select.tsx` | 334 | KEEP | Closed-set, type-ahead-only dropdown (Base UI `Select`) |
| | `country-select.tsx` | 364 | KEEP | 55% data (199 lines) / 45% real logic (trigger, popover state, aria fallback) — genuinely composed `Command`+`Popover`+`Button` combobox, not a thin data-fed Select |
| | `state-select.tsx` | 1597 | KEEP component; **split the data** | 86% (1373/1597 lines) is a pure `STATES_BY_COUNTRY` literal burying ~177 lines of real logic (dual combobox/free-text-input mode, toggle-to-clear, 45-country lookup). Extract data to a sibling `state-select-data.ts` — file-organization fix, not an architecture fix |
| | `command.tsx` | 348 | KEEP | Sanctioned `cmdk` exception; fuzzy-search/async/keyword-alias capability `Select` deliberately doesn't have |
| Messaging | `alert.tsx` | 210 | KEEP SEPARATE | Inline, persistent, non-modal `role="alert"` banner |
| | `sonner.tsx` | 136 | KEEP SEPARATE | Ephemeral, auto-dismissing, imperative toast; no code-sharing mechanism with Alert exists (different API shapes) |
| | `alert-dialog.tsx` | 305 | KEEP SEPARATE | Blocking modal; confirmed it correctly **reuses `Button`'s** variant cva via `ACTION_INTENT_VARIANT` (`alert-dialog.tsx:242-250`) rather than duplicating `alert.tsx`'s — the brief's duplication hypothesis is false |
| | `empty-state.tsx` | 198 | KEEP SEPARATE | Full-panel placeholder; shares only the `.Title/.Description/.Actions` compound-naming *convention* with Alert, not code |
| Display utilities | `truncated-text.tsx` | 256 | KEEP | Real `ResizeObserver`-driven overflow measurement (`truncated-text.tsx:129-146`), not a docs snippet |
| | `relative-time.tsx` | 242 | KEEP | `Intl.RelativeTimeFormat` + adaptive self-refresh timer (`relative-time.tsx:80-85,178-195`) |
| | `markdown-view.tsx` | 239 | KEEP (thinnest of the three) | Static `Components` override map, no hooks/state — still clears the bar (safe-by-construction XSS handling + ~160 lines of token mapping a consumer shouldn't hand-roll) |
| | `data-list.tsx` | 620 | KEEP SEPARATE from `table.tsx` | Parent/child, not overlap — composes `Table` primitives and adds selection/sort/skeleton/empty/activatable-row behavior on top |
| Overlay | `tooltip.tsx` | 243 | KEEP SEPARATE | `@base-ui/react/tooltip` — short, non-interactive, hover/focus |
| | `hover-card.tsx` | 263 | KEEP SEPARATE | `@base-ui/react/preview-card` — **confirmed NOT a thin Popover wrapper**; a wholly separate Base UI primitive module with its own Root/Trigger/Positioner/Popup/Viewport/Arrow API |
| | `popover.tsx` | 264 | KEEP SEPARATE | `@base-ui/react/popover` — click-triggered, modal-by-default, persists until dismissed |
| Chat family (scope check) | `message.tsx` | 141 | In scope, no drift | Exports match `docs/plans/add-chat-components.md` exactly (`MessageGroup/Message/MessageAvatar/MessageContent/MessageHeader/MessageFooter`) |
| | `message-scroller.tsx` | 186 | In scope, no drift | Exports + sanctioned `@shadcn/react/message-scroller` dependency match the plan exactly |

### Light-touch scan (not deep-dived — brief didn't flag these, spot-checked for hidden overlap)

| Pair | Finding |
|---|---|
| `accordion.tsx` vs `collapsible.tsx` | Distinct Base UI primitives (`@base-ui/react/accordion` vs `@base-ui/react/collapsible`) — multi-item vs single-item, standard shadcn split. No action. |
| `dialog.tsx` vs `sheet.tsx` | Both import `Dialog as BaseDialog` from `@base-ui/react/dialog` (`dialog.tsx:7`, `sheet.tsx:7`) — **same underlying primitive**, `Sheet` is the edge-anchored slide-in treatment. This mirrors shadcn's own convention exactly (their Sheet is also Dialog-based); not a merge candidate, just worth knowing they share a primitive. |
| `dialog.tsx`/`sheet.tsx` vs `alert-dialog.tsx` | `alert-dialog.tsx` imports the separate `@base-ui/react/alert-dialog` primitive — genuinely distinct (backdrop-dismiss disabled by design). No overlap. |
| `dropdown-menu.tsx` vs `context-menu.tsx` | Distinct Base UI primitives (`@base-ui/react/menu` vs `@base-ui/react/context-menu`) — trigger model differs (click/keyboard vs right-click). No overlap. |
| `checkbox.tsx`/`radio-group.tsx`/`switch.tsx` | Three separate Base UI primitives, standard selection-control set. No overlap. |
| `color-picker.tsx` vs `emoji-picker.tsx` | Same popover-trigger shape, disjoint data domains (color swatches vs emoji grid), no shared logic beyond the `Button`+`Popover` shell every overlay-triggered picker uses. No action. |

---

## 2. Proposed changes with API sketches

### 2.1 Delete `IconButton`, fold into `Button` usage pattern

Remove `packages/ui/registry/ui/icon-button.tsx` (+ its copy-in + JSON + test) as a **registry item**. `Button` already covers 100% of its behavior:

```tsx
// Before (icon-button.tsx wrapper, 62 LOC, 0 unique CVA)
<IconButton icon={<Trash />} aria-label="Delete" size="sm" />

// After — same visual result, no second component to sync
<Button size="icon-sm" aria-label="Delete">
  <Trash />
</Button>
```

Since this removes required-`aria-label` as a *compile-time* guarantee, recover it as a design-audit lint rule instead: flag any `<Button>` whose only child is an icon element and that lacks `aria-label`/`aria-labelledby`. This preserves the a11y guarantee without a second 3-file-sync surface (canonical + `apps/docs/components/ui/icon-button.tsx` + `apps/docs/public/r/icon-button.json`). **This is a breaking change for any current consumer of `IconButton`** — needs a changeset + migration note (find/replace `<IconButton icon={X} ... />` → `<Button size="icon*">{X}</Button>`) before shipping, and should go through the normal deprecation window rather than a silent removal.

### 2.2 `notification-bell.tsx` — reuse `Badge` instead of a hand-rolled counter

```tsx
// notification-bell.tsx, replacing the current bespoke <span> at lines 80-93
{hasUnread ? (
  <Badge
    data-slot="notification-bell-badge"
    aria-hidden
    variant="solid"
    color="destructive"
    size="sm"
    className={cn(
      "pointer-events-none absolute h-4 min-w-4 px-1 tabular-nums",
      dot ? "-top-0.5 -right-0.5 size-2 p-0" : "-top-1 -right-1",
    )}
  >
    {dot ? null : displayCount}
  </Badge>
) : null}
```
Keeps `NotificationBell`'s public API (`count`, `dot`, `99+` clamp, aria-label folding) unchanged — only the internal markup delegates to the existing `Badge` primitive instead of re-declaring its CSS a fourth time.

### 2.3 `status-icon.tsx` / `button.tsx` / `badge.tsx` — compose `Spinner` instead of re-inlining `Loader`

All three currently do:
```tsx
import { Loader } from "lucide-react";
// ...
<Loader className="size-3 animate-spin motion-reduce:animate-none" aria-hidden />
```
Replace with:
```tsx
import { Spinner } from "@/components/ui/spinner"; // or the registryDependency equivalent
// ...
<Spinner size="xs" aria-hidden />
```
`apps/docs/components/preview/marker.tsx:14` already proves this composition works cleanly inside another component. This removes 3 of the 4 duplicate copies of `animate-spin motion-reduce:animate-none`.

### 2.4 `state-select.tsx` — split data from logic (no public API change)

```tsx
// packages/ui/registry/ui/state-select-data.ts (NEW — pure data, no "use client")
export interface State { code: string; name: string; }
export const STATES_BY_COUNTRY: Record<string, State[]> = { US: [...], CA: [...], /* 45 countries */ };
export function getStatesByCountry(country: string): State[] { /* ... */ }
export function hasStates(country: string): boolean { /* ... */ }

// packages/ui/registry/ui/state-select.tsx (slimmed ~1597 → ~220 LOC)
import { STATES_BY_COUNTRY, getStatesByCountry, hasStates, type State } from "./state-select-data";
export function StateSelect({ country, value, onValueChange, ... }: StateSelectProps) { /* unchanged */ }
```
Registers as two `files[]` entries under the same registry item — no change to `shadcn add @vegastack/state-select` consumer experience. Purely a reviewability/maintainability fix (a PR touching `StateSelect`'s logic currently shows a 1600-line diff context).

### 2.5 `field.tsx` — horizontal orientation silently drops `description`

Found while comparing Field to FieldInline/SettingsRow: `field.tsx:256-282`'s horizontal branch renders `{children}` then `{label}` but never renders `{description}` — only the vertical branch does (`field.tsx:279`). This is a real gap, not a design decision recorded anywhere in the mdx. Needs a decision: either render `description` beneath the horizontal row too, or document explicitly that horizontal Fields shouldn't carry a description (and enforce via a dev-time warning).

### 2.6 Label-token drift

`label.tsx:47` and `field.tsx:67` both use `text-label-sm`; `settings-row.tsx:46,149` independently uses `text-sm font-medium leading-snug` without importing `Label` at all. Three independent label-text implementations for what the system otherwise treats as one typographic concept — reconcile to `text-label-sm` or document the heavier weight as an intentional "settings heading" style.

---

## 3. shadcn/ui parity — gap list (prioritized for an AI-platform company)

Current shadcn/ui canonical inventory (fetched July 2026, `ui.shadcn.com/docs/components` + the Oct-2025 "new components" changelog + the June-2026 chat-components changelog) vs our 68-item registry:

### P0 — directly enables AI-platform product surfaces, recommend building next

| shadcn component | Why an AI-platform design system needs it | Notes |
|---|---|---|
| **Attachment** | Shipped in the *same* June-2026 chat wave as `message`/`bubble`/`marker`/`message-scroller` (all of which we already have, sanctioned per `docs/plans/add-chat-components.md`). File/image upload with progress state, error treatment, and a full-card trigger is table stakes for any AI chat composer — this is the obvious 5th item to complete that family. Anatomy: `AttachmentMedia`, `AttachmentContent`, `AttachmentTitle`, `AttachmentDescription`, `AttachmentActions`, `AttachmentAction`, `AttachmentTrigger`, `AttachmentGroup`. |
| **Item** | shadcn's new general-purpose `ItemGroup > Item > (ItemHeader, ItemMedia, ItemContent > ItemTitle/ItemDescription, ItemActions, ItemFooter)` primitive for lists/cards/menu rows. High leverage for AI platforms: agent lists, conversation/thread lists, model-selector rows, tool-call summaries, file-search results — all currently hand-rolled per-screen in downstream consumers with no shared primitive. |
| **Combobox** | We build `country-select`/`state-select` as bespoke `Command`+`Popover`+`Button` compositions with zero shared abstraction between them (confirmed independently by cluster audit — no code sharing). shadcn's Base UI variant now ships an actual `@base-ui/react` Combobox primitive (`ComboboxInput`/`ComboboxContent`/`ComboboxEmpty`/`ComboboxList`/`ComboboxItem`, plus `ComboboxChips` for multi-select) — this should become the shared foundation both `country-select` and `state-select` sit on top of, and a first-class exposed primitive for any future searchable-picker need (model picker, tag picker, mention picker). |
| **Resizable** | Split-pane layouts (sidebar + chat + code/preview panel) are near-universal in AI coding/agent tools. Zero coverage today. |
| **Chart** | Any AI platform with usage dashboards, token-spend tracking, or eval/analytics views needs this. Zero coverage today — icon set already has 10 `chart-*` lucide icons registered but no chart *component*. |

### P1 — fills a real but secondary gap

| shadcn component | Notes |
|---|---|
| **Input Group** | Generic `InputGroup`/`InputGroupInput`/`InputGroupAddon` composition. We currently hand-roll the same icon/button/prefix-addon pattern independently inside `input.tsx` (its own prefix/suffix mode), `password-input.tsx`, `auto-save-input.tsx`, and `filter-bar.tsx` — a shared primitive would reduce four parallel implementations to one. |
| **Button Group** | We have `split-button` (a specific 2-part pattern) but no generic `ButtonGroup`/`ButtonGroupSeparator`/`ButtonGroupText` container for segmented actions or input-adjacent button groups. |
| **Drawer** | Distinct from our `Sheet` (both edge-anchored, but shadcn's Drawer is the vaul-based bottom-sheet/drag-to-dismiss mobile pattern — a different interaction model, not a rename). Relevant if any AI-platform surface targets mobile. |
| **Calendar** (as a standalone registry item) | We *have* the capability — `date-picker.tsx:111` exports a fully token-styled `Calendar` (a `DayPicker` wrapper) — but it is only reachable by pulling the whole `date-picker` registry item. A consumer who wants an inline-only calendar with no popover has no way to `shadcn add @vegastack/calendar` directly. This is a **discoverability gap**, not a missing capability: register `Calendar` as its own registry item (or add a `registryDependencies` cross-reference) so it's independently pullable. |
| **Navigation Menu** | Relevant for marketing/docs-site nav; `sidebar`+`breadcrumb`+`tabs` cover most in-product nav needs already, so lower urgency than the P0 items. |
| **Aspect Ratio** | Trivial primitive (padding-hack or `aspect-ratio` CSS wrapper), useful for thumbnails/media in any list/gallery UI. Cheap to add. |

### P2 — lower priority for this product category

- **Carousel** — image/content sliders; not a typical AI-platform-chrome need unless building a marketing gallery.
- **Menubar** — desktop-app-style top menu bar; only relevant if building an IDE-like dense tool.
- **Native Select** — mobile-optimized native `<select>` fallback; nice-to-have, not blocking.
- **Direction** (RTL provider) — only relevant if RTL-market support is on the roadmap.
- **Typography** — shadcn ships this as more of a docs/prose-styling convention page than a component; likely already covered informally by `markdown-view.tsx` + Tailwind Typography usage in docs.

### (c) Components we mirror the OLD shadcn shape of

**`field.tsx` is the one confirmed case.** shadcn's Field was substantially expanded in the Oct-2025 "new components" wave: current shadcn anatomy is `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, **`FieldGroup`, `FieldSet`, `FieldLegend`, `FieldContent`**, plus a documented `orientation="responsive"` mode for forms that reflow at breakpoints. Our `field.tsx` exports only `Field`/`FieldRoot`/`FieldLabel`/`FieldControl`/`FieldDescription`/`FieldError`/`FieldSuccess` — no `FieldGroup`, `FieldSet`, `FieldLegend`, or `FieldContent`, and `orientation` is a binary `vertical`/`horizontal` (with the `description`-drop bug noted in §2.5), not a responsive third mode. This matters specifically for multi-section forms (a common AI-platform surface: agent-config forms, API-key/settings panels) where `FieldSet`+`FieldLegend` grouping is the documented shadcn pattern and we have no equivalent. Recommend a follow-up scoped purely to extending `field.tsx` to the current shadcn anatomy (additive — does not require the merges above).

No other audited component showed a clear "mirrors an old shape" signal — `sonner.tsx` already reflects shadcn's Toast→Sonner rename (we never had a separate `toast.tsx`), and the overlay/select/messaging families all matched current shadcn primitive boundaries.

---

## 4. Naming drift vs shadcn conventions

| Ours | shadcn's current name | Recommendation |
|---|---|---|
| `empty-state` | `Empty` (anatomy: `Empty`/`EmptyMedia`/`EmptyTitle`/`EmptyDescription`/`EmptyContent`) | Both the **top-level name** and the **subcomponent anatomy** drifted: ours uses `EmptyState.Icon`/`.Title`/`.Description`/`.Actions` (Object.assign compound pattern) vs shadcn's flat `EmptyMedia`/`EmptyContent` naming. A downstream dev who knows shadcn will look for `Empty` and for `EmptyMedia`, not `EmptyState.Icon`. Recommend renaming to `Empty` with `EmptyMedia`/`EmptyContent` to match — this is a naming-only change, the underlying `cva` variants stay. Breaking change, needs a changeset + migration note. |
| `data-list` | `Data Table` | Ours is intentionally a higher-level, more opinionated primitive (built ON `table.tsx`, adds selection/sort/skeleton/empty), so a straight rename to `data-table` isn't quite accurate — but the name mismatch means shadcn-familiar devs won't find it by searching "data table" in our docs. Minimum fix: cross-reference in docs ("Looking for shadcn's Data Table? See DataList.") rather than a rename, since `data-list` already has real product usage. |
| `state-select` | *(shadcn has no equivalent; this is our own naming issue)* | Ambiguous — reads as "US state" or UI "state" at first glance, but actually covers 45 countries' ISO subdivisions (confirmed no dependency on `country-select`; siblings). Recommend `subdivision-select` or `region-select`, keeping `state-select` as a redirect/alias if any consumer already depends on the current name. |
| `otp-input` | `Input OTP` | Cosmetic only (word order) — not worth a breaking rename. |
| `icon-button` | *(shadcn has no direct equivalent — closest is `size="icon"` on Button)* | Not a rename candidate — see §2.1, recommend removal instead. |
| everything else (`accordion`, `alert`, `alert-dialog`, `avatar`, `badge`, `breadcrumb`, `button`, `card`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `dropdown-menu`, `hover-card`, `input`, `kbd`, `label`, `pagination`, `popover`, `progress`, `radio-group`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `spinner`, `switch`, `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip`) | matches | No drift — names align 1:1 with current shadcn conventions. |

---

## 5. Summary of concrete follow-ups (ranked)

1. **Remove `icon-button.tsx`** as a registry item; replace with `Button size="icon*"` + an a11y lint rule. Breaking change — needs a changeset and consumer migration note.
2. **Add `Attachment`** to the sanctioned chat family (`marker`/`message`/`bubble`/`message-scroller` already exist) — the highest-leverage single addition for AI-platform chat composers.
3. **Add `Item`** — general list/card primitive, high reuse potential across agent lists, thread lists, model pickers.
4. **Build a shared `Combobox` primitive** and refactor `country-select`/`state-select` to sit on top of it instead of each independently composing `Command`+`Popover`+`Button`.
5. **Add `Resizable`** and **`Chart`** — near-universal needs for AI dev-tool/dashboard surfaces, currently zero coverage.
6. **Split `state-select.tsx`'s 1373-line data literal** into a sibling `state-select-data.ts` (no API change) and consider renaming to `subdivision-select`/`region-select`.
7. **Reuse `Badge`** inside `notification-bell.tsx`'s counter overlay; **compose `Spinner`** inside `button.tsx`/`badge.tsx`/`status-icon.tsx` instead of re-inlining `Loader`+`animate-spin`.
8. **Extend `field.tsx`** to the current shadcn Field anatomy (`FieldGroup`/`FieldSet`/`FieldLegend`/`FieldContent`, responsive orientation) and fix the horizontal-orientation `description`-drop gap.
9. **Rename `empty-state` → `Empty`** with shadcn-aligned subcomponent anatomy (`EmptyMedia`/`EmptyContent`) — breaking change, needs a changeset.
10. Register `Calendar` (already implemented inside `date-picker.tsx:111`) as its own independently-pullable registry item.

No changes were made to any source file as part of this audit.
