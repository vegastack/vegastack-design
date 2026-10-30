// @vegastack filter-row@0.26.7 sha256-L4+J9FHGsYWXlfaqFUkCbvRTqXQem+5TopGWEJ+4bD8=

"use client";

import * as React from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
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
import {
  ListToolbarDrillHeader,
  useListToolbar,
} from "@/components/ui/list-toolbar";
import { toast } from "@/components/ui/toast";
import { useMediaQuery } from "@/components/ui/use-media-query";
import { formatDateRange } from "@/lib/date-time";
import { layoutTierQuery } from "@/lib/page-layout";

/* ---
`FilterRow` is the row of filters under a `ListToolbar`, opened by its Filter tool. Its order never
changes, so chips never jump: the page's pinned facets (dashed while unset), then the other chips
in the order they were added, then `+ Filter` and `Clear` (while anything is set) right after the
last chip — all on one line that scrolls sideways and never wraps; opening a chip's picker scrolls
that chip into view. Every control on the row is the toolbar's tool height (32px; 28px in a compact
toolbar). Chips an AI filter made carry a ✦ until edited; what the AI did is a toast with Undo
(`useAiFilterApplied`), never a line under the row.
--- */

/**
 * Whether the facets and chips around stand in a `FilterRow` at the toolbar's 32px tool height.
 * Outside one (a read-only summary, a builder) they keep the compact 28px chip tier.
 */
const FilterRowTallContext = React.createContext(false);

/** The height class of a facet or chip: the row's tool height inside a `FilterRow`, else 28px. */
function useChipHeight() {
  return React.useContext(FilterRowTallContext) ? "h-8" : "h-7";
}

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

/** The words `FilterRow` shows. */
export interface FilterRowLabels {
  /** The row's accessible name. */
  filters: string;
  /** The clear-everything action. */
  clear: string;
}

const NO_AI_FACETS: readonly string[] = [];

const DEFAULT_LABELS: FilterRowLabels = {
  filters: "Filters",
  clear: "Clear",
};

/** Props accepted by `FilterRow`. */
export interface FilterRowProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /**
   * `+ Filter` — an `AddFilterMenu`. Right after the last chip, before `Clear`.
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
  /**
   * The labels of the pinned facets the last AI filter run set: each leads with a ✦ (as an AI chip
   * does) until the member changes it.
   * @default []
   */
  aiFacets?: readonly string[];
  /**
   * Called with a facet's label when the member changes one in `aiFacets` — clear its ✦ there.
   * @default undefined
   */
  onAiFacetEdit?: (label: string) => void;
}

/**
 * `FilterRow` — the filter chips under a `ListToolbar`: the pinned facets, the other chips, then
 * `+ Filter` and `Clear` right after the last chip, in one sideways-scrolling line. Opening a
 * chip's picker scrolls the chip into view. Counts what is applied and reports it to the toolbar's
 * Filter tool. Put it in `ListToolbar`'s `filterRow`.
 *
 * @example
 * <FilterRow
 *   addFilter={<AddFilterMenu fields={fields} onPick={addFilter} ai={ai} />}
 *   facets={<ListFacet label="Status" items={statuses} value={status} onValueChange={setStatus} />}
 *   chips={chips}
 *   onClear={clearAll}
 * />
 */
export function FilterRow({
  addFilter,
  facets,
  chips = [],
  onClear,
  activeCount: activeCountProp,
  labels: labelsProp,
  aiFacets = NO_AI_FACETS,
  onAiFacetEdit,
  className,
  ref,
  ...props
}: FilterRowProps) {
  const aiValue = React.useMemo(
    () => ({ facets: aiFacets, onFacetEdit: onAiFacetEdit }),
    [aiFacets, onAiFacetEdit],
  );
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
  const mergedRef = React.useMemo(() => mergeRefs(rowRef, ref), [ref]);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const showClear = onClear != null && activeCount > 0;
  const clear = () => {
    onClear?.();
    // Clear unmounts once nothing is set, and so may the chips: hand focus to + Filter, which
    // stays, else the row's first control.
    const row = rowRef.current;
    (
      row?.querySelector<HTMLElement>(
        '[data-slot="filter-row-add"] button:not([disabled])',
      ) ?? row?.querySelector<HTMLElement>("button:not([disabled])")
    )?.focus();
  };

  // A chip whose picker opens (or that takes focus) scrolls into view inside the row — only the
  // row's own `scrollLeft` moves, never the page.
  React.useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const reveal = (target: Element | null) => {
      const node = target?.closest<HTMLElement>(
        '[data-slot="list-facet"], [data-slot="date-range-filter"], [data-slot="filter-chip"], [data-slot="filter-row-add"], [data-slot="filter-row-clear"]',
      );
      if (!node || !scroller.contains(node)) return;
      const box = scroller.getBoundingClientRect();
      const rect = node.getBoundingClientRect();
      // Keep a little of the neighbour in view, past the scroll fade.
      const inset = 24;
      if (rect.left < box.left + inset)
        scroller.scrollLeft -= box.left + inset - rect.left;
      else if (rect.right > box.right - inset)
        scroller.scrollLeft += rect.right - (box.right - inset);
    };
    const onFocus = (event: FocusEvent) => reveal(event.target as Element);
    const observer =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver((records) => {
            for (const record of records) {
              const target = record.target as Element;
              if (target.getAttribute("aria-expanded") === "true")
                reveal(target);
            }
          });
    scroller.addEventListener("focusin", onFocus);
    observer?.observe(scroller, {
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-expanded"],
    });
    return () => {
      scroller.removeEventListener("focusin", onFocus);
      observer?.disconnect();
    };
  }, []);

  return (
    <div
      ref={mergedRef}
      role="group"
      aria-label={labels.filters}
      data-slot="filter-row"
      className={cn("flex w-full min-w-0 items-center", className)}
      {...props}
    >
      <FilterRowTallContext.Provider value={!toolbar?.compact}>
        <FilterRowAiContext.Provider value={aiValue}>
          <FilterFacetReporter value={reporter}>
            <div
              ref={scrollRef}
              data-slot="filter-row-scroll"
              // One line at every width: it scrolls sideways, never wraps. + Filter and Clear ride
              // at its end, right after the last chip.
              className="flex min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-x-auto overscroll-x-contain scroll-fade-x scrollbar-none"
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
              {addFilter != null ? (
                <div
                  data-slot="filter-row-add"
                  className="flex shrink-0 items-center"
                >
                  {addFilter}
                </div>
              ) : null}
              {showClear ? (
                <Button
                  variant="ghost"
                  size={toolbar?.compact ? "sm" : "default"}
                  data-slot="filter-row-clear"
                  className="shrink-0 font-normal text-muted-foreground"
                  onClick={clear}
                >
                  {labels.clear}
                </Button>
              ) : null}
            </div>
          </FilterFacetReporter>
        </FilterRowAiContext.Provider>
      </FilterRowTallContext.Provider>
    </div>
  );
}

/** What an AI filter run did, for the toast `useAiFilterApplied` shows. */
export interface AiFilterApplied {
  /** How many filters it added. */
  count: number;
  /**
   * The words it could not turn into a filter — listed, never guessed.
   * @default []
   */
  unmatched?: readonly string[];
  /** Remove exactly the filters that run added. */
  onUndo: () => void;
}

/** The words the AI filter toast shows. */
export interface AiFilterAppliedLabels {
  /** "2 filters added by AI". */
  added: (count: number) => string;
  /** The undo action. */
  undo: string;
  /** "Couldn't match “warehouse”". */
  unmatched: (terms: readonly string[]) => string;
  /**
   * A line under the toast's title — the app's AI disclaimer ("Generated by AI · can make
   * mistakes"). Shown after the unmatched words, if any.
   */
  note?: string;
}

const AI_APPLIED_LABELS: AiFilterAppliedLabels = {
  added: (count) =>
    `${count} ${count === 1 ? "filter" : "filters"} added by AI`,
  undo: "Undo",
  unmatched: (terms) =>
    `Couldn't match ${terms.map((term) => `“${term}”`).join(", ")}`,
};

/**
 * `useAiFilterApplied` — the one way a list says what its AI filter did: returns `onAiApplied`,
 * which shows a toast ("2 filters added by AI", the words it could not match) with Undo. The chips
 * keep their ✦; nothing is drawn under the filter row. `labels.note` adds the app's AI disclaimer
 * as the toast's last line. Call it once an `AddFilterMenu` AI run (or
 * the toolbar search's suggestion) has added its chips.
 *
 * @example
 * const onAiApplied = useAiFilterApplied();
 * onAiApplied({ count: 2, unmatched: ["warehouse"], onUndo: undoAi });
 */
export function useAiFilterApplied(
  labels?: Partial<AiFilterAppliedLabels>,
): (applied: AiFilterApplied) => void {
  const text = { ...AI_APPLIED_LABELS, ...labels };
  return (applied) => {
    const lines = [
      applied.unmatched && applied.unmatched.length > 0
        ? text.unmatched(applied.unmatched)
        : null,
      text.note ?? null,
    ].filter((line): line is string => line != null);
    toast.add({
      title: text.added(applied.count),
      description:
        lines.length === 0 ? undefined : (
          <span data-slot="ai-filter-toast-lines" className="flex flex-col">
            {lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </span>
        ),
      data: { actions: [{ label: text.undo, onClick: applied.onUndo }] },
    });
  };
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
 * after a colon, and a trailing `×` control that fires `onRemove`. The Chip
 * primitive in the filter row's one chip shape — the toolbar's tool height inside a `FilterRow`
 * (28px elsewhere), rounded-md, quiet type — the same shape as a `ListFacet`. An applied filter is a selection, so it carries the
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
  const tall = React.useContext(FilterRowTallContext);

  return (
    <Chip
      data-slot="filter-chip"
      data-source={ai ? "ai" : undefined}
      data-state={unset ? "unset" : undefined}
      size={tall ? "md" : "sm"}
      active={unset ? false : active}
      onRemove={unset ? undefined : onRemove}
      removeLabel={computedRemoveLabel}
      // The filter row's one chip shape: the row's height, rounded-md, quiet type — set or unset.
      // An unset pinned facet is the same box, dashed and clear: an offer, not a value.
      className={cn(
        "max-w-xs rounded-md text-sm font-normal [&_[data-slot=chip-remove]]:rounded-sm",
        unset &&
          "border border-dashed border-border bg-transparent text-muted-foreground hover:border-transparent hover:bg-muted has-aria-expanded:border-transparent has-aria-expanded:bg-muted",
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

/** Which pinned facets the last AI filter run set, and how the row hears a member change one. */
interface FilterRowAiValue {
  facets: readonly string[];
  onFacetEdit?: (label: string) => void;
}
const FilterRowAiContext = React.createContext<FilterRowAiValue | null>(null);

/**
 * A facet's AI state: `ai` from its own prop or from the row's `aiFacets` (by label), and the
 * change handler wrapped so a member's change tells the row (`onFacetEdit`) — the ✦ then goes.
 */
function useFacetAi<A extends unknown[]>(
  label: string,
  aiProp: boolean,
  onValueChange: ((...args: A) => void) | undefined,
) {
  const row = React.useContext(FilterRowAiContext);
  const ai = aiProp || (row?.facets.includes(label) ?? false);
  const change = (...args: A) => {
    if (ai) row?.onFacetEdit?.(label);
    onValueChange?.(...args);
  };
  return { ai, change };
}

/**
 * The ✦ an AI filter leaves on a facet it set — the same mark as an AI `FilterChip`. `inline` sits
 * in the trigger's own row; otherwise it overlays the trigger's start (`ListFacet`, whose trigger
 * text is a string).
 */
function FacetAiMark({ inline = false }: { inline?: boolean }) {
  return (
    <Sparkles
      aria-label="Added by AI"
      data-slot="filter-facet-ai"
      className={cn(
        "size-3.5 shrink-0 text-muted-foreground",
        !inline &&
          "pointer-events-none absolute start-2 top-1/2 -translate-y-1/2",
      )}
    />
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
   * Set by an AI filter: a ✦ leads the facet until the member changes it (the host clears it),
   * as on an added `FilterChip`.
   * @default false
   */
  ai?: boolean;
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
 * `ListFacet` — one filter on `SearchableSelect`, as a rounded-md chip at the row's height. Unset,
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
  ai: aiProp = false,
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
  const { itemToStringLabel, itemToKey, onOpenChange } = select;
  const { ai, change: onValueChange } = useFacetAi(
    label,
    aiProp,
    select.onValueChange,
  );
  const current = select.value as Item | Item[] | null | undefined;
  const selectedKeys = new Set(
    (Array.isArray(current) ? current : current ? [current] : []).map(
      itemToKey,
    ),
  );
  const hasValue = selectedKeys.size > 0;

  const row = React.useContext(FilterFacetContext);
  const chipHeight = useChipHeight();
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
      data-source={ai ? "ai" : undefined}
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
          onValueChange={onValueChange}
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
          // The compact select tier; the chip's height is the row's (below).
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
          // ONE chip shape for unset and set (rounded-md, the row's height, the same border box
          // and the same 28px trailing reserve); a set chip is tinted, never reshaped.
          className={cn(
            chipHeight,
            "w-auto max-w-64 rounded-md border-border bg-clip-border ps-2 pe-7 text-sm font-normal hover:border-border aria-expanded:border-border",
            hasValue
              ? "bg-accent text-foreground hover:bg-accent/80 aria-expanded:bg-accent dark:bg-accent dark:hover:bg-accent/80"
              : "border-dashed bg-transparent text-muted-foreground hover:border-transparent hover:bg-muted hover:text-foreground aria-expanded:border-transparent aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-transparent dark:hover:border-transparent dark:hover:bg-muted dark:aria-expanded:border-transparent dark:aria-expanded:bg-muted",
            ai && "ps-7",
          )}
          contentClassName="min-w-56"
          data-slot="list-facet-select"
        />
        {ai ? <FacetAiMark /> : null}
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
  /**
   * Set by an AI filter: a ✦ leads the facet until the member changes it (the host clears it),
   * as on an added `FilterChip`.
   * @default false
   */
  ai?: boolean;
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
  onValueChange: onValueChangeProp,
  onOpenChange,
  removable = false,
  onRemove,
  removeLabel = `Remove ${label} filter`,
  clearLabel = `Clear ${label}`,
  countLabel,
  disabled = false,
  ai: aiProp = false,
  searchPlaceholder = `Search ${label.toLowerCase()}`,
  ...list
}: PeopleFacetProps<Multiple>) {
  const { ai, change: onValueChange } = useFacetAi(
    label,
    aiProp,
    onValueChangeProp,
  );
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
  const chipHeight = useChipHeight();
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
      data-source={ai ? "ai" : undefined}
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
                  chipHeight,
                  "w-auto max-w-64 justify-start rounded-md border-border bg-clip-border ps-2 pe-7 text-sm font-normal hover:border-border aria-expanded:border-border",
                  hasValue
                    ? "bg-accent text-foreground hover:bg-accent/80 aria-expanded:bg-accent dark:bg-accent dark:hover:bg-accent/80"
                    : "border-dashed bg-transparent text-muted-foreground hover:border-transparent hover:bg-muted hover:text-foreground aria-expanded:border-transparent aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-transparent dark:hover:border-transparent dark:hover:bg-muted dark:aria-expanded:border-transparent dark:aria-expanded:bg-muted",
                )}
              />
            }
          >
            {ai ? <FacetAiMark inline /> : null}
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
  | "overdue"
  | "today"
  | "yesterday"
  | "tomorrow"
  | "thisWeek"
  | "lastWeek"
  | "nextWeek"
  | "last7"
  | "next7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "none"
  | "custom";

/**
 * A {@link DateRangeFilter} value: whole days, `from` and `to` inclusive. A bound is `null` when
 * the range is open on that side ("Overdue" has no first day); both are `null` for `"none"`
 * (items with no date).
 */
export interface DateRangeFilterValue {
  /** The first day (local midnight), or `null` for no lower bound. */
  from: Date | null;
  /** The last day, inclusive (local midnight), or `null` for no upper bound. */
  to: Date | null;
  /**
   * The preset it came from; the chip reads the preset's name ("Last 7 days") while it is set,
   * and the dates ("Sep 1–25") for `"custom"` or when omitted.
   * @default undefined
   */
  preset?: DateRangeFilterPreset;
  /**
   * A name the chip reads instead of a custom range's dates — a relative range the host keeps
   * as one token ("Last 2 days", "Next 3 weeks", "Overdue this week"). Ignored for a preset.
   * @default undefined
   */
  label?: string;
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
   * Which presets to offer, in order. `"custom"` opens the calendar; `"none"` is "No date".
   * A due date usually takes `["overdue", "today", "thisWeek", "next7", "thisMonth", "none", "custom"]`.
   * @default ["today", "yesterday", "last7", "last30", "thisMonth", "lastMonth", "custom"]
   */
  presets?: DateRangeFilterPreset[];
  /**
   * Relabel presets — for another language.
   * @default English ("Overdue", "Today", "This week", "Next 7 days", …, "No date", "Custom range")
   */
  presetLabels?: Partial<Record<DateRangeFilterPreset, string>>;
  /**
   * "Today", for the presets, the custom calendar highlight and the label's year rule.
   * @default new Date()
   */
  now?: Date;
  /**
   * The first day of a week for "This week", "Last week" and "Next week" (0 Sunday … 6 Saturday).
   * @default 1
   */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
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
   * The custom range's Apply button.
   * @default "Apply"
   */
  applyLabel?: string;
  /**
   * The custom range's back button.
   * @default "Back"
   */
  backLabel?: string;
  /**
   * Leads a range with only a first day ("From Nov 3").
   * @default "From"
   */
  fromLabel?: string;
  /**
   * Leads a range with only a last day ("Until Oct 29").
   * @default "Until"
   */
  untilLabel?: string;
  /**
   * Disable the filter.
   * @default false
   */
  disabled?: boolean;
  /**
   * Set by an AI filter: a ✦ leads the facet until the member changes it (the host clears it),
   * as on an added `FilterChip`.
   * @default false
   */
  ai?: boolean;
}

const DATE_RANGE_PRESET_LABELS: Record<DateRangeFilterPreset, string> = {
  overdue: "Overdue",
  today: "Today",
  yesterday: "Yesterday",
  tomorrow: "Tomorrow",
  thisWeek: "This week",
  lastWeek: "Last week",
  nextWeek: "Next week",
  last7: "Last 7 days",
  next7: "Next 7 days",
  last30: "Last 30 days",
  thisMonth: "This month",
  lastMonth: "Last month",
  none: "No date",
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
 * "Overdue" is every day before today (`from: null`); "No date" is `{ from: null, to: null }`.
 *
 * @example
 * dateRangeForPreset("last7") // the last 7 days, today included
 * dateRangeForPreset("thisWeek", now, 0) // Sunday to Saturday
 */
export function dateRangeForPreset(
  preset: Exclude<DateRangeFilterPreset, "custom">,
  now: Date = new Date(),
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1,
): DateRangeFilterValue {
  const day = (offset: number) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  const y = now.getFullYear();
  const m = now.getMonth();
  const weekStart = -((now.getDay() - weekStartsOn + 7) % 7);
  switch (preset) {
    case "overdue":
      return { from: null, to: day(-1), preset };
    case "today":
      return { from: day(0), to: day(0), preset };
    case "yesterday":
      return { from: day(-1), to: day(-1), preset };
    case "tomorrow":
      return { from: day(1), to: day(1), preset };
    case "thisWeek":
      return { from: day(weekStart), to: day(weekStart + 6), preset };
    case "lastWeek":
      return { from: day(weekStart - 7), to: day(weekStart - 1), preset };
    case "nextWeek":
      return { from: day(weekStart + 7), to: day(weekStart + 13), preset };
    case "last7":
      return { from: day(-6), to: day(0), preset };
    case "next7":
      return { from: day(0), to: day(6), preset };
    case "last30":
      return { from: day(-29), to: day(0), preset };
    case "thisMonth":
      return { from: new Date(y, m, 1), to: new Date(y, m + 1, 0), preset };
    case "lastMonth":
      return { from: new Date(y, m - 1, 1), to: new Date(y, m, 0), preset };
    case "none":
      return { from: null, to: null, preset };
  }
}

/** One option row of a date filter: the menus' 28px row, a tick at the end when chosen. */
function DateRangeOption({
  selected,
  onSelect,
  children,
  trailing,
  "data-slot": dataSlot = "date-range-filter-preset",
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
  trailing?: React.ReactNode;
  "data-slot"?: string;
}) {
  return (
    <Button
      variant="ghost"
      aria-pressed={trailing == null ? selected : undefined}
      data-slot={dataSlot}
      onClick={onSelect}
      className="h-7 w-full min-w-0 justify-between gap-1.5 rounded-md px-1.5 text-sm font-normal"
    >
      <span className="min-w-0 truncate">{children}</span>
      {trailing ??
        (selected ? <Check aria-hidden className="size-4 shrink-0" /> : null)}
    </Button>
  );
}

/**
 * `DateRangeFilter` — THE date filter: every date facet in a `FilterRow` is one, in the same
 * rounded-md chip as `ListFacet`. Unset it reads its label ("Due ▾"); set it is tinted and reads
 * the preset ("Due: This week") or the dates ("Due: Sep 1–25"), with a × in the chevron's fixed
 * slot. Its popover lists the page's presets as the menus' 28px rows — Overdue, Today, This week,
 * Next 7 days, This month, No date, Last 30 days… — and "Custom range", which drills into a
 * calendar (two months; one on a phone) in the same popover. Presets are computed from `now`, so
 * "This week" is always this week.
 *
 * @example
 * <DateRangeFilter
 *   label="Due"
 *   presets={["overdue", "today", "thisWeek", "next7", "thisMonth", "none", "custom"]}
 *   value={due}
 *   onValueChange={setDue}
 * />
 */
export function DateRangeFilter({
  label,
  value,
  onValueChange: onValueChangeProp,
  presets = DEFAULT_DATE_RANGE_PRESETS,
  presetLabels,
  now,
  weekStartsOn = 1,
  timeZone,
  locale,
  clearLabel = `Clear ${label}`,
  applyLabel = "Apply",
  backLabel = "Back",
  fromLabel = "From",
  untilLabel = "Until",
  disabled = false,
  ai: aiProp = false,
}: DateRangeFilterProps) {
  const { ai, change: onValueChange } = useFacetAi(
    label,
    aiProp,
    onValueChangeProp,
  );
  const labels = { ...DATE_RANGE_PRESET_LABELS, ...presetLabels };
  const hasValue = value != null;
  const row = React.useContext(FilterFacetContext);
  const chipHeight = useChipHeight();
  const phone = useMediaQuery(layoutTierQuery(undefined, "tablet"));
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

  const isCustom =
    value != null && (!value.preset || value.preset === "custom");
  const day = (date: Date) =>
    formatDateRange(date, date, { withTime: false, timeZone, locale, now });
  // An open-ended custom range reads its one bound ("Until Oct 29", "From Nov 3").
  const datesText = !value
    ? null
    : value.from && value.to
      ? formatDateRange(value.from, value.to, {
          withTime: false,
          timeZone,
          locale,
          now,
        })
      : value.to
        ? `${untilLabel} ${day(value.to)}`
        : value.from
          ? `${fromLabel} ${day(value.from)}`
          : null;
  const valueText = !value
    ? null
    : !isCustom
      ? labels[value.preset!]
      : (value.label ?? datesText ?? labels.custom);

  const openChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      prefetchCalendar();
      setCustom(false);
      setDraft(
        value?.from || value?.to
          ? { from: value.from ?? undefined, to: value.to ?? undefined }
          : undefined,
      );
    }
  };

  return (
    <span
      data-slot="date-range-filter"
      data-state={hasValue ? "set" : "unset"}
      data-source={ai ? "ai" : undefined}
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
                chipHeight,
                "max-w-64 justify-start rounded-md border border-border bg-clip-border ps-2 pe-7 text-sm font-normal",
                hasValue
                  ? "bg-accent text-foreground hover:bg-accent/80 aria-expanded:bg-accent"
                  : "border-dashed text-muted-foreground hover:border-transparent hover:bg-muted hover:text-foreground aria-expanded:border-transparent aria-expanded:bg-muted aria-expanded:text-foreground",
              )}
            />
          }
        >
          {ai ? <FacetAiMark inline /> : null}
          <span className="min-w-0 truncate">
            {valueText ? `${label}: ${valueText}` : label}
          </span>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          data-slot="date-range-filter-content"
          className={cn("gap-0 p-1", custom ? "w-auto" : "w-56")}
        >
          {custom ? (
            <div data-slot="date-range-filter-custom" className="flex flex-col">
              <ListToolbarDrillHeader
                title={labels.custom}
                backLabel={backLabel}
                onBack={() => setCustom(false)}
              />
              <React.Suspense fallback={null}>
                <Calendar
                  mode="range"
                  numberOfMonths={phone ? 1 : 2}
                  className="bg-transparent"
                  selected={draft}
                  onSelect={setDraft}
                  defaultMonth={draft?.from ?? now}
                  today={now}
                  weekStartsOn={weekStartsOn}
                  autoFocus
                />
              </React.Suspense>
              <div className="-mx-1 mt-1 flex items-center justify-end border-t border-border px-1 pt-1">
                <Button
                  size="sm"
                  disabled={!draft?.from}
                  data-slot="date-range-filter-apply"
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
                  {applyLabel}
                </Button>
              </div>
            </div>
          ) : (
            <div
              role="group"
              aria-label={label}
              data-slot="date-range-filter-presets"
              className="flex flex-col"
            >
              {presets.map((preset) =>
                preset === "custom" ? (
                  <DateRangeOption
                    key={preset}
                    data-slot="date-range-filter-custom-row"
                    selected={isCustom}
                    onSelect={() => setCustom(true)}
                    trailing={
                      <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
                        {isCustom && datesText ? (
                          <span className="min-w-0 truncate">{datesText}</span>
                        ) : null}
                        <ChevronRight aria-hidden className="size-4 shrink-0" />
                      </span>
                    }
                  >
                    {labels.custom}
                  </DateRangeOption>
                ) : (
                  <DateRangeOption
                    key={preset}
                    selected={value?.preset === preset}
                    onSelect={() => {
                      onValueChange(
                        dateRangeForPreset(preset, now, weekStartsOn),
                      );
                      setOpen(false);
                    }}
                  >
                    {labels[preset]}
                  </DateRangeOption>
                ),
              )}
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
