"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/chip-input` (dogfoods the registry) → auto-scanned.
import { ChipInput } from "@/components/ui/chip-input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

export function chipInput(): ReactNode {
  const [tags, setTags] = useState<string[]>(["design", "tokens"]);
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Tags</span>
        <ChipInput
          aria-label="Tags"
          value={tags}
          onValueChange={setTags}
          placeholder="Add tags…"
        />
        <p className="text-xs text-muted-foreground">
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
        <span className="text-xs font-medium text-muted-foreground">
          Recipients
        </span>
        <ChipInput
          aria-label="Recipients"
          value={emails}
          onValueChange={setEmails}
          validate={(chip) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(chip)}
          placeholder="Add recipients…"
        />
        <p className="text-xs text-muted-foreground">
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
          defaultValue={["events.create", "events.delete"]}
        />
        <ChipInput aria-label="Disabled" defaultValue={["locked"]} disabled />
      </div>
    </Wrapper>
  );
}

/**
 * DS-21: inside a `Field` the inner input is labelled by `FieldLabel` (a click on it focuses the
 * input), described by the rendered description and error, and posts every chip under `name`.
 */
export function chipInputInsideField(): ReactNode {
  const [synonyms, setSynonyms] = useState<string[]>(["sofa"]);
  return (
    <Wrapper className="block">
      <Field
        data-invalid={synonyms.length < 2}
        className="mx-auto w-full max-w-sm"
      >
        <FieldLabel>Synonyms</FieldLabel>
        <ChipInput
          name="synonyms"
          value={synonyms}
          onValueChange={setSynonyms}
          placeholder="Add a synonym…"
        />
        <FieldDescription>Search matches any of these words.</FieldDescription>
        <FieldError>
          {synonyms.length < 2 ? "Add at least two synonyms." : null}
        </FieldError>
      </Field>
    </Wrapper>
  );
}

/** DS-21: `max` refuses entries past the cap and announces "Up to 3 entries". */
export function chipInputMax(): ReactNode {
  const [tags, setTags] = useState<string[]>(["red", "green", "blue"]);
  return (
    <Wrapper className="block">
      <Field className="mx-auto w-full max-w-sm">
        <FieldLabel>Colours</FieldLabel>
        <ChipInput max={3} value={tags} onValueChange={setTags} />
        <FieldDescription>Up to 3 colours.</FieldDescription>
      </Field>
    </Wrapper>
  );
}
