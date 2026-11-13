"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/chat-plan-card` (dogfoods the registry) → auto-scanned.
import { ChatPlanCard, type PlanData } from "@/components/ui/chat-plan-card";

const noop = () => {};
const COLUMN = "flex-col flex-nowrap items-stretch gap-3 bg-background";

const PLAN: PlanData = {
  id: "p1",
  version: 1,
  state: "waiting",
  title: "Compare Indian makers with Regent and share the result with Simran",
  goal: "Find 12 makers, research them in parallel, and put the comparison in a Google Doc that Simran can edit.",
  steps: [
    { n: 1, text: "Search the web for makers of LED downlights in India" },
    {
      n: 2,
      text: "Research 3 makers each with 4 Subagents (read-only)",
      subagents: 4,
      detail:
        "Each Subagent reads the maker's site and catalogue; nothing is changed.",
    },
    { n: 3, text: "Write the comparison into a new Google Doc" },
    {
      n: 4,
      text: "Share the Doc with sm@vegastack.com and email her the link",
    },
  ],
  willChange: ["a new Google Doc", "1 email"],
  wont: ["create tasks", "post in Slack"],
  needsOk: [{ step: 4, words: "sharing outside the chat" }],
};

const V2: PlanData = {
  ...PLAN,
  id: "p2",
  version: 2,
  steps: [
    ...PLAN.steps.slice(0, 3),
    { n: 4, text: "Check every source link still opens" },
    {
      n: 5,
      text: "Share the Doc with sm@vegastack.com and email her the link",
    },
  ],
  needsOk: [{ step: 5, words: "sharing outside the chat" }],
  changedFrom: {
    version: 1,
    added: [4],
    removed: ["Post a summary in #sales"],
    edited: [3],
  },
};

const LONG: PlanData = {
  ...PLAN,
  id: "p3",
  steps: Array.from({ length: 11 }, (_, i) => ({
    n: i + 1,
    text: `Research maker ${i + 1}`,
  })),
  needsOk: [],
};

const cardProps = { onApprove: noop, onKeepPlanning: noop, onReject: noop };

export function chatPlanCard(): ReactNode {
  return (
    <Wrapper className={COLUMN}>
      <ChatPlanCard data={PLAN} {...cardProps} />
    </Wrapper>
  );
}

export function chatPlanCardChanged(): ReactNode {
  return (
    <Wrapper className={COLUMN}>
      <ChatPlanCard data={V2} {...cardProps} />
    </Wrapper>
  );
}

export function chatPlanCardLong(): ReactNode {
  return (
    <Wrapper className={COLUMN}>
      <ChatPlanCard data={LONG} {...cardProps} />
    </Wrapper>
  );
}

export function chatPlanCardLines(): ReactNode {
  return (
    <Wrapper className={COLUMN}>
      <ChatPlanCard
        data={{
          ...PLAN,
          state: "approved",
          answer: { by: "you", at: "2026-11-13T10:00:00Z", mode: "run" },
        }}
        {...cardProps}
      />
      <ChatPlanCard data={{ ...PLAN, state: "rejected" }} {...cardProps} />
      <ChatPlanCard data={{ ...PLAN, state: "superseded" }} {...cardProps} />
    </Wrapper>
  );
}
