"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/chat-subagents` (dogfoods the registry).
import { BackgroundWork, SubagentsBlock } from "@/components/ui/chat-subagents";
import type { ChatToolPart } from "@/components/ui/chat-work-log";

const subagent = (
  callId: string,
  title: string,
  output: Record<string, unknown>,
  state: ChatToolPart["state"] = "output-available",
): ChatToolPart => ({
  type: "dynamic-tool",
  toolName: "subagent",
  toolCallId: callId,
  state,
  input: { title },
  output: { title, ...output },
  preliminary: output.status === "running" || output.status === "waiting",
  callProviderMetadata: { vegastack: { verb: "Researching" } },
});

const LIVE = [
  subagent("s1", "Hublit and Halonix", {
    status: "running",
    steps: 3,
    durationMs: 41_000,
  }),
  subagent(
    "s2",
    "Bhagwati and Instapower",
    { status: "waiting", steps: 2 },
    "approval-requested",
  ),
  subagent("s3", "Wipro Lighting", {
    status: "done",
    steps: 5,
    durationMs: 52_000,
  }),
  subagent("s4", "Surya Roshni", {
    status: "stopped",
    reason: "ran out of steps",
  }),
  subagent("s5", "Havells", {
    status: "failed",
    reason: "the site refused every request",
  }),
];

const noop = () => {};

export function chatSubagents(): ReactNode {
  return (
    <Wrapper className="items-start justify-start bg-background">
      <div className="w-full max-w-180">
        <SubagentsBlock
          parts={LIVE}
          live
          onOpen={noop}
          onOpenRequest={noop}
          onRetry={noop}
        />
      </div>
    </Wrapper>
  );
}

export function chatSubagentsSettled(): ReactNode {
  const settled = [
    subagent("s1", "Hublit and Halonix", {
      status: "done",
      steps: 6,
      durationMs: 71_000,
      costMicroUsd: 1_500,
    }),
    subagent("s2", "Bhagwati and Instapower", {
      status: "done",
      steps: 4,
      durationMs: 63_000,
      costMicroUsd: 1_500,
    }),
    subagent("s3", "Wipro Lighting", {
      status: "done",
      steps: 5,
      durationMs: 52_000,
      costMicroUsd: 1_500,
    }),
    subagent("s4", "Surya Roshni", {
      status: "stopped",
      reason: "ran out of steps",
      costMicroUsd: 1_500,
    }),
  ];
  return (
    <Wrapper className="items-start justify-start bg-background">
      <div className="w-full max-w-180">
        <SubagentsBlock parts={settled} onOpen={noop} onRetry={noop} />
      </div>
    </Wrapper>
  );
}

export function chatSubagentsBackground(): ReactNode {
  return (
    <Wrapper className="flex-col items-start justify-start bg-background">
      <BackgroundWork
        live
        label="4 Subagents · 3 done, 1 running"
        meta="1m 20s"
        onOpen={noop}
      />
      <BackgroundWork
        attention
        label="11 commands done, 1 failed"
        onOpen={noop}
      />
      <BackgroundWork
        label="Finished 4 Subagents, opened 6 sites, 1 couldn't finish"
        onOpen={noop}
      />
    </Wrapper>
  );
}
