// @vegastack milestone-list@0.143.1 sha256-jNEViKtAvR6YemiaTl005SkAMk1ovScheTrTlMlDZcA=

"use client";

import * as React from "react";
import { Plus, TriangleAlert } from "lucide-react";
import { cn } from "@vegastack/design";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RowAction } from "@/components/ui/data-table-parts";
import { SortableList } from "@/components/ui/sortable-list";
import { TruncatedText } from "@/components/ui/truncated-text";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DragReorderMove } from "@/components/ui/use-drag-reorder";

/* ---
`MilestoneList` is the ordered list of the big steps in a piece of work. Each row reads left to
right: a diamond for its state (filled when done, hollow while open, hollow in the warning ink once
late), the name (truncated, the whole name in a tooltip), then the trailing meta flush right and
muted (UI ground rules C3): a weight chip only when the weight is not 1, the tasks done ("3 of 5"),
a warning glyph whose message is its tooltip and name, and the date. A row's hover fill runs the
list's full width (C4).

For editors it is `SortableList` underneath: the grip drags, a finger long-presses, and the
keyboard lifts from the grip (Space, ↑/↓, Space to drop, Escape to cancel), each step announced.
`onMove` gets the moved milestone and its new neighbours. The ⋯ menu is the consumer's
(`getActions`: rename, set date, weight, mark done, remove), the diamond becomes a done toggle with
`onDoneChange`, and `onAdd` adds the "Add milestone" row under the list.

Deliberately NOT done here: no inline editing, no data. The host owns the order, the names and
the empty state's words (`emptyState`).
--- */

/** Where a milestone stands: done, still open, or open past its date. */
export type MilestoneState = "done" | "open" | "late";

const STATE_LABEL: Record<MilestoneState, string> = {
  done: "Done",
  open: "Open",
  late: "Late",
};

/** Props accepted by `MilestoneGlyph`. */
export interface MilestoneGlyphProps extends Omit<
  React.ComponentPropsWithRef<"span">,
  "children"
> {
  /** The milestone's state. */
  state: MilestoneState;
  /** 16px in a row, 14px in a meta line or on a timeline. @default 16 */
  size?: 14 | 16;
  /**
   * The accessible name. Defaults to the state in words ("Done", "Late"); pass `null` when the words
   * beside the glyph already say it, and the glyph is hidden from assistive technology.
   * @default the state's word
   */
  label?: string | null;
}

/**
 * `MilestoneGlyph` — a milestone's diamond: filled in the neutral solid when done, hollow and muted while
 * open, hollow in the warning ink when late.
 *
 * @example
 * <MilestoneGlyph state="late" />
 */
export function MilestoneGlyph({
  state,
  size = 16,
  label,
  className,
  ...props
}: MilestoneGlyphProps) {
  const name = label === undefined ? STATE_LABEL[state] : label;
  return (
    <span
      data-slot="milestone-glyph"
      data-state={state}
      {...(name
        ? { role: "img", "aria-label": name }
        : { "aria-hidden": true })}
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        size === 14 ? "size-3.5" : "size-4",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "rotate-45 border-2",
          size === 14 ? "size-2" : "size-2.5",
          state === "done" && "border-ink bg-ink",
          state === "open" && "border-muted-foreground",
          state === "late" && "border-warning-text",
        )}
      />
    </span>
  );
}

/** One milestone row. */
export interface MilestoneListItem {
  /** Stable id: the identity `onMove`, `onDoneChange` and `getActions` receive. */
  id: string;
  /** The milestone's name. */
  name: string;
  /** Done, open, or open past its date. */
  state: MilestoneState;
  /**
   * Its date as an ISO date (`2026-03-14`). Rows without one show no date.
   * @default undefined
   */
  date?: string;
  /**
   * Its weight in progress. A chip shows only when it is not 1.
   * @default 1
   */
  weight?: number;
  /**
   * Its tasks: how many are done of how many. Shown as "3 of 5" with "tasks" for the ear.
   * @default undefined
   */
  tasks?: { done: number; total: number };
  /**
   * A warning about this milestone ("After the target date"). Shows a ⚠ whose tooltip and name are
   * the message.
   * @default undefined
   */
  warning?: string;
}

/** Where a moved milestone lands: between `after` and `before` (either is missing at an end). */
export interface MilestoneMove {
  /** The milestone that now follows it. */
  before?: string;
  /** The milestone that now precedes it. */
  after?: string;
}

/** Every word the list draws or speaks; pass any of them to `labels` to replace it. */
export interface MilestoneListLabels {
  /** The add row. */
  add: string;
  /** Each state in words (the diamond's name). */
  state: Record<MilestoneState, string>;
  /** The done toggle's name for an open milestone. */
  markDone: (name: string) => string;
  /** The done toggle's name for a done milestone. */
  markNotDone: (name: string) => string;
  /** What the screen reader hears for the weight chip ("Weight 3"). */
  weight: (weight: number) => string;
  /** The tasks meta as shown ("3 of 5"). */
  tasks: (done: number, total: number) => string;
  /** The tasks meta as the screen reader hears it ("3 of 5 tasks done"). */
  tasksSpoken: (done: number, total: number) => string;
  /** The ⋯ menu trigger's name. */
  actions: (name: string) => string;
}

const DEFAULT_LABELS: MilestoneListLabels = {
  add: "Add milestone",
  state: STATE_LABEL,
  markDone: (name) => `Mark ${name} as done`,
  markNotDone: (name) => `Mark ${name} as not done`,
  weight: (weight) => `Weight ${weight}`,
  tasks: (done, total) => `${done} of ${total}`,
  tasksSpoken: (done, total) => `${done} of ${total} tasks done`,
  actions: (name) => `Actions for ${name}`,
};

/** Props accepted by `MilestoneList`. */
export interface MilestoneListProps {
  /** The milestones, in order. Controlled: the host re-orders on `onMove`. */
  items: readonly MilestoneListItem[];
  /**
   * Move a milestone. Its presence turns reordering on (grip, long-press, keyboard). Return a promise
   * to keep the row pending until the server answers; a rejection snaps it back and is announced.
   * @default undefined
   */
  onMove?: (id: string, to: MilestoneMove) => void | Promise<void>;
  /**
   * Mark a milestone done or open again. Its presence turns the diamond into a toggle button.
   * @default undefined
   */
  onDoneChange?: (id: string, done: boolean) => void;
  /**
   * A row's ⋯ menu: rename, set date, weight, mark done, remove. No actions, no menu.
   * @default undefined
   */
  getActions?: (item: MilestoneListItem) => RowAction[];
  /**
   * Add a milestone. Its presence shows the add row under the list.
   * @default undefined
   */
  onAdd?: () => void;
  /**
   * Words to replace: the add row, the state words, the done toggle's name, the weight and tasks
   * phrases.
   * @default English
   */
  labels?: Partial<MilestoneListLabels>;
  /**
   * Shown in place of the rows when there are none (the add row stays under it).
   * @default undefined
   */
  emptyState?: React.ReactNode;
  /**
   * Formats a row's ISO date.
   * @default "Mar 14" this year, "Mar 14, 2027" otherwise
   */
  formatDate?: (iso: string) => string;
  /**
   * Accessible name of the list.
   * @default "Milestones"
   */
  "aria-label"?: string;
  /**
   * Classes merged onto the root.
   * @default undefined
   */
  className?: string;
  /**
   * Ref to the root `div`.
   * @default undefined
   */
  ref?: React.Ref<HTMLDivElement>;
}

const DAY = /^(\d{4})-(\d{2})-(\d{2})/;

/** "Mar 14" this year, "Mar 14, 2027" otherwise; read as a calendar date, never shifted by zone. */
function defaultFormatDate(iso: string): string {
  const match = DAY.exec(iso);
  if (!match) return iso;
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  const thisYear = new Date().getFullYear() === date.getUTCFullYear();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(thisYear ? {} : { year: "numeric" }),
    timeZone: "UTC",
  });
}

function MilestoneRow({
  item,
  onDoneChange,
  formatDate,
  labels,
}: {
  item: MilestoneListItem;
  onDoneChange?: MilestoneListProps["onDoneChange"];
  formatDate: (iso: string) => string;
  labels: MilestoneListLabels;
}) {
  const weight = item.weight ?? 1;
  const glyph = <MilestoneGlyph state={item.state} label={null} />;
  return (
    <div
      data-slot="milestone-list-row"
      data-state={item.state}
      className="flex min-w-0 items-center gap-2 text-sm"
    >
      {onDoneChange ? (
        <Button
          data-slot="milestone-list-done"
          variant="ghost"
          size="icon-xs"
          aria-label={
            item.state === "done"
              ? labels.markNotDone(item.name)
              : labels.markDone(item.name)
          }
          onClick={() => onDoneChange(item.id, item.state !== "done")}
          className="-ms-1"
        >
          {glyph}
        </Button>
      ) : (
        <MilestoneGlyph state={item.state} label={labels.state[item.state]} />
      )}
      {onDoneChange ? (
        <span className="sr-only">{labels.state[item.state]}</span>
      ) : null}
      <TruncatedText className="min-w-0 flex-1">{item.name}</TruncatedText>
      <span
        data-slot="milestone-list-meta"
        className="ms-auto flex shrink-0 items-center gap-2 text-muted-foreground"
      >
        {weight !== 1 ? (
          <Badge
            data-slot="milestone-list-weight"
            variant="secondary"
            className="tabular-nums"
          >
            <span className="sr-only">{labels.weight(weight)}</span>
            <span aria-hidden>×{weight}</span>
          </Badge>
        ) : null}
        {item.tasks ? (
          <span data-slot="milestone-list-tasks" className="tabular-nums">
            <span aria-hidden>
              {labels.tasks(item.tasks.done, item.tasks.total)}
            </span>
            <span className="sr-only">
              {labels.tasksSpoken(item.tasks.done, item.tasks.total)}
            </span>
          </span>
        ) : null}
        {item.warning ? (
          <Tooltip>
            <TooltipTrigger
              data-slot="milestone-list-warning"
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={item.warning}
                />
              }
            >
              <TriangleAlert className="text-warning-text" strokeWidth={1.5} />
            </TooltipTrigger>
            <TooltipContent>{item.warning}</TooltipContent>
          </Tooltip>
        ) : null}
        {item.date ? (
          <span data-slot="milestone-list-date" className="tabular-nums">
            {formatDate(item.date)}
          </span>
        ) : null}
      </span>
    </div>
  );
}

/**
 * `MilestoneList` — the ordered milestones of a piece of work: state diamond, name, weight chip
 * (when not 1), tasks done, warning and date. With `onMove` the rows reorder by drag, long-press
 * and keyboard; `onDoneChange`, `getActions` and `onAdd` are the editor's tools.
 *
 * @example
 * <MilestoneList
 *   items={milestones}
 *   onMove={(id, { before, after }) => moveMilestone(id, before, after)}
 *   onDoneChange={(id, done) => setDone(id, done)}
 *   getActions={(m) => [
 *     { label: "Rename", onSelect: () => rename(m.id) },
 *     { type: "separator" },
 *     { label: "Remove", destructive: true, onSelect: () => remove(m.id) },
 *   ]}
 *   onAdd={openAddMilestone}
 *   emptyState={<p className="text-sm text-muted-foreground">Add milestones to mark the big steps</p>}
 * />
 */
export function MilestoneList({
  items,
  onMove,
  onDoneChange,
  getActions,
  onAdd,
  labels: labelsProp,
  emptyState,
  formatDate = defaultFormatDate,
  "aria-label": ariaLabel = "Milestones",
  className,
  ref,
}: MilestoneListProps) {
  const reorderable = onMove != null;
  const labels = React.useMemo(
    () => ({
      ...DEFAULT_LABELS,
      ...labelsProp,
      state: { ...DEFAULT_LABELS.state, ...labelsProp?.state },
    }),
    [labelsProp],
  );
  const rows = React.useMemo(
    () =>
      items.map((item) => ({
        ...item,
        label: item.name,
        disabled: !reorderable,
      })),
    [items, reorderable],
  );

  const onReorder = React.useCallback(
    (move: DragReorderMove) => {
      if (!onMove) return;
      const rest = items.filter((item) => item.id !== move.id);
      return onMove(move.id, {
        before: rest[move.to.index]?.id,
        after: rest[move.to.index - 1]?.id,
      });
    },
    [items, onMove],
  );

  return (
    <div
      ref={ref}
      data-slot="milestone-list"
      className={cn("flex min-w-0 flex-col", className)}
    >
      {items.length === 0 && emptyState != null ? (
        <div data-slot="milestone-list-empty">{emptyState}</div>
      ) : null}
      <SortableList
        aria-label={ariaLabel}
        items={rows}
        onReorder={onReorder}
        handle="auto"
        renderItem={(item) => (
          <MilestoneRow
            item={item}
            onDoneChange={onDoneChange}
            formatDate={formatDate}
            labels={labels}
          />
        )}
        getItemActions={getActions}
        actionsLabel={labels.actions}
        footer={
          onAdd ? (
            <Button
              data-slot="milestone-list-add"
              variant="ghost"
              size="sm"
              onClick={onAdd}
              className="-ms-2 self-start text-muted-foreground"
            >
              <Plus aria-hidden />
              {labels.add}
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
