"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/delegate-popover` (dogfoods the registry) → auto-scanned.
import { AgentSlot } from "@/components/ui/agent-panel";
import { Button } from "@/components/ui/button";
import {
  DelegatePopover,
  type DelegatePopoverAgent,
} from "@/components/ui/delegate-popover";
import {
  PropertyLabel,
  PropertyList,
  PropertyRow,
  PropertyValue,
} from "@/components/ui/property-list";

const AGENTS: DelegatePopoverAgent[] = [
  { id: "claude", name: "Claude Code", access: "Read & write · Tasks" },
  { id: "codex", name: "Codex", disabledReason: "Can't — read only" },
];

const FINISH = [
  { value: "review", label: "Move to review" },
  { value: "done", label: "Mark done" },
];

const noop = () => {};

export function delegatePopover(): ReactNode {
  // The task's Delegate property: the empty slot opens the popover; delegating fills the slot.
  const [agent, setAgent] = useState<DelegatePopoverAgent | null>(null);
  return (
    <Wrapper className="items-start">
      <PropertyList className="w-full max-w-80">
        <PropertyRow>
          <PropertyLabel>Assignee</PropertyLabel>
          <PropertyValue>Priya Raman</PropertyValue>
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel>Delegate</PropertyLabel>
          <PropertyValue>
            <DelegatePopover
              agents={AGENTS}
              defaultAgentId={agent?.id}
              whenFinishedOptions={FINISH}
              onConnect={noop}
              onDelegate={({ agentId }) =>
                setAgent(AGENTS.find((a) => a.id === agentId) ?? null)
              }
            >
              <AgentSlot agent={agent} state={agent ? "queued" : "none"} />
            </DelegatePopover>
          </PropertyValue>
        </PropertyRow>
      </PropertyList>
    </Wrapper>
  );
}

export function delegatePopoverStates(): ReactNode {
  // Rows in bulk (its own title, no When finished), no agents connected, and agents loading.
  return (
    <Wrapper>
      <DelegatePopover
        title="Delegate 40 rows to…"
        agents={AGENTS}
        onConnect={noop}
        onDelegate={noop}
      >
        <Button variant="outline" size="sm">
          Delegate 40 rows…
        </Button>
      </DelegatePopover>
      <DelegatePopover agents={[]} onConnect={noop} onDelegate={noop}>
        <Button variant="outline" size="sm">
          No agents
        </Button>
      </DelegatePopover>
      <DelegatePopover agents={[]} loading onDelegate={noop}>
        <Button variant="outline" size="sm">
          Loading
        </Button>
      </DelegatePopover>
    </Wrapper>
  );
}
