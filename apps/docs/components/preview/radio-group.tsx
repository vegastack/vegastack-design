"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/radio-group` (dogfoods the registry) → auto-scanned.
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function radioGroup(): ReactNode {
  return (
    <Wrapper>
      <RadioGroup defaultValue="option-one" className="w-fit">
        <div className="flex items-center gap-3">
          <RadioGroupItem value="option-one" id="option-one" />
          <Label htmlFor="option-one">Option One</Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem value="option-two" id="option-two" />
          <Label htmlFor="option-two">Option Two</Label>
        </div>
      </RadioGroup>
    </Wrapper>
  );
}

export function radioGroupComposition(): ReactNode {
  return (
    <Wrapper>
      <RadioGroup defaultValue="one" className="w-fit">
        <div className="flex items-center gap-3">
          <RadioGroupItem value="one" id="composition-one" />
          <Label htmlFor="composition-one">RadioGroupItem</Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem value="two" id="composition-two" />
          <Label htmlFor="composition-two">RadioGroupItem</Label>
        </div>
      </RadioGroup>
    </Wrapper>
  );
}

export function radioGroupDescription(): ReactNode {
  return (
    <Wrapper>
      <RadioGroup defaultValue="comfortable" className="w-fit">
        <Field orientation="horizontal">
          <RadioGroupItem value="default" id="desc-r1" />
          <FieldContent>
            <FieldLabel htmlFor="desc-r1">Default</FieldLabel>
            <FieldDescription>
              Standard spacing for most use cases.
            </FieldDescription>
          </FieldContent>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem value="comfortable" id="desc-r2" />
          <FieldContent>
            <FieldLabel htmlFor="desc-r2">Comfortable</FieldLabel>
            <FieldDescription>More space between elements.</FieldDescription>
          </FieldContent>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem value="compact" id="desc-r3" />
          <FieldContent>
            <FieldLabel htmlFor="desc-r3">Compact</FieldLabel>
            <FieldDescription>
              Minimal spacing for dense layouts.
            </FieldDescription>
          </FieldContent>
        </Field>
      </RadioGroup>
    </Wrapper>
  );
}

export function radioGroupChoiceCard(): ReactNode {
  return (
    <Wrapper>
      <RadioGroup defaultValue="plus" className="max-w-sm">
        <FieldLabel htmlFor="plus-plan">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>Plus</FieldTitle>
              <FieldDescription>
                For individuals and small teams.
              </FieldDescription>
            </FieldContent>
            <RadioGroupItem value="plus" id="plus-plan" />
          </Field>
        </FieldLabel>
        <FieldLabel htmlFor="pro-plan">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>Pro</FieldTitle>
              <FieldDescription>For growing businesses.</FieldDescription>
            </FieldContent>
            <RadioGroupItem value="pro" id="pro-plan" />
          </Field>
        </FieldLabel>
        <FieldLabel htmlFor="enterprise-plan">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>Enterprise</FieldTitle>
              <FieldDescription>
                For large teams and enterprises.
              </FieldDescription>
            </FieldContent>
            <RadioGroupItem value="enterprise" id="enterprise-plan" />
          </Field>
        </FieldLabel>
      </RadioGroup>
    </Wrapper>
  );
}

export function radioGroupFieldset(): ReactNode {
  return (
    <Wrapper>
      <FieldSet className="w-full max-w-xs">
        <FieldLegend variant="label">Subscription Plan</FieldLegend>
        <FieldDescription>
          Yearly and lifetime plans offer significant savings.
        </FieldDescription>
        <RadioGroup defaultValue="monthly">
          <Field orientation="horizontal">
            <RadioGroupItem value="monthly" id="plan-monthly" />
            <FieldLabel htmlFor="plan-monthly" className="font-normal">
              Monthly ($9.99/month)
            </FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem value="yearly" id="plan-yearly" />
            <FieldLabel htmlFor="plan-yearly" className="font-normal">
              Yearly ($99.99/year)
            </FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem value="lifetime" id="plan-lifetime" />
            <FieldLabel htmlFor="plan-lifetime" className="font-normal">
              Lifetime ($299.99)
            </FieldLabel>
          </Field>
        </RadioGroup>
      </FieldSet>
    </Wrapper>
  );
}

export function radioGroupDisabled(): ReactNode {
  return (
    <Wrapper>
      <RadioGroup defaultValue="option2" className="w-fit">
        <Field orientation="horizontal" data-disabled>
          <RadioGroupItem value="option1" id="disabled-1" disabled />
          <FieldLabel htmlFor="disabled-1" className="font-normal">
            Disabled
          </FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem value="option2" id="disabled-2" />
          <FieldLabel htmlFor="disabled-2" className="font-normal">
            Option 2
          </FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem value="option3" id="disabled-3" />
          <FieldLabel htmlFor="disabled-3" className="font-normal">
            Option 3
          </FieldLabel>
        </Field>
      </RadioGroup>
    </Wrapper>
  );
}

export function radioGroupInvalid(): ReactNode {
  return (
    <Wrapper>
      <FieldSet className="w-full max-w-xs" data-invalid>
        <FieldLegend variant="label">Delivery window</FieldLegend>
        <RadioGroup>
          <Field orientation="horizontal" data-invalid>
            <RadioGroupItem value="morning" id="invalid-morning" aria-invalid />
            <FieldLabel htmlFor="invalid-morning" className="font-normal">
              Morning
            </FieldLabel>
          </Field>
          <Field orientation="horizontal" data-invalid>
            <RadioGroupItem
              value="afternoon"
              id="invalid-afternoon"
              aria-invalid
            />
            <FieldLabel htmlFor="invalid-afternoon" className="font-normal">
              Afternoon
            </FieldLabel>
          </Field>
        </RadioGroup>
        <FieldError>Choose a delivery window.</FieldError>
      </FieldSet>
    </Wrapper>
  );
}

export function radioGroupRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <RadioGroup defaultValue="one" className="w-full max-w-xs" dir="ltr">
        <Field orientation="horizontal">
          <RadioGroupItem value="one" id="radio-rtl-ltr-1" />
          <FieldLabel htmlFor="radio-rtl-ltr-1" className="font-normal">
            Standard delivery
          </FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem value="two" id="radio-rtl-ltr-2" />
          <FieldLabel htmlFor="radio-rtl-ltr-2" className="font-normal">
            Express delivery
          </FieldLabel>
        </Field>
      </RadioGroup>
      <RadioGroup defaultValue="one" className="w-full max-w-xs" dir="rtl">
        <Field orientation="horizontal">
          <RadioGroupItem value="one" id="radio-rtl-ar-1" />
          <FieldLabel htmlFor="radio-rtl-ar-1" className="font-normal">
            التوصيل العادي
          </FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem value="two" id="radio-rtl-ar-2" />
          <FieldLabel htmlFor="radio-rtl-ar-2" className="font-normal">
            التوصيل السريع
          </FieldLabel>
        </Field>
      </RadioGroup>
    </Wrapper>
  );
}

/** Ours: rest, selected, invalid and disabled in one frame. */
export function radioGroupStates(): ReactNode {
  return (
    <Wrapper>
      <RadioGroup defaultValue="selected" className="w-fit" aria-label="States">
        <div className="flex items-center gap-3">
          <RadioGroupItem value="rest" id="radio-state-rest" />
          <Label htmlFor="radio-state-rest">Rest</Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem value="selected" id="radio-state-selected" />
          <Label htmlFor="radio-state-selected">Selected</Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem
            value="invalid"
            id="radio-state-invalid"
            aria-invalid
          />
          <Label htmlFor="radio-state-invalid">Invalid</Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem value="disabled" id="radio-state-disabled" disabled />
          <Label htmlFor="radio-state-disabled">Disabled</Label>
        </div>
      </RadioGroup>
    </Wrapper>
  );
}
