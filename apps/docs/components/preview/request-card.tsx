"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/request-card` (dogfoods the registry) → auto-scanned.
import {
  PermissionList,
  RequestCard,
  type CardSpec,
  type CardState,
  type PermissionView,
} from "@/components/ui/request-card";

const agent = { id: "a1", name: "Inbox assistant", avatar: null };
const channel = "#vegastack-agent-tests";

const spec: CardSpec = {
  agent,
  title: `Inbox assistant wants to post in ${channel}`,
  why: "It read an email from devcheck-tester@vegastack.com in this run, so it checks with you first.",
  preview: {
    kind: "quote",
    text: "New email from Devcheck Tester: Friday demo time? I drafted a reply in your Drafts.",
  },
  from: "From the 09:46 run · asked 2 min ago",
  answers: {
    once: true,
    always: [
      {
        scope: "exact",
        place: { kind: "slack_channel", id: "C1", label: channel },
        label: `Always allow in ${channel}`,
      },
      {
        scope: "wider",
        place: { kind: "audience", id: "slack", label: "Slack" },
        label: "Always allow in any of its Slack channels",
      },
      {
        scope: "chat",
        place: { kind: "chat", id: "s1", label: "this chat" },
        label: "Allow for this chat",
      },
    ],
    decline: true,
    never: true,
  },
  footnote:
    "Always also covers runs that read email. Undo any time in What I've allowed.",
  nudge: null,
  hard: false,
};

const hard: CardSpec = {
  ...spec,
  title: "Inbox assistant wants to email priya@acme.com",
  why: "It read an email from outside the company in this run, so it asks every time.",
  preview: { kind: "recipients", items: ["priya@acme.com"] },
  answers: { once: true, always: null, decline: true, never: false },
  footnote: null,
  hard: true,
};

const quiet = () => new Promise<void>((done) => setTimeout(done, 800));

/** A live card: answering settles it in place. */
function Live({
  initial = spec,
  compact,
}: {
  initial?: CardSpec;
  compact?: boolean;
}) {
  const [state, setState] = useState<CardState>("pending");
  const [busy, setBusy] = useState(false);
  const answer = (next: CardState) => () => {
    setBusy(true);
    void quiet().then(() => {
      setBusy(false);
      setState(next);
    });
  };
  return (
    <RequestCard
      spec={initial}
      state={state}
      answeredBy="you"
      busy={busy}
      compact={compact}
      onAllowOnce={answer("allowed_once")}
      onAlways={answer("allowed_always")}
      onDecline={answer("declined")}
      onNever={answer("never")}
      onRevoke={() => setState("pending")}
      className="max-w-xl"
    />
  );
}

export function requestCard(): ReactNode {
  // One card for every request: Allow once · Always allow ▾ · Decline ▾.
  return (
    <Wrapper className="flex-col items-stretch">
      <Live />
    </Wrapper>
  );
}

export function requestCardBundle(): ReactNode {
  // One run asks two things: one card, answered together or one by one.
  return (
    <Wrapper className="flex-col items-stretch">
      <RequestCard
        spec={{
          ...spec,
          title: "Inbox assistant wants to (09:46 run):",
          why: null,
          preview: null,
          footnote: null,
        }}
        state="pending"
        bundle={{
          items: [
            { title: "post in #ops", place: "Slack" },
            { title: "save “Weekly digest.pdf”", place: "Ops / Reports" },
          ],
        }}
        onAllowOnce={() => {}}
        onAlways={() => {}}
        onReviewEach={() => {}}
        onDecline={() => {}}
        className="max-w-xl"
      />
    </Wrapper>
  );
}

export function requestCardHard(): ReactNode {
  // A hard rule: Allow once and Decline only, everywhere.
  return (
    <Wrapper className="flex-col items-stretch">
      <Live initial={hard} />
    </Wrapper>
  );
}

export function requestCardNudge(): ReactNode {
  // After three Allow once answers to the same thing, the card offers Always first.
  return (
    <Wrapper className="flex-col items-stretch">
      <Live
        initial={{
          ...spec,
          nudge: "You've allowed this 3 times. Always allow?",
        }}
      />
    </Wrapper>
  );
}

export function requestCardPreviews(): ReactNode {
  // What it would do: records with their places, a file, or from → to.
  return (
    <Wrapper className="flex-col items-stretch gap-3">
      <RequestCard
        spec={{
          ...spec,
          title: "Inbox assistant wants to move 2 tasks to Ops",
          why: "Moving takes their linked items along.",
          preview: {
            kind: "items",
            items: [
              { title: "#12 Update launch spec", place: "Marketing" },
              { title: "#14 Draft copy", place: "Marketing" },
            ],
            more: 3,
          },
          footnote: null,
        }}
        state="pending"
        onAllowOnce={() => {}}
        onAlways={() => {}}
        onDecline={() => {}}
        className="max-w-xl"
      />
      <RequestCard
        spec={{
          ...spec,
          title: "Inbox assistant wants to save a file to Ops / Reports",
          why: null,
          preview: {
            kind: "file",
            name: "Weekly digest.pdf",
            place: "Ops / Reports",
          },
          footnote: null,
        }}
        state="pending"
        onAllowOnce={() => {}}
        onAlways={() => {}}
        onDecline={() => {}}
        className="max-w-xl"
      />
      <RequestCard
        spec={{
          ...spec,
          title: "Inbox assistant wants to share what it read more widely",
          why: "It read a private space in this run.",
          preview: {
            kind: "from_to",
            from: "Leadership (private)",
            to: "#ops",
          },
          footnote: null,
        }}
        state="pending"
        onAllowOnce={() => {}}
        onAlways={() => {}}
        onDecline={() => {}}
        className="max-w-xl"
      />
    </Wrapper>
  );
}

export function requestCardStates(): ReactNode {
  // Answered, the buttons give way to one line in the same words on every channel.
  const states: { state: CardState; by?: string; via?: "slack" | "phone" }[] = [
    { state: "allowed_once", by: "Priya", via: "slack" },
    { state: "allowed_always", by: "you" },
    { state: "declined", by: "Priya", via: "phone" },
    { state: "never", by: "you" },
    { state: "skipped" },
    { state: "expired" },
    { state: "refused" },
    { state: "withdrawn" },
    { state: "cancelled" },
  ];
  return (
    <Wrapper className="flex-col items-stretch gap-3">
      {states.map(({ state, by, via }) => (
        <RequestCard
          key={state}
          spec={spec}
          state={state}
          answeredBy={by}
          answeredVia={via}
          onRevoke={() => {}}
          onDoItNow={() => {}}
          compact
          className="max-w-xl"
        />
      ))}
      <RequestCard
        spec={spec}
        state="pending"
        canAnswer={false}
        waitingFor="Manoj"
        className="max-w-xl"
      />
    </Wrapper>
  );
}

export function requestCardCompact(): ReactNode {
  // One row for Home and Inbox: the title, where it came from, a send's words and the buttons.
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="flex w-full max-w-2xl flex-col divide-y divide-border rounded-lg border border-border px-3">
        <Live compact />
        <RequestCard
          spec={{ ...spec, title: "Inbox assistant wants to (09:46 run):" }}
          bundle={{
            items: [
              { title: "post in #ops", place: "Slack" },
              { title: "save “Weekly digest.pdf”", place: "Ops / Reports" },
            ],
          }}
          state="pending"
          compact
          onAllowOnce={() => {}}
          onReviewEach={() => {}}
          onDecline={() => {}}
        />
        <RequestCard
          spec={hard}
          state="pending"
          compact
          onAllowOnce={() => {}}
          onDecline={() => {}}
        />
        <RequestCard
          // A long send keeps its words in the row; they scroll inside their own box.
          spec={{
            ...spec,
            title: "Inbox assistant wants to email priya@acme.com",
            preview: {
              kind: "quote",
              text: Array.from(
                { length: 8 },
                (_, i) =>
                  `Line ${i + 1}: the Friday demo moves to 3 pm, and the deck is in Ops / Reports.`,
              ).join("\n"),
            },
          }}
          state="pending"
          compact
          onAllowOnce={() => {}}
          onDecline={() => {}}
        />
      </div>
    </Wrapper>
  );
}

export function requestCardNarrow(): ReactNode {
  // Under 28rem the buttons stack full width.
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="w-full max-w-90">
        <Live />
      </div>
    </Wrapper>
  );
}

const allowed: PermissionView[] = [
  {
    id: "p1",
    effect: "allow",
    title: `Post in ${channel}`,
    note: "also after email",
    uses: 14,
    lastUsed: "2 h ago",
  },
  {
    id: "p2",
    effect: "allow",
    title: "Save files to My space / Inbox notes",
    uses: 3,
    lastUsed: "Mon",
  },
  {
    id: "p3",
    effect: "allow",
    title: "Open docs.google.com",
    uses: 0,
    paused: "Paused by a rule",
  },
  {
    id: "p4",
    effect: "allow",
    title: "Post in #sales",
    uses: 2,
    lastUsed: "9 Nov",
    paused: "Paused: Ravi is no longer a maintainer",
    confirmable: true,
  },
];

const never: PermissionView[] = [
  {
    id: "n1",
    effect: "never",
    title: "Email anyone outside vegastack.com",
    setOn: "10 Nov",
  },
];

export function permissionList(): ReactNode {
  // What I've allowed: uses, when last used, Revoke; Never lines with Undo.
  const [items, setItems] = useState(allowed);
  const [nevers, setNevers] = useState(never);
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <PermissionList
          title="Allowed"
          items={items}
          onRevoke={(id) => setItems((xs) => xs.filter((x) => x.id !== id))}
          onConfirm={(id) =>
            setItems((xs) =>
              xs.map((x) =>
                x.id === id ? { ...x, paused: null, confirmable: false } : x,
              ),
            )
          }
          empty="Nothing always allowed yet."
        />
        <PermissionList
          title="Never"
          items={nevers}
          onRevoke={(id) => setNevers((xs) => xs.filter((x) => x.id !== id))}
          empty="Nothing set to never."
        />
        <PermissionList
          title="Across agents"
          items={[{ ...allowed[0]!, id: "x1", agent }]}
          onRevoke={() => {}}
        />
      </div>
    </Wrapper>
  );
}
