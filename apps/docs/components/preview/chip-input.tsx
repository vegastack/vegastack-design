"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/chip-input` (dogfoods the registry) → auto-scanned.
import { ChipInput } from "@/components/ui/chip-input";

export function chipInput(): ReactNode {
  const [tags, setTags] = useState<string[]>(["design", "tokens"]);
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">Tags</span>
        <ChipInput
          aria-label="Tags"
          value={tags}
          onValueChange={setTags}
          placeholder="Add tags…"
        />
        <p className="text-sm text-muted-foreground">
          Enter or comma commits; Backspace in the empty input removes the last
          chip.
        </p>
      </div>
    </Wrapper>
  );
}

export function chipInputValidation(): ReactNode {
  const [emails, setEmails] = useState<string[]>([
    "ada@example.com",
    "not-an-email",
  ]);
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">
          Recipients
        </span>
        <ChipInput
          aria-label="Recipients"
          value={emails}
          onValueChange={setEmails}
          validate={(chip) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(chip)}
          placeholder="Add recipients…"
        />
        <p className="text-sm text-muted-foreground">
          Invalid entries stay visible and flagged — paste a list and fix the
          typos instead of losing them.
        </p>
      </div>
    </Wrapper>
  );
}

export function chipInputStates(): ReactNode {
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        <ChipInput aria-label="Empty" placeholder="Add domains…" />
        <ChipInput
          aria-label="Small"
          size="sm"
          defaultValue={["events.create", "events.delete"]}
        />
        <ChipInput aria-label="Disabled" defaultValue={["locked"]} disabled />
      </div>
    </Wrapper>
  );
}
