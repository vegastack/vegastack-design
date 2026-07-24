"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/field-inline` (dogfoods the registry) → auto-scanned.
import { FieldInline } from "@/components/ui/field-inline";

export function fieldInline(): ReactNode {
  const [value, setValue] = useState("Untitled task");
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-1.5">
        <span className="text-base font-medium text-foreground">
          Task title
        </span>
        <FieldInline
          value={value}
          onCommit={setValue}
          label="Task title"
          placeholder="Add a title…"
        />
        <p className="text-sm text-muted-foreground">
          Click the value to rename. Enter to save, Esc to cancel.
        </p>
      </div>
    </Wrapper>
  );
}

export function fieldInlineBorderless(): ReactNode {
  const [value, setValue] = useState("Q3 planning doc");
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">
          Document name
        </span>
        <FieldInline
          value={value}
          onCommit={setValue}
          label="Document name"
          placeholder="Untitled"
          borderless
          className="text-lg font-medium text-foreground"
        />
      </div>
    </Wrapper>
  );
}

// The empty-value branch: when `value === ""`, display mode renders the
// `placeholder` as muted text; when `placeholder` is also absent it falls back
// to the generic `"Edit value"` label (which doubles as the accessible name).
export function fieldInlineEmpty(): ReactNode {
  const [withPlaceholder, setWithPlaceholder] = useState("");
  const [bare, setBare] = useState("");
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted-foreground">
            Empty + placeholder
          </span>
          <FieldInline
            value={withPlaceholder}
            onCommit={setWithPlaceholder}
            label="Task title"
            placeholder="Add a title…"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted-foreground">
            Empty, no placeholder
          </span>
          <FieldInline value={bare} onCommit={setBare} label="Task title" />
        </div>
      </div>
    </Wrapper>
  );
}

// Accessible-name distinction: `label` names the edit-mode input for screen
// readers without painting any visible text, whereas `placeholder` is the
// visible empty hint (and the name only as a last resort).
export function fieldInlineAccessibleName(): ReactNode {
  const [labelled, setLabelled] = useState("Acme Corp");
  const [placeheld, setPlaceheld] = useState("");
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted-foreground">
            Named by <code className="font-mono">label</code> (invisible)
          </span>
          <FieldInline
            value={labelled}
            onCommit={setLabelled}
            label="Company name"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted-foreground">
            Named by <code className="font-mono">placeholder</code> (visible)
          </span>
          <FieldInline
            value={placeheld}
            onCommit={setPlaceheld}
            placeholder="Company name"
          />
        </div>
      </div>
    </Wrapper>
  );
}
