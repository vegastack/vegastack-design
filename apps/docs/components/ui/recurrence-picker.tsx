// @vegastack recurrence-picker@0.39.0 sha256-QOEGQzn4v/cTniq4sdCPVBAuJ/4YU7OnIpksRmLbvug=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { parseCalendarDay, toCalendarDay } from "@/lib/date-time";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { NumberField } from "@/components/ui/number-field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { TimeField } from "@/components/ui/time-field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/* ------------------------------------------------------------------------------------------------
 * RecurrencePicker — the body of a "repeat" popover: a list of presets ("Every day", "Every week
 * on Monday", …, "Custom…") and a custom editor (Every [n] [unit] · On … · Ends …), over a preview
 * of the next dates. Presentational: it edits a plain `RecurrenceValue` and never computes a date —
 * the host turns the value into a rule, formats the next dates and passes them in as `preview`, so
 * the design system carries no RRULE engine and no app words. The host owns the chrome around it:
 * the popover or `ResponsiveDialog`, its title and its footer buttons.
 * ----------------------------------------------------------------------------------------------*/

/** A day of the week, as RRULE spells it. */
export type Weekday = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";

/** How often it repeats. */
export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

/** Which week of the month: the first to the fourth, or the last (`-1`). */
export type RecurrenceOrdinal = 1 | 2 | 3 | 4 | -1;

/** Which day of the month a monthly rule falls on. */
export type RecurrenceMonthRule =
  | { kind: "day"; day: number }
  | { kind: "weekday"; ordinal: RecurrenceOrdinal; weekday: Weekday }
  | { kind: "last_day" };

/** When it stops: never, on a calendar day (`"YYYY-MM-DD"`), or after a number of times. */
export type RecurrenceEnds =
  | { kind: "never" }
  | { kind: "on"; date: string }
  | { kind: "after"; count: number };

/** A repeat rule, as plain data. The host maps it to its own rule format. */
export interface RecurrenceValue {
  /** How often: every `interval` days, weeks, months or years. */
  freq: RecurrenceFrequency;
  /** Every how many units (1 or more). */
  interval: number;
  /** Weekly: the days it falls on. */
  weekdays?: Weekday[];
  /** Monthly: the day of the month it falls on. */
  month?: RecurrenceMonthRule;
  /** When it stops. */
  ends: RecurrenceEnds;
  /** The time of day, `"HH:mm"` (24-hour), edited when `showTime` is on. */
  time?: string;
}

/** One preset row: "Every week on Monday". */
export interface RecurrencePreset {
  /** A stable id. */
  id: string;
  /** The row's text. */
  label: React.ReactNode;
  /** The rule it stands for; the row is selected while `value` equals it. */
  value: RecurrenceValue;
}

/** Which body the picker shows: the preset list, or the custom editor. */
export type RecurrencePickerView = "presets" | "custom";

/** Every string `RecurrencePicker` renders or names a control with; the calendar keeps its own. */
export interface RecurrenceLabels {
  /** The preset list's accessible name. */
  presets: string;
  /** The last preset row, which opens the custom editor. */
  custom: string;
  /** The interval row's label. */
  every: string;
  /** The unit select's accessible name. */
  unit: string;
  day: string;
  days: string;
  week: string;
  weeks: string;
  month: string;
  months: string;
  year: string;
  years: string;
  /** The weekdays and month-day row's label. */
  on: string;
  /** Full weekday names: the weekday buttons' accessible names and the weekday select's options. */
  weekdays: Record<Weekday, string>;
  /** One-letter weekday names, the weekday buttons' faces. */
  weekdaysNarrow: Record<Weekday, string>;
  /** "On day [10]": the text before the day field. */
  monthDay: string;
  /** The day field's accessible name. */
  dayOfMonth: string;
  /** "On the [second] [Monday]": the text before the two selects. */
  the: string;
  /** The week-of-the-month select's accessible name. */
  ordinal: string;
  /** The day-of-the-week select's accessible name. */
  weekday: string;
  first: string;
  second: string;
  third: string;
  fourth: string;
  last: string;
  /** "On the last day". */
  lastDay: string;
  /** Shown under a month day of 29–31. */
  monthEndHint: (day: number) => string;
  /** The time row's label (`showTime`). */
  at: string;
  /** The time field's accessible name. */
  time: string;
  /** The Ends row's label. */
  ends: string;
  never: string;
  /** "On [date]". */
  endsOn: string;
  /** The end date field's text before a date is picked. */
  pickDate: string;
  /** "After [10] times": the text before the count. */
  endsAfter: string;
  /** "After [10] times": the text after the count. */
  times: string;
  /** The count field's accessible name. */
  count: string;
  /** The number fields' − stepper. */
  decrease: string;
  /** The number fields' + stepper. */
  increase: string;
  /** Before the preview dates. */
  next: string;
}

const ordinalSuffix = (n: number) => {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return "th";
  return (
    ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"
  );
};

const DEFAULT_LABELS: RecurrenceLabels = {
  presets: "Repeat",
  custom: "Custom…",
  every: "Every",
  unit: "Unit",
  day: "day",
  days: "days",
  week: "week",
  weeks: "weeks",
  month: "month",
  months: "months",
  year: "year",
  years: "years",
  on: "On",
  weekdays: {
    MO: "Monday",
    TU: "Tuesday",
    WE: "Wednesday",
    TH: "Thursday",
    FR: "Friday",
    SA: "Saturday",
    SU: "Sunday",
  },
  weekdaysNarrow: {
    MO: "M",
    TU: "T",
    WE: "W",
    TH: "T",
    FR: "F",
    SA: "S",
    SU: "S",
  },
  monthDay: "day",
  dayOfMonth: "Day of the month",
  the: "the",
  ordinal: "Week of the month",
  weekday: "Day of the week",
  first: "first",
  second: "second",
  third: "third",
  fourth: "fourth",
  last: "last",
  lastDay: "the last day",
  monthEndHint: (day) =>
    `Months without a ${day}${ordinalSuffix(day)} use their last day`,
  at: "At",
  time: "Time",
  ends: "Ends",
  never: "Never",
  endsOn: "On",
  pickDate: "Pick a date",
  endsAfter: "After",
  times: "times",
  count: "Number of times",
  decrease: "Decrease",
  increase: "Increase",
  next: "Next:",
};

/** Props for `RecurrencePicker`. */
export interface RecurrencePickerProps {
  /**
   * The rule; `null` when it doesn't repeat. The picker remembers the last end date, count and
   * month day it saw so a choice can come back: give it a `key` per record when it stays mounted
   * across records.
   */
  value: RecurrenceValue | null;
  /** Fires with the new rule, or `null` when "doesn't repeat" is chosen. */
  onChange: (value: RecurrenceValue | null) => void;
  /**
   * The preset rows, in order, followed by "Custom…". A row is selected while `value` equals its
   * rule (weekday order aside; `time` counts unless `showTime` is on); a rule no preset matches
   * selects "Custom…". Leave out both `presets` and `noneLabel` for the custom editor alone. The
   * presets also seed the custom editor when its unit changes: the weekly preset with one day
   * gives the weekday, the first monthly one the day. With neither, it starts on the week's first
   * day and on the 1st.
   * @default undefined
   */
  presets?: readonly RecurrencePreset[];
  /**
   * The first row, which sets `null` ("Doesn't repeat"). Left out, there is no such row.
   * @default undefined
   */
  noneLabel?: React.ReactNode;
  /**
   * The body shown (controlled). Choosing "Custom…" asks for `"custom"`, so the host can grow its
   * popover; the picker never asks to go back, so a host offering that sets `"presets"` itself.
   * Without presets it is always the custom editor.
   * @default undefined
   */
  view?: RecurrencePickerView;
  /** Fires when the picker asks for the other body.
   * @default undefined
   */
  onViewChange?: (view: RecurrencePickerView) => void;
  /**
   * The next dates, formatted by the host ("Mon 10 Nov"), shown as chips after "Next:", in a live
   * region that is there from the first paint. A new set cross-fades in.
   * @default undefined
   */
  preview?: readonly string[];
  /** The next dates are loading: three chip skeletons, after a short delay.
   * @default false
   */
  previewLoading?: boolean;
  /**
   * The next dates couldn't load: this line (with the host's "Try again") in place of the dates.
   * It is announced politely, like the dates; saving the rule is still allowed.
   * @default undefined
   */
  previewError?: React.ReactNode;
  /** A line under the preview: "Times in Asia/Kolkata · Change".
   * @default undefined
   */
  timeZoneLabel?: React.ReactNode;
  /**
   * Show a time field for `value.time` (both bodies, while there is a rule). A preset keeps the
   * time already set, and presets match whatever the time.
   * @default false
   */
  showTime?: boolean;
  /** Minutes the time field steps by.
   * @default 15
   */
  timeStep?: number;
  /** The time field's clock: `12` or `24`. Omit it and the locale decides.
   * @default undefined
   */
  hourCycle?: 12 | 24;
  /** BCP-47 locale for the end date and the time.
   * @default "en-US"
   */
  locale?: string;
  /**
   * The host's own fields, shown in the custom editor between Ends and the preview.
   * @default undefined
   */
  extra?: React.ReactNode;
  /** Replace any of the strings (`RecurrenceLabels`).
   * @default undefined
   */
  labels?: Partial<RecurrenceLabels>;
  /** Disable every control.
   * @default false
   */
  disabled?: boolean;
  /** The first day of the week: `1` Monday, `0` Sunday.
   * @default 1
   */
  weekStartsOn?: 0 | 1;
  /** Classes for the root.
   * @default undefined
   */
  className?: string;
}

const WEEK: readonly Weekday[] = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
const FREQUENCIES: readonly RecurrenceFrequency[] = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
];
const ORDINALS: readonly RecurrenceOrdinal[] = [1, 2, 3, 4, -1];
const NONE = "recurrence-picker:none";
const CUSTOM = "recurrence-picker:custom";

const byWeek = (a: Weekday, b: Weekday) => WEEK.indexOf(a) - WEEK.indexOf(b);

/** One comparable string per rule: weekday order and an empty weekday list don't count. */
function ruleKey(value: RecurrenceValue, withTime: boolean): string {
  const { month, ends } = value;
  return JSON.stringify([
    value.freq,
    value.interval,
    value.weekdays?.length ? [...new Set(value.weekdays)].sort(byWeek) : null,
    month
      ? month.kind === "day"
        ? [month.kind, month.day]
        : month.kind === "weekday"
          ? [month.kind, month.ordinal, month.weekday]
          : [month.kind]
      : null,
    ends.kind === "on"
      ? [ends.kind, ends.date]
      : ends.kind === "after"
        ? [ends.kind, ends.count]
        : [ends.kind],
    withTime ? (value.time ?? null) : null,
  ]);
}

/** A copy without the optional keys that are `undefined`, so a host's equality check is clean. */
function clean(value: RecurrenceValue): RecurrenceValue {
  const next: RecurrenceValue = {
    freq: value.freq,
    interval: value.interval,
    ends: { ...value.ends },
  };
  if (value.weekdays) next.weekdays = [...value.weekdays];
  if (value.month) next.month = { ...value.month };
  if (value.time !== undefined) next.time = value.time;
  return next;
}

/**
 * One editor row: the label beside the control where the editor is wide enough (the columns line
 * up across rows, through the parent's grid), above it where it is not, so a choice's field never
 * wraps away from its radio on a narrow sheet.
 */
function EditorRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 @xs/recurrence-picker-custom:col-span-2 @xs/recurrence-picker-custom:grid @xs/recurrence-picker-custom:grid-cols-subgrid @xs/recurrence-picker-custom:items-start @xs/recurrence-picker-custom:gap-3">
      {children}
    </div>
  );
}

/**
 * A field inside a radio choice. The arrow keys belong to it: left to bubble, they reach the radio
 * group, which moves on and selects the next choice while someone edits a number.
 */
function ChoiceField({
  className = "contents",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={className}
      onKeyDown={(event) => {
        if (event.key.startsWith("Arrow")) event.stopPropagation();
      }}
    >
      {children}
    </div>
  );
}

/** A row label: a `<label>` for one control, a plain span naming a group. */
function RowLabel({
  htmlFor,
  id,
  children,
}: {
  htmlFor?: string;
  id?: string;
  children: React.ReactNode;
}) {
  const className =
    "h-5 text-muted-foreground @xs/recurrence-picker-custom:h-8";
  return htmlFor ? (
    <Label htmlFor={htmlFor} id={id} className={className}>
      {children}
    </Label>
  ) : (
    <span
      id={id}
      className={cn(
        "flex items-center text-sm leading-none font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * `RecurrencePicker` — presets and a custom editor for a repeat rule, over a preview of the next
 * dates. The presets are a radio group (focus lands on the selected one); choosing "Custom…" asks
 * the host for the custom editor (`onViewChange("custom")`) so it can grow its popover, and starts
 * a rule if there was none. The custom editor reads "Every [n] [unit]", then the weekdays (weekly)
 * or "day [n] / the [second] [Monday] / the last day" (monthly), the time (`showTime`), "Ends
 * Never / On [date] / After [n] times", the host's `extra` fields, and the preview. Editing a
 * row's field selects its choice. It never computes a date: `preview` holds the host's formatted
 * next dates, in a polite live region.
 *
 * @example
 * <PopoverContent size={view === "custom" ? "lg" : "default"} aria-labelledby={titleId}>
 *   <PopoverHeader><PopoverTitle id={titleId}>Repeat</PopoverTitle></PopoverHeader>
 *   <RecurrencePicker
 *     value={rule}
 *     onChange={setRule}
 *     noneLabel="Doesn't repeat"
 *     presets={presets}
 *     view={view}
 *     onViewChange={setView}
 *     preview={next.dates}
 *     previewLoading={next.loading}
 *     timeZoneLabel="Times in Asia/Kolkata"
 *   />
 *   <div className="flex justify-end gap-2">…Cancel · Repeat weekly…</div>
 * </PopoverContent>
 */
export function RecurrencePicker({
  value,
  onChange,
  presets,
  noneLabel,
  view: viewProp,
  onViewChange,
  preview,
  previewLoading = false,
  previewError,
  timeZoneLabel,
  showTime = false,
  timeStep = 15,
  hourCycle,
  locale,
  extra,
  labels: labelsProp,
  disabled = false,
  weekStartsOn = 1,
  className,
}: RecurrencePickerProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const hasPresets = (presets?.length ?? 0) > 0 || noneLabel != null;
  const [viewState, setViewState] =
    React.useState<RecurrencePickerView>("presets");
  const view: RecurrencePickerView = hasPresets
    ? (viewProp ?? viewState)
    : "custom";
  const setView = (next: RecurrencePickerView) => {
    setViewState(next);
    onViewChange?.(next);
  };

  // The last weekdays, month days, end date and count seen, so switching away and back restores
  // them. Written from event handlers and after each render, never during one.
  const memory = React.useRef<{
    weekdays?: Weekday[];
    day?: number;
    nth?: { ordinal: RecurrenceOrdinal; weekday: Weekday };
    monthKind?: RecurrenceMonthRule["kind"];
    date?: string;
    count?: number;
  }>({});
  const remember = (next: RecurrenceValue | null) => {
    if (!next) return;
    const m = memory.current;
    if (next.weekdays?.length) m.weekdays = [...next.weekdays];
    if (next.month) m.monthKind = next.month.kind;
    if (next.month?.kind === "day") m.day = next.month.day;
    if (next.month?.kind === "weekday")
      m.nth = { ordinal: next.month.ordinal, weekday: next.month.weekday };
    if (next.ends.kind === "on") m.date = next.ends.date;
    if (next.ends.kind === "after") m.count = next.ends.count;
  };
  React.useEffect(() => remember(value));

  const emit = (next: RecurrenceValue | null) => {
    remember(next);
    onChange(next ? clean(next) : null);
  };

  // What the host's own presets say about its date: the weekday, the day and the nth weekday.
  const weeklyPresets =
    presets?.filter(
      (p) => p.value.freq === "weekly" && p.value.weekdays?.length,
    ) ?? [];
  const anchorWeekdays = (
    weeklyPresets.find((p) => p.value.weekdays!.length === 1) ??
    weeklyPresets[0]
  )?.value.weekdays;
  const monthRules =
    presets?.flatMap((p) =>
      p.value.freq === "monthly" && p.value.month ? [p.value.month] : [],
    ) ?? [];
  const anchorDay = monthRules.find((m) => m.kind === "day");
  const anchorNth = monthRules.find((m) => m.kind === "weekday");
  const week: readonly Weekday[] =
    weekStartsOn === 0 ? ["SU", ...WEEK.slice(0, 6)] : WEEK;

  // A new weekly rule falls on the host's weekday, else the week's first day: never on none.
  const startWeekdays = anchorWeekdays ?? [week[0]!];

  const seed = (): RecurrenceValue => ({
    freq: "weekly",
    interval: 1,
    weekdays: [...startWeekdays],
    ends: { kind: "never" },
  });
  // The rule the custom editor shows and edits: a fresh one while there is none.
  const base = value ?? seed();
  const update = (patch: Partial<RecurrenceValue>) =>
    emit({ ...base, ...patch });

  const dayValue =
    base.month?.kind === "day"
      ? base.month.day
      : (memory.current.day ?? (anchorDay?.kind === "day" ? anchorDay.day : 1));
  const nthValue =
    base.month?.kind === "weekday"
      ? { ordinal: base.month.ordinal, weekday: base.month.weekday }
      : (memory.current.nth ??
        (anchorNth?.kind === "weekday"
          ? { ordinal: anchorNth.ordinal, weekday: anchorNth.weekday }
          : { ordinal: 1 as RecurrenceOrdinal, weekday: week[0]! }));
  const showDayHint = base.month?.kind === "day" && dayValue >= 29;
  const endDate =
    base.ends.kind === "on" ? base.ends.date : memory.current.date;
  const countValue =
    base.ends.kind === "after" ? base.ends.count : (memory.current.count ?? 10);

  const setFreq = (freq: RecurrenceFrequency) => {
    if (freq === base.freq) return;
    const next: RecurrenceValue = { ...base, freq };
    delete next.weekdays;
    delete next.month;
    if (freq === "weekly")
      next.weekdays = [...(memory.current.weekdays ?? startWeekdays)];
    if (freq === "monthly") {
      // The kind used last, else the host's own monthly preset, else a day of the month.
      const kind =
        memory.current.monthKind ??
        (anchorDay || !anchorNth ? "day" : "weekday");
      next.month =
        kind === "day"
          ? { kind, day: dayValue }
          : kind === "weekday"
            ? { kind, ...nthValue }
            : { kind };
    }
    emit(next);
  };

  // Choosing "Custom…" moves focus into the editor once it is there.
  const focusEditor = React.useRef(false);
  const intervalRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (!focusEditor.current) return;
    focusEditor.current = false;
    if (view === "custom") intervalRef.current?.focus();
  });
  // Arrowing through a radio group selects as it goes. That is right for a rule, but "Custom…" and
  // an end date with no day open something, and browsing must not: they wait for Space or a click.
  const arrowing = React.useRef(false);
  const arrowProps = {
    onKeyDownCapture: (event: React.KeyboardEvent<HTMLElement>) => {
      arrowing.current =
        event.key.startsWith("Arrow") &&
        (event.target as HTMLElement).getAttribute("role") === "radio";
    },
    onKeyUpCapture: () => {
      arrowing.current = false;
    },
  };
  const openCustom = () => {
    if (value === null) emit(seed());
    focusEditor.current = true;
    setView("custom");
  };

  // The selected row: the preset the rule equals, else "Custom…".
  const key = value ? ruleKey(value, !showTime) : null;
  const matched = key
    ? presets?.find((p) => ruleKey(p.value, !showTime) === key)
    : undefined;
  const selected =
    value === null
      ? noneLabel != null
        ? NONE
        : null
      : matched
        ? matched.id
        : CUSTOM;

  const [endsOpen, setEndsOpen] = React.useState(false);
  const id = React.useId();
  const ids = {
    every: `${id}-every`,
    on: `${id}-on`,
    dayText: `${id}-day-text`,
    dayHint: `${id}-day-hint`,
    the: `${id}-the`,
    ordinalValue: `${id}-ordinal-value`,
    weekdayValue: `${id}-weekday-value`,
    time: `${id}-time`,
    ends: `${id}-ends`,
    endsAfter: `${id}-ends-after`,
    count: `${id}-count`,
    times: `${id}-times`,
  };
  const radioId = (name: string) => `${id}-radio-${name}`;

  const unitLabel = (freq: RecurrenceFrequency) => {
    const one = base.interval === 1;
    switch (freq) {
      case "daily":
        return one ? labels.day : labels.days;
      case "weekly":
        return one ? labels.week : labels.weeks;
      case "monthly":
        return one ? labels.month : labels.months;
      default:
        return one ? labels.year : labels.years;
    }
  };
  const ordinalLabel = (ordinal: RecurrenceOrdinal) =>
    ({
      1: labels.first,
      2: labels.second,
      3: labels.third,
      4: labels.fourth,
      [-1]: labels.last,
    })[ordinal];

  const timeRow =
    showTime && (view === "custom" || value !== null) ? (
      <>
        <RowLabel htmlFor={ids.time}>{labels.at}</RowLabel>
        <TimeField
          id={ids.time}
          aria-label={labels.time}
          value={base.time ?? null}
          onChange={(time) => {
            const next = { ...base };
            if (time) next.time = time;
            else delete next.time;
            emit(next);
          }}
          step={timeStep}
          hourCycle={hourCycle}
          locale={locale}
          disabled={disabled}
        />
      </>
    ) : null;

  const hasPreview =
    previewLoading || previewError != null || (preview?.length ?? 0) > 0;
  const hasFooter = hasPreview || timeZoneLabel != null;

  return (
    <div
      data-slot="recurrence-picker"
      data-view={view}
      className={cn("flex min-w-0 flex-col gap-3", className)}
    >
      {view === "presets" ? (
        <>
          <RadioGroup
            data-slot="recurrence-picker-presets"
            aria-label={labels.presets}
            {...arrowProps}
            value={selected}
            disabled={disabled}
            onValueChange={(next) => {
              if (next === NONE) emit(null);
              else if (next === CUSTOM) {
                if (!arrowing.current) openCustom();
              } else {
                const preset = presets?.find((p) => p.id === next);
                if (!preset) return;
                const time = showTime
                  ? (value?.time ?? preset.value.time)
                  : preset.value.time;
                emit({
                  ...preset.value,
                  ...(time !== undefined ? { time } : {}),
                });
              }
            }}
            className="gap-0.5"
          >
            {noneLabel != null ? (
              <PresetRow id={radioId("none")} value={NONE}>
                {noneLabel}
              </PresetRow>
            ) : null}
            {presets?.map((preset, index) => (
              <PresetRow
                key={preset.id}
                id={radioId(`preset-${index}`)}
                value={preset.id}
              >
                {preset.label}
              </PresetRow>
            ))}
            <PresetRow
              id={radioId("custom")}
              value={CUSTOM}
              // Choosing it again (it is already selected for a rule no preset matches) still
              // opens the editor; a first choice goes through onValueChange instead.
              onClick={
                selected === CUSTOM && !disabled ? openCustom : undefined
              }
            >
              {labels.custom}
            </PresetRow>
          </RadioGroup>
          {timeRow ? (
            <div className="flex items-center gap-3">{timeRow}</div>
          ) : null}
        </>
      ) : (
        <div
          data-slot="recurrence-picker-custom"
          className="@container/recurrence-picker-custom min-w-0"
        >
          <div className="grid grid-cols-1 gap-3 @xs/recurrence-picker-custom:grid-cols-[auto_minmax(0,1fr)] @xs/recurrence-picker-custom:gap-x-3">
            <EditorRow>
              <RowLabel htmlFor={ids.every}>{labels.every}</RowLabel>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <NumberField
                  id={ids.every}
                  inputRef={intervalRef}
                  value={base.interval}
                  min={1}
                  max={999}
                  step={1}
                  decrementLabel={labels.decrease}
                  incrementLabel={labels.increase}
                  disabled={disabled}
                  onValueChange={(interval) => {
                    if (interval != null && interval >= 1)
                      update({ interval: Math.round(interval) });
                  }}
                  className="w-24"
                  inputClassName="text-center tabular-nums"
                />
                <Select
                  items={FREQUENCIES.map((freq) => ({
                    value: freq,
                    label: unitLabel(freq),
                  }))}
                  value={base.freq}
                  disabled={disabled}
                  onValueChange={(freq) => {
                    if (freq) setFreq(freq as RecurrenceFrequency);
                  }}
                >
                  <SelectTrigger
                    aria-label={labels.unit}
                    data-slot="recurrence-picker-unit"
                    className="w-fit min-w-0"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        {unitLabel(freq)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </EditorRow>

            {base.freq === "weekly" ? (
              <EditorRow>
                <RowLabel id={ids.on}>{labels.on}</RowLabel>
                <ToggleGroup
                  data-slot="recurrence-picker-weekdays"
                  aria-labelledby={ids.on}
                  multiple
                  variant="outline"
                  spacing={1}
                  wrap
                  disabled={disabled}
                  value={base.weekdays ?? []}
                  onValueChange={(next) => {
                    const weekdays = (next as Weekday[]).slice().sort(byWeek);
                    // A weekly rule keeps at least one day.
                    if (weekdays.length) update({ weekdays });
                  }}
                >
                  {week.map((day) => (
                    <ToggleGroupItem
                      key={day}
                      value={day}
                      aria-label={labels.weekdays[day]}
                      className="w-8 px-0"
                    >
                      {labels.weekdaysNarrow[day]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </EditorRow>
            ) : null}

            {base.freq === "monthly" ? (
              <EditorRow>
                <RowLabel id={ids.on}>{labels.on}</RowLabel>
                <RadioGroup
                  data-slot="recurrence-picker-month"
                  aria-labelledby={ids.on}
                  value={base.month?.kind ?? null}
                  disabled={disabled}
                  onValueChange={(kind) => {
                    if (kind === "day")
                      update({ month: { kind: "day", day: dayValue } });
                    else if (kind === "weekday")
                      update({ month: { kind: "weekday", ...nthValue } });
                    else if (kind === "last_day")
                      update({ month: { kind: "last_day" } });
                  }}
                  className="gap-2"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex min-h-8 flex-wrap items-center gap-x-2.5 gap-y-1">
                      <RadioGroupItem
                        id={radioId("month-day")}
                        value="day"
                        aria-labelledby={ids.dayText}
                      />
                      <Label
                        htmlFor={radioId("month-day")}
                        id={ids.dayText}
                        className="font-normal"
                      >
                        {labels.monthDay}
                      </Label>
                      <ChoiceField>
                        <NumberField
                          aria-label={labels.dayOfMonth}
                          aria-describedby={
                            showDayHint ? ids.dayHint : undefined
                          }
                          value={dayValue}
                          min={1}
                          max={31}
                          step={1}
                          decrementLabel={labels.decrease}
                          incrementLabel={labels.increase}
                          disabled={disabled}
                          onValueChange={(day) => {
                            if (day != null && day >= 1 && day <= 31)
                              update({
                                month: { kind: "day", day: Math.round(day) },
                              });
                          }}
                          className="w-24"
                          inputClassName="text-center tabular-nums"
                        />
                      </ChoiceField>
                    </div>
                    {showDayHint ? (
                      <p
                        id={ids.dayHint}
                        data-slot="recurrence-picker-month-hint"
                        className="ps-6.5 text-xs text-muted-foreground"
                      >
                        {labels.monthEndHint(dayValue)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex min-h-8 flex-wrap items-center gap-x-2.5 gap-y-1">
                    <RadioGroupItem
                      id={radioId("month-weekday")}
                      value="weekday"
                      aria-labelledby={`${ids.the} ${ids.ordinalValue} ${ids.weekdayValue}`}
                    />
                    <Label
                      htmlFor={radioId("month-weekday")}
                      id={ids.the}
                      className="font-normal"
                    >
                      {labels.the}
                    </Label>
                    <ChoiceField>
                      <Select
                        items={ORDINALS.map((ordinal) => ({
                          value: ordinal,
                          label: ordinalLabel(ordinal),
                        }))}
                        value={nthValue.ordinal}
                        disabled={disabled}
                        onValueChange={(ordinal) => {
                          if (ordinal != null)
                            update({
                              month: {
                                kind: "weekday",
                                ordinal: ordinal as RecurrenceOrdinal,
                                weekday: nthValue.weekday,
                              },
                            });
                        }}
                      >
                        <SelectTrigger
                          aria-label={labels.ordinal}
                          className="w-fit min-w-0"
                        >
                          <SelectValue id={ids.ordinalValue} />
                        </SelectTrigger>
                        <SelectContent>
                          {ORDINALS.map((ordinal) => (
                            <SelectItem key={ordinal} value={ordinal}>
                              {ordinalLabel(ordinal)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        items={week.map((day) => ({
                          value: day,
                          label: labels.weekdays[day],
                        }))}
                        value={nthValue.weekday}
                        disabled={disabled}
                        onValueChange={(weekday) => {
                          if (weekday)
                            update({
                              month: {
                                kind: "weekday",
                                ordinal: nthValue.ordinal,
                                weekday: weekday as Weekday,
                              },
                            });
                        }}
                      >
                        <SelectTrigger
                          aria-label={labels.weekday}
                          className="w-fit min-w-0"
                        >
                          <SelectValue id={ids.weekdayValue} />
                        </SelectTrigger>
                        <SelectContent>
                          {week.map((day) => (
                            <SelectItem key={day} value={day}>
                              {labels.weekdays[day]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </ChoiceField>
                  </div>
                  <div className="flex min-h-8 items-center gap-2.5">
                    <RadioGroupItem
                      id={radioId("month-last")}
                      value="last_day"
                    />
                    <Label
                      htmlFor={radioId("month-last")}
                      className="font-normal"
                    >
                      {labels.lastDay}
                    </Label>
                  </div>
                </RadioGroup>
              </EditorRow>
            ) : null}

            {timeRow ? <EditorRow>{timeRow}</EditorRow> : null}

            <EditorRow>
              <RowLabel id={ids.ends}>{labels.ends}</RowLabel>
              <RadioGroup
                data-slot="recurrence-picker-ends"
                aria-labelledby={ids.ends}
                {...arrowProps}
                value={base.ends.kind}
                disabled={disabled}
                onValueChange={(kind) => {
                  if (kind === "never") update({ ends: { kind: "never" } });
                  else if (kind === "after")
                    update({ ends: { kind: "after", count: countValue } });
                  else if (kind === "on") {
                    // A day is needed first: open the calendar; picking one selects "On".
                    if (endDate)
                      update({ ends: { kind: "on", date: endDate } });
                    else if (!arrowing.current) setEndsOpen(true);
                  }
                }}
                className="gap-2"
              >
                <div className="flex min-h-8 items-center gap-2.5">
                  <RadioGroupItem id={radioId("ends-never")} value="never" />
                  <Label
                    htmlFor={radioId("ends-never")}
                    className="font-normal"
                  >
                    {labels.never}
                  </Label>
                </div>
                <div className="flex min-h-8 items-center gap-2.5">
                  <RadioGroupItem id={radioId("ends-on")} value="on" />
                  <Label htmlFor={radioId("ends-on")} className="font-normal">
                    {labels.endsOn}
                  </Label>
                  <ChoiceField className="block max-w-40 min-w-0 flex-1">
                    <DatePicker
                      size="sm"
                      value={endDate ? parseCalendarDay(endDate) : undefined}
                      onValueChange={(date) => {
                        if (date)
                          update({
                            ends: { kind: "on", date: toCalendarDay(date) },
                          });
                      }}
                      open={endsOpen}
                      onOpenChange={setEndsOpen}
                      placeholder={labels.pickDate}
                      locale={locale}
                      calendarProps={{ required: true, weekStartsOn }}
                      disabled={disabled}
                    />
                  </ChoiceField>
                </div>
                <div className="flex min-h-8 flex-wrap items-center gap-x-2.5 gap-y-1">
                  <RadioGroupItem
                    id={radioId("ends-after")}
                    value="after"
                    aria-labelledby={`${ids.endsAfter} ${ids.count} ${ids.times}`}
                  />
                  <Label
                    htmlFor={radioId("ends-after")}
                    id={ids.endsAfter}
                    className="font-normal"
                  >
                    {labels.endsAfter}
                  </Label>
                  <ChoiceField>
                    <NumberField
                      id={ids.count}
                      aria-label={labels.count}
                      value={countValue}
                      min={1}
                      max={999}
                      step={1}
                      decrementLabel={labels.decrease}
                      incrementLabel={labels.increase}
                      disabled={disabled}
                      onValueChange={(count) => {
                        if (count != null && count >= 1)
                          update({
                            ends: { kind: "after", count: Math.round(count) },
                          });
                      }}
                      className="w-24"
                      inputClassName="text-center tabular-nums"
                    />
                  </ChoiceField>
                  <span id={ids.times} className="text-sm">
                    {labels.times}
                  </span>
                </div>
              </RadioGroup>
            </EditorRow>
          </div>
        </div>
      )}

      {view === "custom" && extra != null ? (
        <>
          <Separator />
          <div
            data-slot="recurrence-picker-extra"
            className="flex flex-col gap-3"
          >
            {extra}
          </div>
        </>
      ) : null}

      {hasFooter ? <Separator /> : null}
      {/* Mounted from the first paint so a change is announced; out of the flow while empty. */}
      <div
        data-slot="recurrence-picker-preview"
        role="status"
        aria-live="polite"
        aria-busy={previewLoading || undefined}
        className={cn("flex flex-col gap-1.5", !hasFooter && "sr-only")}
      >
        <PreviewRow
          dates={
            previewLoading || previewError != null
              ? NO_DATES
              : (preview ?? NO_DATES)
          }
          next={labels.next}
        >
          {previewLoading ? (
            <div
              data-slot="recurrence-picker-preview-loading"
              className="flex flex-wrap items-center gap-1.5 motion-reveal"
            >
              <span className="text-xs text-muted-foreground">
                {labels.next}
              </span>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-5 w-20 rounded-4xl" />
              ))}
            </div>
          ) : previewError != null ? (
            <div
              data-slot="recurrence-picker-preview-error"
              className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-destructive-text"
            >
              {previewError}
            </div>
          ) : null}
        </PreviewRow>
        {timeZoneLabel != null ? (
          <div
            data-slot="recurrence-picker-time-zone"
            className="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground"
          >
            {timeZoneLabel}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const NO_DATES: readonly string[] = [];
const CROSS_FADE_MS = 150;

/** "Next:" and the date chips. */
function DateChips({
  dates,
  next,
  className,
  ...props
}: React.ComponentProps<"div"> & { dates: readonly string[]; next: string }) {
  return (
    <div
      {...props}
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      <span className="text-xs text-muted-foreground">{next}</span>
      {dates.map((date, index) => (
        <React.Fragment key={`${index}:${date}`}>
          {index > 0 ? <span className="sr-only">, </span> : null}
          <Badge variant="secondary" className="tabular-nums">
            {date}
          </Badge>
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * The preview's one line. A new set of dates cross-fades with the one it replaces, the two stacked
 * in one grid cell for 150ms; the outgoing copy is hidden from assistive technology, and reduced
 * motion drops it. Nothing fades on first paint. A skeleton or an error (`children`) shares the cell.
 */
function PreviewRow({
  dates,
  next,
  children,
}: {
  dates: readonly string[];
  next: string;
  children: React.ReactNode;
}) {
  const key = dates.join("\n");
  const [shown, setShown] = React.useState({ key, dates });
  const [outgoing, setOutgoing] = React.useState(NO_DATES);
  const [changed, setChanged] = React.useState(false);
  if (key !== shown.key) {
    setShown({ key, dates });
    setOutgoing(shown.dates);
    setChanged(true);
  }
  React.useEffect(() => {
    if (!outgoing.length) return;
    const timer = setTimeout(() => setOutgoing(NO_DATES), CROSS_FADE_MS);
    return () => clearTimeout(timer);
  }, [outgoing]);

  if (!dates.length && !outgoing.length && children == null) return null;
  return (
    <div
      data-slot="recurrence-picker-preview-row"
      className="grid *:col-start-1 *:row-start-1"
    >
      {outgoing.length ? (
        <DateChips
          aria-hidden
          data-slot="recurrence-picker-preview-outgoing"
          dates={outgoing}
          next={next}
          className="duration-150 fill-mode-forwards motion-safe:animate-out motion-safe:fade-out-0 motion-reduce:hidden"
        />
      ) : null}
      {dates.length ? (
        <DateChips
          key={key}
          data-slot="recurrence-picker-preview-dates"
          dates={dates}
          next={next}
          className={
            changed
              ? "duration-150 motion-safe:animate-in motion-safe:fade-in-0"
              : undefined
          }
        />
      ) : null}
      {children}
    </div>
  );
}

/** One preset row: its radio and its text, the whole row a 32px target. */
function PresetRow({
  id,
  value,
  onClick,
  children,
}: {
  id: string;
  value: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      data-slot="recurrence-picker-preset"
      className="flex min-h-8 items-center gap-2.5"
      onClick={onClick}
    >
      <RadioGroupItem id={id} value={value} />
      <Label htmlFor={id} className="min-h-8 min-w-0 flex-1 font-normal">
        {children}
      </Label>
    </div>
  );
}
