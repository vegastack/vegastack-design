// @vegastack record-picker@0.25.94 sha256-qw4oq+XYCvHSl/NKgQIO3A1o37e8wsALHOSuXFmpNj0=

"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@vegastack/design";
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
import {
  useAsyncSearch,
  type AsyncSearchPage,
} from "@/components/ui/use-async-search";

/* ------------------------------------------------------------------------------------------------
 * RecordPicker — pick one or several records of the kinds the app passes in: a search over the
 * app's own loader, a kind filter ("All · Pages · Tables · Tasks"), the reader's recent records
 * while nothing is typed, and a check mark on what is picked. As the content of a popover
 * (`RecordPicker`) or as a dialog (`RecordPickerDialog`). It knows no record kinds.
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
  /** Loads one page of results for a query and kind. */
  search: RecordPickerSearch;
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
 * A record with a `disabledReason` shows why and can't be picked. Put it in a `PopoverContent`
 * for a picker in place, or use `RecordPickerDialog`.
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
  loadMoreLabel = "Load more",
  retryLabel = "Try again",
  pickedLabel = "picked",
  className,
}: RecordPickerProps) {
  const [kind, setKind] = React.useState<string | null>(defaultKind);
  const searchRef = React.useRef(search);
  searchRef.current = search;
  // Which search produced the rows on screen: the loader records its own query and kind and the
  // rows it returned, so a row is pickable only while it answers what is typed now.
  const produced = React.useRef<{
    key: string;
    items: WeakSet<RecordPickerItem>;
  }>({
    key: "",
    items: new WeakSet(),
  });
  const results = useAsyncSearch<RecordPickerItem>(
    async (query, context) => {
      const page = await searchRef.current(query, { ...context, kind });
      // A superseded request's late answer is dropped by the hook; it must not claim the rows.
      if (context.signal.aborted) return page;
      const key = `${kind ?? ""}\u0000${query}`;
      if (produced.current.key !== key)
        produced.current = { key, items: new WeakSet() };
      for (const item of page.items) produced.current.items.add(item);
      return page;
    },
    { deps: [kind] },
  );
  const picked = React.useMemo(
    () => new Set((value ?? []).map(recordPickerKey)),
    [value],
  );

  // Results belong to the query that produced them: while a newer query is pending (debounce or
  // fetch, or failed), a stale row stays in view but Enter can't pick it.
  const currentKey = `${kind ?? ""}\u0000${results.query}`;
  const answersNow = (item: RecordPickerItem) =>
    produced.current.key === currentKey && produced.current.items.has(item);

  const kindOf = React.useMemo(
    () => new Map(kinds.map((k) => [k.id, k])),
    [kinds],
  );
  const showRecents = results.query.trim() === "" && (recents?.length ?? 0) > 0;
  const recentRows = showRecents
    ? (recents ?? []).filter((item) => kind === null || item.kind === kind)
    : [];
  const recentKeys = new Set(recentRows.map(recordPickerKey));
  const rows = results.items.filter(
    (item) => !recentKeys.has(recordPickerKey(item)),
  );
  const groups = kinds
    .map((k) => ({ kind: k, items: rows.filter((item) => item.kind === k.id) }))
    .filter((group) => group.items.length > 0);

  const choose = (item: RecordPickerItem, fromResults: boolean) => {
    if (item.disabledReason) return;
    if (fromResults && !answersNow(item)) return;
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

  const row = (item: RecordPickerItem, fromResults: boolean) => {
    const key = recordPickerKey(item);
    const checked = picked.has(key);
    return (
      <CommandItem
        key={key}
        value={key}
        disabled={item.disabledReason !== undefined}
        data-checked={checked ? "" : undefined}
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
        {multiple && checked ? (
          // cmdk owns `aria-selected` (its highlight), so the pick is read as text.
          <span className="sr-only">{pickedLabel}</span>
        ) : null}
        {multiple ? (
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
      />
      {kinds.length > 1 ? (
        <CommandFilters data-slot="record-picker-kinds">
          {[{ id: null as string | null, noun: allLabel }, ...kinds].map(
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
          )}
        </CommandFilters>
      ) : null}
      {results.loading && results.items.length === 0 && !showRecents ? (
        <CommandLoading />
      ) : null}
      <CommandList>
        {!results.loading && !results.error ? (
          <CommandEmpty>{emptyLabel}</CommandEmpty>
        ) : null}
        {recentRows.length > 0 ? (
          <CommandGroup heading={recentLabel}>
            {recentRows.map((item) => row(item, false))}
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
   * Multiple: the confirm button's label; the dialog then reports the set with `onConfirm`.
   * @default "Done"
   */
  confirmLabel?: string;
  /**
   * Multiple: called with the picked set when the reader confirms. The dialog starts from `value`
   * each time it opens.
   * @default undefined
   */
  onConfirm?: (items: RecordPickerItem[]) => void;
}

/**
 * `RecordPickerDialog` — `RecordPicker` in a dialog. Single: a pick reports `onPick` and closes.
 * Multiple: rows toggle, and the footer's confirm reports the set with `onConfirm` and closes.
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
  onConfirm,
  onPick,
  multiple = false,
  value,
  onValueChange,
  ...props
}: RecordPickerDialogProps) {
  // The set being picked, starting from what was picked before each time the dialog opens; Done
  // reports it whole.
  const [draft, setDraft] = React.useState<RecordPickerItem[]>([
    ...(value ?? []),
  ]);
  const valueRef = React.useRef(value);
  valueRef.current = value;
  React.useEffect(() => {
    if (open) setDraft([...(valueRef.current ?? [])]);
  }, [open]);
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description ?? title}
      size="default"
    >
      <RecordPicker
        {...props}
        multiple={multiple}
        value={draft}
        onValueChange={(items) => {
          setDraft(items);
          onValueChange?.(items);
        }}
        onPick={(item) => {
          onPick?.(item);
          onOpenChange(false);
        }}
      />
      {multiple ? (
        <DialogFooter className="border-t border-border p-2">
          <Button
            type="button"
            onClick={() => {
              onConfirm?.(draft);
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      ) : null}
    </CommandDialog>
  );
}
