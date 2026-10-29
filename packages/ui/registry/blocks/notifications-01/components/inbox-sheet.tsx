// @vegastack notifications-01@0.25.105 sha256-W4vMUcEBxuIsg//1uN6G5w410LM1sLfb4XcLkIoh5V0=

"use client";

import * as React from "react";
import { CheckSquare, Package, TriangleAlert, UsersRound } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Inbox,
  InboxEmphasis,
  InboxEmpty,
  InboxError,
  InboxFilters,
  InboxGroup,
  InboxItem,
  InboxMarkAllRead,
  InboxMenuAction,
  InboxSkeleton,
  type InboxItemAction,
} from "@/components/ui/inbox";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAnnouncer } from "@/components/ui/use-announcer";
import { groupByDay } from "@/lib/date-time";

import type { InboxNotification } from "./sample-notifications";

/** Props for {@link InboxSheet}. */
export interface InboxSheetProps {
  /** Whether the sheet is open. */
  open: boolean;
  /** Called when the sheet asks to open or close. */
  onOpenChange: (open: boolean) => void;
  /** The loaded notifications, newest first. */
  notifications: InboxNotification[];
  /**
   * The first load is in flight.
   * @default false
   */
  loading?: boolean;
  /**
   * The first load failed: why, shown under "Couldn’t load your inbox" with "Try again".
   * @default undefined
   */
  error?: React.ReactNode;
  /**
   * Called by "Try again" after a failed load.
   * @default undefined
   */
  onRetry?: () => void;
  /** Mark every notification read. */
  onMarkAllRead: () => void;
  /** Flip one notification between read and unread. */
  onToggleRead: (id: string) => void;
  /**
   * Infinite scroll: loads the next page (15 rows) as the list nears its end.
   * @default undefined
   */
  onLoadMore?: () => void;
  /**
   * Older notifications exist; `false` ends the list on "You’re all caught up".
   * @default false
   */
  hasMore?: boolean;
  /**
   * A page is loading (three skeleton rows).
   * @default false
   */
  loadingMore?: boolean;
  /**
   * The last page failed (a ghost "Try again").
   * @default false
   */
  loadMoreError?: boolean;
  /**
   * The moment "Today" is measured from, in ms since the epoch.
   * @default now
   */
  now?: number;
}

const ICONS = {
  task: <CheckSquare />,
  meeting: <UsersRound />,
  failed: <TriangleAlert />,
  export: <Package />,
};

function Row({
  notification: n,
  onToggleRead,
}: {
  notification: InboxNotification;
  onToggleRead: () => void;
}) {
  const [decision, setDecision] =
    React.useState<InboxItemAction["state"]>("idle");
  const failed = n.kind === "failed";
  const record = <InboxEmphasis>{n.record}</InboxEmphasis>;
  const title = n.actor ? (
    <>
      <InboxEmphasis>{n.actor}</InboxEmphasis> {n.verb} {record}
    </>
  ) : (
    <>
      {n.verb} {record}
    </>
  );
  return (
    <InboxItem
      value={n.id}
      unread={n.unread}
      avatar={n.actor && !failed && !n.actors ? { name: n.actor } : undefined}
      icon={ICONS[n.kind]}
      destructive={failed}
      title={title}
      meta={n.meta}
      time={n.at}
      actors={n.actors?.map((name) => ({ name }))}
      count={n.count}
      events={n.events?.map((event) => ({
        id: event.id,
        actor: { name: event.actor },
        text: event.text,
        time: event.at,
      }))}
      href={n.href}
      onToggleRead={onToggleRead}
      menu={
        <Tooltip>
          <TooltipTrigger
            render={<DropdownMenuItem>Mute this type</DropdownMenuItem>}
          />
          <TooltipContent side="left">
            Stop notifications like this
          </TooltipContent>
        </Tooltip>
      }
      actions={
        n.decision
          ? [
              {
                label: "Approve",
                variant: "primary",
                state: decision,
                doneLabel: "Approved",
                onClick: () => {
                  setDecision("loading");
                  window.setTimeout(() => setDecision("done"), 600);
                },
              },
              { label: "Reject", onClick: () => {} },
            ]
          : undefined
      }
    />
  );
}

/**
 * The Inbox: a side `Sheet` holding the `Inbox` panel — "Mark all read" and a ⋯ menu in the
 * header, For you · Updates · Archived tabs with an Unread toggle, rows grouped by day (Today,
 * Yesterday, This week, Last week, Earlier), each row one link with an avatar or icon, an unread
 * tint, a rich title, a grouped row's actors and expandable updates, the time over its read toggle
 * and ⋯, and optional action chips; J / K walk the rows. The list pages 15 rows
 * at a time as it scrolls (skeleton rows while loading, "Try again" on failure) and ends on
 * "You’re all caught up". Loading, a failed load and both empty cases have their own
 * states, and "Marked all read" is announced once.
 *
 * @example
 * <InboxSheet open={open} onOpenChange={setOpen} notifications={items}
 *   onMarkAllRead={markAll} onToggleRead={toggle} />
 */
export function InboxSheet({
  open,
  onOpenChange,
  notifications,
  loading = false,
  error,
  onRetry,
  onMarkAllRead,
  onToggleRead,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  loadMoreError = false,
  now,
}: InboxSheetProps) {
  const [tab, setTab] = React.useState("for-you");
  const [unreadOnly, setUnreadOnly] = React.useState(false);
  const { announce, Announcer } = useAnnouncer();

  const unread = notifications.filter((n) => n.unread).length;
  // For you: what a person did to or asked of you; Updates: everything else you follow.
  const inTab = (n: InboxNotification) =>
    tab === "archived"
      ? !!n.archived
      : !n.archived && (tab === "for-you") === !!n.actor;
  const visible = notifications.filter(
    (n) => inTab(n) && (!unreadOnly || n.unread),
  );

  let body: React.ReactNode;
  if (loading) {
    body = <InboxSkeleton label="Loading inbox" />;
  } else if (error != null) {
    body = (
      <InboxError
        title="Couldn’t load your inbox"
        description={error}
        onRetry={() => onRetry?.()}
      />
    );
  } else if (visible.length === 0) {
    body = unreadOnly ? (
      <InboxEmpty title="You’re all caught up" />
    ) : tab === "archived" ? (
      <InboxEmpty
        title="Nothing archived"
        description="Archive a notification from its ⋯ menu to keep it here."
      />
    ) : (
      <InboxEmpty
        title="No notifications"
        description="Assignments and meeting updates show up here."
      />
    );
  } else {
    const days = groupByDay(visible, (n) => n.at, { now });
    body = (
      <>
        {days.map(({ key, label, items }) => (
          <InboxGroup key={key} label={label}>
            {items.map((n) => (
              <Row
                key={n.id}
                notification={n}
                onToggleRead={() => onToggleRead(n.id)}
              />
            ))}
          </InboxGroup>
        ))}
      </>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        size="default"
        showCloseButton={false}
        className="gap-0 p-0"
      >
        <Inbox
          onLoadMore={
            visible.length > 0 && !loading && error == null
              ? onLoadMore
              : undefined
          }
          hasMore={hasMore}
          loadingMore={loadingMore}
          loadMoreError={loadMoreError}
          title={<SheetTitle render={<span />}>Inbox</SheetTitle>}
          onClose={() => onOpenChange(false)}
          actions={
            <>
              {unread > 0 && !loading && error == null ? (
                <InboxMarkAllRead
                  onClick={() => {
                    onMarkAllRead();
                    announce("Marked all read");
                  }}
                />
              ) : null}
              <InboxMenuAction>
                <DropdownMenuItem>Notification settings</DropdownMenuItem>
              </InboxMenuAction>
            </>
          }
          filters={
            <InboxFilters
              value={tab}
              onValueChange={setTab}
              unreadOnly={unreadOnly}
              onUnreadOnlyChange={setUnreadOnly}
              unreadCount={unread}
            />
          }
        >
          {body}
        </Inbox>
        <Announcer />
      </SheetContent>
    </Sheet>
  );
}
