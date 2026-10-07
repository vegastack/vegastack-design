"use client";

import { type ReactNode, useRef, useState } from "react";
import { Wrapper } from "./wrapper";
import { InfoHint } from "@/components/ui/info-hint";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function infoHint(): ReactNode {
  return (
    <Wrapper>
      <h3 className="flex items-center gap-1 text-base font-medium">
        Spaces
        <InfoHint label="About spaces">
          A space groups the people and records that work together.
        </InfoHint>
      </h3>
    </Wrapper>
  );
}

/** With a link: `href` adds a link under the sentence, opened in a new tab. */
export function infoHintLink(): ReactNode {
  return (
    <Wrapper>
      <h3 className="flex items-center gap-1 text-base font-medium">
        Publishing
        <InfoHint
          label="About publishing"
          href="https://design.vegastack.com/docs"
          linkLabel="Read the publishing guide"
        >
          A published page can be opened by anyone with its link.
        </InfoHint>
      </h3>
    </Wrapper>
  );
}

/** Beside a field label, opening above. */
export function infoHintField(): ReactNode {
  return (
    <Wrapper>
      <Field className="max-w-xs">
        <div className="flex items-center gap-1">
          <FieldLabel htmlFor="docs-info-hint-slug">Slug</FieldLabel>
          <InfoHint label="About the slug" side="top">
            The slug is the last part of the page's public address.
          </InfoHint>
        </div>
        <Input id="docs-info-hint-slug" defaultValue="release-notes" />
      </Field>
    </Wrapper>
  );
}

/** In a dialog title: `initialFocus` sends focus to the first field, not the hint. */
export function infoHintDialog(): ReactNode {
  const [open, setOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  return (
    <Wrapper>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        New space
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent initialFocus={nameRef}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1">
              New space
              <InfoHint label="About spaces">
                A space groups the people and records that work together.
              </InfoHint>
            </DialogTitle>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="docs-info-hint-name">Name</FieldLabel>
            <Input id="docs-info-hint-name" ref={nameRef} />
          </Field>
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}
