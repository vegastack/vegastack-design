// @vegastack chat-task-list@0.135.0 sha256-svFEnuY11svbm8MmozIavhPTPpc6EPGFiW1ep6ShnMI=

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
 *
 * A long list keeps the work in view: finished tasks (done and skipped) fold into one "N done" row,
 * the task in progress and up to eleven to do come next, and the rest fold into "+N more"; each
 * fold opens in place. A failed task never folds. A group shows the tasks it stands for nested.
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
  /** A finished group: the tasks it stands for, nested under it and counted one by one. */
  members?: TaskListDataMember[];
}

/** One of the tasks a finished group stands for. */
export interface TaskListDataMember {
  /** A stable key; the member's position when omitted. */
  id?: string;
  text: string;
  status: "completed" | "skipped";
  /** Why it was skipped, in words. */
  reason?: string;
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

/** A list of this many lines or fewer (a group's members count) never folds. */
const NEVER_FOLD = 5;
/** Open tasks in view: the one in progress and up to eleven to do (agent-context I7). */
const OPEN_SHOWN = 12;
/** A fold that would hide a single line is not worth its row. */
const FOLD_MIN = 2;

/** The tasks an item stands for: a group's members, or the item itself. */
const originals = (
  item: TaskListDataItem,
): readonly { status: TaskListItemState }[] =>
  item.members?.length ? item.members : [item];
const countOf = (
  items: readonly TaskListDataItem[],
  test: (status: TaskListItemState) => boolean,
) =>
  items.reduce(
    (n, item) => n + originals(item).filter((o) => test(o.status)).length,
    0,
  );
const linesOf = (item: TaskListDataItem) => 1 + (item.members?.length ?? 0);
const isFinished = (item: TaskListDataItem) =>
  item.status === "completed" || item.status === "skipped";

/** Finished tasks behind "N done", the open tasks in view, the rest behind "+N more". */
function foldItems(data: TaskListData): {
  done: TaskListDataItem[];
  open: TaskListDataItem[];
  later: TaskListDataItem[];
} {
  const lines = data.items.reduce((n, item) => n + linesOf(item), 0);
  if (data.state === "done" || lines <= NEVER_FOLD)
    return { done: [], open: data.items, later: [] };
  const live = data.items.filter(
    (item) => !isFinished(item) && item.status !== "pending",
  ).length;
  let room = Math.max(0, OPEN_SHOWN - live);
  const done = data.items.filter(isFinished);
  const later: TaskListDataItem[] = [];
  for (const item of data.items) {
    if (item.status !== "pending") continue;
    if (room > 0) room--;
    else later.push(item);
  }
  const foldDone = done.reduce((n, item) => n + linesOf(item), 0) >= FOLD_MIN;
  const foldLater = later.length >= FOLD_MIN;
  const folded = new Set([
    ...(foldDone ? done : []),
    ...(foldLater ? later : []),
  ]);
  return {
    done: foldDone ? done : [],
    open: data.items.filter((item) => !folded.has(item)),
    later: foldLater ? later : [],
  };
}

/** The header's words: a count, never a spinner. */
function headerOf(data: TaskListData): string {
  const total = countOf(data.items, () => true);
  const completed = countOf(data.items, (s) => s === "completed");
  const skipped = countOf(data.items, (s) => s === "skipped" || s === "failed");
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
  const { done, open: openItems, later } = foldItems(data);
  const doneCount = countOf(done, (s) => s === "completed");
  const skippedCount = countOf(done, (s) => s === "skipped");
  const row = (item: TaskListDataItem) => (
    <TaskRow key={item.id} item={item} onOpenItem={onOpenItem} onWhy={onWhy} />
  );
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
        "flex min-w-0 flex-col rounded-card border border-chat-hairline p-1.25",
        className,
      )}
    >
      <CollapsibleTrigger
        data-slot="chat-task-list-header"
        className="group/task-list state-layer flex min-h-7 w-full min-w-0 items-center gap-2 rounded-item px-2 text-start text-sm text-muted-foreground tabular-nums"
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
        <div className="flex min-w-0 flex-col gap-0.5 pb-1.5">
          {done.length > 0 ? (
            <Fold
              slot="chat-task-list-done-fold"
              glyph={<StatusGlyph status="done" label={null} />}
              label={[
                doneCount ? `${doneCount} done` : null,
                skippedCount ? `${skippedCount} skipped` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            >
              {done.map(row)}
            </Fold>
          ) : null}
          <ol className="flex min-w-0 flex-col gap-0.5 px-2">
            {openItems.map(row)}
          </ol>
          {later.length > 0 ? (
            <Fold
              slot="chat-task-list-more-fold"
              label={`+${later.length} more`}
            >
              {later.map(row)}
            </Fold>
          ) : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** A fold of a long list: a row that opens in place to the tasks it holds, as their own list. */
function Fold({
  slot,
  glyph,
  label,
  children,
}: {
  slot: string;
  glyph?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <Collapsible data-slot={`${slot}-root`} className="flex min-w-0 flex-col">
      <CollapsibleTrigger
        id={id}
        data-slot={slot}
        className="group/fold state-layer flex min-h-7 w-full min-w-0 items-center gap-2 rounded-item px-2 text-start text-sm text-muted-foreground tabular-nums"
      >
        <span aria-hidden className="inline-flex size-4 shrink-0">
          {glyph}
        </span>
        <span className="min-w-0 truncate">{label}</span>
        <ChevronRight
          aria-hidden="true"
          strokeWidth={1.5}
          className="size-3.5 shrink-0 transition-transform duration-state ease-enter group-data-panel-open/fold:rotate-90 rtl:rotate-180 rtl:group-data-panel-open/fold:rotate-90"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ol aria-labelledby={id} className="flex min-w-0 flex-col gap-0.5 px-2">
          {children}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Why a finished task ended, inside its row: "Skipped: not asked · see why ›". */
function Reason({
  status,
  reason,
  onWhy,
}: {
  status: TaskListItemState;
  reason: string;
  onWhy?: () => void;
}) {
  return (
    <span className="ms-auto flex min-w-0 shrink items-center gap-1 ps-2 text-xs text-muted-foreground">
      <span className="min-w-0 truncate">
        {status === "failed" ? "Didn't finish" : "Skipped"}: {reason}
      </span>
      {onWhy ? (
        <Button
          variant="link"
          size="xs"
          onClick={onWhy}
          className="shrink-0 px-1 text-xs"
        >
          see why ›
        </Button>
      ) : null}
    </span>
  );
}

function TaskRow({
  item,
  onOpenItem,
  onWhy,
}: {
  item: TaskListDataItem;
  onOpenItem?: (id: string) => void;
  onWhy?: (id: string) => void;
}) {
  const ended = item.status === "skipped" || item.status === "failed";
  return (
    <li
      data-slot="chat-task-list-item"
      data-status={item.status}
      className="flex min-w-0 flex-col"
    >
      <div className="flex min-h-7 min-w-0 items-center gap-2 text-sm">
        <StatusGlyph status={GLYPH[item.status]} label={LABEL[item.status]} />
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
          <Reason
            status={item.status}
            reason={item.reason}
            onWhy={onWhy ? () => onWhy(item.id) : undefined}
          />
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
      {item.members?.length ? (
        <ol
          data-slot="chat-task-list-members"
          className="flex min-w-0 flex-col gap-0.5 ps-6"
        >
          {item.members.map((member, index) => (
            <li
              key={member.id ?? String(index)}
              data-slot="chat-task-list-member"
              data-status={member.status}
              className="flex min-h-7 min-w-0 items-center gap-2 text-sm"
            >
              <StatusGlyph
                status={GLYPH[member.status]}
                label={LABEL[member.status]}
              />
              <span className="min-w-0 truncate text-muted-foreground">
                {member.text}
              </span>
              {member.status === "skipped" && member.reason ? (
                <Reason status="skipped" reason={member.reason} />
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
    </li>
  );
}

export { ChatTaskList };
