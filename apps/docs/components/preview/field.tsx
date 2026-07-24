"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/field` (dogfoods the registry) → auto-scanned.
import { Field, FieldControl } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export function field(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <Field
        label="Email"
        description="We'll never share your email."
        className="max-w-sm"
      >
        <FieldControl type="email" placeholder="you@vegastack.com" />
      </Field>
    </Wrapper>
  );
}

export function fieldOrientations(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-6">
      <Field label="Workspace name" className="max-w-sm">
        <FieldControl placeholder="Acme Inc." />
      </Field>
      <Field label="Set as default workspace" orientation="horizontal">
        <Checkbox />
      </Field>
    </Wrapper>
  );
}

export function fieldStates(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-6">
      <Field
        label="Email"
        error="Enter a valid email address."
        className="max-w-sm"
      >
        <FieldControl type="email" defaultValue="not-an-email" />
      </Field>
      <Field
        label="Password"
        labelAction={<a href="#forgot">Forgot?</a>}
        description="At least 8 characters."
        className="max-w-sm"
      >
        <FieldControl type="password" defaultValue="hunter2" />
      </Field>
      <Field
        label="Username"
        success="That username is available."
        className="max-w-sm"
      >
        <FieldControl defaultValue="vega-dev" />
      </Field>
      <Field
        label="Slug"
        description="Lowercase, no spaces."
        borderless
        className="max-w-sm"
      >
        <FieldControl defaultValue="design-system" />
      </Field>
    </Wrapper>
  );
}

/**
 * Horizontal field carrying validation messages. In `horizontal` orientation the
 * `error`/`success` message gets `basis-full` so it wraps onto its own row
 * beneath the control + inline label, rather than squeezing into the flex row.
 */
export function fieldHorizontalError(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-6">
      <Field
        label="I accept the terms of service"
        orientation="horizontal"
        error="You must accept the terms to continue."
      >
        <Checkbox />
      </Field>
      <Field
        label="Subscribe to the product newsletter"
        orientation="horizontal"
        success="You're subscribed."
      >
        <Checkbox defaultChecked />
      </Field>
    </Wrapper>
  );
}

/**
 * Disabled at the Field level. `disabled` flows to the control and dims the
 * label/description via the `group-has-disabled/field` hook — the whole field
 * reads as inactive from a single prop.
 */
export function fieldDisabled(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-6">
      <Field
        label="Workspace ID"
        description="Assigned automatically — cannot be changed."
        disabled
        className="max-w-sm"
      >
        <FieldControl defaultValue="ws_8fK2p" />
      </Field>
      <Field label="Email notifications" orientation="horizontal" disabled>
        <Checkbox defaultChecked />
      </Field>
    </Wrapper>
  );
}

/**
 * `borderless` flattens the child control regardless of its type — the override
 * map targets `input`, `textarea`, and `select-trigger` slots alike, keeping each
 * one's `:focus-visible` ring intact for inline editing.
 */
export function fieldBorderless(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-6">
      <Field label="Title" borderless className="max-w-sm">
        <FieldControl defaultValue="Q3 planning notes" />
      </Field>
      <Field label="Summary" borderless className="max-w-sm">
        <Textarea
          defaultValue="A short description that reads like body text."
          rows={2}
        />
      </Field>
      <Field label="Visibility" borderless className="max-w-sm">
        <Select
          items={{ private: "Private", team: "Team", public: "Public" }}
          defaultValue="team"
        >
          <SelectTrigger aria-label="Visibility">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="team">Team</SelectItem>
            <SelectItem value="public">Public</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </Wrapper>
  );
}
