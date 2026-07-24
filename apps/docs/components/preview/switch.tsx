"use client";

import { Fragment, useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/switch` (dogfoods the registry) → auto-scanned.
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/ui/field";

export function switchExample(): ReactNode {
  return (
    <Wrapper>
      <Field label="Email notifications" orientation="horizontal">
        <Switch defaultChecked />
      </Field>
    </Wrapper>
  );
}

export function switchSizes(): ReactNode {
  // Full size × state matrix — thumb-travel geometry differs per size, so the
  // OFF state is shown alongside ON at every size (not just the default).
  const sizes = ["sm", "default", "lg"] as const;
  return (
    <Wrapper className="flex-col items-start gap-4">
      <div
        className="grid grid-cols-[auto_auto_auto] items-center gap-x-8 gap-y-4"
        role="presentation"
      >
        <span className="text-sm text-muted-foreground">Size</span>
        <span className="text-sm text-muted-foreground">Off</span>
        <span className="text-sm text-muted-foreground">On</span>
        {sizes.map((size) => (
          <Fragment key={size}>
            <span className="font-mono text-sm text-muted-foreground">
              {size}
            </span>
            <Switch size={size} aria-label={`${size} off`} />
            <Switch size={size} defaultChecked aria-label={`${size} on`} />
          </Fragment>
        ))}
      </div>
    </Wrapper>
  );
}

export function switchStates(): ReactNode {
  return (
    <Wrapper className="flex-col items-start gap-4">
      {/* Bare on/off + disabled — the on track renders in the neutral primary ink */}
      <div className="flex flex-wrap items-center gap-6">
        <Switch aria-label="Off" />
        <Switch defaultChecked aria-label="On" />
        <Switch disabled aria-label="Disabled off" />
        <Switch disabled defaultChecked aria-label="Disabled on" />
      </div>

      {/* With labels via Field — the common settings usage */}
      <Field label="Off" orientation="horizontal">
        <Switch />
      </Field>
      <Field label="On" orientation="horizontal">
        <Switch defaultChecked />
      </Field>
      <Field label="Disabled" orientation="horizontal">
        <Switch disabled />
      </Field>
      <Field label="Disabled on" orientation="horizontal">
        <Switch disabled defaultChecked />
      </Field>
    </Wrapper>
  );
}

export function switchInvalid(): ReactNode {
  // The `aria-invalid` destructive-border tint — set directly when standalone,
  // or wired automatically when a `<Field error=…>` marks the control invalid.
  return (
    <Wrapper className="flex-col items-start gap-4">
      <div className="flex flex-wrap items-center gap-6">
        <Switch aria-invalid aria-label="Invalid off" />
        <Switch aria-invalid defaultChecked aria-label="Invalid on" />
      </div>
      <Field
        label="Accept terms"
        orientation="horizontal"
        error="You must enable this to continue"
      >
        <Switch />
      </Field>
    </Wrapper>
  );
}

export function switchControlled(): ReactNode {
  // Controlled via `checked` + `onCheckedChange` — mirrors the Usage snippet.
  const [enabled, setEnabled] = useState(true);
  return (
    <Wrapper className="flex-col items-start gap-3">
      <Field label="Email notifications" orientation="horizontal">
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </Field>
      <p className="text-base text-muted-foreground">
        Notifications are{" "}
        <span className="font-medium text-foreground">
          {enabled ? "on" : "off"}
        </span>
        .
      </p>
    </Wrapper>
  );
}
