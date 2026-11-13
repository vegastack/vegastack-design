"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/context-ring` (dogfoods the registry) → auto-scanned.
import { ContextRing } from "@/components/ui/context-ring";

const PARTS = [
  { id: "instructions", label: "Instructions and tools", tokens: 15_700 },
  { id: "memory", label: "Memory", tokens: 2_100 },
  { id: "conversation", label: "Conversation", tokens: 6_900 },
  { id: "tools", label: "Tool results", tokens: 1_200 },
];

export function contextRing(): ReactNode {
  return (
    <Wrapper>
      <ContextRing
        used={25_900}
        window={200_000}
        parts={PARTS}
        onSummarize={() => new Promise((done) => setTimeout(done, 1200))}
      />
    </Wrapper>
  );
}

export function contextRingTones(): ReactNode {
  return (
    <Wrapper className="gap-2">
      <ContextRing used={40_000} window={200_000} parts={PARTS} />
      <ContextRing used={156_000} window={200_000} parts={PARTS} />
      <ContextRing used={184_000} window={200_000} parts={PARTS} />
    </Wrapper>
  );
}

export function contextRingSummarize(): ReactNode {
  function Demo(): ReactNode {
    const [used, setUsed] = useState(184_000);
    const [summarizing, setSummarizing] = useState(false);
    return (
      <ContextRing
        used={used}
        window={200_000}
        parts={[
          {
            id: "instructions",
            label: "Instructions and tools",
            tokens: 15_700,
          },
          { id: "conversation", label: "Conversation", tokens: used - 15_700 },
        ]}
        summarizing={summarizing}
        onSummarize={() => {
          setSummarizing(true);
          setTimeout(() => {
            setUsed(48_000);
            setSummarizing(false);
          }, 1200);
        }}
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
    <Wrapper>
      <ContextRing used={62_000} window={200_000} parts={PARTS} />
    </Wrapper>
  );
}
