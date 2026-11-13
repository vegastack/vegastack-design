"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/chat-message-parts` (dogfoods the registry).
import {
  MessageParts,
  type ChatMessageLike,
} from "@/components/ui/chat-message-parts";
import type { ChatDetail } from "@/components/ui/chat-work-log";
import { Button } from "@/components/ui/button";

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const words = (
  verb: string,
  subject: string,
  meta?: string,
  durationMs?: number,
) => ({
  vegastack: { verb, subject, meta, durationMs },
});

const WORK = [
  {
    type: "reasoning",
    text: "Looking for Indian makers of LED downlights that sell to the same buyers as Regent, then splitting the research so each Subagent takes a pair.",
  },
  {
    type: "dynamic-tool",
    toolName: "web_search",
    toolCallId: "w1",
    state: "output-available",
    input: { query: "LED downlight manufacturers India" },
    output: {},
    resultProviderMetadata: words(
      "Searched the web",
      "“LED downlight manufacturers India”",
      "12 results",
      2100,
    ),
  },
  {
    type: "dynamic-tool",
    toolName: "web_open",
    toolCallId: "w2",
    state: "output-available",
    input: { url: "https://regent-lighting.in" },
    output: {},
    resultProviderMetadata: words(
      "Opened",
      "regent-lighting.in",
      undefined,
      1800,
    ),
  },
  {
    type: "dynamic-tool",
    toolName: "tasks_read",
    toolCallId: "w3",
    state: "output-available",
    input: { id: 193 },
    output: {},
    resultProviderMetadata: words(
      "Read",
      "task R-193 · Prospect research",
      undefined,
      900,
    ),
  },
];

const subagent = (
  callId: string,
  title: string,
  output: Record<string, unknown>,
  state = "output-available",
) => ({
  type: "dynamic-tool",
  toolName: "subagent",
  toolCallId: callId,
  state,
  input: { title },
  output: { title, ...output },
  preliminary: output.status === "running" || output.status === "waiting",
  callProviderMetadata: { vegastack: { verb: "Researching" } },
});

const LIVE_SUBAGENTS = [
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
];

const SETTLED_SUBAGENTS = [
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

const ANSWER = `Here's what I found. **Halonix** and **Wipro Lighting** are the closest to Regent: both sell commercial downlights through distributors in the same cities.

- Hublit is consumer-first and rarely bids on projects.
- Bhagwati makes drivers, not fittings — a supplier, not a rival.

I couldn't finish Surya Roshni: its Subagent ran out of steps. Want me to retry it?`;

function liveTurn(): ChatMessageLike {
  return {
    id: "live",
    role: "assistant",
    parts: [...WORK, ...LIVE_SUBAGENTS],
    metadata: {
      turn: {
        state: "running",
        startedAt: ago(80_000),
        lastEventAt: ago(4_000),
        waitingOn: "subagents",
      },
    },
  };
}

const SETTLED_TURN: ChatMessageLike = {
  id: "settled",
  role: "assistant",
  parts: [
    ...WORK,
    ...SETTLED_SUBAGENTS,
    { type: "text", text: ANSWER, state: "done" },
  ],
  metadata: {
    turn: {
      state: "done",
      workedMs: 41_000,
      summary: "Worked for 41s · searched once, opened 1 site, read 1 task",
    },
  },
};

function DetailSwitch({
  detail,
  onChange,
}: {
  detail: ChatDetail;
  onChange: (detail: ChatDetail) => void;
}) {
  return (
    <div className="flex gap-1" role="group" aria-label="Reader setting">
      {(["summary", "normal", "verbose"] as const).map((level) => (
        <Button
          key={level}
          size="xs"
          variant={detail === level ? "secondary" : "ghost"}
          aria-pressed={detail === level}
          onClick={() => onChange(level)}
        >
          {level[0]!.toUpperCase() + level.slice(1)}
        </Button>
      ))}
    </div>
  );
}

function Turn({ live, initial }: { live: boolean; initial: ChatDetail }) {
  const [detail, setDetail] = useState<ChatDetail>(initial);
  const [message] = useState(() => (live ? liveTurn() : SETTLED_TURN));
  return (
    <div className="flex w-full max-w-180 flex-col gap-4">
      <DetailSwitch detail={detail} onChange={setDetail} />
      <MessageParts
        message={message}
        detail={detail}
        live={live}
        onOpenSubagent={() => {}}
        onOpenSubagentRequest={() => {}}
        onRetrySubagent={() => {}}
        onStop={() => {}}
      />
    </div>
  );
}

export function chatMessageParts(): ReactNode {
  return (
    <Wrapper className="items-start justify-start bg-background">
      <Turn live initial="normal" />
    </Wrapper>
  );
}

export function chatMessagePartsSettled(): ReactNode {
  return (
    <Wrapper className="items-start justify-start bg-background">
      <Turn live={false} initial="summary" />
    </Wrapper>
  );
}

export function chatMessagePartsSummary(): ReactNode {
  return (
    <Wrapper className="items-start justify-start bg-background">
      <Turn live initial="summary" />
    </Wrapper>
  );
}

export function chatMessagePartsVerbose(): ReactNode {
  return (
    <Wrapper className="items-start justify-start bg-background">
      <Turn live initial="verbose" />
    </Wrapper>
  );
}

export function chatMessagePartsTaskList(): ReactNode {
  const message: ChatMessageLike = {
    id: "tasks",
    role: "assistant",
    parts: [
      {
        type: "data-tasklist",
        id: "t1",
        data: {
          id: "t1",
          state: "working",
          startedAt: ago(80_000),
          items: [
            {
              id: "a",
              text: "Find Indian makers similar to Regent",
              status: "completed",
            },
            {
              id: "b",
              text: "Research them with 4 Subagents",
              status: "in_progress",
              running: 3,
            },
            { id: "c", text: "Check sources", status: "pending" },
            {
              id: "d",
              text: "Write the findings into a Google Doc",
              status: "pending",
            },
          ],
        },
      },
      ...WORK,
    ],
    metadata: { turn: { state: "running", startedAt: ago(80_000) } },
  };
  return (
    <Wrapper className="items-start justify-start bg-background">
      <div className="w-full max-w-180">
        <MessageParts message={message} live detail="summary" />
      </div>
    </Wrapper>
  );
}

export function chatMessagePartsError(): ReactNode {
  const message: ChatMessageLike = {
    id: "error",
    role: "assistant",
    parts: [
      ...WORK.slice(1, 2),
      {
        type: "dynamic-tool",
        toolName: "slides_update",
        toolCallId: "e1",
        state: "output-error",
        input: {},
        errorText: "a table needs a cell location",
        callProviderMetadata: words("Couldn't update", "Comparison slides"),
      },
    ],
    metadata: {
      turn: {
        state: "failed",
        summary: "Worked for 12s · searched once · 1 step couldn't finish",
        error: {
          words:
            "Couldn't finish: Google refused the slide update (a table needs a cell location).",
          changed: "Nothing else was changed.",
          retryable: true,
        },
      },
    },
  };
  return (
    <Wrapper className="items-start justify-start bg-background">
      <div className="w-full max-w-180">
        <MessageParts message={message} onRetry={() => {}} />
      </div>
    </Wrapper>
  );
}
