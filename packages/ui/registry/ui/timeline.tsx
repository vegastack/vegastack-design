// @vegastack timeline@0.124.0 sha256-IfLhe4Dp2uAcktLpb/ekXVyNI2EeM9ZvOdDtf5b/KTI=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";

import { Button } from "@/components/ui/button";
import { LoadMore, type LoadMoreState } from "@/components/ui/load-more";
import {
  MilestoneGlyph,
  type MilestoneState,
} from "@/components/ui/milestone-list";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { usePrefersReducedMotion } from "@/components/ui/use-media-query";
import { useListNav } from "@/components/ui/use-list-nav";

/* ---
`Timeline` lays a list of dated work out against the calendar, one row each: a sticky label
column (an optional leading glyph, the name and a sublabel), then a bar from the start date to the
end date with the row's milestones as diamonds on it, and a line for today. The bar's colour says
the work's status, from one small closed set (planned, active, paused, completed, canceled);
health is never a fill (COL-25): put a `HealthIndicator` in the row's `leading` slot.

It zooms by Month or Quarter (controlled or not) and scrolls sideways inside its own box, so the
page never scrolls sideways; it opens on today. Rows without any date sit last, under "No dates".
Under 40rem of its own width (the `tablet` container) it is a vertical list grouped by month
instead, with each row's dates and its next milestone in words.

Rows are one Tab stop: ↑/↓, Home and End move between them, Enter or a press calls `onOpen`. Each
row's accessible name says it all — "{label}, {start} to {end}, {status}, {leading words}" and its
milestones — so a screen reader never needs the bars. Rows skip layout and paint off screen
(`content-visibility: auto`), and `loadMore` is the shared keyset tail: it asks for the next page
as the last row nears the screen.

Pass `today` (the workspace's date) when the page renders on the server, so the server and the
browser draw today in the same place.
--- */

/** The work's status: it picks the bar's colour. */
export type TimelineStatus =
  "planned" | "active" | "paused" | "completed" | "canceled";

/** How much calendar one screen shows. */
export type TimelineZoom = "month" | "quarter";

/** A milestone on a row. */
export interface TimelineMarker {
  /** Stable id. */
  id: string;
  /** Its date as an ISO date (`2026-03-14`). */
  date: string;
  /** Its name. */
  label: string;
  /** Done, open, or open past its date (drawn in the warning ink). */
  state: MilestoneState;
}

/** One row of the timeline. */
export interface TimelineRow {
  /** Stable id: what `onOpen` receives. */
  id: string;
  /** The work's name. */
  label: string;
  /**
   * One muted line under the name (a code, an owner).
   * @default undefined
   */
  sublabel?: string;
  /**
   * Start as an ISO date (`2026-03-01`).
   * @default undefined
   */
  start?: string;
  /**
   * End or target as an ISO date.
   * @default undefined
   */
  end?: string;
  /** The status: it colours the bar. */
  status: TimelineStatus;
  /**
   * Words for the status in the row's name, in place of the default ("Planned", "Active"…).
   * @default the status's words
   */
  statusLabel?: string;
  /**
   * A glyph before the name: a `HealthIndicator` with `labelHidden`.
   * @default undefined
   */
  leading?: React.ReactNode;
  /**
   * What `leading` says, for the row's accessible name ("At risk").
   * @default undefined
   */
  leadingLabel?: string;
  /**
   * Milestones, drawn as diamonds at their dates.
   * @default []
   */
  markers?: readonly TimelineMarker[];
}

/** Every word the timeline draws or speaks; pass any of them to `labels` to replace it. */
export interface TimelineLabels {
  /** The Today button and the chip on the today line. */
  today: string;
  /** The zoom control's name. */
  zoom: string;
  /** The Month zoom. */
  month: string;
  /** The Quarter zoom. */
  quarter: string;
  /** The heading over rows without dates. */
  noDates: string;
  /** Opens the milestones in a row's name ("Milestones"). */
  milestones: string;
  /** Each status in words. */
  status: Record<TimelineStatus, string>;
  /** Each milestone state in words, in a row's name. */
  marker: Record<MilestoneState, string>;
  /** A row's dates in words from formatted dates: "Mar 1, 2026 to Jun 30, 2026", "from …", "until …", "no dates". */
  range: (start: string | null, end: string | null) => string;
  /** A month heading in the list view ("March 2026"), from the month's first day as an ISO date. */
  monthHeading: (iso: string) => string;
  /**
   * A calendar heading over the bars, from its period's first day as an ISO date: a month at Month
   * zoom ("Feb", or "Jan 2027" with `withYear`), a quarter at Quarter zoom ("Q1 2027").
   */
  calendarHeading: (
    iso: string,
    period: "month" | "quarter",
    withYear: boolean,
  ) => string;
}

const DEFAULT_LABELS: TimelineLabels = {
  today: "Today",
  zoom: "Zoom",
  month: "Month",
  quarter: "Quarter",
  noDates: "No dates",
  milestones: "Milestones",
  status: {
    planned: "Planned",
    active: "Active",
    paused: "Paused",
    completed: "Completed",
    canceled: "Canceled",
  },
  marker: { done: "done", open: "open", late: "late" },
  range: (start, end) =>
    start && end
      ? `${start} to ${end}`
      : start
        ? `from ${start}`
        : end
          ? `until ${end}`
          : "no dates",
  monthHeading: (iso) => {
    const day = dayOf(iso);
    return day == null ? iso : monthName(day, true);
  },
  calendarHeading: (iso, period, withYear) => {
    const day = dayOf(iso);
    if (day == null) return iso;
    const date = dateOf(day);
    const year = date.getUTCFullYear();
    if (period === "quarter")
      return `Q${Math.floor(date.getUTCMonth() / 3) + 1} ${year}`;
    return withYear
      ? `${monthName(day, false)} ${year}`
      : monthName(day, false);
  },
};

/** Props accepted by `Timeline`. */
export interface TimelineProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children" | "onChange"
> {
  /** The rows, in the order to show them (rows without dates move under "No dates"). */
  rows: readonly TimelineRow[];
  /**
   * Open a row: Enter on a focused row, or a press.
   * @default undefined
   */
  onOpen?: (id: string) => void;
  /**
   * The zoom, controlled.
   * @default undefined
   */
  zoom?: TimelineZoom;
  /**
   * The zoom it starts on, uncontrolled.
   * @default "month"
   */
  defaultZoom?: TimelineZoom;
  /**
   * Called with the zoom picked.
   * @default undefined
   */
  onZoomChange?: (zoom: TimelineZoom) => void;
  /**
   * Today as an ISO date. Pass the workspace's date when rendering on the server.
   * @default the browser's date
   */
  today?: string;
  /**
   * The keyset paging tail: `onLoadMore` fetches the next page as the last row nears the screen.
   * @default undefined
   */
  loadMore?: LoadMoreState;
  /**
   * Shown in place of the rows when there are none.
   * @default undefined
   */
  emptyState?: React.ReactNode;
  /**
   * Words to replace: Today, Zoom, Month, Quarter, No dates, the status and milestone-state words,
   * the date range and the month headings.
   * @default English
   */
  labels?: Partial<TimelineLabels>;
  /**
   * Formats a date in rows' names and the list view.
   * @default "Mar 14, 2026"
   */
  formatDate?: (iso: string) => string;
  /**
   * Accessible name of the rows.
   * @default "Timeline"
   */
  "aria-label"?: string;
}

// The bar's colour by status: one neutral language (COL-25), never a status hue as a fill.
// Active is the solid ink; planned is an outline; paused and done step back; canceled fades.
const BAR: Record<TimelineStatus, string> = {
  planned: "border border-dashed border-muted-foreground bg-transparent",
  active: "bg-primary",
  paused: "bg-primary/35",
  completed: "bg-muted-foreground/50",
  canceled: "bg-muted-foreground/20",
};

/** Pixels per day at each zoom: a month is about 120px wide, a quarter about 137px. */
const DAY_WIDTH: Record<TimelineZoom, number> = { month: 4, quarter: 1.5 };

const MS_PER_DAY = 86_400_000;
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})/;
/** The label column's width; the track layer starts at the same inset. */
const LABEL_COLUMN = "w-56";
const TRACK_INSET = "start-56";

/** Days since the epoch for an ISO date, read as a calendar date (never shifted by zone). */
function dayOf(iso: string | undefined): number | null {
  if (!iso) return null;
  const match = ISO_DAY.exec(iso);
  if (!match) return null;
  return (
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) /
    MS_PER_DAY
  );
}

function dateOf(day: number): Date {
  return new Date(day * MS_PER_DAY);
}

/** The first day of `day`'s month, `offset` months on. */
function monthStart(day: number, offset = 0): number {
  const date = dateOf(day);
  return (
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1) / MS_PER_DAY
  );
}

function localToday(): number {
  const now = new Date();
  return (
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / MS_PER_DAY
  );
}

function defaultFormatDate(iso: string): string {
  const day = dayOf(iso);
  if (day == null) return iso;
  return dateOf(day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function monthName(day: number, withYear: boolean): string {
  return dateOf(day).toLocaleDateString("en-US", {
    month: withYear ? "long" : "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

/** A row's dates in words, for its name and the list view. */
function datesInWords(
  row: TimelineRow,
  format: (iso: string) => string,
  labels: TimelineLabels,
) {
  const start = dayOf(row.start) != null ? format(row.start!) : null;
  const end = dayOf(row.end) != null ? format(row.end!) : null;
  return labels.range(start, end);
}

/** The row's whole story, as its accessible name. */
function rowName(
  row: TimelineRow,
  format: (iso: string) => string,
  labels: TimelineLabels,
) {
  const parts = [row.label];
  if (row.sublabel) parts.push(row.sublabel);
  parts.push(
    datesInWords(row, format, labels),
    row.statusLabel ?? labels.status[row.status],
  );
  if (row.leadingLabel) parts.push(row.leadingLabel);
  let name = parts.join(", ");
  const markers = row.markers ?? [];
  if (markers.length > 0)
    name += `. ${labels.milestones}: ${markers
      .map((m) => `${m.label}, ${format(m.date)}, ${labels.marker[m.state]}`)
      .join("; ")}`;
  return name;
}

/** The first day a row has: start, else end, else its earliest milestone. */
function anchorOf(row: TimelineRow): number | null {
  const start = dayOf(row.start);
  if (start != null) return start;
  const end = dayOf(row.end);
  if (end != null) return end;
  let first: number | null = null;
  for (const marker of row.markers ?? []) {
    const day = dayOf(marker.date);
    if (day != null && (first == null || day < first)) first = day;
  }
  return first;
}

function useRowNav(count: number) {
  const nav = useListNav({ count });
  // ↑/↓, Home and End move between rows; ←/→ pass through so the box still scrolls sideways.
  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (
      event.key === "ArrowUp" ||
      event.key === "ArrowDown" ||
      event.key === "Home" ||
      event.key === "End"
    )
      nav.handleKeyDown(event);
  };
  return { ...nav, onKeyDown };
}

/** What a row does when it opens: the button role, Enter and Space, a press. */
function openProps(id: string, onOpen?: (id: string) => void) {
  if (!onOpen) return { role: "group" as const, onKeyDown: undefined };
  return {
    role: "button" as const,
    onClick: () => onOpen(id),
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onOpen(id);
      }
    },
  };
}

const ROW_LAYER =
  "relative after:pointer-events-none after:absolute after:inset-0 after:z-30 after:content-[''] hover:after:bg-state-hover focus-visible:after:bg-state-focus";

/**
 * `Timeline` — dated work against the calendar: a sticky label column, status-coloured bars from
 * start to end, milestone diamonds, a today line, Month and Quarter zoom, rows without dates
 * under "No dates", and a vertical list grouped by month under 40rem.
 *
 * @example
 * <Timeline
 *   today="2026-11-21"
 *   rows={initiatives.map((i) => ({
 *     id: i.id,
 *     label: i.title,
 *     sublabel: i.code,
 *     start: i.startDate,
 *     end: i.targetDate,
 *     status: i.status,
 *     leading: <HealthIndicator health={i.health} labelHidden />,
 *     leadingLabel: HEALTH_LABEL[i.health],
 *     markers: i.milestones.map((m) => ({ id: m.id, date: m.dueDate, label: m.name, state: m.state })),
 *   }))}
 *   onOpen={openPeek}
 *   loadMore={{ hasMore, loading, onLoadMore: fetchNextPage }}
 * />
 */
export function Timeline({
  rows,
  onOpen,
  zoom: zoomProp,
  defaultZoom = "month",
  onZoomChange,
  today: todayProp,
  loadMore,
  emptyState,
  labels: labelsProp,
  formatDate = defaultFormatDate,
  "aria-label": ariaLabel = "Timeline",
  className,
  ...props
}: TimelineProps) {
  const [zoomState, setZoomState] = React.useState(defaultZoom);
  const zoom = zoomProp ?? zoomState;
  const setZoom = (next: TimelineZoom) => {
    if (zoomProp === undefined) setZoomState(next);
    onZoomChange?.(next);
  };
  const today = dayOf(todayProp) ?? localToday();
  const labels = React.useMemo(
    () => ({
      ...DEFAULT_LABELS,
      ...labelsProp,
      status: { ...DEFAULT_LABELS.status, ...labelsProp?.status },
      marker: { ...DEFAULT_LABELS.marker, ...labelsProp?.marker },
    }),
    [labelsProp],
  );

  const { dated, undated } = React.useMemo(() => {
    const dated: TimelineRow[] = [];
    const undated: TimelineRow[] = [];
    for (const row of rows) (anchorOf(row) == null ? undated : dated).push(row);
    return { dated, undated };
  }, [rows]);

  return (
    <div
      data-slot="timeline"
      data-zoom={zoom}
      className={cn(
        "@container/timeline flex min-w-0 flex-col [--timeline-bg:var(--background)]",
        className,
      )}
      {...props}
    >
      {rows.length === 0 ? (
        emptyState != null ? (
          <div data-slot="timeline-empty">{emptyState}</div>
        ) : null
      ) : (
        <>
          <TimelineBars
            dated={dated}
            undated={undated}
            zoom={zoom}
            onZoomChange={setZoom}
            today={today}
            onOpen={onOpen}
            formatDate={formatDate}
            labels={labels}
            ariaLabel={ariaLabel}
          />
          <TimelineMonths
            dated={dated}
            undated={undated}
            onOpen={onOpen}
            formatDate={formatDate}
            labels={labels}
            ariaLabel={ariaLabel}
          />
        </>
      )}
      {loadMore ? (
        <LoadMore
          {...loadMore}
          skeleton={
            <div className="flex flex-col gap-2 py-2" aria-hidden>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-6 animate-pulse rounded-item bg-muted"
                />
              ))}
            </div>
          }
        />
      ) : null}
    </div>
  );
}

interface TimelineViewProps {
  dated: TimelineRow[];
  undated: TimelineRow[];
  onOpen?: (id: string) => void;
  formatDate: (iso: string) => string;
  labels: TimelineLabels;
  ariaLabel: string;
}

function TimelineBars({
  dated,
  undated,
  zoom,
  onZoomChange,
  today,
  onOpen,
  formatDate,
  labels,
  ariaLabel,
}: TimelineViewProps & {
  zoom: TimelineZoom;
  onZoomChange: (zoom: TimelineZoom) => void;
  today: number;
}) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const dayWidth = DAY_WIDTH[zoom];

  // The calendar spans every date shown plus today, from a month before to two after (a whole
  // quarter either side at Quarter zoom).
  const range = React.useMemo(() => {
    let min = today;
    let max = today;
    for (const row of dated) {
      for (const day of [
        dayOf(row.start),
        dayOf(row.end),
        ...(row.markers ?? []).map((m) => dayOf(m.date)),
      ]) {
        if (day == null) continue;
        if (day < min) min = day;
        if (day > max) max = day;
      }
    }
    let from = monthStart(min, -1);
    let to = monthStart(max, 2);
    if (zoom === "quarter") {
      const fromDate = dateOf(from);
      from =
        Date.UTC(
          fromDate.getUTCFullYear(),
          Math.floor(fromDate.getUTCMonth() / 3) * 3,
          1,
        ) / MS_PER_DAY;
      const toDate = dateOf(to);
      to =
        Date.UTC(
          toDate.getUTCFullYear(),
          Math.ceil(toDate.getUTCMonth() / 3) * 3,
          1,
        ) / MS_PER_DAY;
    }
    return { from, to };
  }, [dated, today, zoom]);

  const width = (range.to - range.from) * dayWidth;
  const x = (day: number) => (day - range.from) * dayWidth;

  // Month starts (gridlines and labels); at Quarter zoom the labels go on quarter starts.
  const ticks = React.useMemo(() => {
    const out: { day: number; label: string; major: boolean }[] = [];
    for (let day = range.from; day < range.to; day = monthStart(day, 1)) {
      const date = dateOf(day);
      const month = date.getUTCMonth();
      const iso = date.toISOString().slice(0, 10);
      if (zoom === "month")
        out.push({
          day,
          label: labels.calendarHeading(
            iso,
            "month",
            month === 0 || day === range.from,
          ),
          major: true,
        });
      else
        out.push({
          day,
          label:
            month % 3 === 0 ? labels.calendarHeading(iso, "quarter", true) : "",
          major: month % 3 === 0,
        });
    }
    return out;
  }, [range, zoom, labels]);

  // Physical scrollLeft for a logical offset from the calendar's start (negative in RTL).
  const toScrollLeft = (scroller: HTMLElement, offset: number) =>
    getComputedStyle(scroller).direction === "rtl" ? -offset : offset;

  const scrollToToday = React.useCallback(
    (behavior: ScrollBehavior) => {
      const scroller = scrollerRef.current;
      if (!scroller || scroller.clientWidth === 0) return;
      const column =
        scroller.querySelector<HTMLElement>(
          '[data-slot="timeline-label-column"]',
        )?.offsetWidth ?? 0;
      const track = scroller.clientWidth - column;
      const offset = Math.max(0, (today - range.from) * dayWidth - track / 3);
      scroller.scrollTo({ left: toScrollLeft(scroller, offset), behavior });
    },
    [today, range.from, dayWidth],
  );

  // Open on today and come back to it when the zoom changes; a later page that widens the
  // calendar keeps the date in view where it was. Hidden (the month list is showing), the box has
  // no width, so it opens on today once it shows.
  const placed = React.useRef<{ zoom: TimelineZoom; from: number } | null>(
    null,
  );
  React.useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (scroller.clientWidth === 0) {
      // Hidden: forget the placement, so the bars open on today when they show again.
      placed.current = null;
      return;
    }
    const last = placed.current;
    if (last && last.zoom === zoom && last.from !== range.from) {
      scroller.scrollLeft += toScrollLeft(
        scroller,
        (last.from - range.from) * dayWidth,
      );
    } else if (!last || last.zoom !== zoom) {
      scrollToToday("instant");
    }
    placed.current = { zoom, from: range.from };
  }, [zoom, range.from, dayWidth, scrollToToday]);
  React.useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (scroller.clientWidth === 0) {
        placed.current = null;
        return;
      }
      if (placed.current) return;
      scrollToToday("instant");
      placed.current = { zoom, from: range.from };
    });
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [scrollToToday, zoom, range.from]);

  // The hover chip on a milestone hides on Escape (WCAG 1.4.13) until the pointer leaves it.
  const [hoveredMarker, setHoveredMarker] = React.useState<string | null>(null);
  const [dismissedMarker, setDismissedMarker] = React.useState<string | null>(
    null,
  );
  const hoveredRef = React.useRef<string | null>(null);
  hoveredRef.current = hoveredMarker;
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && hoveredRef.current)
        setDismissedMarker(hoveredRef.current);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const all = React.useMemo(() => [...dated, ...undated], [dated, undated]);
  const nav = useRowNav(all.length);
  const todayInRange = today >= range.from && today < range.to;
  const noDatesId = React.useId();

  const renderRow = (row: TimelineRow, index: number) => {
    const start = dayOf(row.start);
    const end = dayOf(row.end);
    const markers = row.markers ?? [];
    const barFrom = start ?? end;
    const barTo = end ?? start;
    const item = onOpen ? nav.getItemProps(index) : null;
    const open = openProps(row.id, onOpen);
    return (
      <li
        key={row.id}
        className="[contain-intrinsic-size:auto_3rem] [content-visibility:auto]"
      >
        <div
          data-slot="timeline-row"
          data-status={row.status}
          aria-label={rowName(row, formatDate, labels)}
          {...item}
          {...open}
          onKeyDown={(event) => {
            open.onKeyDown?.(event);
            if (onOpen) nav.onKeyDown(event);
          }}
          className={cn(
            "group/timeline-row flex h-12 items-stretch",
            onOpen && ROW_LAYER,
            onOpen && "cursor-pointer",
          )}
        >
          <div
            className={cn(
              LABEL_COLUMN,
              "sticky start-0 z-20 flex shrink-0 items-center gap-2 border-e bg-(--timeline-bg) px-3",
            )}
          >
            {row.leading ? (
              <span aria-hidden className="flex shrink-0">
                {row.leading}
              </span>
            ) : null}
            <span aria-hidden className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">{row.label}</span>
              {row.sublabel ? (
                <span className="truncate text-xs text-muted-foreground">
                  {row.sublabel}
                </span>
              ) : null}
            </span>
          </div>
          <div aria-hidden className="relative shrink-0" style={{ width }}>
            {barFrom != null && barTo != null ? (
              <span
                data-slot="timeline-bar"
                className={cn(
                  "absolute top-1/2 h-2 min-w-2 -translate-y-1/2 rounded-full",
                  BAR[row.status],
                )}
                style={{
                  insetInlineStart: x(Math.min(barFrom, barTo)),
                  width: (Math.abs(barTo - barFrom) + 1) * dayWidth,
                }}
              />
            ) : null}
            {markers.map((marker) => {
              const day = dayOf(marker.date);
              if (day == null) return null;
              return (
                <span
                  key={marker.id}
                  data-slot="timeline-marker"
                  data-state={marker.state}
                  className="group/marker absolute top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center rtl:translate-x-1/2"
                  onPointerEnter={() => setHoveredMarker(marker.id)}
                  onPointerLeave={() => {
                    setHoveredMarker(null);
                    setDismissedMarker(null);
                  }}
                  style={{ insetInlineStart: x(day) + dayWidth / 2 }}
                >
                  <span className="flex rounded-full bg-(--timeline-bg) p-0.5">
                    <MilestoneGlyph
                      state={marker.state}
                      size={14}
                      label={null}
                    />
                  </span>
                  {/* The padding bridges the gap, so the pointer can move onto the chip. */}
                  <span
                    className={cn(
                      "absolute start-full hidden ps-1 group-hover/marker:block",
                      dismissedMarker === marker.id &&
                        "group-hover/marker:hidden",
                    )}
                  >
                    <span className="block rounded-item border border-popover-border bg-popover px-2 py-0.5 text-xs whitespace-nowrap text-popover-foreground shadow-md surface-popup">
                      {marker.label} · {formatDate(marker.date)}
                    </span>
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      </li>
    );
  };

  return (
    <div
      data-slot="timeline-bars"
      className="flex min-w-0 flex-col gap-2 @max-tablet/timeline:hidden"
    >
      <div className="flex items-center justify-end gap-2">
        <Button
          data-slot="timeline-today"
          variant="outline"
          size="sm"
          onClick={() => scrollToToday(reducedMotion ? "instant" : "smooth")}
        >
          {labels.today}
        </Button>
        <ToggleGroup
          data-slot="timeline-zoom"
          aria-label={labels.zoom}
          variant="outline"
          size="sm"
          spacing={0}
          deselectable={false}
          value={[zoom]}
          onValueChange={(next) => {
            const value = next[0] as TimelineZoom | undefined;
            if (value) onZoomChange(value);
          }}
        >
          <ToggleGroupItem value="month">{labels.month}</ToggleGroupItem>
          <ToggleGroupItem value="quarter">{labels.quarter}</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div
        ref={scrollerRef}
        data-slot="timeline-scroller"
        // Without `onOpen` nothing inside takes focus, so the box itself does, to scroll by keyboard.
        {...(onOpen
          ? {}
          : { tabIndex: 0, role: "region", "aria-label": ariaLabel })}
        className="relative overflow-x-auto overscroll-x-contain rounded-block border scroll-fade-x [--scroll-fade-s-size:0%]"
      >
        <div className="relative w-max min-w-full">
          <div
            aria-hidden
            className="flex h-8 items-stretch border-b text-xs text-muted-foreground"
          >
            <div
              data-slot="timeline-label-column"
              className={cn(
                LABEL_COLUMN,
                "sticky start-0 z-20 shrink-0 border-e bg-(--timeline-bg)",
              )}
            />
            <div className="relative shrink-0" style={{ width }}>
              {ticks.map((tick) =>
                // A label that would sit under the Today chip gives way to it.
                tick.label &&
                !(
                  todayInRange &&
                  x(today) > x(tick.day) - 28 &&
                  x(today) < x(tick.day) + 80
                ) ? (
                  <span
                    key={tick.day}
                    className="absolute inset-y-0 flex items-center ps-2 whitespace-nowrap"
                    style={{ insetInlineStart: x(tick.day) }}
                  >
                    {tick.label}
                  </span>
                ) : null,
              )}
              {todayInRange ? (
                <span
                  data-slot="timeline-today-label"
                  className="absolute inset-y-0 z-10 flex -translate-x-1/2 items-center rtl:translate-x-1/2"
                  style={{ insetInlineStart: x(today) + dayWidth / 2 }}
                >
                  <span className="rounded-chip bg-(--timeline-bg) px-1.5 font-medium text-info-text">
                    {labels.today}
                  </span>
                </span>
              ) : null}
            </div>
          </div>
          <div className="relative">
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-y-0",
                TRACK_INSET,
              )}
              style={{ width }}
            >
              {ticks.map((tick) => (
                <span
                  key={tick.day}
                  className={cn(
                    "absolute inset-y-0 border-s",
                    tick.major ? "border-border" : "border-border/40",
                  )}
                  style={{ insetInlineStart: x(tick.day) }}
                />
              ))}
              {todayInRange ? (
                <span
                  data-slot="timeline-today-line"
                  className="absolute inset-y-0 z-10 w-px bg-info"
                  style={{ insetInlineStart: x(today) + dayWidth / 2 }}
                />
              ) : null}
            </div>
            {dated.length > 0 ? (
              <ul aria-label={ariaLabel} className="flex flex-col">
                {dated.map((row, index) => renderRow(row, index))}
              </ul>
            ) : null}
            {undated.length > 0 ? (
              <>
                <div className="flex h-8 items-stretch border-t">
                  <p
                    id={noDatesId}
                    className={cn(
                      LABEL_COLUMN,
                      "sticky start-0 z-20 flex shrink-0 items-center border-e bg-(--timeline-bg) px-3 text-xs font-medium text-muted-foreground",
                    )}
                  >
                    {labels.noDates}
                  </p>
                </div>
                <ul aria-labelledby={noDatesId} className="flex flex-col">
                  {undated.map((row, index) =>
                    renderRow(row, dated.length + index),
                  )}
                </ul>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineMonths({
  dated,
  undated,
  onOpen,
  formatDate,
  labels,
  ariaLabel,
}: TimelineViewProps) {
  const groups = React.useMemo(() => {
    const byMonth = new Map<number, TimelineRow[]>();
    for (const row of dated) {
      const month = monthStart(anchorOf(row)!);
      const list = byMonth.get(month);
      if (list) list.push(row);
      else byMonth.set(month, [row]);
    }
    return [...byMonth.entries()]
      .sort(([a], [b]) => a - b)
      .map(([month, rows]) => ({
        key: String(month),
        label: labels.monthHeading(dateOf(month).toISOString().slice(0, 10)),
        rows,
      }));
  }, [dated, labels]);

  const all = React.useMemo(
    () => [
      ...groups,
      ...(undated.length > 0
        ? [{ key: "none", label: labels.noDates, rows: undated }]
        : []),
    ],
    [groups, undated, labels],
  );
  const order = all.flatMap((group) => group.rows);
  const nav = useRowNav(order.length);
  const baseId = React.useId();

  let index = 0;
  return (
    <div
      data-slot="timeline-months"
      aria-label={ariaLabel}
      role="group"
      className="flex min-w-0 flex-col gap-4 @tablet/timeline:hidden"
    >
      {all.map((group) => {
        const headingId = `${baseId}-${group.key}`;
        return (
          <section key={group.key} className="flex flex-col gap-1">
            <p
              id={headingId}
              className="px-2 text-xs font-medium text-muted-foreground"
            >
              {group.label}
            </p>
            <ul aria-labelledby={headingId} className="flex flex-col">
              {group.rows.map((row) => {
                const at = index++;
                const item = onOpen ? nav.getItemProps(at) : null;
                const open = openProps(row.id, onOpen);
                const next =
                  (row.markers ?? []).find((m) => m.state !== "done") ?? null;
                return (
                  <li
                    key={row.id}
                    className="[contain-intrinsic-size:auto_4rem] [content-visibility:auto]"
                  >
                    <div
                      data-slot="timeline-row"
                      data-status={row.status}
                      aria-label={rowName(row, formatDate, labels)}
                      {...item}
                      {...open}
                      onKeyDown={(event) => {
                        open.onKeyDown?.(event);
                        if (onOpen) nav.onKeyDown(event);
                      }}
                      className={cn(
                        "flex items-start gap-2 rounded-item px-2 py-2",
                        onOpen && "cursor-pointer state-layer",
                      )}
                    >
                      {row.leading ? (
                        <span
                          aria-hidden
                          className="flex h-5 shrink-0 items-center"
                        >
                          {row.leading}
                        </span>
                      ) : null}
                      <span
                        aria-hidden
                        className="flex min-w-0 flex-1 flex-col gap-0.5"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="min-w-0 truncate text-sm font-medium">
                            {row.label}
                          </span>
                          {row.sublabel ? (
                            <span className="min-w-0 shrink-[3] truncate text-xs text-muted-foreground">
                              {row.sublabel}
                            </span>
                          ) : null}
                        </span>
                        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                          <span
                            data-slot="timeline-swatch"
                            className={cn(
                              "h-1.5 w-3 shrink-0 rounded-full",
                              BAR[row.status],
                            )}
                          />
                          <span className="truncate">
                            {row.statusLabel ?? labels.status[row.status]} ·{" "}
                            {datesInWords(row, formatDate, labels)}
                          </span>
                        </span>
                        {next ? (
                          <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                            <MilestoneGlyph
                              state={next.state}
                              size={14}
                              label={null}
                            />
                            <span className="truncate">
                              {next.label} · {formatDate(next.date)}
                            </span>
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
