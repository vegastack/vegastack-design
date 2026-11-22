"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/for-you-card` (dogfoods the registry) → auto-scanned.
import { AskCard } from "@/components/ui/ask-card";
import {
  ForYouCard,
  ForYouCardSkeleton,
  type ForYouCardProps,
  type ForYouState,
} from "@/components/ui/for-you-card";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { SuggestionCard } from "@/components/ui/suggestion-card";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Inbox, InboxGroup } from "@/components/ui/inbox";

const agent = (name: string) => (
  <PersonAvatar person={{ name, kind: "agent" }} size="2xs" />
);

const APPROVE: ForYouCardProps = {
  verb: "approve",
  from: { name: "Expense checker", avatar: agent("Expense checker") },
  title: "Ravi's taxi claim, ₹4,200",
  summary: "Airport run on 12 Nov. The policy caps taxis at ₹3,000.",
  facts: [
    { label: "Amount", value: "₹4,200" },
    { label: "Over policy by", value: "₹1,200", tone: "warning" },
    { label: "Receipt", value: "Attached" },
  ],
  deadline: { label: "Due today", urgent: true },
  ifNobodyAnswers: "It goes to Finance on Friday.",
  state: "open",
  options: [
    { id: "approve", label: "Approve", kind: "primary" },
    { id: "decline", label: "Decline", kind: "decline" },
    { id: "open", label: "Open claim", kind: "navigate", href: "#" },
  ],
};

function Panel({
  children,
  width = "max-w-[26rem]",
}: {
  children: ReactNode;
  width?: string;
}): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className={`flex w-full flex-col gap-3 ${width}`}>{children}</div>
    </Wrapper>
  );
}

function Live(): ReactNode {
  const [state, setState] = useState<ForYouState>("open");
  const [sending, setSending] = useState<string>();
  return (
    <ForYouCard
      {...APPROVE}
      state={state}
      sendingOptionId={sending}
      outcome={
        state === "done"
          ? { label: "Approved", actorName: "You", via: "app", at: "now" }
          : state === "declined"
            ? { label: "Declined", actorName: "You", via: "app", at: "now" }
            : undefined
      }
      onOption={async (id) => {
        setSending(id);
        setState("sending");
        await new Promise((resolve) => setTimeout(resolve, 800));
        setState(id === "approve" ? "done" : "declined");
      }}
      onSnooze={() => undefined}
      onSkip={() => setState("skipped")}
    />
  );
}

export function forYouCard(): ReactNode {
  return (
    <Panel>
      <Live />
    </Panel>
  );
}

export function forYouCardVerbs(): ReactNode {
  return (
    <Panel>
      <ForYouCard
        verb="answer"
        from={{
          name: "Donna",
          avatar: agent("Donna"),
          onBehalfOf: "Anu's Assistant",
        }}
        title="Which colour temperature for Bay 3?"
        ifNobodyAnswers="Donna keeps 4000 K."
        deadline={{ label: "Tomorrow" }}
        state="open"
        sourceBody={{
          kind: "question_form",
          questions: [
            {
              header: "Colour",
              question: "Which colour temperature for Bay 3?",
              options: [
                { label: "4000 K", description: "Matches Bay 2" },
                { label: "3000 K", description: "Warmer, as the client asked" },
              ],
            },
          ],
        }}
        onSubmitBody={async () => null}
        onSnooze={() => undefined}
      />
      <ForYouCard
        verb="approve"
        from={{ name: "Donna", avatar: agent("Donna") }}
        title="Send the weekly summary"
        ifNobodyAnswers="It won't send."
        state="open"
      >
        <AskCard
          density="inline"
          agent={{ name: "Donna", avatar: agent("Donna") }}
          action={{
            title: "Email the sales team",
            toolClass: "delete_send",
            preview: "Hi team, the weekly summary is attached.",
          }}
          state="pending"
          choices={[
            { id: "once", label: "Allow once", kind: "once" },
            { id: "decline", label: "Decline", kind: "decline" },
          ]}
          onAnswer={() => undefined}
        />
      </ForYouCard>
      <ForYouCard
        verb="suggest"
        from={{ name: "Tasks agent", avatar: agent("Tasks agent") }}
        title="3 tasks from today's stand-up"
        ifNobodyAnswers="Nothing is created."
        state="open"
        onSnooze={() => undefined}
        onFewerLikeThis={() => undefined}
      >
        <SuggestionCard
          variant="row"
          title="Create 3 tasks in Bay 3"
          actions={
            <Button size="sm" variant="secondary">
              Create 3 tasks
            </Button>
          }
        />
      </ForYouCard>
      <ForYouCard
        verb="review"
        from={{ name: "Meetings agent", avatar: agent("Meetings agent") }}
        title="Notes from Acme sync"
        summary="6 action items, 2 decisions."
        ifNobodyAnswers="The draft stays private."
        state="open"
        options={[
          { id: "open", label: "Review draft", kind: "navigate", href: "#" },
          { id: "inspect", label: "What changed", kind: "inspect" },
        ]}
        onInspect={() => undefined}
      />
      <ForYouCard
        verb="fix"
        from={{ name: "Supplier follow-ups", avatar: agent("Supplier") }}
        title="Gmail disconnected"
        summary="The agent can't send follow-ups until it reconnects."
        ifNobodyAnswers="Follow-ups pause."
        state="open"
        options={[{ id: "reconnect", label: "Reconnect", kind: "primary" }]}
      />
    </Panel>
  );
}

const OUTCOME = {
  label: "Approved",
  actorName: "Priya",
  via: "slack" as const,
  at: "14:02",
};

export function forYouCardStates(): ReactNode {
  return (
    <Panel>
      <ForYouCard {...APPROVE} state="sending" sendingOptionId="approve" />
      <ForYouCard {...APPROVE} state="submit_failed" />
      <ForYouCard {...APPROVE} state="open" offline />
      <ForYouCard {...APPROVE} state="done" outcome={OUTCOME} />
      <ForYouCard
        {...APPROVE}
        state="declined"
        outcome={{ ...OUTCOME, label: "Declined", note: "Use the bus" }}
      />
      <ForYouCard {...APPROVE} state="skipped" />
      <ForYouCard {...APPROVE} state="stale" />
      <ForYouCard {...APPROVE} state="expired" />
      <ForYouCard {...APPROVE} state="withdrawn" />
      <ForYouCard
        {...APPROVE}
        state="withdrawn"
        withdrawnReason="access_lost"
      />
      <ForYouCardSkeleton />
    </Panel>
  );
}

export function forYouCardNarrow(): ReactNode {
  return (
    <Panel width="max-w-[390px]">
      <ForYouCard
        {...APPROVE}
        title="Ravi's taxi claim for the airport run on 12 November, with a long title that wraps"
        selected
        onSnooze={() => undefined}
        onSkip={() => undefined}
      />
    </Panel>
  );
}

function RowMenu({ unread }: { unread: boolean }): ReactNode {
  return (
    <>
      <DropdownMenuItem>Archive</DropdownMenuItem>
      <DropdownMenuItem>
        {unread ? "Mark read" : "Mark unread"}
      </DropdownMenuItem>
    </>
  );
}

export function forYouCardInbox(): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className="h-[34rem] w-full max-w-[26rem] overflow-hidden rounded-card border border-border">
        <Inbox title="Inbox">
          <InboxGroup label="For you">
            <ForYouCard
              {...APPROVE}
              value="claim"
              unread
              onSnooze={() => undefined}
              menu={<RowMenu unread />}
            />
            <ForYouCard
              {...APPROVE}
              value="leave"
              verb="answer"
              title="Asha's leave on 2 December"
              summary={undefined}
              facts={undefined}
              deadline={undefined}
              state="done"
              outcome={{ ...OUTCOME, via: "app" }}
              menu={<RowMenu unread={false} />}
            />
          </InboxGroup>
        </Inbox>
      </div>
    </Wrapper>
  );
}

function CompactRow({
  value,
  ...props
}: ForYouCardProps & { value: string }): ReactNode {
  const [state, setState] = useState<ForYouState>("open");
  if (state === "done")
    return (
      <ForYouCard
        {...props}
        value={value}
        compact
        state="done"
        outcome={{ label: "Approved", actorName: null, via: null, at: "now" }}
        onUndo={() => setState("open")}
      />
    );
  return (
    <ForYouCard
      {...props}
      value={value}
      compact
      state={state}
      onOption={() => setState("done")}
      onSnooze={() => undefined}
      menuActions={[
        {
          id: "done",
          label: "Mark done",
          shortcut: "E",
          onSelect: () => setState("done"),
        },
      ]}
    />
  );
}

export function forYouCardCompact(): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className="w-full max-w-[26rem] overflow-hidden rounded-card border border-border">
        <Inbox title="Inbox">
          <InboxGroup label="Needs you">
            <CompactRow
              {...APPROVE}
              value="claim"
              why="Over the policy cap, so it needs your approval."
              time="2h"
              kindLabel="Approval"
            />
            <CompactRow
              {...APPROVE}
              value="calendar"
              verb="fix"
              title="Calendar stopped syncing"
              why="Meetings after Friday may be missing from Home."
              time="1h"
              deadline={undefined}
              kindLabel="Fix"
              options={[
                { id: "fix", label: "Reconnect", kind: "navigate", href: "#" },
              ]}
            />
          </InboxGroup>
        </Inbox>
      </div>
    </Wrapper>
  );
}
