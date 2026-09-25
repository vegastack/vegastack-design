// @vegastack notifications-01@0.23.4 sha256-VsTi4gu6X9UEiZnD/3lfAZQ1kqNsEsRszngZTt2orFk=

"use client";

import * as React from "react";
import { BellOff, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemGroupLabel,
  ItemTitle,
} from "@/components/ui/item";
import { LoadMore, type LoadMoreState } from "@/components/ui/load-more";
import { NotificationDot } from "@/components/ui/notification-bell";
import { RelativeTime } from "@/components/ui/relative-time";
import {
  Sheet,
  SheetAction,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAnnouncer } from "@/components/ui/use-announcer";

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
   * The first load failed: why, shown under "Couldn’t load notifications" with "Try again".
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
  /**
   * Paging for older notifications; omit when there are none.
   * @default undefined
   */
  loadMore?: LoadMoreState;
  /**
   * The start of "Today", in ms since the epoch.
   * @default the start of the current day
   */
  todayStart?: number;
}

function Row({ notification }: { notification: InboxNotification }) {
  return (
    <Item size="sm" render={<a href={notification.href} />}>
      <ItemContent>
        <ItemTitle
          className={notification.unread ? "font-medium" : "font-normal"}
        >
          {notification.unread ? (
            <>
              <NotificationDot />
              <span className="sr-only">Unread: </span>
            </>
          ) : null}
          {notification.title}
        </ItemTitle>
        <ItemDescription className="line-clamp-2">
          {notification.body}
        </ItemDescription>
      </ItemContent>
      <RelativeTime
        date={notification.at}
        className="shrink-0 self-start text-xs text-muted-foreground"
      />
    </Item>
  );
}

/**
 * The Inbox: a right-side `Sheet` with "Mark all read" in its header, an All | Unread switch, and
 * the notifications grouped under "Today" and "Earlier" as rows that are each one link. An unread
 * row carries the dot, a heavier title and an sr-only "Unread". Loading, a failed load and both
 * empty cases have their own states, and "Marked all read" is announced once.
 *
 * @example
 * <InboxSheet open={open} onOpenChange={setOpen} notifications={items} onMarkAllRead={markAll} />
 */
export function InboxSheet({
  open,
  onOpenChange,
  notifications,
  loading = false,
  error,
  onRetry,
  onMarkAllRead,
  loadMore,
  todayStart,
}: InboxSheetProps) {
  const [show, setShow] = React.useState<"all" | "unread">("all");
  const { announce, Announcer } = useAnnouncer();
  const dayStart = React.useMemo(() => {
    if (todayStart !== undefined) return todayStart;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [todayStart]);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const visible =
    show === "unread" ? notifications.filter((n) => n.unread) : notifications;
  const groups = [
    {
      label: "Today",
      items: visible.filter((n) => Date.parse(n.at) >= dayStart),
    },
    {
      label: "Earlier",
      items: visible.filter((n) => Date.parse(n.at) < dayStart),
    },
  ];

  const ready = !loading && error == null;

  let body: React.ReactNode;
  if (loading) {
    body = (
      <div aria-busy="true" className="flex flex-col gap-3 py-2">
        <span className="sr-only">Loading notifications…</span>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-12 rounded-md" />
        ))}
      </div>
    );
  } else if (error != null) {
    body = (
      <Empty role="alert">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlert aria-hidden className="text-destructive-text" />
          </EmptyMedia>
          <EmptyTitle render={<h3 />}>Couldn’t load notifications</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    );
  } else if (visible.length === 0) {
    body = (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BellOff aria-hidden />
          </EmptyMedia>
          <EmptyTitle render={<h3 />}>
            {show === "unread" ? "You’re all caught up" : "No notifications"}
          </EmptyTitle>
          <EmptyDescription>
            {show === "unread"
              ? "New assignments and meeting updates show up here."
              : "Assignments and meeting updates show up here."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  } else {
    body = (
      <div className="flex flex-col gap-4 pb-4">
        {groups.map((group) =>
          group.items.length ? (
            <div key={group.label} className="flex flex-col gap-1">
              <ItemGroupLabel>{group.label}</ItemGroupLabel>
              <ItemGroup className="gap-1">
                {group.items.map((n) => (
                  <Row key={n.id} notification={n} />
                ))}
              </ItemGroup>
            </div>
          ) : null,
        )}
        {loadMore && show === "all" ? (
          <LoadMore label="Load older" {...loadMore} />
        ) : null}
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="default" closeLabel="Close inbox">
        <SheetHeader>
          <SheetTitle>Inbox</SheetTitle>
          <SheetAction>
            <Button
              variant="ghost"
              size="sm"
              disabled={unreadCount === 0 || !ready}
              onClick={() => {
                onMarkAllRead();
                announce("Marked all read");
              }}
            >
              Mark all read
            </Button>
          </SheetAction>
        </SheetHeader>
        <div className="px-4">
          <ToggleGroup
            variant="outline"
            size="sm"
            aria-label="Show"
            deselectable={false}
            value={[show]}
            onValueChange={(value) => {
              if (value[0]) setShow(value[0] as "all" | "unread");
            }}
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="unread">Unread</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <SheetBody>{body}</SheetBody>
        <Announcer />
      </SheetContent>
    </Sheet>
  );
}
