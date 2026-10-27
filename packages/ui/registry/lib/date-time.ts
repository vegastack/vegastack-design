// @vegastack date-time@0.25.89 sha256-eSksgmrM+7I/47IOMxPPdlghuAVmPf7U/ZZOCgQLiuw=

export type DateInput = Date | string | number;

/**
 * Dates & times — the one formatting module. Plain functions (server + client), built on `Intl`,
 * no date library. Shared rules:
 * - the year shows only when it is not the current year;
 * - a 12-hour clock with no leading zero ("9:04 AM");
 * - minimal units s/m/h/d/w/mo/y with no space before the unit ("2m", "3h");
 * - calendar days are decided in `timeZone` (the viewer's zone), else the runtime's;
 * - anything under 45 seconds reads "now".
 *
 * This comment sits below the first statement on purpose: `shadcn add` drops every comment
 * before a file's first statement, so a module doc placed first never reaches the consumer.
 */

/** Options every formatter takes. */
export interface DateTimeOptions {
  /** IANA zone that decides the calendar day and the clock. Defaults to the runtime zone. */
  timeZone?: string;
  /** BCP-47 locale. English only for now. @default "en-US" */
  locale?: string;
  /** Reference instant (epoch ms or Date). @default Date.now() */
  now?: DateInput;
}

const SEC = 1_000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;
const NOW_THRESHOLD = 45 * SEC;
/**
 * The locale every DS date formatter uses when none is passed: fixed, never the runtime's, so a
 * server and a browser in different locales render the same text (no hydration mismatch).
 *
 * @example
 * new Intl.DateTimeFormat(locale ?? DEFAULT_LOCALE, options);
 */
export const DEFAULT_LOCALE = "en-US";

/** Parse `Date | ISO string | epoch ms` into a `Date`. */
export function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

function nowMs(now: DateInput | undefined): number {
  return now === undefined ? Date.now() : toDate(now).getTime();
}

/** Browsers emit U+202F / U+2009 inside times ("2:30 PM"); normalise to plain spaces. */
function clean(text: string): string {
  return text.replace(/[\u202f\u00a0]/g, " ").replace(/\u2009/g, " ");
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();
function dtf(
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale ?? ""}|${JSON.stringify(options)}`;
  let f = formatterCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale ?? DEFAULT_LOCALE, options);
    formatterCache.set(key, f);
  }
  return f;
}

/** The calendar day of an instant in `timeZone`, as `[year, monthIndex, day]`. */
function calendarDay(d: Date, timeZone?: string): [number, number, number] {
  const parts = dtf("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(d);
  const part = (t: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === t)?.value);
  return [part("year"), part("month") - 1, part("day")];
}

/**
 * The calendar day `timeZone` is on at `now`, as a LOCAL-midnight `Date` — the date model a
 * calendar grid uses. "Today" for a viewer whose zone differs from the runtime's.
 */
export function zonedToday(
  now: DateInput = Date.now(),
  timeZone?: string,
): Date {
  const [y, m, d] = calendarDay(toDate(now), timeZone);
  return new Date(y, m, d);
}

/** Whole calendar days from `now` to `date` in `timeZone` (0 = today, -1 = yesterday). */
export function dayDelta(
  date: DateInput,
  { now, timeZone }: DateTimeOptions = {},
): number {
  const [ty, tm, td] = calendarDay(toDate(date), timeZone);
  const [ny, nm, nd] = calendarDay(new Date(nowMs(now)), timeZone);
  return Math.round((Date.UTC(ty, tm, td) - Date.UTC(ny, nm, nd)) / DAY);
}

function isCurrentYear(date: Date, opts: DateTimeOptions): boolean {
  return (
    calendarDay(date, opts.timeZone)[0] ===
    calendarDay(new Date(nowMs(opts.now)), opts.timeZone)[0]
  );
}

/** "Sep 25", or "Dec 20, 2026" outside the current year. */
function monthDay(
  date: Date,
  opts: DateTimeOptions,
  withYear?: boolean,
): string {
  const year = withYear ?? !isCurrentYear(date, opts);
  return clean(
    dtf(opts.locale, {
      month: "short",
      day: "numeric",
      ...(year ? { year: "numeric" } : {}),
      timeZone: opts.timeZone,
    }).format(date),
  );
}

// ---------------------------------------------------------------------------
// Relative
// ---------------------------------------------------------------------------

export interface FormatRelativeOptions extends DateTimeOptions {
  /**
   * - `minimal` (default): "2m", "3h", "in 2d" — tables, feeds, chips.
   * - `suffix`: "2m ago" — where "2m" alone is ambiguous.
   * - `long`: "2 minutes ago" — sentences and screen-reader copy.
   */
  style?: "minimal" | "suffix" | "long";
}

const UNITS: ReadonlyArray<
  readonly [ms: number, short: string, unit: Intl.RelativeTimeFormatUnit]
> = [
  [YEAR, "y", "year"],
  [MONTH, "mo", "month"],
  [WEEK, "w", "week"],
  [DAY, "d", "day"],
  [HOUR, "h", "hour"],
  [MIN, "m", "minute"],
  [SEC, "s", "second"],
];

function pickUnit(absMs: number) {
  for (const u of UNITS) if (absMs >= u[0]) return u;
  return UNITS[UNITS.length - 1]!;
}

/**
 * Whole units in a span. The past counts completed units ("6 days ago" until the seventh is
 * over); the future rounds to the nearest, so a deadline set 7 days out reads "in 7 days" the
 * moment after, not "in 6 days".
 */
function unitCount(absMs: number, ms: number, future: boolean): number {
  return Math.max(1, (future ? Math.round : Math.floor)(absMs / ms));
}

/** Minimal unit string for a positive span: "2m", "3h", "5d", "1w", "2mo", "1y". */
function shortSpan(absMs: number, future = false): string {
  const [ms, short] = pickUnit(absMs);
  return `${unitCount(absMs, ms, future)}${short}`;
}

/** Relative time: now · 2m · 3h · 5d · 1w · 2mo · 1y · in 2d. */
export function formatRelative(
  date: DateInput,
  options: FormatRelativeOptions = {},
): string {
  const target = toDate(date).getTime();
  if (Number.isNaN(target)) return "";
  const delta = target - nowMs(options.now);
  const abs = Math.abs(delta);
  const style = options.style ?? "minimal";
  if (abs < NOW_THRESHOLD) return "now";
  if (style === "long") {
    const [ms, , unit] = pickUnit(abs);
    const n = unitCount(abs, ms, delta > 0);
    return new Intl.RelativeTimeFormat(options.locale ?? DEFAULT_LOCALE, {
      numeric: "always",
    }).format(delta < 0 ? -n : n, unit);
  }
  const span = shortSpan(abs, delta > 0);
  if (delta > 0) return `in ${span}`;
  return style === "suffix" ? `${span} ago` : span;
}

// ---------------------------------------------------------------------------
// Duration
// ---------------------------------------------------------------------------

export interface FormatDurationOptions {
  /** "1:15:04" / "4:05" instead of "1h 15m". Wins over `style`. */
  clock?: boolean;
  /**
   * - `minimal` (default): "1h 15m", "7d" — tables, chips, headers.
   * - `long`: "1 hour 15 minutes", "7 days" — sentences, emails and screen-reader copy.
   */
  style?: "minimal" | "long";
  /** The input unit. @default "seconds" */
  unit?: "seconds" | "milliseconds";
}

const LONG_UNITS = {
  d: ["day", "days"],
  h: ["hour", "hours"],
  m: ["minute", "minutes"],
  s: ["second", "seconds"],
} as const;

/**
 * Duration: 42s · 2m · 1h 15m · 1h · 2d 3h (at most two units). Clock: 1:15:04.
 * Long: 42 seconds · 1 hour 15 minutes · 7 days.
 */
export function formatDuration(
  value: number,
  options: FormatDurationOptions = {},
): string {
  if (!Number.isFinite(value)) return "";
  const total = Math.max(
    0,
    Math.round(options.unit === "milliseconds" ? value / 1000 : value),
  );
  const d = Math.floor(total / 86_400);
  const h = Math.floor((total % 86_400) / 3_600);
  const m = Math.floor((total % 3_600) / 60);
  const s = total % 60;
  if (options.clock) {
    const hours = d * 24 + h;
    const mm = hours > 0 ? String(m).padStart(2, "0") : String(m);
    const ss = String(s).padStart(2, "0");
    return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
  }
  const unit = (n: number, key: keyof typeof LONG_UNITS) =>
    options.style === "long"
      ? `${n} ${LONG_UNITS[key][n === 1 ? 0 : 1]}`
      : `${n}${key}`;
  if (d > 0) return h > 0 ? `${unit(d, "d")} ${unit(h, "h")}` : unit(d, "d");
  if (h > 0) return m > 0 ? `${unit(h, "h")} ${unit(m, "m")}` : unit(h, "h");
  if (m > 0) return unit(m, "m");
  return unit(s, "s");
}

// ---------------------------------------------------------------------------
// Calendar days
// ---------------------------------------------------------------------------

/** `YYYY-MM-DD` — a calendar day as stored: a date with no time and no zone (a due date). */
const CALENDAR_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Midnight UTC of a day; `Date.UTC` alone would read years 0–99 as 1900–1999. */
function utcMidnight(y: number, m: number, d: number): Date {
  const date = new Date(0);
  date.setUTCFullYear(y, m, d);
  return date;
}

/** A `YYYY-MM-DD` string's year, month index and day, or `null` when it names no real day. */
function calendarDayParts(isoDay: string): [number, number, number] | null {
  const match = CALENDAR_DAY.exec(isoDay);
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])];
  // Year 0000 has no Common Era day to name (Intl would write it as year 1).
  if (y < 1) return null;
  const utc = utcMidnight(y, m, d);
  return utc.getUTCFullYear() === y &&
    utc.getUTCMonth() === m &&
    utc.getUTCDate() === d
    ? [y, m, d]
    : null;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * A calendar day (`"2026-10-08"`) as a LOCAL-midnight `Date` — the date model a calendar grid and
 * `DatePicker` use — with no zone shift. `undefined` for an empty, malformed or impossible day
 * (`"2026-02-30"`).
 *
 * @example
 * parseCalendarDay("2026-10-08"); // Thu Oct 08 2026 00:00 (local)
 */
export function parseCalendarDay(isoDay: string): Date | undefined {
  const parts = calendarDayParts(isoDay);
  if (!parts) return undefined;
  // Local midnight, set field by field so years 0–99 stay themselves.
  const date = new Date(2000, 0, 1);
  date.setFullYear(parts[0], parts[1], parts[2]);
  return date;
}

/**
 * The calendar day of `value`, as `"YYYY-MM-DD"`. A `Date` without `timeZone` gives its LOCAL day
 * (the day a date picker chose: no zone shift); with `timeZone`, the day the instant falls on
 * there ("today" for a viewer). A `"YYYY-MM-DD"` string is checked and returned as is. `""` for
 * anything invalid.
 *
 * @example
 * toCalendarDay(parseCalendarDay("2026-10-08")!); // "2026-10-08"
 * toCalendarDay("2026-10-08T10:30:00Z", { timeZone: "Pacific/Tongatapu" }); // "2026-10-08"
 */
export function toCalendarDay(
  value: DateInput,
  { timeZone }: Pick<DateTimeOptions, "timeZone"> = {},
): string {
  if (typeof value === "string" && CALENDAR_DAY.test(value))
    return calendarDayParts(value) ? value : "";
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  const [y, m, d] = timeZone
    ? calendarDay(date, timeZone)
    : [date.getFullYear(), date.getMonth(), date.getDate()];
  return `${String(y).padStart(4, "0")}-${pad2(m + 1)}-${pad2(d)}`;
}

/** How `formatCalendarDate` writes a day. */
export interface FormatCalendarDateOptions {
  /** BCP-47 locale. @default "en-US" */
  locale?: string;
  /**
   * `short` "Oct 8, 2026" · `long` "October 8, 2026" · `numeric` "10/8/2026" (each in `locale`'s
   * order). The year always shows: a stored day has no "now" to drop it against.
   * @default "short"
   */
  format?: "short" | "long" | "numeric";
}

const CALENDAR_FORMATS: Record<
  NonNullable<FormatCalendarDateOptions["format"]>,
  Intl.DateTimeFormatOptions
> = {
  short: { year: "numeric", month: "short", day: "numeric" },
  long: { year: "numeric", month: "long", day: "numeric" },
  numeric: { year: "numeric", month: "numeric", day: "numeric" },
};

/**
 * A calendar day (`"2026-10-08"`) for display — the same day for every viewer, whatever their
 * zone (it is formatted as the day it names, never as an instant). `""` for an invalid day.
 *
 * @example
 * formatCalendarDate("2026-10-08"); // "Oct 8, 2026"
 * formatCalendarDate("2026-10-08", { locale: "en-GB", format: "long" }); // "8 October 2026"
 */
export function formatCalendarDate(
  isoDay: string,
  { locale, format = "short" }: FormatCalendarDateOptions = {},
): string {
  const parts = calendarDayParts(isoDay);
  if (!parts) return "";
  return clean(
    dtf(locale, { ...CALENDAR_FORMATS[format], timeZone: "UTC" }).format(
      utcMidnight(parts[0], parts[1], parts[2]),
    ),
  );
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

export interface FormatDateOptions extends DateTimeOptions {
  /** Future dates past a week read loosely: "in 2 weeks", "in 3 months". */
  looseFuture?: boolean;
  /** Skip Today/Yesterday/weekday words and always print the date. */
  absolute?: boolean;
}

/** Date: Today · Tomorrow · Yesterday · Mon · Last Fri · Sep 25 · Dec 20, 2026. */
export function formatDate(
  date: DateInput,
  options: FormatDateOptions = {},
): string {
  const target = toDate(date);
  if (Number.isNaN(target.getTime())) return "";
  if (options.absolute) return monthDay(target, options);
  const delta = dayDelta(target, options);
  if (delta === 0) return "Today";
  if (delta === 1) return "Tomorrow";
  if (delta === -1) return "Yesterday";
  if (Math.abs(delta) <= 6) {
    const weekday = clean(
      dtf(options.locale, {
        weekday: "short",
        timeZone: options.timeZone,
      }).format(target),
    );
    return delta < 0 ? `Last ${weekday}` : weekday;
  }
  if (options.looseFuture && delta > 6) {
    const rtf = new Intl.RelativeTimeFormat(options.locale ?? DEFAULT_LOCALE, {
      numeric: "always",
    });
    if (delta < 30) return rtf.format(Math.round(delta / 7), "week");
    if (delta < 365) return rtf.format(Math.round(delta / 30), "month");
    return rtf.format(Math.round(delta / 365), "year");
  }
  return monthDay(target, options);
}

/**
 * Long date for page headers and greetings: "Thursday, September 24" — with the year outside the
 * current year ("Thursday, September 24, 2025"). The day/month order follows `locale`:
 * `en-IN` / `en-GB` read "Thursday, 24 September".
 */
export function formatLongDate(
  date: DateInput,
  options: DateTimeOptions = {},
): string {
  const target = toDate(date);
  if (Number.isNaN(target.getTime())) return "";
  const weekday = clean(
    dtf(options.locale, {
      weekday: "long",
      timeZone: options.timeZone,
    }).format(target),
  );
  const day = clean(
    dtf(options.locale, {
      month: "long",
      day: "numeric",
      ...(isCurrentYear(target, options) ? {} : { year: "numeric" }),
      timeZone: options.timeZone,
    }).format(target),
  );
  return `${weekday}, ${day}`;
}

/** The hour (0–23) on the clock of `timeZone` — for greetings and working-hours checks. */
export function hourOfDay(
  date: DateInput,
  options: Pick<DateTimeOptions, "timeZone"> = {},
): number {
  const target = toDate(date);
  if (Number.isNaN(target.getTime())) return Number.NaN;
  const hour = dtf("en-US", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone: options.timeZone,
  })
    .formatToParts(target)
    .find((p) => p.type === "hour")?.value;
  return Number(hour);
}

/** Time of day: 2:30 PM. */
export function formatTimeOfDay(
  date: DateInput,
  options: DateTimeOptions = {},
): string {
  const target = toDate(date);
  if (Number.isNaN(target.getTime())) return "";
  return clean(
    dtf(options.locale, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: options.timeZone,
    }).format(target),
  );
}

/** The short zone name for tooltips: "IST", "PDT", else "GMT+5:30". */
export function timeZoneAbbreviation(
  date: DateInput,
  timeZone?: string,
): string {
  const target = toDate(date);
  const name = (locale: string) =>
    dtf(locale, { timeZone, timeZoneName: "short" })
      .formatToParts(target)
      .find((p) => p.type === "timeZoneName")?.value ?? "";
  const us = name("en-US");
  if (!us.startsWith("GMT")) return us;
  const inLocale = name("en-IN");
  return inLocale && !inLocale.startsWith("GMT") ? inLocale : us;
}

export interface FormatDateTimeOptions extends DateTimeOptions {
  /** `dot` (default) for compact displays; `comma` inside sentences. */
  separator?: "dot" | "comma";
  /** Say Today/Yesterday/Tomorrow for adjacent days. @default true */
  relativeDay?: boolean;
  /** Always print the year. */
  withYear?: boolean;
  /** Append the zone ("IST") — for tooltips. */
  withZone?: boolean;
}

/** Date and time: "Sep 25 · 2:30 PM", "Sep 25, 2024 · 9:04 AM", "Today · 2:30 PM". */
export function formatDateTime(
  date: DateInput,
  options: FormatDateTimeOptions = {},
): string {
  const target = toDate(date);
  if (Number.isNaN(target.getTime())) return "";
  const delta = options.relativeDay === false ? 99 : dayDelta(target, options);
  const day =
    !options.withYear && Math.abs(delta) <= 1
      ? delta === 0
        ? "Today"
        : delta === 1
          ? "Tomorrow"
          : "Yesterday"
      : monthDay(target, options, options.withYear || undefined);
  const time = formatTimeOfDay(target, options);
  const zone = options.withZone
    ? ` ${timeZoneAbbreviation(target, options.timeZone)}`
    : "";
  const sep = options.separator === "comma" ? ", " : " · ";
  return `${day}${sep}${time}${zone}`;
}

/** The absolute tooltip label: "Sep 25, 2026 · 2:30 PM IST". */
export function formatTooltip(
  date: DateInput,
  options: DateTimeOptions = {},
): string {
  return formatDateTime(date, {
    ...options,
    relativeDay: false,
    withYear: true,
    withZone: true,
  });
}

export interface FormatDateRangeOptions extends DateTimeOptions {
  /** Include times. @default true when both ends fall on the same day */
  withTime?: boolean;
}

/** Hour label that drops ":00" inside ranges: "2", "3:30". */
function rangeClock(date: Date, opts: DateTimeOptions) {
  const parts = dtf(opts.locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: opts.timeZone,
  }).formatToParts(date);
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value ?? "";
  const minute = get("minute");
  return {
    clock: minute === "00" ? get("hour") : `${get("hour")}:${minute}`,
    period: get("dayPeriod"),
  };
}

/** Range: Sep 25 · 2–3:30 PM · Sep 25–28 · Sep 25 – Oct 3 · Dec 28, 2026 – Jan 4, 2027. */
export function formatDateRange(
  start: DateInput,
  end: DateInput,
  options: FormatDateRangeOptions = {},
): string {
  const a = toDate(start);
  const b = toDate(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return "";
  const [ay, am] = calendarDay(a, options.timeZone);
  const [by, bm] = calendarDay(b, options.timeZone);
  const sameDay = dayDelta(b, { ...options, now: a }) === 0;
  const withTime = options.withTime ?? sameDay;
  const nowYear = calendarDay(
    new Date(nowMs(options.now)),
    options.timeZone,
  )[0];
  const showYear = ay !== nowYear || by !== nowYear;

  if (sameDay) {
    const day = monthDay(a, options, showYear);
    if (!withTime) return day;
    const s = rangeClock(a, options);
    const e = rangeClock(b, options);
    const time =
      s.period === e.period
        ? `${s.clock}–${e.clock} ${e.period}`
        : `${s.clock} ${s.period} – ${e.clock} ${e.period}`;
    return `${day} · ${time}`;
  }
  if (withTime) {
    const f = (d: Date) =>
      formatDateTime(d, { ...options, relativeDay: false, withYear: showYear });
    return `${f(a)} – ${f(b)}`;
  }
  if (ay === by && am === bm) {
    const endDay = calendarDay(b, options.timeZone)[2];
    const head = monthDay(a, options, false);
    return showYear ? `${head}–${endDay}, ${ay}` : `${head}–${endDay}`;
  }
  if (ay === by) {
    const tail = showYear ? `, ${ay}` : "";
    return `${monthDay(a, options, false)} – ${monthDay(b, options, false)}${tail}`;
  }
  return `${monthDay(a, options, true)} – ${monthDay(b, options, true)}`;
}

// ---------------------------------------------------------------------------
// Due labels
// ---------------------------------------------------------------------------

export type DueTone = "overdue" | "soon" | "normal";

export interface DueLabel {
  label: string;
  tone: DueTone;
}

/** Due chip: Overdue 2d · Due today · Due tomorrow · Due in 3d · Due Sep 30, with a tone. */
export function formatDueLabel(
  due: DateInput,
  options: DateTimeOptions = {},
): DueLabel {
  const target = toDate(due);
  if (Number.isNaN(target.getTime())) return { label: "", tone: "normal" };
  const delta = dayDelta(target, options);
  if (delta < 0) {
    return { label: `Overdue ${shortSpan(-delta * DAY)}`, tone: "overdue" };
  }
  if (delta === 0) return { label: "Due today", tone: "soon" };
  if (delta === 1) return { label: "Due tomorrow", tone: "soon" };
  if (delta <= 6) return { label: `Due in ${delta}d`, tone: "normal" };
  return { label: `Due ${monthDay(target, options)}`, tone: "normal" };
}

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

export type DayGroupKey =
  "today" | "yesterday" | "this-week" | "last-week" | "earlier";

export interface DayGroup<T> {
  key: DayGroupKey;
  label: string;
  items: T[];
}

const GROUP_LABELS: Record<DayGroupKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "this-week": "This week",
  "last-week": "Last week",
  earlier: "Earlier",
};
const GROUP_ORDER: DayGroupKey[] = [
  "today",
  "yesterday",
  "this-week",
  "last-week",
  "earlier",
];

export interface GroupByDayOptions extends DateTimeOptions {
  /** First day of the week, 0 = Sunday, 1 = Monday. @default 1 */
  weekStartsOn?: 0 | 1;
}

/** The bucket one instant falls in. Future instants count as Today. */
export function dayGroupKey(
  date: DateInput,
  options: GroupByDayOptions = {},
): DayGroupKey {
  const delta = dayDelta(date, options);
  if (delta >= 0) return "today";
  if (delta === -1) return "yesterday";
  const [ny, nm, nd] = calendarDay(
    new Date(nowMs(options.now)),
    options.timeZone,
  );
  const weekday = new Date(Date.UTC(ny, nm, nd)).getUTCDay();
  const sinceWeekStart = (weekday - (options.weekStartsOn ?? 1) + 7) % 7;
  if (-delta <= sinceWeekStart) return "this-week";
  if (-delta <= sinceWeekStart + 7) return "last-week";
  return "earlier";
}

/** Bucket items into Today / Yesterday / This week / Last week / Earlier (empty groups dropped, order kept). */
export function groupByDay<T>(
  items: readonly T[],
  getDate: (item: T) => DateInput,
  options: GroupByDayOptions = {},
): DayGroup<T>[] {
  const buckets = new Map<DayGroupKey, T[]>();
  for (const item of items) {
    const key = dayGroupKey(getDate(item), options);
    const list = buckets.get(key) ?? [];
    list.push(item);
    buckets.set(key, list);
  }
  return GROUP_ORDER.filter((k) => buckets.has(k)).map((key) => ({
    key,
    label: GROUP_LABELS[key],
    items: buckets.get(key)!,
  }));
}

// ---------------------------------------------------------------------------
// Time zone
// ---------------------------------------------------------------------------

/** The cookie the browser's zone is written to. */
export const TIME_ZONE_COOKIE = "tz";

/** True when `zone` is an IANA zone this runtime knows. */
export function isValidTimeZone(
  zone: string | undefined | null,
): zone is string {
  if (!zone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Server helper: the viewer's zone from the `tz` cookie, else `fallback` (pass the org zone from
 * app config — never hard-code it here).
 */
export function getTimeZone(
  cookieValue: string | undefined | null,
  fallback: string,
): string {
  const decoded = cookieValue ? safeDecode(cookieValue) : undefined;
  return isValidTimeZone(decoded) ? decoded : fallback;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Inline script that writes the browser zone to the `tz` cookie on load, and again when the tab
 * regains focus (so a zone change — travel, OS setting — is picked up on the next request).
 */
export const TIME_ZONE_COOKIE_SCRIPT = `(function(){function w(){try{var z=Intl.DateTimeFormat().resolvedOptions().timeZone;if(!z)return;var v=encodeURIComponent(z);if(document.cookie.indexOf("${TIME_ZONE_COOKIE}="+v)===-1){document.cookie="${TIME_ZONE_COOKIE}="+v+";path=/;max-age=31536000;samesite=lax"}}catch(e){}}w();document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible")w()});})();`;
