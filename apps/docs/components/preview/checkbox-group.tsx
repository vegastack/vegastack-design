"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/checkbox-group` (dogfoods the registry) → auto-scanned.
import { Checkbox } from "@/components/ui/checkbox";
import { CheckboxGroup } from "@/components/ui/checkbox-group";
import { FieldSet, FieldLegend } from "@/components/ui/field";
import { Label } from "@/components/ui/label";

const PERMISSIONS = ["read", "write", "admin"];

export function checkboxGroup(): ReactNode {
  const [value, setValue] = useState<string[]>(["read"]);

  return (
    <Wrapper>
      <FieldSet>
        <FieldLegend>Permissions</FieldLegend>
        <CheckboxGroup
          value={value}
          onValueChange={setValue}
          allValues={PERMISSIONS}
        >
          <Label>
            <Checkbox parent /> All permissions
          </Label>
          <Label>
            <Checkbox value="read" /> Read
          </Label>
          <Label>
            <Checkbox value="write" /> Write
          </Label>
          <Label>
            <Checkbox value="admin" /> Admin
          </Label>
        </CheckboxGroup>
      </FieldSet>
    </Wrapper>
  );
}

export function checkboxGroupStates(): ReactNode {
  // Three groups side by side: none ticked, some ticked (the parent reads mixed), all
  // ticked. The parent's state is Base UI's arithmetic, never the app's.
  const [none, setNone] = useState<string[]>([]);
  const [some, setSome] = useState<string[]>(["read"]);
  const [all, setAll] = useState<string[]>(PERMISSIONS);

  return (
    <Wrapper className="flex-col items-start gap-6">
      {(
        [
          ["Nothing ticked", none, setNone],
          ["Some ticked — the parent is mixed", some, setSome],
          ["All ticked", all, setAll],
        ] as const
      ).map(([legend, value, setValue]) => (
        <FieldSet key={legend}>
          <FieldLegend>{legend}</FieldLegend>
          <CheckboxGroup
            value={value}
            onValueChange={setValue}
            allValues={PERMISSIONS}
          >
            <Label>
              <Checkbox parent /> All permissions
            </Label>
            <Label>
              <Checkbox value="read" /> Read
            </Label>
            <Label>
              <Checkbox value="write" /> Write
            </Label>
            <Label>
              <Checkbox value="admin" /> Admin
            </Label>
          </CheckboxGroup>
        </FieldSet>
      ))}
    </Wrapper>
  );
}

export function checkboxGroupDisabled(): ReactNode {
  return (
    <Wrapper className="flex-col items-start gap-6">
      <FieldSet>
        <FieldLegend>Permissions</FieldLegend>
        <CheckboxGroup defaultValue={["read"]} allValues={PERMISSIONS} disabled>
          <Label>
            <Checkbox parent /> All permissions
          </Label>
          <Label>
            <Checkbox value="read" /> Read
          </Label>
          <Label>
            <Checkbox value="write" /> Write
          </Label>
        </CheckboxGroup>
      </FieldSet>
    </Wrapper>
  );
}

export function checkboxGroupUncontrolled(): ReactNode {
  return (
    <Wrapper>
      <FieldSet>
        <FieldLegend>Notifications</FieldLegend>
        <CheckboxGroup defaultValue={["email"]}>
          <Label>
            <Checkbox value="email" /> Email
          </Label>
          <Label>
            <Checkbox value="sms" /> SMS
          </Label>
          <Label>
            <Checkbox value="push" /> Push
          </Label>
        </CheckboxGroup>
      </FieldSet>
    </Wrapper>
  );
}
