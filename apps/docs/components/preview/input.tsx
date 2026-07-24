"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { AtSign, Search } from "lucide-react";
// Copied INTO apps/docs via `shadcn add @vegastack/input` (dogfoods the registry) → auto-scanned.
import { Input } from "@/components/ui/input";

export function input(): ReactNode {
  return (
    <Wrapper>
      <Input aria-label="Email" type="email" placeholder="you@vegastack.com" />
    </Wrapper>
  );
}

export function inputStates(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <Input aria-label="Default" />
      <Input aria-label="With placeholder" placeholder="you@vegastack.com" />
      <Input aria-label="With value" defaultValue="alex@vegastack.com" />
      <Input aria-label="Disabled" placeholder="Disabled" disabled />
      <Input
        aria-label="Invalid"
        aria-invalid
        defaultValue="not-an-email"
        placeholder="Invalid"
      />
      <Input aria-label="Read only" defaultValue="Read only" readOnly />
    </Wrapper>
  );
}

export function inputWithAddon(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <Input
        aria-label="Workspace slug"
        prefix="app.vegastack.com/"
        placeholder="workspace-slug"
        className="font-mono"
      />
      <Input
        aria-label="Domain"
        suffix=".vegastack.com"
        placeholder="my-team"
      />
      <Input
        aria-label="Search"
        type="search"
        prefix={<Search aria-hidden className="size-(--icon-default)" />}
        placeholder="Search…"
      />
    </Wrapper>
  );
}

export function inputAddonStates(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <Input
        aria-label="Disabled domain"
        prefix="app.vegastack.com/"
        defaultValue="acme"
        disabled
      />
      <Input
        aria-label="Invalid handle"
        prefix={<AtSign aria-hidden className="size-(--icon-default)" />}
        defaultValue="bad handle"
        aria-invalid
      />
    </Wrapper>
  );
}

export function inputTypes(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <Input aria-label="Number" type="number" placeholder="42" />
      <Input aria-label="Telephone" type="tel" placeholder="+1 555 0100" />
      <Input aria-label="URL" type="url" placeholder="https://vegastack.com" />
      <Input aria-label="Email" type="email" placeholder="ada@vegastack.com" />
      <Input aria-label="Password" type="password" defaultValue="secret" />
      {/* NOTE: `type="date"` / `"time"` / `"datetime-local"` are deliberately NOT shown.
          They summon the OS picker, which ignores every design token (its own surface,
          radius, type ramp, focus ring) and renders differently per browser/platform.
          Use `DatePicker` instead — it formats as "Jun 24, 2026" and is themed. */}
    </Wrapper>
  );
}

export function inputValueChange(): ReactNode {
  return <InputValueChangeDemo />;
}

function InputValueChangeDemo(): ReactNode {
  const [value, setValue] = useState("");
  return (
    <Wrapper className="flex-col items-stretch">
      <Input
        aria-label="Workspace name"
        placeholder="Type a workspace name"
        value={value}
        onValueChange={(next) => setValue(next)}
      />
      <p className="text-center text-base text-muted-foreground">
        {value
          ? `Slug: ${value.trim().toLowerCase().replace(/\s+/g, "-")}`
          : "Slug preview appears here"}
      </p>
    </Wrapper>
  );
}

export function inputRender(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <Input
        aria-label="Workspace name"
        placeholder="you@vegastack.com"
        type="email"
        render={<input data-testid="rendered-input" />}
      />
    </Wrapper>
  );
}
