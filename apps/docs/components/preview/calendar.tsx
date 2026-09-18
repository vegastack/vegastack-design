"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Clock2Icon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/calendar` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

/**
 * Every fixture pins its month to a fixed date rather than `new Date()`.
 *
 * The review captures and the geometry sweep both photograph these, and a calendar that starts on
 * "today" is a different picture every day — a diff that means nothing. `date-fns` is not imported
 * for the same reason the rest of the docs avoid a dependency it does not need: `addDays` here is
 * three lines and the package is only in the tree as react-day-picker's own.
 */
const YEAR = 2026;
const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export function calendar(): ReactNode {
  const [date, setDate] = React.useState<Date | undefined>(
    new Date(YEAR, 0, 12),
  );
  return (
    <Wrapper>
      <Calendar
        mode="single"
        defaultMonth={new Date(YEAR, 0, 1)}
        selected={date}
        onSelect={setDate}
        className="rounded-lg border"
      />
    </Wrapper>
  );
}

export function calendarAbout(): ReactNode {
  return (
    <Wrapper className="flex-col items-center gap-3">
      <Calendar
        mode="single"
        defaultMonth={new Date(YEAR, 0, 1)}
        selected={new Date(YEAR, 0, 12)}
        className="rounded-lg border"
      />
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        The day grid, the range logic and the month navigation are React
        DayPicker; the chrome, the tokens and the day button are ours.
      </p>
    </Wrapper>
  );
}

export function calendarDatePicker(): ReactNode {
  const [date, setDate] = React.useState<Date | undefined>(
    new Date(YEAR, 0, 12),
  );
  return (
    <Wrapper className="flex-col items-center gap-3">
      <Card className="w-fit p-0">
        <CardContent className="p-0">
          <Calendar
            mode="single"
            defaultMonth={new Date(YEAR, 0, 1)}
            selected={date}
            onSelect={setDate}
          />
        </CardContent>
      </Card>
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        Put this inside a Popover behind a Button and you have a date picker.
      </p>
    </Wrapper>
  );
}

export function calendarPersianHijriJalali(): ReactNode {
  return (
    <Wrapper className="flex-col items-center gap-3">
      <div dir="rtl">
        <Calendar
          mode="single"
          defaultMonth={new Date(YEAR, 0, 1)}
          selected={new Date(YEAR, 0, 12)}
          className="rounded-lg border"
        />
      </div>
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        The chrome mirrors for a right-to-left document on its own. Swapping the
        calendar system is one import in <code>components/ui/calendar.tsx</code>
        : <code>react-day-picker/persian</code>.
      </p>
    </Wrapper>
  );
}

export function calendarSelectedDateWithTimeZone(): ReactNode {
  const [date, setDate] = React.useState<Date | undefined>(
    new Date(YEAR, 0, 12),
  );
  const [timeZone, setTimeZone] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  return (
    <Wrapper className="flex-col items-center gap-3">
      <Calendar
        mode="single"
        defaultMonth={new Date(YEAR, 0, 1)}
        selected={date}
        onSelect={setDate}
        timeZone={timeZone}
        className="rounded-lg border"
      />
      <p className="text-sm text-muted-foreground">
        Time zone: {timeZone ?? "detecting…"}
      </p>
    </Wrapper>
  );
}

export function calendarBasic(): ReactNode {
  return (
    <Wrapper>
      <Calendar
        mode="single"
        defaultMonth={new Date(YEAR, 0, 1)}
        className="rounded-lg border"
      />
    </Wrapper>
  );
}

export function calendarRangeCalendar(): ReactNode {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(YEAR, 0, 12),
    to: addDays(new Date(YEAR, 0, 12), 30),
  });

  return (
    <Wrapper>
      <Calendar
        mode="range"
        defaultMonth={dateRange?.from}
        selected={dateRange}
        onSelect={setDateRange}
        numberOfMonths={2}
        className="rounded-lg border"
      />
    </Wrapper>
  );
}

export function calendarMonthAndYearSelector(): ReactNode {
  return (
    <Wrapper>
      <Calendar
        mode="single"
        defaultMonth={new Date(YEAR, 0, 1)}
        captionLayout="dropdown"
        className="rounded-lg border"
      />
    </Wrapper>
  );
}

export function calendarPresets(): ReactNode {
  const [date, setDate] = React.useState<Date | undefined>(
    new Date(YEAR, 1, 12),
  );
  const [month, setMonth] = React.useState<Date>(new Date(YEAR, 1, 1));
  const presets = [
    { label: "Today", days: 0 },
    { label: "In a week", days: 7 },
    { label: "In a month", days: 30 },
  ];
  const anchor = new Date(YEAR, 1, 12);

  return (
    <Wrapper>
      <Card className="w-fit p-0">
        <CardContent className="p-0">
          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            selected={date}
            onSelect={setDate}
          />
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 border-t bg-card pt-3">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => {
                const next = addDays(anchor, preset.days);
                setDate(next);
                setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
              }}
            >
              {preset.label}
            </Button>
          ))}
        </CardFooter>
      </Card>
    </Wrapper>
  );
}

export function calendarDateAndTimePicker(): ReactNode {
  const [date, setDate] = React.useState<Date | undefined>(
    new Date(YEAR, 0, 12),
  );

  return (
    <Wrapper>
      <Card size="sm" className="w-fit">
        <CardContent>
          <Calendar
            mode="single"
            defaultMonth={new Date(YEAR, 0, 1)}
            selected={date}
            onSelect={setDate}
            className="p-0"
          />
        </CardContent>
        <CardFooter className="border-t bg-card">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="time-from">Start Time</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="time-from"
                  type="time"
                  step="1"
                  defaultValue="10:30:00"
                  className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
                />
                <InputGroupAddon>
                  <Clock2Icon className="text-muted-foreground" />
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="time-to">End Time</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="time-to"
                  type="time"
                  step="1"
                  defaultValue="12:30:00"
                  className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
                />
                <InputGroupAddon>
                  <Clock2Icon className="text-muted-foreground" />
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </FieldGroup>
        </CardFooter>
      </Card>
    </Wrapper>
  );
}

export function calendarBookedDates(): ReactNode {
  const [date, setDate] = React.useState<Date | undefined>(
    new Date(YEAR, 0, 6),
  );
  const bookedDates = Array.from(
    { length: 15 },
    (_, index) => new Date(YEAR, 0, 12 + index),
  );

  return (
    <Wrapper>
      <Card className="w-fit p-0">
        <CardContent className="p-0">
          <Calendar
            mode="single"
            defaultMonth={new Date(YEAR, 0, 1)}
            selected={date}
            onSelect={setDate}
            disabled={bookedDates}
            modifiers={{ booked: bookedDates }}
            modifiersClassNames={{
              booked: "[&>button]:line-through opacity-100",
            }}
          />
        </CardContent>
      </Card>
    </Wrapper>
  );
}

export function calendarCustomCellSize(): ReactNode {
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: new Date(YEAR, 11, 8),
    to: addDays(new Date(YEAR, 11, 8), 10),
  });

  return (
    <Wrapper>
      <Card className="w-fit p-0">
        <CardContent className="p-0">
          <Calendar
            mode="range"
            defaultMonth={range?.from}
            selected={range}
            onSelect={setRange}
            numberOfMonths={1}
            captionLayout="dropdown"
            className="[--cell-size:--spacing(10)] md:[--cell-size:--spacing(12)]"
            formatters={{
              formatMonthDropdown: (date) =>
                date.toLocaleString("default", { month: "long" }),
            }}
            components={{
              DayButton: ({ children, modifiers, day, ...props }) => {
                const isWeekend =
                  day.date.getDay() === 0 || day.date.getDay() === 6;
                return (
                  <CalendarDayButton day={day} modifiers={modifiers} {...props}>
                    {children}
                    {!modifiers.outside && (
                      <span>{isWeekend ? "$120" : "$100"}</span>
                    )}
                  </CalendarDayButton>
                );
              },
            }}
          />
        </CardContent>
      </Card>
    </Wrapper>
  );
}

export function calendarWeekNumbers(): ReactNode {
  const [date, setDate] = React.useState<Date | undefined>(
    new Date(YEAR, 0, 12),
  );

  return (
    <Wrapper>
      <Card className="w-fit p-0">
        <CardContent className="p-0">
          <Calendar
            mode="single"
            defaultMonth={new Date(YEAR, 0, 1)}
            selected={date}
            onSelect={setDate}
            showWeekNumber
          />
        </CardContent>
      </Card>
    </Wrapper>
  );
}

export function calendarRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-center gap-4">
      <div dir="ltr">
        <Calendar
          mode="single"
          defaultMonth={new Date(YEAR, 0, 1)}
          selected={new Date(YEAR, 0, 12)}
          className="rounded-lg border"
        />
      </div>
      <div dir="rtl">
        <Calendar
          mode="single"
          defaultMonth={new Date(YEAR, 0, 1)}
          selected={new Date(YEAR, 0, 12)}
          className="rounded-lg border"
        />
      </div>
    </Wrapper>
  );
}

/** Ours: selected, today, disabled and outside days in one frame. */
export function calendarStates(): ReactNode {
  return (
    <Wrapper>
      <Calendar
        mode="single"
        defaultMonth={new Date(YEAR, 0, 1)}
        selected={new Date(YEAR, 0, 12)}
        today={new Date(YEAR, 0, 20)}
        disabled={[new Date(YEAR, 0, 5), new Date(YEAR, 0, 6)]}
        showOutsideDays
        className="rounded-lg border"
      />
    </Wrapper>
  );
}
