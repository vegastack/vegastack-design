"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/chat-user-bubble` (dogfoods the registry).
import { UserBubble } from "@/components/ui/chat-user-bubble";

const LONG = [
  "there are **multiple issues** I faced in this thread:",
  "",
  "- the chat input and the `ring` are bland",
  "- plan mode toggle, model picker and effort all feel bolted on",
  "- the green checks everywhere read as AI slop — use the primary colour",
  "- Subagents hang with no word on what they wait for",
  "- long agent answers fold behind *Show more*, which I never asked for",
  "- the task list repeats what the steps line already says",
  "- answered requests stay as full cards",
  "- files open as a blank viewer",
  "- the header has two bars and a blank band",
  "- nothing moves smoothly; folds jump",
  "- errors are red boxes with no next step",
  "",
  "see the Claude Code screenshots for the bar. fix all of these at the root.",
].join("\n");

const IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112"><rect width="112" height="112" fill="slategray"/><circle cx="40" cy="44" r="14" fill="lightgray"/><path d="M0 112 L44 64 L72 92 L88 76 L112 100 L112 112Z" fill="dimgray"/></svg>',
  );

export function chatUserBubble(): ReactNode {
  return (
    <Wrapper className="items-start justify-end bg-background">
      <div className="w-full max-w-180">
        <UserBubble text={LONG} time="14:02" onEdit={() => {}} />
      </div>
    </Wrapper>
  );
}

export function chatUserBubbleFiles(): ReactNode {
  return (
    <Wrapper className="items-start justify-end bg-background">
      <div className="w-full max-w-180">
        <UserBubble
          text="Compare these two with **Regent**, and email Simran the result."
          time="14:05"
          onEdit={() => {}}
          onOpenFile={() => {}}
          files={[
            {
              url: IMAGE,
              mediaType: "image/svg+xml",
              filename: "halonix-catalogue.png",
            },
            {
              url: IMAGE,
              mediaType: "image/svg+xml",
              filename: "wipro-catalogue.png",
            },
            {
              url: "/files/brief.pdf",
              mediaType: "application/pdf",
              filename: "Prospect brief.pdf",
            },
          ]}
        />
      </div>
    </Wrapper>
  );
}
