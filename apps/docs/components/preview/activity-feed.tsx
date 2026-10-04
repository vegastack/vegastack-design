"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import {
  ActivityEvent,
  ActivityEventGroup,
  ActivityFeed,
  ActivityFeedItem,
  ActivityFeedList,
  ActivityFeedSkeleton,
  ActivityJumpToLatest,
  ActivityKindIcon,
  ActivityUnreadDivider,
  ActivityValue,
  useActivityFeedKeyboard,
  type ActivityFilter,
  type ActivityKind,
  type ActivityOrder,
} from "@/components/ui/activity-feed";
import {
  CommentComposer,
  CommentDayDivider,
  CommentThread,
  type CommentThreadData,
} from "@/components/ui/comments";
import { PriorityIcon } from "@/components/ui/priority-icon";
import { StatusIcon } from "@/components/ui/status-icon";

const NOW = Date.parse("2026-10-04T10:00:00Z");
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const ME = { name: "Asha Rao", email: "asha@acme.com", hue: "blue" as const };
const PRIYA = {
  name: "Priya Shah",
  email: "priya@acme.com",
  hue: "pink" as const,
};
const KAVYA = {
  name: "Kavya Nair",
  email: "kavya@acme.com",
  image: "/preview/avatar-2.svg",
};
const AGENT = { name: "Regent AI", email: "Assistant" };

function Demo({ children }: { children: ReactNode }) {
  return <Wrapper className="block max-w-2xl">{children}</Wrapper>;
}

/* ------------------------------------------------------------------------------------------------
 * The full task history
 * ----------------------------------------------------------------------------------------------*/

type Entry =
  | { type: "event"; id: string; at: number; node: ReactNode }
  | { type: "thread"; id: string; at: number; thread: CommentThreadData };

const THREAD_SCOPE: CommentThreadData = {
  id: "t1",
  root: {
    id: "c1",
    author: PRIYA,
    body: "Customer wants the **revised scope** before we start. Can we split the migration into two phases?",
    createdAt: NOW - DAY - 3 * HOUR,
  },
  replies: [
    {
      id: "c2",
      author: KAVYA,
      body: "Yes — phase one is the data copy, phase two the cut-over.",
      createdAt: NOW - DAY - 2 * HOUR,
    },
  ],
};

const THREAD_AGENT: CommentThreadData = {
  id: "t2",
  root: {
    id: "c3",
    author: AGENT,
    agent: true,
    body: "Summary so far: scope split into two phases, due date moved to **Oct 9**, Kavya owns phase one.",
    createdAt: NOW - 50 * MIN,
  },
  replies: [],
};

const ENTRIES: Entry[] = [
  {
    type: "event",
    id: "e1",
    at: NOW - DAY - 5 * HOUR,
    node: (
      <ActivityEvent
        actor={PRIYA}
        icon={<ActivityKindIcon kind="created" />}
        date={NOW - DAY - 5 * HOUR}
        now={NOW}
      >
        created the task
      </ActivityEvent>
    ),
  },
  {
    type: "event",
    id: "e2",
    at: NOW - DAY - 4 * HOUR,
    node: (
      <ActivityEventGroup>
        <ActivityEvent
          actor={PRIYA}
          icon={<PriorityIcon priority="high" size="xs" label="" />}
          date={NOW - DAY - 4 * HOUR}
          now={NOW}
        >
          set priority to <ActivityValue>High</ActivityValue>
        </ActivityEvent>
        <ActivityEvent
          actor={PRIYA}
          icon={<ActivityKindIcon kind="due" />}
          date={NOW - DAY - 4 * HOUR}
          now={NOW}
        >
          set the due date to <ActivityValue>Oct 7</ActivityValue>
        </ActivityEvent>
        <ActivityEvent
          actor={PRIYA}
          icon={<ActivityKindIcon kind="file-added" />}
          date={NOW - DAY - 4 * HOUR}
          now={NOW}
        >
          attached <ActivityValue>scope-v2.pdf</ActivityValue>
        </ActivityEvent>
      </ActivityEventGroup>
    ),
  },
  { type: "thread", id: "t1", at: NOW - DAY - 3 * HOUR, thread: THREAD_SCOPE },
  {
    type: "event",
    id: "e3",
    at: NOW - 3 * HOUR,
    node: (
      <ActivityEvent
        actor={PRIYA}
        icon="avatar"
        date={NOW - 3 * HOUR}
        now={NOW}
      >
        assigned <ActivityValue>Kavya Nair</ActivityValue>
      </ActivityEvent>
    ),
  },
  {
    type: "event",
    id: "e4",
    at: NOW - 2 * HOUR,
    node: (
      <ActivityEvent
        actor={KAVYA}
        icon={<StatusIcon status="progress" size="xs" label="" />}
        date={NOW - 2 * HOUR}
        now={NOW}
      >
        changed status from <ActivityValue>Todo</ActivityValue> to{" "}
        <ActivityValue>In progress</ActivityValue>
      </ActivityEvent>
    ),
  },
  {
    type: "event",
    id: "e5",
    at: NOW - HOUR,
    node: (
      <ActivityEvent
        actor={AGENT}
        agent
        icon={<ActivityKindIcon kind="due" />}
        date={NOW - HOUR}
        now={NOW}
      >
        moved the due date from <ActivityValue>Oct 7</ActivityValue> to{" "}
        <ActivityValue>Oct 9</ActivityValue>
      </ActivityEvent>
    ),
  },
  { type: "thread", id: "t2", at: NOW - 50 * MIN, thread: THREAD_AGENT },
];

/** The id of the first entry the viewer hasn't seen. */
const FIRST_UNREAD = "e5";

function FeedEntries({
  entries,
  unreadId,
}: {
  entries: Entry[];
  unreadId?: string;
}) {
  let lastDay = "";
  return entries.flatMap((entry) => {
    const rows: ReactNode[] = [];
    const day = new Date(entry.at).toDateString();
    if (day !== lastDay) {
      lastDay = day;
      rows.push(
        <ActivityFeedItem key={`day-${day}`} kind="divider">
          <CommentDayDivider date={entry.at} now={NOW} />
        </ActivityFeedItem>,
      );
    }
    if (entry.id === unreadId)
      rows.push(
        <ActivityFeedItem key="unread" kind="divider">
          <ActivityUnreadDivider />
        </ActivityFeedItem>,
      );
    rows.push(
      entry.type === "event" ? (
        <ActivityFeedItem key={entry.id}>{entry.node}</ActivityFeedItem>
      ) : (
        <ActivityFeedItem key={entry.id} kind="thread">
          <CommentThread
            thread={entry.thread}
            viewer={ME}
            onReply={() => {}}
            now={NOW}
          />
        </ActivityFeedItem>
      ),
    );
    return rows;
  });
}

function TaskHistory({
  initialFilter = "all",
  loading = false,
  empty = false,
}: {
  initialFilter?: ActivityFilter;
  loading?: boolean;
  empty?: boolean;
}) {
  const [filter, setFilter] = React.useState<ActivityFilter>(initialFilter);
  const [order, setOrder] = React.useState<ActivityOrder>("oldest");
  const ref = useActivityFeedKeyboard();
  const source = empty ? [] : ENTRIES;
  const shown = source.filter((entry) =>
    filter === "all"
      ? true
      : filter === "comments"
        ? entry.type === "thread"
        : entry.type === "event",
  );
  const sorted = order === "oldest" ? shown : [...shown].reverse();
  const threads = source.filter((entry) => entry.type === "thread").length;
  const composer = <CommentComposer onSubmit={() => {}} />;
  return (
    <ActivityFeed
      ref={ref}
      count={threads}
      filter={filter}
      onFilterChange={setFilter}
      order={order}
      onOrderChange={setOrder}
    >
      {loading ? (
        <ActivityFeedSkeleton />
      ) : (
        <>
          {/* Jump to latest sits where the latest items are: first, newest first. */}
          {order === "newest" ? (
            <ActivityJumpToLatest enabled={sorted.length > 3} />
          ) : null}
          {order === "newest" ? composer : null}
          <ActivityFeedList>
            <FeedEntries
              entries={sorted}
              unreadId={order === "oldest" ? FIRST_UNREAD : undefined}
            />
          </ActivityFeedList>
          {order === "oldest" ? composer : null}
          {order === "oldest" ? (
            <ActivityJumpToLatest enabled={sorted.length > 3} />
          ) : null}
        </>
      )}
    </ActivityFeed>
  );
}

/**
 * A task's history: events and comment threads in one list, day labels, the New line before the
 * first unread item, the composer at the end and Jump to latest while the end is off screen.
 * J / K move between items; X and Esc work on the focused one.
 */
export function activityFeed(): ReactNode {
  return (
    <Demo>
      <TaskHistory />
    </Demo>
  );
}

/** The Comments filter: only the comment threads. */
export function activityFeedComments(): ReactNode {
  return (
    <Demo>
      <TaskHistory initialFilter="comments" />
    </Demo>
  );
}

/** The Activity filter: only the events. */
export function activityFeedActivity(): ReactNode {
  return (
    <Demo>
      <TaskHistory initialFilter="activity" />
    </Demo>
  );
}

/** Loading: the skeleton under the header. */
export function activityFeedLoading(): ReactNode {
  return (
    <Demo>
      <TaskHistory loading />
    </Demo>
  );
}

/** Nothing yet: the header and the composer. */
export function activityFeedEmpty(): ReactNode {
  return (
    <Demo>
      <TaskHistory empty />
    </Demo>
  );
}

/* ------------------------------------------------------------------------------------------------
 * The parts
 * ----------------------------------------------------------------------------------------------*/

const KINDS: [ActivityKind, ReactNode][] = [
  ["created", "created the task"],
  ["edited", "edited the description"],
  [
    "renamed",
    <>
      renamed the task to <ActivityValue>Phase one: data copy</ActivityValue>
    </>,
  ],
  [
    "status",
    <>
      marked the task <ActivityValue>Done</ActivityValue>
    </>,
  ],
  [
    "priority",
    <>
      set priority to <ActivityValue>Medium</ActivityValue>
    </>,
  ],
  [
    "assigned",
    <>
      assigned <ActivityValue>Kavya Nair</ActivityValue>
    </>,
  ],
  [
    "unassigned",
    <>
      unassigned <ActivityValue>Kavya Nair</ActivityValue>
    </>,
  ],
  [
    "due",
    <>
      set the due date to <ActivityValue>Oct 9</ActivityValue>
    </>,
  ],
  [
    "moved",
    <>
      moved the task to <ActivityValue>Migrations</ActivityValue>
    </>,
  ],
  [
    "file-added",
    <>
      attached <ActivityValue>scope-v2.pdf</ActivityValue>
    </>,
  ],
  [
    "file-removed",
    <>
      removed <ActivityValue>scope-v1.pdf</ActivityValue>
    </>,
  ],
  [
    "linked",
    <>
      linked <ActivityValue>INF-212</ActivityValue>
    </>,
  ],
  [
    "unlinked",
    <>
      unlinked <ActivityValue>INF-198</ActivityValue>
    </>,
  ],
  ["commented", "commented"],
  ["archived", "archived the task"],
  ["restored", "restored the task"],
  [
    "deleted",
    <>
      deleted the subtask <ActivityValue>Draft runbook</ActivityValue>
    </>,
  ],
  ["approved", "approved the request"],
  ["rejected", "rejected the request"],
  [
    "requested",
    <>
      requested approval from <ActivityValue>Asha Rao</ActivityValue>
    </>,
  ],
];

/** Every `ActivityKindIcon` kind — muted, except approvals, which keep their colour. */
export function activityFeedKinds(): ReactNode {
  return (
    <Demo>
      <ActivityFeedList>
        {KINDS.map(([kind, text], i) => (
          <ActivityFeedItem key={kind}>
            <ActivityEvent
              actor={i % 2 ? KAVYA : PRIYA}
              icon={<ActivityKindIcon kind={kind} />}
              date={NOW - (KINDS.length - i) * 7 * MIN}
              now={NOW}
            >
              {text}
            </ActivityEvent>
          </ActivityFeedItem>
        ))}
      </ActivityFeedList>
    </Demo>
  );
}

const STATUSES = [
  ["todo", "Todo"],
  ["progress", "In progress"],
  ["blocked", "Blocked"],
  ["done", "Done"],
  ["cancelled", "Cancelled"],
] as const;
const PRIORITIES = [
  ["urgent", "Urgent"],
  ["high", "High"],
  ["medium", "Medium"],
  ["low", "Low"],
  ["none", "No priority"],
] as const;

/** Status and priority changes lead with the new value's own `StatusIcon` or `PriorityIcon`. */
export function activityFeedValues(): ReactNode {
  return (
    <Demo>
      <ActivityFeedList>
        {STATUSES.map(([status, label]) => (
          <ActivityFeedItem key={status}>
            <ActivityEvent
              actor={PRIYA}
              icon={<StatusIcon status={status} size="xs" label="" />}
              date={NOW - 30 * MIN}
              now={NOW}
            >
              changed status to <ActivityValue>{label}</ActivityValue>
            </ActivityEvent>
          </ActivityFeedItem>
        ))}
        {PRIORITIES.map(([priority, label]) => (
          <ActivityFeedItem key={priority}>
            <ActivityEvent
              actor={KAVYA}
              icon={<PriorityIcon priority={priority} size="xs" label="" />}
              date={NOW - 20 * MIN}
              now={NOW}
            >
              set priority to <ActivityValue>{label}</ActivityValue>
            </ActivityEvent>
          </ActivityFeedItem>
        ))}
      </ActivityFeedList>
    </Demo>
  );
}

function groupEvents() {
  return [
    <ActivityEvent
      key="a"
      actor={PRIYA}
      icon={<ActivityKindIcon kind="renamed" />}
      date={NOW - 12 * MIN}
      now={NOW}
    >
      renamed the task to <ActivityValue>Migrate billing data</ActivityValue>
    </ActivityEvent>,
    <ActivityEvent
      key="b"
      actor={PRIYA}
      icon={<ActivityKindIcon kind="edited" />}
      date={NOW - 11 * MIN}
      now={NOW}
    >
      edited the description
    </ActivityEvent>,
    <ActivityEvent
      key="c"
      actor={PRIYA}
      icon={<ActivityKindIcon kind="linked" />}
      date={NOW - 10 * MIN}
      now={NOW}
    >
      linked <ActivityValue>INF-212</ActivityValue>
    </ActivityEvent>,
  ];
}

/** A run of quick edits folded to the first, and the same run unfolded. */
export function activityFeedGroups(): ReactNode {
  return (
    <Demo>
      <ActivityFeedList className="gap-4">
        <ActivityFeedItem>
          <ActivityEventGroup>{groupEvents()}</ActivityEventGroup>
        </ActivityFeedItem>
        <ActivityFeedItem>
          <ActivityEventGroup defaultOpen>{groupEvents()}</ActivityEventGroup>
        </ActivityFeedItem>
      </ActivityFeedList>
    </Demo>
  );
}

/** An agent's event and comment, and a system event (no actor). */
export function activityFeedActors(): ReactNode {
  return (
    <Demo>
      <ActivityFeedList>
        <ActivityFeedItem>
          <ActivityEvent
            actor={AGENT}
            agent
            icon="avatar"
            date={NOW - 2 * HOUR}
            now={NOW}
          >
            triaged the task into <ActivityValue>Migrations</ActivityValue>
          </ActivityEvent>
        </ActivityFeedItem>
        <ActivityFeedItem kind="thread">
          <CommentThread thread={THREAD_AGENT} now={NOW} />
        </ActivityFeedItem>
        <ActivityFeedItem>
          <ActivityEvent
            actor={null}
            icon={<ActivityKindIcon kind="requested" />}
            date={NOW - 30 * MIN}
            now={NOW}
          >
            marked the task overdue
          </ActivityEvent>
        </ActivityFeedItem>
      </ActivityFeedList>
    </Demo>
  );
}
