"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/board` (dogfoods the registry) → auto-scanned.
import { Board, type BoardColumn } from "@/components/ui/board";
import { BoardCard, BoardCardChip } from "@/components/ui/board-card";
import { Button } from "@/components/ui/button";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { StatusIcon } from "@/components/ui/status-icon";
import { CalendarDays, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Deal {
  id: string;
  name: string;
  amount: string;
  owner: string;
}

const INITIAL: BoardColumn<Deal>[] = [
  {
    id: "qualified",
    title: "Qualified",
    items: [
      { id: "d1", name: "Acme renewal", amount: "$12,400", owner: "PS" },
      { id: "d2", name: "Globex expansion", amount: "$48,000", owner: "MK" },
    ],
  },
  {
    id: "proposal",
    title: "Proposal",
    items: [{ id: "d3", name: "Initech pilot", amount: "$9,800", owner: "AL" }],
  },
  { id: "won", title: "Won", items: [] },
  {
    id: "lost",
    title: "Lost",
    items: [
      { id: "d4", name: "Umbrella lapse", amount: "$3,100", owner: "PS" },
    ],
    droppable: false,
    lockedReason: "Lost deals move by automation",
    defaultCollapsed: true,
  },
];

const OWNERS: Record<string, string> = {
  PS: "Priya Shah",
  MK: "Manoj Kumar",
  AL: "Alex Lee",
};

/** A deal or task as the standard card content. */
function dealCard(deal: Deal): ReactNode {
  return (
    <BoardCard
      surface={false}
      title={deal.name}
      context={deal.amount}
      assignee={OWNERS[deal.owner] ? { name: OWNERS[deal.owner]! } : undefined}
    />
  );
}

function applyMove(
  prev: BoardColumn<Deal>[],
  id: string,
  container: string,
  index: number,
): BoardColumn<Deal>[] {
  const moved = prev.flatMap((c) => c.items).find((d) => d.id === id);
  if (!moved) return prev;
  return prev.map((column) => {
    const without = column.items.filter((d) => d.id !== id);
    if (column.id !== container) return { ...column, items: without };
    const next = [...without];
    next.splice(index, 0, moved);
    return { ...column, items: next };
  });
}

export function board(): ReactNode {
  const [columns, setColumns] = useState(INITIAL);
  return (
    <Wrapper className="block">
      <Board<Deal>
        height="26rem"
        aria-label="Deals"
        columns={columns}
        getItemId={(deal) => deal.id}
        getItemLabel={(deal) => deal.name}
        renderCard={dealCard}
        onMove={({ id, to }) =>
          setColumns((prev) => applyMove(prev, id, to.container, to.index))
        }
      />
    </Wrapper>
  );
}

export function boardGated(): ReactNode {
  const [columns, setColumns] = useState<BoardColumn<Deal>[]>([
    {
      id: "open",
      title: "Open",
      items: [
        { id: "g1", name: "Northwind upsell", amount: "$22,000", owner: "MK" },
      ],
    },
    { id: "review", title: "In review", items: [] },
  ]);
  return (
    <Wrapper className="block">
      <Board<Deal>
        height="26rem"
        aria-label="Gated pipeline (the server rejects every move)"
        columns={columns}
        getItemId={(deal) => deal.id}
        renderCard={dealCard}
        onMove={() =>
          new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error("stage gate")), 800),
          )
        }
      />
    </Wrapper>
  );
}

/**
 * Locked lanes, the keyboard move path, and `columnMaxHeight`. "Archive" is
 * `droppable: false` with a `lockedReason`, so it renders as an inert drop
 * target that says why; every card's "Move card" menu is the lossless keyboard
 * and assistive-tech equivalent of a drag, and it stays available for lanes the
 * pointer path refuses. `columnMaxHeight` caps the scrolling card list — the
 * default is the shared overlay ceiling token, but a board inside a shorter
 * shell passes its own length rather than the component assuming a viewport
 * reservation (audit B8-06).
 */
export function boardLanes(): ReactNode {
  const [columns, setColumns] = useState<BoardColumn<Deal>[]>([
    {
      id: "active",
      title: "Active",
      items: [
        { id: "l1", name: "Acme renewal", amount: "$12,400", owner: "PS" },
        { id: "l2", name: "Globex expansion", amount: "$48,000", owner: "MK" },
        { id: "l3", name: "Initech pilot", amount: "$9,800", owner: "AL" },
        { id: "l4", name: "Umbrella retainer", amount: "$3,100", owner: "PS" },
      ],
    },
    { id: "hold", title: "On hold", items: [] },
    {
      id: "archive",
      title: "Archive",
      items: [
        { id: "l5", name: "Soylent lapse", amount: "$1,200", owner: "AL" },
      ],
      droppable: false,
      lockedReason: "Archived deals move by automation",
    },
  ]);
  return (
    <Wrapper className="block">
      <Board<Deal>
        height="auto"
        aria-label="Pipeline with a locked lane"
        columns={columns}
        columnMaxHeight="14rem"
        getItemId={(deal) => deal.id}
        renderCard={dealCard}
        onMove={({ id, to }) =>
          setColumns((prev) => applyMove(prev, id, to.container, to.index))
        }
      />
    </Wrapper>
  );
}

/**
 * Lane and card labels. A lane whose `title` is a node (here a `Badge`) passes a plain-text
 * `label`, which names the lane's card list ("Blocked, 1 card"), its "Move to…" menu entry and
 * every announcement. `getItemLabel` names each card's menu control ("Move Token audit") and the
 * card in announcements.
 */
export function boardLabels(): ReactNode {
  const [columns, setColumns] = useState<BoardColumn<Deal>[]>([
    {
      id: "todo",
      title: "To do",
      items: [
        { id: "b1", name: "Token audit", amount: "2d", owner: "PS" },
        { id: "b2", name: "Menu copy pass", amount: "1d", owner: "MK" },
      ],
    },
    {
      id: "blocked",
      title: <Badge variant="destructive">Blocked</Badge>,
      label: "Blocked",
      items: [{ id: "b3", name: "Invoice export", amount: "3d", owner: "AL" }],
    },
    { id: "done", title: "Done", items: [] },
  ]);
  return (
    <Wrapper className="block">
      <Board<Deal>
        height="26rem"
        aria-label="Sprint"
        columns={columns}
        getItemId={(task) => task.id}
        getItemLabel={(task) => task.name}
        renderCard={dealCard}
        onMove={({ id, to }) =>
          setColumns((prev) => applyMove(prev, id, to.container, to.index))
        }
      />
    </Wrapper>
  );
}

/**
 * Lane states. `count` is the lane's total when it has loaded only some cards — the muted count
 * and the lane's name ("Open, 14 tasks", through `countLabel`) use it. `loading` shows skeleton
 * cards and marks the lane `aria-busy`; `emptyState` replaces the default "No cards" drop target;
 * `defaultCollapsed` starts a terminal lane as a strip that expands read-only.
 */
export function boardLaneStates(): ReactNode {
  const [columns, setColumns] = useState<BoardColumn<Deal>[]>([
    {
      id: "open",
      title: "Open",
      count: 14,
      items: [
        { id: "s1", name: "Token audit", amount: "2d", owner: "PS" },
        { id: "s2", name: "Menu copy pass", amount: "1d", owner: "MK" },
      ],
    },
    { id: "review", title: "In review", items: [], loading: true },
    {
      id: "blocked",
      title: "Blocked",
      items: [],
      empty: {
        title: "Nothing blocked",
        description: "Move a task here when it waits on someone",
      },
    },
    {
      id: "done",
      title: "Done",
      count: 128,
      items: [{ id: "s3", name: "Invoice export", amount: "3d", owner: "AL" }],
      defaultCollapsed: true,
    },
  ]);
  return (
    <Wrapper className="block">
      <Board<Deal>
        height="26rem"
        aria-label="Sprint tasks"
        columns={columns}
        countLabel={(n) => `${n} ${n === 1 ? "task" : "tasks"}`}
        getItemId={(task) => task.id}
        getItemLabel={(task) => task.name}
        renderCard={dealCard}
        onMove={({ id, to }) =>
          setColumns((prev) => applyMove(prev, id, to.container, to.index))
        }
      />
    </Wrapper>
  );
}

/**
 * Cards as links. `getItemHref` makes each card a real link: a click follows it, and a
 * Cmd/Ctrl/Shift or middle click opens it the way the browser always does. Space still lifts the
 * card into move mode, and its ⋯ menu stays a separate control beside the link. Pass
 * `itemLinkRender={<Link />}` to render your router's link.
 */
export function boardLinks(): ReactNode {
  const [columns, setColumns] = useState<BoardColumn<Deal>[]>([
    {
      id: "todo",
      title: "To do",
      items: [
        { id: "k1", name: "Token audit", amount: "2d", owner: "PS" },
        { id: "k2", name: "Menu copy pass", amount: "1d", owner: "MK" },
      ],
    },
    {
      id: "doing",
      title: "Doing",
      items: [{ id: "k3", name: "Invoice export", amount: "3d", owner: "AL" }],
    },
  ]);
  return (
    <Wrapper className="block">
      <Board<Deal>
        height="26rem"
        aria-label="Linked tasks"
        columns={columns}
        getItemId={(task) => task.id}
        getItemLabel={(task) => task.name}
        getItemHref={(task) => `?task=${task.id}`}
        renderCard={dealCard}
        onMove={({ id, to }) =>
          setColumns((prev) => applyMove(prev, id, to.container, to.index))
        }
      />
    </Wrapper>
  );
}

export function boardPagedLanes(): ReactNode {
  const [columns, setColumns] = useState<BoardColumn<Deal>[]>(() =>
    INITIAL.slice(0, 2).map((column) =>
      column.id === "qualified"
        ? { ...column, items: column.items.slice(0, 1) }
        : column,
    ),
  );
  const [loading, setLoading] = useState(false);
  const qualified = INITIAL[0]!.items;
  return (
    <Wrapper className="block">
      <Board<Deal>
        height="26rem"
        aria-label="Deals with paged lanes and card actions"
        columns={columns.map((column) =>
          column.id === "qualified"
            ? {
                ...column,
                loadMore: {
                  hasMore: column.items.length < qualified.length,
                  loading,
                  onLoadMore: () => {
                    setLoading(true);
                    setTimeout(() => {
                      setColumns((prev) =>
                        prev.map((c) =>
                          c.id === "qualified" ? { ...c, items: qualified } : c,
                        ),
                      );
                      setLoading(false);
                    }, 600);
                  },
                },
              }
            : column,
        )}
        getItemId={(deal) => deal.id}
        getItemLabel={(deal) => deal.name}
        getItemActions={(deal) => [
          { label: "Open deal", render: <a href={`#${deal.id}`} /> },
          { label: "Archive", destructive: true, onSelect: () => {} },
        ]}
        renderCard={dealCard}
        onMove={({ id, to }) =>
          setColumns((prev) => applyMove(prev, id, to.container, to.index))
        }
      />
    </Wrapper>
  );
}

interface Task {
  id: string;
  title: string;
  context: string;
  due: number;
  priority?: "urgent" | "high" | "medium" | "low";
  owner: string;
  meeting?: boolean;
  done?: boolean;
}

const DAY = 86_400_000;
const TASKS: BoardColumn<Task>[] = [
  {
    id: "todo",
    title: "To do",
    items: [
      {
        id: "t1",
        title: "Send the revised lighting schedule",
        context: "Harbour Tower · Acme Build",
        due: -2,
        priority: "urgent",
        owner: "PS",
        meeting: true,
      },
      {
        id: "t2",
        title: "Confirm the fixture count for level 3",
        context: "Harbour Tower · Acme Build",
        due: 0,
        priority: "high",
        owner: "MK",
      },
      {
        id: "t3",
        title: "Book the site visit",
        context: "Riverside · Northwind",
        due: 5,
        owner: "AL",
      },
    ],
  },
  {
    id: "doing",
    title: "In progress",
    items: [
      {
        id: "t4",
        title: "Draft the quote for the lobby pendants",
        context: "Riverside · Northwind",
        due: 1,
        priority: "medium",
        owner: "PS",
      },
    ],
  },
  { id: "review", title: "In review", items: [] },
  {
    id: "done",
    title: "Done",
    items: [
      {
        id: "t5",
        title: "Share the photometric report",
        context: "Harbour Tower · Acme Build",
        due: -4,
        owner: "AL",
        done: true,
      },
    ],
  },
];

function taskCard(task: Task): ReactNode {
  return (
    <BoardCard
      surface={false}
      title={task.title}
      context={task.context}
      done={task.done ?? false}
      due={new Date(Date.now() + task.due * DAY)}
      priority={task.priority}
      assignee={{ name: OWNERS[task.owner] ?? task.owner }}
    />
  );
}

function moveTask(
  prev: BoardColumn<Task>[],
  id: string,
  container: string,
  index: number,
): BoardColumn<Task>[] {
  const moved = prev.flatMap((c) => c.items).find((t) => t.id === id);
  if (!moved) return prev;
  return prev.map((column) => {
    const without = column.items.filter((t) => t.id !== id);
    if (column.id !== container) return { ...column, items: without };
    const next = [...without];
    next.splice(index, 0, moved);
    return { ...column, items: next };
  });
}

/**
 * The task board: BoardCard content, "+ Add task" after each lane's last card (the host pre-fills
 * the lane's status), a lane collapsible from its header, and an empty lane that says "Nothing
 * here" with "+ Add task" under it at rest and "Drop here" while a card is dragged.
 */
export function boardTasks(): ReactNode {
  const [columns, setColumns] = useState(TASKS);
  const [added, setAdded] = useState<string | null>(null);
  return (
    <Wrapper className="block">
      <Board<Task>
        height="30rem"
        aria-label="Tasks"
        columns={columns}
        countLabel={(n) => `${n} ${n === 1 ? "task" : "tasks"}`}
        getItemId={(task) => task.id}
        getItemLabel={(task) => task.title}
        getItemActions={() => [
          { label: "Open", onSelect: () => {} },
          {
            label: "Change priority",
            items: [
              { label: "Urgent", onSelect: () => {} },
              { label: "High", onSelect: () => {} },
              { label: "Medium", onSelect: () => {} },
              { label: "Low", onSelect: () => {} },
            ],
          },
          { type: "separator" },
          { label: "Cancel task", destructive: true, onSelect: () => {} },
        ]}
        renderCard={taskCard}
        onAdd={(status) => setAdded(status)}
        addLabel="Add task"
        onMove={({ id, to }) =>
          setColumns((prev) => moveTask(prev, id, to.container, to.index))
        }
      />
      <p className="pt-2 text-xs text-muted-foreground" aria-live="polite">
        {added ? `Create form opened with status "${added}"` : "\u00a0"}
      </p>
    </Wrapper>
  );
}

/** Collapsed lanes: a lane collapsed from its header menu (controlled here) is a slim strip. */
export function boardCollapsed(): ReactNode {
  const [columns, setColumns] = useState(TASKS);
  const [collapsed, setCollapsed] = useState<string[]>(["review", "done"]);
  return (
    <Wrapper className="block">
      <Board<Task>
        height="26rem"
        aria-label="Tasks with a collapsed lane"
        columns={columns}
        collapsedColumns={collapsed}
        onCollapsedChange={setCollapsed}
        getItemId={(task) => task.id}
        getItemLabel={(task) => task.title}
        renderCard={taskCard}
        onMove={({ id, to }) =>
          setColumns((prev) => moveTask(prev, id, to.container, to.index))
        }
      />
    </Wrapper>
  );
}

/** Full height: `height="fill"` (the default) runs the lanes to the bottom of the viewport. */
export function boardFill(): ReactNode {
  const [columns, setColumns] = useState(TASKS);
  return (
    <Wrapper className="block">
      <Board<Task>
        aria-label="Full-height tasks"
        columns={columns}
        getItemId={(task) => task.id}
        getItemLabel={(task) => task.title}
        renderCard={taskCard}
        onAdd={() => {}}
        addLabel="Add task"
        onMove={({ id, to }) =>
          setColumns((prev) => moveTask(prev, id, to.container, to.index))
        }
      />
    </Wrapper>
  );
}

/** Read-only: `readOnly` turns off every move and hides "+ Add"; cards still open. */
export function boardReadOnly(): ReactNode {
  return (
    <Wrapper className="block">
      <Board<Task>
        height="26rem"
        aria-label="Read-only tasks"
        readOnly
        columns={TASKS}
        getItemId={(task) => task.id}
        getItemLabel={(task) => task.title}
        renderCard={taskCard}
        onAdd={() => {}}
        addLabel="Add task"
        onMove={() => {}}
      />
    </Wrapper>
  );
}

/**
 * `canMoveItem` locks single cards: "Globex expansion" is a view-only record — it opens and keeps
 * the default cursor, but no pointer, touch or Space pick-up lifts it. The other cards still move.
 */
export function boardLockedCard(): ReactNode {
  const [columns, setColumns] = useState<BoardColumn<Deal>[]>(
    INITIAL.slice(0, 3),
  );
  return (
    <Wrapper className="block">
      <Board<Deal>
        height="26rem"
        aria-label="Deals with a view-only card"
        columns={columns}
        getItemId={(deal) => deal.id}
        getItemLabel={(deal) => deal.name}
        canMoveItem={(deal) => deal.id !== "d2"}
        renderCard={(deal) =>
          deal.id === "d2" ? (
            <BoardCard
              surface={false}
              title={deal.name}
              context={`${deal.amount} · View only`}
            />
          ) : (
            dealCard(deal)
          )
        }
        onCardActivate={() => {}}
        onMove={({ id, to }) =>
          setColumns((prev) => applyMove(prev, id, to.container, to.index))
        }
      />
    </Wrapper>
  );
}

type LinearStatus = "todo" | "progress" | "review" | "done";
const LINEAR_LANES: { id: LinearStatus; title: string }[] = [
  { id: "todo", title: "Todo" },
  { id: "progress", title: "In Progress" },
  { id: "review", title: "In Review" },
];

/**
 * A Linear-style status board: a status glyph before each lane title, the "+" in the lane header
 * beside ⋯, quiet cards with pill chips, and a hidden-lanes list after the last lane (`trailing`).
 */
export function boardHeaderAdd(): ReactNode {
  const [columns, setColumns] = useState<BoardColumn<Task>[]>(() =>
    LINEAR_LANES.map((lane, index) => ({
      id: lane.id,
      title: lane.title,
      icon: <StatusIcon status={lane.id} size="sm" label="" />,
      items: (TASKS[index]?.items ?? []).slice(0, 2),
    })),
  );
  return (
    <Wrapper className="block">
      <Board<Task>
        height="26rem"
        aria-label="Issues"
        columns={columns}
        getItemId={(task) => task.id}
        getItemLabel={(task) => task.title}
        getColumnActions={() => [
          { label: "Hide column", onSelect: () => {} },
          { label: "Sort by priority", onSelect: () => {} },
        ]}
        onAdd={() => {}}
        addLabel="New issue"
        addPlacement="header"
        renderCard={(task, column) => (
          <BoardCard
            surface={false}
            title={task.title}
            eyebrow={task.meeting ? "↳ Harbour Tower handover" : undefined}
            status={<StatusIcon status={column.id as LinearStatus} size="sm" />}
            aside={
              <PersonAvatar
                person={{ name: OWNERS[task.owner] ?? task.owner }}
              />
            }
            chips={
              <BoardCardChip>
                <CalendarDays />
                {task.due < 0 ? "Overdue" : `In ${task.due}d`}
              </BoardCardChip>
            }
            footnote="Created 9 Oct"
          />
        )}
        onMove={({ id, to }) =>
          setColumns((prev) => moveTask(prev, id, to.container, to.index))
        }
        trailing={
          <div className="flex w-56 flex-col gap-1 px-1 pt-3">
            <p className="px-2 pb-1 text-sm text-muted-foreground">
              Hidden columns
            </p>
            {["Backlog", "Done", "Canceled"].map((name) => (
              <Button
                key={name}
                variant="ghost"
                size="sm"
                className="justify-start"
              >
                <Eye />
                {name}
              </Button>
            ))}
          </div>
        }
      />
    </Wrapper>
  );
}
