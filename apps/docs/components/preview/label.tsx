"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/label` (dogfoods the registry) → auto-scanned.
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function label(): ReactNode {
  return (
    <Wrapper>
      <div className="flex gap-2">
        <Checkbox id="label-terms" />
        <Label htmlFor="label-terms">Accept terms and conditions</Label>
      </div>
    </Wrapper>
  );
}

export function labelLabelInField(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="mx-auto w-full max-w-sm">
        <Field>
          <FieldLabel htmlFor="label-field-email">
            Your email address
          </FieldLabel>
          <Input id="label-field-email" placeholder="ada@vegastack.com" />
          <FieldDescription>
            We only use it to send you receipts.
          </FieldDescription>
        </Field>
      </div>
    </Wrapper>
  );
}

export function labelRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <div className="flex gap-2" dir="ltr">
        <Checkbox id="label-terms-ltr" />
        <Label htmlFor="label-terms-ltr">Accept terms and conditions</Label>
      </div>
      <div className="flex gap-2" dir="rtl">
        <Checkbox id="label-terms-rtl" />
        <Label htmlFor="label-terms-rtl">قبول الشروط والأحكام</Label>
      </div>
    </Wrapper>
  );
}
