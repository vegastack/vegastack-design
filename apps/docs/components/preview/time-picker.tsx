"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/time-picker` (dogfoods the registry) → auto-scanned.
import { TimePicker } from "@/components/ui/time-picker";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

/**
 * The pages are statically exported, so the face is formatted on the build host and hydrated in
 * a browser with its own default locale; every fixture pins one (as the date-picker previews do).
 */
const DOCS_LOCALE = "en-US";

export function timePicker(): ReactNode {
  // Type "930" or "9:30 pm", or open the list; leaving the field commits what was typed.
  const [time, setTime] = useState<string | null>("09:30");
  return (
    <Wrapper className="flex-col items-start gap-2">
      <div className="w-40">
        <TimePicker
          aria-label="Start time"
          locale={DOCS_LOCALE}
          value={time}
          onValueChange={setTime}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Value: <code>{time ?? "null"}</code>
      </p>
    </Wrapper>
  );
}

export function timePickerClock(): ReactNode {
  // A 24-hour clock every 30 minutes; the locale decides when hourCycle is left out.
  const [time, setTime] = useState<string | null>("14:00");
  return (
    <Wrapper className="flex-col items-start gap-3">
      <div className="w-40">
        <TimePicker
          aria-label="Opens at"
          locale={DOCS_LOCALE}
          hourCycle="h23"
          step={30}
          value={time}
          onValueChange={setTime}
        />
      </div>
    </Wrapper>
  );
}

export function timePickerSizes(): ReactNode {
  // The default (32px) form tier, the sm (28px) row tier, and the ghost inline field.
  return (
    <Wrapper className="flex-col items-start gap-3">
      <div className="w-40">
        <TimePicker aria-label="Default" locale={DOCS_LOCALE} value="09:00" />
      </div>
      <div className="w-36">
        <TimePicker
          aria-label="Small"
          size="sm"
          locale={DOCS_LOCALE}
          value="09:00"
        />
      </div>
      <div className="w-36">
        <TimePicker
          aria-label="Inline"
          size="sm"
          variant="ghost"
          locale={DOCS_LOCALE}
          value="09:00"
        />
      </div>
    </Wrapper>
  );
}

export function timePickerStates(): ReactNode {
  // Empty, disabled and invalid.
  return (
    <Wrapper className="flex-col items-start gap-3">
      <div className="w-40">
        <TimePicker aria-label="Empty" locale={DOCS_LOCALE} />
      </div>
      <div className="w-40">
        <TimePicker
          aria-label="Disabled"
          locale={DOCS_LOCALE}
          value="09:00"
          disabled
        />
      </div>
      <div className="w-40">
        <TimePicker
          aria-label="Invalid"
          locale={DOCS_LOCALE}
          value="09:00"
          aria-invalid
        />
      </div>
    </Wrapper>
  );
}

export function timePickerInsideField(): ReactNode {
  // A FieldLabel names the input through its id; description and error reach it too.
  const [time, setTime] = useState<string | null>(null);
  const missing = time == null;
  return (
    <Wrapper className="flex-col items-stretch">
      <Field data-invalid={missing} className="max-w-xs">
        <FieldLabel htmlFor="reminder-time">Reminder</FieldLabel>
        <TimePicker
          id="reminder-time"
          locale={DOCS_LOCALE}
          value={time}
          onValueChange={setTime}
          aria-describedby="reminder-time-hint reminder-time-error"
          aria-invalid={missing}
        />
        <FieldDescription id="reminder-time-hint">
          We send it at this time on the day.
        </FieldDescription>
        {missing ? (
          <FieldError id="reminder-time-error">Pick a time.</FieldError>
        ) : null}
      </Field>
    </Wrapper>
  );
}
