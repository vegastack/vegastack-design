"use client";

import type { ReactNode } from "react";
import { InfoIcon } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/input` (dogfoods the registry) → auto-scanned.
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function input(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <Input
        aria-label="Email"
        placeholder="name@example.com"
        className="mx-auto max-w-sm"
      />
    </Wrapper>
  );
}

export function inputBasic(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <Input
        aria-label="Text"
        placeholder="Enter text"
        className="mx-auto max-w-sm"
      />
    </Wrapper>
  );
}

export function inputField(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <Field className="mx-auto max-w-sm">
        <FieldLabel htmlFor="input-field-username">Username</FieldLabel>
        <Input
          id="input-field-username"
          type="text"
          placeholder="Enter your username"
        />
        <FieldDescription>
          Choose a unique username for your account.
        </FieldDescription>
      </Field>
    </Wrapper>
  );
}

export function inputFieldGroup(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <FieldGroup className="mx-auto max-w-sm">
        <Field>
          <FieldLabel htmlFor="fieldgroup-name">Name</FieldLabel>
          <Input id="fieldgroup-name" placeholder="Jordan Lee" />
        </Field>
        <Field>
          <FieldLabel htmlFor="fieldgroup-email">Email</FieldLabel>
          <Input
            id="fieldgroup-email"
            type="email"
            placeholder="name@example.com"
          />
          <FieldDescription>
            We&apos;ll send updates to this address.
          </FieldDescription>
        </Field>
        <Field orientation="horizontal">
          <Button type="reset" variant="outline">
            Reset
          </Button>
          <Button type="submit">Submit</Button>
        </Field>
      </FieldGroup>
    </Wrapper>
  );
}

export function inputDisabled(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <Field data-disabled className="mx-auto max-w-sm">
        <FieldLabel htmlFor="input-demo-disabled">Email</FieldLabel>
        <Input
          id="input-demo-disabled"
          type="email"
          placeholder="Email"
          disabled
        />
        <FieldDescription>This field is currently disabled.</FieldDescription>
      </Field>
    </Wrapper>
  );
}

export function inputInvalid(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <Field data-invalid className="mx-auto max-w-sm">
        <FieldLabel htmlFor="input-invalid">Invalid Input</FieldLabel>
        <Input id="input-invalid" placeholder="Error" aria-invalid />
        <FieldError>This field contains validation errors.</FieldError>
      </Field>
    </Wrapper>
  );
}

export function inputFile(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <Field className="mx-auto max-w-sm">
        <FieldLabel htmlFor="picture">Picture</FieldLabel>
        <Input id="picture" type="file" />
        <FieldDescription>Select a picture to upload.</FieldDescription>
      </Field>
    </Wrapper>
  );
}

export function inputInline(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <Field orientation="horizontal" className="mx-auto max-w-sm">
        <Input type="search" placeholder="Search..." aria-label="Search" />
        <Button>Search</Button>
      </Field>
    </Wrapper>
  );
}

export function inputGrid(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <FieldGroup className="mx-auto grid max-w-sm grid-cols-2">
        <Field>
          <FieldLabel htmlFor="first-name">First Name</FieldLabel>
          <Input id="first-name" placeholder="Jordan" />
        </Field>
        <Field>
          <FieldLabel htmlFor="last-name">Last Name</FieldLabel>
          <Input id="last-name" placeholder="Lee" />
        </Field>
      </FieldGroup>
    </Wrapper>
  );
}

export function inputRequired(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <Field className="mx-auto max-w-sm">
        <FieldLabel htmlFor="input-required">
          Required Field <span className="text-destructive-text">*</span>
        </FieldLabel>
        <Input
          id="input-required"
          placeholder="This field is required"
          required
        />
        <FieldDescription>This field must be filled out.</FieldDescription>
      </Field>
    </Wrapper>
  );
}

export function inputBadge(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <Field className="mx-auto max-w-sm">
        <FieldLabel htmlFor="input-badge">
          Webhook URL{" "}
          <Badge variant="secondary" className="ms-auto">
            Beta
          </Badge>
        </FieldLabel>
        <Input
          id="input-badge"
          type="url"
          placeholder="https://api.example.com/webhook"
        />
      </Field>
    </Wrapper>
  );
}

export function inputInputGroup(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <Field className="mx-auto max-w-sm">
        <FieldLabel htmlFor="input-group-url">Website URL</FieldLabel>
        <InputGroup>
          <InputGroupInput id="input-group-url" placeholder="example.com" />
          <InputGroupAddon>
            <InputGroupText>https://</InputGroupText>
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            <InfoIcon />
          </InputGroupAddon>
        </InputGroup>
      </Field>
    </Wrapper>
  );
}

export function inputButtonGroup(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <Field className="mx-auto max-w-sm">
        <FieldLabel htmlFor="input-button-group">Search</FieldLabel>
        <ButtonGroup>
          <Input id="input-button-group" placeholder="Type to search..." />
          <Button variant="outline">Search</Button>
        </ButtonGroup>
      </Field>
    </Wrapper>
  );
}

const countries = [
  { label: "United States", value: "us" },
  { label: "United Kingdom", value: "uk" },
  { label: "Canada", value: "ca" },
];

export function inputForm(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <form className="mx-auto w-full max-w-sm">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="form-name">Name</FieldLabel>
            <Input
              id="form-name"
              type="text"
              placeholder="Evil Rabbit"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="form-email">Email</FieldLabel>
            <Input
              id="form-email"
              type="email"
              placeholder="john@example.com"
            />
            <FieldDescription>
              We&apos;ll never share your email with anyone.
            </FieldDescription>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="form-phone">Phone</FieldLabel>
              <Input
                id="form-phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="form-country">Country</FieldLabel>
              <Select items={countries} defaultValue="us">
                <SelectTrigger id="form-country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field orientation="horizontal">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">Submit</Button>
          </Field>
        </FieldGroup>
      </form>
    </Wrapper>
  );
}

export function inputRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <Field className="mx-auto w-full max-w-xs" dir="ltr">
        <FieldLabel htmlFor="input-rtl-ltr">Full name</FieldLabel>
        <Input id="input-rtl-ltr" placeholder="Ada Lovelace" />
        <FieldDescription>As it appears on your passport.</FieldDescription>
      </Field>
      <Field className="mx-auto w-full max-w-xs" dir="rtl">
        <FieldLabel htmlFor="input-rtl-ar">الاسم الكامل</FieldLabel>
        <Input id="input-rtl-ar" placeholder="آدا لوفلايس" />
        <FieldDescription>كما يظهر في جواز سفرك.</FieldDescription>
      </Field>
    </Wrapper>
  );
}

/**
 * Ours, and a geometry canary (`component-contracts.json` → affectedTestPolicy.geometryCanaries):
 * rest, filled, invalid and disabled in one frame.
 */
export function inputStates(): ReactNode {
  return (
    <Wrapper className="grid grid-cols-2 items-start gap-4">
      <Input aria-label="Rest" placeholder="Rest" />
      <Input aria-label="Filled" defaultValue="Filled" />
      <Input aria-label="Invalid" defaultValue="Invalid" aria-invalid />
      <Input aria-label="Disabled" defaultValue="Disabled" disabled />
    </Wrapper>
  );
}

/** `size`: `sm` (28px), `default` (32px) and `lg` (heading type). */
export function inputSizes(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        <Input size="sm" aria-label="Small" placeholder="Small" />
        <Input aria-label="Default" placeholder="Default" />
        <Input size="lg" aria-label="Large" placeholder="Large" />
      </div>
    </Wrapper>
  );
}

/**
 * `variant="ghost"`: no border and no fill — a title typed straight onto the page. Hover and focus
 * tint the background; an invalid ghost field turns its placeholder destructive.
 */
export function inputGhost(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto flex w-full max-w-md flex-col gap-3">
        <Input
          variant="ghost"
          size="lg"
          aria-label="Issue title"
          placeholder="Issue title"
        />
        <Input
          variant="ghost"
          aria-label="Subtitle"
          placeholder="Add a subtitle"
        />
        <Input
          variant="ghost"
          size="sm"
          aria-label="Note"
          placeholder="Add a note"
        />
        <Input
          variant="ghost"
          size="lg"
          aria-label="Required title"
          placeholder="A title is required"
          aria-invalid
        />
      </div>
    </Wrapper>
  );
}
