"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/textarea` (dogfoods the registry) → auto-scanned.
import { Textarea } from "@/components/ui/textarea";

export function textarea(): ReactNode {
  return (
    <Wrapper>
      <Textarea
        aria-label="Description"
        placeholder="Tell us about your project…"
      />
    </Wrapper>
  );
}

export function textareaStates(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <Textarea aria-label="Default" />
      <Textarea
        aria-label="With placeholder"
        placeholder="Tell us about your project…"
      />
      <Textarea
        aria-label="With value"
        defaultValue="We're building an agentic workflow engine for enterprise teams."
      />
      <Textarea aria-label="Disabled" placeholder="Disabled" disabled />
      <Textarea
        aria-label="Invalid"
        aria-invalid
        defaultValue="This message is too short."
        placeholder="Invalid"
      />
      <Textarea aria-label="Read only" defaultValue="Read only" readOnly />
      <Textarea
        aria-label="Auto-grow"
        autoGrow
        placeholder="Auto-grows as you type…"
        className="max-h-40"
      />
    </Wrapper>
  );
}

export function textareaAutoGrow(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <Textarea
        aria-label="Fixed height (default)"
        rows={2}
        placeholder="Fixed height — scrolls on overflow…"
      />
      <Textarea
        aria-label="Auto-grow (live — type to see it grow)"
        autoGrow
        rows={2}
        className="max-h-40"
        defaultValue={
          "Type into me — I grow to fit my content instead of scrolling.\n\nI start at rows={2} and grow line by line until I hit the max-h-40 cap, then I scroll."
        }
      />
    </Wrapper>
  );
}
