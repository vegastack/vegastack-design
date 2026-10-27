"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/agent-panel` (dogfoods the registry) → auto-scanned.
import {
  AgentChip,
  AgentHoverCard,
  AgentPanel,
  AgentSlot,
  AgentStateBadge,
  AgentStateRing,
  type AgentPanelEvent,
  type AgentPanelRun,
  type AgentState,
} from "@/components/ui/agent-panel";
import { PersonAvatar } from "@/components/ui/person-avatar";
import {
  PropertyLabel,
  PropertyList,
  PropertyRow,
  PropertyValue,
} from "@/components/ui/property-list";

const NOW = Date.parse("2026-10-14T10:46:00Z");
const MINUTE = 60_000;

const claude = { name: "Claude Code", via: "Priya", access: "Read & write" };
const priya = { name: "Priya Raman", hue: "blue" as const };

const latest: AgentPanelEvent[] = [
  {
    id: "m1",
    kind: "message",
    text: "Two prices conflict; using v2",
    at: NOW - 2 * MINUTE,
  },
  {
    id: "c1",
    kind: "change",
    text: "Status → In progress",
    at: NOW - 3 * MINUTE,
  },
];

const runs: AgentPanelRun[] = [
  {
    id: "r1",
    changeCount: 3,
    at: NOW - 4 * MINUTE,
    onView: () => {},
    onUndo: () => {},
  },
];

const noop = () => {};

/** The rail column a record page gives its cards. */
function Rail({ children }: { children: ReactNode }) {
  return <div className="flex w-full max-w-80 flex-col gap-3">{children}</div>;
}

export function agentPanel(): ReactNode {
  // The task page's rail card while the agent works: Stop, steer, reply, undo a run.
  const [state, setState] = useState<AgentState>("working");
  const [instructions, setInstructions] = useState(
    "Draft the proposal from M-15.",
  );
  const [events, setEvents] = useState(latest);
  return (
    <Wrapper className="items-start">
      <Rail>
        <AgentPanel
          agent={claude}
          state={state}
          now={NOW}
          startedAt={NOW - 4 * MINUTE}
          progress="Reading the 3 linked pages…"
          stoppedBy="Priya"
          finishedAt={NOW}
          changeCount={3}
          instructions={instructions}
          onInstructionsChange={setInstructions}
          latest={events}
          latestTotal={5}
          onShowAll={noop}
          onReply={(text) =>
            setEvents((list) => [
              {
                id: String(list.length + 1),
                kind: "message",
                text: `You: ${text}`,
                at: NOW,
              },
              ...list,
            ])
          }
          runs={runs}
          onViewAgent={noop}
          onChangeAgent={noop}
          onStop={() => setState("stopped")}
          onRemove={() => setState("none")}
          onDelegateAgain={() => setState("working")}
        />
        {state === "none" ? (
          <AgentSlot onClick={() => setState("working")} />
        ) : null}
      </Rail>
    </Wrapper>
  );
}

export function agentPanelStates(): ReactNode {
  // Every state of the same card (mockup §3): queued, needs you, approval, failed, blocked,
  // done, stopped — and a finished card whose agent was disconnected since.
  return (
    <Wrapper className="grid items-start justify-items-center gap-4 md:grid-cols-2 xl:grid-cols-3">
      <AgentPanel
        className="w-full max-w-80"
        agent={claude}
        state="queued"
        now={NOW}
        queuedHint
        onStop={noop}
        onRemove={noop}
      />
      <AgentPanel
        className="w-full max-w-80"
        agent={claude}
        state="question"
        now={NOW}
        question="Which price list — v2 or the client's?"
        choices={[{ value: "v2" }, { value: "client", label: "Client's" }]}
        onAnswer={noop}
        onReply={noop}
        onStop={noop}
      />
      <AgentPanel
        className="w-full max-w-80"
        agent={claude}
        state="approval"
        now={NOW}
        approval="Move 3 tasks to Trash"
        onApprove={noop}
        onDecline={noop}
      />
      <AgentPanel
        className="w-full max-w-80"
        agent={claude}
        state="failed"
        now={NOW}
        error="Couldn't open M-15 — no access."
        onRetry={noop}
        onRemove={noop}
      />
      <AgentPanel
        className="w-full max-w-80"
        agent={claude}
        state="blocked"
        now={NOW}
        blockedReason="Its token expired"
        onReconnect={noop}
        onRemove={noop}
      />
      <AgentPanel
        className="w-full max-w-80"
        agent={claude}
        state="done"
        now={NOW}
        finishedAt={NOW - 2 * 60 * MINUTE}
        durationSeconds={180}
        summary="Proposal drafted in P-42."
        onMarkDone={noop}
        runs={[
          {
            id: "r1",
            changeCount: 12,
            at: NOW - 2 * 60 * MINUTE,
            onView: noop,
            onUndo: noop,
          },
        ]}
      />
      <AgentPanel
        className="w-full max-w-80"
        agent={claude}
        state="stopped"
        now={NOW}
        stoppedBy="Priya"
        finishedAt={NOW - 24 * 60 * MINUTE}
        changeCount={12}
        onDelegateAgain={noop}
        runs={[
          {
            id: "r1",
            changeCount: 12,
            at: NOW - 24 * 60 * MINUTE,
            onView: noop,
            onUndo: noop,
            undoDisabledReason: "Edited since — undo the newer changes first",
          },
        ]}
      />
      <AgentPanel
        className="w-full max-w-80"
        agent={claude}
        state="done"
        now={NOW}
        finishedAt={NOW - 7 * 24 * 60 * MINUTE}
        durationSeconds={600}
        summary="Checked the MCP tools end to end; nothing else to do."
        disconnected
      />
    </Wrapper>
  );
}

export function agentPanelSection(): ReactNode {
  // The peek's section: the one-line summary in its header, open unless done or stopped.
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="mx-auto flex w-full max-w-160 flex-col gap-3">
        <AgentPanel
          variant="section"
          agent={claude}
          state="working"
          now={NOW}
          startedAt={NOW - 4 * MINUTE}
          progress="Reading the 3 linked pages…"
          instructions="Draft the proposal from M-15."
          onInstructionsChange={noop}
          latest={latest}
          onShowAll={noop}
          onReply={noop}
          runs={runs}
          onStop={noop}
          onViewAgent={noop}
          onRemove={noop}
        />
        <AgentPanel
          variant="section"
          agent={claude}
          state="question"
          now={NOW}
          question="Which price list — v2 or the client's?"
          choices={[{ value: "v2" }, { value: "client", label: "Client's" }]}
          onAnswer={noop}
          onReply={noop}
        />
        <AgentPanel
          variant="section"
          agent={claude}
          state="done"
          now={NOW}
          finishedAt={NOW - 2 * 60 * MINUTE}
          durationSeconds={180}
          summary="Proposal drafted in P-42."
          onMarkDone={noop}
          runs={runs}
        />
      </div>
    </Wrapper>
  );
}

export function agentPanelSlot(): ReactNode {
  // The Delegate property (one line), its empty ghost and its reason; the peek/phone pill; the
  // state marks and rings for lists and boards.
  return (
    <Wrapper className="grid items-start gap-6 md:grid-cols-2">
      <PropertyList className="w-full max-w-80">
        <PropertyRow>
          <PropertyLabel>Assignee</PropertyLabel>
          <PropertyValue>{priya.name}</PropertyValue>
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel>Delegate</PropertyLabel>
          <PropertyValue>
            <AgentSlot agent={claude} state="working" />
          </PropertyValue>
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel>Delegate</PropertyLabel>
          <PropertyValue>
            <AgentSlot />
          </PropertyValue>
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel>Delegate</PropertyLabel>
          <PropertyValue>
            <AgentSlot disabledReason="Only Priya can delegate — assign it to yourself first" />
          </PropertyValue>
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel>Delegate</PropertyLabel>
          <PropertyValue>
            <AgentSlot
              agent={{ name: "Claude Code with a long agent name" }}
              state="question"
            />
          </PropertyValue>
        </PropertyRow>
      </PropertyList>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <AgentChip agent={claude} state="working" />
          <AgentChip agent={claude} state="question" />
          <AgentChip agent={claude} state="failed" />
          <AgentChip />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {(
            [
              "queued",
              "working",
              "question",
              "failed",
              "done",
              "stopped",
            ] as const
          ).map((state) => (
            <AgentStateBadge key={state} state={state} />
          ))}
        </div>
        <div className="flex items-center gap-4">
          {(["working", "question", "failed"] as const).map((state) => (
            <span key={state} className="flex items-center gap-1">
              <PersonAvatar person={priya} />
              <AgentStateRing state={state}>
                <PersonAvatar person={{ name: "Claude Code", kind: "agent" }} />
              </AgentStateRing>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span>Hover the agent:</span>
          <AgentHoverCard agent={claude} state="working" onViewAgent={noop}>
            <PersonAvatar person={{ name: "Claude Code", kind: "agent" }} />
          </AgentHoverCard>
          <AgentHoverCard
            agent={claude}
            state="done"
            trigger="name"
            onViewAgent={noop}
          >
            Claude Code
          </AgentHoverCard>
        </div>
      </div>
    </Wrapper>
  );
}
