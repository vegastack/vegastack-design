"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/checkbox` (dogfoods the registry) → auto-scanned.
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";

export function checkbox(): ReactNode {
  return (
    <Wrapper>
      <Field label="Subscribe to product updates" orientation="horizontal">
        <Checkbox defaultChecked />
      </Field>
    </Wrapper>
  );
}

export function checkboxStates(): ReactNode {
  const [checked, setChecked] = useState<boolean | "indeterminate">(
    "indeterminate",
  );

  return (
    <Wrapper className="flex-col items-start gap-4">
      {/* Bare controls — every state exactly as it renders (checked = neutral primary) */}
      <div className="flex flex-wrap items-center gap-6">
        <Checkbox aria-label="Unchecked" />
        <Checkbox defaultChecked aria-label="Checked" />
        <Checkbox
          indeterminate={checked === "indeterminate"}
          checked={checked === true}
          onCheckedChange={(next) => setChecked(next)}
          aria-label="Indeterminate"
        />
        <Checkbox disabled aria-label="Disabled" />
        <Checkbox disabled defaultChecked aria-label="Disabled checked" />
      </div>

      {/* With labels via Field — the common form usage */}
      <Field label="Unchecked" orientation="horizontal">
        <Checkbox />
      </Field>
      <Field label="Checked" orientation="horizontal">
        <Checkbox defaultChecked />
      </Field>
      <Field label="Disabled" orientation="horizontal">
        <Checkbox disabled />
      </Field>
      <Field label="Disabled checked" orientation="horizontal">
        <Checkbox disabled defaultChecked />
      </Field>
    </Wrapper>
  );
}

export function checkboxSizes(): ReactNode {
  return (
    <Wrapper className="flex-col items-start gap-4">
      {/* The indicator icon scales with the box, so sm reads smaller end-to-end. */}
      <div className="flex items-center gap-6">
        <Checkbox size="sm" defaultChecked aria-label="Small" />
        <Checkbox size="default" defaultChecked aria-label="Default" />
      </div>
      <Field label="Small" orientation="horizontal">
        <Checkbox size="sm" defaultChecked />
      </Field>
      <Field label="Default" orientation="horizontal">
        <Checkbox size="default" defaultChecked />
      </Field>
    </Wrapper>
  );
}

export function checkboxInvalid(): ReactNode {
  return (
    <Wrapper className="flex-col items-start gap-4">
      {/* Bare invalid checkbox via aria-invalid — destructive border at rest. */}
      <Checkbox aria-invalid aria-label="Invalid checkbox" />
      {/* In-Field error — Field sets data-invalid and renders the role="alert" message. */}
      <Field
        label="Accept the terms to continue"
        orientation="horizontal"
        error="This field is required."
      >
        <Checkbox />
      </Field>
    </Wrapper>
  );
}

export function checkboxSizeStateMatrix(): ReactNode {
  const [mixedSm, setMixedSm] = useState<boolean | "indeterminate">(
    "indeterminate",
  );
  const [mixedDefault, setMixedDefault] = useState<boolean | "indeterminate">(
    "indeterminate",
  );

  return (
    <Wrapper>
      {/* Scroll container + tighter small-width gap so the matrix headers stay legible at 375px. */}
      <div className="w-full max-w-full overflow-x-auto">
        <div className="grid w-max grid-cols-[auto_repeat(3,auto)] items-center gap-x-4 gap-y-4 text-base text-muted-foreground sm:gap-x-8">
          {/* Header row */}
          <span />
          <span>Unchecked</span>
          <span>Checked</span>
          <span>Indeterminate</span>

          {/* sm row */}
          <span className="font-mono">sm</span>
          <Checkbox size="sm" aria-label="Small unchecked" />
          <Checkbox size="sm" defaultChecked aria-label="Small checked" />
          <Checkbox
            size="sm"
            indeterminate={mixedSm === "indeterminate"}
            checked={mixedSm === true}
            onCheckedChange={(next) => setMixedSm(next)}
            aria-label="Small indeterminate"
          />

          {/* default row */}
          <span className="font-mono">default</span>
          <Checkbox size="default" aria-label="Default unchecked" />
          <Checkbox
            size="default"
            defaultChecked
            aria-label="Default checked"
          />
          <Checkbox
            size="default"
            indeterminate={mixedDefault === "indeterminate"}
            checked={mixedDefault === true}
            onCheckedChange={(next) => setMixedDefault(next)}
            aria-label="Default indeterminate"
          />
        </div>
      </div>
    </Wrapper>
  );
}
