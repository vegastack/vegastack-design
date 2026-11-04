"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/time-field` (dogfoods the registry) → auto-scanned.
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { TimeField } from "@/components/ui/time-field";

/** A time of day: type it, or step it with the arrow keys. */
export function timeField(): ReactNode {
  const [time, setTime] = useState<string | null>("09:00");
  return (
    <Wrapper>
      <Field className="w-fit">
        <FieldLabel htmlFor="time-field-start">Starts at</FieldLabel>
        <TimeField
          id="time-field-start"
          value={time}
          onChange={setTime}
          hourCycle={12}
          aria-describedby="time-field-start-hint"
        />
        <FieldDescription id="time-field-start-hint">
          Type “930” or “9:30 pm”, or use ↑ and ↓.
        </FieldDescription>
      </Field>
    </Wrapper>
  );
}

/** The 24-hour clock, a 30-minute step inside working hours, empty, invalid and disabled. */
export function timeFieldStates(): ReactNode {
  const [day, setDay] = useState<string | null>("13:30");
  const [work, setWork] = useState<string | null>("08:00");
  const [empty, setEmpty] = useState<string | null>(null);
  return (
    <Wrapper className="items-start">
      <Field className="w-fit">
        <FieldLabel htmlFor="time-field-24">24-hour</FieldLabel>
        <TimeField
          id="time-field-24"
          value={day}
          onChange={setDay}
          hourCycle={24}
        />
      </Field>
      <Field className="w-fit">
        <FieldLabel htmlFor="time-field-work">
          08:00–18:00, every 30 min
        </FieldLabel>
        <TimeField
          id="time-field-work"
          value={work}
          onChange={setWork}
          step={30}
          min="08:00"
          max="18:00"
          hourCycle={24}
        />
      </Field>
      <Field className="w-fit">
        <FieldLabel htmlFor="time-field-empty">Empty</FieldLabel>
        <TimeField
          id="time-field-empty"
          value={empty}
          onChange={setEmpty}
          placeholder="Add a time"
        />
      </Field>
      <Field className="w-fit" data-invalid>
        <FieldLabel htmlFor="time-field-invalid">Invalid</FieldLabel>
        <TimeField
          id="time-field-invalid"
          value="18:30"
          onChange={() => {}}
          aria-invalid
        />
      </Field>
      <Field className="w-fit">
        <FieldLabel htmlFor="time-field-disabled">Disabled</FieldLabel>
        <TimeField
          id="time-field-disabled"
          value="09:00"
          onChange={() => {}}
          disabled
        />
      </Field>
    </Wrapper>
  );
}
