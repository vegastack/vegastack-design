// @vegastack relative-time@0.25.0 sha256-AkSeOh2JtDUfjLfwPB+sljQypXZjVlTVwZfhW9vTFOQ=

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
  DEFAULT_LOCALE,
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

const ReferenceClockContext = React.createContext<number | undefined>(
  undefined,
);
let liveClock = 0;
let clockTimer: ReturnType<typeof setInterval> | undefined;
const clockListeners = new Set<() => void>();
const CLOCK_TICK = 10_000;
function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  liveClock = Date.now();
  if (!clockTimer)
    clockTimer = setInterval(() => {
      liveClock = Date.now();
      for (const notify of clockListeners) notify();
    }, CLOCK_TICK);
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0) {
      clearInterval(clockTimer);
      clockTimer = undefined;
      // A later mount must not render its first frame from this stale epoch.
      liveClock = 0;
    }
  };
}
const noClockSubscription = () => () => {};

/**
 * The client clock as one render reads it. While no timer runs, a fresh instant is cached for one
 * tick, so a component mounted after every other date left still starts from the real time (and
 * repeated `getSnapshot` calls inside one render agree).
 */
function readClock(): number {
  if (clockListeners.size === 0) {
    const now = Date.now();
    if (!liveClock || now - liveClock >= CLOCK_TICK) liveClock = now;
  }
  return liveClock;
}

/** How coarse a label's clock may be: seconds-level near now, quarter-hours for day-level labels. */
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
function clockGranularity(distance: number | undefined): number {
  if (distance === undefined) return CLOCK_TICK;
  if (distance < HOUR) return CLOCK_TICK;
  if (distance < 24 * HOUR) return MINUTE;
  return 15 * MINUTE;
}

/** `false` on the server and during hydration, `true` from the first client render after it. */
function useHydrated(): boolean {
  return React.useSyncExternalStore(
    noClockSubscription,
    () => true,
    () => false,
  );
}

/**
 * The instant to format against: `TimeZoneProvider.referenceNow` on the server and during
 * hydration (so both renders agree), the live clock after it. Controlled timestamps may stand
 * the subscription down. `granularity` only decides how OFTEN a label re-renders — a label that
 * can only change once a minute (or a quarter hour) wakes on that boundary rather than on every
 * ten-second tick — while the label itself is always formatted against the real instant.
 */
function useDateTimeClock(
  enabled: boolean,
  granularity: number = CLOCK_TICK,
): number | undefined {
  const referenceNow = React.useContext(ReferenceClockContext);
  const hydrated = useHydrated();
  React.useSyncExternalStore(
    enabled ? subscribeClock : noClockSubscription,
    () => {
      const now = readClock();
      return granularity > CLOCK_TICK
        ? Math.floor(now / granularity) * granularity
        : now;
    },
    () => referenceNow,
  );
  return hydrated ? readClock() : referenceNow;
}

/**
 * The clock-free form of a timestamp, for a server render with no `referenceNow`: an absolute
 * date (no Today/Yesterday words, no year decision), so crawler and no-JS HTML still carry the
 * date. With no explicit or provider zone it formats in UTC on BOTH the server and the hydration
 * render — a runtime's own zone would differ between them (Oct 3 on a UTC server, Oct 2 in Los
 * Angeles) — and the browser's local zone takes over once hydrated.
 */
function clockFreeLabel(
  target: Date,
  variant: "date" | "datetime" | "time",
  options: FormatDateOptions & FormatDateTimeOptions,
): string {
  const opts = { ...options, timeZone: options.timeZone ?? "UTC", now: target };
  if (variant === "time") return formatTimeOfDay(target, opts);
  if (variant === "datetime")
    return formatDateTime(target, { ...opts, relativeDay: false });
  return formatDate(target, { ...opts, absolute: true });
}

/**
 * The shared live reference instant as epoch milliseconds. SSR and hydration use
 * `TimeZoneProvider.referenceNow`; without it, the value is undefined until the browser
 * subscribes. Grouping, badges and date-picker presets can follow the same clock as RelativeTime
 * without creating another timer. The instant is zone-independent; format in the effective zone.
 *
 * @example
 * const now = useDateTimeNow();
 * return now === undefined ? null : <RelativeTime date={updatedAt} now={now} />;
 */
export function useDateTimeNow(): number | undefined {
  return useDateTimeClock(true);
}

/**
 * `TimeZoneProvider` — hand every date component (and `useTimeZone`) the viewer's zone. On the
 * server, read it with `getTimeZone(cookies().get("tz")?.value, config.orgTimeZone)`.
 *
 * @example
 * <TimeZoneProvider timeZone={timeZone}>{children}</TimeZoneProvider>
 */
export function TimeZoneProvider({
  timeZone,
  referenceNow,
  children,
}: {
  timeZone: string;
  /** Request timestamp serialized with the page, for stable relative SSR and hydration. */
  referenceNow?: number;
  children: React.ReactNode;
}) {
  return (
    <TimeZoneContext.Provider value={timeZone}>
      <ReferenceClockContext.Provider value={referenceNow}>
        {children}
      </ReferenceClockContext.Provider>
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
   * Auto-refresh from the shared ten-second clock. No per-row timer is created.
   * Ignored when `now` is provided.
   * @default true
   */
  refresh?: boolean;
  /**
   * BCP-47 locale(s) for `Intl` formatting: `mode="day"`'s words and dates, `format="long"` and
   * the tooltip. The compact `ago` form ("19m ago") is the house form in every locale. Defaults to
   * `DEFAULT_LOCALE` (`en-US`), never the runtime's, so the server and the browser render the same
   * text.
   * @default "en-US"
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
 * always present. Self-updating from one shared ten-second clock, including calendar-day rollover;
 * an absolute date-time is revealed in a Tooltip
 * by default. Purely presentational — text inherits color from its context.
 *
 * Supply `TimeZoneProvider.referenceNow` from the request to render the same relative
 * label on the server and during hydration. A shared live clock then keeps it fresh.
 * Without a request clock, only this date content shows a placeholder until hydration.
 * Pass `now` for a fully controlled, deterministic clock.
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
  locale = DEFAULT_LOCALE,
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

  const referenceNow = React.useContext(ReferenceClockContext);
  // `refresh={false}` freezes at MOUNT time, not at the provider's (possibly hours-old) request
  // instant: the reference only carries the server render and hydration.
  const [mountedAt, setMountedAt] = React.useState<number | undefined>();
  React.useEffect(() => {
    if (!isControlled && !refresh) setMountedAt(Date.now());
  }, [isControlled, refresh]);
  // The cadence follows the LIVE distance once hydrated: a future instant that started hours away
  // still ticks every ten seconds as it arrives.
  const hydrated = useHydrated();
  const base = hydrated ? readClock() : referenceNow;
  const distance =
    Number.isNaN(targetMs) || base === undefined
      ? undefined
      : Math.abs(targetMs - base);
  const clock =
    useDateTimeClock(
      !isControlled && refresh,
      mode === "day" ? 15 * MINUTE : clockGranularity(distance),
    ) ?? 0;

  // `mode="day"`'s "today" / "yesterday" / "tomorrow" words.
  const rtf = React.useMemo(
    () => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }),
    [localeKey], // eslint-disable-line react-hooks/exhaustive-deps -- locale array compared by joined key
  );
  const agoStyle = format ?? (unitStyle === "long" ? "long" : "suffix");

  const nowMs = isControlled
    ? now
    : refresh
      ? clock
      : (mountedAt ?? referenceNow ?? 0);
  const nowDate = React.useMemo(() => new Date(nowMs), [nowMs]);

  const isValid = !Number.isNaN(targetMs);
  const isPendingHydration = !isControlled && !nowMs;
  const label = !isValid
    ? ""
    : isPendingHydration
      ? clockFreeLabel(target, withTime ? "datetime" : "date", {
          timeZone,
          locale: Array.isArray(locale) ? locale[0] : locale,
        })
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
   * An explicit `options.now` controls the reference; otherwise the provider/shared clock is live.
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
 * absolute time in a hover Tooltip. Uses the shared request/live clock unless `options.now` is set.
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
  // A time of day and an `absolute` date never need a clock; the rest re-render at most every
  // quarter hour (their words change at midnight, their year on New Year's).
  const needsClock =
    options?.now === undefined && variant !== "time" && !options?.absolute;
  const clock = useDateTimeClock(needsClock, 15 * 60_000);
  const referenceNow = options?.now ?? clock;
  const opts = { ...options, timeZone, now: referenceNow };
  const label = !valid
    ? ""
    : referenceNow === undefined
      ? clockFreeLabel(target, variant, opts)
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
 * The shared request/live clock keeps the label and tone current across midnight in the viewer zone.
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
  // Due labels change at the viewer's midnight, so a quarter-hour bucket is fine-grained enough.
  const now = useDateTimeClock(true, 15 * 60_000);
  const { label, tone }: { label: string; tone: DueTone } = !valid
    ? { label: "", tone: "normal" }
    : now === undefined
      ? {
          label: `Due ${clockFreeLabel(target, "date", { timeZone })}`,
          tone: "normal",
        }
      : formatDueLabel(target, { timeZone, now });
  const el = (
    <time
      data-slot="due-label"
      data-tone={tone}
      dateTime={valid ? target.toISOString() : undefined}
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
