"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
// Copied INTO apps/docs via `shadcn add @vegastack/auto-save-input` (dogfoods the registry) → auto-scanned.
import {
  AutoSaveIndicator,
  AutoSaveInput,
  useAutoSave,
  type AutoSaveFormStatus,
} from "@/components/ui/auto-save-input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The auto-save lifecycle, one field per outcome. Each is the real component
 * driven only through its own props (no doc-local status hack) — edit a field
 * and pause 800ms to watch it move through the trailing indicator:
 * - **Idle** — at rest, value matches the last save, no indicator.
 * - **Saving** — a deliberately slow `onSave` holds the spinner while in flight.
 * - **Saved** — a fast `onSave` resolves to the `text-success-text` check.
 * - **Error** — a rejecting `onSave` flags the `text-destructive-text` cross + `aria-invalid`.
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
        <span className="text-xs font-medium text-muted-foreground">
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
        <span className="text-xs font-medium text-muted-foreground">
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
        <span className="text-xs font-medium text-muted-foreground">
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
        <span className="text-xs font-medium text-muted-foreground">
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
  const first = records[0]!;
  const [activeId, setActiveId] = useState(first.id);
  const [name, setName] = useState(first.name);

  return (
    <Wrapper className="flex-col items-stretch">
      <div className="flex flex-wrap justify-center gap-2">
        {records.map((record) => (
          <Button
            key={record.id}
            type="button"
            // The record selector is a toggle, not navigation: `secondary` is the selected
            // fill and `outline` the resting one.
            variant={record.id === activeId ? "secondary" : "outline"}
            size="sm"
            aria-pressed={record.id === activeId}
            onClick={() => {
              // External baseline update — switches records without auto-saving.
              setActiveId(record.id);
              setName(record.name);
            }}
          >
            {record.name}
          </Button>
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
      <p className="text-center text-sm text-muted-foreground">
        Editing saves after the debounce; switching records resets the baseline.
      </p>
    </Wrapper>
  );
}

/** Every `AutoSaveIndicator` status, side by side (`idle` renders an empty live region). */
export function autoSaveIndicatorStates(): ReactNode {
  return (
    <Wrapper className="flex-wrap gap-6">
      <AutoSaveIndicator status="saving" />
      <AutoSaveIndicator status="saved" />
      <AutoSaveIndicator status="error" />
      <AutoSaveIndicator status="conflict" />
    </Wrapper>
  );
}

/**
 * `variant="icon"`: every status as the icon alone, then a live field that walks the lifecycle —
 * each state pops in (fade + 0.9 → 1 scale), Saved fades out when it clears, Failed stays.
 */
export function autoSaveIndicatorIcon(): ReactNode {
  const [status, setStatus] = useState<AutoSaveFormStatus>("idle");
  const run = async (fail: boolean) => {
    setStatus("saving");
    await wait(900);
    if (fail) return setStatus("error");
    setStatus("saved");
    await wait(2000);
    setStatus("idle");
  };
  return (
    <Wrapper className="flex-col items-stretch gap-6">
      <div className="flex flex-wrap items-center gap-6">
        {(["saving", "saved", "error", "conflict"] as const).map((s) => (
          <span
            key={s}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <AutoSaveIndicator variant="icon" status={s} />
            {s}
          </span>
        ))}
      </div>
      <div className="mx-auto grid w-full max-w-sm gap-3">
        <InputGroup>
          <InputGroupInput aria-label="Workspace name" defaultValue="Orbit" />
          <InputGroupAddon align="inline-end">
            <AutoSaveIndicator variant="icon" status={status} />
          </InputGroupAddon>
        </InputGroup>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void run(false)}>
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={() => void run(true)}>
            Save and fail
          </Button>
        </div>
      </div>
    </Wrapper>
  );
}

/**
 * `useAutoSave` over a whole form: edit either field and pause 600ms. Only the changed field
 * is sent, one save runs at a time, and the version advances with each save.
 */
export function autoSaveForm(): ReactNode {
  const [entries, setEntries] = useState({ name: "Orbit", city: "Pune" });
  const [log, setLog] = useState<string[]>([]);
  const autosave = useAutoSave({
    value: entries,
    version: 1,
    onSave: async (changes, { version }) => {
      await wait(800);
      setLog((l) => [
        `v${version} → v${(version ?? 0) + 1}: ${Object.keys(changes).join(", ")}`,
        ...l.slice(0, 2),
      ]);
      return { version: (version ?? 0) + 1 };
    },
  });
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="asf-name">Name</FieldLabel>
          <Input
            id="asf-name"
            value={entries.name}
            onChange={(e) =>
              setEntries((v) => ({ ...v, name: e.target.value }))
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="asf-city">City</FieldLabel>
          <Input
            id="asf-city"
            value={entries.city}
            onChange={(e) =>
              setEntries((v) => ({ ...v, city: e.target.value }))
            }
          />
        </Field>
      </div>
      <div className="flex items-center justify-between gap-4">
        <AutoSaveIndicator status={autosave.status} />
        <span className="text-xs text-muted-foreground tabular-nums">
          {log[0] ?? "No saves yet"}
        </span>
      </div>
    </Wrapper>
  );
}
