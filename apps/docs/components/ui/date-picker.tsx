// @vegastack date-picker@0.11.0 sha256-NZsjHy0HE5/4vWTT37szbDLzSEoAzE4PX1BhpNFnJB8=

"use client";

import * as React from "react";
import {
  dateMatchModifiers,
  rangeContainsModifiers,
  type DateRange,
  type DayButton,
  type Matcher,
} from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

/* ------------------------------------------------------------------------------------------------
 * DatePicker — single-date and range date selection, composed from upstream `Calendar`, `Popover`
 * and `Button`. The calendar itself is NOT ours: `@/components/ui/calendar` is shadcn's file plus
 * its patch, and this module imports it rather than restating a single one of its class strings.
 *
 * Two exports:
 *  - `DatePicker`      — single date; upstream `Calendar` inside a `Popover` triggered by a `Button`
 *                        that shows the formatted date. Optional quick presets (Today / Tomorrow).
 *  - `DateRangePicker` — the same, for a `{ from, to }` range across two months.
 *
 * Formatting uses the native `Intl.DateTimeFormat` (NO date-fns) so there is no extra runtime dep.
 * `react-day-picker` survives here as TYPES plus its two matcher evaluators — see the note on
 * `isDateDisabled` for why the preset gate must read the calendar's own matcher and not a
 * re-derived copy of it. Nothing in this file renders a day, a month or a caption.
 * ----------------------------------------------------------------------------------------------*/

/* ------------------------------------------------------------------------------------------------
 * Formatting helpers (native Intl — no date-fns)
 * ----------------------------------------------------------------------------------------------*/

/** Default single-date display format: e.g. "Jun 21, 2026". */
const DEFAULT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

/** Format a single date with `Intl.DateTimeFormat`. */
function formatDate(
  date: Date,
  options: Intl.DateTimeFormatOptions,
  locale?: string,
): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/** Format a `{ from, to }` range, collapsing to a single date when `to` is absent. */
function formatRange(
  range: DateRange,
  options: Intl.DateTimeFormatOptions,
  locale?: string,
): string {
  if (!range.from) return "";
  if (!range.to) return formatDate(range.from, options, locale);
  return `${formatDate(range.from, options, locale)} – ${formatDate(range.to, options, locale)}`;
}

/* ------------------------------------------------------------------------------------------------
 * The calendar inside the popover
 * ----------------------------------------------------------------------------------------------*/

/**
 * Props forwarded to the inner upstream `Calendar` — every `DayPicker` knob (`timeZone`, `locale`,
 * `footer`, `captionLayout`, `startMonth`, `endMonth`, `labels`, `formatters`, …) minus the four
 * the picker owns.
 */
type ForwardedCalendarProps = Omit<
  React.ComponentProps<typeof Calendar>,
  "mode" | "selected" | "onSelect" | "disabled"
>;

/**
 * The day button, wrapping — never copying — upstream's `CalendarDayButton`, for one reason: the
 * focus call.
 *
 * Upstream's own `focused` effect is a plain `.focus()`. With `autoFocus` (this picker's default)
 * it fires on the calendar's first paint, while the portaled popup is still UNPOSITIONED at the
 * document's top-left, so the browser scrolls the page up to that pre-position spot every time a
 * below-the-fold trigger opens the picker. Handing upstream `focused: false` stops its effect from
 * running at all and this one focuses with `preventScroll`, which loses nothing: the popup is
 * fixed-positioned, and keyboard focus still lands on the day. `focused` drives no styling here —
 * the `group-data-[focused=true]/day` selector upstream's button carries reads the attribute
 * react-day-picker writes on the parent cell, which is untouched.
 *
 * Inline (an internal part, not an export) because the reason is the popover's, not the calendar's:
 * the inline `<Calendar>` upstream documents has no unpositioned first paint and needs none of it.
 */
function PopoverDayButton({
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus({ preventScroll: true });
  }, [modifiers.focused]);

  return (
    <DayButtonWithRef
      ref={ref}
      modifiers={{ ...modifiers, focused: false }}
      {...props}
    />
  );
}

/**
 * The one widening this file performs, and it adds nothing the runtime does not already do: React
 * 19 hands a function component its `ref` as an ordinary prop, and upstream's `CalendarDayButton`
 * spreads its rest props onto Base UI's `Button`, so the ref reaches the DOM button. Its prop type
 * is react-day-picker's `DayButton`, written against `ButtonHTMLAttributes`, which has no `ref`
 * member — so the type, not the behaviour, is what is missing.
 */
const DayButtonWithRef = CalendarDayButton as (
  props: React.ComponentProps<typeof CalendarDayButton> & {
    ref?: React.Ref<HTMLButtonElement>;
  },
) => React.ReactNode;

/** The `components` override every picker hands its calendar. */
const POPOVER_CALENDAR_COMPONENTS = { DayButton: PopoverDayButton } as const;

/* ------------------------------------------------------------------------------------------------
 * Presets
 * ----------------------------------------------------------------------------------------------*/

/** A quick-select preset for the single `DatePicker` — a label and the date it applies. */
export interface DatePreset {
  /** Button text, e.g. "Today". */
  label: string;
  /** The date this preset selects. */
  date: Date;
}

/** A quick-select preset for the `DateRangePicker` — a label and the range it applies. */
export interface DateRangePreset {
  /** Button text, e.g. "Last 7 days". */
  label: string;
  /** The `{ from, to }` range this preset selects. */
  range: DateRange;
}

/** Strip the time component so two dates on the same day compare equal. */
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Shift a date by `n` days (negative = past). */
function addDays(date: Date, n: number): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() + n);
  return d;
}

/* ------------------------------------------------------------------------------------------------
 * Shared disabled-date predicates
 *
 * The calendar honors `disabledDates` via react-day-picker's `disabled` matcher. Presets must obey
 * the SAME policy, so we reuse react-day-picker's own matcher evaluators (`dateMatchModifiers` /
 * `rangeContainsModifiers`) rather than reimplementing the rule — that guarantees the preset gate
 * never drifts from what the calendar grid actually blocks.
 * ----------------------------------------------------------------------------------------------*/

/** True when `date` is blocked by the `disabledDates` matcher (same one the calendar applies). */
function isDateDisabled(
  date: Date,
  disabledDates: Matcher | Matcher[] | undefined,
): boolean {
  if (!disabledDates) return false;
  return dateMatchModifiers(date, disabledDates);
}

/**
 * True when ANY day within `range` (endpoints and every day in between) is blocked by the
 * `disabledDates` matcher. An open-ended range (missing `from`/`to`) falls back to checking the
 * known endpoint so a half-built preset is still gated.
 */
function isRangeDisabled(
  range: DateRange | undefined,
  disabledDates: Matcher | Matcher[] | undefined,
): boolean {
  if (!disabledDates || !range) return false;
  if (range.from && range.to) {
    return rangeContainsModifiers(
      { from: range.from, to: range.to },
      disabledDates,
    );
  }
  const endpoint = range.from ?? range.to;
  return endpoint ? dateMatchModifiers(endpoint, disabledDates) : false;
}

/**
 * `defaultDatePresets` — Today / Tomorrow. Pass your own `presets` to override; this is a sensible
 * starting set for due-date style pickers.
 */
export function defaultDatePresets(now: Date = new Date()): DatePreset[] {
  return [
    { label: "Today", date: startOfDay(now) },
    { label: "Tomorrow", date: addDays(now, 1) },
  ];
}

/**
 * `defaultRangePresets` — Today / Last 7 days / Last 30 days. Pass your own `presets` to override.
 */
export function defaultRangePresets(now: Date = new Date()): DateRangePreset[] {
  const today = startOfDay(now);
  return [
    { label: "Today", range: { from: today, to: today } },
    { label: "Last 7 days", range: { from: addDays(now, -6), to: today } },
    { label: "Last 30 days", range: { from: addDays(now, -29), to: today } },
  ];
}

/** Shared preset-sidebar shell — a left rail of `ghost` buttons inside the popover. */
function PresetRail({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-slot="date-picker-presets"
      // Below sm the rail stacks ABOVE the calendar as a horizontally scrollable chip row —
      // side-by-side rail+calendar exceeds the popup's viewport-width clamp on narrow phones.
      className="flex flex-col gap-0.5 border-r border-border p-2 max-sm:flex-row max-sm:overflow-x-auto max-sm:border-r-0 max-sm:border-b"
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * DatePicker (single)
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `DatePicker`. */
export interface DatePickerProps {
  /** The selected date (controlled).
   * @default undefined
   */
  value?: Date;
  /** Fires with the new date (or `undefined` when cleared) on selection.
   * @default undefined
   */
  onValueChange?: (date: Date | undefined) => void;
  /**
   * Trigger text shown when no date is selected.
   * @default "Pick a date"
   */
  placeholder?: string;
  /**
   * `Intl.DateTimeFormat` options for the trigger label.
   * @default { year: 'numeric', month: 'short', day: 'numeric' }
   */
  formatOptions?: Intl.DateTimeFormatOptions;
  /** BCP-47 locale for formatting (defaults to the runtime locale).
   * @default undefined
   */
  locale?: string;
  /** Quick-select presets shown in a left rail. Omit for no presets.
   * @default undefined
   */
  presets?: DatePreset[];
  /** Dates to disable, forwarded to the calendar's `disabled` matcher.
   * @default undefined
   */
  disabledDates?: Matcher | Matcher[];
  /**
   * Props forwarded to the inner `Calendar` for DayPicker features such as
   * `timeZone`, `locale`, `footer`, `captionLayout`, `startMonth`,
   * `endMonth`, `labels`, and `formatters`. Selection ownership stays with
   * `DatePicker`, so `mode`, `selected`, `onSelect`, and `disabled` are not
   * accepted here.

   * @default undefined
   */
  calendarProps?: ForwardedCalendarProps;
  /** Disable the whole control.
   * @default undefined
   */
  disabled?: boolean;
  /**
   * Popover side relative to the trigger.
   * @default "bottom"
   */
  side?: React.ComponentProps<typeof PopoverContent>["side"];
  /**
   * Popover alignment relative to the trigger.
   * @default "start"
   */
  align?: React.ComponentProps<typeof PopoverContent>["align"];
  /** Extra classes for the trigger button.
   * @default undefined
   */
  className?: string;
  /** Accessible name for the trigger (recommended when there is no visible label).
   * @default undefined
   */
  "aria-label"?: string;
}

/**
 * `DatePicker` — pick a single date. Renders an outline `Button` showing the formatted date (or the
 * placeholder), opening a `Calendar` in a `Popover`. Selecting a day fires `onValueChange` and
 * closes the popover. Add `presets` for a Today / Tomorrow quick rail.
 *
 * @example
 * const [date, setDate] = React.useState<Date>();
 * <DatePicker value={date} onValueChange={setDate} />
 */
export function DatePicker({
  value,
  onValueChange,
  placeholder = "Pick a date",
  formatOptions = DEFAULT_DATE_FORMAT,
  locale,
  presets,
  disabledDates,
  calendarProps,
  disabled,
  side = "bottom",
  align = "start",
  className,
  "aria-label": ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const {
    defaultMonth,
    autoFocus = true,
    ...calendarRestProps
  } = calendarProps ?? {};

  const handleSelect = (date: Date | undefined) => {
    onValueChange?.(date);
    if (date) setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            disabled={disabled}
            data-slot="date-picker-trigger"
            data-empty={value ? undefined : ""}
            aria-label={ariaLabel}
            className={cn(
              // `w-full` like upstream's Input, Select trigger and Combobox trigger — a form
              // control takes its width from its parent. A fixed-width trigger overflowed a 320px
              // content area and was the only fixed-width control in the system (audit B8-03).
              "w-full justify-start gap-2 font-normal data-[empty]:text-muted-foreground",
              className,
            )}
          >
            <CalendarIcon
              className="size-4 text-muted-foreground"
              aria-hidden
            />
            {value ? formatDate(value, formatOptions, locale) : placeholder}
          </Button>
        }
      />
      <PopoverContent
        data-slot="date-picker-content"
        side={side}
        align={align}
        className={cn("w-auto p-0", presets && "flex max-sm:flex-col")}
      >
        {presets ? (
          <PresetRail>
            {presets.map((preset) => {
              // Honor the SAME `disabledDates` policy the calendar applies — a preset whose date
              // is blocked must be inert (disabled UI) and must never emit a value.
              const presetDisabled = isDateDisabled(preset.date, disabledDates);
              return (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  disabled={presetDisabled}
                  aria-disabled={presetDisabled || undefined}
                  className="justify-start font-normal"
                  onClick={() => {
                    // Defense in depth: never emit a disabled value even if the click slips through.
                    if (isDateDisabled(preset.date, disabledDates)) return;
                    onValueChange?.(preset.date);
                    setOpen(false);
                  }}
                >
                  {preset.label}
                </Button>
              );
            })}
          </PresetRail>
        ) : null}
        <Calendar
          components={POPOVER_CALENDAR_COMPONENTS}
          {...calendarRestProps}
          mode="single"
          selected={value}
          onSelect={handleSelect}
          defaultMonth={defaultMonth ?? value}
          disabled={disabledDates}
          autoFocus={autoFocus}
        />
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------------------------------------------------------
 * DateRangePicker
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `DateRangePicker`. */
export interface DateRangePickerProps {
  /** The selected range (controlled).
   * @default undefined
   */
  value?: DateRange;
  /** Fires with the new range (or `undefined` when cleared) on selection.
   * @default undefined
   */
  onValueChange?: (range: DateRange | undefined) => void;
  /**
   * Trigger text shown when no range is selected.
   * @default "Pick a date range"
   */
  placeholder?: string;
  /**
   * `Intl.DateTimeFormat` options for each end of the trigger label.
   * @default { year: 'numeric', month: 'short', day: 'numeric' }
   */
  formatOptions?: Intl.DateTimeFormatOptions;
  /** BCP-47 locale for formatting (defaults to the runtime locale).
   * @default undefined
   */
  locale?: string;
  /** Quick-select presets shown in a left rail. Omit for no presets.
   * @default undefined
   */
  presets?: DateRangePreset[];
  /** Dates to disable, forwarded to the calendar's `disabled` matcher.
   * @default undefined
   */
  disabledDates?: Matcher | Matcher[];
  /**
   * Props forwarded to the inner `Calendar` for DayPicker features such as
   * `timeZone`, `locale`, `footer`, `captionLayout`, `startMonth`,
   * `endMonth`, `labels`, and `formatters`. Selection ownership stays with
   * `DateRangePicker`, so `mode`, `selected`, `onSelect`, and `disabled` are
   * not accepted here.

   * @default undefined
   */
  calendarProps?: ForwardedCalendarProps;
  /** Disable the whole control.
   * @default undefined
   */
  disabled?: boolean;
  /**
   * Number of month grids to show side by side.
   * @default 2
   */
  numberOfMonths?: number;
  /**
   * Popover side relative to the trigger.
   * @default "bottom"
   */
  side?: React.ComponentProps<typeof PopoverContent>["side"];
  /**
   * Popover alignment relative to the trigger.
   * @default "start"
   */
  align?: React.ComponentProps<typeof PopoverContent>["align"];
  /** Extra classes for the trigger button.
   * @default undefined
   */
  className?: string;
  /** Accessible name for the trigger (recommended when there is no visible label).
   * @default undefined
   */
  "aria-label"?: string;
}

/**
 * `DateRangePicker` — pick a `{ from, to }` range across two months. Same shape as `DatePicker`:
 * an outline `Button` shows the formatted range and opens a two-month `Calendar` in a `Popover`.
 * The popover stays open until both ends are chosen. Add `presets` for Last 7 / Last 30 day rails.
 *
 * @example
 * const [range, setRange] = React.useState<DateRange>();
 * <DateRangePicker value={range} onValueChange={setRange} />
 */
export function DateRangePicker({
  value,
  onValueChange,
  placeholder = "Pick a date range",
  formatOptions = DEFAULT_DATE_FORMAT,
  locale,
  presets,
  disabledDates,
  calendarProps,
  disabled,
  numberOfMonths,
  side = "bottom",
  align = "start",
  className,
  "aria-label": ariaLabel,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  // react-day-picker may emit a same-day COMPLETE range on the first click. Closing from that
  // shape makes a two-endpoint gesture impossible, especially when replacing an existing range.
  // Track the current popover session explicitly and normalize its first day to an open range.
  const rangeSelectionStartedRef = React.useRef(false);
  const {
    defaultMonth,
    numberOfMonths: calendarNumberOfMonths,
    autoFocus = true,
    ...calendarRestProps
  } = calendarProps ?? {};

  const handleOpenChange = (nextOpen: boolean) => {
    rangeSelectionStartedRef.current = false;
    setOpen(nextOpen);
  };

  const handleSelect = (range: DateRange | undefined, triggerDate: Date) => {
    if (!rangeSelectionStartedRef.current) {
      rangeSelectionStartedRef.current = true;
      onValueChange?.({ from: triggerDate, to: undefined });
      return;
    }

    onValueChange?.(range);
    // Close only after the SECOND endpoint gesture produces a complete range.
    if (range?.from && range.to) setOpen(false);
  };

  const label = value?.from
    ? formatRange(value, formatOptions, locale)
    : placeholder;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            disabled={disabled}
            data-slot="date-range-picker-trigger"
            data-empty={value?.from ? undefined : ""}
            aria-label={ariaLabel}
            className={cn(
              // `w-full` — see the single DatePicker's note above (audit B8-03).
              "w-full justify-start gap-2 font-normal data-[empty]:text-muted-foreground",
              className,
            )}
          >
            <CalendarIcon
              className="size-4 text-muted-foreground"
              aria-hidden
            />
            {label}
          </Button>
        }
      />
      <PopoverContent
        data-slot="date-range-picker-content"
        side={side}
        align={align}
        className={cn("w-auto p-0", presets && "flex max-sm:flex-col")}
      >
        {presets ? (
          <PresetRail>
            {presets.map((preset) => {
              // A range preset is blocked when ANY day it spans (endpoints + every day between) is
              // disabled — same matcher the calendar uses, so the gate can't drift.
              const presetDisabled = isRangeDisabled(
                preset.range,
                disabledDates,
              );
              return (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  disabled={presetDisabled}
                  aria-disabled={presetDisabled || undefined}
                  className="justify-start font-normal"
                  onClick={() => {
                    // Defense in depth: never emit a range that intersects disabled dates.
                    if (isRangeDisabled(preset.range, disabledDates)) return;
                    onValueChange?.(preset.range);
                    setOpen(false);
                  }}
                >
                  {preset.label}
                </Button>
              );
            })}
          </PresetRail>
        ) : null}
        <Calendar
          components={POPOVER_CALENDAR_COMPONENTS}
          {...calendarRestProps}
          mode="range"
          selected={value}
          onSelect={handleSelect}
          defaultMonth={defaultMonth ?? value?.from}
          numberOfMonths={numberOfMonths ?? calendarNumberOfMonths ?? 2}
          disabled={disabledDates}
          autoFocus={autoFocus}
        />
      </PopoverContent>
    </Popover>
  );
}

export type { DateRange, Matcher } from "react-day-picker";
