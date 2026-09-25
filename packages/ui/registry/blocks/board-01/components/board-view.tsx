// @vegastack board-01@0.23.0 sha256-PRCoih5TBiotvjlrw+eksvXF1/46idbcryDbGcaYbO4=

"use client";

import * as React from "react";
import { SearchX, User } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Board, type BoardColumn } from "@/components/ui/board";
import type { RowAction } from "@/components/ui/data-table-parts";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FilterBar, type FilterBarFilter } from "@/components/ui/filter-bar";

interface Task {
  id: string;
  title: string;
  assignee: string;
  estimate: string;
}

const INITIAL: BoardColumn<Task>[] = [
  {
    id: "backlog",
    title: "Backlog",
    items: [
      {
        id: "t1",
        title: "Audit onboarding copy",
        assignee: "MK",
        estimate: "2d",
      },
      {
        id: "t2",
        title: "Retry queue for webhooks",
        assignee: "PS",
        estimate: "3d",
      },
      { id: "t3", title: "Export billing CSV", assignee: "AL", estimate: "1d" },
    ],
  },
  {
    id: "in-progress",
    title: "In progress",
    items: [
      { id: "t4", title: "Agent run timeline", assignee: "MK", estimate: "5d" },
      {
        id: "t5",
        title: "Sidebar keyboard order",
        assignee: "AL",
        estimate: "1d",
      },
    ],
  },
  {
    id: "review",
    title: "In review",
    items: [
      {
        id: "t6",
        title: "Token contrast gate",
        assignee: "PS",
        estimate: "2d",
      },
    ],
  },
  {
    id: "shipped",
    title: "Shipped",
    items: [
      { id: "t7", title: "Workspace invites", assignee: "AL", estimate: "3d" },
    ],
    droppable: false,
    lockedReason: "Shipped work moves by release automation",
  },
];

/**
 * The Backlog's next page, as the server would return it. The lane shows its full count from the
 * start and loads these on "Load more"; replace with your paged fetch.
 */
const BACKLOG_NEXT_PAGE: Task[] = [
  {
    id: "t8",
    title: "Rotate API signing keys",
    assignee: "PS",
    estimate: "1d",
  },
  { id: "t9", title: "Archive stale projects", assignee: "MK", estimate: "2d" },
  {
    id: "t10",
    title: "Invite flow copy review",
    assignee: "AL",
    estimate: "1d",
  },
];

const ASSIGNEES = [
  { initials: "MK", name: "Manoj Kumar" },
  { initials: "PS", name: "Priya Shah" },
  { initials: "AL", name: "Ana Lopez" },
];

function applyMove(
  previous: BoardColumn<Task>[],
  id: string,
  container: string,
  index: number,
): BoardColumn<Task>[] {
  const moved = previous
    .flatMap((column) => column.items)
    .find((task) => task.id === id);
  if (!moved) return previous;
  return previous.map((column) => {
    const without = column.items.filter((task) => task.id !== id);
    if (column.id !== container) return { ...column, items: without };
    const next = [...without];
    next.splice(index, 0, moved);
    return { ...column, items: next };
  });
}

/**
 * The board and its filters: a `FilterBar` (search plus an Assignee facet) over `Board`, whose lanes
 * are named with their count ("In progress, 2 tasks"), whose cards are links to each task with
 * an Edit / Archive menu, and whose Backlog is paged with Load more. When
 * the filters match nothing the board gives way to a "No matches" state with "Clear filters".
 *
 * The filters narrow what each lane SHOWS; a move always lands in the full lane, which is why
 * `onMove` updates `columns` rather than the filtered view. Replace `INITIAL` with your own data,
 * each card's href with your task route, and `onMove` with the call that persists it.
 *
 * @example
 * <BoardView />
 */
export function BoardView() {
  const [columns, setColumns] = React.useState(INITIAL);
  const [query, setQuery] = React.useState("");
  const [assignee, setAssignee] = React.useState<string | null>(null);
  const [backlogMore, setBacklogMore] = React.useState(BACKLOG_NEXT_PAGE);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);

  // Stand-in for a paged fetch: append the Backlog's next page after a short wait.
  function loadMoreBacklog() {
    setLoadingMore(true);
    window.setTimeout(() => {
      setColumns((previous) =>
        previous.map((column) =>
          column.id === "backlog"
            ? { ...column, items: [...column.items, ...BACKLOG_NEXT_PAGE] }
            : column,
        ),
      );
      setBacklogMore([]);
      setLoadingMore(false);
    }, 600);
  }

  function taskActions(task: Task): RowAction[] {
    return [
      { label: "Edit", render: <a href={`/tasks/${task.id}/edit`} /> },
      {
        label: "Archive",
        destructive: true,
        onSelect: () =>
          setColumns((previous) =>
            previous.map((column) => ({
              ...column,
              items: column.items.filter((item) => item.id !== task.id),
            })),
          ),
      },
    ];
  }

  const filtering = query.trim() !== "" || assignee !== null;
  const visible = React.useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        emptyState: filtering ? "No matching tasks" : "No tasks",
        // A paged lane: its count is the server's total, and Load more fetches the rest. While
        // filtering, the lane shows only what it has loaded, so the count is what is visible.
        ...(column.id === "backlog" && !filtering && backlogMore.length > 0
          ? {
              count: column.items.length + backlogMore.length,
              loadMore: {
                hasMore: true,
                loading: loadingMore,
                onLoadMore: loadMoreBacklog,
              },
            }
          : {}),
        items: column.items.filter(
          (task) =>
            (assignee === null || task.assignee === assignee) &&
            task.title.toLowerCase().includes(query.trim().toLowerCase()),
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadMoreBacklog only closes over setters
    [columns, query, assignee, filtering, backlogMore, loadingMore],
  );
  const noMatches =
    filtering && visible.every((column) => column.items.length === 0);

  const filters: FilterBarFilter[] = assignee
    ? [
        {
          id: "assignee",
          label: "Assignee",
          value: ASSIGNEES.find((a) => a.initials === assignee)?.name,
          icon: <User />,
          onRemove: () => setAssignee(null),
        },
      ]
    : [];

  function clearFilters() {
    setQuery("");
    setAssignee(null);
    // The button that called this unmounts; keep focus in the filters.
    searchRef.current?.focus();
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <FilterBar
        aria-label="Task filters"
        search={{
          value: query,
          onValueChange: setQuery,
          placeholder: "Search tasks…",
          "aria-label": "Search tasks",
        }}
        searchInputProps={{ ref: searchRef }}
        filters={filters}
        addFilterMenu={
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              <User />
              Assignee
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Assignee</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={assignee ?? ""}
                  onValueChange={(value) => setAssignee(value || null)}
                >
                  {ASSIGNEES.map((person) => (
                    <DropdownMenuRadioItem
                      key={person.initials}
                      value={person.initials}
                    >
                      {person.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        }
        trailing={
          filtering ? (
            <Button variant="ghost" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : null
        }
      />
      {noMatches ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX aria-hidden />
            </EmptyMedia>
            <EmptyTitle render={<h2 />}>No matches</EmptyTitle>
            <EmptyDescription>
              No task matches these filters. Clear them to see the whole board.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Board<Task>
          aria-label="Tasks"
          columns={visible}
          getItemId={(task) => task.id}
          getItemLabel={(task) => task.title}
          getItemHref={(task) => `/tasks/${task.id}`}
          getItemActions={taskActions}
          countLabel={(n) => (n === 1 ? "1 task" : `${n} tasks`)}
          renderCard={(task) => (
            <>
              <span className="min-w-0 truncate font-medium">{task.title}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <Avatar size="sm">
                  <AvatarFallback>{task.assignee}</AvatarFallback>
                </Avatar>
                <span className="tabular-nums">{task.estimate}</span>
              </span>
            </>
          )}
          onMove={({ id, to }) =>
            setColumns((previous) =>
              applyMove(previous, id, to.container, to.index),
            )
          }
        />
      )}
    </div>
  );
}
