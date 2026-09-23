"use client";

import type { ReactNode } from "react";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Wrapper } from "./wrapper";

export function passwordInput(): ReactNode {
  return (
    <Wrapper>
      <Field className="max-w-sm">
        <FieldLabel htmlFor="docs-password">Password</FieldLabel>
        <PasswordInput
          id="docs-password"
          name="password"
          autoComplete="current-password"
          defaultValue="correct horse"
        />
      </Field>
    </Wrapper>
  );
}

export function passwordInputStates(): ReactNode {
  return (
    <Wrapper className="grid gap-4 sm:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="docs-password-new">New password</FieldLabel>
        <PasswordInput
          id="docs-password-new"
          autoComplete="new-password"
          aria-describedby="docs-password-new-help"
        />
        <FieldDescription id="docs-password-new-help">
          At least 12 characters.
        </FieldDescription>
      </Field>
      <Field data-invalid>
        <FieldLabel htmlFor="docs-password-invalid">Password</FieldLabel>
        <PasswordInput
          id="docs-password-invalid"
          defaultValue="short"
          aria-invalid="true"
        />
        <FieldError>Password is too short.</FieldError>
      </Field>
      <Field data-disabled>
        <FieldLabel htmlFor="docs-password-disabled">Password</FieldLabel>
        <PasswordInput
          id="docs-password-disabled"
          defaultValue="locked"
          disabled
        />
      </Field>
    </Wrapper>
  );
}
