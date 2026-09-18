"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/input-otp` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

function Slots({ count, from = 0 }: { count: number; from?: number }) {
  return (
    <InputOTPGroup>
      {Array.from({ length: count }, (_, index) => (
        <InputOTPSlot key={from + index} index={from + index} />
      ))}
    </InputOTPGroup>
  );
}

export function inputOtp(): ReactNode {
  return (
    <Wrapper>
      <InputOTP maxLength={6} aria-label="One-time password">
        <Slots count={3} />
        <InputOTPSeparator />
        <Slots count={3} from={3} />
      </InputOTP>
    </Wrapper>
  );
}

export function inputOtpAbout(): ReactNode {
  return (
    <Wrapper className="flex-col items-center gap-3">
      <InputOTP maxLength={6} defaultValue="123456" aria-label="About demo">
        <Slots count={6} />
      </InputOTP>
      <p className="text-sm text-muted-foreground">
        One hidden input drives every slot — paste, autofill and the mobile SMS
        suggestion all land in the right cells.
      </p>
    </Wrapper>
  );
}

export function inputOtpComposition(): ReactNode {
  return (
    <Wrapper>
      <InputOTP maxLength={8} aria-label="Composition demo">
        <Slots count={3} />
        <InputOTPSeparator />
        <Slots count={3} from={3} />
        <InputOTPSeparator />
        <Slots count={2} from={6} />
      </InputOTP>
    </Wrapper>
  );
}

export function inputOtpPattern(): ReactNode {
  return (
    <Wrapper>
      <Field className="w-fit">
        <FieldLabel htmlFor="digits-only">Digits Only</FieldLabel>
        <InputOTP id="digits-only" maxLength={6} pattern={REGEXP_ONLY_DIGITS}>
          <Slots count={6} />
        </InputOTP>
        <FieldDescription>Letters are rejected as you type.</FieldDescription>
      </Field>
    </Wrapper>
  );
}

export function inputOtpSeparator(): ReactNode {
  return (
    <Wrapper>
      <InputOTP maxLength={6} aria-label="Separated code">
        <Slots count={2} />
        <InputOTPSeparator />
        <Slots count={2} from={2} />
        <InputOTPSeparator />
        <Slots count={2} from={4} />
      </InputOTP>
    </Wrapper>
  );
}

export function inputOtpDisabled(): ReactNode {
  return (
    <Wrapper>
      <InputOTP
        maxLength={6}
        disabled
        value="123456"
        aria-label="Disabled code"
      >
        <Slots count={3} />
        <InputOTPSeparator />
        <Slots count={3} from={3} />
      </InputOTP>
    </Wrapper>
  );
}

export function inputOtpControlled(): ReactNode {
  const [value, setValue] = React.useState("");

  return (
    <Wrapper className="flex-col items-center gap-2">
      <InputOTP
        maxLength={6}
        value={value}
        onChange={setValue}
        aria-label="Controlled code"
      >
        <Slots count={6} />
      </InputOTP>
      <div className="text-center text-sm">
        {value === ""
          ? "Enter your one-time password."
          : `You entered: ${value}`}
      </div>
    </Wrapper>
  );
}

export function inputOtpInvalid(): ReactNode {
  return (
    <Wrapper>
      <Field data-invalid className="w-fit">
        <FieldLabel htmlFor="otp-invalid">Verification code</FieldLabel>
        <InputOTP id="otp-invalid" maxLength={6} defaultValue="000000">
          <InputOTPGroup>
            <InputOTPSlot index={0} aria-invalid />
            <InputOTPSlot index={1} aria-invalid />
            <InputOTPSlot index={2} aria-invalid />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} aria-invalid />
            <InputOTPSlot index={4} aria-invalid />
            <InputOTPSlot index={5} aria-invalid />
          </InputOTPGroup>
        </InputOTP>
        <FieldError>That code has expired. Request a new one.</FieldError>
      </Field>
    </Wrapper>
  );
}

export function inputOtpFourDigits(): ReactNode {
  return (
    <Wrapper>
      <InputOTP maxLength={4} pattern={REGEXP_ONLY_DIGITS} aria-label="PIN">
        <Slots count={4} />
      </InputOTP>
    </Wrapper>
  );
}

export function inputOtpAlphanumeric(): ReactNode {
  return (
    <Wrapper>
      <InputOTP
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
        aria-label="Alphanumeric code"
      >
        <Slots count={3} />
        <InputOTPSeparator />
        <Slots count={3} from={3} />
      </InputOTP>
    </Wrapper>
  );
}

export function inputOtpForm(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <form
        className="mx-auto flex w-full max-w-sm flex-col items-center gap-4"
        onSubmit={(event) => event.preventDefault()}
      >
        <Field className="w-fit items-center">
          <FieldLabel htmlFor="otp-form">Verification code</FieldLabel>
          <InputOTP id="otp-form" maxLength={6} pattern={REGEXP_ONLY_DIGITS}>
            <Slots count={3} />
            <InputOTPSeparator />
            <Slots count={3} from={3} />
          </InputOTP>
          <FieldDescription>
            We sent a six-digit code to your email.
          </FieldDescription>
        </Field>
        <Button type="submit">Verify</Button>
      </form>
    </Wrapper>
  );
}

export function inputOtpRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-center gap-4">
      <div dir="ltr">
        <InputOTP maxLength={6} defaultValue="123456" aria-label="Code">
          <Slots count={3} />
          <InputOTPSeparator />
          <Slots count={3} from={3} />
        </InputOTP>
      </div>
      <div dir="rtl">
        <InputOTP maxLength={6} defaultValue="123456" aria-label="الرمز">
          <Slots count={3} />
          <InputOTPSeparator />
          <Slots count={3} from={3} />
        </InputOTP>
      </div>
    </Wrapper>
  );
}
