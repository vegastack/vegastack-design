// @vegastack relative-time@0.23.41 sha256-MO5iZ7SCcL/JMn41cNXN7VsI3EWOjDa0MGItG7Czxbs=

"use client";

import * as React from "react";
import { TIMINGS } from "@vegastack/design";
import { cn } from "@vegastack/design";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTruncationFocusable } from "@/components/ui/truncated-text";
import {
  TIME_ZONE_COOKIE_SCRIPT,
  formatDate,
  formatDateTime,
  formatDueLabel,
  formatDuration,
  formatRelative,
  formatTimeOfDay,
  formatTooltip,
  type DueTone,
  type FormatDateOptions,
  type FormatDateTimeOptions,
  type FormatRelativeOptions,
} from "@/lib/date-time";

/** The viewer's IANA zone, provided once at the root. */
const TimeZoneContext = React.createContext<string | undefined>(undefined);

/**
 * `TimeZoneProvider` — hand every date component (and `useTimeZone`) the viewer's zone. On the
 * server, read it with `getTimeZone(cookies().get("tz")?.value, config.orgTimeZone)`.
 *
 * @example
 * <TimeZoneProvider timeZone={timeZone}>{children}</TimeZoneProvider>
 */
export function TimeZoneProvider({
  timeZone,
  children,
}: {
  timeZone: string;
  children: React.ReactNode;
}) {
  return (
    <TimeZoneContext.Provider value={timeZone}>
      {children}
    </TimeZoneContext.Provider>
  );
}

/** The zone from the nearest `TimeZoneProvider`, or `undefined` (the runtime's zone). */
export function useTimeZone(): string | undefined {
  return React.useContext(TimeZoneContext);
}

/**
 * `TimeZoneScript` — a tiny inline script that writes the browser's zone to the `tz` cookie (and
 * rewrites it when the tab becomes visible again), so server renders use the viewer's zone. Render
 * once in the root layout's `<head>` or `<body>`.
 *
 * @example
 * <head>
 *   <TimeZoneScript />
 * </head>
 */
export function TimeZoneScript({ nonce }: { nonce?: string }) {
  return (
    <script
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: TIME_ZONE_COOKIE_SCRIPT }}
    />
  );
}

/** Parse a `Date | string | number` input into a `Date`. */
function toDate(date: Date | string | number): Date {
  return date instanceof Date ? date : new Date(date);
}

/** Milliseconds per unit — named so the unit-picker reads clearly. */
const MS = {
  second: 1_000,
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
  month: 2_592_000_000,
  year: 31_536_000_000,
} as const;

/**
 * The calendar day an instant falls on, as `[year, month, day]` — in `timeZone` when one is
 * given (through `Intl`, so it is the zone's own wall-clock date), else in the runtime's zone.
 * Every day comparison and the same-year check go through this, so the label, the tooltip and
 * the server render all agree on which day "today" is.
 */
function calendarDay(
  d: Date,
  timeZone: string | undefined,
): [number, number, number] {
  if (!timeZone) return [d.getFullYear(), d.getMonth(), d.getDate()];
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(d);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return [part("year"), part("month") - 1, part("day")];
}

/** The default absolute-day format for `mode="day"`: `"March 15"`. */
const DEFAULT_DAY_FORMAT: Intl.DateTimeFormatOptions = {
  month: "long",
  day: "numeric",
};

/** The time-of-day format `withTime` appends: `"11:30 AM"`. */
const TIME_FORMAT: Intl.DateTimeFormatOptions = { timeStyle: "short" };

/**
 * Calendar-day label for the `day` mode: `"today"` / `"yesterday"` / `"tomorrow"`
 * for the adjacent days (via `Intl.RelativeTimeFormat`'s `numeric: 'auto'`), and
 * an absolute date for anything further out — `formatOptions` (default `"March 15"`), plus the
 * year when it is not the current one. `withTime` appends the time of day to either form.
 */
function formatDay(
  target: Date,
  now: Date,
  locale: string | string[] | undefined,
  rtf: Intl.RelativeTimeFormat,
  timeZone: string | undefined,
  formatOptions: Intl.DateTimeFormatOptions,
  withTime: boolean,
): string {
  const [ty, tm, td] = calendarDay(target, timeZone);
  const [ny, nm, nd] = calendarDay(now, timeZone);
  const dayDelta = Math.round(
    (Date.UTC(ty, tm, td) - Date.UTC(ny, nm, nd)) / MS.day,
  );
  const time = withTime
    ? new Intl.DateTimeFormat(locale, { ...TIME_FORMAT, timeZone }).format(
        target,
      )
    : "";

  if (Math.abs(dayDelta) <= 1) {
    // numeric: 'auto' yields "today"/"yesterday"/"tomorrow" for -1..1.
    const word = rtf.format(dayDelta, "day");
    return withTime ? `${word}, ${time}` : word;
  }
  const sameYear = ty === ny;
  // `dateStyle`/`timeStyle` cannot be combined with component fields (`Intl` throws), so a style
  // keeps its own year and takes the time as `timeStyle`.
  const styled = "dateStyle" in formatOptions || "timeStyle" in formatOptions;
  return new Intl.DateTimeFormat(locale, {
    ...formatOptions,
    ...(styled || sameYear || "year" in formatOptions
      ? {}
      : { year: "numeric" }),
    ...(withTime
      ? styled
        ? { timeStyle: formatOptions.timeStyle ?? "short" }
        : { hour: "numeric", minute: "2-digit" }
      : {}),
    timeZone: timeZone ?? formatOptions.timeZone,
  }).format(target);
}

/** Upper-case the first character, in the label's own locale (`"today"` → `"Today"`). */
function capitalizeFirst(
  text: string,
  locale: string | string[] | undefined,
): string {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

/**
 * The label rendered on the server and on the hydration render of an uncontrolled
 * instance: an absolute medium-form date (`"Mar 15, 2025"`).
 *
 * WHY (audit B2-05): a relative label needs `Date.now()`, which the server cannot
 * reproduce, so the previous build rendered an empty string until hydration — a
 * visible pop and a layout shift on every row of a list. This is derived from the
 * target instant ALONE, so the server HTML and the client's first render agree
 * byte-for-byte and the swap to the relative label is a text change inside a box
 * that already has the right size.
 */
function formatAbsolute(
  target: Date,
  locale: string | string[] | undefined,
  timeZone: string | undefined,
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone,
  }).format(target);
}

/**
 * Refresh cadence (ms) for a live timestamp, by age. Recent timestamps tick
 * faster (where the displayed value changes often), older ones slower.
 * `0` disables the timer.
 */
function tickInterval(deltaMs: number): number {
  const abs = Math.abs(deltaMs);
  if (abs < MS.hour) return 10_000; // < 1 hour: every 10s
  if (abs < MS.day) return 60_000; // < 1 day:  every 1min
  return 0; // ≥ 1 day: static, no timer needed
}

/** Props accepted by `RelativeTime`. */
export interface RelativeTimeProps extends Omit<
  React.ComponentPropsWithRef<"time">,
  "title" | "children"
> {
  /**
   * The instant to render, relative to `now`. Accepts a `Date`, an ISO string,
   * or an epoch-millisecond number.
   */
  date: Date | string | number;
  /**
   * Formatting mode.
   * - `ago`: duration-relative in the house compact form — `"now"`, `"19m ago"`, `"3h ago"`,
   *   `"2d ago"`, `"3w ago"`, `"5mo ago"`, `"1y ago"`, `"in 2d"`.
   * - `day`: calendar-relative — `"today"`, `"yesterday"`, else an absolute date.
   * @default 'ago'
   */
  mode?: "ago" | "day";
  /**
   * @deprecated Use `format`. `"long"` maps to `format="long"`; `"short"` and `"narrow"` map to
   * the default compact form — the Intl short style with its periods (`"19 min. ago"`) is gone.
   * @default undefined
   */
  unitStyle?: "long" | "short" | "narrow";
  /**
   * Reference instant the relative string is measured against, as epoch ms.
   * Defaults to the live clock (`Date.now()`); pass a fixed value to render
   * deterministically (tests, SSR snapshots, storybook).
   * @default Date.now()
   */
  now?: number;
  /**
   * Auto-refresh the displayed value on a timer while the date is recent (faster
   * near "now", off once it is a day old). Ignored when `now` is provided.
   * @default true
   */
  refresh?: boolean;
  /**
   * BCP-47 locale(s) for `Intl` formatting: `mode="day"`'s words and dates, `format="long"` and
   * the tooltip. The compact `ago` form ("19m ago") is the house form in every locale. Defaults to
   * the runtime locale.

   * @default undefined
   */
  locale?: string | string[];
  /**
   * IANA time zone (`"Asia/Kolkata"`) that decides the calendar day and every formatted date and
   * time — the `day` label, the server's first render and the tooltip — so a server in UTC and a
   * reader in IST agree on what "today" is. Defaults to the runtime's zone.

   * @default undefined
   */
  timeZone?: string;
  /**
   * `Intl.DateTimeFormat` options for the absolute date `mode="day"` shows beyond
   * yesterday/tomorrow — e.g. `{ day: "numeric", month: "short" }` for `"22 Sep"` in `en-IN`.
   * The year is added when the date is not in the current year, unless you set `year` yourself.
   * @default { month: "long", day: "numeric" }
   */
  formatOptions?: Intl.DateTimeFormatOptions;
  /**
   * Upper-case the label's first letter — `"Today"`, `"Yesterday"`, `"Now"` — for a label that
   * stands on its own rather than inside a sentence.
   * @default false
   */
  capitalize?: boolean;
  /**
   * In `mode="day"`, append the time of day: `"Today, 11:30 AM"`, or the absolute date with its
   * time. Ignored in `mode="ago"`.
   * @default false
   */
  withTime?: boolean;
  /**
   * Reveal the absolute date/time in a Tooltip on hover/focus.
   * - `true`: a localized full date-time (`"March 15, 2025, 2:30 PM"`).
   * - a string: your own label.
   * - `false`: no tooltip.
   * @default true
   */
  title?: boolean | string;
  /**
   * How long to wait (ms) before the tooltip opens on hover. Defaults to the
   * app-wide `TIMINGS.tooltipOpenDelayMs`. Ignored when `title` is `false`.
   * @default TIMINGS.tooltipOpenDelayMs
   */
  tooltipDelay?: number;
  /**
   * Whether the timestamp becomes a tab stop so keyboard users can open the
   * absolute-date Tooltip. Defaults to `true` standalone and to whatever a
   * `TruncationFocusProvider` sets — `false` under a grid or list host, where 50
   * rows would otherwise mean 50 extra tab stops on top of that host's own roving
   * focus (audit B2-04 / decision D9). The machine-readable `dateTime` attribute is
   * unaffected either way.

   * @default undefined
   */
  focusable?: boolean;
  /**
   * The `ago` label's form, from `formatRelative`: `suffix` ("19m ago", the house default),
   * `minimal` ("19m", for dense tables and chips) or `long` ("19 minutes ago", for sentences).
   * Every form reads "now" under a minute and carries no periods. Ignored in `mode="day"`.
   * @default 'suffix'
   */
  format?: FormatRelativeOptions["style"];
}

/**
 * `RelativeTime` — render an instant as a human-relative string (no date library). `mode="ago"`
 * gives the house compact form (`"now"`, `"19m ago"`, `"3h ago"`, `"2d ago"`, `"in 2d"`) with
 * the exact time in the hover; `mode="day"` gives calendar-relative copy (`"today"`,
 * `"yesterday"`, else an absolute date).
 *
 * Renders a semantic `<time dateTime>` so the machine-readable ISO timestamp is
 * always present. Self-updating: while the date is recent it refreshes on a timer
 * (off once it is a day old), and an absolute date-time is revealed in a Tooltip
 * by default. Purely presentational — text inherits color from its context.
 *
 * An uncontrolled instance renders the ABSOLUTE date (`"Mar 15, 2025"`) on the
 * server and on the hydration render, then swaps to the relative label once the
 * client clock is available. There is no empty frame and no layout jump — the
 * previous build rendered `""` until mount (audit B2-05). Pass `now` to make the
 * output fully deterministic and skip the swap entirely.
 *
 * @example
 * <RelativeTime date={comment.createdAt} />            // "2h ago"
 * <RelativeTime date={row.updatedAt} format="minimal" /> // "2h"
 * <RelativeTime date={dueDate} mode="day" />            // "tomorrow" / "March 15"
 * <RelativeTime date={ts} now={FIXED} refresh={false} /> // deterministic
 * <RelativeTime date={due} mode="day" capitalize timeZone="Asia/Kolkata" withTime />
 * // "Today, 11:30 AM" — the day decided in IST
 *
 * **Announcements (register P2-40, deliberate):** the periodic re-render is intentionally
 * SILENT to assistive tech — no `aria-live`. A ticking timestamp that announced every minute
 * would be noise; the absolute time is always available via the Tooltip (keyboard-reachable)
 * and the `dateTime` attribute. Wrap in your own `role="status"` region only if a specific
 * surface genuinely needs announced updates.
 */
export function RelativeTime({
  date,
  mode = "ago",
  unitStyle,
  now,
  refresh = true,
  locale,
  title = true,
  tooltipDelay = TIMINGS.tooltipOpenDelayMs,
  focusable,
  timeZone: timeZoneProp,
  format,
  formatOptions = DEFAULT_DAY_FORMAT,
  capitalize = false,
  withTime = false,
  className,
  ref,
  ...props
}: RelativeTimeProps) {
  const isFocusable = useTruncationFocusable(focusable);
  const contextZone = useTimeZone();
  const timeZone = timeZoneProp ?? contextZone;
  const target = React.useMemo(() => toDate(date), [date]);
  const targetMs = target.getTime();
  const localeKey = Array.isArray(locale) ? locale.join(",") : locale;

  // When `now` is provided the output is deterministic (no clock, no timer).
  const isControlled = now !== undefined;

  // Uncontrolled live time cannot be reproduced by the server at hydration.
  // Both sides start from the deterministic ABSOLUTE date (see `formatAbsolute`),
  // then the live relative label lands after mount. Controlled `now` output is
  // server-renderable as-is and never swaps.
  const [hydrated, setHydrated] = React.useState(isControlled);
  const [clock, setClock] = React.useState(() => now ?? 0);

  // `mode="day"`'s "today" / "yesterday" / "tomorrow" words.
  const rtf = React.useMemo(
    () => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }),
    [localeKey], // eslint-disable-line react-hooks/exhaustive-deps -- locale array compared by joined key
  );
  const agoStyle = format ?? (unitStyle === "long" ? "long" : "suffix");

  React.useEffect(() => {
    if (isControlled) return;
    setClock(Date.now());
    setHydrated(true);
    if (!refresh) return;
    // Resync clock on mount + reschedule adaptive tick. (set-state-in-effect is
    // intentional here; the rule is not enabled in @vegastack/eslint-config.)
    let timerId: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const interval = tickInterval(targetMs - Date.now());
      if (interval === 0) return; // old enough that the value no longer changes
      timerId = setTimeout(() => {
        setClock(Date.now());
        schedule();
      }, interval);
    };
    schedule();
    return () => clearTimeout(timerId);
  }, [isControlled, refresh, targetMs]);

  const nowMs = isControlled ? now : clock;
  const nowDate = React.useMemo(() => new Date(nowMs), [nowMs]);

  const isValid = !Number.isNaN(targetMs);
  const isPendingHydration = !isControlled && !hydrated;
  const label = !isValid
    ? ""
    : isPendingHydration
      ? formatAbsolute(target, locale, timeZone)
      : mode === "day"
        ? formatDay(
            target,
            nowDate,
            locale,
            rtf,
            timeZone,
            formatOptions,
            withTime,
          )
        : formatRelative(target, {
            now: nowMs,
            style: agoStyle,
            timeZone,
            locale: Array.isArray(locale) ? locale[0] : locale,
          });
  const display = capitalize ? capitalizeFirst(label, locale) : label;

  const isoString = isValid ? target.toISOString() : undefined;
  const hasTooltip = Boolean(title) && isValid;

  const timeEl = (
    <time
      ref={ref}
      data-slot="relative-time"
      data-mode={mode}
      dateTime={isoString}
      // When wrapped in a Tooltip the <time> becomes the trigger, and takes focus so
      // keyboard users can reveal the absolute date — unless a host with its own
      // roving focus turned that off (D9). No `aria-busy`: the pre-hydration render is
      // a real, readable absolute date, not a placeholder.
      tabIndex={hasTooltip && isFocusable ? 0 : undefined}
      className={cn(
        // A11Y-2: when the <time> is a tooltip trigger it is a real pointer target, so it owns a
        // real 24px box (`min-h-6`) instead of an invisible `::before` expansion. The pseudo
        // version lost the hit test wherever a denser neighbour's box overlapped the overflow —
        // measured in `geometry.browser.test.tsx`'s `timeline` fixture after Batch 2 tightened
        // Item's padding. A box the browser lays out cannot be out-painted the same way. A plain
        // label (`title={false}`) is not a target, so it stays inline text at the line's height.
        hasTooltip &&
          "relative inline-flex min-h-6 min-w-6 items-center justify-center rounded-sm",
        className,
      )}
      {...props}
    >
      {display}
    </time>
  );

  if (!hasTooltip) return timeEl;

  const tooltipLabel =
    typeof title === "string" ? title : formatTooltip(target, { timeZone });

  return (
    <TooltipProvider delay={tooltipDelay}>
      <Tooltip>
        <TooltipTrigger render={timeEl} />
        <TooltipContent>{tooltipLabel}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// DateTime, Duration, DueLabel
// ---------------------------------------------------------------------------

/** A tooltip trigger is a real pointer target: at least 24×24 (WCAG 2.5.8). */
const TRIGGER_BOX =
  "relative inline-flex min-h-6 min-w-6 items-center justify-center rounded-sm";

/** Wrap a `<time>` in the absolute-time Tooltip when `title` asks for one. */
function WithTooltip({
  title,
  label,
  children,
}: {
  title: boolean | string;
  label: string;
  children: React.ReactElement;
}) {
  if (!title) return children;
  return (
    <TooltipProvider delay={TIMINGS.tooltipOpenDelayMs}>
      <Tooltip>
        <TooltipTrigger render={children} />
        <TooltipContent>
          {typeof title === "string" ? title : label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Props accepted by `DateTime`. */
export interface DateTimeProps extends Omit<
  React.ComponentPropsWithRef<"time">,
  "title" | "children"
> {
  /** The instant — `Date`, ISO string or epoch ms. */
  date: Date | string | number;
  /**
   * - `date`: `formatDate` — "Today", "Mon", "Sep 25".
   * - `datetime`: `formatDateTime` — "Sep 25 · 2:30 PM".
   * - `time`: `formatTimeOfDay` — "2:30 PM".
   * @default 'date'
   */
  variant?: "date" | "datetime" | "time";
  /**
   * Extra formatter options (`looseFuture`, `absolute`, `separator`, `withYear`…).
   * @default undefined
   */
  options?: FormatDateOptions & FormatDateTimeOptions;
  /** Tooltip with the absolute time ("Sep 25, 2026 · 2:30 PM IST"); a string sets your own. @default true */
  title?: boolean | string;
  /**
   * IANA zone; defaults to the `TimeZoneProvider` zone.
   * @default undefined
   */
  timeZone?: string;
  /**
   * Whether the tooltip trigger takes a tab stop. Defaults to `true` standalone and to a
   * `TruncationFocusProvider`'s setting (off inside DataList/DataGrid rows).
   * @default undefined
   */
  focusable?: boolean;
}

/**
 * `DateTime` — a calendar date or date-time in the house format, as a semantic `<time>`, with the
 * absolute time in a hover Tooltip.
 *
 * @example
 * <DateTime date={task.createdAt} />                   // "Sep 25"
 * <DateTime date={log.at} variant="datetime" />        // "Today · 2:30 PM"
 */
export function DateTime({
  date,
  variant = "date",
  options,
  title = true,
  timeZone: timeZoneProp,
  focusable,
  className,
  ...props
}: DateTimeProps) {
  const isFocusable = useTruncationFocusable(focusable);
  const contextZone = useTimeZone();
  const timeZone = timeZoneProp ?? contextZone;
  const target = toDate(date);
  const valid = !Number.isNaN(target.getTime());
  const opts = { ...options, timeZone };
  const label = !valid
    ? ""
    : variant === "time"
      ? formatTimeOfDay(target, opts)
      : variant === "datetime"
        ? formatDateTime(target, opts)
        : formatDate(target, opts);
  const el = (
    <time
      data-slot="date-time"
      data-variant={variant}
      dateTime={valid ? target.toISOString() : undefined}
      suppressHydrationWarning
      tabIndex={title && valid && isFocusable ? 0 : undefined}
      className={cn(title && valid && TRIGGER_BOX, className)}
      {...props}
    >
      {label}
    </time>
  );
  return (
    <WithTooltip
      title={valid && title}
      label={valid ? formatTooltip(target, { timeZone }) : ""}
    >
      {el}
    </WithTooltip>
  );
}

/** Props accepted by `Duration`. */
export interface DurationProps extends Omit<
  React.ComponentPropsWithRef<"time">,
  "children"
> {
  /** The length, in `unit`s. */
  value: number;
  /** @default 'seconds' */
  unit?: "seconds" | "milliseconds";
  /**
   * "1:15:04" instead of "1h 15m" — players and timers.
   * @default false
   */
  clock?: boolean;
}

/**
 * `Duration` — a length of time: "42s", "2m", "1h 15m", "2d 3h" (two units at most), or a clock
 * ("1:15:04"). Renders `<time dateTime="PT…S">`.
 *
 * @example
 * <Duration value={meeting.durationSec} /> // "1h 15m"
 */
export function Duration({
  value,
  unit = "seconds",
  clock = false,
  className,
  ...props
}: DurationProps) {
  const seconds = Math.round(unit === "milliseconds" ? value / 1000 : value);
  return (
    <time
      data-slot="duration"
      dateTime={Number.isFinite(seconds) ? `PT${seconds}S` : undefined}
      className={className}
      {...props}
    >
      {formatDuration(value, { unit, clock })}
    </time>
  );
}

const DUE_TONE_CLASS: Record<DueTone, string> = {
  overdue: "text-destructive-text",
  soon: "text-warning-text",
  normal: "",
};

/** Props accepted by `DueLabel`. */
export interface DueLabelProps extends Omit<
  React.ComponentPropsWithRef<"time">,
  "title" | "children"
> {
  /** The due date. */
  date: Date | string | number;
  /** Tooltip with the absolute due time; a string sets your own. @default true */
  title?: boolean | string;
  /** Colour the label by tone (overdue red, soon amber). @default true */
  toned?: boolean;
  /**
   * IANA zone; defaults to the `TimeZoneProvider` zone.
   * @default undefined
   */
  timeZone?: string;
  /**
   * Whether the tooltip trigger takes a tab stop. Defaults to `true` standalone and to a
   * `TruncationFocusProvider`'s setting (off inside DataList/DataGrid rows).
   * @default undefined
   */
  focusable?: boolean;
}

/**
 * `DueLabel` — "Overdue 2d", "Due today", "Due tomorrow", "Due in 3d", "Due Sep 30", coloured by
 * tone. The tone is on `data-tone` for your own styling; `formatDueLabel` returns it too.
 *
 * @example
 * <DueLabel date={task.dueAt} /> // "Overdue 2d" in destructive ink
 */
export function DueLabel({
  date,
  title = true,
  toned = true,
  timeZone: timeZoneProp,
  focusable,
  className,
  ...props
}: DueLabelProps) {
  const isFocusable = useTruncationFocusable(focusable);
  const contextZone = useTimeZone();
  const timeZone = timeZoneProp ?? contextZone;
  const target = toDate(date);
  const valid = !Number.isNaN(target.getTime());
  const { label, tone } = formatDueLabel(target, { timeZone });
  const el = (
    <time
      data-slot="due-label"
      data-tone={tone}
      dateTime={valid ? target.toISOString() : undefined}
      suppressHydrationWarning
      tabIndex={title && valid && isFocusable ? 0 : undefined}
      className={cn(
        title && valid && TRIGGER_BOX,
        toned && DUE_TONE_CLASS[tone],
        className,
      )}
      {...props}
    >
      {label}
    </time>
  );
  return (
    <WithTooltip
      title={valid && title}
      label={valid ? formatTooltip(target, { timeZone }) : ""}
    >
      {el}
    </WithTooltip>
  );
}
