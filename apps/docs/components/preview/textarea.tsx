"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/textarea` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

export function textarea(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <Textarea
        aria-label="Message"
        placeholder="Type your message here."
        className="mx-auto max-w-sm"
      />
    </Wrapper>
  );
}

export function textareaField(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <Field className="mx-auto max-w-sm">
        <FieldLabel htmlFor="textarea-message">Message</FieldLabel>
        <FieldDescription>Enter your message below.</FieldDescription>
        <Textarea id="textarea-message" placeholder="Type your message here." />
      </Field>
    </Wrapper>
  );
}

export function textareaDisabled(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <Field data-disabled className="mx-auto max-w-sm">
        <FieldLabel htmlFor="textarea-disabled">Message</FieldLabel>
        <Textarea
          id="textarea-disabled"
          placeholder="Type your message here."
          disabled
        />
      </Field>
    </Wrapper>
  );
}

export function textareaInvalid(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <Field data-invalid className="mx-auto max-w-sm">
        <FieldLabel htmlFor="textarea-invalid">Message</FieldLabel>
        <Textarea
          id="textarea-invalid"
          placeholder="Type your message here."
          aria-invalid
        />
        <FieldError>Please enter a message.</FieldError>
      </Field>
    </Wrapper>
  );
}

export function textareaButton(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto grid w-full max-w-sm gap-2">
        <Textarea aria-label="Message" placeholder="Type your message here." />
        <Button>Send message</Button>
      </div>
    </Wrapper>
  );
}

export function textareaRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <Field className="mx-auto w-full max-w-xs" dir="ltr">
        <FieldLabel htmlFor="textarea-rtl-ltr">Feedback</FieldLabel>
        <Textarea
          id="textarea-rtl-ltr"
          placeholder="Your feedback helps us improve…"
          rows={3}
        />
        <FieldDescription>
          Share your thoughts about our service.
        </FieldDescription>
      </Field>
      <Field className="mx-auto w-full max-w-xs" dir="rtl">
        <FieldLabel htmlFor="textarea-rtl-ar">التعليقات</FieldLabel>
        <Textarea
          id="textarea-rtl-ar"
          placeholder="تعليقاتك تساعدنا على التحسين…"
          rows={3}
        />
        <FieldDescription>شاركنا أفكارك حول خدمتنا.</FieldDescription>
      </Field>
    </Wrapper>
  );
}

/** Ours: rest, filled, invalid and disabled in one frame. */
export function textareaStates(): ReactNode {
  return (
    <Wrapper className="grid grid-cols-2 items-start gap-4">
      <Textarea aria-label="Rest" placeholder="Rest" />
      <Textarea aria-label="Filled" defaultValue="Filled" />
      <Textarea aria-label="Invalid" defaultValue="Invalid" aria-invalid />
      <Textarea aria-label="Disabled" defaultValue="Disabled" disabled />
    </Wrapper>
  );
}
