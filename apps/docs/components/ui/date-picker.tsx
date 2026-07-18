// @vegastack date-picker@0.2.0 sha256-wJOzJHuDJeL2RlVdJb6B7N5Nmr2yqfuqiwKga5j68Sw=

"use client";

import * as React from "react";
import {
  DayPicker,
  getDefaultClassNames,
  dateMatchModifiers,
  rangeContainsModifiers,
  type DateRange,
  type DayButton,
  type Matcher,
} from "react-day-picker";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
} from "lucide-react";
import { cn } from "@vegastack/design";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

/* ------------------------------------------------------------------------------------------------
 * DatePicker — single-date and range date selection, built on react-day-picker v9 + our Popover.
 *
 * Three exports:
 *  - `Calendar`        — a fully token-styled `DayPicker` (use it inline or compose it yourself).
 *  - `DatePicker`      — single date; a `Calendar` inside a `Popover` triggered by a `Button` that
 *                        shows the formatted date. Optional quick presets (Today / Tomorrow / ...).
 *  - `DateRangePicker` — the same, for a `{ from, to }` range across two months.
 *
 * Formatting uses the native `Intl.DateTimeFormat` (NO date-fns) so there is no extra runtime dep.
 * Token-only: the selected day is `bg-primary text-primary-foreground` (selection = primary ink), today gets a
 * neutral `ring`, and range middles use `bg-accent`. Every part carries a `data-slot` for styling + testing hooks.
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
 * Calendar
 * ----------------------------------------------------------------------------------------------*/

// react-day-picker's DayPicker props are a discriminated UNION (single|range|multiple), so we
// intersect (a `type`, not `interface extends`) to stay assignable across all modes.
export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  /**
   * Render days from the adjacent months to fill the leading/trailing week rows.
   * @default true
   */
  showOutsideDays?: boolean;
  /**
   * Ref to the calendar root element (`data-slot="calendar"`). `DayPicker` itself doesn't forward a
   * consumer ref, so we wire it onto the overridden `Root` host alongside react-day-picker's own
   * animation `rootRef`.
   */
  ref?: React.Ref<HTMLDivElement>;
};

/** Assign a value to one or more React refs (object or callback). */
function setRefs<T>(value: T | null, ...refs: (React.Ref<T> | undefined)[]) {
  for (const ref of refs) {
    if (typeof ref === "function") ref(value);
    else if (ref) (ref as React.RefObject<T | null>).current = value;
  }
}

/**
 * `Calendar` — a token-styled `react-day-picker` `DayPicker`. Forwards every DayPicker prop
 * (`mode`, `selected`, `onSelect`, `defaultMonth`, `numberOfMonths`, `disabled`, …) and overrides
 * the navigation chevrons (lucide) and the day button so selection/today/range states read from
 * our semantic tokens. Use it inline, or let `DatePicker` / `DateRangePicker` host it in a popover.
 *
 * @example
 * <Calendar mode="single" selected={date} onSelect={setDate} />
 */
export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components,
  ref,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("group/calendar p-3", className)}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months,
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          "inline-flex size-(--size-sm) items-center justify-center rounded-md text-muted-foreground transition-colors duration-fast ease-standard select-none hover:bg-accent hover:text-accent-foreground aria-disabled:pointer-events-none aria-disabled:opacity-(--opacity-dim)",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          "inline-flex size-(--size-sm) items-center justify-center rounded-md text-muted-foreground transition-colors duration-fast ease-standard select-none hover:bg-accent hover:text-accent-foreground aria-disabled:pointer-events-none aria-disabled:opacity-(--opacity-dim)",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-(--size-sm) w-full items-center justify-center px-7",
          defaultClassNames.month_caption,
        ),
        caption_label: cn(
          "text-base font-medium select-none",
          defaultClassNames.caption_label,
        ),
        dropdowns: cn(
          "flex h-(--size-sm) w-full items-center justify-center gap-1.5 text-base font-medium",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          // Inline-flex keeps the label + chevron on one line (Preflight makes the
          // ChevronDown svg display:block, which would otherwise wrap it under the
          // label). The chevron actually lives INSIDE the caption-label <span> child
          // (react-day-picker v10 renders Dropdown as root > [select, span[label, chevron]]),
          // so the child span gets the same inline-flex treatment via `[&>span]`.
          "relative inline-flex items-center rounded-md",
          "[&>span]:inline-flex [&>span]:items-center [&>span]:gap-1",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          "absolute inset-0 bg-popover opacity-0",
          defaultClassNames.dropdown,
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 rounded-md text-label-sm text-muted-foreground select-none",
          defaultClassNames.weekday,
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "w-7 select-none",
          defaultClassNames.week_number_header,
        ),
        week_number: cn(
          "text-sm text-muted-foreground select-none",
          defaultClassNames.week_number,
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full p-0 text-center select-none",
          defaultClassNames.day,
        ),
        // Range surfaces — the middle reads from the soft `accent` token; ends are handled on the
        // day button itself so they sit on `bg-primary`.
        range_start: cn(
          "rounded-l-md bg-accent",
          defaultClassNames.range_start,
        ),
        range_middle: cn(
          "rounded-none bg-accent text-accent-foreground",
          defaultClassNames.range_middle,
        ),
        range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
        today: cn("text-foreground", defaultClassNames.today),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "text-muted-foreground opacity-(--opacity-dim)",
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className: rootClassName, rootRef, ...rootProps }) => (
          <div
            data-slot="calendar"
            // Wire both refs: react-day-picker's animation `rootRef` and the consumer `ref`.
            ref={(node) => setRefs(node, rootRef, ref)}
            className={cn(rootClassName)}
            {...rootProps}
          />
        ),
        Chevron: ({
          className: chevronClassName,
          orientation,
          ...chevronProps
        }) => {
          if (orientation === "left") {
            return (
              <ChevronLeft
                className={cn("size-4", chevronClassName)}
                {...chevronProps}
              />
            );
          }
          if (orientation === "right") {
            return (
              <ChevronRight
                className={cn("size-4", chevronClassName)}
                {...chevronProps}
              />
            );
          }
          return (
            <ChevronDown
              className={cn("size-4", chevronClassName)}
              {...chevronProps}
            />
          );
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  );
}

export type CalendarDayButtonProps = React.ComponentProps<typeof DayButton>;

/**
 * `CalendarDayButton` — the per-day button. Token-driven state styling via `data-*`:
 * `data-selected-single` / `data-range-start` / `data-range-end` paint `bg-primary
 * text-primary-foreground` (selection = primary ink); `data-today` adds a neutral `ring`. Auto-focuses when
 * react-day-picker marks the day focused (keyboard navigation).
 */
export function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: CalendarDayButtonProps) {
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    // `preventScroll` is load-bearing: with `autoFocus` (the DatePicker default), this effect
    // fires on the calendar's first paint — while the portaled popup is still UNPOSITIONED at
    // the document's top-left. A plain `.focus()` (what react-day-picker's own DayButton does)
    // makes the browser scroll the page to that pre-position spot, yanking the viewport to the
    // top whenever a below-the-fold trigger opens the picker. The popup is fixed-positioned, so
    // suppressing the scroll loses nothing — keyboard focus still lands on the day.
    if (modifiers.focused) ref.current?.focus({ preventScroll: true });
  }, [modifiers.focused]);

  const isSelectedSingle =
    modifiers.selected &&
    !modifiers.range_start &&
    !modifiers.range_end &&
    !modifiers.range_middle;

  return (
    // Native button (not our <Button>) so react-day-picker can ref + focus it for keyboard nav.
    <button
      ref={ref}
      type="button"
      data-slot="calendar-day"
      data-day={day.date.toLocaleDateString()}
      data-today={modifiers.today ? "" : undefined}
      data-selected-single={isSelectedSingle ? "" : undefined}
      data-range-start={modifiers.range_start ? "" : undefined}
      data-range-end={modifiers.range_end ? "" : undefined}
      data-range-middle={modifiers.range_middle ? "" : undefined}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "flex aspect-square size-auto w-full min-w-(--size-md) flex-col gap-1 rounded-md leading-none font-normal",
        // Neutral hover for an unselected day.
        "hover:bg-accent hover:text-accent-foreground",
        // Today: a quiet neutral ring so it reads even when not selected.
        "data-[today]:ring-2 data-[today]:ring-ring/(--alpha-outline-soft)",
        // Selected single + range ends: solid primary surface (selection = primary ink).
        "data-[selected-single]:bg-primary data-[selected-single]:text-primary-foreground data-[selected-single]:ring-0 data-[selected-single]:hover:bg-primary",
        "data-[range-start]:rounded-l-md data-[range-start]:bg-primary data-[range-start]:text-primary-foreground data-[range-start]:ring-0 data-[range-start]:hover:bg-primary",
        "data-[range-end]:rounded-r-md data-[range-end]:bg-primary data-[range-end]:text-primary-foreground data-[range-end]:ring-0 data-[range-end]:hover:bg-primary",
        // Range middle: soft accent surface, square corners.
        "data-[range-middle]:rounded-none data-[range-middle]:bg-accent data-[range-middle]:text-accent-foreground",
        className,
      )}
      {...props}
    />
  );
}

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

export interface DatePickerProps {
  /** The selected date (controlled). */
  value?: Date;
  /** Fires with the new date (or `undefined` when cleared) on selection. */
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
  /** BCP-47 locale for formatting (defaults to the runtime locale). */
  locale?: string;
  /** Quick-select presets shown in a left rail. Omit for no presets. */
  presets?: DatePreset[];
  /** Dates to disable, forwarded to the calendar's `disabled` matcher. */
  disabledDates?: Matcher | Matcher[];
  /**
   * Props forwarded to the inner `Calendar` for DayPicker features such as
   * `timeZone`, `locale`, `footer`, `captionLayout`, `startMonth`,
   * `endMonth`, `labels`, and `formatters`. Selection ownership stays with
   * `DatePicker`, so `mode`, `selected`, `onSelect`, and `disabled` are not
   * accepted here.
   */
  calendarProps?: Omit<
    CalendarProps,
    "mode" | "selected" | "onSelect" | "disabled"
  >;
  /** Disable the whole control. */
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
  /** Extra classes for the trigger button. */
  className?: string;
  /** Accessible name for the trigger (recommended when there is no visible label). */
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
              "w-56 justify-start gap-2 font-normal data-[empty]:text-muted-foreground",
              className,
            )}
          >
            <CalendarIcon
              className="size-(--icon-default) text-muted-foreground"
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

export interface DateRangePickerProps {
  /** The selected range (controlled). */
  value?: DateRange;
  /** Fires with the new range (or `undefined` when cleared) on selection. */
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
  /** BCP-47 locale for formatting (defaults to the runtime locale). */
  locale?: string;
  /** Quick-select presets shown in a left rail. Omit for no presets. */
  presets?: DateRangePreset[];
  /** Dates to disable, forwarded to the calendar's `disabled` matcher. */
  disabledDates?: Matcher | Matcher[];
  /**
   * Props forwarded to the inner `Calendar` for DayPicker features such as
   * `timeZone`, `locale`, `footer`, `captionLayout`, `startMonth`,
   * `endMonth`, `labels`, and `formatters`. Selection ownership stays with
   * `DateRangePicker`, so `mode`, `selected`, `onSelect`, and `disabled` are
   * not accepted here.
   */
  calendarProps?: Omit<
    CalendarProps,
    "mode" | "selected" | "onSelect" | "disabled"
  >;
  /** Disable the whole control. */
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
  /** Extra classes for the trigger button. */
  className?: string;
  /** Accessible name for the trigger (recommended when there is no visible label). */
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
  const {
    defaultMonth,
    numberOfMonths: calendarNumberOfMonths,
    autoFocus = true,
    ...calendarRestProps
  } = calendarProps ?? {};

  const handleSelect = (range: DateRange | undefined) => {
    onValueChange?.(range);
    // Close once a complete range (both ends) is chosen.
    if (range?.from && range.to) setOpen(false);
  };

  const label = value?.from
    ? formatRange(value, formatOptions, locale)
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            disabled={disabled}
            data-slot="date-range-picker-trigger"
            data-empty={value?.from ? undefined : ""}
            aria-label={ariaLabel}
            className={cn(
              "w-72 justify-start gap-2 font-normal data-[empty]:text-muted-foreground",
              className,
            )}
          >
            <CalendarIcon
              className="size-(--icon-default) text-muted-foreground"
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
