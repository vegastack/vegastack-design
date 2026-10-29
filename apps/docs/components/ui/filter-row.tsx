// @vegastack filter-row@0.25.102 sha256-UxWZ68v5sXFJUvG1fpW8LI8wiNoi5GY0XUEIDchHKHo=

"use client";

import * as React from "react";
import { ChevronDown, Plus, Search, Sparkles, X } from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  SearchableSelect,
  type SearchableSelectProps,
} from "@/components/ui/searchable-select";
import {
  PeoplePickerContent,
  type PeoplePickerListProps,
  type PeoplePickerOption,
  type PeoplePickerValue,
} from "@/components/ui/people-picker";
import { useListToolbar } from "@/components/ui/list-toolbar";
import { formatDateRange } from "@/lib/date-time";

/* ---
`FilterRow` is the row of filters under a `ListToolbar`, opened by its Filter tool. Its order never
changes, so chips never jump: `+ Filter` first, then the page's pinned facets (dashed while unset),
then the other chips in the order they were added, and `Clear` at the far end while anything is
set. Chips an AI filter made carry a ✦ until edited, and a line under the row says what the AI did
— with Undo, and the words it could not match. On a wide row the chips wrap; on a narrow one they
scroll sideways in one line, `+ Filter` and `Clear` pinned at its two ends.
--- */

/** One applied filter, as a chip. */
export interface FilterRowChip {
  /** Stable id. */
  id: string;
  /** The filter's name ("Priority"). */
  label: React.ReactNode;
  /**
   * The value summary ("High").
   * @default undefined
   */
  value?: React.ReactNode;
  /**
   * A leading icon.
   * @default undefined
   */
  icon?: React.ReactNode;
  /**
   * `ai` when an AI filter made it (a ✦ until it is edited).
   * @default "user"
   */
  source?: "ai" | "user";
  /**
   * The editor that opens from the chip (a value picker).
   * @default undefined
   */
  editor?: React.ReactNode;
  /**
   * Open the editor as the chip mounts — a filter just picked from + Filter.
   * @default false
   */
  defaultEditorOpen?: boolean;
  /** Remove the filter. */
  onRemove: () => void;
}

/** What an AI filter run did, for the line under the row. */
export interface FilterRowAiNote {
  /** How many filters it added. */
  count: number;
  /**
   * The words it could not turn into a filter — listed, never guessed.
   * @default []
   */
  unmatched?: readonly string[];
  /** Remove exactly the filters that run added. */
  onUndo: () => void;
  /**
   * Hide the line (the next manual change does it too — the host decides).
   * @default undefined
   */
  onDismiss?: () => void;
}

/** The words `FilterRow` shows. */
export interface FilterRowLabels {
  /** The row's accessible name. */
  filters: string;
  /** The clear-everything action. */
  clear: string;
  /** "2 filters added by AI". */
  aiAdded: (count: number) => string;
  /** The AI note's undo action. */
  undo: string;
  /** "Couldn't match “warehouse”". */
  unmatched: (terms: readonly string[]) => string;
  /** The AI note's dismiss button. */
  dismiss: string;
}

const DEFAULT_LABELS: FilterRowLabels = {
  filters: "Filters",
  clear: "Clear",
  aiAdded: (count) =>
    `${count} ${count === 1 ? "filter" : "filters"} added by AI`,
  undo: "Undo",
  unmatched: (terms) =>
    `Couldn't match ${terms.map((term) => `“${term}”`).join(", ")}`,
  dismiss: "Dismiss",
};

/** Props accepted by `FilterRow`. */
export interface FilterRowProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /**
   * `+ Filter` — an `AddFilterMenu`. Always first.
   * @default undefined
   */
  addFilter?: React.ReactNode;
  /**
   * The page's pinned facets, in its order: `ListFacet`, `PeopleFacet`,
   * `DateRangeFilter`, or an `unset` `FilterChip` that opens its own editor.
   * @default undefined
   */
  facets?: React.ReactNode;
  /**
   * The other applied filters, in the order they were added.
   * @default []
   */
  chips?: readonly FilterRowChip[];
  /**
   * The line under the row after an AI filter run.
   * @default undefined
   */
  aiNote?: FilterRowAiNote;
  /**
   * Clear every filter; `Clear` shows while anything is set.
   * @default undefined
   */
  onClear?: () => void;
  /**
   * The number of filters applied. Omitted, the row counts its chips and its set facets (and
   * tells the enclosing `ListToolbar`, whose Filter tool shows it).
   * @default undefined
   */
  activeCount?: number;
  /**
   * The component's words.
   * @default English
   */
  labels?: Partial<FilterRowLabels>;
}

/**
 * `FilterRow` — the filter chips under a `ListToolbar`: `+ Filter`, the pinned facets, the other
 * chips, `Clear`; then, after an AI run, one line saying what it added, with Undo and the words it
 * could not match. Wraps on a wide row; scrolls sideways in one line on a narrow one. Counts what
 * is applied and reports it to the toolbar's Filter tool. Put it in `ListToolbar`'s `filterRow`.
 *
 * @example
 * <FilterRow
 *   addFilter={<AddFilterMenu fields={fields} onPick={addFilter} ai={ai} />}
 *   facets={<ListFacet label="Status" items={statuses} value={status} onValueChange={setStatus} />}
 *   chips={chips}
 *   aiNote={note}
 *   onClear={clearAll}
 * />
 */
export function FilterRow({
  addFilter,
  facets,
  chips = [],
  aiNote,
  onClear,
  activeCount: activeCountProp,
  labels: labelsProp,
  className,
  ...props
}: FilterRowProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const toolbar = useListToolbar();

  // Facets report whether they are set; a label counts once however many copies render.
  const [facetState, setFacetState] = React.useState<
    Record<string, { label: string; active: boolean }>
  >({});
  const report = React.useCallback<FilterFacetReport["report"]>(
    (id, label, active) =>
      setFacetState((prev) => {
        if (active == null) {
          if (!(id in prev)) return prev;
          const next = { ...prev };
          delete next[id];
          return next;
        }
        const current = prev[id];
        if (current?.label === label && current.active === active) return prev;
        return { ...prev, [id]: { label, active } };
      }),
    [],
  );
  const reporter = React.useMemo(() => ({ report }), [report]);
  const activeFacets = new Set(
    Object.values(facetState)
      .filter((entry) => entry.active)
      .map((entry) => entry.label),
  ).size;
  const activeCount = activeCountProp ?? activeFacets + chips.length;

  const reportCount = toolbar?.reportFilterCount;
  React.useEffect(() => {
    reportCount?.(activeCount);
  }, [reportCount, activeCount]);
  React.useEffect(() => () => reportCount?.(null), [reportCount]);

  const rowRef = React.useRef<HTMLDivElement>(null);
  const showClear = onClear != null && activeCount > 0;
  const clear = () => {
    onClear?.();
    // Clear unmounts once nothing is set: hand focus to the row's first control.
    rowRef.current
      ?.querySelector<HTMLElement>("button:not([disabled])")
      ?.focus();
  };

  return (
    <div
      data-slot="filter-row"
      className={cn(
        "@container/filter-row flex w-full min-w-0 flex-col gap-1",
        className,
      )}
      {...props}
    >
      <div
        ref={rowRef}
        role="group"
        aria-label={labels.filters}
        data-slot="filter-row-chips"
        className="flex w-full min-w-0 items-start gap-1.5"
      >
        {addFilter != null ? (
          <div
            data-slot="filter-row-add"
            className="flex shrink-0 items-center"
          >
            {addFilter}
          </div>
        ) : null}
        <FilterFacetReporter value={reporter}>
          <div
            data-slot="filter-row-scroll"
            // One sideways-scrolling line on a narrow row; wraps from @3xl.
            className="flex min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-x-auto overscroll-x-contain scroll-fade-x scrollbar-none @3xl/filter-row:flex-wrap @3xl/filter-row:overflow-visible"
          >
            {facets}
            {chips.map((chip) => (
              <FilterChip
                key={chip.id}
                data-filter-id={chip.id}
                label={chip.label}
                value={chip.value}
                icon={chip.icon}
                ai={chip.source === "ai"}
                editor={chip.editor}
                defaultEditorOpen={chip.defaultEditorOpen}
                onRemove={chip.onRemove}
              />
            ))}
          </div>
        </FilterFacetReporter>
        {showClear ? (
          <Button
            variant="ghost"
            size="sm"
            data-slot="filter-row-clear"
            className="shrink-0 font-normal text-muted-foreground"
            onClick={clear}
          >
            {labels.clear}
          </Button>
        ) : null}
      </div>
      {aiNote != null ? (
        <div
          role="status"
          data-slot="filter-row-ai-note"
          className="flex min-h-5 min-w-0 flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground"
        >
          <Sparkles aria-hidden className="size-3.5 shrink-0" />
          <span>{labels.aiAdded(aiNote.count)}</span>
          <span aria-hidden>·</span>
          <Button
            variant="link"
            size="xs"
            data-slot="filter-row-ai-undo"
            className="h-6 px-0 text-xs text-foreground"
            onClick={aiNote.onUndo}
          >
            {labels.undo}
          </Button>
          {aiNote.unmatched && aiNote.unmatched.length > 0 ? (
            <>
              <span aria-hidden>·</span>
              <span data-slot="filter-row-ai-unmatched">
                {labels.unmatched(aiNote.unmatched)}
              </span>
            </>
          ) : null}
          {aiNote.onDismiss ? (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={labels.dismiss}
              data-slot="filter-row-ai-dismiss"
              className="ms-auto size-6"
              onClick={aiNote.onDismiss}
            >
              <X aria-hidden />
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The calendar engine (`react-day-picker` + `date-fns`) is only needed for a date filter's custom
 * range, so it loads lazily: fetched when the date filter is hovered, focused or opened, rendered
 * when "Custom range" is chosen. A filter row never ships it in the page's first bundle.
 */
let calendarLoad:
  Promise<typeof import("@/components/ui/calendar")> | undefined;
function loadCalendar() {
  calendarLoad ??= import("@/components/ui/calendar").catch(
    (error: unknown) => {
      calendarLoad = undefined;
      throw error;
    },
  );
  return calendarLoad;
}
function prefetchCalendar() {
  void loadCalendar().catch(() => {});
}
const Calendar = React.lazy(() =>
  loadCalendar().then((module) => ({ default: module.Calendar })),
);

/* ------------------------------------------------------------------------------------------------
 * Types
 * ----------------------------------------------------------------------------------------------*/

/**
 * A single applied filter, shown as a removable `FilterChip`.
 * Purely descriptive — the row renders it and reports removals; the host owns
 * the underlying filter state.
 */
export interface ListFilter {
  /** Stable identity for the chip (used as the React key and `data-filter-id`). */
  id: string;
  /**
   * The filter's name in sentence case (e.g. `"Status"`). Rendered as the muted leading text
   * of the chip.
   */
  label: React.ReactNode;
  /**
   * Optional human-readable value summary (e.g. `"In Progress"` or
   * `"2 selected"`). Rendered after `label`, separated by a colon. Omit for a
   * presence-only filter.
   */
  value?: React.ReactNode;
  /** Optional leading icon — a single `lucide-react` / `@vegastack/design/icons` element. */
  icon?: React.ReactNode;
  /** Invoked when the chip's remove (`×`) control is activated. */
  onRemove: () => void;
  /**
   * Edit the filter in place: the chip's label and value become a button that opens this
   * content in a popover (a facet list, a date range, a number range). The remove control
   * stays its own target.
   * @default undefined
   */
  editor?: React.ReactNode;
  /**
   * Whether the chip reads as an active selection (the `accent` selected fill).
   * An applied filter is a selection, so this defaults to `true`; set `false`
   * for a presence-only chip on the rest fill.
   * @default true
   */
  active?: boolean;
}

/* ------------------------------------------------------------------------------------------------
 * FilterChip — a removable filter pill (label + value + remove control)
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `FilterChip`. */
export interface FilterChipProps extends Omit<
  React.ComponentPropsWithRef<"span">,
  "onRemove" | "children"
> {
  /** The filter's name (muted leading text). */
  label: React.ReactNode;
  /** Optional value summary, rendered after `label` separated by a colon.
   * @default undefined
   */
  value?: React.ReactNode;
  /** Optional leading icon.
   * @default undefined
   */
  icon?: React.ReactNode;
  /**
   * Invoked when the remove (`×`) control is activated. An `unset` chip has none.
   * @default undefined
   */
  onRemove?: () => void;
  /**
   * Accessible name for the remove control. Defaults to `Clear <label>` when `label` is a
   * string.
   * @default undefined
   */
  removeLabel?: string;
  /**
   * Whether the chip reads as an active selection. An active chip takes
   * `accent`; an inactive chip keeps the rest fill (`muted`).
   * @default true
   */
  active?: boolean;
  /**
   * Content opened from the chip's label and value, which become a button (`FilterChipTrigger`).
   * @default undefined
   */
  editor?: React.ReactNode;
  /**
   * Called when the editor opens or closes.
   * @default undefined
   */
  onEditorOpenChange?: (open: boolean) => void;
  /**
   * Open the editor when the chip mounts — a filter just added from "More".
   * @default false
   */
  defaultEditorOpen?: boolean;
  /**
   * Made by an AI filter: a ✦ leads the chip until the filter is edited (the host clears it).
   * @default false
   */
  ai?: boolean;
  /**
   * A pinned facet with no value yet: a dashed `+ Label` offer instead of a value, with no ×.
   * Its `editor` opens from it.
   * @default false
   */
  unset?: boolean;
}

/** The chip's "Label: value" text, shared by the plain chip and its editor trigger. */
function FilterChipText({
  label,
  value,
}: {
  label: React.ReactNode;
  value?: React.ReactNode;
}) {
  return (
    <>
      {value != null ? (
        // "Label: value" — the colon joins the pair in the accessible name, and the trailing
        // space (collapsed at the end of the flex item) keeps the text reading "Status: Open".
        <span className="shrink-0 text-muted-foreground">
          <span className="text-muted-foreground">{label}</span>:{" "}
        </span>
      ) : (
        <span className="shrink-0 text-muted-foreground">{label}</span>
      )}
      {value != null ? <span className="min-w-0 truncate">{value}</span> : null}
    </>
  );
}

/**
 * `FilterChip` — a single removable filter pill: a `label`, an optional `value`
 * after a colon, and a trailing `×` control that fires `onRemove`. The {@link Chip}
 * primitive in the filter row's one chip shape — compact (h-7), rounded-md, quiet type — the
 * same shape as a {@link ListFacet}. An applied filter is a selection, so it carries the
 * tinted fill by default; pass `active={false}` for a plain presence chip.
 * Purely presentational; `FilterRow` renders one per applied filter.
 *
 * @example
 * <FilterChip label="Status" value="Active" onRemove={clearStatus} />
 */
export function FilterChip({
  className,
  label,
  value,
  icon,
  onRemove,
  removeLabel,
  active = true,
  editor,
  onEditorOpenChange,
  defaultEditorOpen = false,
  ai = false,
  unset = false,
  ...props
}: FilterChipProps) {
  const computedRemoveLabel =
    removeLabel ??
    (typeof label === "string" ? `Clear ${label}` : "Clear filter");

  return (
    <Chip
      data-slot="filter-chip"
      data-source={ai ? "ai" : undefined}
      data-state={unset ? "unset" : undefined}
      size="sm"
      active={unset ? false : active}
      onRemove={unset ? undefined : onRemove}
      removeLabel={computedRemoveLabel}
      // The filter row's one chip shape: compact (h-7), rounded-md, quiet type — set or unset. An
      // unset pinned facet is the same box, dashed and clear: an offer, not a value.
      className={cn(
        "max-w-xs rounded-md text-sm font-normal [&_[data-slot=chip-remove]]:rounded-sm",
        unset &&
          "border border-dashed border-border bg-transparent text-muted-foreground hover:bg-muted",
        className,
      )}
      {...props}
    >
      {ai ? (
        <Sparkles
          aria-label="Added by AI"
          data-slot="filter-chip-ai"
          className="size-3.5 shrink-0 text-muted-foreground"
        />
      ) : null}
      {unset ? (
        <Plus aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
      ) : null}
      {/* The icon + label stay muted in BOTH states so the label/value hierarchy
          (muted key, emphasized value) survives activation — the active state is
          carried by the chip's own fill, not by flattening the text tiers. */}
      {icon != null ? (
        <span className="shrink-0 text-muted-foreground">{icon}</span>
      ) : null}
      {editor != null ? (
        <Popover
          defaultOpen={defaultEditorOpen}
          onOpenChange={(open) => onEditorOpenChange?.(open)}
        >
          <PopoverTrigger
            data-slot="filter-chip-trigger"
            className="-my-0.5 -ms-1 inline-flex min-w-0 items-center rounded-sm px-1 py-0.5 text-start hover:bg-foreground/5"
          >
            <FilterChipText label={label} value={value} />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto min-w-56">
            {editor}
          </PopoverContent>
        </Popover>
      ) : (
        <FilterChipText label={label} value={value} />
      )}
    </Chip>
  );
}

/**
 * What the row shares with the facets inside it: each facet reports whether it holds a value, so
 * the row can count applied filters for Clear and the Filter tool without the host doing it. A
 * facet can render more than once, so reports are per instance and the count is per label.
 */
interface FilterFacetContextValue {
  report: (id: string, label: string, active: boolean | null) => void;
}

const FilterFacetContext = React.createContext<FilterFacetContextValue | null>(
  null,
);

/** What a filter row shares with the facets inside it (see `FilterFacetReporter`). */
export interface FilterFacetReport {
  /** A facet reports its label and whether it holds a value (`null` when it unmounts). */
  report: (id: string, label: string, active: boolean | null) => void;
}

/**
 * `FilterFacetReporter` — the channel through which `ListFacet`, `PeopleFacet` and
 * `DateRangeFilter` tell the row they sit in whether they are set, so the row can count applied
 * filters for Clear and the Filter tool without the host doing it. `FilterRow`
 * provides it; a host never needs to.
 *
 * @example
 * <FilterFacetReporter value={{ report }}>{facets}</FilterFacetReporter>
 */
export function FilterFacetReporter({
  value,
  children,
}: {
  value: FilterFacetReport;
  children: React.ReactNode;
}) {
  return (
    <FilterFacetContext.Provider value={value}>
      {children}
    </FilterFacetContext.Provider>
  );
}

/* ------------------------------------------------------------------------------------------------
 * ListFacet
 * ----------------------------------------------------------------------------------------------*/

/** `ListFacet`'s own props, on top of the `SearchableSelect` props it passes through. */
export interface ListFacetOwnProps<Item> {
  /**
   * The facet's name, in sentence case ("Status", "Due date"). An unset facet reads just this;
   * a set one reads "{label}: {value}".
   */
  label: string;
  /**
   * Renders one option. Not used with the person contract (`itemToSecondaryLabel` /
   * `itemToAvatar`), which draws avatar, name and email once; passing both warns in development.
   * @default itemToStringLabel
   */
  renderItem?: (item: Item) => React.ReactNode;
  /**
   * A secondary facet added from "More": clearing it also calls `onRemove`, and while it is unset
   * a remove control sits beside it.
   * @default false
   */
  removable?: boolean;
  /**
   * Called when a `removable` facet is removed or cleared.
   * @default undefined
   */
  onRemove?: () => void;
  /**
   * Accessible name of the remove control beside an unset `removable` facet.
   * @default `Remove ${label} filter`
   */
  removeLabel?: string;
  /**
   * List the selected options first, under "Selected", above the rest under "More".
   * @default false
   */
  pinSelected?: boolean;
  /**
   * The heading of the pinned group.
   * @default "Selected"
   */
  selectedGroupLabel?: string;
  /**
   * The heading of the group under the pinned one.
   * @default "More"
   */
  moreGroupLabel?: string;
  /**
   * @deprecated An unset facet reads just its label. Accepted and ignored.
   * @default undefined
   */
  anyLabel?: string;
  /**
   * Show the search box in the panel. Unset, it shows only when the list is worth searching: more
   * than 7 options, or a `remote` (server-searched) list. Pass `true` or `false` to override.
   * @default undefined
   */
  searchable?: boolean;
}

/** Options at or below this count show no search box on a `ListFacet` (unless `searchable` says otherwise). */
const FACET_SEARCH_THRESHOLD = 7;

/** Props accepted by `ListFacet`: `SearchableSelect`'s, minus the trigger face it owns. */
export type ListFacetProps<
  Item,
  Multiple extends boolean | undefined = false,
> = Omit<
  SearchableSelectProps<Item, Multiple>,
  | "renderItem"
  | "renderValue"
  | "renderTriggerValue"
  | "placeholder"
  | "variant"
  | "size"
  | "aria-label"
  | "groupBy"
  | "groupOrder"
> &
  ListFacetOwnProps<Item>;

/**
 * `ListFacet` — one filter on `SearchableSelect`, as a compact rounded-md chip (h-7). Unset,
 * it is quiet and reads its label ("Status ▾"). Set, the same chip is tinted: "Status: Open", then
 * "Status: 2" from two values (the values on hover and ticked in the popover), with a × in the
 * chevron's fixed slot that clears it ("Clear Status"). Single or `multiple`, local or
 * server-searched (`remote` + `useAsyncSearch`; the tick matches by `itemToKey`), optionally pinned
 * and removable. For people, pass `itemToSecondaryLabel={(p) => p.email}`: each option reads the
 * name plus a smaller muted email, and search matches both; add `itemToAvatar` to lead each option
 * with the person's `PersonAvatar`. Put it in a
 * `FilterRow`'s `facets` slot.
 *
 * @example
 * <ListFacet
 *   label="Status"
 *   multiple
 *   items={statuses}
 *   value={status}
 *   onValueChange={setStatus}
 *   itemToKey={(s) => s.id}
 *   itemToStringLabel={(s) => s.name}
 *   searchLabel="Search statuses"
 * />
 */
export function ListFacet<Item, Multiple extends boolean | undefined = false>({
  label,
  renderItem,
  removable = false,
  onRemove,
  removeLabel = `Remove ${label} filter`,
  pinSelected = false,
  selectedGroupLabel = "Selected",
  moreGroupLabel = "More",
  anyLabel: _anyLabel,
  countLabel,
  clearable: _clearable,
  clearLabel = `Clear ${label}`,
  searchable,
  searchPlaceholder = `Search ${label.toLowerCase()}`,
  searchLabel = `Search ${label.toLowerCase()}`,
  emptyMessage = "No matches",
  ref,
  ...select
}: ListFacetProps<Item, Multiple>) {
  const { itemToStringLabel, itemToKey, onOpenChange, onValueChange } = select;
  const current = select.value as Item | Item[] | null | undefined;
  const selectedKeys = new Set(
    (Array.isArray(current) ? current : current ? [current] : []).map(
      itemToKey,
    ),
  );
  const hasValue = selectedKeys.size > 0;

  const row = React.useContext(FilterFacetContext);
  const id = React.useId();
  React.useEffect(() => {
    row?.report(id, label, hasValue);
  }, [row, id, label, hasValue]);
  React.useEffect(() => () => row?.report(id, label, null), [row, id, label]);

  const [trigger, setTrigger] = React.useState<HTMLButtonElement | null>(null);
  const triggerRef = React.useMemo(() => mergeRefs(setTrigger, ref), [ref]);

  // The pinned split is taken when the list opens, so toggling a row does not move it between
  // "Selected" and "More" under the pointer; the next open re-pins.
  const [pinnedKeys, setPinnedKeys] = React.useState(selectedKeys);
  const pinned = (item: Item) => pinnedKeys.has(itemToKey(item));
  // One value reads "Status: Open"; several read "Status: 2", with the values on hover (the
  // chip's `title`) and ticked in the popover.
  const text = (list: Item[]) =>
    list.length === 0
      ? label
      : list.length > 1
        ? `${label}: ${countLabel ? countLabel(list.length) : list.length}`
        : `${label}: ${itemToStringLabel(list[0]!)}`;
  const selectedList = Array.isArray(current)
    ? current
    : current
      ? [current]
      : [];

  const clear = () => {
    // The × unmounts with the value; hand focus to the trigger first (DS-22).
    trigger?.focus();
    onValueChange?.(
      (select.multiple ? [] : null) as Parameters<
        NonNullable<typeof onValueChange>
      >[0],
    );
    if (removable) onRemove?.();
  };

  return (
    <span
      data-slot="list-facet"
      data-state={hasValue ? "set" : "unset"}
      title={
        selectedList.length > 1
          ? selectedList.map(itemToStringLabel).join(", ")
          : undefined
      }
      className="inline-flex min-w-0 shrink-0 items-center gap-0.5"
    >
      <span className="relative inline-flex min-w-0">
        <SearchableSelect<Item, Multiple>
          {...select}
          ref={triggerRef}
          onOpenChange={(open) => {
            if (open) setPinnedKeys(selectedKeys);
            onOpenChange?.(open);
          }}
          items={
            pinSelected
              ? [
                  ...select.items.filter(pinned),
                  ...select.items.filter((i) => !pinned(i)),
                ]
              : select.items
          }
          variant="ghost"
          // The filter row's compact chip tier (h-7).
          size="sm"
          countLabel={countLabel}
          placeholder={label}
          searchable={
            searchable ??
            (Boolean(select.remote) ||
              Boolean(select.loadMore) ||
              select.items.length + (select.leadingItems?.length ?? 0) >
                FACET_SEARCH_THRESHOLD)
          }
          searchPlaceholder={searchPlaceholder}
          searchLabel={searchLabel}
          emptyMessage={emptyMessage}
          renderItem={renderItem}
          renderTriggerValue={text}
          groupBy={
            pinSelected
              ? (item: Item) =>
                  pinned(item) ? selectedGroupLabel : moreGroupLabel
              : undefined
          }
          // A leading item outside the selection must not put "More" above "Selected".
          groupOrder={pinSelected ? [selectedGroupLabel] : undefined}
          // The select's own chevron gives way to the facet's ▾ or ×.
          containerClassName="w-fit [&>svg]:hidden"
          // ONE chip shape for unset and set (rounded-md, h-7, the same border box and the
          // same 28px trailing reserve); a set chip is tinted, never reshaped.
          className={cn(
            "h-7 w-auto max-w-64 rounded-md border-border ps-2 pe-7 text-sm font-normal hover:border-border focus:border-border aria-expanded:border-border",
            hasValue
              ? "bg-accent text-foreground hover:bg-accent/80 aria-expanded:bg-accent dark:bg-accent dark:hover:bg-accent/80"
              : "border-dashed bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-transparent dark:hover:bg-muted",
          )}
          contentClassName="min-w-56"
          data-slot="list-facet-select"
        />
        {hasValue ? (
          // The × holds the chevron's exact box (24px, `end-0.5`), so nothing shifts when a
          // value is set; its 24px box is the whole hit area.
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={clearLabel}
            data-slot="list-facet-clear"
            className="absolute inset-y-0 end-0.5 my-auto size-6 rounded-sm text-muted-foreground hover:bg-foreground/10 hover:text-foreground active:not-aria-[haspopup]:translate-y-0"
            disabled={select.disabled}
            onClick={() => {
              if (!select.disabled) clear();
            }}
          >
            <X aria-hidden className="size-3.5" />
          </Button>
        ) : (
          <span
            aria-hidden
            className="pointer-events-none absolute end-0.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center text-muted-foreground"
          >
            <ChevronDown className="size-3.5" />
          </span>
        )}
      </span>
      {removable && !hasValue ? (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={removeLabel}
          data-slot="list-facet-remove"
          className="active:not-aria-[haspopup]:translate-y-0"
          disabled={select.disabled}
          onClick={() => {
            if (!select.disabled) onRemove?.();
          }}
        >
          <X aria-hidden />
        </Button>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------------------------------------------
 * PeopleFacet
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `PeopleFacet`. */
export interface PeopleFacetProps<
  Multiple extends boolean | undefined = false,
> extends PeoplePickerListProps {
  /** The facet's name, in sentence case ("Assignee", "Recorded by"). */
  label: string;
  /** Filter by several people. @default false */
  multiple?: Multiple;
  /** The chosen person — or people, with `multiple` (controlled). */
  value: PeoplePickerValue<Multiple>;
  /** Called with the new choice (`null`, or `[]` with `multiple`, when cleared). */
  onValueChange: (value: PeoplePickerValue<Multiple>) => void;
  /** Called when the popover opens or closes — start a remote search on the first open. @default undefined */
  onOpenChange?: (open: boolean) => void;
  /** A secondary facet added from "More": clearing it also calls `onRemove`. @default false */
  removable?: boolean;
  /** Called when a `removable` facet is removed or cleared. @default undefined */
  onRemove?: () => void;
  /** The remove control's accessible name. @default `Remove ${label} filter` */
  removeLabel?: string;
  /** The clear control's accessible name. @default `Clear ${label}` */
  clearLabel?: string;
  /** The chip's count for several people. @default (n) => String(n) */
  countLabel?: (n: number) => string;
  /** Disable the facet. @default false */
  disabled?: boolean;
}

/**
 * `PeopleFacet` — a people filter in a `FilterRow`: the facet chip ("Assignee",
 * "Assignee: Asha Rao", "Assignee: 2") over the one people picker (`PeoplePickerContent`), so a
 * filter lists people exactly as every other picker does — avatar, name, email, "(you)", only
 * active people, skeleton rows while loading. `leadingOptions` adds rows such as "Unassigned".
 *
 * @example
 * <PeopleFacet label="Assignee" multiple value={assignees} onValueChange={setAssignees} search={searchMembers} />
 */
export function PeopleFacet<Multiple extends boolean | undefined = false>({
  label,
  multiple,
  value,
  onValueChange,
  onOpenChange,
  removable = false,
  onRemove,
  removeLabel = `Remove ${label} filter`,
  clearLabel = `Clear ${label}`,
  countLabel,
  disabled = false,
  searchPlaceholder = `Search ${label.toLowerCase()}`,
  ...list
}: PeopleFacetProps<Multiple>) {
  const chosen: PeoplePickerOption[] = Array.isArray(value)
    ? value
    : value
      ? [value as PeoplePickerOption]
      : [];
  const hasValue = chosen.length > 0;
  const [open, setOpen] = React.useState(false);
  const [pinned, setPinned] = React.useState<PeoplePickerOption[]>([]);
  const [trigger, setTrigger] = React.useState<HTMLButtonElement | null>(null);

  const row = React.useContext(FilterFacetContext);
  const id = React.useId();
  React.useEffect(() => {
    row?.report(id, label, hasValue);
  }, [row, id, label, hasValue]);
  React.useEffect(() => () => row?.report(id, label, null), [row, id, label]);

  const text =
    chosen.length === 0
      ? label
      : chosen.length > 1
        ? `${label}: ${countLabel ? countLabel(chosen.length) : chosen.length}`
        : `${label}: ${chosen[0]!.name}`;
  const pick = (option: PeoplePickerOption) => {
    if (multiple) {
      const has = chosen.some((o) => o.id === option.id);
      onValueChange(
        (has
          ? chosen.filter((o) => o.id !== option.id)
          : [...chosen, option]) as PeoplePickerValue<Multiple>,
      );
      return;
    }
    setOpen(false);
    onOpenChange?.(false);
    const same = chosen[0]?.id === option.id;
    onValueChange((same ? null : option) as PeoplePickerValue<Multiple>);
  };
  const clear = () => {
    trigger?.focus();
    onValueChange((multiple ? [] : null) as PeoplePickerValue<Multiple>);
    if (removable) onRemove?.();
  };

  return (
    <span
      data-slot="list-facet"
      data-state={hasValue ? "set" : "unset"}
      title={
        chosen.length > 1 ? chosen.map((o) => o.name).join(", ") : undefined
      }
      className="inline-flex min-w-0 shrink-0 items-center gap-0.5"
    >
      <span className="relative inline-flex min-w-0">
        <Popover
          open={open}
          onOpenChange={(next) => {
            if (next) setPinned(chosen);
            setOpen(next);
            onOpenChange?.(next);
          }}
        >
          <PopoverTrigger
            disabled={disabled}
            render={
              <Button
                ref={setTrigger}
                variant="outline"
                size="sm"
                data-slot="list-facet-select-trigger"
                data-placeholder={hasValue ? undefined : ""}
                className={cn(
                  "h-7 w-auto max-w-64 justify-start rounded-md border-border ps-2 pe-7 text-sm font-normal hover:border-border aria-expanded:border-border",
                  hasValue
                    ? "bg-accent text-foreground hover:bg-accent/80 aria-expanded:bg-accent dark:bg-accent dark:hover:bg-accent/80"
                    : "border-dashed bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-transparent dark:hover:bg-muted",
                )}
              />
            }
          >
            <span className="min-w-0 truncate">{text}</span>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 gap-0 p-0">
            <PeoplePickerContent
              {...list}
              searchPlaceholder={searchPlaceholder}
              pinned={multiple ? pinned : []}
              selected={chosen.map((o) => o.id)}
              onSelect={pick}
            />
          </PopoverContent>
        </Popover>
        {hasValue ? (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={clearLabel}
            data-slot="list-facet-clear"
            className="absolute inset-y-0 end-0.5 my-auto size-6 rounded-sm text-muted-foreground hover:bg-foreground/10 hover:text-foreground active:not-aria-[haspopup]:translate-y-0"
            disabled={disabled}
            onClick={() => {
              if (!disabled) clear();
            }}
          >
            <X aria-hidden className="size-3.5" />
          </Button>
        ) : (
          <span
            aria-hidden
            className="pointer-events-none absolute end-0.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center text-muted-foreground"
          >
            <ChevronDown className="size-3.5" />
          </span>
        )}
      </span>
      {removable && !hasValue ? (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={removeLabel}
          data-slot="list-facet-remove"
          className="active:not-aria-[haspopup]:translate-y-0"
          disabled={disabled}
          onClick={() => {
            if (!disabled) onRemove?.();
          }}
        >
          <X aria-hidden />
        </Button>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------------------------------------------
 * DateRangeFilter
 * ----------------------------------------------------------------------------------------------*/

/** The built-in presets of a {@link DateRangeFilter}, plus `"custom"` (the calendar). */
export type DateRangeFilterPreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "custom";

/** A {@link DateRangeFilter} value: whole days, `from` and `to` inclusive. */
export interface DateRangeFilterValue {
  /** The first day (local midnight). */
  from: Date;
  /** The last day, inclusive (local midnight). */
  to: Date;
  /**
   * The preset it came from; the chip reads the preset's name ("Last 7 days") while it is set,
   * and the dates ("Sep 1–25") for `"custom"` or when omitted.
   * @default undefined
   */
  preset?: DateRangeFilterPreset;
}

/** Props accepted by `DateRangeFilter`. */
export interface DateRangeFilterProps {
  /** The filter's name, in sentence case ("Due date", "Created"). */
  label: string;
  /** The applied range, or `null` when unset (controlled). */
  value: DateRangeFilterValue | null;
  /** Called with the new range, or `null` when cleared. */
  onValueChange: (value: DateRangeFilterValue | null) => void;
  /**
   * Which presets to offer, in order. `"custom"` opens the calendar.
   * @default ["today", "yesterday", "last7", "last30", "thisMonth", "lastMonth", "custom"]
   */
  presets?: DateRangeFilterPreset[];
  /**
   * Relabel presets — for another language.
   * @default English ("Today", "Yesterday", "Last 7 days", …, "Custom range")
   */
  presetLabels?: Partial<Record<DateRangeFilterPreset, string>>;
  /**
   * "Today", for the presets, the custom calendar highlight and the label's year rule.
   * @default new Date()
   */
  now?: Date;
  /**
   * The zone the range label's days are written in (the date-time helpers' `timeZone`).
   * @default the runtime's zone
   */
  timeZone?: string;
  /**
   * The locale of the range label.
   * @default "en-US"
   */
  locale?: string;
  /**
   * Accessible name of the clear control.
   * @default `Clear ${label}`
   */
  clearLabel?: string;
  /**
   * Disable the filter.
   * @default false
   */
  disabled?: boolean;
}

const DATE_RANGE_PRESET_LABELS: Record<DateRangeFilterPreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7: "Last 7 days",
  last30: "Last 30 days",
  thisMonth: "This month",
  lastMonth: "Last month",
  custom: "Custom range",
};

const DEFAULT_DATE_RANGE_PRESETS: DateRangeFilterPreset[] = [
  "today",
  "yesterday",
  "last7",
  "last30",
  "thisMonth",
  "lastMonth",
  "custom",
];

/**
 * The `{ from, to }` a preset covers on the day `now` falls on — whole local days, inclusive.
 *
 * @example
 * dateRangeForPreset("last7") // the last 7 days, today included
 */
export function dateRangeForPreset(
  preset: Exclude<DateRangeFilterPreset, "custom">,
  now: Date = new Date(),
): DateRangeFilterValue {
  const day = (offset: number, base = now) =>
    new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset);
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case "today":
      return { from: day(0), to: day(0), preset };
    case "yesterday":
      return { from: day(-1), to: day(-1), preset };
    case "last7":
      return { from: day(-6), to: day(0), preset };
    case "last30":
      return { from: day(-29), to: day(0), preset };
    case "thisMonth":
      return { from: new Date(y, m, 1), to: new Date(y, m + 1, 0), preset };
    case "lastMonth":
      return { from: new Date(y, m - 1, 1), to: new Date(y, m, 0), preset };
  }
}

/**
 * `DateRangeFilter` — a date-range chip for a `FilterRow`, in the same compact rounded-md shape as
 * `ListFacet`. Unset it reads its label ("Due date ▾"); set it is tinted and reads the preset
 * ("Due date: Last 7 days") or the dates ("Due date: Sep 1–25", from the date-time helpers), with
 * a × in the chevron's fixed slot. Its popover lists Today · Yesterday · Last 7 days · Last 30
 * days · This month · Last month · Custom range, the last opening a two-month calendar.
 *
 * @example
 * <DateRangeFilter label="Created" value={created} onValueChange={setCreated} />
 */
export function DateRangeFilter({
  label,
  value,
  onValueChange,
  presets = DEFAULT_DATE_RANGE_PRESETS,
  presetLabels,
  now,
  timeZone,
  locale,
  clearLabel = `Clear ${label}`,
  disabled = false,
}: DateRangeFilterProps) {
  const labels = { ...DATE_RANGE_PRESET_LABELS, ...presetLabels };
  const hasValue = value != null;
  const row = React.useContext(FilterFacetContext);
  const id = React.useId();
  React.useEffect(() => {
    row?.report(id, label, hasValue);
  }, [row, id, label, hasValue]);
  React.useEffect(() => () => row?.report(id, label, null), [row, id, label]);

  const [open, setOpen] = React.useState(false);
  const [custom, setCustom] = React.useState(false);
  const [draft, setDraft] = React.useState<
    { from: Date | undefined; to?: Date } | undefined
  >(undefined);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const valueText = !value
    ? null
    : value.preset && value.preset !== "custom"
      ? labels[value.preset]
      : formatDateRange(value.from, value.to, {
          withTime: false,
          timeZone,
          locale,
          now,
        });

  const openChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      prefetchCalendar();
      setCustom(value?.preset === "custom" || (value != null && !value.preset));
      setDraft(value ? { from: value.from, to: value.to } : undefined);
    }
  };

  return (
    <span
      data-slot="date-range-filter"
      data-state={hasValue ? "set" : "unset"}
      className="relative inline-flex min-w-0 shrink-0"
    >
      <Popover open={open} onOpenChange={openChange}>
        <PopoverTrigger
          render={
            <Button
              ref={triggerRef}
              variant="ghost"
              size="sm"
              disabled={disabled}
              data-slot="date-range-filter-trigger"
              onPointerEnter={prefetchCalendar}
              onFocus={prefetchCalendar}
              className={cn(
                "h-7 max-w-64 justify-start rounded-md border border-border ps-2 pe-7 text-sm font-normal",
                hasValue
                  ? "bg-accent text-foreground hover:bg-accent/80 aria-expanded:bg-accent"
                  : "border-dashed text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
              )}
            />
          }
        >
          <span className="min-w-0 truncate">
            {valueText ? `${label}: ${valueText}` : label}
          </span>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          data-slot="date-range-filter-content"
          className="w-auto gap-0 p-0"
        >
          {custom ? (
            <div className="flex flex-col">
              <React.Suspense fallback={null}>
                <Calendar
                  mode="range"
                  numberOfMonths={2}
                  className="bg-transparent"
                  selected={draft}
                  onSelect={setDraft}
                  defaultMonth={draft?.from ?? now}
                  today={now}
                  autoFocus
                />
              </React.Suspense>
              <div className="flex items-center justify-end gap-1.5 border-t border-border p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCustom(false)}
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  disabled={!draft?.from}
                  onClick={() => {
                    if (!draft?.from) return;
                    onValueChange({
                      from: draft.from,
                      to: draft.to ?? draft.from,
                      preset: "custom",
                    });
                    setOpen(false);
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>
          ) : (
            <div
              role="group"
              aria-label={label}
              data-slot="date-range-filter-presets"
              className="flex min-w-44 flex-col p-1"
            >
              {presets.map((preset) => (
                <Button
                  key={preset}
                  variant="ghost"
                  size="sm"
                  aria-pressed={value?.preset === preset}
                  className="justify-start font-normal aria-pressed:bg-accent"
                  onClick={() => {
                    if (preset === "custom") {
                      setCustom(true);
                      return;
                    }
                    onValueChange(dateRangeForPreset(preset, now));
                    setOpen(false);
                  }}
                >
                  {labels[preset]}
                </Button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
      {hasValue ? (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={clearLabel}
          disabled={disabled}
          data-slot="date-range-filter-clear"
          className="absolute inset-y-0 end-0.5 my-auto size-6 rounded-sm text-muted-foreground hover:bg-foreground/10 hover:text-foreground active:not-aria-[haspopup]:translate-y-0"
          onClick={() => {
            triggerRef.current?.focus();
            onValueChange(null);
          }}
        >
          <X aria-hidden className="size-3.5" />
        </Button>
      ) : (
        <span
          aria-hidden
          className="pointer-events-none absolute end-0.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center text-muted-foreground"
        >
          <ChevronDown className="size-3.5" />
        </span>
      )}
    </span>
  );
}
