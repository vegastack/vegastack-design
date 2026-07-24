"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/radio-group` (dogfoods the registry) → auto-scanned.
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Field } from "@/components/ui/field";

export function radioGroup(): ReactNode {
  return (
    <Wrapper>
      <RadioGroup defaultValue="comfortable" aria-label="Density">
        <Field label="Comfortable" orientation="horizontal">
          <RadioGroupItem value="comfortable" />
        </Field>
        <Field label="Compact" orientation="horizontal">
          <RadioGroupItem value="compact" />
        </Field>
        <Field label="Spacious" orientation="horizontal">
          <RadioGroupItem value="spacious" />
        </Field>
      </RadioGroup>
    </Wrapper>
  );
}

export function radioGroupHorizontal(): ReactNode {
  return (
    <Wrapper>
      {/* orientation="horizontal" lays the options out in a wrapping row. Field's root is
          w-full (one option per line — defeats the row), so each wrapper gets w-auto here.
          The last item is disabled, closing the orientation × disabled matrix. */}
      <RadioGroup
        orientation="horizontal"
        defaultValue="card"
        aria-label="Payment method"
      >
        <Field label="Card" orientation="horizontal" className="w-auto">
          <RadioGroupItem value="card" />
        </Field>
        <Field label="PayPal" orientation="horizontal" className="w-auto">
          <RadioGroupItem value="paypal" />
        </Field>
        <Field
          label="Bank transfer"
          orientation="horizontal"
          className="w-auto"
        >
          <RadioGroupItem value="bank" />
        </Field>
        <Field
          label="Wire (unavailable)"
          orientation="horizontal"
          className="w-auto"
        >
          <RadioGroupItem value="wire" disabled />
        </Field>
      </RadioGroup>
    </Wrapper>
  );
}

export function radioGroupInvalid(): ReactNode {
  return (
    <Wrapper className="flex-col items-start gap-2">
      {/* aria-invalid tints each item's border destructive — pair it with a
          Field error message so the validation state is announced. */}
      <RadioGroup aria-label="Plan" aria-invalid>
        <Field label="Starter" orientation="horizontal">
          <RadioGroupItem value="starter" aria-invalid />
        </Field>
        <Field label="Pro" orientation="horizontal">
          <RadioGroupItem value="pro" aria-invalid />
        </Field>
      </RadioGroup>
      <p className="text-base text-destructive" role="alert">
        Select a plan to continue.
      </p>
    </Wrapper>
  );
}

export function radioGroupStates(): ReactNode {
  const [value, setValue] = useState("standard");

  return (
    <Wrapper className="flex-col items-start gap-6">
      {/* A full, controlled group — the selected dot renders in neutral ink */}
      <RadioGroup
        value={value}
        onValueChange={setValue}
        aria-label="Shipping speed"
      >
        <Field label="Standard — 5 business days" orientation="horizontal">
          <RadioGroupItem value="standard" />
        </Field>
        <Field label="Express — 2 business days" orientation="horizontal">
          <RadioGroupItem value="express" />
        </Field>
        <Field label="Overnight" orientation="horizontal">
          <RadioGroupItem value="overnight" />
        </Field>
      </RadioGroup>

      {/* Disabled — empty (unselected) and pre-selected. A radio group is
          single-select, so the disabled-selected case lives in its own group. */}
      <div className="flex flex-wrap items-start gap-x-10 gap-y-4">
        <RadioGroup aria-label="Disabled, unselected">
          <Field label="Disabled" orientation="horizontal">
            <RadioGroupItem value="disabled" disabled />
          </Field>
        </RadioGroup>
        <RadioGroup defaultValue="locked" aria-label="Disabled, selected">
          <Field label="Disabled selected" orientation="horizontal">
            <RadioGroupItem value="locked" disabled />
          </Field>
        </RadioGroup>
      </div>
    </Wrapper>
  );
}
