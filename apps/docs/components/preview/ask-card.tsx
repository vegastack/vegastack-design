"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/ask-card` (dogfoods the registry) → auto-scanned.
import {
  AskCard,
  type AskBundleItem,
  type AskChoice,
  type AskState,
} from "@/components/ui/ask-card";
import { PersonAvatar } from "@/components/ui/person-avatar";

const agent = {
  name: "Donna",
  avatar: <PersonAvatar person={{ name: "Donna", kind: "agent" }} size="xs" />,
  onBehalfOf: "Anu's Assistant",
};

const CHOICES: AskChoice[] = [
  { id: "once", label: "Allow once", kind: "once" },
  {
    id: "always:thread",
    label: "Always in this thread",
    kind: "always",
    scopeLabel: "only in this thread",
  },
  { id: "never", label: "Never", kind: "never" },
  { id: "decline", label: "Decline", kind: "decline", needsNote: true },
];

const SEND = {
  title: "Email sm@vegastack.com",
  toolClass: "delete_send" as const,
  facts: [
    { label: "To", value: "sm@vegastack.com" },
    { label: "Subject", value: "Weekly summary" },
  ],
  preview:
    "Hi team,\n\nThe weekly summary is attached: 12 tasks closed, 3 waiting on suppliers.\n\nDonna",
};

function Column({
  children,
  width = "max-w-md",
}: {
  children: ReactNode;
  width?: string;
}): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className={`flex w-full flex-col gap-4 ${width}`}>{children}</div>
    </Wrapper>
  );
}

function Live({ initial = "pending" }: { initial?: AskState }): ReactNode {
  const [state, setState] = useState<AskState>(initial);
  const [label, setLabel] = useState("");
  return (
    <AskCard
      agent={agent}
      action={SEND}
      state={state}
      choices={CHOICES}
      deadline="Until 17:00"
      ifNobodyAnswers="It won't send."
      why={{ onClick: () => undefined }}
      onAnswer={async (id) => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        const choice = CHOICES.find((c) => c.id === id)!;
        setLabel(choice.label);
        setState(
          choice.kind === "once"
            ? "allowed"
            : choice.kind === "always"
              ? "allowed_always"
              : choice.kind === "never"
                ? "blocked"
                : "declined",
        );
      }}
      answered={
        state === "pending"
          ? undefined
          : {
              choiceLabel: label,
              by: "You",
              via: "web",
              at: "now",
              undo: () => setState("pending"),
            }
      }
    />
  );
}

export function askCard(): ReactNode {
  return (
    <Column>
      <Live />
    </Column>
  );
}

const ALWAYS_MANY: AskChoice[] = [
  { id: "once", label: "Allow once", kind: "once" },
  {
    id: "always:ch",
    label: "Always in #ops",
    kind: "always",
    scopeLabel: "Posts in #ops only",
  },
  {
    id: "always:space",
    label: "Always in Bay 3",
    kind: "always",
    scopeLabel: "Anywhere in this space",
  },
  {
    id: "always:any",
    label: "Always",
    kind: "always",
    scopeLabel: "Every Slack channel it can post in",
  },
  { id: "decline", label: "Decline", kind: "decline" },
];

export function askCardChoices(): ReactNode {
  return (
    <Column>
      <AskCard
        agent={agent}
        action={{
          title: "Post in #ops",
          toolClass: "write",
          preview: "Stand-up moved to 10:30 today.",
        }}
        state="pending"
        choices={ALWAYS_MANY}
        onAnswer={() => undefined}
      />
      <AskCard
        agent={agent}
        action={{
          title: "Share “Q4 plan” with acme.com",
          toolClass: "delete_send",
        }}
        state="pending"
        choices={[
          { id: "once", label: "Allow once", kind: "once" },
          { id: "decline", label: "Decline", kind: "decline" },
        ]}
        noAlways={{
          words: "Always isn't offered for sharing outside the workspace.",
        }}
        onAnswer={() => undefined}
      />
    </Column>
  );
}

const ANSWERED = { by: "Priya", via: "slack" as const, at: "14:02" };

export function askCardStates(): ReactNode {
  return (
    <Column>
      <AskCard
        agent={agent}
        action={SEND}
        state="allowed"
        choices={CHOICES}
        answered={{ choiceLabel: "Allowed once", ...ANSWERED }}
      />
      <AskCard
        agent={agent}
        action={SEND}
        state="allowed_always"
        choices={CHOICES}
        answered={{
          choiceLabel: "Always in this thread",
          ...ANSWERED,
          undo: () => undefined,
        }}
      />
      <AskCard
        agent={agent}
        action={SEND}
        state="declined"
        choices={CHOICES}
        answered={{
          choiceLabel: "Declined",
          by: "You",
          via: "web",
          at: "09:12",
        }}
      />
      <AskCard
        agent={agent}
        action={SEND}
        state="refused"
        choices={[]}
        refusal={{
          words: "Sending outside the workspace is blocked by your admin.",
          way: { label: "Ask an admin", href: "#" },
        }}
      />
      <AskCard agent={agent} action={SEND} state="expired" choices={[]} />
      <AskCard agent={agent} action={SEND} state="stale" choices={[]} />
      <AskCard agent={agent} action={SEND} state="cancelled" choices={[]} />
    </Column>
  );
}

export function askCardHeld(): ReactNode {
  return (
    <Column>
      <AskCard agent={agent} action={SEND} state="pending" choices={CHOICES} />
      <AskCard
        agent={agent}
        action={SEND}
        state="pending"
        choices={CHOICES}
        onAnswer={() => undefined}
        offline
      />
      <AskCard
        agent={agent}
        action={SEND}
        state="pending"
        choices={CHOICES}
        onAnswer={() => undefined}
        busy
      />
    </Column>
  );
}

const ITEM_CHOICES: AskChoice[] = [
  { id: "once", label: "Allow once", kind: "once" },
  { id: "never", label: "Never", kind: "never" },
  { id: "decline", label: "Decline", kind: "decline" },
];

function bundleItems(count: number): AskBundleItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index),
    title: `Create task “Order 3000 K samples ${index + 1}”`,
    toolClass: "write" as const,
    state: (index === 0 ? "allowed" : "pending") as AskState,
    facts: [{ label: "Space", value: "Bay 3" }],
    choices: ITEM_CHOICES,
    onAnswer: () => undefined,
    answered:
      index === 0
        ? { choiceLabel: "Allowed once", by: "You", at: "now" }
        : undefined,
  }));
}

export function askCardBundle(): ReactNode {
  return (
    <Column>
      <AskCard
        agent={agent}
        action={{ title: "2 actions from one step", toolClass: "delete_send" }}
        state="pending"
        choices={[]}
        bundle={{
          items: [
            {
              id: "a",
              title: "Create task “Call Acme”",
              toolClass: "write",
              state: "pending",
              choices: ITEM_CHOICES,
              onAnswer: () => undefined,
            },
            {
              id: "b",
              title: "Email ravi@acme.com",
              toolClass: "delete_send",
              state: "pending",
              preview: "Ravi, the samples ship Friday.",
              choices: ITEM_CHOICES,
              onAnswer: () => undefined,
              busy: true,
            },
          ],
          sharedChoices: [
            { id: "once", label: "Allow all once", kind: "once" },
          ],
          onAnswerAll: () => undefined,
        }}
      />
      <AskCard
        agent={agent}
        action={{ title: "12 tasks from this meeting", toolClass: "write" }}
        state="pending"
        choices={[]}
        bundle={{
          items: bundleItems(12),
          sharedChoices: [
            { id: "once", label: "Allow all once", kind: "once" },
            { id: "decline", label: "Decline all", kind: "decline" },
          ],
          onAnswerAll: () => undefined,
        }}
      />
    </Column>
  );
}

export function askCardInline(): ReactNode {
  return (
    <Column width="max-w-[26rem]">
      <div className="rounded-card border border-border bg-card p-3">
        <AskCard
          density="inline"
          agent={agent}
          action={SEND}
          state="pending"
          choices={CHOICES}
          onAnswer={() => undefined}
        />
      </div>
    </Column>
  );
}

export function askCardNarrow(): ReactNode {
  return (
    <Column width="max-w-[390px]">
      <AskCard
        agent={agent}
        action={{
          ...SEND,
          title:
            "Email sm@vegastack.com, ravi@acme.com and the supplier list about the revised delivery dates",
        }}
        state="pending"
        choices={ALWAYS_MANY}
        onAnswer={() => undefined}
      />
    </Column>
  );
}

const RULE_WORDS: AskChoice[] = [
  { id: "once", label: "Allow once", kind: "once" },
  {
    id: "always:ch",
    label: "Always in #ops",
    kind: "always",
    scopeLabel: "Saves: Inbox helper may post in Slack in #ops without asking.",
  },
  {
    id: "always:any",
    label: "Always in Slack",
    kind: "always",
    scopeLabel:
      "Saves: Inbox helper may post in any Slack channel it can reach without asking.",
  },
  {
    id: "always:dm",
    label: "Always in DMs",
    kind: "always",
    scopeLabel: "Saves: Inbox helper may send Slack DMs without asking.",
  },
  { id: "decline", label: "Decline", kind: "decline" },
];

export function askCardReason(): ReactNode {
  return (
    <Column width="max-w-[390px]">
      <AskCard
        agent={{ ...agent, name: "Inbox helper" }}
        action={{
          title: "Post in #ops",
          toolClass: "write",
          preview: "Stand-up moved to 10:30 today.",
        }}
        reason="Auto-check asked: the channel isn't one anyone named in this chat."
        state="pending"
        choices={RULE_WORDS}
        onAnswer={() => undefined}
      />
    </Column>
  );
}
