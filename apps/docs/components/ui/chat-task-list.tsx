// @vegastack chat-task-list@0.79.0 sha256-12LrrbPxYNGZcD5YkVH5oJrXeeow+FWHNCbZiNZnDjs=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { StatusGlyph, type ChatStatus } from "@/components/ui/status-glyph";
import { ChatClock } from "@/components/ui/chat-work-log";

/* ------------------------------------------------------------------------------------------------
 * ChatTaskList — an agent's task list as the turn's progress (task list v2).
 *
 * When a turn has a task list it IS the turn's progress: a hairline box with no fill whose header
 * says a count and a time, never a spinner ("2 of 5 · 1:20", "Done · 1 step · 3 skipped", "Stopped
 * at 3 of 5 · <reason>"). Rows are ✓ ◐ ◌ ⊘ through StatusGlyph; a step that was refused or failed
 * is ⊘ with its reason inside the row, never struck through. It stays mounted at the end of the turn
 * and folds with the chat's height motion. The data is the chat contract's `data-tasklist` payload.
 * ----------------------------------------------------------------------------------------------*/

/** Where one task stands. A step is `completed` only when its calls succeeded (the server checks). */
export type TaskListItemState =
  "pending" | "in_progress" | "completed" | "skipped" | "failed";

/** One task of a `ChatTaskList`. */
export interface TaskListDataItem {
  id: string;
  /** What the task is, in the imperative: "Check sources". */
  text: string;
  status: TaskListItemState;
  /** Why a task was skipped or failed, in words: "you weren't asked". */
  reason?: string;
  /** How many of its Subagents are running ("3 running" under the row). */
  running?: number;
}

/** The chat contract's `data-tasklist` payload. */
export interface TaskListData {
  id: string;
  /** Still working, finished, or stopped before the end. */
  state: "working" | "done" | "stopped";
  items: TaskListDataItem[];
  /** Why the list stopped, in words. */
  reason?: string;
  /** When the list started (ISO): the header's clock while working. */
  startedAt?: string;
  /** How long it took, once settled. */
  elapsedMs?: number;
}

/** Props accepted by `ChatTaskList`. */
export interface ChatTaskListProps {
  /** The task list. */
  data: TaskListData;
  /** Opens a task's own detail (its Subagents' steps); with it, "3 running" is a button. @default undefined */
  onOpenItem?: (id: string) => void;
  /** Opens why a task was skipped or failed; with it, the reason ends in "see why ›". @default undefined */
  onWhy?: (id: string) => void;
  /** Controlled open state. @default undefined */
  open?: boolean;
  /** Initial open state; open while working, folded once settled. @default data.state === "working" */
  defaultOpen?: boolean;
  /** Called when the list opens or closes. @default undefined */
  onOpenChange?: (open: boolean) => void;
  /** Extra classes on the root. @default undefined */
  className?: string;
}

const GLYPH: Record<TaskListItemState, ChatStatus> = {
  pending: "pending",
  in_progress: "running",
  completed: "done",
  skipped: "skipped",
  failed: "skipped",
};

const LABEL: Record<TaskListItemState, string> = {
  pending: "To do",
  in_progress: "In progress",
  completed: "Done",
  skipped: "Skipped",
  failed: "Didn't finish",
};

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

/** The header's words: a count, never a spinner. */
function headerOf(data: TaskListData): string {
  const total = data.items.length;
  const completed = data.items.filter((i) => i.status === "completed").length;
  const skipped = data.items.filter(
    (i) => i.status === "skipped" || i.status === "failed",
  ).length;
  if (data.state === "working") return `${completed} of ${total}`;
  if (data.state === "stopped")
    return [`Stopped at ${completed} of ${total}`, data.reason]
      .filter(Boolean)
      .join(" · ");
  return [
    `Done · ${plural(completed, "step")}`,
    skipped ? `${skipped} skipped` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * The turn's progress as a task list: a count-and-time header, then each task as ✓ done (primary),
 * ◐ in progress (still), ◌ to do, or ⊘ skipped with its reason in the row. It folds smoothly and
 * stays mounted when the turn ends.
 *
 * @example
 * <ChatTaskList data={part.data} onOpenItem={openSubagents} onWhy={explain} />
 */
function ChatTaskList({
  data,
  onOpenItem,
  onWhy,
  open,
  defaultOpen,
  onOpenChange,
  className,
}: ChatTaskListProps) {
  const working = data.state === "working";
  const header = headerOf(data);
  // Uncontrolled, the list is open while working and folds once when the turn settles.
  const [innerOpen, setInnerOpen] = React.useState(defaultOpen ?? working);
  const [seenState, setSeenState] = React.useState(data.state);
  if (seenState !== data.state) {
    setSeenState(data.state);
    if (seenState === "working" && !working) setInnerOpen(false);
  }
  return (
    <Collapsible
      data-slot="chat-task-list"
      data-state-list={data.state}
      open={open ?? innerOpen}
      onOpenChange={(next) => {
        setInnerOpen(next);
        onOpenChange?.(next);
      }}
      className={cn(
        "flex min-w-0 flex-col rounded-chat-card border border-chat-hairline",
        className,
      )}
    >
      <CollapsibleTrigger
        data-slot="chat-task-list-header"
        className="group/task-list state-layer flex min-h-9 w-full min-w-0 items-center gap-2 rounded-chat-card px-3 text-start text-sm text-muted-foreground tabular-nums"
      >
        <span className="min-w-0 flex-1 truncate">
          <span className="sr-only">Task list, </span>
          {header}
        </span>
        {working && data.startedAt ? (
          <ChatClock startedAt={data.startedAt} className="shrink-0" />
        ) : data.elapsedMs != null ? (
          <ChatClock ms={data.elapsedMs} running={false} className="shrink-0" />
        ) : null}
        <ChevronRight
          aria-hidden="true"
          strokeWidth={1.5}
          className="size-3.5 shrink-0 transition-transform duration-state ease-enter group-data-panel-open/task-list:rotate-90 rtl:rotate-180 rtl:group-data-panel-open/task-list:rotate-90"
        />
      </CollapsibleTrigger>
      <CollapsibleContent data-slot="chat-task-list-content">
        <ol className="flex min-w-0 flex-col gap-0.5 px-3 pb-2.5">
          {data.items.map((item) => {
            const ended = item.status === "skipped" || item.status === "failed";
            return (
              <li
                key={item.id}
                data-slot="chat-task-list-item"
                data-status={item.status}
                className="flex min-w-0 flex-col"
              >
                <div className="flex min-h-7 min-w-0 items-center gap-2 text-sm">
                  <StatusGlyph
                    status={GLYPH[item.status]}
                    label={LABEL[item.status]}
                  />
                  <span
                    className={cn(
                      "min-w-0 truncate",
                      item.status === "in_progress"
                        ? "font-medium text-foreground"
                        : item.status === "pending"
                          ? "text-foreground"
                          : "text-muted-foreground",
                    )}
                  >
                    {item.text}
                  </span>
                  {ended && item.reason ? (
                    <span className="ms-auto flex min-w-0 shrink items-center gap-1 ps-2 text-xs text-muted-foreground">
                      <span className="min-w-0 truncate">
                        {item.status === "failed" ? "Didn't finish" : "Skipped"}
                        : {item.reason}
                      </span>
                      {onWhy ? (
                        <Button
                          variant="link"
                          size="xs"
                          onClick={() => onWhy(item.id)}
                          className="h-auto shrink-0 px-0 text-xs"
                        >
                          see why ›
                        </Button>
                      ) : null}
                    </span>
                  ) : null}
                </div>
                {item.status === "in_progress" && item.running ? (
                  onOpenItem ? (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => onOpenItem(item.id)}
                      className="ms-4 w-fit border-0 font-normal text-muted-foreground"
                    >
                      {item.running} running ›
                    </Button>
                  ) : (
                    <span className="ms-6 text-xs text-muted-foreground">
                      {item.running} running
                    </span>
                  )
                ) : null}
              </li>
            );
          })}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
}

export { ChatTaskList };
