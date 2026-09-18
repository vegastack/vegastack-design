"use client";

import * as React from "react";
import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/date-picker` (dogfoods the registry) → auto-scanned.
import {
  DatePicker,
  DateRangePicker,
  defaultDatePresets,
  defaultRangePresets,
  type DatePreset,
  type DateRange,
} from "@/components/ui/date-picker";

/**
 * These pages are STATICALLY EXPORTED, so the trigger label is formatted once on the build host
 * and then hydrated in a browser that may resolve a different default locale — `Jun 24, 2026`
 * against `24 Jun 2026`. That is a text hydration mismatch (React #418), and it is what every
 * capture lane hit on this route until the fixtures pinned a locale. Any prerendered
 * `Intl.DateTimeFormat` output needs an explicit locale; the picker takes one.
 */
const DOCS_LOCALE = "en-US";

/** Selected day within the reference month (the primary-filled cell). */
const SELECTED = new Date(2026, 5, 18);

/** Default example — a single-date picker seeded with a selection, plus the open calendar inline. */
export function datePicker(): ReactNode {
  const [date, setDate] = useState<Date | undefined>(SELECTED);
  return (
    <Wrapper className="flex-col items-start gap-4">
      {/* The trigger is `w-full` like every other form control — the PARENT constrains it
          (audit B8-03). Every example below does the same. */}
      <div className="w-full max-w-56">
        <DatePicker
          value={date}
          onValueChange={setDate}
          locale={DOCS_LOCALE}
          aria-label="Pick a date"
        />
      </div>
    </Wrapper>
  );
}

/** Single-date picker with a Today / Tomorrow quick-select rail. */
export function datePickerPresets(): ReactNode {
  const [date, setDate] = useState<Date | undefined>(SELECTED);
  return (
    <Wrapper>
      <div className="w-full max-w-56">
        <DatePicker
          value={date}
          onValueChange={setDate}
          presets={defaultDatePresets()}
          locale={DOCS_LOCALE}
          aria-label="Pick a date"
        />
      </div>
    </Wrapper>
  );
}

/** Range picker — selects a `{ from, to }` window across two months, with Last 7 / 30 day presets. */
export function datePickerRange(): ReactNode {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(2026, 5, 9),
    to: new Date(2026, 5, 18),
  });
  return (
    <Wrapper>
      <div className="w-full max-w-72">
        <DateRangePicker
          value={range}
          onValueChange={setRange}
          presets={defaultRangePresets()}
          locale={DOCS_LOCALE}
          aria-label="Pick a date range"
        />
      </div>
    </Wrapper>
  );
}

/**
 * `disabledDates` gating — the inline calendar blocks an entire week (Jun 14–20) and a preset whose
 * date falls inside it (Tomorrow → Jun 13 stays live, but a custom "Mid-June" preset on Jun 17 is
 * rendered inert). Blocked days read at reduced opacity; the gated preset never emits.
 */
export function datePickerDisabledDates(): ReactNode {
  const [date, setDate] = useState<Date | undefined>(undefined);
  // Block the whole third week of June 2026.
  const blocked: DateRange = {
    from: new Date(2026, 5, 14),
    to: new Date(2026, 5, 20),
  };
  // A preset that lands inside the blocked week → gated; one outside → live.
  const presets: DatePreset[] = [
    { label: "Jun 9 (open)", date: new Date(2026, 5, 9) },
    { label: "Jun 17 (blocked)", date: new Date(2026, 5, 17) },
  ];
  return (
    <Wrapper className="flex-col items-start gap-4">
      <div className="w-full max-w-56">
        <DatePicker
          value={date}
          onValueChange={setDate}
          presets={presets}
          disabledDates={blocked}
          locale={DOCS_LOCALE}
          aria-label="Pick a date"
        />
      </div>
    </Wrapper>
  );
}

/** Disabled state — the whole control is inert; the trigger reads dimmed and never opens. */
export function datePickerDisabled(): ReactNode {
  return (
    <Wrapper>
      <div className="w-full max-w-56">
        <DatePicker
          value={SELECTED}
          disabled
          locale={DOCS_LOCALE}
          aria-label="Pick a date"
        />
      </div>
    </Wrapper>
  );
}

/**
 * `captionLayout="dropdown"` — forwarded through `calendarProps`, this swaps the static month/year
 * caption for navigable month + year dropdowns, bounded by `startMonth` / `endMonth`.
 */
export function datePickerDropdownCaption(): ReactNode {
  const [date, setDate] = useState<Date | undefined>(SELECTED);
  return (
    <Wrapper>
      <div className="w-full max-w-56">
        <DatePicker
          value={date}
          onValueChange={setDate}
          locale={DOCS_LOCALE}
          aria-label="Pick a date"
          calendarProps={{
            captionLayout: "dropdown",
            startMonth: new Date(2024, 0),
            endMonth: new Date(2027, 11),
          }}
        />
      </div>
    </Wrapper>
  );
}

/**
 * `numberOfMonths={1}` — a compact single-month range picker (the default is two months).
 * Good for tight layouts where a two-month grid won't fit.
 */
export function datePickerSingleMonthRange(): ReactNode {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(2026, 5, 9),
    to: new Date(2026, 5, 18),
  });
  return (
    <Wrapper>
      <div className="w-full max-w-72">
        <DateRangePicker
          value={range}
          onValueChange={setRange}
          numberOfMonths={1}
          locale={DOCS_LOCALE}
          aria-label="Pick a date range"
        />
      </div>
    </Wrapper>
  );
}

/**
 * Custom `formatOptions` + `locale` — the trigger label is rendered with the consumer's
 * `Intl.DateTimeFormat` options (here a long weekday/month) and a `de-DE` locale.
 */
export function datePickerFormatting(): ReactNode {
  return <DatePickerFormattingDemo />;
}

/**
 * The trigger label is produced by `Intl.DateTimeFormat`, so the display format is
 * fully controllable without a date library. The DEFAULT is the readable
 * "Jun 24, 2026" — never an ISO string and never the OS date-input format.
 */
function DatePickerFormattingDemo(): ReactNode {
  const [date, setDate] = useState<Date | undefined>(SELECTED);
  const rows: {
    label: string;
    props: Partial<React.ComponentProps<typeof DatePicker>>;
  }[] = [
    { label: "Default — Jun 24, 2026", props: {} },
    {
      label: "With weekday",
      props: {
        formatOptions: {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        },
      },
    },
    {
      label: "Long month",
      props: {
        formatOptions: { month: "long", day: "numeric", year: "numeric" },
      },
    },
    { label: "Numeric", props: { formatOptions: { dateStyle: "short" } } },
    {
      label: "Locale — de-DE",
      props: {
        locale: "de-DE",
        formatOptions: {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        },
      },
    },
  ];
  return (
    <Wrapper className="flex-col items-stretch gap-3">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between gap-4"
        >
          <span className="text-xs font-medium text-muted-foreground">
            {row.label}
          </span>
          <div className="w-full max-w-56 shrink-0">
            <DatePicker
              value={date}
              onValueChange={setDate}
              locale={DOCS_LOCALE}
              aria-label={row.label}
              {...row.props}
            />
          </div>
        </div>
      ))}
    </Wrapper>
  );
}
