"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/resource-pill` (dogfoods the registry) → auto-scanned.
import { ResourcePill, type ResourceRef } from "@/components/ui/resource-pill";
import { MarkdownView } from "@/components/ui/markdown-view";

const REFS: ResourceRef[] = [
  {
    kind: "meet",
    url: "https://meet.google.com/abc-defg-hij",
    title: "Weekly sync",
    meta: "Thu 15:00",
  },
  {
    kind: "doc",
    url: "https://docs.google.com/document/d/1Q3pricing",
    title: "Q3 pricing",
  },
  {
    kind: "github_pr",
    url: "https://github.com/vegastack/app/pull/1738",
    title: "Subagents finish on time",
    meta: "vegastack/app#1738",
  },
];

const byUrl = new Map(REFS.map((ref) => [ref.url, ref]));

export function resourcePill(): ReactNode {
  return (
    <Wrapper className="flex-col flex-nowrap items-stretch gap-3 bg-background">
      <MarkdownView linkResource={(href) => byUrl.get(href)}>
        {
          "The call is on [the invite](https://meet.google.com/abc-defg-hij) and the notes are in https://docs.google.com/document/d/1Q3pricing. The fix is in [#1738](https://github.com/vegastack/app/pull/1738)."
        }
      </MarkdownView>
    </Wrapper>
  );
}

export function resourcePillKinds(): ReactNode {
  const kinds: ResourceRef[] = [
    {
      kind: "doc",
      url: "https://docs.google.com/document/d/1",
      title: "Q3 pricing",
    },
    {
      kind: "sheet",
      url: "https://docs.google.com/spreadsheets/d/1",
      title: "Fixture schedule",
    },
    {
      kind: "slides",
      url: "https://docs.google.com/presentation/d/1",
      title: "Board update",
    },
    {
      kind: "drive_file",
      url: "https://drive.google.com/file/d/1",
      title: "site-photos.zip",
    },
    { kind: "meet", url: "https://meet.google.com/abc", title: "Weekly sync" },
    {
      kind: "calendar_event",
      url: "https://calendar.google.com/event?eid=1",
      title: "Site visit",
      meta: "Fri 10:00",
    },
    {
      kind: "github_pr",
      url: "https://github.com/o/r/pull/1",
      title: "Fix the task list",
    },
    {
      kind: "github_issue",
      url: "https://github.com/o/r/issues/2",
      title: "Glare on the bays",
    },
    {
      kind: "slack_message",
      url: "https://vegastack.slack.com/archives/C1/p1",
      title: "Simran in #sales",
    },
    {
      kind: "slack_channel",
      url: "https://vegastack.slack.com/archives/C1",
      title: "sales",
    },
    {
      kind: "gmail_thread",
      url: "https://mail.google.com/mail/u/0/#inbox/1",
      title: "Re: Harbour Road quote",
    },
  ];
  return (
    <Wrapper className="gap-x-3 gap-y-2 bg-background text-sm">
      {kinds.map((ref) => (
        <ResourcePill key={ref.url} data={ref} />
      ))}
    </Wrapper>
  );
}
