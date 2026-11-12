"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/run-usage` (dogfoods the registry) → auto-scanned.
import {
  RunUsageChip,
  RunUsagePanel,
  RunUsageTable,
  type RunUsageCall,
  type RunUsageModel,
  type RunUsageSummary,
} from "@/components/ui/run-usage";

const SUMMARY: RunUsageSummary = {
  steps: 3,
  contextTokens: 62000,
  contextWindow: 100000,
  cachedRatio: 0.92,
  cost: 0.031,
};

const RICH: RunUsageSummary = {
  steps: 7,
  contextTokens: 84000,
  contextWindow: 100000,
  cachedRatio: 0.81,
  cost: 0.064,
  searches: 2,
  scripts: 1,
  subagents: 2,
  retries: 1,
  modelMs: 18400,
  toolMs: 6200,
  wallMs: 31000,
  tree: { cost: 0.112, tokens: 241000 },
};

const MODELS: RunUsageModel[] = [
  {
    model: "Claude Haiku 5.5",
    steps: 5,
    tokens: {
      new: 21000,
      cacheRead: 146000,
      cacheWrite: 18000,
      cacheWrite1h: 0,
      output: 3800,
      reasoning: 1200,
    },
    cost: 0.041,
    ms: 12100,
  },
  {
    model: "Claude Sonnet 5.5",
    steps: 2,
    tokens: { new: 9000, cacheRead: 30000, cacheWrite1h: 12000, output: 1100 },
    cost: 0.023,
    ms: 6300,
    basis: "estimated",
  },
];

const CALLS: RunUsageCall[] = [
  {
    id: "1",
    model: "Claude Haiku 5.5",
    purpose: "Step",
    tokens: { new: 4100, cacheWrite: 18000, output: 300 },
    cache: "write",
    ms: 1800,
    cost: 0.012,
  },
  {
    id: "2",
    model: "Claude Haiku 5.5",
    purpose: "Step",
    tokens: { new: 900, cacheRead: 22000, output: 500 },
    cache: "hit",
    ms: 400,
    cost: 0.004,
  },
  {
    id: "3",
    model: "Claude Sonnet 5.5",
    purpose: "Subagent",
    subagent: "Research",
    tokens: { new: 9000, cacheWrite1h: 12000, output: 700 },
    cache: "miss",
    cacheReason: "The instructions changed",
    ms: 4200,
    cost: 0.015,
    basis: "estimated",
  },
  {
    id: "4",
    model: "Claude Haiku 5.5",
    purpose: "Summary",
    tokens: { new: 600, cacheRead: 41000, output: 400 },
    cache: "hit",
    ms: 900,
    cost: 0.003,
  },
];

function Column({
  children,
  narrow = false,
}: {
  children: ReactNode;
  narrow?: boolean;
}): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch justify-start gap-4">
      <div
        className={
          narrow
            ? "flex w-full max-w-90 flex-col gap-4"
            : "flex w-full flex-col gap-4"
        }
      >
        {children}
      </div>
    </Wrapper>
  );
}

export function runUsage(): ReactNode {
  return (
    <Column>
      <RunUsagePanel
        summary={RICH}
        models={MODELS}
        calls={CALLS}
        asOf="Data as of 14:02"
      />
    </Column>
  );
}

export function runUsageChip(): ReactNode {
  return (
    <Column>
      <RunUsageChip summary={SUMMARY} />
      <RunUsageChip summary={{ ...SUMMARY, cost: undefined }} />
      <RunUsageChip
        summary={{ steps: 1, contextTokens: 1500, basis: "estimated" }}
      />
    </Column>
  );
}

export function runUsagePanelNoMoney(): ReactNode {
  return (
    <Column>
      <RunUsagePanel
        summary={{ ...RICH, cost: undefined, tree: { tokens: 241000 } }}
        models={MODELS.map((model) => ({ ...model, cost: undefined }))}
        calls={CALLS}
      />
    </Column>
  );
}

export function runUsageTable(): ReactNode {
  return (
    <Column>
      <RunUsageTable calls={CALLS} />
    </Column>
  );
}

export function runUsageStates(): ReactNode {
  return (
    <Column>
      <RunUsagePanel summary={{ steps: 0 }} heading="Empty run" />
      <RunUsagePanel state="loading" heading="Loading" />
      <RunUsagePanel
        state="error"
        heading="Error"
        error="The usage service timed out."
        onRetry={() => {}}
      />
      <RunUsageTable calls={[]} />
    </Column>
  );
}

export function runUsageNarrow(): ReactNode {
  return (
    <Column narrow>
      <RunUsageChip summary={SUMMARY} />
      <RunUsagePanel summary={RICH} models={MODELS} calls={CALLS} />
      <RunUsageTable calls={CALLS} />
    </Column>
  );
}
