"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/run-timeline` (dogfoods the registry) → auto-scanned.
import {
  RunTimeline,
  type RunTimelineStep,
} from "@/components/ui/run-timeline";

const at = "2026-11-19T09:00:00.000Z";
const minutesAgo = (n: number) =>
  new Date(Date.now() - n * 60_000).toISOString();

const tool = (
  id: string,
  title: string,
  overrides: Partial<RunTimelineStep> = {},
): RunTimelineStep => ({
  id,
  kind: "tool",
  title,
  status: "done",
  startedAt: at,
  durationMs: 1400,
  cost: "₹0.08",
  ...overrides,
});

const STEPS: RunTimelineStep[] = [
  {
    id: "t1",
    kind: "turn",
    title: "Planned the Monday supplier check",
    status: "done",
    startedAt: at,
    durationMs: 3200,
    cost: "₹0.31",
  },
  tool("1", "Tables › Read open orders"),
  tool("2", "Gmail › Search “delivery date” from acme.com"),
  tool("3", "Gmail › Send to ravi@acme.com", {
    cost: "₹0.12",
    decision: {
      answer: "allow",
      by: "Rule",
      rule: "Always to @acme.com",
      why: { href: "#" },
    },
    onUndo: () => undefined,
    detail: (
      <p className="rounded-block bg-muted px-3 py-2 text-sm">
        Ravi, could you confirm the 3000 K samples ship Friday?
      </p>
    ),
  }),
  tool("4", "Gmail › Send to priya@acme.com", { status: "delivery_unknown" }),
  tool("5", "Slides › Update the supplier deck", { status: "failed" }),
  {
    id: "s1",
    kind: "subagent",
    title: "Research other suppliers",
    status: "done",
    startedAt: at,
    durationMs: 41_000,
    cost: "₹1.10",
    children: [
      tool("s1a", "Web › Search “LED driver suppliers Pune”"),
      tool("s1b", "Web › Open supplier list"),
    ],
  },
  {
    id: "a1",
    kind: "approval",
    title: "Anu approved sending the summary",
    status: "done",
    startedAt: at,
    decision: { answer: "ask", by: "Anu" },
  },
  tool("6", "Tables › Update 3 order dates", { undoneBy: "Anu" }),
];

function Column({
  children,
  width = "max-w-2xl",
}: {
  children: ReactNode;
  width?: string;
}): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className={`flex w-full flex-col gap-6 ${width}`}>{children}</div>
    </Wrapper>
  );
}

export function runTimeline(): ReactNode {
  return (
    <Column>
      <RunTimeline
        steps={STEPS}
        summary={<span className="text-xs tabular-nums">₹1.69 · 1m 12s</span>}
      />
    </Column>
  );
}

export function runTimelineLive(): ReactNode {
  return (
    <Column>
      <RunTimeline
        steps={[
          tool("1", "Tables › Read open orders"),
          tool("2", "Gmail › Search replies from acme.com", {
            status: "running",
            startedAt: minutesAgo(1),
            durationMs: undefined,
            cost: undefined,
          }),
        ]}
      />
      <RunTimeline
        steps={[
          tool("1", "Tables › Read open orders"),
          {
            id: "w",
            kind: "wait",
            title: "Waiting for Anu to approve the email",
            status: "waiting",
            startedAt: at,
          },
        ]}
      />
    </Column>
  );
}

export function runTimelineFolded(): ReactNode {
  const many = Array.from({ length: 43 }, (_, index) =>
    tool(String(index), `Drive › Read file ${index + 1} of the quote folder`),
  );
  return (
    <Column>
      <RunTimeline steps={many} />
    </Column>
  );
}

export function runTimelineNarrow(): ReactNode {
  return (
    <Column width="max-w-[390px]">
      <RunTimeline steps={STEPS.slice(0, 6)} />
    </Column>
  );
}
