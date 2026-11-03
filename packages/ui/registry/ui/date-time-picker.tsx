// @vegastack date-time-picker@0.29.3 sha256-rUehoVTDb0b9mVdEhgmNYEHs7aDraNScp6iRLxaWpoE=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import {
  fromZoned,
  parseCalendarDay,
  toCalendarDay,
  zonedParts,
} from "@/lib/date-time";
import { DatePicker } from "@/components/ui/date-picker";
import { useTimeZone } from "@/components/ui/relative-time";
import {
  TimePicker,
  type TimePickerHourCycle,
} from "@/components/ui/time-picker";

/* ------------------------------------------------------------------------------------------------
 * DateTimePicker — one moment: our `DatePicker` and `TimePicker` side by side in one named group.
 * The value is an instant (a `Date`); both halves show and edit it on the clock of `timeZone` (the
 * reader's, from `TimeZoneProvider`, else the runtime's), so a 09:00 picked in Asia/Kolkata is
 * 03:30 UTC. Picking only a day sets `defaultTime`. A wall time the zone skips (the spring change)
 * moves forward past the gap; one it repeats keeps the offset the value had.
 * ----------------------------------------------------------------------------------------------*/

/** Every string the group names its parts with. */
export interface DateTimePickerLabels {
  /** The date trigger's accessible name. */
  date: string;
  /** The time field's accessible name. */
  time: string;
  /** The date trigger's text while empty. */
  datePlaceholder: string;
  /** The time field's text while empty. */
  timePlaceholder: string;
  /** The clear control's accessible name (`clearable`). */
  clear: string;
}

const DEFAULT_LABELS: DateTimePickerLabels = {
  date: "Date",
  time: "Time",
  datePlaceholder: "Pick a date",
  timePlaceholder: "Time",
  clear: "Clear date and time",
};

/** Props for `DateTimePicker`; any other attribute goes on the group's root. */
export interface DateTimePickerProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children" | "defaultValue" | "onChange"
> {
  /** The moment (controlled); `undefined` for none.
   * @default undefined
   */
  value?: Date;
  /**
   * Fires with the new moment when the day or the time changes, and with `undefined` when the
   * date is cleared.
   * @default undefined
   */
  onValueChange?: (value: Date | undefined) => void;
  /**
   * IANA zone whose clock both halves show. Omit it to use the reader's zone from
   * `TimeZoneProvider`, else the runtime's.
   * @default undefined
   */
  timeZone?: string;
  /**
   * The time a day picked on its own takes, `HH:MM` (24-hour).
   * @default "09:00"
   */
  defaultTime?: string;
  /**
   * Minutes between the times in the list (`TimePicker`'s `step`).
   * @default 15
   */
  step?: number;
  /**
   * `h12` or `h23`; omit it and the locale decides.
   * @default undefined
   */
  hourCycle?: TimePickerHourCycle;
  /** BCP-47 locale for both halves.
   * @default undefined
   */
  locale?: string;
  /**
   * `sm` (28px) for table rows and toolbars; `default` (32px) for forms.
   * @default "default"
   */
  size?: "sm" | "default";
  /**
   * `ghost` is the inline tier (a grid cell): no borders at rest, a border on hover and while
   * open or typing.
   * @default "outline"
   */
  variant?: "outline" | "ghost";
  /**
   * Shows the date's clear control while a moment is set; clearing reports `undefined`.
   * @default false
   */
  clearable?: boolean;
  /** Disable both halves.
   * @default undefined
   */
  disabled?: boolean;
  /**
   * `id` for the date trigger, so a `FieldLabel htmlFor` names the field and opens the calendar.
   * @default undefined
   */
  id?: string;
  /** The group's accessible name (the field's label when there is no visible one).
   * @default undefined
   */
  "aria-label"?: string;
  /** Ids describing both halves — a `FieldDescription` or `FieldError`.
   * @default undefined
   */
  "aria-describedby"?: string;
  /** Marks both halves invalid.
   * @default undefined
   */
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  /** Replace any of the strings (`DateTimePickerLabels`).
   * @default undefined
   */
  labels?: Partial<DateTimePickerLabels>;
}

/**
 * `DateTimePicker` — a date and a time of day as one value: the `DatePicker` trigger, then the
 * `TimePicker` field, on one line where the date still has 8rem, wrapping under it where not. The
 * time stays disabled until there is a day; a day picked alone takes `defaultTime` (09:00). Both
 * halves show the moment on the reader's clock.
 *
 * @example
 * const [due, setDue] = React.useState<Date>();
 * <DateTimePicker aria-label="Due" value={due} onValueChange={setDue} clearable />
 *
 * @example
 * // A grid cell: the small inline tier, in a fixed zone, on a 24-hour clock
 * <DateTimePicker size="sm" variant="ghost" timeZone="Europe/Berlin" hourCycle="h23" value={at} onValueChange={setAt} />
 */
export function DateTimePicker({
  value,
  onValueChange,
  timeZone: timeZoneProp,
  defaultTime = "09:00",
  step,
  hourCycle,
  locale,
  size = "default",
  variant = "outline",
  clearable = false,
  disabled,
  className,
  id,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  labels: labelsProp,
  ...props
}: DateTimePickerProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const readerZone = useTimeZone();
  const timeZone = timeZoneProp ?? readerZone;
  const valid = value && !Number.isNaN(value.getTime()) ? value : undefined;
  const iso = valid?.toISOString() ?? null;
  const current = iso ? zonedParts(iso, timeZone) : null;
  const commit = (day: string | null, time: string) =>
    onValueChange?.(
      day ? new Date(fromZoned(day, time, timeZone, iso)) : undefined,
    );

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      data-slot="date-time-picker"
      data-size={size}
      data-variant={variant}
      data-empty={current ? undefined : ""}
      {...props}
      className={cn(
        // The date takes what the time leaves, on one line while 8rem of date still fits.
        "flex w-full min-w-0 flex-wrap items-center gap-2",
        "[&>[data-slot=date-picker]]:w-auto [&>[data-slot=date-picker]]:flex-1 [&>[data-slot=date-picker]]:basis-32",
        className,
      )}
    >
      <DatePicker
        id={id}
        size={size}
        variant={variant}
        clearable={clearable}
        clearLabel={labels.clear}
        locale={locale}
        aria-label={labels.date}
        placeholder={labels.datePlaceholder}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        disabled={disabled}
        className="w-auto min-w-0 flex-1 basis-32"
        value={current ? parseCalendarDay(current.day) : undefined}
        onValueChange={(day) =>
          commit(day ? toCalendarDay(day) : null, current?.time ?? defaultTime)
        }
      />
      <TimePicker
        size={size}
        variant={variant}
        step={step}
        hourCycle={hourCycle}
        locale={locale}
        aria-label={labels.time}
        placeholder={labels.timePlaceholder}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        disabled={disabled || !current}
        // Room for "12:45 PM" at each tier, so a 16rem row keeps both halves on one line.
        className={cn("shrink-0", size === "sm" ? "w-28" : "w-32")}
        value={current?.time ?? null}
        onValueChange={(time) => {
          // Emptying the time keeps the day at the default time; only the date clears the value.
          if (current) commit(current.day, time ?? defaultTime);
        }}
      />
    </div>
  );
}
