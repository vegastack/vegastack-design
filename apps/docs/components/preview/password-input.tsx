"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/password-input` (dogfoods the registry) → auto-scanned.
import { PasswordInput } from "@/components/ui/password-input";

export function passwordInput(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <PasswordInput
        aria-label="With placeholder"
        placeholder="Enter your password"
      />
      <PasswordInput
        aria-label="With value"
        autoComplete="current-password"
        defaultValue="correct horse battery staple"
      />
      <PasswordInput
        aria-label="Disabled"
        placeholder="Disabled"
        defaultValue="correct horse battery staple"
        disabled
      />
      <PasswordInput
        aria-label="Invalid"
        aria-invalid
        placeholder="Enter your password"
        defaultValue="short"
      />
    </Wrapper>
  );
}

export function passwordInputStates(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <PasswordInput
        aria-label="Masked (default)"
        placeholder="Enter your password"
        defaultValue="correct horse battery staple"
      />
      <PasswordInput
        aria-label="Disabled"
        placeholder="Disabled"
        defaultValue="correct horse battery staple"
        disabled
      />
      <PasswordInput
        aria-label="Invalid"
        aria-invalid
        placeholder="Enter your password"
        defaultValue="short"
      />
    </Wrapper>
  );
}

export function passwordInputRevealed(): ReactNode {
  // Visibility is internal component state, so this example is interactive:
  // click the eye to flip the field to `type="text"` and the icon to `EyeOff`
  // (`aria-pressed="true"`). The toggle also carries a custom `toggleAriaLabel`.
  return (
    <Wrapper className="flex-col items-stretch">
      <PasswordInput
        aria-label="Reveal password"
        toggleAriaLabel="Show password"
        placeholder="Click the eye to reveal"
        defaultValue="correct horse battery staple"
      />
    </Wrapper>
  );
}

export function passwordInputRequirements(): ReactNode {
  const [value, setValue] = useState("");
  return (
    <Wrapper className="flex-col items-stretch">
      <PasswordInput
        aria-label="New password"
        autoComplete="new-password"
        placeholder="Create a password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        requirements={[
          { label: "At least 8 characters", met: value.length >= 8 },
          { label: "Contains a number", met: /\d/.test(value) },
          {
            label: "Contains a special character",
            met: /[^A-Za-z0-9]/.test(value),
          },
        ]}
      />
    </Wrapper>
  );
}

export function passwordInputRequirementsMet(): ReactNode {
  // Static "all requirements satisfied" view — the success rows
  // (`text-success-text`, Check icons) render at rest without typing.
  return (
    <Wrapper className="flex-col items-stretch">
      <PasswordInput
        aria-label="Password (all rules met)"
        autoComplete="new-password"
        defaultValue="Sup3r$ecret!"
        requirements={[
          { label: "At least 8 characters", met: true },
          { label: "Contains a number", met: true },
          { label: "Contains a special character", met: true },
        ]}
      />
    </Wrapper>
  );
}
