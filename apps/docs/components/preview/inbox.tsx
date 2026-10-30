"use client";

import { useState, type ReactNode } from "react";
import {
  FileText,
  KeyRound,
  Package,
  SquareCheck,
  TriangleAlert,
  UserRoundCheck,
} from "lucide-react";
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
  type InboxItemAction,
} from "@/components/ui/inbox";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

const NOW = Date.now();
const MIN = 60_000;

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="not-prose h-[32rem] w-full max-w-sm overflow-hidden rounded-lg border bg-background">
      {children}
    </div>
  );
}

const SANJAY = { name: "Sanjay Desai", hue: "blue" as const };
const ARJUN = { name: "Arjun Mehta", hue: "green" as const };
const ASHA = { name: "Asha Kumar", hue: "orange" as const };

/** The row ⋯ menu the host supplies. */
const rowMenu = (
  <>
    <DropdownMenuItem>Archive</DropdownMenuItem>
    <DropdownMenuItem>Mark unread</DropdownMenuItem>
    <DropdownMenuItem>Unwatch</DropdownMenuItem>
    <DropdownMenuItem>Mute this type</DropdownMenuItem>
  </>
);

/**
 * The full panel: For you · Updates · Archived, a record's updates grouped
 * into one row, a pending access request with Allow / Decline, an answered one, and J / K walking
 * the rows (the active row is the one a peek would show).
 */
export function inbox(): ReactNode {
  const [tab, setTab] = useState("for-you");
  const [read, setRead] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState<string | null>("task-39");
  const [request, setRequest] = useState<"pending" | "answered">("pending");
  const [allow, setAllow] = useState<InboxItemAction["state"]>("idle");
  const unread = (id: string) => !read[id];
  const toggle = (id: string) => () => setRead((r) => ({ ...r, [id]: !r[id] }));
  const unreadCount = ["task-39", "access-qa", "notes"].filter(unread).length;
  return (
    <Frame>
      <Inbox
        onClose={() => {}}
        actions={
          <>
            <InboxMarkAllRead
              disabled={unreadCount === 0}
              onClick={() =>
                setRead({ "task-39": true, "access-qa": true, notes: true })
              }
            />
            <InboxMenuAction>
              <DropdownMenuItem>Notification settings</DropdownMenuItem>
            </InboxMenuAction>
          </>
        }
        filters={
          <InboxFilters
            value={tab}
            onValueChange={setTab}
            tabs={[
              { value: "for-you", label: "For you", count: 2 },
              { value: "updates", label: "Updates" },
              { value: "archived", label: "Archived" },
            ]}
          />
        }
        activeId={active}
        onActiveChange={setActive}
        onOpen={setActive}
        onLoadMore={() => {}}
        hasMore={false}
      >
        <InboxGroup label="Today">
          <InboxItem
            value="task-39"
            unread={unread("task-39")}
            icon={<SquareCheck />}
            title={<InboxEmphasis>#39 Agent link RCA test</InboxEmphasis>}
            actors={[SANJAY, ARJUN]}
            count={9}
            events={[
              {
                id: "e3",
                actor: SANJAY,
                text: "commented: “Live comment 80821”",
                time: NOW - 5 * MIN,
              },
              {
                id: "e2",
                actor: ARJUN,
                text: "moved it to In review",
                time: NOW - 12 * MIN,
              },
              {
                id: "e1",
                actor: SANJAY,
                text: "renamed it",
                time: NOW - 20 * MIN,
              },
            ]}
            meta="Sanjay commented"
            time={NOW - 5 * MIN}
            href="#"
            onToggleRead={toggle("task-39")}
            menu={rowMenu}
          />
          <InboxItem
            value="access-qa"
            unread={unread("access-qa")}
            avatar={ARJUN}
            badge={<KeyRound />}
            title={
              <>
                <InboxEmphasis>Arjun</InboxEmphasis> wants access to{" "}
                <InboxEmphasis>QA plan</InboxEmphasis>
              </>
            }
            meta="Page · Can edit"
            time={NOW - 40 * MIN}
            status={request}
            answeredLabel="Granted by you · just now"
            actions={[
              {
                label: "Allow",
                variant: "primary",
                state: allow,
                onClick: () => {
                  setAllow("loading");
                  setTimeout(() => setRequest("answered"), 800);
                },
              },
              { label: "Decline", onClick: () => setRequest("answered") },
            ]}
            onToggleRead={toggle("access-qa")}
            menu={rowMenu}
          />
          <InboxItem
            value="notes"
            unread={unread("notes")}
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
            onToggleRead={toggle("notes")}
            menu={rowMenu}
          />
        </InboxGroup>
        <InboxGroup label="Earlier">
          <InboxItem
            value="access-sales"
            avatar={ASHA}
            badge={<KeyRound />}
            title={
              <>
                <InboxEmphasis>Asha</InboxEmphasis> wanted access to{" "}
                <InboxEmphasis>Sales pipeline</InboxEmphasis>
              </>
            }
            time={NOW - 5 * 24 * 60 * MIN}
            status="answered"
            answeredLabel="Granted by Sanjay · 5d"
            href="#"
            menu={rowMenu}
          />
          <InboxItem
            value="failed"
            icon={<TriangleAlert />}
            destructive
            title="Processing failed for Weekly sync"
            meta="Meeting · Try uploading the recording again"
            time={NOW - 30 * 60 * MIN}
            href="#"
            onToggleRead={() => {}}
          />
        </InboxGroup>
      </Inbox>
    </Frame>
  );
}

/** One record's updates grouped into one row: stacked actors, "9 updates" expanding to the list. */
export function inboxGrouped(): ReactNode {
  return (
    <Frame>
      <Inbox>
        <InboxGroup label="Today">
          <InboxItem
            value="task-39"
            unread
            icon={<SquareCheck />}
            title={<InboxEmphasis>#39 Agent link RCA test</InboxEmphasis>}
            actors={[SANJAY, ARJUN, ASHA, { name: "Kavya Nair" }]}
            events={[
              {
                actor: SANJAY,
                text: "commented: “Live comment 80821”",
                time: NOW - 5 * MIN,
              },
              {
                actor: ARJUN,
                text: "moved it to In review",
                time: NOW - 12 * MIN,
              },
              {
                actor: ASHA,
                text: "set the due date to Friday",
                time: NOW - 30 * MIN,
              },
              { actor: SANJAY, text: "renamed it", time: NOW - 45 * MIN },
            ]}
            meta="Sanjay commented"
            time={NOW - 5 * MIN}
            href="#"
            menu={rowMenu}
          />
          <InboxItem
            value="assigned"
            avatar={{ name: "Raj Patel", hue: "cyan" }}
            badge={<UserRoundCheck />}
            count={3}
            countLabel={(n) => `${n} tasks`}
            title={
              <>
                <InboxEmphasis>Raj</InboxEmphasis> assigned you tasks
              </>
            }
            meta="Harbor Coffee · Customer"
            time={NOW - 180 * MIN}
            href="#"
          />
        </InboxGroup>
      </Inbox>
    </Frame>
  );
}

/** The next page is loading: three skeleton rows under the list. */
export function inboxLoadingMore(): ReactNode {
  return (
    <Frame>
      <Inbox onLoadMore={() => {}} hasMore loadingMore>
        <InboxGroup label="Today">
          <InboxItem
            unread
            avatar={ASHA}
            title={
              <>
                <InboxEmphasis>Asha</InboxEmphasis> assigned you{" "}
                <InboxEmphasis>Send Skyline delivery schedule</InboxEmphasis>
              </>
            }
            meta="Skyline Tower B · Project"
            time={NOW - 2 * MIN}
            href="#"
          />
        </InboxGroup>
      </Inbox>
    </Frame>
  );
}

/** The next page failed: a ghost Try again. */
export function inboxLoadMoreError(): ReactNode {
  return (
    <Frame>
      <Inbox onLoadMore={() => {}} hasMore loadMoreError>
        <InboxGroup label="Yesterday">
          <InboxItem
            icon={<Package />}
            title="Price list export finished"
            meta="1,284 products"
            time={NOW - 26 * 60 * MIN}
            href="#"
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
      <Inbox
        filters={<InboxFilters value="for-you" onValueChange={() => {}} />}
      >
        <InboxEmpty description="New assignments and meeting updates show up here." />
      </Inbox>
    </Frame>
  );
}

/** The first page is loading. */
export function inboxLoading(): ReactNode {
  return (
    <Frame>
      <Inbox
        filters={<InboxFilters value="for-you" onValueChange={() => {}} />}
      >
        <InboxSkeleton />
      </Inbox>
    </Frame>
  );
}

/** App-defined tabs with counts. */
export function inboxFilters(): ReactNode {
  const [tab, setTab] = useState("mentions");
  return (
    <div className="w-full max-w-sm">
      <InboxFilters
        value={tab}
        onValueChange={setTab}
        tabs={[
          { value: "for-you", label: "For you", count: 4 },
          { value: "mentions", label: "Mentions", count: 2 },
          { value: "updates", label: "Updates" },
        ]}
      />
    </div>
  );
}
