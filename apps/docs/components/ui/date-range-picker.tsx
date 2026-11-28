// @vegastack date-picker@0.143.1 sha256-ZZas7xvf11wonOBCpfSwauYK5NkKjvKjzT9AJiTE5yo=

"use client";

import * as React from "react";
import { zonedToday, type DateFormat } from "@/lib/date-time";
import type { DateRange, Matcher } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";
import { Field as FieldPrimitive } from "@base-ui/react/field";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  addDays,
  CalendarBody,
  DEFAULT_TRIGGER_FORMAT,
  formatDate,
  POPOVER_CALENDAR_COMPONENTS,
  POPUP_CALENDAR_CLASSES,
  POPUP_CLASSES,
  prefetchCalendar,
  PresetRail,
  useZonedToday,
  type CalendarParts,
  type DatePresetOptions,
  type ForwardedCalendarProps,
} from "@/components/ui/date-picker";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useDateFormat } from "@/components/ui/relative-time";

/* ------------------------------------------------------------------------------------------------
 * DateRangePicker — a `{ from, to }` range across two months, the range sibling of `DatePicker`.
 * It lives in its own file, shipped in the `date-picker` registry item, so a page pays for it only
 * when it renders one: a bundler keeps or drops a module's exports for the whole app, and in
 * `date-picker.tsx` a single range picker anywhere put this code on every page with a date field.
 * The lazy calendar engine, the popup classes, the preset rail and the trigger format are
 * `date-picker.tsx`'s, imported, so the two pickers can't drift apart.
 * ----------------------------------------------------------------------------------------------*/

/** A quick-select preset for the `DateRangePicker` — a label and the range it applies. */
export interface DateRangePreset {
  /** Button text, e.g. "Last 7 days". */
  label: string;
  /** The `{ from, to }` range this preset selects. */
  range: DateRange;
}

/**
 * `defaultRangePresets` — Today / Last 7 days / Last 30 days. Pass your own `presets` to override.
 * "Today" is the calendar day in `options.timeZone`.
 */
export function defaultRangePresets(
  now: Date = new Date(),
  options: DatePresetOptions = {},
): DateRangePreset[] {
  const today = zonedToday(now, options.timeZone);
  return [
    { label: "Today", range: { from: today, to: today } },
    { label: "Last 7 days", range: { from: addDays(today, -6), to: today } },
    { label: "Last 30 days", range: { from: addDays(today, -29), to: today } },
  ];
}

/** Format a `{ from, to }` range, collapsing to a single date when `to` is absent. */
function formatRange(
  range: DateRange,
  options: Intl.DateTimeFormatOptions,
  locale?: string,
  dateFormat?: DateFormat,
): string {
  if (!range.from) return "";
  const one = (date: Date) => formatDate(date, options, locale, dateFormat);
  if (!range.to) return one(range.from);
  return `${one(range.from)} – ${one(range.to)}`;
}

/**
 * True when ANY day within `range` (endpoints and every day in between) is blocked by the
 * `disabledDates` matcher. An open-ended range (missing `from`/`to`) falls back to checking the
 * known endpoint so a half-built preset is still gated.
 */
function isRangeDisabled(
  parts: CalendarParts,
  range: DateRange | undefined,
  disabledDates: Matcher | Matcher[] | undefined,
): boolean {
  if (!disabledDates || !range) return false;
  if (range.from && range.to) {
    return parts.rangeContainsModifiers(
      { from: range.from, to: range.to },
      disabledDates,
    );
  }
  const endpoint = range.from ?? range.to;
  return endpoint ? parts.dateMatchModifiers(endpoint, disabledDates) : false;
}

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
  /** BCP-47 locale for formatting (defaults to `DEFAULT_LOCALE`, `en-US`, so the server and the browser agree).
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
  /**
   * `id` for the trigger button, so a `FieldLabel htmlFor` (or any `<label for>`) names it and
   * clicking the label opens the picker — the same binding every other form control takes.
   * @default undefined
   */
  id?: string;
  /**
   * Ids of the elements describing the trigger — a `FieldDescription` or `FieldError`.
   * @default undefined
   */
  "aria-describedby"?: string;
  /**
   * Marks the trigger invalid; the outline `Button` shows its destructive border, exactly as an
   * invalid `Input` or `SelectTrigger` does inside a `Field data-invalid`.
   * @default undefined
   */
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
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
  formatOptions = DEFAULT_TRIGGER_FORMAT,
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
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
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
  const today = useZonedToday(open, calendarRestProps);
  const dateFormat = useDateFormat();

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
    ? formatRange(value, formatOptions, locale, dateFormat)
    : placeholder;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      {/* DS-47: the trigger renders through Base UI `Field.Control`, so inside a `Field` it takes
          its label, description and error ids and `aria-invalid` from the Field. The explicit
          props below still win (`id`) or come first (`aria-describedby`). */}
      <FieldPrimitive.Control
        id={id}
        disabled={disabled}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        render={
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                onPointerEnter={prefetchCalendar}
                onFocus={prefetchCalendar}
                data-slot="date-range-picker-trigger"
                data-empty={value?.from ? undefined : ""}
                aria-label={ariaLabel}
                className={cn(
                  // `w-full` — see the single DatePicker's note in date-picker.tsx (audit B8-03).
                  "w-full justify-start gap-2 font-normal data-[empty]:text-muted-foreground",
                  className,
                )}
              >
                <CalendarIcon
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
                <span className="min-w-0 truncate">{label}</span>
              </Button>
            }
          />
        }
      />
      <PopoverContent
        data-slot="date-range-picker-content"
        side={side}
        align={align}
        className={cn(POPUP_CLASSES, presets && "flex-row max-sm:flex-col")}
      >
        <CalendarBody>
          {(parts) => (
            <>
              {presets ? (
                <PresetRail>
                  {presets.map((preset) => {
                    // A range preset is blocked when ANY day it spans (endpoints + every day between) is
                    // disabled — same matcher the calendar uses, so the gate can't drift.
                    const presetDisabled = isRangeDisabled(
                      parts,
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
                          if (
                            isRangeDisabled(parts, preset.range, disabledDates)
                          )
                            return;
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
              <parts.Calendar
                components={POPOVER_CALENDAR_COMPONENTS}
                {...calendarRestProps}
                className={cn(
                  POPUP_CALENDAR_CLASSES,
                  calendarRestProps.className,
                )}
                today={today}
                mode="range"
                selected={value}
                onSelect={handleSelect}
                defaultMonth={defaultMonth ?? value?.from ?? today}
                numberOfMonths={numberOfMonths ?? calendarNumberOfMonths ?? 2}
                disabled={disabledDates}
                autoFocus={autoFocus}
              />
            </>
          )}
        </CalendarBody>
      </PopoverContent>
    </Popover>
  );
}

export type { DateRange, Matcher } from "react-day-picker";
