---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 Fixes from the consolidated review of the facelift design-system work (Regent #136–#140).

- **Two-line rows** (Command, Select, Combobox and the three menus): the second line is read once, as the row's description, and no longer repeated inside its name. A caller's own `aria-describedby` still wins, and the second line then stays in the name. [docs](https://design.vegastack.com/docs/components/item)
- **CommandLoading** reads "Searching…" by default. With a `progress` value it stays a labelled `progressbar`, so the value reaches assistive technology. [docs](https://design.vegastack.com/docs/components/command)
- **LoadMore**: when the last batch arrives the footer keeps the focus its button had, instead of dropping it to the page. It is now a client component.
- **SortableList and Board**: a row or card action that removes its row moves focus to the row that took its place. SortableList takes the accessor as `getItemActions`, Board's name; `menuItems` is deprecated. Board takes `actionsLabel`, a lane's `loadMore` takes the footer's labels, and a read-only lane keeps a card's own actions (only the Move items go). [docs](https://design.vegastack.com/docs/components/sortable-list)
- **RowActionsMenu**: a disabled single icon action is described by its `disabledReason`, not only in its tooltip.
- **FilterBar**: facets have their own seat (`facets`), after the search and before the chips; an "Add filter" option with an `editor` opens it on the new chip; `FilterChip` takes `defaultEditorOpen`. **FilterBarFacet**: the pinned "Selected" group comes first and is taken when the list opens, so toggling a row no longer moves it; the facet is the bar's height (`h-8`); `removeLabel`, `selectedGroupLabel` and `moreGroupLabel` override its strings. [docs](https://design.vegastack.com/docs/components/filter-bar)
- **FilterBuilder** (`filter-bar-managed`): `fieldPicker="searchable"` (with `fieldPickerProps`) searches the fields, an option value with more than seven options is a search picker and a several-values editor is `SearchableSelect multiple`, and a row error is tied to the field picker whenever the operator takes no value. [docs](https://design.vegastack.com/docs/components/filter-bar-managed)
- **SearchableSelect**: a server search with no rows yet shows its loading line; `groupOrder` puts named groups first; its fallback name no longer overrides a `<label for>`; it takes `aria-invalid` and `aria-describedby`.
- **TextEdit**: a disabled Base UI `Field` disables the editor.
- **RelativeTime**: `formatOptions` with `dateStyle` or `timeStyle` no longer throws for another year's date or with `withTime`.
- **useAsyncSearch**: Load more waits out a typed query's debounce instead of pairing the new query with the old cursor.
- **Transcript**: matches after characters whose lower case is longer are highlighted exactly; segments that only add matches keep the reader's position without a new announcement; a press on the scrollbar pauses follow; the loading line is a status.
- **AudioPlayer**: a rejected lazy `src` or a failed media load shows the player's own error line (`loadErrorLabel`); the loading glyph is `Spinner`. **AttachmentProgress** speaks a clamped percent.
- **VegaStackProvider**: a custom `toaster={<Toaster limit timeout />}` sets the provider's queue, and a `Toaster` on another manager brings its own provider.
- **AppShell** takes `keyboardShortcut` (or `false`), forwarded to the sidebar. **SidebarStateScript** takes a `nonce`. The sidebar docs render a collapsible menu row as the `SidebarMenuItem`, show the unavailable item's `TBD` badge and reason, and format the shortcut per platform.
- **DataList** section rows use the group-label face; **SettingsSection** titles use the heading face; **Board** keeps one stable ref per card.
- **Blocks**: command-search-01 keeps Enter on its scope chips and Try again, follows only http(s) links, debounces its search, announces a scope change and a settled result count once, and has all ten scopes; the Mod+K shortcuts in command-search-01 and app-shell-01 ignore text fields; list-page-01 searches on the settled query, adds an Industry facet, sets `mobile` on every column, takes `readOnly`, and moves focus to the search after "Clear filters", as board-01 does; both use one control height per row; notifications-01 and list-page-01 take `loading` / `error` (and notifications-01 `loadMore`) instead of `status` / `loadOlder`; review-split-01 keeps its player docked in its column and names its tab count; counts in tabs are muted tabular numbers with a spoken suffix.
- **Docs**: Stat shows linked tiles; Dropzone's upload queue has per-file fields and a save retry; Pagination describes its `<a>` links; list-page-01 keeps view state in guarded `sessionStorage`.
- **`vegastack-design doctor`** points retired `text-h1`/`text-h2` at the page and section heading faces.
- Migration: the `data-slot` values `notification-bell-dot`, `row-action` and `row-actions-trigger` are now `notification-dot`, `row-actions-menu-action` and `row-actions-menu-trigger`. Copied blocks are yours: re-add list-page-01 or notifications-01 to take the prop renames. From 0.19.0 (not in its notes): a mixed checkbox shows a minus, disabled checkboxes and radios dim outside a Field too, and `Card` and `Empty` are client modules.
