# COMPONENT MATRIX — per-component completeness gate

One row per component in the **current DS inventory**. The base is the original **64 design-system
primitives** (requirements §12) — see that section for the platform-`common` exclusion rationale
(app-coupled / data-wrapper / page-level components, DS-replaced ones, already-covered ones, deferred
presentational variants). **Since that initial build, the 2026-07 overhaul program (Phases X1/X2/S)
added 7 more inventory items that ship the same 8-column contract** — rows 65–71 below. They weren't
part of the original §12 list (they're organic additions the overhaul's own decisions log sanctioned:
`docs/plans/2026-07-decisions-log.md` Phases X1/X2/S), but they're first-class, fully-shipped components
by every column here, so they're tracked the same way. **Total: 71 rows, all fully green**, plus 2
registry:hook items and 1 registry:block (tracked separately below the main table — they don't carry a
Fumadocs showcase page of their own, so the `showcase` column doesn't apply the same way).

**Known gap (flagged, not fixed by this pass):** the chat-family components shipped under the sanctioned
`@vegastack/message-scroller` non-Base-UI-primitive exception (AGENTS.md) — `Marker`, `Message`,
`Bubble`/`BubbleContent`, `MessageScroller` — are fully built, tested, registered, and documented (see
their `.mdx`/`.test.tsx`/registry.json entries) but were **never added to this matrix**, before or during
this phase. They're out of the explicit new-component list this refresh was scoped to; call it out
separately if a full backfill is wanted.

A component is **DONE only when EVERY column is ✅ for its inventory-defined scope** (requirements §12
for rows 1–64; the component's own MDX **Scope** section for rows 65–71 where one exists). **Every row
below is fully green.** Two inventory items — `data-list` and `text-edit` — are *defined in §12* at the
**presentational-core / base-v1 scope** (the full-parity **`data-grid`** and **`text-edit-collab`** are
separate, deferred inventory items, not these rows). Their green cells are therefore honest completion of
the **scoped** inventory item, not a platform feature-parity claim — see the DataList/TextEdit note below
+ the docs **Scope** sections.

Columns:
- **built** — re-authored cleanly on Base UI + `@vegastack` tokens (Model A, unprefixed), no hardcoded styles/hex/px/raw palettes, `:focus-visible`, idiomatic Base UI.
- **Vitest** — behavior tests pass.
- **axe** — vitest-axe 0 violations.
- **render** — Preview MCP `preview_screenshot` (renders + all variants) + `preview_inspect` (computed CSS resolves to right tokens) on its showcase page.
- **§7.6** — contract: all UI states + knobs + JSDoc props + AutoTypeTable.
- **registry** — registry-item built, hashed (`meta.integrity`), token-pinned.
- **copy-in** — `shadcn add` from LOCAL registry → renders.
- **showcase** — has a complete Fumadocs MDX page in the showcase.

Status legend: ✅ done · 🚧 in progress · ❌ not started

> **VRT (Playwright visual-diff) — PROVEN-FUNCTIONAL locally; only the Linux CI baselines are a Docker-pinned MK action.** The suite (`apps/docs/vrt/components.spec.ts`) + workflow (`.github/workflows/vrt.yml`, pinned `mcr.microsoft.com/playwright:v1.61.0-noble`) are wired and **run on every PR**. As of this refresh the `PAGES` array covers **82 showcase routes** (verified by counting the live array — grew from the original 68 pilot pages across Phases T1/X1/X2/S/M as components were added), each running on **both** Playwright projects — `chromium` (1280×720 desktop) and `mobile-chromium` (375×812, touch-enabled, Phase R) — for 164 total screenshot assertions. `page.emulateMedia({ reducedMotion: 'reduce' })` runs before every capture (Phase X2 — settles recharts' JS-driven draw animation and pins the a11y-correct reduced-motion rendering as the baseline). Those mac PNGs are NOT committed (they'd fail `ubuntu-latest` CI on font/AA-render deltas); committable baselines must come from the pinned Linux container. The suite **self-activates** (no permanent `describe.skip`): `describeVRT` is gated on `hasBaselines` (snapshot-dir probe) **or** `VRT_UPDATE=1` bootstrap mode — the bootstrap flag is what lets the *first* baselines be written (a skip-when-empty guard alone would make the bootstrap a no-op). Review discipline (delete-then-regenerate for a suspect baseline, individually-reviewed diffs, `reuseExistingServer: false`) is enumerated in `skills/design-audit/SKILL.md`'s "VRT review discipline" section — this note stays the factual/count summary, that skill owns the process rules. Gate behavior:
> - **PR, baselines present** → blocking pixel gate (+ zero-screenshot guard).
> - **PR, no baselines but the PR changes visual surface** (`packages/ui/registry|src`, `tokens`, `tailwind-preset`, `apps/docs/components|content`) → **FAIL-CLOSED** (no pixel coverage for a visual change is not acceptable).
> - **PR, no baselines + no visual change** (prose/tooling only) → `::notice` no-op (unrelated PRs aren't blocked).
> - **Deploy** (`deploy.yml` `vrt-gate`) → **FAIL-CLOSED**: a release cannot ship without committed, passing baselines.
>
> The one remaining MK action is the one-time `update_baselines` bootstrap in the pinned container + committing `apps/docs/vrt/**/*-snapshots/**` — the same build-LOCAL-stop category as npm-publish / Cloudflare-deploy. **Local render + a11y coverage is independently enforced** regardless: the compiled-CSS `color-contrast` gate (`test/contrast.browser.test.tsx`, real rendered colors, both themes), the overlay portal-stacking test, and the per-component render/ARIA tests. Not a per-component matrix column.
>
> **Geography datasets (rows 14–15) ship full platform parity.** `CountrySelect` carries the complete **198-country** ISO 3166-1 alpha-2 set and `RegionSelect` carries **45 subdivision datasets / 1187 entries** (ported from the platform billing source; flags derived via the regional-indicator transform). The dataset itself lives in a sibling module, `region-select-data.ts` (`REGIONS_BY_COUNTRY`, `getRegionsByCountry`, `hasRegions`), split out of `region-select.tsx` so the component file stays about behavior, not data. Tests assert the exact counts + representative previously-missing lookups — see `country-select.test.tsx` / `region-select.test.tsx`.
>
> **Renames since the initial build (verified against current source):** `EmptyState` → **`Empty`** (row 26) — now a compound export with a documented anatomy: `Empty` (root) / `EmptyHeader` / `EmptyMedia` / `EmptyTitle` / `EmptyDescription` / `EmptyContent` (`empty.tsx`). `StateSelect` → **`RegionSelect`** (row 15, + the `region-select-data.ts` sibling noted above). `Alert`'s status prop is **`intent`** (not `variant`) — `AlertIntent = 'default' | 'success' | 'warning' | 'destructive' | 'info'`; `Alert` keeps a separate `dismissable` boolean for the close button, unrelated to intent. `Badge`'s color-family prop is likewise **`intent`** (`'default' | 'success' | 'warning' | 'destructive' | 'info'`), kept distinct from its `variant` prop (`'subtle' | 'solid' | 'minimal'`, the fill treatment) — there is no `color` prop on either component.
>
> **Chevron policy.** `ChevronsUpDown` marks combobox-style triggers that filter/search a list — `Combobox` (its default `ComboboxTrigger` icon), `CountrySelect`, `RegionSelect` (both thin `Combobox` compositions since Phase X1) and `DataList`'s sortable column headers. `ChevronDown` marks select-style dropdown triggers that just open a fixed list — `Select`, `DatePicker`, `SplitButton`, `Accordion`'s trigger (rotates 180° open/closed). Don't mix the two within the same trigger family.
>
> **Command (row 48) was rebuilt on Base UI in Phase X1 — `cmdk` is fully removed.** It's `<Combobox.Root inline open modal={false}>` under the hood (Base UI's documented inline mode IS the palette shape), rendered ALWAYS-OPEN in normal flow rather than a floating popup. 10 flat exports (`Command`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandLoading`, `CommandGroup`, `CommandSeparator`, `CommandItem`, `CommandShortcut`) + the `useCommandFilteredItems` hook (replaces cmdk's `useCommandState` — no equivalent store; consumers own derived state via `items`/`onInputValueChange`). Now **data-driven**: pass `items` to `Command`/`CommandList`/`CommandGroup` and render via a function child — static children never filter (verified in Base UI source: filtering and `CommandEmpty` both run off the query-filtered `items` array, not the DOM children). `CommandEmpty`/`CommandLoading` are **siblings** of `CommandList`, not its children (nesting a `role="status"` inside `role="listbox"` trips `aria-required-children` — a real bug fixed during the rebuild, not carried over from cmdk). One documented deviation: disabled items stay reachable by arrow keys (Base UI hardcodes `disabledIndices: []`; they stay inert on activation) — an upstream limitation, not a design choice, documented in JSDoc + the mdx States/keyboard sections. Still **presentational (G7)**: items take `onSelect` callbacks, the consuming app wires the actual routes/actions.
>
> **All components use React 19 ref-as-prop, not `React.forwardRef`.** `ref` is a plain destructured prop (`ComponentPropsWithRef<'div'>` / explicit `ref?: React.Ref<...>` types), forwarded either via `{...props}` spread onto the host element or explicitly through `useRender`'s `ref` param — see `docs/ledger/ref-forwarding-spec.md` for the two patterns. Verified: zero `React.forwardRef` call sites remain in `packages/ui/registry/ui/*.tsx`. Exports are **flat-only** — no dotted sub-component namespaces (`Alert.Title`, `Dialog.Trigger`, etc.); compound parts are separate named exports (`AlertTitle`, `DialogTrigger`/`DialogContent`, `EmptyHeader`, `MarkerContent`, `BubbleContent`, …) per Model A.
>
> **TruncatedText (row 32) ships all three platform exports.** `TruncatedText` + `IconText` (icon + truncating label + trailing slot) + `TableCellText` (column-width + mono), each with tests, a11y, and AutoTypeTable docs.
>
> **Tooltip (row 39) is a composable, non-interactive primitive (recorded scope decision).** Rich content is expressed with `TooltipContent` composition + `TooltipKbd` + semantic sizing classes; actionable/focusable content belongs in `Popover` (WCAG — non-interactive tooltip contract).
>
> **FilterBar (row 50) is complete at the presentational-core scope.** It renders chips/add-menu/search/`trailing`; active-filter STATE, clear-all (compose into `trailing`), editable chip popovers (compose `FilterChip` + `Popover`), and AI suggestions (G7 app concern) are deliberately consumer-owned — a recorded §12 scope decision (like DataList/TextEdit), with composition paths in `filter-bar.mdx`. Full-stateful `filter-bar-managed` is a separate deferred item.

| # | Component | Group | built | Vitest | axe | render | §7.6 | registry | copy-in | showcase |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Button | Actions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | IconButton | Actions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 | CopyButton | Actions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 4 | SplitButton | Actions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 5 | Input | Form | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 6 | Textarea | Form | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 7 | Field | Form | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 8 | FieldInline | Form | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 9 | PasswordInput | Form | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 10 | OTPInput | Form | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 11 | Checkbox | Form | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 12 | Switch | Form | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 13 | Select | Form | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 14 | CountrySelect | Form | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 15 | RegionSelect | Form | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 16 | DatePicker | Form | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 17 | ColorPicker | Form | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 18 | EmojiPicker | Form | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 19 | AutoSaveInput | Form (presentational) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 20 | RadioGroup | Form | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 21 | Slider | Form | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 22 | Label | Form | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 23 | Badge | Display | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 24 | Avatar | Display (presentational) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 25 | Card | Display | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 26 | Empty | Display | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 27 | Kbd | Display | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 28 | StatusIcon | Display | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 29 | ProgressIndicator | Display | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 30 | Skeleton | Display | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 31 | Spinner | Display | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 32 | TruncatedText | Display | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 33 | Separator | Display | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 34 | Progress | Display | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 35 | Dialog | Overlay | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 36 | AlertDialog | Overlay | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 37 | Sheet | Overlay | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 38 | Popover | Overlay | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 39 | Tooltip | Overlay | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 40 | HoverCard | Overlay (presentational) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 41 | DropdownMenu | Overlay | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 42 | Menu (ContextMenu) | Overlay | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 43 | Tabs | Navigation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 44 | Breadcrumb | Navigation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 45 | Pagination | Navigation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 46 | PageHeader | Navigation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 47 | Sidebar | Navigation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 48 | Command | Navigation (presentational) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 49 | DataList | Data — core v1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 50 | FilterBar | Data | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 51 | Table | Data | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 52 | ScrollArea | Data | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 53 | TextEdit | Rich text — base v1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 54 | MarkdownView | Rich text | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 55 | Alert | Feedback | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 56 | Toast | Feedback | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 57 | Collapsible | Display | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 58 | Toggle | Actions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 59 | ToggleGroup | Actions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 60 | Accordion | Display | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 61 | SettingsRow | Layout/Settings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 62 | Image | Media (presentational) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 63 | NotificationBell | Media (presentational) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 64 | RelativeTime | Display | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 65 | Combobox | Form | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 66 | Item | Data | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 67 | Attachment | Chat | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 68 | Resizable | Layout | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 69 | Chart | Data | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 70 | AnimatedNumber | Display | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 71 | AppShell | Navigation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 72 | Marker | Chat | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 73 | Message | Chat | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 74 | Bubble | Chat | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 75 | MessageScroller | Chat | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

> Rows 72–75 (the chat family — pre-existing components, previously missing from this matrix; see
> the top-of-file note on the sanctioned `@shadcn/react/message-scroller` primitive): `Marker`
> (`marker.tsx` — useRender label chip, `animateIn` opt-in), `Message`+parts (`message.tsx`,
> `animateIn` opt-in `motion-enter-up`), `Bubble`/`BubbleContent` (`bubble.tsx`, exemplary
> min-w-0/max-w-[80%] truncation discipline), `MessageScroller` (`message-scroller.tsx`, the ONLY
> non-Base-UI headless primitive, auto-scroll/anchor engine).
>
> Notes on rows 65–71 (Phase X1/X2/S additions — verified against current source):
> - **Combobox** (`combobox.tsx`, 18 flat exports) — Base UI `Combobox` wrapped in the house idiom: `Combobox`, `ComboboxValue`, `ComboboxInput`, `ComboboxInputGroup`, `ComboboxTrigger`, `ComboboxList`, `ComboboxContent`, `ComboboxItem`, `ComboboxGroup`, `ComboboxGroupLabel`, `ComboboxCollection`, `ComboboxEmpty`, `ComboboxStatus`, `ComboboxClear`, `ComboboxChips`, `ComboboxChip`, `ComboboxChipRemove`, + the `useComboboxFilteredItems` hook. Non-modal by default (deliberately breaks from Select/DropdownMenu's modal-by-default convention — `modal` clips the backdrop to the anchor's ORIGINAL bounding box, which strands `ComboboxChipRemove` controls once wrapped chips grow the input group). `ComboboxContent` does **not** auto-wrap children in a `ComboboxList` (unlike `SelectContent`) — compose one as a sibling of `ComboboxEmpty`/`ComboboxStatus`, per `combobox.tsx`'s own JSDoc.
> - **Item** (`item.tsx`, 10 exports: `Item`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions`, `ItemHeader`, `ItemFooter`, `ItemGroup`, `ItemSeparator`) — a compact anatomy row for list/feed content; `registryDependencies: ["@vegastack/separator"]`. Interactive rows compose standalone WITHOUT `role="listitem"` (see the §7.6 render note below) — forcing it onto a `render`-composed `<a>`/`<button>` overrides the native link/button role.
> - **Attachment** (`attachment.tsx`, 9 exports: `Attachment`, `AttachmentGroup`, `AttachmentMedia`, `AttachmentContent`, `AttachmentTitle`, `AttachmentDescription`, `AttachmentProgress`, `AttachmentActions`, `AttachmentTrigger`) — a file chip/thumbnail card for chat/compose surfaces; `registryDependencies: ["@vegastack/spinner", "@vegastack/progress"]` (composes `Spinner`/`Progress` directly rather than a redundant `AttachmentAction` wrapper — `IconButton` already type-enforces the accessible name). **Self-owned presentational**, not built on a headless shadcn primitive: verified via npm during Phase X2 that no published `@shadcn/react` version ships an Attachment primitive (0.2.1 exports only `./message-scroller`) — consistent with the rest of the already-self-owned chat family, and the AGENTS.md "ONLY non-Base-UI primitive" exception language needed no broadening.
> - **Resizable** (`resizable.tsx`, 3 exports: `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`) — built on `react-resizable-panels@^4` (a rendering/behavior engine, same dependency class as tiptap/sonner — not a Base-UI-category headless primitive, sanctioned directly by the overhaul plan). API verified against the installed `.d.ts`, not folklore: percent sizes are unitless STRINGS (`"30"`), numbers are PIXELS; `ref` forwards to `elementRef` (the library isn't `forwardRef`-wrapped); group `disabled` ≠ handle `aria-disabled` (two tests pin the distinction). Keyboard resize ships free from the library.
> - **Chart** (`chart.tsx`, 5 exports: `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`) — a themed `recharts@^3.8.0` wrapper. Theming is **tokens only**: `ChartConfig.color` resolves exclusively to `var(--chart-1…--chart-8)`; shadcn's `THEMES`/`ChartStyle` light-dark-literal injection mechanism is deliberately DELETED in this adaptation (per-config hex would fail `raw-palette`/`hex-color` lint anyway). Every example wires `accessibilityLayer` (Recharts' own keyboard + screen-reader layer) — no bespoke a11y shim.
> - **AnimatedNumber** (`animated-number.tsx`, single export `AnimatedNumber`) — a `requestAnimationFrame` tween (NOT CSS `@property`+`counter()` — `Intl.NumberFormat` output, e.g. currency/compact notation, can't render through a CSS counter). Duration/easing read live off `--duration-{fast,base,slow}`/`--motion-ease-standard` via `getComputedStyle` (documented JS fallback constants exist ONLY for this package's CSS-less unit-test harness). Instant under `prefers-reduced-motion: reduce`. See the full mechanism writeup in the file's own header comment.
> - **AppShell** (`app-shell.tsx`, 5 exports: `AppShell`, `AppShellSidebar`, `AppShellHeader`, `AppShellContent`, `AppShellSkeleton`) — the shared dashboard layout, `registryDependencies: ["@vegastack/sidebar", "@vegastack/skeleton"]`. Composes `SidebarProvider`'s own flex row (no extra wrapping div — `data-slot` is overridden to `app-shell`); `<header>` is a SIBLING of `<main>` (nesting would strip the `banner` landmark role). **Audit deviation, intentional**: `AppShellContent` takes a `variant` prop directly instead of pairing `SidebarInset` — `SidebarInset` renders a second `<main>` (a landmark violation) and its peer-selector CSS requires direct-sibling placement incompatible with a `<header>` sitting between nav and main. Scroll is plain `overflow-y-auto` (a `ScrollArea` would add a second focusable scroll landmark that fights the skip-link target). `@container/app-shell-content` (Tailwind v4 native container query) drives any content layout that should respond to the sidebar's own expand/collapse, not the viewport. `AppShellSkeleton` stays server-safe for `loading.tsx` use.

> Notes:
> - **SettingsRow** row covers `SettingsRow` + `SettingsCard` + `SettingsSection` (one file, compound exports).
> - **Avatar** row covers `Avatar` + `AvatarGroup`.
> - **RelativeTime** covers `RelativeDay` + `TimeAgo` (one display-utility file).
> - **Toast** = Sonner config + `<Toaster>` + `toast()` re-export (lives in `@vegastack/ui` provider; registry item ships the Toaster).
> - Presentational-only components (per G7 split): Avatar, Image, HoverCard, Command, AutoSaveInput, NotificationBell — DS ships the pure presentational shell; the app keeps data-fetching wrappers. Documented in each page. (Attachment is presentational for a different reason — see row 67's note: no headless primitive exists to build on, not a G7 data-ownership split.)
> - **DataList (`data-list`) and TextEdit (`text-edit`) are formally scoped inventory items** (requirements §12): `data-list` = the presentational data table (columns · render fns · selection · sort-signal · loading · empty · `onRowClick`/`toolbar`/`footer` composition slots); `text-edit` = the base rich-text editor (controlled HTML · StarterKit toolbar · placeholder · read-only · `onSubmit` · min/max-height). They are **complete at that defined scope**, so the green cells are honest completion of the scoped item — NOT a platform feature-parity claim. The full-parity versions are **separate, deferred inventory items**, not these rows: **`data-grid`** (search · paging · drag-reorder · board/Kanban · grouping · view-persistence) and **`text-edit-collab`** + composed addons (image-upload · @mentions · markdown-IO · emoji · task-lists · code-block-lang · Yjs collab). Each shipped component has an explicit **Scope** section in its docs page + JSDoc. Build the deferred full-parity components only if commissioned.
> - `IconButton`, `SplitButton`, `Toggle`, `ToggleGroup`, `RadioGroup`, `Slider`, `Pagination`, `Accordion`, `Progress`, `Menu`, `Label`, `Separator` round out the contract-complete primitive set the platform implies — re-authored as first-class items.

## Foundation packages (not components, but gated for the build)
| Package | built | tsc | lint | consumed-in-showcase |
|---|---|---|---|---|
| @vegastack/tokens | ✅ | ✅ | ✅ (contrast gate) | ✅ (theme.css) |
| @vegastack/utils | ✅ | ✅ | ✅ (ESLint) | ✅ (cn in every component) |
| @vegastack/icons | ✅ | ✅ | ✅ (ESLint) | ✅ (Icon + BrandIcon gallery) |
| @vegastack/tailwind-preset | ✅ | ✅ | ✅ (ESLint) | ⬜ (external-consumer convenience; docs import @vegastack/tokens directly) |
| @vegastack/ui (provider + components) | ✅ | ✅ | ✅ (design-lint) | ✅ |
| apps/docs (Fumadocs showcase) | ✅ | ✅ | ✅ (ESLint + design-lint + content-lint) | ✅ |
| local registry (`public/r/*`) | ✅ | ✅ | ✅ | ✅ |

> lint coverage (honest — every package runs a real gate, no echo no-ops): **tokens** = `contrast-check.mjs` WCAG AA gate (fail-closed, in `pnpm build` + `pnpm lint`); **ui** = `design-lint` (semantic-token + sanctioned-icon + §7.6 render-contract + a11y AST rules — see `skills/design-audit/SKILL.md` for the full enumerated rule list) on all `packages/ui/registry` source; **docs** = real ESLint (`@vegastack/eslint-config`, flat) over authored app/components/lib + `content-lint` (rejects the STALE pinned `shadcn@4.7.0` CLI snippet — consumer commands must use the current `pnpm dlx shadcn@latest` form — and rejects skipped VRT `describe.skip(`/`TODO(VRT)` markers) + design-lint on copy-in; **utils/icons/tailwind-preset** = real ESLint (shared config). tailwind-preset's `preset.css` is valid + builds; the showcase imports the granular `@vegastack/tokens/theme.css` rather than the bundled preset.
>
> ## Hooks (`registry:hook` — no Fumadocs showcase page; consumed internally by other components' MDX/JSDoc, not a component-matrix row of their own)
> | Hook | File | built | Vitest | consumed by |
> |---|---|---|---|---|
> | `useIsMobile` | `use-mobile.ts` | ✅ | ✅ | `Sidebar` (mobile Sheet-mode breakpoint switch) |
> | `useAnimationReplay` / `useShakeOnInvalid` / `mergeRefs` | `use-animation-replay.ts` | ✅ | ✅ | `Checkbox`, `RadioGroupItem`, `Input`/`OTPInput` (auto-shake-on-invalid), any future replay-triggered `motion-*` animation |
>
> ## Blocks (`registry:block` — copy-once starter, not hash-tracked/re-pulled like a component)
> | Block | built | Vitest | showcase | registryDependencies |
> |---|---|---|---|---|
> | `dashboard-01` | ✅ | ✅ (8 smoke tests) | ✅ (`/docs/blocks/dashboard-01`) | `@vegastack/{app-shell,sidebar,avatar,dropdown-menu,breadcrumb,button,empty,animated-number,badge,card,skeleton,chart,data-list,relative-time,status-icon,truncated-text}` |
>
> `dashboard-01` ships 7 files (`page.tsx`/`loading.tsx`/`data.json` + `components/{app-sidebar,stat-cards,dashboard-chart,recent-activity}.tsx`) — an AI-platform dashboard starter: `AnimatedNumber` stat cards with deltas, a token-only `AreaChart`, and a `DataList` recent-activity feed with `RelativeTime` pinned to `data.json`'s `generatedAt` (deterministic for docs + VRT). `loading.tsx` = `AppShellSkeleton`.

## §7.6 render (polymorphic composition) contract

Every component that owns a **single polymorphic root** exposes Base UI's `render` prop — pass a `ReactElement` or render function and Base UI merges our `className` / `data-slot` / state `data-*` onto your element and forwards the ref. Two sources:

- **`useRender` primitives** (we own + render the root ourselves): `Badge`, `Breadcrumb.Link`, `Pagination.Link`, `Sidebar.MenuButton`, `Sidebar.Trigger`, **`Marker`** (`marker.tsx`), **`BubbleContent`** (`bubble.tsx`), **`Item`** (`item.tsx` — the whole row can become an `<a>`/`<button>`; `role="listitem"` is dropped automatically when `render` composes an interactive element, so the native `link`/`button` role is never clobbered — see row 66's note), and **`AttachmentTrigger`** (`attachment.tsx`). Each declares `render?: useRender.RenderProp` and threads it through `useRender(...)`.
- **Base UI single-root wrappers** (render flows through `{...props}` onto the Base UI root/part): `Button`, `Checkbox`, `Switch`, `RadioGroupItem`, `Slider`, `Progress`, **the `Combobox` family** (`ComboboxInputGroup`, `ComboboxTrigger`, `ComboboxContent`/`Popup`, … — each part's props type extends the matching `BaseCombobox.*` component props directly) — plus the rest of the Base UI wrappers (Select, Dialog, Popover, Tabs, Accordion, Tooltip, Collapsible, Toggle, …) whose props extend the Base UI component props and never `Omit` `render`. These must **not** `Omit<…, 'render'>` from their props type.

**EXEMPT — render intentionally not exposed:**

- **`SplitButton`** — multi-element composite (a primary `Button` joined to a separate dropdown-trigger `Button`); there is no single root for a `render` to replace. `Omit<ButtonProps, 'render'>` is correct here. Compose via its `actions` array / `menu` children; the inner primary `Button` still owns the polymorphic `render`. The exemption is allowlisted in `design-lint` and JSDoc'd on `SplitButtonProps`.
- Purely-presentational composites that own no single polymorphic root (e.g. `Card`, `SettingsRow`, `Empty`, `PageHeader`, and — new since the last refresh — `Resizable{PanelGroup,Panel,Handle}` (a `react-resizable-panels` behavior-engine wrapper, not a Base UI primitive), `Chart{Container,Tooltip,Legend}` (a `recharts` wrapper, same reasoning), and `AppShell`/`AppShellSidebar`/`AppShellHeader`/`AppShellContent`/`AppShellSkeleton` (a composition of other components' own roots, not a single root itself)) are plain `div`/library-root shells — they take standard host props and have no Base UI `render` to expose; not a regression, not in scope of the contract.
- **`Bubble`** (`bubble.tsx`, the outer chat-bubble container) — a **distinct exemption class from `SplitButton`**: it isn't a multi-element composite, it's a plain single-root `div` shell exactly like `Card`/`PageHeader` above, and simply never grew a `render` prop. Note this is file-scoped, not component-scoped: its sibling export in the same file, `BubbleContent` (the actual message surface — the part that plausibly renders as a `button`/`a`), **does** implement `render` via `useRender` and is listed in the primitives bullet above.

**Regression gate:** `tooling/design-lint.mjs` `[render-contract]` rule **fails** if any registry component's props type does `Omit<…, 'render'>`, except files on the documented allowlist (`split-button.tsx`). Wired into `pnpm lint`.
