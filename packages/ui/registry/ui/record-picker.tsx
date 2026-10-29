// @vegastack record-picker@0.25.98 sha256-Xf381k9ERqhkMu8xhkdOaNMLl+IPFjey/9oh4yroULw=

"use client";

import * as React from "react";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@vegastack/design";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandFilters,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from "@/components/ui/command";
import { DialogFooter } from "@/components/ui/dialog";
import { useAnnouncer } from "@/components/ui/use-announcer";
import {
  useAsyncSearch,
  type AsyncSearchPage,
} from "@/components/ui/use-async-search";

/* ------------------------------------------------------------------------------------------------
 * RecordPicker — pick one or several records of the kinds the app passes in: a search over the
 * app's own loader, a kind filter ("All · Pages · Tables · Tasks"), the reader's recent records
 * while nothing is typed, and a check mark on what is picked. With `browse`, the empty search box
 * shows a folder at a time instead — rows marked `folder` open, a breadcrumb climbs back — while
 * typing still searches everything. As the content of a popover (`RecordPicker`) or as a dialog
 * (`RecordPickerDialog`). It knows no record kinds and no folder structure: both are the app's.
 * ----------------------------------------------------------------------------------------------*/

/** A kind of record the picker offers. */
export interface RecordPickerKind {
  /** Stable id ("page", "table"), passed back to the loader. */
  id: string;
  /** The plural noun on the kind filter and the group heading ("Pages"). */
  noun: string;
  /** The kind's icon, for rows without their own. @default undefined */
  icon?: React.ReactNode;
}

/** One record in the list. */
export interface RecordPickerItem {
  /** The record's id, unique within its kind. */
  id: string;
  /** The `RecordPickerKind.id` it belongs to. */
  kind: string;
  /** The record's title. */
  title: string;
  /** A muted second line: where it lives, its key. @default undefined */
  description?: string;
  /** The row's icon or emoji; the kind's icon when omitted. @default undefined */
  icon?: React.ReactNode;
  /** Why it cannot be picked here — the row shows it and refuses the pick. @default undefined */
  disabledReason?: string;
  /**
   * With `browse`: a folder — choosing the row opens it rather than picking it. Ignored without
   * `browse`.
   * @default false
   */
  folder?: boolean;
}

/** A folder on the breadcrumb: the folder `browse` is asked to list. */
export interface RecordPickerFolder {
  /** The folder's id, as its row carried it. */
  id: string;
  /** The folder's kind, as its row carried it — ids are unique within a kind. */
  kind: string;
  /** The folder's name, on the breadcrumb. */
  title: string;
}

/** What the loader is asked for: a query, the kind filter (`null` = all) and a cursor. */
export interface RecordPickerSearchContext {
  /** The kind filter, or `null` for every kind. */
  kind: string | null;
  /** The cursor of the page to load — `null` for the first. */
  cursor: string | null;
  /** Aborted when a newer request starts. */
  signal: AbortSignal;
}

/** The app's search over its records. */
export type RecordPickerSearch = (
  query: string,
  context: RecordPickerSearchContext,
) => Promise<AsyncSearchPage<RecordPickerItem>>;

/** The app's listing of one folder (`null`: the top), for `browse`. */
export type RecordPickerBrowse = (
  folder: RecordPickerFolder | null,
  context: RecordPickerSearchContext,
) => Promise<AsyncSearchPage<RecordPickerItem>>;

/** A button inside the command root keeps Enter and Space: cmdk would pick the highlighted row. */
function keepKeys(event: React.KeyboardEvent<HTMLElement>) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.click();
}

/** A record's key: `kind:id`. */
export function recordPickerKey(item: Pick<RecordPickerItem, "kind" | "id">) {
  return `${item.kind}:${item.id}`;
}

/** Props accepted by `RecordPicker`. */
export interface RecordPickerProps {
  /** The kinds on offer, in filter order. */
  kinds: readonly RecordPickerKind[];
  /** Loads one page of results for a query and kind — across everything, wherever it lives. */
  search: RecordPickerSearch;
  /**
   * Browse folders: while nothing is typed the list is one folder's contents, loaded a page at a
   * time through this (`null` is the top). Rows marked `folder` open; the breadcrumb, or Backspace
   * in the empty search box, climbs back. Typing searches everything through `search`; a folder
   * found that way opens from the top of the trail. `recents` show at the top only.
   * @default undefined
   */
  browse?: RecordPickerBrowse;
  /**
   * With `browse`: the top of the trail, on the breadcrumb.
   * @default "Home"
   */
  rootLabel?: string;
  /**
   * The kind filter, shown when more than one kind is offered. Pass `false` when the loaders
   * can't narrow by kind.
   * @default true
   */
  kindFilter?: boolean;
  /**
   * Multiple: a "Select all" toggle for the rows on screen that can be picked (folders and
   * refused rows aside).
   * @default false
   */
  selectAll?: boolean;
  /**
   * The reader's recent records, shown while the search box is empty.
   * @default undefined
   */
  recents?: readonly RecordPickerItem[];
  /**
   * Pick several: rows toggle and `onValueChange` reports the whole set; otherwise a pick calls
   * `onPick` and the host closes the picker.
   * @default false
   */
  multiple?: boolean;
  /**
   * Multiple: the picked records, shown checked. Records, not keys, so a pick made earlier
   * survives whatever the current search shows.
   * @default undefined
   */
  value?: readonly RecordPickerItem[];
  /**
   * Multiple: the new set of picked records.
   * @default undefined
   */
  onValueChange?: (items: RecordPickerItem[]) => void;
  /**
   * Single: the record picked.
   * @default undefined
   */
  onPick?: (item: RecordPickerItem) => void;
  /**
   * The kind filter to start on; `null` is all kinds.
   * @default null
   */
  defaultKind?: string | null;
  /** @default "Search…" */
  placeholder?: string;
  /** @default "All" */
  allLabel?: string;
  /** @default "Recent" */
  recentLabel?: string;
  /** @default "No results." */
  emptyLabel?: string;
  /** With `browse`: an open folder with nothing in it. @default "This folder is empty" */
  emptyFolderMessage?: string;
  /** With `browse`: the breadcrumb's accessible name. @default "Folder path" */
  pathLabel?: string;
  /** With `browse`: read after a folder row's title. @default "folder" */
  folderLabel?: string;
  /** With `browse`: announced when a folder opens. @default (title) => `${title}, opened` */
  openedLabel?: (title: string) => string;
  /** With `selectAll`. @default "Select all" */
  selectAllLabel?: string;
  /** @default "Load more" */
  loadMoreLabel?: string;
  /** @default "Try again" */
  retryLabel?: string;
  /** Read after a picked row's title with `multiple`. @default "picked" */
  pickedLabel?: string;
  /** Classes on the command root. @default undefined */
  className?: string;
}

/**
 * `RecordPicker` — one way to pick records: search the app's records through `search`, narrow by
 * kind, start from `recents`, and pick one (`onPick`) or several (`multiple`, `onValueChange`).
 * A record with a `disabledReason` shows why and can't be picked. With `browse` the empty box
 * walks the app's folders. Put it in a `PopoverContent` for a picker in place, or use
 * `RecordPickerDialog`.
 *
 * @example
 * <PopoverContent size="lg" className="p-0">
 *   <RecordPicker
 *     kinds={[{ id: "page", noun: "Pages", icon: <FileText /> }, { id: "table", noun: "Tables", icon: <Table2 /> }]}
 *     search={(q, { kind, cursor, signal }) => api.search({ q, kind, cursor }, { signal })}
 *     recents={recent}
 *     onPick={(item) => link(item)}
 *   />
 * </PopoverContent>
 */
export function RecordPicker({
  kinds,
  search,
  browse,
  rootLabel = "Home",
  kindFilter = true,
  selectAll = false,
  recents,
  multiple = false,
  value,
  onValueChange,
  onPick,
  defaultKind = null,
  placeholder = "Search…",
  allLabel = "All",
  recentLabel = "Recent",
  emptyLabel = "No results.",
  emptyFolderMessage = "This folder is empty",
  pathLabel = "Folder path",
  folderLabel = "folder",
  openedLabel = (title) => `${title}, opened`,
  selectAllLabel = "Select all",
  loadMoreLabel = "Load more",
  retryLabel = "Try again",
  pickedLabel = "picked",
  className,
}: RecordPickerProps) {
  const [kind, setKind] = React.useState<string | null>(defaultKind);
  // The open folders, top first; empty is the top. Only with `browse`.
  const [trail, setTrail] = React.useState<RecordPickerFolder[]>([]);
  const folder = browse ? (trail[trail.length - 1] ?? null) : null;
  const { announce, Announcer } = useAnnouncer();
  const searchRef = React.useRef(search);
  searchRef.current = search;
  const browseRef = React.useRef(browse);
  browseRef.current = browse;
  // Which load produced the rows on screen: the loader records its own query, kind and folder and
  // the rows it returned, so a row is pickable only while it answers what is on screen now.
  const produced = React.useRef<{
    key: string;
    items: WeakSet<RecordPickerItem>;
  }>({
    key: "",
    items: new WeakSet(),
  });
  const folderKey = folder ? recordPickerKey(folder) : "";
  const keyOf = (query: string) =>
    `${kind ?? ""}\u0000${folderKey}\u0000${query}`;
  const results = useAsyncSearch<RecordPickerItem>(
    async (query, context) => {
      const lister = browseRef.current;
      const page =
        lister && query.trim() === ""
          ? await lister(folder, { ...context, kind })
          : await searchRef.current(query, { ...context, kind });
      // A superseded request's late answer is dropped by the hook; it must not claim the rows.
      if (context.signal.aborted) return page;
      const key = keyOf(query);
      if (produced.current.key !== key)
        produced.current = { key, items: new WeakSet() };
      for (const item of page.items) produced.current.items.add(item);
      return page;
    },
    { deps: [kind, folderKey] },
  );
  const picked = React.useMemo(
    () => new Set((value ?? []).map(recordPickerKey)),
    [value],
  );

  // Results belong to the load that produced them: while a newer one is pending (debounce or
  // fetch, or failed), a stale row stays in view but Enter can't pick it.
  const currentKey = keyOf(results.query);
  const answersNow = (item: RecordPickerItem) =>
    produced.current.key === currentKey && produced.current.items.has(item);

  const kindOf = React.useMemo(
    () => new Map(kinds.map((k) => [k.id, k])),
    [kinds],
  );
  const typed = results.query.trim() !== "";
  const browsing = browse !== undefined && !typed;
  const showRecents =
    !typed && trail.length === 0 && (recents?.length ?? 0) > 0;
  const recentRows = showRecents
    ? (recents ?? []).filter((item) => kind === null || item.kind === kind)
    : [];
  const recentKeys = new Set(recentRows.map(recordPickerKey));
  const rows = results.items.filter(
    (item) => !recentKeys.has(recordPickerKey(item)),
  );
  // A folder's contents keep the app's order; search results group by kind.
  const groups = browsing
    ? []
    : kinds
        .map((k) => ({
          kind: k,
          items: rows.filter((item) => item.kind === k.id),
        }))
        .filter((group) => group.items.length > 0);
  const opens = (item: RecordPickerItem) =>
    browse !== undefined && item.folder === true;

  const openFolder = (next: RecordPickerFolder[]) => {
    setTrail(next);
    if (results.query !== "") results.onSearchChange("");
    announce(openedLabel(next[next.length - 1]?.title ?? rootLabel));
  };

  const choose = (item: RecordPickerItem, fromResults: boolean) => {
    if (item.disabledReason) return;
    if (fromResults && !answersNow(item)) return;
    if (opens(item)) {
      // From a search, the trail starts again at the top: the result knows no path.
      openFolder([
        ...(typed ? [] : trail),
        { id: item.id, kind: item.kind, title: item.title },
      ]);
      return;
    }
    if (!multiple) {
      onPick?.(item);
      return;
    }
    const key = recordPickerKey(item);
    const current = value ?? [];
    onValueChange?.(
      picked.has(key)
        ? current.filter((v) => recordPickerKey(v) !== key)
        : [...current, item],
    );
  };

  // "Select all" covers the rows on screen that can be picked: the recents, and the results that
  // answer what is shown now.
  const pickable = multiple
    ? [...recentRows, ...rows.filter(answersNow)].filter(
        (item) => !item.disabledReason && !opens(item),
      )
    : [];
  const allPicked =
    pickable.length > 0 &&
    pickable.every((item) => picked.has(recordPickerKey(item)));
  const toggleAll = () => {
    const keys = new Set(pickable.map(recordPickerKey));
    const kept = (value ?? []).filter((v) => !keys.has(recordPickerKey(v)));
    onValueChange?.(allPicked ? kept : [...kept, ...pickable]);
  };

  const row = (item: RecordPickerItem, fromResults: boolean) => {
    const key = recordPickerKey(item);
    const checked = picked.has(key);
    const folderRow = opens(item);
    return (
      <CommandItem
        key={key}
        value={key}
        disabled={item.disabledReason !== undefined}
        data-checked={checked ? "" : undefined}
        data-folder={folderRow ? "" : undefined}
        onSelect={() => choose(item, fromResults)}
        data-slot="record-picker-item"
      >
        <span
          aria-hidden
          className="flex size-4 shrink-0 items-center justify-center [&_svg:not([class*='size-'])]:size-4"
        >
          {item.icon ?? kindOf.get(item.kind)?.icon}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate">{item.title}</span>
          {item.disabledReason || item.description ? (
            <span className="truncate text-xs text-muted-foreground">
              {item.disabledReason ?? item.description}
            </span>
          ) : null}
        </span>
        {folderRow ? (
          <>
            <span className="sr-only">{folderLabel}</span>
            <ChevronRight
              aria-hidden
              className="ms-auto size-4 rtl:rotate-180"
            />
          </>
        ) : null}
        {multiple && !folderRow && checked ? (
          // cmdk owns `aria-selected` (its highlight), so the pick is read as text.
          <span className="sr-only">{pickedLabel}</span>
        ) : null}
        {multiple && !folderRow ? (
          <Check
            aria-hidden
            className={cn(
              "ms-auto size-4",
              checked ? "opacity-100" : "opacity-0",
            )}
          />
        ) : null}
      </CommandItem>
    );
  };

  const showKinds = kindFilter && kinds.length > 1;
  const showSelectAll = multiple && selectAll;

  return (
    <Command
      shouldFilter={false}
      data-slot="record-picker"
      className={cn("flex flex-col", className)}
    >
      <CommandInput
        value={results.query}
        onValueChange={results.onSearchChange}
        placeholder={placeholder}
        onKeyDown={(event) => {
          // Backspace in an empty box climbs one folder.
          if (
            event.key === "Backspace" &&
            browse !== undefined &&
            results.query === "" &&
            trail.length > 0
          ) {
            event.preventDefault();
            openFolder(trail.slice(0, -1));
          }
        }}
      />
      {showKinds || showSelectAll ? (
        <CommandFilters data-slot="record-picker-kinds">
          {showKinds
            ? [{ id: null as string | null, noun: allLabel }, ...kinds].map(
                (k) => (
                  <Button
                    key={k.id ?? "all"}
                    type="button"
                    size="xs"
                    variant={kind === k.id ? "secondary" : "ghost"}
                    aria-pressed={kind === k.id}
                    onKeyDown={keepKeys}
                    onClick={() => setKind(k.id)}
                  >
                    {k.noun}
                  </Button>
                ),
              )
            : null}
          {showSelectAll ? (
            <Button
              type="button"
              size="xs"
              variant={allPicked ? "secondary" : "ghost"}
              aria-pressed={allPicked}
              disabled={pickable.length === 0}
              data-slot="record-picker-select-all"
              className="ms-auto"
              onKeyDown={keepKeys}
              onClick={toggleAll}
            >
              {selectAllLabel}
            </Button>
          ) : null}
        </CommandFilters>
      ) : null}
      {browsing && trail.length > 0 ? (
        <Breadcrumb
          aria-label={pathLabel}
          data-slot="record-picker-path"
          className="px-1 pt-1.5 pb-0.5"
        >
          <BreadcrumbList className="gap-0.5 sm:gap-0.5">
            {[null, ...trail.slice(0, -1)].map((crumb, index) => (
              <React.Fragment key={crumb ? recordPickerKey(crumb) : "top"}>
                <BreadcrumbItem className="min-w-0">
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    className="max-w-40 font-normal text-muted-foreground"
                    onKeyDown={keepKeys}
                    onClick={() => openFolder(trail.slice(0, index))}
                  >
                    <span className="truncate">
                      {crumb?.title ?? rootLabel}
                    </span>
                  </Button>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </React.Fragment>
            ))}
            <BreadcrumbItem className="min-w-0 px-2">
              <BreadcrumbPage className="block max-w-48 truncate">
                {folder?.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}
      {results.loading && results.items.length === 0 && !showRecents ? (
        <CommandLoading />
      ) : null}
      <CommandList>
        {!results.loading && !results.error ? (
          <CommandEmpty>
            {browsing && trail.length > 0 ? emptyFolderMessage : emptyLabel}
          </CommandEmpty>
        ) : null}
        {recentRows.length > 0 ? (
          <CommandGroup heading={recentLabel}>
            {recentRows.map((item) => row(item, false))}
          </CommandGroup>
        ) : null}
        {browsing && rows.length > 0 ? (
          <CommandGroup data-slot="record-picker-folder">
            {rows.map((item) => row(item, true))}
          </CommandGroup>
        ) : null}
        {groups.map((group) => (
          <CommandGroup key={group.kind.id} heading={group.kind.noun}>
            {group.items.map((item) => row(item, true))}
          </CommandGroup>
        ))}
      </CommandList>
      {results.error || results.loadMore.hasMore ? (
        <div
          data-slot="record-picker-footer"
          role="status"
          className="flex items-center gap-2 border-t border-border p-1.5 text-sm text-muted-foreground"
        >
          {results.error ? (
            <span className="min-w-0 flex-1 px-1.5">{results.error}</span>
          ) : (
            <span className="flex-1" />
          )}
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={results.loadMore.loading}
            onKeyDown={keepKeys}
            onClick={results.loadMore.onLoadMore}
          >
            {results.error ? retryLabel : loadMoreLabel}
          </Button>
        </div>
      ) : null}
      <Announcer />
    </Command>
  );
}

/** Props accepted by `RecordPickerDialog`. */
export interface RecordPickerDialogProps extends RecordPickerProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Called when it opens or closes. */
  onOpenChange: (open: boolean) => void;
  /** The dialog's title ("Link a record"). */
  title: string;
  /**
   * What the dialog is for, read with the title.
   * @default undefined
   */
  description?: string;
  /**
   * Multiple: the confirm button's label, or a function of how many are picked ("Add 3"); the
   * dialog then reports the set with `onConfirm`.
   * @default "Done"
   */
  confirmLabel?: string | ((count: number) => string);
  /**
   * Multiple: a Cancel button before the confirm button, with this label. Esc and the close
   * button cancel either way.
   * @default undefined
   */
  cancelLabel?: string;
  /**
   * Multiple: called with the picked set when the reader confirms. The dialog starts from `value`
   * each time it opens. It closes once this returns — or, for a promise, once it settles; `false`
   * (or a rejection) keeps it open, so the reader can try again. While a promise is pending the
   * confirm button shows it is busy and the dialog doesn't close.
   * @default undefined
   */
  onConfirm?: (
    items: RecordPickerItem[],
  ) => void | boolean | Promise<void | boolean>;
}

/**
 * `RecordPickerDialog` — `RecordPicker` in a dialog. Single: a pick reports `onPick` and closes.
 * Multiple: rows toggle, and the footer's confirm reports the set with `onConfirm` and closes
 * (an async `onConfirm` holds the dialog until it settles; `false` keeps it open). The confirm is
 * off while nothing is picked and nothing was picked before.
 *
 * @example
 * <RecordPickerDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Link a record"
 *   kinds={kinds}
 *   search={search}
 *   onPick={(item) => addRelation(item)}
 * />
 */
export function RecordPickerDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Done",
  cancelLabel,
  onConfirm,
  onPick,
  multiple = false,
  value,
  onValueChange,
  ...props
}: RecordPickerDialogProps) {
  // The set being picked, starting from what was picked before each time the dialog opens; the
  // confirm reports it whole.
  const [draft, setDraft] = React.useState<RecordPickerItem[]>([
    ...(value ?? []),
  ]);
  const [busy, setBusy] = React.useState(false);
  const valueRef = React.useRef(value);
  valueRef.current = value;
  React.useEffect(() => {
    if (open) setDraft([...(valueRef.current ?? [])]);
  }, [open]);
  // While a confirm is pending the picks are frozen: what closes the dialog is what was sent.
  const busyRef = React.useRef(false);
  const confirm = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    let outcome: void | boolean = undefined;
    try {
      outcome = await onConfirm?.(draft);
    } catch {
      outcome = false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
    if (outcome !== false) onOpenChange(false);
  };
  const nothing = draft.length === 0 && (value?.length ?? 0) === 0;
  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && busy) return;
        onOpenChange(next);
      }}
      title={title}
      description={description ?? title}
      size="default"
    >
      <RecordPicker
        {...props}
        multiple={multiple}
        value={draft}
        onValueChange={(items) => {
          if (busyRef.current) return;
          setDraft(items);
          onValueChange?.(items);
        }}
        onPick={(item) => {
          onPick?.(item);
          onOpenChange(false);
        }}
      />
      {multiple ? (
        <DialogFooter
          data-slot="record-picker-dialog-footer"
          className="border-t border-border p-2"
        >
          {cancelLabel ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
          ) : null}
          <Button
            type="button"
            disabled={nothing}
            loading={busy}
            onClick={() => void confirm()}
          >
            {typeof confirmLabel === "function"
              ? confirmLabel(draft.length)
              : confirmLabel}
          </Button>
        </DialogFooter>
      ) : null}
    </CommandDialog>
  );
}
