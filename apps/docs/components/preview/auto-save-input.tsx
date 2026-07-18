"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/auto-save-input` (dogfoods the registry) → auto-scanned.
import { AutoSaveInput } from "@/components/ui/auto-save-input";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The auto-save lifecycle, one field per outcome. Each is the real component
 * driven only through its own props (no doc-local status hack) — edit a field
 * and pause 800ms to watch it move through the trailing indicator:
 * - **Idle** — at rest, value matches the last save, no indicator.
 * - **Saving** — a deliberately slow `onSave` holds the spinner while in flight.
 * - **Saved** — a fast `onSave` resolves to the `text-success` check.
 * - **Error** — a rejecting `onSave` flags the `text-destructive` cross + `aria-invalid`.
 */
export function autoSaveInput(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <AutoSaveInput
        aria-label="Workspace name (idle)"
        defaultValue="Acme Inc"
        validate={(v) => v.trim().length > 0}
        onSave={async () => {
          await wait(700);
        }}
        placeholder="Idle — edit to save"
      />
      <AutoSaveInput
        aria-label="Project name (saving)"
        defaultValue="Orbit"
        onSave={async () => {
          // Slow persistence — keeps the spinner visible while in flight.
          await wait(4000);
        }}
        placeholder="Saving — edit to see the spinner"
      />
      <AutoSaveInput
        aria-label="Display name (saved)"
        defaultValue="Ada"
        onSave={async () => {
          await wait(400);
        }}
        placeholder="Saved — edit to see the check"
      />
      <AutoSaveInput
        aria-label="Slug (error)"
        defaultValue="acme"
        onSave={async () => {
          // Rejecting persistence — flags the error cross and aria-invalid.
          await wait(400);
          throw new Error("Slug is already taken");
        }}
        placeholder="Error — edit to see the failure"
      />
    </Wrapper>
  );
}

/**
 * The four trailing indicators, side by side. Status is owned by the component and
 * only advances when the field is edited, so this is a **live** example — type into
 * each field and pause ~800ms to watch idle → saving → saved (or error). The labels
 * call out which outcome each field is wired to via its `onSave`/`validate`.
 */
export function autoSaveInputStates(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">
          Saving (slow onSave)
        </span>
        <AutoSaveInput
          aria-label="Saving"
          defaultValue="Orbit"
          onSave={async () => {
            await wait(4000);
          }}
          placeholder="Edit to hold the spinner"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">
          Saved (fast onSave)
        </span>
        <AutoSaveInput
          aria-label="Saved"
          defaultValue="Ada"
          onSave={async () => {
            await wait(300);
          }}
          placeholder="Edit to see the success check"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">
          Error (rejecting onSave)
        </span>
        <AutoSaveInput
          aria-label="Error"
          defaultValue="acme"
          onSave={async () => {
            await wait(300);
            throw new Error("Slug is already taken");
          }}
          placeholder="Edit to see the error cross + aria-invalid"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">
          Error (failed validate, never calls onSave)
        </span>
        <AutoSaveInput
          aria-label="Validated"
          defaultValue="Acme Inc"
          validate={(v) => v.trim().length > 0}
          onSave={async () => {
            await wait(300);
          }}
          placeholder="Clear the field to fail validation"
        />
      </div>
    </Wrapper>
  );
}

/**
 * Controlled `value` + `onValueChange`, plus the signature record-switch baseline
 * reset. The parent owns the value; editing fires `onValueChange` and (after the
 * debounce) `onSave`. Clicking a record swaps the controlled `value` externally —
 * that new value is treated as a fresh saved baseline, so switching records never
 * auto-saves stale data and never re-flags a status.
 */
export function autoSaveInputControlled(): ReactNode {
  return <AutoSaveInputControlledDemo />;
}

function AutoSaveInputControlledDemo(): ReactNode {
  const records = [
    { id: "acme", name: "Acme Inc" },
    { id: "orbit", name: "Orbit Labs" },
    { id: "globex", name: "Globex" },
  ];
  const [activeId, setActiveId] = useState(records[0].id);
  const [name, setName] = useState(records[0].name);

  return (
    <Wrapper className="flex-col items-stretch">
      <div className="flex flex-wrap justify-center gap-2">
        {records.map((record) => (
          <button
            key={record.id}
            type="button"
            onClick={() => {
              // External baseline update — switches records without auto-saving.
              setActiveId(record.id);
              setName(record.name);
            }}
            className={cn(
              "rounded-md border px-2.5 py-1 text-sm",
              record.id === activeId
                ? "border-ring bg-accent text-accent-foreground"
                : "border-input text-muted-foreground hover:bg-accent",
            )}
          >
            {record.name}
          </button>
        ))}
      </div>
      <AutoSaveInput
        aria-label="Workspace name"
        value={name}
        onValueChange={setName}
        validate={(v) => v.trim().length > 0}
        onSave={async () => {
          await wait(600);
        }}
        placeholder="Edit, or switch records above"
      />
      <p className="text-center text-base text-muted-foreground">
        Editing saves after the debounce; switching records resets the baseline.
      </p>
    </Wrapper>
  );
}
