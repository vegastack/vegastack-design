// @vegastack board-01@0.23.39 sha256-4yhS8F/fW8atoEdbXJsowULL9juvIjr3MQYfGnlurT4=

"use client";

import * as React from "react";
import { UserRound } from "lucide-react";

import type { BoardCardPriority } from "@/components/ui/board-card";
import type { RowAction } from "@/components/ui/data-table-parts";
import { Button } from "@/components/ui/button";
import { DataList, type DataListSection } from "@/components/ui/data-list";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FilterBar, type FilterBarFilter } from "@/components/ui/filter-bar";

type Status = "backlog" | "in-progress" | "review" | "shipped";

interface Task {
  id: string;
  title: string;
  project: string;
  assignee: string;
  status: Status;
  /** Days from today; negative is overdue. */
  due: number;
  priority?: BoardCardPriority;
}

const TASKS: Task[] = [
  {
    id: "t1",
    title: "Audit onboarding copy",
    project: "Growth",
    assignee: "MK",
    status: "backlog",
    due: 4,
    priority: "medium",
  },
  {
    id: "t2",
    title: "Retry queue for webhooks",
    project: "Platform",
    assignee: "PS",
    status: "backlog",
    due: 9,
    priority: "high",
  },
  {
    id: "t3",
    title: "Export billing CSV",
    project: "Billing",
    assignee: "AL",
    status: "backlog",
    due: 12,
  },
  {
    id: "t4",
    title: "Agent run timeline",
    project: "Agents",
    assignee: "MK",
    status: "in-progress",
    due: 0,
    priority: "urgent",
  },
  {
    id: "t5",
    title: "Sidebar keyboard order",
    project: "Design system",
    assignee: "AL",
    status: "in-progress",
    due: -1,
    priority: "high",
  },
  {
    id: "t6",
    title: "Token contrast gate",
    project: "Design system",
    assignee: "PS",
    status: "review",
    due: 2,
  },
  {
    id: "t7",
    title: "Workspace invites",
    project: "Growth",
    assignee: "AL",
    status: "shipped",
    due: -6,
  },
];

/**
 * The Backlog's next page, as the server would return it. The lane shows its full count from the
 * start and loads these as its foot scrolls into view; replace with your paged fetch.
 */
const BACKLOG_NEXT_PAGE: Task[] = [
  {
    id: "t8",
    title: "Rotate API signing keys",
    project: "Platform",
    assignee: "PS",
    status: "backlog",
    due: 7,
  },
  {
    id: "t9",
    title: "Archive stale projects",
    project: "Growth",
    assignee: "MK",
    status: "backlog",
    due: 15,
  },
  {
    id: "t10",
    title: "Invite flow copy review",
    project: "Growth",
    assignee: "AL",
    status: "backlog",
    due: 20,
  },
];

const ASSIGNEES = [
  { initials: "MK", name: "Manoj Kumar" },
  { initials: "PS", name: "Priya Shah" },
  { initials: "AL", name: "Ana Lopez" },
];
const nameOf = (initials: string) =>
  ASSIGNEES.find((a) => a.initials === initials)?.name ?? initials;

const DAY = 86_400_000;

/**
 * The board and its filters: one `DataList` in its board view, with a `FilterBar` toolbar (search
 * plus an Assignee filter). Its sections are the lanes — named with their count ("In progress, 2
 * tasks") — and each task is a `BoardCard`: its due chip, priority and assignee, a link to the task
 * and an Open / Change status / Archive menu. The Backlog pages as it scrolls, each lane has
 * "+ Add task" (the create form opens with that status), and Shipped refuses cards. When the
 * filters match nothing the board gives way to "No matches" with "Clear filters".
 *
 * The filters narrow what each lane SHOWS; a move always lands in the full list, which is why
 * `onMove` updates `tasks` rather than the filtered view. Replace `TASKS` with your own data, each
 * href with your task route, `onMove` with the call that persists it, and `onAddToSection` with
 * your create form.
 *
 * @example
 * <BoardView />
 */
export function BoardView() {
  const [tasks, setTasks] = React.useState(TASKS);
  const [query, setQuery] = React.useState("");
  const [assignee, setAssignee] = React.useState<string | null>(null);
  const [backlogMore, setBacklogMore] = React.useState(BACKLOG_NEXT_PAGE);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [adding, setAdding] = React.useState<string | null>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  // Stand-in for a paged fetch: append the Backlog's next page after a short wait.
  function loadMoreBacklog() {
    if (loadingMore) return;
    setLoadingMore(true);
    window.setTimeout(() => {
      setTasks((previous) => [...previous, ...BACKLOG_NEXT_PAGE]);
      setBacklogMore([]);
      setLoadingMore(false);
    }, 600);
  }

  const setStatus = (task: Task, status: Status) =>
    setTasks((previous) =>
      previous.map((t) => (t.id === task.id ? { ...t, status } : t)),
    );

  function taskActions(task: Task): RowAction[] {
    return [
      { label: "Open", render: <a href={`/tasks/${task.id}`} /> },
      {
        label: "Change status",
        items: LANES.map((lane) => ({
          label: String(lane.label),
          disabled: lane.id === task.status,
          onSelect: () => setStatus(task, lane.id as Status),
        })),
      },
      { type: "separator" },
      {
        label: "Archive",
        destructive: true,
        onSelect: () =>
          setTasks((previous) => previous.filter((t) => t.id !== task.id)),
      },
    ];
  }

  const filtering = query.trim() !== "" || assignee !== null;
  const visible = tasks.filter(
    (task) =>
      (assignee === null || task.assignee === assignee) &&
      task.title.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const backlogLoaded = tasks.filter((t) => t.status === "backlog").length;

  const LANES: DataListSection[] = [
    {
      id: "backlog",
      label: "Backlog",
      // A paged lane: its count is the server's total, and it loads the rest as it scrolls. While
      // filtering, the lane shows only what it has loaded, so the count is what is visible.
      ...(!filtering && backlogMore.length > 0
        ? {
            count: backlogLoaded + backlogMore.length,
            loadMore: {
              hasMore: true,
              loading: loadingMore,
              onLoadMore: loadMoreBacklog,
            },
          }
        : {}),
    },
    { id: "in-progress", label: "In progress" },
    { id: "review", label: "In review" },
    {
      id: "shipped",
      label: "Shipped",
      droppable: false,
      lockedReason: "Shipped work moves by release automation",
      addable: false,
    },
  ];

  const filters: FilterBarFilter[] = assignee
    ? [
        {
          id: "assignee",
          label: "Assignee",
          value: nameOf(assignee),
          icon: <UserRound />,
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
    <DataList<Task>
      aria-label="Tasks"
      view="board"
      columns={[{ key: "title", header: "Task", mobile: "visible" }]}
      data={visible}
      getRowId={(task) => task.id}
      getRowLabel={(task) => task.title}
      getRowHref={(task) => `/tasks/${task.id}`}
      rowActions={taskActions}
      sections={LANES}
      getRowSection={(task) => task.status}
      sectionCountLabel={(n) => (n === 1 ? "1 task" : `${n} tasks`)}
      boardCard={(task) => ({
        title: task.title,
        context: task.project,
        due: new Date(Date.now() + task.due * DAY),
        priority: task.priority,
        assignee: { name: nameOf(task.assignee) },
      })}
      onMove={(task, _from, to) => setStatus(task, to as Status)}
      onAddToSection={setAdding}
      addLabel="Add task"
      noResults={filtering ? { onClear: clearFilters } : undefined}
      footer={
        adding ? (
          <p className="text-sm text-muted-foreground" role="status">
            New task in {LANES.find((lane) => lane.id === adding)?.label}
          </p>
        ) : null
      }
      toolbar={
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
                <UserRound />
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
      }
    />
  );
}
