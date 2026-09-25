// @vegastack password-input@0.23.34 sha256-KDoYZIvrl0J1dxNes1Mj5cxBoVvSHxnyHM0joIhFnHw=

"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

/** Props for {@link PasswordInput}. */
export interface PasswordInputProps extends Omit<
  React.ComponentPropsWithRef<"input">,
  "size" | "type"
> {
  /** Accessible name of the toggle while the password is hidden. @default 'Show password' */
  showLabel?: string;
  /** Accessible name of the toggle while the password is visible. @default 'Hide password' */
  hideLabel?: string;
}

/**
 * Password field with a show/hide toggle, composed from `InputGroup`.
 *
 * Every native input prop — `id`, `name`, `autoComplete`, `aria-invalid`, `aria-describedby` —
 * and the React 19 `ref` land on the inner `<input>`, so it works inside `Field` and native forms.
 * `className` styles the `InputGroup` root. The toggle is `type="button"`, so it never submits,
 * and reports its state with `aria-pressed`.
 *
 * @example
 * ```tsx
 * // Inside a Field the input is labelled, described and marked invalid for you.
 * <Field>
 *   <FieldLabel>Password</FieldLabel>
 *   <PasswordInput name="password" autoComplete="current-password" />
 * </Field>
 * ```
 */
function PasswordInput({
  className,
  disabled,
  showLabel = "Show password",
  hideLabel = "Hide password",
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <InputGroup className={className} data-slot="password-input">
      <InputGroupInput
        {...props}
        type={visible ? "text" : "password"}
        disabled={disabled}
      />
      {/* Upstream's inline-end addon pulls a button outward with `me-[-0.3rem]`, so the addon's box
          ends ~4px outside the group; zero the margin and take it from the padding instead, as
          `search-input` and `number-field` do, so a full-width field never overflows its container. */}
      <InputGroupAddon align="inline-end" className="pe-1 has-[>button]:me-0">
        <InputGroupButton
          data-slot="password-input-toggle"
          size="icon-xs"
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          disabled={disabled}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

export { PasswordInput };
