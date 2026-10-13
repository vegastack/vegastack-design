"use client";

import type { ReactNode } from "react";
import { CircleDashed } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/approval-card` (dogfoods the registry) → auto-scanned.
import { ApprovalCard } from "@/components/ui/approval-card";

const NOW = Date.parse("2026-10-14T12:00:00Z");
const DAY = 86_400_000;

const claude = { name: "Claude Code", kind: "agent" as const, via: "Manoj" };

const request = {
  actor: claude,
  verb: (
    <>
      wants to <strong className="font-medium">move 2 tasks to Trash</strong>
    </>
  ),
  items: [
    {
      id: "12",
      icon: <CircleDashed />,
      title: "#12 Update launch spec",
      href: "#approval-card",
      meta: "Marketing",
    },
    {
      id: "14",
      icon: <CircleDashed />,
      title: "#14 Draft copy",
      href: "#approval-card",
      meta: "Marketing",
    },
  ],
  reason: "These duplicate #10 and #11.",
  reassurance: "You can restore them from Trash for 30 days.",
  requestedAt: NOW - 2 * 60_000,
  expiresAt: NOW + 7 * DAY,
  now: NOW,
};

export function approvalCard(): ReactNode {
  // A risky action an agent asked to take, waiting on its owner: one decision for the whole request.
  return (
    <Wrapper className="flex-col items-stretch">
      <ApprovalCard
        {...request}
        className="max-w-lg"
        onApprove={() => new Promise((done) => setTimeout(done, 800))}
        onDecline={() => {}}
      />
    </Wrapper>
  );
}

export function approvalCardStates(): ReactNode {
  // The outcome replaces the buttons; someone who can't decide sees whose approval it waits for.
  return (
    <Wrapper className="flex-col items-stretch gap-3">
      <ApprovalCard
        {...request}
        status="approved"
        statusLine="Approved by you · just now"
        className="max-w-lg"
      />
      <ApprovalCard {...request} status="declined" className="max-w-lg" />
      <ApprovalCard {...request} status="expired" className="max-w-lg" />
      <ApprovalCard
        {...request}
        canDecide={false}
        moreCount={3}
        className="max-w-lg"
        onApprove={() => {}}
      />
    </Wrapper>
  );
}

export function approvalCardNarrow(): ReactNode {
  // Under 24rem the buttons stack full width, Approve on top.
  return (
    <Wrapper className="flex-col items-stretch">
      <ApprovalCard
        {...request}
        reason={undefined}
        className="max-w-80"
        onApprove={() => {}}
        onDecline={() => {}}
      />
    </Wrapper>
  );
}
