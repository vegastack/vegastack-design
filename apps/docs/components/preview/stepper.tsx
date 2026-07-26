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
  const [current, setCurrent] = useState(1);
  const atStart = current === 0;
  const atEnd = current === IMPORT_STEPS.length - 1;
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
        <Stepper aria-label="Import" steps={stepsFor(current)} />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={atStart}
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          >
            Back
          </Button>
          <Button
            size="sm"
            disabled={atEnd}
            onClick={() =>
              setCurrent((c) => Math.min(IMPORT_STEPS.length - 1, c + 1))
            }
          >
            Next
          </Button>
        </div>
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

export function stepperBlocked(): ReactNode {
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
        <Stepper
          aria-label="Checkout"
          steps={stepsFor(1)}
          blockedReason="Map every required column to continue"
          blockedReasonId="stepper-blocked-demo"
        />
        <div>
          <Button size="sm" disabled aria-describedby="stepper-blocked-demo">
            Next
          </Button>
        </div>
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
