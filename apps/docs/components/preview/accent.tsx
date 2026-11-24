"use client";

import * as React from "react";
import { ACCENTS, type AccentId } from "@vegastack/design-tokens/accents";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/accent` (dogfoods the registry) → auto-scanned.
import { AccentPicker } from "@/components/ui/accent-picker";
import { AccentPreview } from "@/components/ui/accent-preview";

export function accent(): React.ReactNode {
  return <PickerExample />;
}

function PickerExample() {
  const [value, setValue] = React.useState<AccentId | null>("violet");
  return (
    <Wrapper className="flex-col items-stretch">
      <AccentPicker
        workspaceAccent="black"
        value={value}
        onValueChange={setValue}
      />
      <AccentPreview accent={value ?? "black"} />
    </Wrapper>
  );
}

export function accentColours(): React.ReactNode {
  return <ColoursExample />;
}

function ColoursExample() {
  const [value, setValue] = React.useState<AccentId>("black");
  return (
    <Wrapper className="flex-col items-stretch">
      <AccentPicker
        aria-label="Workspace theme"
        value={value}
        onValueChange={(next) => next && setValue(next)}
      />
    </Wrapper>
  );
}

export function accentRoles(): React.ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      {ACCENTS.map(({ id, label }) => (
        <section key={id} aria-label={label} className="flex flex-col gap-2">
          <span className="text-sm font-medium">{label}</span>
          <AccentPreview accent={id} />
        </section>
      ))}
    </Wrapper>
  );
}
