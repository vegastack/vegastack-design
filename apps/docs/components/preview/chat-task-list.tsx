"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/chat-task-list` (dogfoods the registry).
import {
  ChatTaskList,
  type TaskListData,
} from "@/components/ui/chat-task-list";

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const ITEMS: TaskListData["items"] = [
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
  { id: "d", text: "Write the findings into a Google Doc", status: "pending" },
  {
    id: "e",
    text: "Create 11 prospect tasks",
    status: "skipped",
    reason: "you weren't asked",
  },
];

const noop = () => {};

export function chatTaskList(): ReactNode {
  return (
    <Wrapper className="items-start justify-start bg-background">
      <ChatTaskList
        className="w-full max-w-180"
        data={{
          id: "t1",
          state: "working",
          startedAt: ago(80_000),
          items: ITEMS,
        }}
        onOpenItem={noop}
        onWhy={noop}
      />
    </Wrapper>
  );
}

export function chatTaskListStopped(): ReactNode {
  return (
    <Wrapper className="items-start justify-start bg-background">
      <ChatTaskList
        className="w-full max-w-180"
        defaultOpen
        data={{
          id: "t2",
          state: "stopped",
          reason: "Google refused the update",
          elapsedMs: 134_000,
          items: [
            {
              id: "a",
              text: "Find Indian makers similar to Regent",
              status: "completed",
            },
            {
              id: "b",
              text: "Research them with 4 Subagents",
              status: "completed",
            },
            { id: "c", text: "Check sources", status: "completed" },
            {
              id: "d",
              text: "Write the findings into a Google Doc",
              status: "failed",
              reason: "Google refused the update",
            },
            { id: "e", text: "Share the Doc with Simran", status: "pending" },
          ],
        }}
        onWhy={noop}
      />
    </Wrapper>
  );
}

export function chatTaskListDone(): ReactNode {
  return (
    <Wrapper className="items-start justify-start bg-background">
      <ChatTaskList
        className="w-full max-w-180"
        defaultOpen
        data={{
          id: "t3",
          state: "done",
          elapsedMs: 41_000,
          items: [
            { id: "a", text: "Draft the email to Simran", status: "completed" },
            {
              id: "b",
              text: "Post the summary in Slack",
              status: "skipped",
              reason: "you weren't asked",
            },
            {
              id: "c",
              text: "Create follow-up tasks",
              status: "skipped",
              reason: "you weren't asked",
            },
            {
              id: "d",
              text: "Share the Doc outside the workspace",
              status: "skipped",
              reason: "needs an admin's OK",
            },
          ],
        }}
        onWhy={noop}
      />
    </Wrapper>
  );
}
