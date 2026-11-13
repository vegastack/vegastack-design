"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/chat-work-log` (dogfoods the registry).
import {
  ErrorRow,
  LiveLine,
  StuckRow,
  WorkLog,
  WorkSummary,
} from "@/components/ui/chat-work-log";

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const PARTS = [
  { type: "reasoning", text: "Looking for Indian makers of LED downlights." },
  {
    type: "dynamic-tool",
    toolName: "web_search",
    toolCallId: "c1",
    state: "output-available" as const,
    input: { query: "LED downlight manufacturers India" },
    output: {},
    resultProviderMetadata: {
      vegastack: {
        verb: "Searched the web",
        subject: "“LED downlight manufacturers India”",
        meta: "12 results",
        durationMs: 2100,
      },
    },
  },
  {
    type: "dynamic-tool",
    toolName: "web_open",
    toolCallId: "c2",
    state: "output-available" as const,
    input: { url: "https://regent-lighting.in" },
    output: {},
    resultProviderMetadata: {
      vegastack: {
        verb: "Opened",
        subject: "regent-lighting.in",
        durationMs: 1800,
      },
    },
  },
  {
    type: "dynamic-tool",
    toolName: "slack_search",
    toolCallId: "c3",
    state: "output-error" as const,
    input: { query: "from:" },
    errorText: "the query was malformed",
    callProviderMetadata: {
      vegastack: { verb: "Couldn't call", subject: "Slack search" },
    },
  },
  {
    type: "dynamic-tool",
    toolName: "tasks_read",
    toolCallId: "c4",
    state: "input-available" as const,
    input: { id: 193 },
    callProviderMetadata: {
      vegastack: { verb: "Reading", subject: "task #193 · Prospect research" },
    },
  },
];

function Live() {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex w-full max-w-180 flex-col">
      <LiveLine
        words="Reading task #193"
        startedAt={ago(9_000)}
        open={open}
        onToggle={() => setOpen(!open)}
      />
      <WorkLog parts={PARTS} detail="normal" open={open} />
    </div>
  );
}

export function chatWorkLog(): ReactNode {
  return (
    <Wrapper className="items-start justify-start bg-background">
      <Live />
    </Wrapper>
  );
}

function Settled({ verbose }: { verbose?: boolean }) {
  const [open, setOpen] = useState(Boolean(verbose));
  return (
    <div className="flex w-full max-w-180 flex-col">
      <WorkSummary
        summary="Worked for 41s · searched once, opened 1 site, read 1 task · 1 call couldn't run"
        open={open}
        onToggle={() => setOpen(!open)}
      />
      <WorkLog
        parts={PARTS.slice(0, 4)}
        detail={verbose ? "verbose" : "summary"}
        open={open}
      />
    </div>
  );
}

export function chatWorkLogSettled(): ReactNode {
  return (
    <Wrapper className="items-start justify-start bg-background">
      <Settled />
    </Wrapper>
  );
}

export function chatWorkLogVerbose(): ReactNode {
  return (
    <Wrapper className="items-start justify-start bg-background">
      <Settled verbose />
    </Wrapper>
  );
}

export function chatWorkLogStuck(): ReactNode {
  return (
    <Wrapper className="items-start justify-start bg-background">
      <div className="w-full max-w-180">
        <LiveLine
          words="Running 4 Subagents"
          startedAt={ago(422_000)}
          lastEventAt={ago(40_000)}
          stuck
          waitingOn="4 Subagents"
          onStop={() => {}}
          onKeepWaiting={() => {}}
        />
      </div>
    </Wrapper>
  );
}

export function chatWorkLogNotices(): ReactNode {
  return (
    <Wrapper className="flex-col items-start justify-start bg-background">
      <ErrorRow
        words="Couldn't finish: Google refused the slide update (a table needs a cell location)."
        changed="Nothing else was changed."
        action={{ label: "Retry this step", onClick: () => {} }}
      />
      <StuckRow
        words="Paused: this workspace reached today's usage limit."
        action={{ label: "See limits", onClick: () => {} }}
      />
    </Wrapper>
  );
}
