"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/chat-request-card` (dogfoods the registry) → auto-scanned.
import {
  ChatRequestCard,
  RequestBundleCard,
  RequestLine,
  type RequestData,
} from "@/components/ui/chat-request-card";

const answer = () => new Promise<void>((resolve) => setTimeout(resolve, 600));
const agent = { name: "William" };
const COLUMN = "flex-col flex-nowrap items-stretch gap-3 bg-background";

const EMAIL: RequestData = {
  interactionId: "i-email",
  kind: "gmail_send",
  title: "Email sm@vegastack.com",
  detail: "“Indian makers like Regent — comparison”",
  preview: { label: "Preview", href: "#chat-request-card" },
  offer: {
    choices: [
      { id: "once", label: "Allow once" },
      {
        id: "always:recipient",
        label: "Always allow",
        scope: {
          kind: "recipient",
          value: "sm@vegastack.com",
          label: "for sm@vegastack.com",
        },
      },
      {
        id: "always:domain",
        label: "Always allow",
        scope: {
          kind: "domain",
          value: "vegastack.com",
          label: "for anyone at vegastack.com",
        },
      },
      { id: "decline", label: "Decline" },
    ],
  },
  state: "open",
};

const OPEN_SITE: RequestData = {
  interactionId: "i-site",
  kind: "web_open",
  title: "Open halonix.co.in",
  offer: {
    choices: [
      { id: "once", label: "Allow once" },
      { id: "decline", label: "Decline" },
    ],
    noAlways: {
      code: "tainted",
      words:
        "This one asks each time: the link could carry text from a private page this chat read.",
    },
  },
  state: "open",
};

const site = (n: number, host: string, subagent: string): RequestData => ({
  interactionId: `i-b${n}`,
  kind: "web_open",
  title: `Open ${host}`,
  from: { subagentTitle: subagent, callId: `c${n}` },
  offer: {
    choices: [
      { id: "once", label: "Allow once" },
      {
        id: `always:site:${host}`,
        label: "Always allow",
        scope: { kind: "site", value: host, label: `for ${host}` },
      },
      { id: "decline", label: "Decline" },
    ],
    bundle: { key: "b1", count: 4 },
  },
  state: "open",
});

const BUNDLE = [
  site(1, "hublit.com", "Hublit and Halonix"),
  site(2, "halonix.co.in", "Hublit and Halonix"),
  site(3, "bhagwati.org", "Bhagwati and Instapower"),
  site(4, "instapower.com", "Bhagwati and Instapower"),
];

export function chatRequestCard(): ReactNode {
  return (
    <Wrapper className={COLUMN}>
      <ChatRequestCard agent={agent} data={EMAIL} onAnswer={answer} />
    </Wrapper>
  );
}

export function chatRequestCardOnceOnly(): ReactNode {
  return (
    <Wrapper className={COLUMN}>
      <ChatRequestCard agent={agent} data={OPEN_SITE} onAnswer={answer} />
    </Wrapper>
  );
}

export function chatRequestCardBundle(): ReactNode {
  return (
    <Wrapper className={COLUMN}>
      <RequestBundleCard
        agent={agent}
        items={BUNDLE}
        onAnswerAll={answer}
        onAnswer={answer}
      />
    </Wrapper>
  );
}

export function chatRequestCardLines(): ReactNode {
  return (
    <Wrapper className={COLUMN}>
      <RequestLine
        data={{
          ...EMAIL,
          state: "answered",
          answer: {
            choiceId: "once",
            byName: "you",
            at: "2026-11-13T10:00:00Z",
            undoable: false,
          },
        }}
      />
      <RequestLine
        data={{
          ...EMAIL,
          state: "answered",
          answer: {
            choiceId: "always:recipient",
            byName: "you",
            at: "2026-11-13T10:00:00Z",
            undoable: true,
          },
        }}
        onUndo={() => {}}
      />
      <RequestLine
        data={{
          ...EMAIL,
          interactionId: "i-share",
          kind: "drive_share",
          title: "Share “Comparison” with sm@vegastack.com",
          state: "refused",
          refusal: {
            words: "sharing outside the workspace needs an admin's OK",
            way: { label: "Ask an admin", href: "#chat-request-card" },
          },
        }}
      />
      <RequestLine data={{ ...OPEN_SITE, state: "expired" }} />
    </Wrapper>
  );
}
