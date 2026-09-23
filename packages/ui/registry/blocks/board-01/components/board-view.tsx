// @vegastack board-01@0.15.0 sha256-aA6ryQbDYM8EAFt0dHm1Z6R7BpamKw+WIPacRMW6dXQ=

"use client";

import * as React from "react";
import { LayoutGrid, Rows3, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Board, type BoardColumn } from "@/components/ui/board";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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

const ASSIGNEES = ["MK", "PS", "AL"];

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
 * The board and its toolbar: a filter field, an assignee select and a view switch over `Board`.
 *
 * The filter narrows what each column SHOWS; a move always lands in the full column, which is why
 * `onMove` updates `columns` rather than the filtered view. Replace `INITIAL` with your own data
 * and `onMove` with the call that persists it.
 *
 * @example
 * <BoardView />
 */
export function BoardView() {
  const [columns, setColumns] = React.useState(INITIAL);
  const [query, setQuery] = React.useState("");
  const [assignee, setAssignee] = React.useState("all");

  // Filtering narrows what each column SHOWS; the move still lands in the full column, which is
  // why `onMove` works against `columns` rather than the filtered view.
  const visible = React.useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        items: column.items.filter(
          (task) =>
            (assignee === "all" || task.assignee === assignee) &&
            task.title.toLowerCase().includes(query.trim().toLowerCase()),
        ),
      })),
    [columns, query, assignee],
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="w-full sm:w-64">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Filter tasks"
            placeholder="Filter tasks"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </InputGroup>
        <Select
          value={assignee}
          onValueChange={(value) => {
            if (value) setAssignee(value);
          }}
        >
          <SelectTrigger className="w-40" aria-label="Filter by assignee">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Everyone</SelectItem>
            {ASSIGNEES.map((initials) => (
              <SelectItem key={initials} value={initials}>
                {initials}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ToggleGroup
          variant="outline"
          defaultValue={["board"]}
          className="ms-auto"
        >
          <ToggleGroupItem value="board" aria-label="Board view">
            <LayoutGrid />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view">
            <Rows3 />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <Board<Task>
        aria-label="Tasks"
        columns={visible}
        getItemId={(task) => task.id}
        columnMaxHeight="28rem"
        renderCard={(task) => (
          <>
            <span className="min-w-0 truncate font-medium">{task.title}</span>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <Avatar size="sm">
                <AvatarFallback>{task.assignee}</AvatarFallback>
              </Avatar>
              {task.estimate}
            </span>
          </>
        )}
        onMove={({ id, to }) =>
          setColumns((previous) =>
            applyMove(previous, id, to.container, to.index),
          )
        }
      />
    </div>
  );
}
