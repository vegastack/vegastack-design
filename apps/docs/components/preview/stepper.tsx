"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/stepper` (dogfoods the registry) → auto-scanned.
import { Stepper, type StepperStep } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";

const IMPORT_STEPS = [
  "Upload file",
  "Map columns",
  "Review",
  "Import",
] as const;

function stepsFor(current: number, errorAt?: number): StepperStep[] {
  return IMPORT_STEPS.map((label, index) => ({
    id: label,
    label,
    state:
      index === errorAt
        ? "error"
        : index < current
          ? "complete"
          : index === current
            ? "current"
            : "upcoming",
  }));
}

export function stepper(): ReactNode {
  // The hero is the case that needs no controls at all: progress the SYSTEM drives, which a
  // person reads rather than advances. A wizard's Back and Next belong to MultiStepForm.
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-2xl">
        <Stepper
          aria-label="Order status"
          steps={[
            {
              id: "placed",
              label: "Order placed",
              description: "21 Sep, 09:14",
              state: "complete",
            },
            {
              id: "packed",
              label: "Packed",
              description: "21 Sep, 16:02",
              state: "complete",
            },
            {
              id: "transit",
              label: "In transit",
              description: "Leaves Bengaluru tonight",
              state: "current",
            },
            { id: "delivered", label: "Delivered", state: "upcoming" },
          ]}
        />
      </div>
    </Wrapper>
  );
}

export function stepperDriven(): ReactNode {
  const [current, setCurrent] = useState(1);
  const atStart = current === 0;
  const atEnd = current === IMPORT_STEPS.length - 1;
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <Stepper aria-label="Import" steps={stepsFor(current)} />
        {/* These buttons are the HOST's, not the Stepper's — start and end of the row, the
            same places MultiStepForm puts them. */}
        <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            disabled={atStart}
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          >
            Back
          </Button>
          <Button
            disabled={atEnd}
            onClick={() =>
              setCurrent((c) => Math.min(IMPORT_STEPS.length - 1, c + 1))
            }
          >
            Continue
          </Button>
        </div>
      </div>
    </Wrapper>
  );
}

export function stepperStates(): ReactNode {
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-sm">
        <Stepper
          aria-label="Every step state"
          orientation="vertical"
          steps={[
            {
              id: "upload",
              label: "Upload file",
              description: "customers-2026.csv",
              state: "complete",
            },
            {
              id: "map",
              label: "Map columns",
              description: "12 of 12 matched",
              state: "current",
            },
            {
              id: "scan",
              label: "Check for duplicates",
              description: "Scanning 8,400 rows",
              state: "loading",
            },
            {
              id: "review",
              label: "Review changes",
              description: "40 rows will be overwritten",
              state: "warning",
            },
            {
              id: "conflicts",
              label: "Resolve conflicts",
              description: "3 rows need a decision",
              state: "error",
            },
            {
              id: "notify",
              label: "Notify owners",
              description: "Passed over",
              state: "skipped",
              optional: true,
            },
            { id: "import", label: "Import", state: "upcoming" },
          ]}
        />
      </div>
    </Wrapper>
  );
}

export function stepperError(): ReactNode {
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-lg">
        <Stepper
          aria-label="Import with a failed step"
          collapse={false}
          steps={stepsFor(3, 1).map((s) =>
            s.state === "error"
              ? { ...s, description: "2 columns unmapped" }
              : s,
          )}
        />
      </div>
    </Wrapper>
  );
}

export function stepperSizes(): ReactNode {
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-8">
        <Stepper
          aria-label="Default size"
          steps={stepsFor(2)}
          collapse={false}
        />
        <Stepper
          aria-label="Small size"
          size="sm"
          steps={stepsFor(2)}
          collapse={false}
        />
      </div>
    </Wrapper>
  );
}

export function stepperInline(): ReactNode {
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-lg">
        <Stepper
          aria-label="Checkout"
          labelPosition="inline"
          size="sm"
          collapse={false}
          steps={[
            { id: "cart", label: "Cart", state: "complete" },
            { id: "delivery", label: "Delivery", state: "current" },
            { id: "payment", label: "Payment", state: "upcoming" },
          ]}
        />
      </div>
    </Wrapper>
  );
}

export function stepperVertical(): ReactNode {
  const [current, setCurrent] = useState(2);
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-xs">
        <Stepper
          aria-label="Setup"
          orientation="vertical"
          navigable
          onStepSelect={(id) =>
            setCurrent(IMPORT_STEPS.findIndex((label) => label === id))
          }
          steps={stepsFor(current).map((s, i) => ({
            ...s,
            description: i === 0 ? "CSV or XLSX, up to 10 MB" : s.description,
          }))}
        />
      </div>
    </Wrapper>
  );
}

export function stepperCollapsed(): ReactNode {
  // A container query, not a viewport one: the rail collapses because THIS box is narrow,
  // on any screen. Both examples render the same component with the same props.
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div className="w-full">
          <Stepper aria-label="Import, wide" steps={stepsFor(1)} showCount />
        </div>
        <div className="w-full max-w-64 rounded-lg border border-border p-4">
          <Stepper aria-label="Import, narrow" steps={stepsFor(1)} showCount />
        </div>
      </div>
    </Wrapper>
  );
}
