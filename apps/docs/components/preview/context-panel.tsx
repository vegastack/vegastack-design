"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/context-panel` (dogfoods the registry) → auto-scanned.
import { ContextPanel } from "@/components/ui/context-panel";

const PARTS = [
  { id: "instructions", label: "Instructions and tools", tokens: 15_700 },
  { id: "memory", label: "Memory", tokens: 2_100 },
  { id: "conversation", label: "Conversation", tokens: 6_900 },
  { id: "tools", label: "Tool results", tokens: 1_200 },
];

function Frame({ children }: { children: ReactNode }): ReactNode {
  return (
    <Wrapper className="items-start">
      <div className="w-80 rounded-card border border-border bg-popover p-4 text-popover-foreground">
        {children}
      </div>
    </Wrapper>
  );
}

export function contextPanel(): ReactNode {
  return (
    <Frame>
      <ContextPanel
        used={25_900}
        window={200_000}
        parts={PARTS}
        onSummarize={() => {}}
      />
    </Frame>
  );
}

export function contextPanelOther(): ReactNode {
  return (
    <Frame>
      <ContextPanel used={30_000} window={200_000} parts={PARTS} />
    </Frame>
  );
}

export function contextPanelEmpty(): ReactNode {
  return (
    <Frame>
      <ContextPanel used={null} window={200_000} onSummarize={() => {}} />
    </Frame>
  );
}

/** `variant="panel"`: a side panel's Details — one line, the bar, compact rows. */
export function contextPanelSide(): ReactNode {
  return (
    <Wrapper className="items-start">
      <div className="w-80 border-s bg-background px-4 py-3">
        <ContextPanel
          variant="panel"
          used={37_500}
          window={400_000}
          parts={PARTS}
        />
      </div>
    </Wrapper>
  );
}
