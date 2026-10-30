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
  groupActivityRuns,
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
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
const AGENT = { name: "Claude Code", kind: "agent" as const, via: "Priya" };
const JAMIE = {
  name: "Jamie Rao",
  email: "jamie@acme.com",
  hue: "green" as const,
  badge: "Inactive",
};

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
      <ActivityEventGroup
        events={[
          {
            actor: PRIYA,
            icon: <PriorityIcon priority="high" size="xs" label="" />,
            date: NOW - DAY - 4 * HOUR,
            now: NOW,
            children: (
              <>
                set priority to <ActivityValue>High</ActivityValue>
              </>
            ),
          },
          {
            actor: PRIYA,
            icon: <ActivityKindIcon kind="due" />,
            date: NOW - DAY - 4 * HOUR,
            now: NOW,
            children: (
              <>
                set the due date to <ActivityValue>Oct 7</ActivityValue>
              </>
            ),
          },
          {
            actor: PRIYA,
            icon: <ActivityKindIcon kind="file-added" />,
            date: NOW - DAY - 4 * HOUR,
            now: NOW,
            children: (
              <>
                attached <ActivityValue>scope-v2.pdf</ActivityValue>
              </>
            ),
          },
        ]}
      />
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
  actions,
}: {
  initialFilter?: ActivityFilter;
  loading?: boolean;
  empty?: boolean;
  actions?: ReactNode;
}) {
  const [filter, setFilter] = React.useState<ActivityFilter>(initialFilter);
  const [order, setOrder] = React.useState<ActivityOrder>("oldest");
  const ref = useActivityFeedKeyboard();
  const [latest, setLatest] = React.useState<HTMLDivElement | null>(null);
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
      actions={actions}
    >
      {loading ? (
        <ActivityFeedSkeleton />
      ) : (
        <>
          {order === "newest" ? composer : null}
          <ActivityFeedList>
            {order === "newest" ? (
              <ActivityFeedItem kind="divider">
                <div
                  ref={setLatest}
                  tabIndex={-1}
                  className="h-px outline-none"
                  aria-label="Latest activity"
                />
              </ActivityFeedItem>
            ) : null}
            <FeedEntries
              entries={sorted}
              unreadId={order === "oldest" ? FIRST_UNREAD : undefined}
            />
            {order === "oldest" ? (
              <ActivityFeedItem kind="divider">
                <div
                  ref={setLatest}
                  tabIndex={-1}
                  className="h-px outline-none"
                  aria-label="Latest activity"
                />
              </ActivityFeedItem>
            ) : null}
          </ActivityFeedList>
          {order === "oldest" ? composer : null}
          <ActivityJumpToLatest target={latest} />
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

/** `actions`: an extra header control, placed before the filter menu. */
export function activityFeedActions(): ReactNode {
  return (
    <Demo>
      <TaskHistory
        actions={
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Sparkles aria-hidden />
            Summarize
          </Button>
        }
      />
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
  ["backlog", "Backlog"],
  ["todo", "Todo"],
  ["progress", "In progress"],
  ["review", "In review"],
  ["done", "Done"],
  ["canceled", "Canceled"],
  ["duplicate", "Duplicate"],
  ["triage", "Triage"],
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
    {
      actor: PRIYA,
      icon: <ActivityKindIcon kind="renamed" />,
      date: NOW - 12 * MIN,
      now: NOW,
      children: (
        <>
          renamed the task to{" "}
          <ActivityValue>Migrate billing data</ActivityValue>
        </>
      ),
    },
    {
      actor: PRIYA,
      icon: <ActivityKindIcon kind="edited" />,
      date: NOW - 11 * MIN,
      now: NOW,
      children: "edited the description",
    },
    {
      actor: PRIYA,
      icon: <ActivityKindIcon kind="linked" />,
      date: NOW - 10 * MIN,
      now: NOW,
      children: (
        <>
          linked <ActivityValue>INF-212</ActivityValue>
        </>
      ),
    },
  ];
}

/** Quick edits as one visible sentence; legacy rows can still opt into disclosure. */
export function activityFeedGroups(): ReactNode {
  return (
    <Demo>
      <ActivityFeedList className="gap-4">
        <ActivityFeedItem>
          <ActivityEventGroup events={groupEvents()} />
        </ActivityFeedItem>
        <ActivityFeedItem>
          <ActivityEventGroup defaultOpen>
            {groupEvents().map((event, index) => (
              <ActivityEvent key={index} {...event} />
            ))}
          </ActivityEventGroup>
        </ActivityFeedItem>
      </ActivityFeedList>
    </Demo>
  );
}

/** One status change of a run, as the host describes it, with the field it moved. */
function statusStep(
  from: string,
  to: string,
  minutesAgo: number,
): React.ComponentProps<typeof ActivityEvent> & {
  change: NonNullable<React.ComponentProps<typeof ActivityEvent>["change"]>;
} {
  return {
    id: `status-${to}`,
    actor: AGENT,
    icon: (
      <StatusIcon
        status={to === "In review" ? "review" : "progress"}
        size="xs"
        label=""
      />
    ),
    date: NOW - minutesAgo * MIN,
    now: NOW,
    change: { field: "status", verb: "moved it", from, to },
    children: (
      <>
        changed status from <ActivityValue>{from}</ActivityValue> to{" "}
        <ActivityValue>{to}</ActivityValue>
      </>
    ),
  };
}

/**
 * Runs: one actor's changes close together, found by `groupActivityRuns`. One field's changes read
 * as a chain; with `summarizeAt` a longer run of different changes folds into "made 3 changes".
 */
export function activityFeedRuns(): ReactNode {
  const raw = [
    statusStep("Todo", "In progress", 9),
    statusStep("In progress", "In review", 7),
    ...groupEvents().map((event, i) => ({ ...event, id: `edit-${i}` })),
  ];
  const runs = groupActivityRuns(raw, {
    actorKey: (event) => event.actor?.name,
    date: (event) => event.date,
  });
  return (
    <Demo>
      <ActivityFeedList className="gap-4">
        {runs.map((run) => (
          <ActivityFeedItem key={run[0]!.id}>
            <ActivityEventGroup events={run} summarizeAt={3} />
          </ActivityFeedItem>
        ))}
      </ActivityFeedList>
    </Demo>
  );
}

/** An agent's event and comment, an inactive person's event, and a system event (no actor). */
/**
 * A task handed to an agent: the member delegates, the agent's run reports in its status tones,
 * and its server-written steps follow — every line names the agent and whom it works for.
 */
export function activityFeedAgent(): ReactNode {
  const run: [ActivityKind, ReactNode, number][] = [
    [
      "delegated",
      <>
        delegated this to <ActivityValue>Claude Code (via Priya)</ActivityValue>
      </>,
      40,
    ],
    ["agent-queued", "picked this up", 38],
    ["agent-working", "started working", 37],
    ["agent-step", "read the task and 3 linked pages", 36],
    ["agent-step", "updated the description", 34],
    ["agent-needs-you", "needs Priya", 30],
    ["agent-done", "finished", 12],
    ["agent-failed", "stopped: hit a problem", 6],
    [
      "undelegated",
      <>
        removed <ActivityValue>Claude Code (via Priya)</ActivityValue>
      </>,
      2,
    ],
  ];
  return (
    <Demo>
      <ActivityFeedList>
        {run.map(([kind, text, minutes], i) => (
          <ActivityFeedItem key={i}>
            <ActivityEvent
              actor={
                kind === "delegated" || kind === "undelegated" ? PRIYA : AGENT
              }
              icon={<ActivityKindIcon kind={kind} />}
              date={NOW - minutes * MIN}
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

export function activityFeedActors(): ReactNode {
  return (
    <Demo>
      <ActivityFeedList>
        <ActivityFeedItem>
          <ActivityEvent
            actor={AGENT}
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
            actor={JAMIE}
            icon={<ActivityKindIcon kind="status" />}
            date={NOW - 45 * MIN}
            now={NOW}
          >
            changed status to <ActivityValue>In review</ActivityValue>
          </ActivityEvent>
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
