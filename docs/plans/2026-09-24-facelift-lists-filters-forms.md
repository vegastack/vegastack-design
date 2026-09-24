# Plan: Facelift lists, filters and forms (00b)

**Status:** approved by MK 24-09-2026 ("Approve all as recommended"); built as per-PR branches off `main` (operator instruction 24-09-2026).
**Origin:** Regent issue `vegastack/engg-clients-regent-ai-platform-web-app-v2#139` (brief 00b of the facelift epic #135, approved by MK 24-09-2026). It owns DS-30…DS-45, DS-48 and DS-76. DS-46 and DS-61 are dropped, and DS-47 moved to 00a. The canonical DS-ID table lives in 00a's brief (#137).
**Branch / worktree:** `feat/facelift-lists-filters-forms` off `origin/main` (`dc228eb2c`, registry `@vegastack/ui` 0.16.1, `@vegastack/design` 0.7.2), at `~/projects/vegastack-design-facelift-lists`. The branch was created tracking `origin/main`, so the first push is `git push -u origin feat/facelift-lists-filters-forms`.
**Lands after:** #136 (00d doctrine: DS-73 conventions, REG commits the decision register), #137 (00a: DS-17, DS-22, DS-23, DS-28, DS-47, DS-68, DS-69, DS-70 and rows API-24/API-26) and #138 (00e: DS-06, DS-07, DS-10, DS-13, DS-16, DS-62 and rows API-18…API-23, API-25). Every task below starts with `git fetch origin && git rebase origin/main`, and it does not start until the 00a/00e PRs that touch the same file are on `main` (see § Dependencies).
**Runs beside:** #140 (00c). 00c's DS-51, DS-52, DS-56 and DS-57 compose PRs 1–3 here, so PRs 1–3 merge first.

## Re-grounding against `main` (dc228eb2c): corrections to the brief

1. **`drag-item` is a lib, not an ours item.** `packages/ui/registry/lib/drag-item.ts` is a `registry:lib`, one of the contract's `libs` (with `geo-data`). `ours.json` covers `registry/ui` only. So only `load-more` and `use-async-search` are added to `ours.json`.
2. **`AttachmentProgress` does not exist.** `attachment.tsx` has states `idle|uploading|processing|error|done` (:43) and no progress part. DS-44(c) is a **new part** on an upstream-backed file, composed from `ProgressTrack`/`ProgressIndicator` (`progress.tsx`). That puts it under API-28, and the row text says so.
3. **DataList has no `aria-rowcount`, and there is no `headerLabel` anywhere.** DataGrid sets `aria-rowcount={loadMore?.hasMore ? -1 : ariaRowTotal}` (`data-grid.tsx:1075`). DS-31 adds the same rule to DataList. DS-32 adds `headerLabel` as a new `DataListColumn` option.
4. **FilterBar has no `children` prop.** `FilterBarProps` extends `ComponentPropsWithRef<"div">` without `onChange` (:92-95), and the JSX body (:281-355) overrides any children the consumer passes, so they are silently dropped. The fix is `Omit<…, "onChange" | "children">` (decision D5). The chip colon bug is confirmed: the docs say "separated by a colon" (:40, :166-167), but the render prints `label` then `value` with no colon (:233-234).
5. **`filter-bar.mdx` has no "Editable chip popovers" section.** There is nothing to rewrite, so DS-36 adds "Editing a filter" and "Range filter".
6. **FilterBuilder has no `allowGroups` or `labels`, and `maxDepth` defaults to 3** (:283). `FilterOperator` is `{value; label; requiresValue?}` (:61-72) and has no `valueShape` today. If 00a's DS-28 has not added `valueShape`, DS-41 adds it as an optional field.
7. **SortableList hides the handle and the menu on a `disabled` row** (`:180`, `:195`), although its JSDoc says they "disable". DS-43 makes the code match the intended contract: a spacer in place of the handle, and a menu that stays.
8. **`TIMINGS` lives in the public npm package** (`packages/design/src/index.ts:62`), not in the registry. A search debounce default needs a new key, and that makes `@vegastack/design` change (decision D3).
9. **Hooks have no page of their own.** Every hook record has `coverage.docs: "shared-guide-only"`, `docsSlug: "/docs/guides/components"` and `navigation`/`preview` exempt (e.g. `use-drag-reorder`). The brief's `components/use-async-search.mdx` would be the first hook page under the canon. This plan documents the hook in `guides/components.mdx` and in `searchable-select.mdx` § "Server search" (decision D4).
10. **The decision register is not in this worktree.** `docs/plans/2026-09-18-shadcn-reset/` is git-excluded (`.git/info/exclude:9`). 00d's REG task commits `decisions.md`. API-27/API-28 go into `decisions.json`, `exception-map.json` and the committed register only after REG is on `main` and MK has approved each row.
11. **`combobox` and `attachment` are upstream-backed.** Their patch headers today are `combobox.patch`: A11Y-2, A11Y-3, A11Y-4, A11Y-9, A11Y-16, BRD-1, DOC-1, DOC-2, FOC-1, FOC-3, FOC-5, FOC-6, FRM-4, INT-1, OVL-13, and `attachment.patch`: A11Y-2, A11Y-13, API-16, DOC-1, DOC-2, FOC-1, FOC-6. Their docs Examples mirror upstream's sections, so the new sections ("Async status", "Record files grid", "Upload queue") are added only if `verify-variant-coverage` accepts extra sections after upstream's. If it does not, they move into Usage, and each Deviations bullet names the row.
12. Line anchors that moved: DataGrid's group row is at ~:1163-1213 with the count `({section.rows.length})` at :1203. DataList's injected first-cell `<button data-slot="data-list-row-action">` is at :634-642. The selection label `Select row ${index + 1}` is at :611. `use-drag-reorder.ts` lives in `registry/ui/` (horizontal edges :405-406, arrow keys :592-595, axis-aware and RTL-flipped). `data-list-pager`'s "DataGrid's loadMore" is at `registry.json:951`.
13. **`@tiptap/markdown@3.31.3`** is the current release. Its peers `@tiptap/core`/`@tiptap/pm` are pinned at 3.31.3, the same as our `^3.31.3`, and it depends on `marked ^17` (decision D2).

## Decisions MK makes on this plan

| ID  | Question                                                                                                                                                                   | Recommendation                                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1a | **API-27**: combobox re-exports Base UI `Combobox.Status` as `ComboboxStatus` (sr-only by default, `visible` variant) (DS-40)                                              | Approve. It is the engine's own live region, which the component skill § 5 already requires to stay mounted as a listbox sibling.                         |
| D1b | **API-28**: attachment widened scope, `AttachmentGroup layout="scroll" \| "grid"`, a new `AttachmentProgress` on the Progress parts, `muted`, nested-image styling (DS-44) | Approve. Numbered after 00a/00e's API-18…API-26. If those are renumbered at approval, these follow on.                                                    |
| D2  | **`@tiptap/markdown` (+ transitive `marked`)** is covered by the AGENTS.md "Renderer / behavior engines" `tiptap` entry                                                    | Yes: same vendor, same version line, and it is imported only in `text-edit.tsx`. If MK says no, DS-48 stops and Regent 04 follows its own stop condition. |
| D3  | **`TIMINGS.searchDebounceMs`** (new key in `@vegastack/design`, 300 ms) as the default for SearchInput, FilterBar search and `useAsyncSearch`                              | Add it. `autoSaveDebounceMs` (800 ms) is too slow for type-ahead. It costs a `@vegastack/design` patch in the same release.                               |
| D4  | `use-async-search` docs: a shared-guide entry (house model for hooks) instead of the brief's `components/use-async-search.mdx`                                             | Follow the house model: `guides/components.mdx` hook section + `searchable-select.mdx` "Server search".                                                   |
| D5  | FilterBar `children`: remove it from the type instead of adding a slot                                                                                                     | Remove it (`Omit<…, "children">`). No documented need for a slot, and today the prop is silently dropped.                                                 |
| D6  | New `ours.json` entries `load-more` and `use-async-search`                                                                                                                 | Confirm. They are new components of ours, and the parity gate requires the entry.                                                                         |
| D7  | Release cadence: five change PRs, each merged and released on its own `ship it` (00c needs PRs 1–3 on `main`), or one batched release                                      | Five PRs. Each `ship it` covers one PR through publish (AGENTS.md non-negotiable 5).                                                                      |

Visible default changes, stated in their changesets (`🔧`): DataGrid's footer becomes the shared `LoadMore` (outline, and "End of list" only when the host passes `endLabel`), and DataGrid's group count "(3)" becomes the shared muted count.

## Dependencies (which upstream PR must be on `main` first)

| Task         | Waits for                                                                                                                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1–4 (PR 1)   | 00a DS-68 (truncation-focus provider, `data-list.tsx`), 00e DS-10 (menu description line, focusable disabled items)                                                                                 |
| 5–7 (PR 2)   | 00a DS-17 + DS-22 (`searchable-select` size tier, Field wiring, clear), DS-47 (`field.tsx`), API-26; 00e DS-06 (option rows via Item parts, API-19), DS-07 (`ItemGroupLabel`); REG + D1a for task 7 |
| 8–10 (PR 3)  | PR 2 merged; 00a DS-28 (FilterBuilder depth-1/plural/value-shape)                                                                                                                                   |
| 11–13 (PR 4) | PR 1 (`RowActionsMenu`); 00a DS-70 (late handle registration); REG + D1b for task 12                                                                                                                |
| 14–15 (PR 5) | D2 for task 14; 00a DS-23 (`multi-step-form` sticky actions) for task 15; 00e DS-65 (⌘B guard) for task 14                                                                                          |
| 16           | 00d's doctrine PR is merged (the lines ride the next doctrine PR)                                                                                                                                   |

## PR breakdown

Every PR carries the four artefacts per item (source, `<name>.test.tsx` with `expectNoA11yViolations` per distinct state, MDX, changeset). With them go the `registry.json` item (`meta.whenToUse`/`whenNotToUse`, `registryDependencies` as `@vegastack/<name>`), the `component-contracts.json` record + `pnpm design:derived`, the preview and barrel export (`apps/docs/components/preview/index.tsx`) and the `meta.json` nav entry for a new page. `design.md`, skills and AGENTS.md stay out (task 16).

- **PR 1: lists** (tasks 1–4) · DS-30…DS-34 · changesets `🧩` load-more, `🔧` data-list, data-grid, data-table-parts
- **PR 2: search + selects** (tasks 5–7) · DS-38, DS-39, DS-40 · `🧩` use-async-search, `🔧` searchable-select, combobox; `@vegastack/design` patch for D3
- **PR 3: filters** (tasks 8–10) · DS-35, DS-36, DS-37, DS-41, DS-42 · `🔧` filter-bar, search-input, filter-bar-managed
- **PR 4: ordering + files** (tasks 11–13) · DS-43, DS-44, DS-45 · `🔧` sortable-list, use-drag-reorder, drag-item, attachment; `📚` dropzone
- **PR 5: forms** (tasks 14–15) · DS-48, DS-76 · `🔧` text-edit, multi-step-form
- **Doctrine lines** (task 16), in 00d's next doctrine PR

## Tasks

- [ ] **Task 1: DS-30 `load-more` (new, ours) + `LoadMoreState`, DataGrid onto it**
  - Files — Create: `packages/ui/registry/ui/load-more.tsx`, `packages/ui/registry/ui/load-more.test.tsx`, `apps/docs/components/preview/load-more.tsx`, `apps/docs/content/docs/components/load-more.mdx`, `.changeset/load-more.md` · Modify: `packages/ui/upstream/ours.json` (`items["load-more"]` + `counts`), `packages/ui/registry.json` (new item; data-grid item `registryDependencies` + `@vegastack/load-more`; data-list-pager `whenNotToUse` at :951 now points at LoadMore), `packages/ui/component-contracts.json` (new component record; data-grid record states; `expectedCounts.components` 112→113, `expectedWaveCounts`), `packages/ui/registry/ui/data-grid.tsx` (`DataGridLoadMore` :201-212 → `@deprecated` alias of `LoadMoreState`; footer :1226-1242 renders `LoadMore`), `packages/ui/registry/ui/data-grid.test.tsx`, `apps/docs/content/docs/components/data-grid.mdx` (footer note), `apps/docs/components/preview/index.tsx`, `apps/docs/content/docs/components/meta.json` (Data Display, after `data-list-pager`), `packages/ui/test/geometry.browser.test.tsx` (load-more fixture)
  - Interfaces — Produces: `export type LoadMoreState = { hasMore: boolean; onLoadMore: () => void; loading?: boolean; error?: React.ReactNode }`; `export type LoadMoreProps = LoadMoreState & { label?: string /* "Load more" */; retryLabel?: string /* "Try again" */; endLabel?: React.ReactNode /* undefined = render nothing */; className?: string; ref?: React.Ref<HTMLDivElement> }`; `export function LoadMore(props: LoadMoreProps)` (`data-slot="load-more"`, `Button variant="outline" size="sm" loading`, error line `text-destructive-text` `role="alert"`). `DataGridLoadMore = LoadMoreState` (deprecated). Consumed by tasks 2, 5, 7, 8 and 00c (Board lanes, blocks).
  - Steps: write the tests first →
    ```tsx
    test("renders nothing when complete and no endLabel", async () => {
      const screen = await render(
        <LoadMore hasMore={false} onLoadMore={() => {}} />,
      );
      expect(
        screen.container.querySelector('[data-slot="load-more"]'),
      ).toBeNull();
    });
    test("error shows the message and Try again retries", async () => {
      const onLoadMore = vi.fn();
      const screen = await render(
        <LoadMore
          hasMore
          onLoadMore={onLoadMore}
          error="Couldn't load more."
        />,
      );
      await expect
        .element(screen.getByRole("alert"))
        .toHaveTextContent("Couldn't load more.");
      await screen.getByRole("button", { name: "Try again" }).click();
      expect(onLoadMore).toHaveBeenCalledOnce();
      await expectNoA11yViolations(screen.container);
    });
    ```
    plus: loading sets `aria-busy` and keeps the width, focus stays on the button after rows append, the DataGrid footer renders `[data-slot="load-more"]` and no "All rows loaded", and axe for idle/loading/error/done → run `pnpm check:component load-more`, expect FAIL (module missing) → implement → `pnpm registry:build && pnpm design:derived && pnpm check:component load-more && pnpm check:component data-grid` PASS → commit `feat(load-more): shared Load more footer and LoadMoreState (DS-30)`

- [ ] **Task 2: DS-31 DataList `loadMore` + DS-33 row links**
  - Files — Modify: `packages/ui/registry/ui/data-list.tsx` (props; footer seat before `footer` :706; `aria-rowcount`; first-cell control :634-642; selection label :611), `packages/ui/registry/ui/data-list.test.tsx`, `apps/docs/content/docs/components/data-list.mdx` ("Load more (keyset)", "Rows as links"), `apps/docs/components/preview/data-list.tsx`, `packages/ui/registry.json` (data-list `registryDependencies` + `@vegastack/load-more`; `whenToUse` rewritten: keyset paging, row links), `packages/ui/component-contracts.json` (data-list states), `.changeset/data-list-load-more-links.md`
  - Interfaces — Consumes: `LoadMoreState`, `LoadMore` (task 1) · Produces: `DataListProps<T>.loadMore?: LoadMoreState`; `getRowHref?: (row: T) => string | undefined`; `rowLinkRender?: React.ReactElement` (default `<a />`, merged with `href` + children through `useRender`); `getRowLabel?: (row: T) => string` (selection name "Select {label}", default "Select row {n}"). `aria-rowcount` is unset while `loadMore.hasMore`, otherwise the row count. `onRowClick` is unchanged when there is no href. A row-wide click forwards to the link with modifier keys preserved. `INTERACTIVE_SELECTOR` (:229-230) is unchanged.
  - Steps: tests first →
    ```tsx
    test("getRowHref makes the first cell a real link", async () => {
      const screen = await render(
        <DataList
          rows={rows}
          columns={cols}
          getRowId={(r) => r.id}
          getRowHref={(r) => `/tasks/${r.id}`}
        />,
      );
      const link = screen.getByRole("link", { name: "Aria Gimbal 15W" });
      await expect.element(link).toHaveAttribute("href", "/tasks/t1");
      expect(
        screen.container.querySelector('[data-slot="data-list-row-action"]'),
      ).toBeNull();
    });
    ```
    plus: ⌘-click and middle-click on the row reach the link natively (no `preventDefault`), interactive cells don't navigate, the mobile merge keeps the link, the checkbox is named from `getRowLabel`, the `aria-rowcount` rule, LoadMore in the footer, and axe for loading/error/done → FAIL → implement → `pnpm registry:build && pnpm check:component data-list` PASS → commit `feat(data-list): load more and rows as links (DS-31, DS-33)`. Stop condition: if the link-first-cell change breaks `onRowClick` for an existing consumer (blocks, DataGrid), stop and propose a separate prop path.

- [ ] **Task 3: DS-32 shared row actions (`RowActionsMenu`, `rowActionsColumn`)**
  - Files — Modify: `packages/ui/registry/ui/data-table-parts.tsx` (new exports), `packages/ui/registry/ui/data-list.tsx` (`DataListColumn.headerLabel`, re-export `rowActionsColumn`), `packages/ui/registry/ui/data-list.test.tsx`, `packages/ui/registry/ui/data-table-parts.test.tsx` (create if absent, and add it to the contract's `testFiles`), `apps/docs/content/docs/components/data-list.mdx` ("Row actions"), `apps/docs/components/preview/data-list.tsx`, `packages/ui/registry.json` (data-table-parts `registryDependencies` + `@vegastack/dropdown-menu`, `@vegastack/tooltip`, `@vegastack/button`), `packages/ui/component-contracts.json`, `.changeset/row-actions.md`
  - Interfaces — Produces: `export type RowAction = { label: string; onSelect?: () => void; render?: React.ReactElement; destructive?: boolean; disabled?: boolean; disabledReason?: string; icon?: React.ReactNode }`; `export function RowActionsMenu(props: { label: string; actions: RowAction[]; actionsLabel?: (label: string) => string /* "Actions for {label}" */ })`; `export function rowActionsColumn<T>(opts: { getRowLabel: (row: T) => string; actions: (row: T) => RowAction[]; key?: string; headerLabel?: string /* "Actions" */ }): DataListColumn<T>` (`align:"end"`, `minWidth:48`, `mobile:"visible"`, `interactive:true`). Exactly one action with `icon` renders an icon `Button` + `Tooltip`. `disabledReason` renders as 00e DS-10's description line. Consumed by task 11 (SortableList) and 00c DS-51 (Board).
  - Steps: tests first →
    ```tsx
    test("disabled action keeps its reason reachable by arrow keys", async () => {
      const screen = await render(
        <RowActionsMenu
          label="Aria"
          actions={[
            {
              label: "Delete",
              destructive: true,
              disabled: true,
              disabledReason: "In use by 3 products",
            },
          ]}
        />,
      );
      await screen.getByRole("button", { name: "Actions for Aria" }).click();
      await userEvent.keyboard("{ArrowDown}");
      const item = screen.getByRole("menuitem", { name: "Delete" });
      await expect.element(item).toHaveAttribute("aria-disabled", "true");
      await expect
        .element(item)
        .toHaveAccessibleDescription("In use by 3 products");
    });
    ```
    plus: a link action keeps its `href`, destructive ink, single-icon mode has a Tooltip and a name, a trigger click doesn't fire `onRowClick`, the sr-only header "Actions", axe → FAIL → implement → `pnpm registry:build && pnpm check:component data-table-parts` PASS → commit `feat(data-table-parts): one row-actions menu for lists, sortable rows and boards (DS-32)`

- [ ] **Task 4: DS-34 `SectionRow` shared by DataList sections and DataGrid groups**
  - Files — Modify: `packages/ui/registry/ui/data-table-parts.tsx` (`SectionRow`, `GroupState` type), `packages/ui/registry/ui/data-grid.tsx` (group row ~:1163-1213 onto `SectionRow`; count :1203), `packages/ui/registry/ui/data-list.tsx` (sections), both tests, `apps/docs/content/docs/components/data-list.mdx` ("Sections"), `apps/docs/content/docs/components/data-grid.mdx` (count note), `apps/docs/components/preview/data-list.tsx`, `packages/ui/test/geometry.browser.test.tsx` (section-row fixture), `packages/ui/component-contracts.json`, `.changeset/list-sections.md`
  - Interfaces — Consumes: `LoadMoreState` (task 1) · Produces: `export type GroupState = Record<string, "expanded" | "collapsed">` (DataGrid's existing inline type at :273, now named); `export function SectionRow(props: { id: string; label: React.ReactNode; count: number; colSpan: number; expanded: boolean; onExpandedChange: (next: boolean) => void; countLabel?: (n: number) => string })` (`<th scope="rowgroup" colSpan>` + disclosure `aria-expanded` + muted `tabular-nums` count); `DataListProps<T>.sections?: { id: string; label: React.ReactNode; count?: number }[]`, `getRowSection?: (row: T) => string`, `groupState?: GroupState`, `defaultGroupState?: GroupState`, `onGroupStateChange?: (s: GroupState) => void`. One `<thead>`, one `<tbody data-slot="data-list-section">` per non-empty section.
  - Steps: tests first →
    ```tsx
    test("sections render in prop order under one header", async () => {
      const screen = await render(
        <DataList
          rows={tasks}
          columns={cols}
          getRowId={(r) => r.id}
          sections={[
            { id: "overdue", label: "Overdue" },
            { id: "today", label: "Today" },
          ]}
          getRowSection={(r) => r.due}
        />,
      );
      expect(screen.container.querySelectorAll("thead")).toHaveLength(1);
      const heads = screen.container.querySelectorAll('th[scope="rowgroup"]');
      expect([...heads].map((h) => h.textContent)).toEqual([
        expect.stringMatching(/^Overdue/),
        expect.stringMatching(/^Today/),
      ]);
    });
    ```
    plus: collapse hides rows and flips `aria-expanded`, `loadMore` appends into the right section, empty sections are omitted, select-all covers loaded rows across sections, DataGrid's group row is unchanged except the count and `aria-rowindex` stays continuous, axe → FAIL → implement → `pnpm check:component data-list && pnpm check:component data-grid` PASS → commit `feat(data-list): sections on DataGrid's group row (DS-34)`. Stop condition: if `SectionRow` breaks DataGrid's `aria-rowindex` continuity or grid keyboard behaviour, keep DataGrid's row and share only the classes and `GroupState`.

- [ ] **Task 5: DS-39 `use-async-search` (new hook, ours) + D3 timing key**
  - Files — Create: `packages/ui/registry/ui/use-async-search.ts`, `packages/ui/registry/ui/use-async-search.test.tsx`, `.changeset/use-async-search.md` (`"@vegastack/ui": minor`, `"@vegastack/design": patch`, `🧩`) · Modify: `packages/design/src/index.ts` (`TIMINGS.searchDebounceMs: 300` with JSDoc), `packages/ui/upstream/ours.json`, `packages/ui/registry.json` (new `registry:hook` item, target `@ui/use-async-search.ts`, `registryDependencies: ["@vegastack/load-more"]` for the type, `meta` written fresh), `packages/ui/component-contracts.json` (hook record, `coverage.docs: "shared-guide-only"`; `expectedCounts.hooks` 11→12, `expectedWaveCounts.Hooks`, `expectedWaveMembers.Hooks`), `tooling/verify-component-contracts.mjs` (the hard-coded Hooks roster and `expectedWaveCounts.Hooks === 11` assertion → 12), `apps/docs/content/docs/guides/components.mdx` (hook list entry, D4)
  - Interfaces — Consumes: `LoadMoreState` (task 1), `TIMINGS.searchDebounceMs` · Produces: `export function useAsyncSearch<T>(load: (query: string, ctx: { cursor?: string | null; signal: AbortSignal }) => Promise<{ items: T[]; nextCursor?: string | null }>, opts?: { debounceMs?: number; deps?: unknown[]; enabled?: boolean; initialQuery?: string }): UseAsyncSearchResult<T>`; `export type UseAsyncSearchResult<T> = { items: T[]; query: string; onSearchChange: (q: string) => void; loading: boolean; error: React.ReactNode | undefined; loadMore: LoadMoreState; reload: () => void }`. The spread is the prop contract of task 6 (`remote` props) and task 8 (facet).
  - Steps: tests first (fake timers) →
    ```tsx
    test("drops an out-of-order response", async () => {
      vi.useFakeTimers();
      const slow = deferred<{ items: string[] }>();
      const fast = deferred<{ items: string[] }>();
      const load = vi.fn((q: string) =>
        q === "a" ? slow.promise : fast.promise,
      );
      const { result } = renderHook(() =>
        useAsyncSearch(load, { debounceMs: 10, enabled: false }),
      );
      act(() => result.current.onSearchChange("a"));
      await vi.advanceTimersByTimeAsync(10);
      act(() => result.current.onSearchChange("ab"));
      await vi.advanceTimersByTimeAsync(10);
      fast.resolve({ items: ["ab"] });
      slow.resolve({ items: ["a"] });
      await vi.runAllTimersAsync();
      expect(result.current.items).toEqual(["ab"]);
      expect(load.mock.calls[0][1].signal.aborted).toBe(true);
    });
    ```
    plus: debounce, first load on mount when `enabled`, cursor append through `loadMore.onLoadMore`, items kept on error then `reload`, `deps` change resets, and a type test that `<SearchableSelect remote {...search} />` compiles (lands in task 6) → FAIL → implement → `pnpm --filter @vegastack/design build && pnpm registry:build && pnpm design:derived && pnpm check:component use-async-search` PASS → commit `feat(use-async-search): debounced, abortable, paged search hook (DS-39)`

- [ ] **Task 6: DS-38 SearchableSelect: server search, `multiple`, descriptions, disabled reasons**
  - Files — Modify: `packages/ui/registry/ui/searchable-select.tsx`, `packages/ui/registry/ui/searchable-select.test.tsx`, `apps/docs/content/docs/components/searchable-select.mdx` ("Server search", "Several values", "Option details and disabled reasons", "In a form with an error"), `apps/docs/components/preview/searchable-select.tsx`, `packages/ui/registry.json` (`registryDependencies` + `@vegastack/load-more`, `@vegastack/item`; `whenToUse`/`whenNotToUse` rewritten), `packages/ui/component-contracts.json`, `.changeset/searchable-select-async-multiple.md`
  - Interfaces — Consumes: `LoadMoreState`/`LoadMore` (task 1), `ComboboxStatus` (task 7), `ItemDescription` (00e API-19), 00a DS-17/DS-22's `variant`/`size`/Field wiring · Produces (additive; `value` stays the item object): `multiple?: boolean` (Base UI Combobox `multiple`; `value: Item[]`; the trigger reads "{a}, {b}" / "{n} selected" through `renderValue`), `itemToDescription?: (item) => string | undefined`, `itemToDisabledReason?: (item) => string | undefined` (presence = disabled but focusable; the reason is the description line, `aria-describedby`), `remote?: boolean` (Base UI `filter={null}`), `onSearchChange?: (q: string) => void`, `loading?: boolean` ("Searching…" through `ComboboxStatus`, rows kept), `error?: React.ReactNode` (+ "Try again" → `loadMore?.onLoadMore ?? onRetry`), `onRetry?: () => void`, `loadMore?: LoadMoreState`, `leadingItems?: Item[]` (never filtered, pinned first), `groupBy?: (item) => string`, `retryLabel?: string`, `loadingLabel?: string`. A value missing from `items` still shows its label.
  - Steps: tests first →
    ```tsx
    test("remote mode never filters locally and announces loading once", async () => {
      const screen = await render(
        <SearchableSelect
          searchLabel="Search customers"
          items={[acme, globex]}
          remote
          loading
          itemToKey={(o) => o.id}
          itemToStringLabel={(o) => o.name}
          renderItem={(o) => o.name}
          value={null}
          onValueChange={() => {}}
          placeholder="Choose"
        />,
      );
      await screen.getByRole("combobox").click();
      await userEvent.keyboard("zzz");
      await expect
        .element(screen.getByRole("option", { name: "Acme" }))
        .toBeInTheDocument();
      await expect
        .element(screen.getByRole("status"))
        .toHaveTextContent("Searching…");
    });
    ```
    plus: a stale response is ignored (with the hook), leading items come first, a disabled item is focusable with its reason as the accessible description, `multiple` sets `aria-selected` per option and posts every key through 00a's `name`, load more by keyboard, group headings, and axe for closed/open/loading/error/empty/multiple → FAIL → implement → `pnpm check:component searchable-select` PASS → commit `feat(searchable-select): server search, several values, option details (DS-38)`. Stop condition: if Base UI `multiple` can't sit behind the Button trigger without changing the single-select contract, stop and propose a separate trigger mode. No fallback to Command.

- [ ] **Task 7: DS-40 `ComboboxStatus` export (upstream-backed, API-27)**
  - Files — Modify: `packages/ui/registry/ui/combobox.tsx` (re-export after :309-326), `packages/ui/upstream/patches/combobox.patch` (regenerated, header + `API-27` hunk), `packages/ui/upstream/decisions.json` + `packages/ui/upstream/exception-map.json` (API-27 → combobox) + `docs/plans/2026-09-18-shadcn-reset/decisions.md` (committed by 00d REG), `packages/ui/registry/ui/combobox.test.tsx`, `apps/docs/content/docs/components/combobox.mdx` ("Async status" if variant coverage admits it; the Deviations bullet `API-27`), `apps/docs/components/preview/combobox.tsx`, `.changeset/combobox-status.md`
  - Interfaces — Produces: `export function ComboboxStatus(props: ComboboxPrimitive.Status.Props & { visible?: boolean })` (`data-slot="combobox-status"`, `sr-only` unless `visible`). It stays mounted as a sibling of the list, and its children toggle. Consumed by task 6.
  - Steps: `cp vendor/shadcn/4.21.0/ui/combobox.tsx packages/ui/registry/ui/combobox.tsx` → re-apply the mapped exceptions + the API-27 hunk → `pnpm upstream:diff combobox` (header adds `API-27`) → test:
    ```tsx
    test("ComboboxStatus is a mounted polite region next to the list (API-27)", async () => {
      const screen = await render(
        <Combobox items={["a"]}>
          <ComboboxInput aria-label="Fruit" />
          <ComboboxContent>
            <ComboboxStatus>Searching…</ComboboxStatus>
            <ComboboxList>
              {(i) => <ComboboxItem value={i}>{i}</ComboboxItem>}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>,
      );
      await screen.getByRole("combobox").click();
      await expect
        .element(screen.getByRole("status"))
        .toHaveTextContent("Searching…");
      expect(
        screen.container.ownerDocument.querySelector(
          '[role="listbox"] [role="status"]',
        ),
      ).toBeNull();
    });
    ```
    → `pnpm upstream:check && pnpm check:component combobox` PASS → commit `feat(combobox): export ComboboxStatus (DS-40, API-27)`. Blocked until D1a is approved and REG is on `main`.

- [ ] **Task 8: DS-35 `FilterBarFacet` on SearchableSelect `multiple`**
  - Files — Modify: `packages/ui/registry/ui/filter-bar.tsx` (new part), `packages/ui/registry/ui/filter-bar.test.tsx`, `apps/docs/content/docs/components/filter-bar.mdx` ("Facets", "Server-searched facet"), `apps/docs/components/preview/filter-bar.tsx`, `packages/ui/registry.json` (filter-bar `registryDependencies` + `@vegastack/searchable-select`; `whenToUse` rewritten), `packages/ui/component-contracts.json`, `packages/ui/test/geometry.browser.test.tsx` (facet trigger widths at 320px), `.changeset/filter-bar-facets.md`
  - Interfaces — Consumes: task 6's props, `UseAsyncSearchResult` (task 5) · Produces: `export function FilterBarFacet<Item>(props: FilterBarFacetProps<Item>)`, where `FilterBarFacetProps<Item>` = SearchableSelect's item/async props (`items`, `itemToKey`, `itemToStringLabel`, `itemToDescription`, `multiple`, `value`, `onValueChange`, `leadingItems`, `searchLabel`, `remote`, `onSearchChange`, `loading`, `error`, `loadMore`, `clearLabel`) + `label: string`, `defaultValue?` (reset target), `removable?: boolean` (default `true`), `onRemove?: () => void`, `pinSelected?: boolean` (groups "Selected" / "More"), `anyLabel?: string` ("Any"), `countLabel?: (n: number) => string` ("{n} selected"). Trigger text: `Status: Any` / `Status: Open` / `Status: Open, In progress` / `Status: 3 selected`. It works standalone and inside `addFilterMenu`.
  - Steps: tests first →
    ```tsx
    test.each([
      [[], "Status: Any"],
      [[open], "Status: Open"],
      [[open, prog], "Status: Open, In progress"],
      [[open, prog, done], "Status: 3 selected"],
    ])("trigger reads the selection", async (value, text) => {
      const screen = await render(
        <FilterBar>
          <FilterBarFacet
            label="Status"
            multiple
            items={statuses}
            value={value}
            onValueChange={() => {}}
            itemToKey={(o) => o.id}
            itemToStringLabel={(o) => o.name}
            searchLabel="Search statuses"
          />
        </FilterBar>,
      );
      await expect
        .element(screen.getByRole("combobox"))
        .toHaveTextContent(text);
    });
    ```
    plus: options expose `aria-selected`, selected rows are pinned, the remote race (with task 5), "2 selected" is announced once after a change, a non-removable facet has no remove, default reset, single mode closes on pick, keyboard only, and axe open/closed/loading/error → FAIL → implement → `pnpm check:component filter-bar` PASS → commit `feat(filter-bar): Label: value facets on SearchableSelect (DS-35)`

- [ ] **Task 9: DS-36 editable chips + chip fixes, DS-37 search placement and settled search**
  - Files — Modify: `packages/ui/registry/ui/filter-bar.tsx` (`FilterChipTrigger`; colon at :233-234; `Omit<…, "onChange" | "children">` at :92-95 per D5; `searchPlacement`), `packages/ui/registry/ui/search-input.tsx` (`debounceMs`, `onValueCommitted`), `packages/ui/registry/ui/filter-bar.test.tsx`, `packages/ui/registry/ui/search-input.test.tsx`, `apps/docs/content/docs/components/filter-bar.mdx` ("Editing a filter", "Range filter", "Search first"), `apps/docs/content/docs/components/search-input.mdx` ("Settled value"), both previews, `packages/ui/registry.json` (filter-bar + `@vegastack/popover`; search-input meta), `packages/ui/component-contracts.json`, `.changeset/filter-bar-editing-search.md`
  - Interfaces — Consumes: `TIMINGS.searchDebounceMs` (task 5) · Produces: `FilterBarFilter.editor?: React.ReactNode`; `FilterBarAddOption.editor?: React.ReactNode`; `FilterBarProps.onEditorOpenChange?: (id: string, open: boolean) => void`; `editLabel?: (label: string) => string` ("Edit {label} filter"); `searchPlacement?: "start" | "end"` (default `"end"`); `FilterBarSearch.debounceMs?: number` + `onValueCommitted?: (value: string) => void`; `SearchInputProps.debounceMs?` + `onValueCommitted?` (fires after the delay, immediately on Enter and on clear; the input stays instant). The chip's accessible name is "{label}: {value}". The chip root stays non-interactive (`chip.mdx:104`), and remove keeps its own 24px target.
  - Steps: tests first →
    ```tsx
    test("onValueCommitted fires after the debounce and at once on Enter", async () => {
      vi.useFakeTimers();
      const committed = vi.fn();
      const screen = await render(
        <SearchInput
          aria-label="Search"
          debounceMs={300}
          onValueCommitted={committed}
        />,
      );
      await userEvent.type(screen.getByRole("searchbox"), "ab");
      expect(committed).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(300);
      expect(committed).toHaveBeenLastCalledWith("ab");
      await userEvent.type(screen.getByRole("searchbox"), "c{Enter}");
      expect(committed).toHaveBeenLastCalledWith("abc");
    });
    ```
    plus: the chip name has the colon, the editor opens and closes, Escape returns focus to `FilterChipTrigger`, remove is a separate target, add-then-edit in place, placement order, clear flushes, and axe → FAIL → implement → `pnpm check:component filter-bar && pnpm check:component search-input` PASS → commit `feat(filter-bar): editable chips, search first, settled search (DS-36, DS-37)`. Stop condition: if editing needs `FilterChip`'s root to be interactive, stop and ask.

- [ ] **Task 10: DS-41 FilterBuilder condition mode + DS-42 shared value editors**
  - Files — Modify: `packages/ui/registry/ui/filter-bar-managed.tsx` (`allowGroups`, `prefix`, `labels`, `fieldPicker`, `fieldPickerProps`, `conditionError`, `summary`, `describeFilter`, exported editors, `formatRange`; `FilterOperator.valueShape?` if 00a has not added it), `packages/ui/registry/ui/filter-bar-managed.test.tsx`, `apps/docs/content/docs/components/filter-bar-managed.mdx` ("Condition rules (no groups)", "Sentence summary", "Value editors"), `apps/docs/components/preview/filter-bar-managed.tsx`, `packages/ui/registry.json` (+ `@vegastack/number-field`, `@vegastack/searchable-select`, `@vegastack/select`, `@vegastack/field`; `whenToUse` rewritten), `packages/ui/component-contracts.json`, `.changeset/filter-builder-conditions.md`
  - Interfaces — Consumes: `FilterValueEditorProps` verbatim (:96-123), task 6 · Produces: `FilterBuilderProps.allowGroups?: boolean` (default `true`), `prefix?: string` (read in the fieldset legend), `labels?: Partial<FilterBuilderLabels>` (`matchAll`, `matchAny`, `addCondition`, `empty`, `valueRequired`, `field`, `operator`, `remove: (label: string) => string`), `fieldPicker?: "select" | "searchable"`, `fieldPickerProps?: Partial<SearchableSelectProps<FilterField>>`, `conditionError?: (c: FilterCondition, path: number[]) => string | undefined` (Field-wired), `summary?: "chips" | "sentence"`; `export function describeFilter(tree: FilterGroup, vocabulary: FilterField[], labels?: Partial<FilterBuilderLabels> & { prefix?: string }): string`; `export const TextValueEditor, NumberValueEditor, NumberRangeEditor, OptionValueEditor, OptionsValueEditor: (props: FilterValueEditorProps) => JSX.Element`; `export function formatRange(min?: number, max?: number, unit?: string): string` (`≥ 10 W` · `10–20 W` · `≤ 20 W`). The tree JSON is unchanged.
  - Steps: tests first →
    ```tsx
    test("describeFilter reads the rule as one sentence", () => {
      expect(describeFilter(tree, vocab, { prefix: "Required when" })).toBe(
        "Required when Dimming is not Non-dimmable and Beam angle is at least 30°",
      );
    });
    test("range editor wires min>max error", async () => {
      const screen = await render(
        <Field>
          <NumberRangeEditor
            field={watts}
            operator="between"
            value={{ min: 20, max: 10 }}
            onValueChange={() => {}}
            aria-label="Wattage"
          />
        </Field>,
      );
      await expect
        .element(screen.getByRole("spinbutton", { name: "Minimum" }))
        .toHaveAccessibleDescription("Minimum can't be more than maximum.");
    });
    ```
    plus: no group UI at depth 1 with `allowGroups={false}`, prefix in the legend, searchable field picker, the row error in `aria-describedby`, the sentence summary per operator/shape, each editor round-trips its value shape, one-bound ranges, `formatRange` units, keyboard add/remove focus, axe per editor → FAIL → implement → `pnpm check:component filter-bar-managed` PASS → commit `feat(filter-bar-managed): condition rules, sentence summary, shared value editors (DS-41, DS-42)`

- [ ] **Task 11: DS-43 SortableList locked rows, actions, grid; drag-item and use-drag-reorder prerequisites**
  - Files — Modify: `packages/ui/registry/ui/sortable-list.tsx` (:180 spacer, :195 menu kept; `renderActions`, `menuItems`, `actionsLabel`, `lockedReason`, `layout`), `packages/ui/registry/lib/drag-item.ts` (:35-36 left/right drop-edge hairlines), `packages/ui/registry/ui/use-drag-reorder.ts` (row-aware ↑/↓ in grid from the measured column count, next to :592-595), `packages/ui/registry/ui/sortable-list.test.tsx`, `packages/ui/registry/lib/drag-item.test.ts`, `packages/ui/registry/ui/use-drag-reorder.test.tsx`, `apps/docs/content/docs/components/sortable-list.mdx` ("With inline rename", "With row actions", "Locked rows", "Image grid"), `apps/docs/components/preview/sortable-list.tsx`, `packages/ui/test/geometry.browser.test.tsx` (grid + drop-edge fixture), `packages/ui/registry.json` (sortable-list + `@vegastack/data-table-parts`; `whenToUse` rewritten), `packages/ui/component-contracts.json` (three records), `.changeset/sortable-list-locked-grid.md`
  - Interfaces — Consumes: `RowAction`, `RowActionsMenu` (task 3) · Produces: `SortableListProps<T>.renderActions?: (item: T) => React.ReactNode`, `menuItems?: (item: T) => RowAction[]` (merged above the Move items in one ⋯ "Actions for {label}"), `actionsLabel?: (label: string) => string`, `lockedReason?: string` (Board's name; the description on disabled Move items), `layout?: "list" | "grid"` (grid = `grid-cols-[repeat(auto-fill,minmax(--spacing(28),1fr))]`, handle overlaid top-start); `UseDragReorderOptions.columns?: number | "auto"` (row-aware vertical arrows when `axis:"horizontal"` wraps); `drag-item` classes for `data-[drop-edge=left|right]`.
  - Steps: tests first →
    ```tsx
    test("a locked row keeps its spacer and menu, and Move items carry the reason", async () => {
      const screen = await render(
        <SortableList
          items={[
            { id: "a", label: "Unit", disabled: true },
            { id: "b", label: "Colour" },
          ]}
          getItemLabel={(i) => i.label}
          renderItem={(i) => i.label}
          onReorder={() => {}}
          lockedReason="Built-in values can't move"
        />,
      );
      const row = screen.container.querySelector(
        '[data-slot="sortable-list-item"]',
      )!;
      expect(
        row.querySelector('[data-slot="sortable-list-handle-spacer"]'),
      ).not.toBeNull();
      await screen.getByRole("button", { name: "Actions for Unit" }).click();
      await expect
        .element(screen.getByRole("menuitem", { name: "Move down" }))
        .toHaveAccessibleDescription("Built-in values can't move");
    });
    ```
    plus: drag only from the handle with an input in the row, the menu holds custom + Move groups, others move past a locked row, the grid shows left/right indicators, ↑/↓ move by row in the grid, a rejected reorder snaps back, axe list/grid → FAIL → implement → `pnpm check:component sortable-list && pnpm check:component use-drag-reorder && pnpm check:component board` PASS → commit `feat(sortable-list): locked rows, row actions, image grid (DS-43)`. Stop condition: if `axis:"horizontal"` misorders a wrapped grid even with left/right edges, stop and propose a 2-D hitbox. No new engine.

- [ ] **Task 12: DS-44 Attachment scope, grid, progress, muted (upstream-backed, API-28)**
  - Files — Modify: `packages/ui/registry/ui/attachment.tsx` (`AttachmentGroup layout`; new `AttachmentProgress`; `muted`; `[&_img]` in place of `*:[img]` at :64), `packages/ui/upstream/patches/attachment.patch` (regenerated; header + `API-28`), `packages/ui/upstream/decisions.json` + `exception-map.json` + the committed register, `packages/ui/registry/ui/attachment.test.tsx`, `apps/docs/content/docs/components/attachment.mdx` ("Record files grid", "Upload queue" pointer, Deviations `API-28`), `apps/docs/components/preview/attachment.tsx`, `packages/ui/registry.json` (attachment `whenToUse` "file and media tiles on any surface: chat attachments, record files, upload queues", + `@vegastack/progress`; dropzone `whenNotToUse` points at Attachment for progress), `packages/ui/test/geometry.browser.test.tsx` (grid at 320/1280), `packages/ui/component-contracts.json`, `.changeset/attachment-grid-progress.md`
  - Interfaces — Produces: `AttachmentGroupProps.layout?: "scroll" | "grid"` (default `"scroll"`); `export function AttachmentProgress(props: { value: number | null; max?: number; className?: string })` composing `ProgressTrack`/`ProgressIndicator` with `aria-valuetext="{n}%"`; `AttachmentProps.muted?: boolean` (`data-muted`, media `opacity-50`). `state="uploading"` without `AttachmentProgress` keeps the shimmer. Consumed by task 13.
  - Steps: `cp vendor/shadcn/4.21.0/ui/attachment.tsx packages/ui/registry/ui/attachment.tsx` → re-apply the mapped exceptions + the API-28 hunks → `pnpm upstream:diff attachment` → tests:
    ```tsx
    test("AttachmentProgress announces a percentage (API-28)", async () => {
      const screen = await render(
        <Attachment state="uploading">
          <AttachmentProgress value={42} />
        </Attachment>,
      );
      await expect
        .element(screen.getByRole("progressbar"))
        .toHaveAttribute("aria-valuetext", "42%");
    });
    ```
    plus: a muted tile announces its description, a DS `Image` inside media fills and falls back, axe idle/uploading/progress/error/done/muted → `pnpm upstream:check && pnpm check:component attachment` PASS → commit `feat(attachment): record-file grid, determinate progress, muted tiles (DS-44, API-28)`. Blocked until D1b is approved and REG is on `main`.

- [ ] **Task 13: DS-45 "Upload queue" docs example on Dropzone**
  - Files — Modify: `apps/docs/content/docs/components/dropzone.mdx` ("Upload queue" section), `apps/docs/components/preview/dropzone.tsx` (new `dropzoneUploadQueue` export), `apps/docs/components/preview/index.tsx`, `.changeset/dropzone-upload-queue.md` (`📚`)
  - Interfaces — Consumes: `AttachmentGroup layout="grid"`, `AttachmentProgress` (task 12), `Dropzone accept maxSize multiple onFilesAccepted onFilesRejected`, `Field`, `Select`, `Input` · Produces: the preview `dropzoneUploadQueue` with a stub `uploadFile(file: File, opts: { onProgress: (n: number) => void; signal: AbortSignal }): Promise<void>` and the copy "Drop files here or browse", "Cancel upload", "Retry upload", "Discard file", "{name} is larger than 25 MB.", "{name} isn't a supported file type."
  - Steps: edit → verify: the docs preview test mounts it (`pnpm -F @vegastack/docs test -- preview`), `pnpm --filter @vegastack/ui exec vitest run test/geometry.browser.test.tsx -t dropzoneUploadQueue`, `node tooling/content-lint.mjs`, `pnpm upstream:check` (dropzone is ours, so no variant-coverage constraint) → commit `docs(dropzone): upload queue example (DS-45)`

- [ ] **Task 14: DS-48 TextEdit Markdown + `readOnly`/`disabled`**
  - Files — Modify: `packages/ui/package.json` (`"@tiptap/markdown": "^3.31.3"`), `pnpm-lock.yaml`, `packages/ui/registry/ui/text-edit.tsx` (`format`, `readOnly`, `disabled`, `editable` → deprecated alias at :309), `packages/ui/registry/ui/text-edit.test.tsx`, `apps/docs/content/docs/components/text-edit.mdx` ("Markdown"), `apps/docs/components/preview/text-edit.tsx`, `packages/ui/registry.json` (text-edit `dependencies` + `@tiptap/markdown@^3.31.3`; `whenToUse` rewritten), `packages/ui/component-contracts.json` (engines + npmDependencies), `.changeset/text-edit-markdown.md`. AGENTS.md's engine line moves in task 16, not here.
  - Interfaces — Produces: `TextEditProps.format?: "html" | "markdown"` (default `"html"`; with `"markdown"`, `value`/`onValueChange` are Markdown), `readOnly?: boolean`, `disabled?: boolean`. Toolbar items for nodes Markdown can't carry are disabled in Markdown mode.
  - Steps: tests first →
    ```tsx
    test.each(markdownFixtures)(
      "round-trips %s unchanged",
      async (_name, md) => {
        const onValueChange = vi.fn();
        await render(
          <TextEdit
            format="markdown"
            value={md}
            onValueChange={onValueChange}
            aria-label="Summary"
          />,
        );
        expect(onValueChange).not.toHaveBeenCalled();
      },
    );
    ```
    (fixtures: headings, bold, italic, bullet and ordered lists, links, paragraphs), plus: edit then serialize, `MarkdownView` renders the output the same way, `readOnly`, axe editable/read-only → `pnpm install` → FAIL → implement → `pnpm registry:build && pnpm check:component text-edit` PASS (`verify-registry-deps` accepts the pin) → commit `feat(text-edit): Markdown format and readOnly (DS-48)`. Blocked until D2.

- [ ] **Task 15: DS-76 MultiStepForm `onStepChange(id, { replace })`**
  - Files — Modify: `packages/ui/registry/ui/multi-step-form.tsx` (:306 signature; `setCurrent` :531-538; the correction effect after the clamp :514-526 passes `replace: true`), `packages/ui/registry/ui/multi-step-form.test.tsx`, `apps/docs/content/docs/components/multi-step-form.mdx` ("Steps in the route"), `apps/docs/components/preview/multi-step-form.tsx`, `packages/ui/component-contracts.json`, `.changeset/multi-step-form-replace.md`
  - Interfaces — Produces: `onStepChange?: (id: string, details: { replace: boolean }) => void`. It is `false` for Next, Back and nav clicks, and `true` when the form clamps or normalises a controlled `step`. One-argument handlers keep working. `urlSync`/`persistKey` are unchanged, and the docs say route-driven hosts use controlled `step` only. Consumed by 00c DS-55.
  - Steps: tests first →
    ```tsx
    test("an unreachable controlled step is clamped and reported with replace", async () => {
      const onStepChange = vi.fn();
      await render(
        <MultiStepForm steps={steps} step="review" onStepChange={onStepChange}>
          {body}
        </MultiStepForm>,
      );
      expect(onStepChange).toHaveBeenCalledWith("details", { replace: true });
      expect(location.hash).toBe("");
    });
    ```
    plus: Next calls `(id, { replace: false })`, hash mode unchanged, axe → FAIL → implement → `pnpm check:component multi-step-form` PASS → commit `feat(multi-step-form): tell route hosts to push or replace (DS-76)`

- [ ] **Task 16: doctrine lines for 00d's next doctrine PR**
  - Files — Modify (in 00d's doctrine branch, not here): `skills/public/vegastack-design-system/SKILL.md` ("Names hide abilities": SearchableSelect `multiple`/`remote`, DataList `loadMore`/`getRowHref`/`sections`, SortableList `layout="grid"`, LoadMore, useAsyncSearch), `AGENTS.md` (the `tiptap` renderer entry names `@tiptap/markdown`, if D2 = yes), `design.md` (only if a line goes stale)
  - Interfaces — Consumes: the merged PRs 1–5 · Produces: doctrine that names only shipped abilities
  - Steps: after each PR merges, add its lines to the doctrine branch → verify: `node tooling/skill-lint.mjs`; `node tooling/sync-package-skills.mjs --check`; `pnpm design:sync:check`; `grep` each named prop in its source → commit `docs: roster lines for lists, filters and forms`

- [ ] **Task 17: per-PR proof, hand back, ship on MK's `ship it`**
  - Files — none beyond the changesets above
  - Interfaces — Produces: a published `@vegastack/ui` minor (+ `@vegastack/design` patch for D3), deployed to design.vegastack.com. Regent #139 consumes that version.
  - Steps: per PR run `pnpm upstream:check`, `pnpm registry:build && git status --short` (clean after), `pnpm design:derived:check`, `pnpm check:affected`, `pnpm lint`, `node tooling/changeset-lint.mjs`, `node tooling/changelog-assemble.mjs --dry-run && node tooling/changelog-assemble.mjs --check`, and the ship skill's package-vs-changeset diff. Then do the visual review (`skills/internal/ship/references/visual-review.md`) of the affected previews in light/dark at 320px and wide, across the brief's states (captures not committed). Hand back to MK with the branch, output and deferrals, then stop. On MK's own `ship it` (Regent's standing approval does not cover it): PR, `PR quality`, exact-SHA squash merge, Version Packages PR (`action_required` approval), exact-SHA merge, OIDC publish, `deploy.yml`, production probe (`docs/RELEASING.md`) → verify `npm view @vegastack/design version` and the registry version live.

## Stop points

1. **Plan approval.** No code before MK approves this file.
2. **Decision rows.** D1a blocks task 7, and task 6's "Searching…" line waits for it (task 6 otherwise ships). D1b blocks task 12 and task 13. D2 blocks task 14. An unapproved row stops only its item. The rest ships, and the hand-back names the blocked Regent child issues (API-27: 04, 05, 06, 07, 08, 10, 11, 12; API-28: 06, 07, 08; D2: 04).
3. **Ship it.** Each PR waits for MK's `ship it` in this repo.
4. The brief's stop conditions, repeated in tasks 2, 4, 6, 9 and 11, plus any release step that crosses a trust boundary (RELEASING.md).

## Out of scope

Everything the brief lists: 00a/00e/00d/00c items, `use-keyset-list` and the other deferred optionals, a `condition-builder` component, `nav-rail`, `tile-grid`, an `upload-01` block, DataGrid features beyond LoadMore and SectionRow, and every Regent page and wrapper change (the child issues do that).
