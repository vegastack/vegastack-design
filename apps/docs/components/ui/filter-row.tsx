// @vegastack filter-row@0.25.100 sha256-L3MNBAUMZdmStvM10DMP7G/NtT/gGdCmYUY4SoYFgK4=

"use client";

import * as React from "react";
import { Sparkles, X } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  FilterChip,
  FilterFacetReporter,
  type FilterFacetReport,
} from "@/components/ui/filter-bar";
import { useListToolbar } from "@/components/ui/list-toolbar";

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
   * The page's pinned facets, in its order: `FilterBarFacet`, `FilterBarPeopleFacet`,
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
 *   facets={<FilterBarFacet label="Status" items={statuses} value={status} onValueChange={setStatus} />}
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
