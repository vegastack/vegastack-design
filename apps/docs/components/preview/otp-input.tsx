"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Field } from "@/components/ui/field";
// Copied INTO apps/docs via `shadcn add @vegastack/otp-input` (dogfoods the registry) → auto-scanned.
import { OTPInput } from "@/components/ui/otp-input";

/** Controlled, 6 digits — type to fill; the active cell tints its border with `ring`. */
export function otpInput(): ReactNode {
  const [value, setValue] = useState("");
  return (
    <Wrapper>
      <OTPInput
        aria-label="Verification code"
        groups={[3, 3]}
        value={value}
        onValueChange={setValue}
      />
    </Wrapper>
  );
}

/** State matrix — empty, filled, masked, invalid (`data-invalid`), and disabled. */
export function otpInputStates(): ReactNode {
  return (
    <Wrapper className="flex-col items-start gap-6">
      {/* Empty — every cell `border-input`, awaiting input. */}
      <OTPInput aria-label="Empty code" />
      {/* Filled — a complete value. */}
      <OTPInput
        aria-label="Filled code"
        groups={[3, 3]}
        defaultValue="123456"
      />
      {/* Masked — characters hidden. */}
      <OTPInput aria-label="Masked code" mask defaultValue="123456" />
      {/* Invalid — every slot's border tints destructive (the `data-invalid` state). */}
      <OTPInput
        aria-label="Invalid code"
        groups={[3, 3]}
        defaultValue="123456"
        slotClassName="border-destructive/(--alpha-tint-border)"
      />
      {/* Disabled — dimmed, `not-allowed`, non-interactive. */}
      <OTPInput aria-label="Disabled code" defaultValue="123456" disabled />
    </Wrapper>
  );
}

/** Grouped layouts — separators rendered between slot groups via `groups`. */
export function otpInputGrouped(): ReactNode {
  return (
    <Wrapper className="flex-col items-start gap-6">
      {/* Default `-` separator, two groups of three. */}
      <OTPInput aria-label="Grouped 3-3" groups={[3, 3]} defaultValue="123456" />
      {/* Three groups of two. */}
      <OTPInput
        aria-label="Grouped 2-2-2"
        groups={[2, 2, 2]}
        defaultValue="123456"
      />
    </Wrapper>
  );
}

/** Non-default `length` and a custom `separator` node (with `separatorClassName`). */
export function otpInputLength(): ReactNode {
  return (
    <Wrapper className="flex-col items-start gap-6">
      {/* Four flat slots — no grouping. */}
      <OTPInput aria-label="Four-digit PIN" length={4} defaultValue="1234" />
      {/* Custom separator node + class instead of the default `-`. */}
      <OTPInput
        aria-label="Dot separator"
        groups={[3, 3]}
        separator="·"
        separatorClassName="text-primary"
        defaultValue="123456"
      />
    </Wrapper>
  );
}

/** Field association — the field label auto-labels the first slot. */
export function otpInputField(): ReactNode {
  return (
    <Wrapper className="flex-col items-start gap-6">
      <Field
        label="Verification code"
        description="Enter the 6-digit code we sent you."
      >
        <OTPInput groups={[3, 3]} />
      </Field>
      {/* Invalid Field — `error` tints the slots destructive and shows a message. */}
      <Field label="Verification code" error="That code is incorrect.">
        <OTPInput groups={[3, 3]} defaultValue="123456" />
      </Field>
    </Wrapper>
  );
}

/** Live `onValueComplete` — fires once every slot is filled (auto-submit hook). */
export function otpInputComplete(): ReactNode {
  const [completed, setCompleted] = useState<string | null>(null);
  return (
    <Wrapper className="flex-col items-start gap-3">
      <OTPInput
        aria-label="2FA code"
        groups={[3, 3]}
        onValueComplete={(value) => setCompleted(value)}
        onValueChange={() => setCompleted(null)}
      />
      <p className="text-base font-mono text-muted-foreground">
        {completed
          ? `Completed: ${completed}`
          : "Fill all six slots to fire onValueComplete."}
      </p>
    </Wrapper>
  );
}
