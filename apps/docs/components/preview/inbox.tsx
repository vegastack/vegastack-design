"use client";

import { useState, type ReactNode } from "react";
import { FileText, Package, TriangleAlert } from "lucide-react";
import {
  Inbox,
  InboxEmphasis,
  InboxEmpty,
  InboxFilters,
  InboxGroup,
  InboxItem,
  InboxMarkAllRead,
  InboxMenuAction,
  InboxSkeleton,
  type InboxFilter,
  type InboxItemAction,
} from "@/components/ui/inbox";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

const NOW = Date.now();
const MIN = 60_000;

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="not-prose h-[28rem] w-full max-w-sm overflow-hidden rounded-lg border bg-background">
      {children}
    </div>
  );
}

/** The full panel: person, system, actionable and grouped rows. */
export function inbox(): ReactNode {
  const [view, setView] = useState<InboxFilter>("all");
  const [read, setRead] = useState<Record<string, boolean>>({});
  const [decision, setDecision] = useState<InboxItemAction["state"]>("idle");
  const unread = (id: string) => !read[id];
  const toggle = (id: string) => () => setRead((r) => ({ ...r, [id]: !r[id] }));
  const unreadCount = ["a", "b", "c"].filter(unread).length;
  return (
    <Frame>
      <Inbox
        onClose={() => {}}
        actions={
          <>
            <InboxMarkAllRead
              disabled={unreadCount === 0}
              onClick={() => setRead({ a: true, b: true, c: true })}
            />
            <InboxMenuAction>
              <DropdownMenuItem>Notification settings</DropdownMenuItem>
            </InboxMenuAction>
          </>
        }
        filters={
          <InboxFilters
            value={view}
            onValueChange={setView}
            unreadCount={unreadCount}
          />
        }
        footer="You’re all caught up"
      >
        <InboxGroup label="Today">
          <InboxItem
            unread={unread("a")}
            avatar={{ name: "Asha Kumar" }}
            title={
              <>
                <InboxEmphasis>Asha</InboxEmphasis> assigned you{" "}
                <InboxEmphasis>Send Skyline delivery schedule</InboxEmphasis>
              </>
            }
            meta="Skyline Tower B · Project"
            time={NOW - 2 * MIN}
            href="#"
            onToggleRead={toggle("a")}
            menu={<DropdownMenuItem>Mute this project</DropdownMenuItem>}
            actions={[
              {
                label: "Approve",
                variant: "primary",
                state: decision,
                doneLabel: "Approved",
                onClick: () => {
                  setDecision("loading");
                  setTimeout(() => setDecision("done"), 800);
                },
              },
              { label: "Reject", onClick: () => {} },
            ]}
          />
          <InboxItem
            unread={unread("b")}
            icon={<FileText />}
            title={
              <>
                Notes ready for{" "}
                <InboxEmphasis>Lumen Build kickoff</InboxEmphasis>
              </>
            }
            meta="Meeting · 4 action items"
            time={NOW - 60 * MIN}
            href="#"
            onToggleRead={toggle("b")}
          />
          <InboxItem
            unread={unread("c")}
            avatar={{ name: "Raj Patel" }}
            count={3}
            title={
              <>
                <InboxEmphasis>Raj</InboxEmphasis> assigned you 3 tasks
              </>
            }
            meta="Harbor Coffee · Customer"
            time={NOW - 180 * MIN}
            href="#"
            onToggleRead={toggle("c")}
          />
        </InboxGroup>
        <InboxGroup label="Earlier">
          <InboxItem
            icon={<TriangleAlert />}
            destructive
            title="Processing failed for Weekly sync"
            meta="Meeting · Try uploading the recording again"
            time={NOW - 30 * 60 * MIN}
            href="#"
            onToggleRead={() => {}}
          />
          <InboxItem
            icon={<Package />}
            title="Price list export finished"
            meta="1,284 products"
            time={NOW - 50 * 60 * MIN}
            href="#"
            onToggleRead={() => {}}
          />
        </InboxGroup>
      </Inbox>
    </Frame>
  );
}

/** Nothing to show. */
export function inboxEmpty(): ReactNode {
  return (
    <Frame>
      <Inbox filters={<InboxFilters value="unread" onValueChange={() => {}} />}>
        <InboxEmpty description="New assignments and meeting updates show up here." />
      </Inbox>
    </Frame>
  );
}

/** The first page is loading. */
export function inboxLoading(): ReactNode {
  return (
    <Frame>
      <Inbox filters={<InboxFilters value="all" onValueChange={() => {}} />}>
        <InboxSkeleton />
      </Inbox>
    </Frame>
  );
}
