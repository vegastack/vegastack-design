"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/context-ring` (dogfoods the registry) → auto-scanned.
import { ContextRing } from "@/components/ui/context-ring";

const parts = [
  { label: "Instructions & tools", tokens: 12_000 },
  { label: "Conversation", tokens: 40_000 },
  { label: "Tool results", tokens: 10_000 },
];

export function contextRing(): ReactNode {
  return (
    <Wrapper>
      <ContextRing
        used={62_000}
        window={100_000}
        parts={parts}
        onSummarize={() => new Promise((resolve) => setTimeout(resolve, 800))}
      />
    </Wrapper>
  );
}

export function contextRingTones(): ReactNode {
  return (
    <Wrapper className="gap-6">
      {([null, 10_000, 74_000, 80_000, 92_000] as const).map((used) => (
        <span
          key={String(used)}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ContextRing used={used} window={100_000} parts={parts} />
          {used === null ? "Empty" : `${used / 1000}%`}
        </span>
      ))}
    </Wrapper>
  );
}

export function contextRingSummarize(): ReactNode {
  function Demo(): ReactNode {
    const [used, setUsed] = useState(92_000);
    return (
      <ContextRing
        used={used}
        window={100_000}
        parts={[
          { label: "Instructions & tools", tokens: 12_000 },
          { label: "Conversation", tokens: used - 22_000 },
          { label: "Tool results", tokens: 10_000 },
        ]}
        onSummarize={() =>
          new Promise<void>((resolve) =>
            setTimeout(() => {
              setUsed(20_000);
              resolve();
            }, 900),
          )
        }
      />
    );
  }
  return (
    <Wrapper>
      <Demo />
    </Wrapper>
  );
}

export function contextRingReadOnly(): ReactNode {
  return (
    <Wrapper className="gap-6">
      <ContextRing used={48_000} window={100_000} parts={parts} />
      <ContextRing used={48_000} window={100_000} size="sm" parts={parts} />
    </Wrapper>
  );
}
