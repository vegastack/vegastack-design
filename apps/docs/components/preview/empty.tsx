"use client";

import type { ReactNode } from "react";
import { FileX, Inbox, Search, Users } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/empty` (dogfoods the registry) → auto-scanned.
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyIllustration,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";

export function emptyDemo(): ReactNode {
  return (
    <Wrapper>
      <Empty bordered className="w-full max-w-md">
        <EmptyHeader>
          <EmptyMedia>
            <Inbox />
          </EmptyMedia>
          <EmptyTitle>No messages yet</EmptyTitle>
          <EmptyDescription>
            Your inbox is empty. New messages will appear here as they arrive.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm">Compose message</Button>
        </EmptyContent>
      </Empty>
    </Wrapper>
  );
}

export function emptyDemoSizes(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      {(["sm", "default", "lg"] as const).map((size) => (
        <Empty key={size} bordered size={size} className="w-full">
          <EmptyHeader>
            <EmptyMedia>
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>No messages yet</EmptyTitle>
            <EmptyDescription>
              Density <code>{size}</code> — vertical padding scales from compact
              (in-card) to full-page.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ))}
    </Wrapper>
  );
}

export function emptyDemoSurfaces(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <Empty surface="transparent" bordered className="w-full">
        <EmptyHeader>
          <EmptyMedia>
            <Inbox />
          </EmptyMedia>
          <EmptyTitle>Transparent surface</EmptyTitle>
          <EmptyDescription>
            Inherits the parent background — pair with <code>bordered</code> for
            a drop-zone outline.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
      <Empty surface="card" className="w-full">
        <EmptyHeader>
          <EmptyMedia>
            <Inbox />
          </EmptyMedia>
          <EmptyTitle>Card surface</EmptyTitle>
          <EmptyDescription>
            Filled <code>bg-card</code> panel — a self-contained block that
            reads on any background.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </Wrapper>
  );
}

export function emptyDemoBorderless(): ReactNode {
  return (
    <Wrapper>
      <Empty className="w-full max-w-md">
        <EmptyHeader>
          <EmptyMedia>
            <Inbox />
          </EmptyMedia>
          <EmptyTitle>No messages yet</EmptyTitle>
          <EmptyDescription>
            The borderless default — no dashed outline, blends into the
            surrounding layout.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm">Compose message</Button>
        </EmptyContent>
      </Empty>
    </Wrapper>
  );
}

export function emptyDemoIconless(): ReactNode {
  return (
    <Wrapper>
      <Empty bordered className="w-full max-w-md">
        <EmptyHeader>
          <EmptyTitle>No filters applied</EmptyTitle>
          <EmptyDescription>
            A compact title-and-description empty with no icon chip and no
            actions.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </Wrapper>
  );
}

export function emptyDemoMatrix(): ReactNode {
  return (
    <Wrapper className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
      {(["transparent", "card"] as const).map((surface) =>
        (["sm", "lg"] as const).map((size) => (
          <Empty
            key={`${surface}-${size}`}
            surface={surface}
            size={size}
            bordered={surface === "transparent"}
            className="w-full"
          >
            <EmptyHeader>
              <EmptyMedia>
                <Search />
              </EmptyMedia>
              <EmptyTitle>
                {surface} · {size}
              </EmptyTitle>
              <EmptyDescription>
                surface=<code>{surface}</code> × size=<code>{size}</code>
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )),
      )}
    </Wrapper>
  );
}

export function emptyDemoIntents(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <Empty bordered className="w-full">
        <EmptyHeader>
          <EmptyMedia intent="default">
            <Users />
          </EmptyMedia>
          <EmptyTitle>No members yet</EmptyTitle>
          <EmptyDescription>
            Invite teammates to start collaborating.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm" variant="outline">
            Invite member
          </Button>
        </EmptyContent>
      </Empty>
      <Empty bordered className="w-full">
        <EmptyHeader>
          <EmptyMedia intent="info">
            <Search />
          </EmptyMedia>
          <EmptyTitle>No results found</EmptyTitle>
          <EmptyDescription>
            Try adjusting your search or filters.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm" variant="info">
            Clear filters
          </Button>
        </EmptyContent>
      </Empty>
      <Empty bordered className="w-full">
        <EmptyHeader>
          <EmptyMedia intent="destructive">
            <FileX />
          </EmptyMedia>
          <EmptyTitle>Couldn’t load records</EmptyTitle>
          <EmptyDescription>
            The request timed out. Check your connection and try again.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm" variant="destructive">
            Retry
          </Button>
        </EmptyContent>
      </Empty>
    </Wrapper>
  );
}
export function emptyIllustrations(): ReactNode {
  // The monoline drawing tier — six built-ins on a faint grid-paper ground.
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Empty size="sm" bordered>
          <EmptyHeader>
            <EmptyMedia variant="default">
              <EmptyIllustration
                name="clipboard"
                className="text-muted-foreground"
              />
            </EmptyMedia>
            <EmptyTitle>No tasks yet</EmptyTitle>
            <EmptyDescription>
              Create your first task to get started.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
        <Empty size="sm" bordered>
          <EmptyHeader>
            <EmptyMedia variant="default" className="text-destructive-text">
              <EmptyIllustration name="error" />
            </EmptyMedia>
            <EmptyTitle>No mailboxes configured</EmptyTitle>
            <EmptyDescription>
              Configure a mailbox to unlock sending.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
        <Empty size="sm" bordered>
          <EmptyHeader>
            <EmptyMedia variant="default">
              <EmptyIllustration
                name="search"
                className="text-muted-foreground"
              />
            </EmptyMedia>
            <EmptyTitle>No results</EmptyTitle>
            <EmptyDescription>Try a different query.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
      <div className="flex items-center justify-center gap-6 text-muted-foreground">
        <EmptyIllustration name="bell" className="size-16" />
        <EmptyIllustration name="box" className="size-16" />
        <EmptyIllustration name="not-found" className="size-16" />
      </div>
    </Wrapper>
  );
}
