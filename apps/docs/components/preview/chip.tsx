"use client";

import type { ReactNode } from "react";
import * as React from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/chip` (dogfoods the registry) → auto-scanned.
import { Chip } from "@/components/ui/chip";

export function chip(): ReactNode {
  return (
    <Wrapper className="flex-col items-center gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip>Uncategorized</Chip>
        <Chip hue="blue">B2B</Chip>
        <Chip hue="green">SaaS</Chip>
        <Chip hue="purple">Enterprise</Chip>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Chip size="md" active>
          Status: Open
        </Chip>
        <Chip size="md" active={false}>
          Owner
        </Chip>
      </div>
    </Wrapper>
  );
}

export function chipSizes(): ReactNode {
  // `sm` (28px) is the inline tag tier; `md` (32px) lines up with Buttons and Inputs.
  return (
    <Wrapper className="items-center gap-3">
      <Chip size="sm">Inline · sm</Chip>
      <Chip size="md">Control · md</Chip>
    </Wrapper>
  );
}

export function chipHues(): ReactNode {
  return (
    <Wrapper>
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            "neutral",
            "blue",
            "cyan",
            "green",
            "lime",
            "yellow",
            "orange",
            "red",
            "pink",
            "magenta",
            "purple",
          ] as const
        ).map((hue) => (
          <Chip key={hue} hue={hue}>
            {hue}
          </Chip>
        ))}
      </div>
    </Wrapper>
  );
}

export function chipRemovable(): ReactNode {
  return <ChipRemovableExample />;
}

function ChipRemovableExample() {
  // Every remove control is a real 24x24 target, at both tiers — the WCAG 2.5.8 floor
  // is the button's own border box, not an invisible pseudo-element.
  const [labels, setLabels] = React.useState([
    "Design partner",
    "Priority",
    "EMEA",
  ]);
  const hues = ["purple", "orange", "cyan"] as const;
  return (
    <Wrapper className="flex-col items-center gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {labels.map((label, index) => (
          <Chip
            key={label}
            hue={hues[index % hues.length]}
            onRemove={() =>
              setLabels((prev) => prev.filter((item) => item !== label))
            }
            removeLabel={`Remove ${label}`}
          >
            <span className="min-w-0 truncate">{label}</span>
          </Chip>
        ))}
      </div>
      {labels.length === 0 ? (
        <p className="text-sm text-muted-foreground">No labels</p>
      ) : null}
    </Wrapper>
  );
}
