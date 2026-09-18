"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/switch` (dogfoods the registry) → auto-scanned.
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";

export function switchExample(): ReactNode {
  return (
    <Wrapper>
      <Switch aria-label="Airplane mode" />
    </Wrapper>
  );
}

export function switchDescription(): ReactNode {
  return (
    <Wrapper>
      <Field orientation="horizontal" className="max-w-sm">
        <FieldContent>
          <FieldLabel htmlFor="switch-focus-mode">
            Share across devices
          </FieldLabel>
          <FieldDescription>
            Focus is shared across devices, and turns off when you leave the
            app.
          </FieldDescription>
        </FieldContent>
        <Switch id="switch-focus-mode" />
      </Field>
    </Wrapper>
  );
}

export function switchChoiceCard(): ReactNode {
  return (
    <Wrapper>
      <FieldGroup className="w-full max-w-sm">
        <FieldLabel htmlFor="switch-share">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>Share across devices</FieldTitle>
              <FieldDescription>
                Focus is shared across devices, and turns off when you leave the
                app.
              </FieldDescription>
            </FieldContent>
            <Switch id="switch-share" />
          </Field>
        </FieldLabel>
        <FieldLabel htmlFor="switch-notifications">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>Enable notifications</FieldTitle>
              <FieldDescription>
                Receive notifications when focus mode is enabled or disabled.
              </FieldDescription>
            </FieldContent>
            <Switch id="switch-notifications" defaultChecked />
          </Field>
        </FieldLabel>
      </FieldGroup>
    </Wrapper>
  );
}

export function switchDisabled(): ReactNode {
  return (
    <Wrapper>
      <Field orientation="horizontal" data-disabled className="w-fit">
        <Switch id="switch-disabled-unchecked" disabled />
        <FieldLabel htmlFor="switch-disabled-unchecked">Disabled</FieldLabel>
      </Field>
      <Field orientation="horizontal" data-disabled className="w-fit">
        <Switch id="switch-disabled-checked" disabled defaultChecked />
        <FieldLabel htmlFor="switch-disabled-checked">
          Disabled and on
        </FieldLabel>
      </Field>
    </Wrapper>
  );
}

export function switchInvalid(): ReactNode {
  return (
    <Wrapper>
      <Field orientation="horizontal" className="max-w-sm" data-invalid>
        <FieldContent>
          <FieldLabel htmlFor="switch-terms">
            Accept terms and conditions
          </FieldLabel>
          <FieldDescription>
            You must accept the terms and conditions to continue.
          </FieldDescription>
        </FieldContent>
        <Switch id="switch-terms" aria-invalid />
      </Field>
    </Wrapper>
  );
}

export function switchSizes(): ReactNode {
  return (
    <Wrapper>
      <FieldGroup className="w-full max-w-[10rem]">
        <Field orientation="horizontal">
          <Switch id="switch-size-sm" size="sm" />
          <FieldLabel htmlFor="switch-size-sm">Small</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <Switch id="switch-size-default" size="default" />
          <FieldLabel htmlFor="switch-size-default">Default</FieldLabel>
        </Field>
      </FieldGroup>
    </Wrapper>
  );
}

export function switchRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <Field orientation="horizontal" className="max-w-sm" dir="ltr">
        <FieldContent>
          <FieldLabel htmlFor="switch-rtl-ltr">Share across devices</FieldLabel>
          <FieldDescription>
            Focus is shared across devices, and turns off when you leave the
            app.
          </FieldDescription>
        </FieldContent>
        <Switch id="switch-rtl-ltr" />
      </Field>
      <Field orientation="horizontal" className="max-w-sm" dir="rtl">
        <FieldContent>
          <FieldLabel htmlFor="switch-rtl-ar">المشاركة عبر الأجهزة</FieldLabel>
          <FieldDescription>
            يتم مشاركة التركيز عبر الأجهزة، ويتم إيقاف تشغيله عند مغادرة
            التطبيق.
          </FieldDescription>
        </FieldContent>
        <Switch id="switch-rtl-ar" defaultChecked />
      </Field>
    </Wrapper>
  );
}

/** Ours: the three interaction states a switch shows, side by side. */
export function switchStates(): ReactNode {
  const [checked, setChecked] = React.useState(true);
  return (
    <Wrapper>
      <Field orientation="horizontal" className="w-fit">
        <Switch id="switch-state-off" aria-label="Off" />
        <FieldLabel htmlFor="switch-state-off">Off</FieldLabel>
      </Field>
      <Field orientation="horizontal" className="w-fit">
        <Switch
          id="switch-state-on"
          checked={checked}
          onCheckedChange={setChecked}
        />
        <FieldLabel htmlFor="switch-state-on">
          {checked ? "On" : "Off"}
        </FieldLabel>
      </Field>
      <Field orientation="horizontal" className="w-fit" data-disabled>
        <Switch id="switch-state-disabled" disabled />
        <FieldLabel htmlFor="switch-state-disabled">Disabled</FieldLabel>
      </Field>
    </Wrapper>
  );
}
