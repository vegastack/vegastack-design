// @vegastack date-picker@0.23.10 sha256-grNV6IqjOZGdp4Errn/blOEBPQstKZYtyh72kHKiS6E=

"use client";

import * as React from "react";
import {
  dateMatchModifiers,
  rangeContainsModifiers,
  type DateRange,
  type DayButton,
  type Matcher,
} from "react-day-picker";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Field as FieldPrimitive } from "@base-ui/react/field";
import { cn, mergeRefs } from "@vegastack/design";
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

/**
 * The popup the pickers share. Upstream's `PopoverContent` is a padded `flex-col gap-2.5` card;
 * here it is a frameless host for the rail and the calendar, which own their padding. Without the
 * `gap-0` the popover's column gap would sit between them, and without an explicit `flex-row` for a
 * rail the popover's own `flex-col` wins the merge and the "inline-start" rail stacks ABOVE the
 * calendar at every width — which is how its `border-e` ended up drawn along the popup's own
 * edge, a doubled hairline, rather than between the two.
 */
const POPUP_CLASSES = "w-auto gap-0 p-0";

/**
 * The calendar inside the popup is transparent, so it reads as the popup's own surface. Upstream's
 * `calendar` does this itself for `in-data-[slot=popover-content]`, but the pickers rename the
 * popup `date-picker-content` / `date-range-picker-content` (their public hooks), so that selector
 * never matched and the calendar painted `bg-background` over `bg-popover` — two tones in dark.
 */
const POPUP_CALENDAR_CLASSES = "bg-transparent";

/** Shared preset-sidebar shell — an inline-start rail of `ghost` buttons inside the popover. */
function PresetRail({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-slot="date-picker-presets"
      // The divider is drawn only on the side that FACES the calendar: `border-e` while the rail
      // sits at the inline start, `border-b` once it stacks above it. Below sm the rail becomes a
      // horizontally scrollable chip row — side-by-side rail+calendar exceeds the popup's
      // viewport-width clamp on narrow phones.
      className="flex shrink-0 flex-col gap-0.5 border-e border-border p-2 max-sm:flex-row max-sm:overflow-x-auto max-sm:border-e-0 max-sm:border-b"
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
  /**
   * Trigger height: `sm` (28px) is the inline tier shared with `Select size="sm"` and
   * `SearchableSelect size="sm"`, for table rows and toolbars.
   * @default 'default'
   */
  size?: "sm" | "default";
  /**
   * `ghost` is the inline trigger: content width, no border at rest, the border on hover, on
   * focus and while the calendar is open — the same tier as `Select variant="ghost"`.
   * @default 'outline'
   */
  variant?: "outline" | "ghost";
  /**
   * Shows a clear control beside the trigger while a date is set, which reports `undefined`.
   * It is a sibling of the trigger, never inside it, and focus returns to the trigger after
   * clearing.
   * @default false
   */
  clearable?: boolean;
  /**
   * Accessible name for the clear control.
   * @default "Clear date"
   */
  clearLabel?: string;
  /**
   * Renders the selected date on the trigger in place of the formatted date — e.g.
   * `(date) => \`Due ${format(date)}\``.
   * @default undefined
   */
  renderValue?: (date: Date) => React.ReactNode;
  /** Ref forwarded to the trigger button.
   * @default undefined
   */
  ref?: React.Ref<HTMLButtonElement>;
}

/** The inline (`ghost`) trigger chrome shared with `Select variant="ghost"`. */
const GHOST_TRIGGER =
  "border-transparent bg-transparent shadow-none hover:border-input focus:border-ring/70 aria-expanded:border-input dark:bg-transparent";

/**
 * `DatePicker` — pick a single date. Renders an outline `Button` showing the formatted date (or the
 * placeholder), opening a `Calendar` in a `Popover`. Selecting a day fires `onValueChange` and
 * closes the popover. Add `presets` for a Today / Tomorrow quick rail.
 *
 * @example
 * const [date, setDate] = React.useState<Date>();
 * <DatePicker value={date} onValueChange={setDate} />
 *
 * @example
 * // Inline in a table row: the small ghost tier, clearable, with a custom face
 * <DatePicker
 *   size="sm"
 *   variant="ghost"
 *   clearable
 *   value={due}
 *   onValueChange={setDue}
 *   renderValue={(date) => `Due ${formatShort(date)}`}
 * />
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
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  size = "default",
  variant = "outline",
  clearable = false,
  clearLabel = "Clear date",
  renderValue,
  ref,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [trigger, setTrigger] = React.useState<HTMLButtonElement | null>(null);
  const triggerRef = React.useMemo(() => mergeRefs(setTrigger, ref), [ref]);
  const showClear = clearable && value !== undefined;
  const ghost = variant === "ghost";
  const {
    defaultMonth,
    autoFocus = true,
    ...calendarRestProps
  } = calendarProps ?? {};

  const handleSelect = (date: Date | undefined) => {
    onValueChange?.(date);
    if (date) setOpen(false);
  };

  const picker = (
    <Popover open={open} onOpenChange={setOpen}>
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
                ref={triggerRef}
                variant="outline"
                size={size === "sm" ? "sm" : "default"}
                data-slot="date-picker-trigger"
                data-size={size}
                data-variant={variant}
                data-empty={value ? undefined : ""}
                aria-label={ariaLabel}
                className={cn(
                  // `w-full` like upstream's Input, Select trigger and Combobox trigger — a form
                  // control takes its width from its parent. A fixed-width trigger overflowed a 320px
                  // content area and was the only fixed-width control in the system (audit B8-03).
                  "w-full justify-start gap-2 font-normal data-[empty]:text-muted-foreground",
                  // The `sm` tier keeps 14px text, like `Select size="sm"`.
                  size === "sm" && "text-sm",
                  ghost && GHOST_TRIGGER,
                  // Content width for the inline tier. A clearable picker's wrapper carries the
                  // width instead, and the trigger fills it, so the clear control always sits in
                  // the trigger's own trailing reserve.
                  ghost && !clearable && "w-fit",
                  // The clear control's reserve, so the label does not move when a date is set.
                  clearable && "pe-9",
                  className,
                )}
              >
                <CalendarIcon
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
                {/* A flex child only truncates with `min-w-0` (LAY-11). */}
                <span className="min-w-0 truncate">
                  {value
                    ? (renderValue?.(value) ??
                      formatDate(value, formatOptions, locale))
                    : placeholder}
                </span>
              </Button>
            }
          />
        }
      />
      <PopoverContent
        data-slot="date-picker-content"
        side={side}
        align={align}
        className={cn(POPUP_CLASSES, presets && "flex-row max-sm:flex-col")}
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
          className={cn(POPUP_CALENDAR_CLASSES, calendarRestProps.className)}
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

  if (!clearable) return picker;

  // DS-22: the clear control is a SIBLING after the trigger — an interactive control may not
  // contain another — sharing the trigger's trailing `pe-9` reserve. It unmounts the moment the
  // date clears, so it hands focus to the trigger first; no announcement, the change is visible.
  return (
    <div
      data-slot="date-picker"
      className={cn("relative min-w-0", ghost ? "w-fit" : "w-full")}
    >
      {picker}
      {showClear ? (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={clearLabel}
          disabled={disabled}
          data-slot="date-picker-clear"
          className="absolute end-1.5 top-1/2 -translate-y-1/2"
          onClick={() => {
            trigger?.focus();
            onValueChange?.(undefined);
          }}
        >
          <X />
        </Button>
      ) : null}
    </div>
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
          className={cn(POPUP_CALENDAR_CLASSES, calendarRestProps.className)}
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
