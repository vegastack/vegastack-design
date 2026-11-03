"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/date-time-picker` (dogfoods the registry) → auto-scanned.
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

/**
 * Statically exported pages: the faces are formatted on the build host and hydrated in a browser
 * with its own locale and zone, so every fixture pins both.
 */
const DOCS_LOCALE = "en-US";
const DOCS_ZONE = "Asia/Kolkata";

/** 3 November 2026, 09:00 in Kolkata. */
const SEEDED = new Date("2026-11-03T03:30:00Z");

/** The instant as UTC, so the page shows what the value is, not only its face. */
const utc = (value: Date | undefined) =>
  value ? value.toISOString().replace(".000", "") : "none";

export function dateTimePicker(): ReactNode {
  // A day and a time as one value, edited on the reader's clock (Kolkata here).
  const [due, setDue] = useState<Date | undefined>(SEEDED);
  return (
    <Wrapper className="flex-col items-start gap-2">
      <div className="w-full max-w-sm">
        <DateTimePicker
          aria-label="Due"
          locale={DOCS_LOCALE}
          timeZone={DOCS_ZONE}
          value={due}
          onValueChange={setDue}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Value: <code>{utc(due)}</code>
      </p>
    </Wrapper>
  );
}

export function dateTimePickerDefaultTime(): ReactNode {
  // Empty: the time waits for a day; a day picked alone takes defaultTime (09:00 by default).
  const [start, setStart] = useState<Date | undefined>();
  return (
    <Wrapper className="flex-col items-start gap-2">
      <div className="w-full max-w-sm">
        <DateTimePicker
          aria-label="Start"
          locale={DOCS_LOCALE}
          timeZone={DOCS_ZONE}
          defaultTime="10:00"
          clearable
          value={start}
          onValueChange={setStart}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Value: <code>{utc(start)}</code>
      </p>
    </Wrapper>
  );
}

export function dateTimePickerInline(): ReactNode {
  // The sm ghost tier in a row: no borders at rest, a border on hover and while editing.
  const [at, setAt] = useState<Date | undefined>(SEEDED);
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border px-3 py-1.5 text-sm">
        <span className="min-w-0 flex-1 basis-32 truncate">
          Quarterly review
        </span>
        <div className="w-64 max-w-full min-w-0">
          <DateTimePicker
            aria-label="Meeting time"
            size="sm"
            variant="ghost"
            locale={DOCS_LOCALE}
            timeZone={DOCS_ZONE}
            value={at}
            onValueChange={setAt}
          />
        </div>
      </div>
    </Wrapper>
  );
}

export function dateTimePickerStates(): ReactNode {
  // Disabled, invalid, and a 24-hour clock every 30 minutes.
  return (
    <Wrapper className="flex-col items-start gap-3">
      <div className="w-full max-w-sm">
        <DateTimePicker
          aria-label="Disabled"
          locale={DOCS_LOCALE}
          timeZone={DOCS_ZONE}
          value={SEEDED}
          disabled
        />
      </div>
      <div className="w-full max-w-sm">
        <DateTimePicker
          aria-label="Invalid"
          locale={DOCS_LOCALE}
          timeZone={DOCS_ZONE}
          value={SEEDED}
          aria-invalid
        />
      </div>
      <div className="w-full max-w-sm">
        <DateTimePicker
          aria-label="24-hour"
          locale={DOCS_LOCALE}
          timeZone={DOCS_ZONE}
          hourCycle="h23"
          step={30}
          value={SEEDED}
        />
      </div>
    </Wrapper>
  );
}

export function dateTimePickerInsideField(): ReactNode {
  // The label opens the calendar through the date trigger's id; the error reaches both halves.
  const [at, setAt] = useState<Date | undefined>();
  const missing = at === undefined;
  return (
    <Wrapper className="flex-col items-stretch">
      <Field data-invalid={missing} className="max-w-sm">
        <FieldLabel htmlFor="launch-at">Launch</FieldLabel>
        <DateTimePicker
          id="launch-at"
          aria-label="Launch"
          locale={DOCS_LOCALE}
          timeZone={DOCS_ZONE}
          value={at}
          onValueChange={setAt}
          aria-describedby={missing ? "launch-at-error" : undefined}
          aria-invalid={missing}
        />
        {missing ? (
          <FieldError id="launch-at-error">Pick a day and a time.</FieldError>
        ) : null}
      </Field>
    </Wrapper>
  );
}
