"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/chat-card` (dogfoods the registry) → auto-scanned.
import { ChatCard, ChatGroup, ChatRow } from "@/components/ui/chat-card";
import { Button } from "@/components/ui/button";

export function chatCard(): ReactNode {
  return (
    <Wrapper className="block bg-background">
      <ChatCard
        title="Send this email?"
        meta="Gmail · sm@vegastack.com"
        actions={
          <>
            <Button size="sm">Allow once</Button>
            <Button size="sm" variant="outline">
              Always…
            </Button>
            <Button size="sm" variant="ghost">
              Decline
            </Button>
          </>
        }
        footnote="William asked because emails to new people need your OK."
      >
        Weekly supplier summary to the sales team, with the comparison sheet
        attached.
      </ChatCard>
    </Wrapper>
  );
}

export function chatCardRows(): ReactNode {
  return (
    <Wrapper className="block bg-background">
      <ChatCard title="Find the suppliers" meta="2 of 4 done">
        <div className="flex flex-col gap-1">
          <ChatRow status="done" subject="Search Indian lighting makers" />
          <ChatRow status="done" subject="Open their product pages" />
          <ChatRow status="running" subject="Compare prices" />
          <ChatRow status="pending" subject="Write the summary" />
        </div>
      </ChatCard>
    </Wrapper>
  );
}

export function chatRow(): ReactNode {
  return (
    <Wrapper className="flex-col flex-nowrap items-stretch gap-1 bg-background">
      <ChatRow
        verb="Searched"
        subject="Indian lighting makers"
        meta="8 results"
        durationMs={4_200}
      />
      <ChatRow
        verb="Opened"
        subject="wipro-lighting.com/products/downlights"
        durationMs={1_800}
        href="#chat-row"
      />
      <ChatRow
        status="failed"
        verb="Read"
        subject="Quote sheet · it was moved"
        onOpen={() => {}}
      />
    </Wrapper>
  );
}

export function chatGroup(): ReactNode {
  return (
    <Wrapper className="flex-col flex-nowrap items-stretch gap-3 bg-background">
      <ChatGroup summary="Worked for 41s · searched 3 times, opened 4 sites">
        <ChatRow
          verb="Searched"
          subject="Indian lighting makers"
          meta="8 results"
        />
        <ChatRow
          verb="Opened"
          subject="wipro-lighting.com"
          durationMs={1_800}
        />
        <ChatRow verb="Opened" subject="havells.com" durationMs={2_400} />
      </ChatGroup>
      <ChatGroup summary="Searching the web · 12s" live defaultOpen>
        <ChatRow verb="Searching" subject="downlight prices 2026" />
      </ChatGroup>
    </Wrapper>
  );
}
