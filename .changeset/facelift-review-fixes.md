---
"@vegastack/ui": patch
---

🐛 Fixes from the consolidated review of the facelift design-system work (Regent #136–#140).

- **Two-line rows** (Command, Select, Combobox and the three menus): the second line is read once, as the row's description, and no longer repeated inside its name. A caller's own `aria-describedby` still wins, and the second line then stays in the name. [docs](https://design.vegastack.com/docs/components/item)
- **CommandLoading**: with a `progress` value it stays a labelled `progressbar`, so the value reaches assistive technology; without one it is the polite status. [docs](https://design.vegastack.com/docs/components/command)
- **LoadMore**: when the last batch arrives the footer keeps the focus its button had, instead of dropping it to the page. It is now a client component.
- **SortableList and Board**: a row or card action that removes its own row moves focus to the row that took its place. SortableList takes the accessor as `getItemActions`, the name Board uses; `menuItems` is deprecated. Board takes `actionsLabel`, and a lane's `loadMore` takes the footer's labels. [docs](https://design.vegastack.com/docs/components/sortable-list)
- **RowActionsMenu**: a disabled single icon action is described by its `disabledReason`, not only in its tooltip.
- **FilterBarFacet**: the pinned "Selected" group is taken when the list opens, so toggling a row no longer moves it under the pointer. The facet is the FilterBar row's height (`h-8`), and `removeLabel`, `selectedGroupLabel` and `moreGroupLabel` override its strings. [docs](https://design.vegastack.com/docs/components/filter-bar)
- **SearchableSelect**: a server search with no rows yet shows its loading line in the panel.
- **TextEdit**: a disabled `Field` disables the editor.
- **RelativeTime**: `formatOptions` with `dateStyle` or `timeStyle` no longer throws for another year's date or with `withTime`.
- **useAsyncSearch**: Load more waits out a typed query's debounce instead of pairing the new query with the old cursor.
- **Transcript**: matches after characters whose lower case is longer are highlighted exactly, and segments that only add matches keep the reader's position without a new announcement.
- **AttachmentProgress**: the spoken percent is clamped like the bar. **AudioPlayer** draws its loading glyph with `Spinner`.
- **VegaStackProvider**: a custom `toaster={<Toaster limit timeout />}` sets the provider's queue, and a `Toaster` on another manager brings its own provider.
- **SidebarStateScript** takes a `nonce` for nonce-based Content Security Policies. The sidebar docs render a collapsible menu row as the `SidebarMenuItem`, so the menu keeps only `li` children.
- **DataList** section rows use the group-label face; **SettingsSection** titles use the heading face.
- **Board** keeps one stable ref per card, so a render no longer re-registers every card's drag.
- **Blocks**: command-search-01 keeps Enter on its scope chips and Try again, follows only http(s) links, debounces its search and announces a scope change; the Mod+K shortcuts in command-search-01 and app-shell-01 ignore text fields; list-page-01 and board-01 move focus to the search after "Clear filters" and use one control height per row; notifications-01 and list-page-01 take `loading` / `error` (and notifications-01 `loadMore`) instead of `status` / `loadOlder`; review-split-01 and the Tabs "With counts" example show counts as muted tabular numbers.
- Migration: the `data-slot` values `notification-bell-dot`, `row-action` and `row-actions-trigger` are now `notification-dot`, `row-actions-menu-action` and `row-actions-menu-trigger`. Copied blocks are yours: re-add list-page-01 or notifications-01 to take the prop renames.
