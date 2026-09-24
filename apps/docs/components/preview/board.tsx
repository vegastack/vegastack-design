"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/board` (dogfoods the registry) → auto-scanned.
import { Board, type BoardColumn } from "@/components/ui/board";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

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
        aria-label="Deals"
        columns={columns}
        getItemId={(deal) => deal.id}
        getItemLabel={(deal) => deal.name}
        renderCard={(deal) => (
          <>
            <span className="min-w-0 truncate font-medium">{deal.name}</span>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <Avatar size="sm">
                <AvatarFallback>{deal.owner}</AvatarFallback>
              </Avatar>
              {deal.amount}
            </span>
          </>
        )}
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
        aria-label="Gated pipeline (the server rejects every move)"
        columns={columns}
        getItemId={(deal) => deal.id}
        renderCard={(deal) => (
          <span className="min-w-0 truncate">{deal.name}</span>
        )}
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
        aria-label="Pipeline with a locked lane"
        columns={columns}
        columnMaxHeight="14rem"
        getItemId={(deal) => deal.id}
        renderCard={(deal) => (
          <>
            <span className="min-w-0 truncate font-medium">{deal.name}</span>
            <span className="text-xs text-muted-foreground">{deal.amount}</span>
          </>
        )}
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
        aria-label="Sprint"
        columns={columns}
        getItemId={(task) => task.id}
        getItemLabel={(task) => task.name}
        renderCard={(task) => (
          <>
            <span className="min-w-0 truncate font-medium">{task.name}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {task.amount}
            </span>
          </>
        )}
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
      emptyState: (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Nothing blocked</EmptyTitle>
            <EmptyDescription>
              Move a task here when it waits on someone
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ),
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
        aria-label="Sprint tasks"
        columns={columns}
        countLabel={(n) => `${n} ${n === 1 ? "task" : "tasks"}`}
        getItemId={(task) => task.id}
        getItemLabel={(task) => task.name}
        renderCard={(task) => (
          <>
            <span className="min-w-0 truncate font-medium">{task.name}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {task.amount}
            </span>
          </>
        )}
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
 * card into move mode, and its Move menu stays a separate control beside the link. Pass
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
        aria-label="Linked tasks"
        columns={columns}
        getItemId={(task) => task.id}
        getItemLabel={(task) => task.name}
        getItemHref={(task) => `?task=${task.id}`}
        renderCard={(task) => (
          <>
            <span className="min-w-0 truncate font-medium">{task.name}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {task.amount}
            </span>
          </>
        )}
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
        renderCard={(deal) => (
          <span className="min-w-0 truncate font-medium">{deal.name}</span>
        )}
        onMove={({ id, to }) =>
          setColumns((prev) => applyMove(prev, id, to.container, to.index))
        }
      />
    </Wrapper>
  );
}
