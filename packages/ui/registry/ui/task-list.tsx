// @vegastack task-list@0.135.0 sha256-90Gt66SRB+j2CDsZrjFMctGuQchjBjJXezUyyzvDkIU=

"use client";

import * as React from "react";
import {
  ChevronRight,
  Circle,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CirclePause,
} from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { disclosureTriggerClasses } from "@/lib/disclosure-trigger";
import { formatDuration } from "@/lib/date-time";
import { Spinner } from "@/components/ui/spinner";
import { useAnnouncer } from "@/components/ui/use-announcer";

/* ------------------------------------------------------------------------------------------------
 * TaskList — an agent's live checklist for a longer job, above its answer.
 *
 * The host passes the whole list each time (the agent rewrites it wholesale); this component
 * decides what shows. A long list keeps the live item on top: finished items (done and skipped)
 * fold into one "✓ N done" row, the live item and up to eleven to do come next, and the rest fold
 * into "+N more". Each fold opens in place on its own. A grouped item (one finished item standing
 * for several) shows its members nested under it. Five or fewer rows never fold, and a row that
 * didn't finish or waits on a person never folds, so a problem is never hidden.
 *
 * Every string is the caller's to override through `labels`; the English defaults describe steps,
 * never what the agent is called.
 * ----------------------------------------------------------------------------------------------*/

/** Where one item stands. `in_progress` is the live item; there is at most one. */
export type TaskListItemStatus =
  "pending" | "in_progress" | "completed" | "skipped";

/** Where the whole list stands: still working, finished, or stopped before the end. */
export type TaskListState = "working" | "done" | "stopped";

/** One of the originals a grouped item stands for; it is always finished. */
export interface TaskListMember {
  /** A stable key; the member's position when omitted. @default undefined */
  id?: string;
  /** What it was: "Read part 3 of the transcript". */
  text: string;
  /** How it ended. */
  status: "completed" | "skipped";
  /** How long it took, in milliseconds. @default undefined */
  ms?: number | null;
}

/** The two folds of a long list: finished items, and items after the first twelve still open. */
export type TaskListFold = "done" | "more";

/** One item of a `TaskList`. */
export interface TaskListItem {
  /** A stable key; the item's position when omitted. @default undefined */
  id?: string;
  /** What the item is, in the imperative: "Create the PDF". */
  text: string;
  /** Where it stands. */
  status: TaskListItemStatus;
  /** The live item in the present tense, for the header: "Creating the PDF". @default undefined */
  doing?: string;
  /** How long the item took, in milliseconds, in the time column. @default undefined */
  ms?: number | null;
  /** Progress inside the item: "3 of 4 subagents done". @default undefined */
  progress?: React.ReactNode;
  /** Opens the item's own detail (its Subagents' steps); with it, `progress` is a button. @default undefined */
  onOpenProgress?: () => void;
  /** The item waits on a person: a "Waiting for you" badge and this action ("Answer"). @default undefined */
  waiting?: boolean;
  /** The action beside the waiting badge, e.g. a `Button` that opens the request. @default undefined */
  waitingAction?: React.ReactNode;
  /** A finished group: the items it stands for, shown nested under it and counted one by one. @default undefined */
  members?: readonly TaskListMember[];
}

/** The words a `TaskList` uses; every one has an English default. */
export interface TaskListLabels {
  /** Names the list. @default "Task list" */
  list: string;
  /** The header while working, from the live item: @default (doing) => `${doing}…` */
  working: (doing: string) => string;
  /** Count after the header: @default (done, total) => `${done} of ${total}` */
  count: (done: number, total: number) => string;
  /** The collapsed header and the progress bar: @default (step, total, text) => `Step ${step} of ${total} · ${text}` */
  step: (step: number, total: number, text: string) => string;
  /** The finished header: @default (total) => `Done · ${total} of ${total} steps` */
  done: (total: number) => string;
  /** The stopped header: @default (done, total) => `Stopped at ${done} of ${total}` */
  stopped: (done: number, total: number) => string;
  /** The waiting header: @default (text) => `Waiting for you · ${text}` */
  waitingHeader: (text: string) => string;
  /** The badge on a waiting item. @default "Waiting for you" */
  waiting: string;
  /** The fold of finished items, counted one by one (a group's members each count): @default (done, skipped) => `${done} done · ${skipped} skipped`, each part only when non-zero */
  doneFold: (done: number, skipped: number) => string;
  /** The fold of later items: @default (n) => `+${n} more` */
  moreFold: (count: number) => string;
  /** No longer shown: each fold now closes from its own row. @deprecated @default "Show less" */
  showLess: string;
  /** After a live item when the list stopped. @default "didn't finish" */
  didntFinish: string;
  /** After a pending item when the list stopped. @default "not done" */
  notDone: string;
  /** Read before each item, since the icon is what shows its state. @default { pending: "To do", in_progress: "In progress", completed: "Done", skipped: "Skipped" } */
  status: Record<TaskListItemStatus, string>;
  /** Read before an item that didn't finish. @default "Didn't finish" */
  unfinished: string;
  /** The polite announcement when the live item changes: @default (step, total, text) => `Step ${step} of ${total}: ${text}` */
  announce: (step: number, total: number, text: string) => string;
}

const DEFAULT_LABELS: TaskListLabels = {
  list: "Task list",
  working: (doing) => `${doing}…`,
  count: (done, total) => `${done} of ${total}`,
  step: (step, total, text) => `Step ${step} of ${total} · ${text}`,
  done: (total) => `Done · ${total} of ${total} steps`,
  stopped: (done, total) => `Stopped at ${done} of ${total}`,
  waitingHeader: (text) => `Waiting for you · ${text}`,
  waiting: "Waiting for you",
  doneFold: (done, skipped) =>
    [done ? `${done} done` : null, skipped ? `${skipped} skipped` : null]
      .filter(Boolean)
      .join(" · "),
  moreFold: (count) => `+${count} more`,
  showLess: "Show less",
  didntFinish: "didn't finish",
  notDone: "not done",
  status: {
    pending: "To do",
    in_progress: "In progress",
    completed: "Done",
    skipped: "Skipped",
  },
  unfinished: "Didn't finish",
  announce: (step, total, text) => `Step ${step} of ${total}: ${text}`,
};

/** Props accepted by `TaskList`. */
export interface TaskListProps extends Omit<
  React.ComponentProps<typeof Collapsible>,
  "className" | "children"
> {
  /** The whole list, in order; pass the latest version each time. */
  items: readonly TaskListItem[];
  /** Where the list stands. `stopped` keeps it open and turns unfinished rows amber. @default "working" */
  state?: TaskListState;
  /** Why it stopped, after the stopped header: "ran out of steps". @default undefined */
  reason?: React.ReactNode;
  /** A short muted line under the list: "Dropped the email step: no recipient". @default undefined */
  note?: React.ReactNode;
  /** When the work started, for the live timer while working (the server's time). @default undefined */
  startedAt?: Date | number | string;
  /** How long the whole job took, in milliseconds, once done or stopped. @default undefined */
  ms?: number | null;
  /** Words for a duration in milliseconds. @default (ms) => formatDuration(ms, { unit: "milliseconds" }) → "18s" */
  formatDuration?: (ms: number) => string;
  /** Which folds are open. Controlled; pair with `onOpenFoldsChange`. @default undefined */
  openFolds?: readonly TaskListFold[];
  /** The folds open at first. @default [] */
  defaultOpenFolds?: readonly TaskListFold[];
  /** Called when the reader opens or closes a fold (the host may remember it per chat). @default undefined */
  onOpenFoldsChange?: (folds: TaskListFold[]) => void;
  /** Every fold open, or every fold closed; both folds move together. Prefer `openFolds`. @default undefined */
  expanded?: boolean;
  /** Start with every fold open. Prefer `defaultOpenFolds`. @default false */
  defaultExpanded?: boolean;
  /** Called with the new state when the reader opens or closes a fold. Prefer `onOpenFoldsChange`. @default undefined */
  onExpandedChange?: (expanded: boolean) => void;
  /** Override any of the words. @default undefined */
  labels?: Partial<TaskListLabels>;
  /** Classes for the root. @default undefined */
  className?: string;
}

const formatMs = (ms: number) => formatDuration(ms, { unit: "milliseconds" });

/** How long a finished list stays open before it closes by itself. */
const AUTO_CLOSE_MS = 1000;
/** At most one announcement per this many milliseconds. */
const ANNOUNCE_GAP_MS = 3000;
/** After this long a tick or a rise has played and its flag is dropped. */
const MOTION_CLEAR_MS = 600;
/** A list of this many lines or fewer (a group's members count) never folds. */
const NEVER_FOLD = 5;
/** Open items in view: the live one and up to eleven to do (agent-context I7). */
const OPEN_SHOWN = 12;
/** A fold that would hide a single line is not worth its row. */
const FOLD_MIN = 2;
const ALL_FOLDS: readonly TaskListFold[] = ["done", "more"];

/** Milliseconds since `startedAt`, ticking each second while `running`; undefined before mount. */
function useElapsed(
  startedAt: Date | number | string | undefined,
  running: boolean,
): number | undefined {
  const [now, setNow] = React.useState<number | undefined>(undefined);
  React.useEffect(() => {
    if (!running || startedAt === undefined) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running, startedAt]);
  if (!running || startedAt === undefined || now === undefined)
    return undefined;
  return Math.max(0, now - new Date(startedAt).getTime());
}

type RowTone = TaskListItemStatus | "unfinished" | "waiting";

interface Row {
  key: string;
  index: number;
  item: TaskListItem;
  tone: RowTone;
}

const finished = (row: Row) =>
  row.tone === "completed" || row.tone === "skipped";
const linesOf = (row: Row) => 1 + (row.item.members?.length ?? 0);

/** The originals an item stands for: a group's members, or the item itself. */
function originals(
  item: TaskListItem,
): readonly { status: TaskListItemStatus }[] {
  return item.members?.length ? item.members : [item];
}
const countOf = (items: readonly TaskListItem[], status: TaskListItemStatus) =>
  items.reduce(
    (n, item) => n + originals(item).filter((o) => o.status === status).length,
    0,
  );

/**
 * How a list splits: finished rows behind "N done", the open rows in view, and the rest of the
 * open rows behind "+N more". Rows keep their order inside each part. Short lists, finished lists
 * and folds that would hide a single line don't fold.
 */
function foldRows(
  rows: readonly Row[],
  state: TaskListState,
  pinned: string | null = null,
): { done: Row[]; open: Row[]; later: Row[] } {
  const lines = rows.reduce((n, row) => n + linesOf(row), 0);
  if (state === "done" || lines <= NEVER_FOLD)
    return { done: [], open: [...rows], later: [] };
  // The live, unfinished and waiting rows always show; pending rows fill the rest of the twelve.
  const live = rows.filter((row) => !finished(row) && row.tone !== "pending");
  let room = Math.max(0, OPEN_SHOWN - live.length);
  const done: Row[] = [];
  const later: Row[] = [];
  for (const row of rows) {
    // A row holding the reader's focus stays where it is until focus leaves it.
    if (row.key === pinned) continue;
    if (finished(row)) done.push(row);
    else if (row.tone === "pending") {
      if (room > 0) room--;
      else later.push(row);
    }
  }
  const foldDone = done.reduce((n, row) => n + linesOf(row), 0) >= FOLD_MIN;
  const foldLater = later.length >= FOLD_MIN;
  const folded = new Set([
    ...(foldDone ? done : []),
    ...(foldLater ? later : []),
  ]);
  return {
    done: foldDone ? done : [],
    open: rows.filter((row) => !folded.has(row)),
    later: foldLater ? later : [],
  };
}

const ROW_ICON =
  "inline-flex h-7 w-4 shrink-0 items-center justify-center [&_svg:not([class*='size-'])]:size-3.5";

function RowIcon({ tone, ticked }: { tone: RowTone; ticked: boolean }) {
  switch (tone) {
    case "in_progress":
      return (
        <Spinner
          aria-hidden
          role={undefined}
          aria-label={undefined}
          className="size-3.5 text-foreground"
        />
      );
    case "completed":
      return (
        <CircleCheck
          aria-hidden
          className={cn("text-check", ticked && "motion-pop-in")}
        />
      );
    case "skipped":
      return <CircleDashed aria-hidden className="text-muted-foreground" />;
    case "unfinished":
      return (
        <CircleAlert
          aria-hidden
          data-icon-tone=""
          className="text-warning-text"
        />
      );
    case "waiting":
      return (
        <CirclePause
          aria-hidden
          data-icon-tone=""
          className="text-warning-text"
        />
      );
    default:
      return <Circle aria-hidden className="text-muted-foreground" />;
  }
}

/**
 * `TaskList` — the agent's live checklist for a longer job, above its answer: one disclosure whose
 * header names the live item and the count ("Creating the PDF… · 2 of 4 · 18s"), and whose rows
 * tick as the work moves. A long list keeps the live item on top: "✓ 6 done", the live item, the
 * next two, "+4 more". A finished list closes to "Done · 4 of 4 steps"; a stopped one stays open
 * with its unfinished rows in amber.
 *
 * Uncontrolled, it is open while working and closes once, a second after it finishes; once the
 * reader closes it, it stays closed. Control it with `open` and `onOpenChange`.
 *
 * @example
 * <TaskList
 *   startedAt={startedAt}
 *   items={[
 *     { text: "Find my open tasks", status: "completed", ms: 4000 },
 *     { text: "Create the PDF", status: "in_progress", doing: "Creating the PDF" },
 *     { text: "Reply with the file", status: "pending" },
 *   ]}
 * />
 */
export function TaskList({
  items,
  state = "working",
  reason,
  note,
  startedAt,
  ms,
  formatDuration: format = formatMs,
  openFolds: openFoldsProp,
  defaultOpenFolds,
  onOpenFoldsChange,
  expanded: expandedProp,
  defaultExpanded = false,
  onExpandedChange,
  labels: labelsProp,
  open: openProp,
  defaultOpen,
  onOpenChange,
  className,
  ref,
  ...props
}: TaskListProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  // A group counts each of its members, so the count and the step say what was really done.
  const total = items.reduce((n, item) => n + originals(item).length, 0);
  const doneCount = countOf(items, "completed");

  let step = 0;
  const rows: Row[] = items.map((item, position) => ({
    key: item.id ?? String(position),
    index: (step += originals(item).length) - 1,
    item,
    tone:
      item.waiting && item.status !== "completed"
        ? "waiting"
        : state === "stopped" && item.status === "in_progress"
          ? "unfinished"
          : item.status,
  }));
  const liveRow =
    rows.find((row) => row.tone === "waiting") ??
    rows.find((row) => row.tone === "in_progress" || row.tone === "unfinished");

  // The whole block's disclosure, like MessageActivity: open while working, closed after done.
  const [ownOpen, setOwnOpen] = React.useState(defaultOpen ?? state !== "done");
  const open = openProp ?? ownOpen;
  const touched = React.useRef(defaultOpen === false);
  const root = React.useRef<HTMLDivElement>(null);
  const rootRef = React.useMemo(
    () => mergeRefs<HTMLDivElement>(root, ref),
    [ref],
  );
  const wasState = React.useRef(state);
  React.useEffect(() => {
    const previous = wasState.current;
    wasState.current = state;
    if (openProp !== undefined || touched.current || previous === state) return;
    if (state !== "done") {
      setOwnOpen(true);
      return;
    }
    const timer = setTimeout(() => {
      const focused = root.current?.contains(document.activeElement) ?? false;
      if (!touched.current && !focused) setOwnOpen(false);
    }, AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [state, openProp]);

  // The folds: each opens in place on its own, and its row stays where it was (focus stays on it).
  const [ownFolds, setOwnFolds] = React.useState<readonly TaskListFold[]>(
    () => defaultOpenFolds ?? (defaultExpanded ? ALL_FOLDS : []),
  );
  const openFolds =
    openFoldsProp ??
    (expandedProp === undefined ? ownFolds : expandedProp ? ALL_FOLDS : []);
  const setFold = (fold: TaskListFold, next: boolean) => {
    const folds = ALL_FOLDS.filter((f) =>
      f === fold ? next : openFolds.includes(f),
    );
    setOwnFolds(folds);
    onOpenFoldsChange?.(folds);
    onExpandedChange?.(next);
  };
  // A row holding the reader's focus stays put until focus leaves it, even if the window moves on.
  const [pinned, setPinned] = React.useState<string | null>(null);
  const { done, open: openRows, later } = foldRows(rows, state, pinned);
  const doneOpen = openFolds.includes("done");
  const moreOpen = openFolds.includes("more");
  const visible = [
    ...(doneOpen ? done : []),
    ...openRows,
    ...(moreOpen ? later : []),
  ];
  const doneItems = done.map((row) => row.item);
  const foldId = React.useId();

  // Motion only on a live change, never on first paint: a row that ticks pops its check, a row that
  // slides into the window rises in. Previous values live in refs read inside the effect only.
  const [fresh, setFresh] = React.useState<{
    ticked: ReadonlySet<string>;
    entered: ReadonlySet<string>;
  }>({ ticked: new Set(), entered: new Set() });
  const seen = React.useRef<{
    status: Map<string, TaskListItemStatus>;
    visible: Set<string>;
  } | null>(null);
  const visibleKeys = visible.map((row) => row.key).join("\u0000");
  const statusKeys = rows
    .map((row) => `${row.key}=${row.item.status}`)
    .join("\u0000");
  React.useEffect(() => {
    const status = new Map(rows.map((row) => [row.key, row.item.status]));
    const shown = new Set(visible.map((row) => row.key));
    const before = seen.current;
    seen.current = { status, visible: shown };
    if (!before) return;
    const ticked = new Set<string>();
    let moved = false;
    for (const [key, value] of status) {
      if (before.status.get(key) !== value) moved = true;
      if (value === "completed" && before.status.get(key) !== "completed")
        ticked.add(key);
    }
    // A reader opening a fold is not a live change: nothing animates.
    if (!moved) return;
    const entered = new Set<string>();
    for (const key of shown) if (!before.visible.has(key)) entered.add(key);
    if (ticked.size || entered.size) setFresh({ ticked, entered });
    // Keyed on the strings, which change exactly when a status or the window does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleKeys, statusKeys]);

  // The flags are one-shot: cleared once the motion has played, so a remount never replays it.
  React.useEffect(() => {
    if (!fresh.ticked.size && !fresh.entered.size) return;
    const timer = setTimeout(
      () => setFresh({ ticked: new Set(), entered: new Set() }),
      MOTION_CLEAR_MS,
    );
    return () => clearTimeout(timer);
  }, [fresh]);

  // A polite announcement when the live item changes, at most one per 3s; the end once.
  const { announce, Announcer } = useAnnouncer();
  const liveKey = liveRow ? `${liveRow.key}:${liveRow.tone}` : "";
  const message =
    state === "done"
      ? labels.done(total)
      : state === "stopped"
        ? labels.stopped(doneCount, total)
        : liveRow
          ? liveRow.tone === "waiting"
            ? labels.waitingHeader(liveRow.item.text)
            : labels.announce(liveRow.index + 1, total, liveRow.item.text)
          : "";
  // The event: a new live item while working, or the end. First paint is the baseline, never spoken.
  const event = state === "working" ? `working:${liveKey}` : state;
  const lastEvent = React.useRef(event);
  const lastSpoken = React.useRef({ at: 0, text: "" });
  React.useEffect(() => {
    if (lastEvent.current === event) return;
    lastEvent.current = event;
    if (!message || message === lastSpoken.current.text) return;
    const speak = () => {
      lastSpoken.current = { at: Date.now(), text: message };
      announce(message);
    };
    const wait = lastSpoken.current.at + ANNOUNCE_GAP_MS - Date.now();
    if (wait <= 0) {
      speak();
      return;
    }
    // A newer event before the gap ends replaces this one (cleanup), so only the latest is spoken.
    const timer = setTimeout(speak, wait);
    return () => clearTimeout(timer);
    // `message` follows `event`; the closure is this committed render's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, announce]);

  const elapsed = useElapsed(startedAt, state === "working");
  const time =
    state === "working"
      ? elapsed !== undefined
        ? format(elapsed)
        : null
      : ms != null
        ? format(ms)
        : null;

  let headerIcon: React.ReactNode;
  let headerText: string;
  let headerCount: string | null = labels.count(doneCount, total);
  if (state === "done") {
    headerIcon = (
      <CircleCheck aria-hidden data-icon-tone="" className="text-check" />
    );
    headerText = labels.done(total);
    headerCount = null;
  } else if (state === "stopped") {
    headerIcon = (
      <CircleAlert
        aria-hidden
        data-icon-tone=""
        className="text-warning-text"
      />
    );
    headerText = labels.stopped(doneCount, total);
    headerCount = null;
  } else if (liveRow?.tone === "waiting") {
    headerIcon = (
      <CirclePause
        aria-hidden
        data-icon-tone=""
        className="text-warning-text"
      />
    );
    headerText = labels.waitingHeader(liveRow.item.text);
  } else if (liveRow) {
    headerIcon = (
      <Spinner
        aria-hidden
        role={undefined}
        aria-label={undefined}
        className="size-3.5"
      />
    );
    headerText =
      open && liveRow.item.doing
        ? labels.working(liveRow.item.doing)
        : labels.step(liveRow.index + 1, total, liveRow.item.text);
    if (!open || !liveRow.item.doing) headerCount = null;
  } else {
    headerIcon = (
      <Spinner
        aria-hidden
        role={undefined}
        aria-label={undefined}
        className="size-3.5"
      />
    );
    headerText = labels.count(doneCount, total);
    headerCount = null;
  }

  return (
    <Collapsible
      ref={rootRef}
      data-slot="task-list"
      data-state={state}
      open={open}
      onOpenChange={(next, details) => {
        touched.current = true;
        setOwnOpen(next);
        onOpenChange?.(next, details);
      }}
      className={cn(
        "@container/task-list flex w-full min-w-0 flex-col items-stretch gap-1",
        className,
      )}
      {...props}
    >
      <CollapsibleTrigger
        data-slot="task-list-trigger"
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              disclosureTriggerClasses,
              "group/task-list -ms-2 max-w-full min-w-0 gap-1.5 self-start text-sm font-normal text-foreground",
            )}
          />
        }
      >
        <span
          aria-hidden
          className="inline-flex shrink-0 [&_svg:not([class*='size-'])]:size-3.5"
        >
          {headerIcon}
        </span>
        <span data-slot="task-list-summary" className={cn("min-w-0 truncate")}>
          {headerText}
          {state === "stopped" && reason != null ? <> · {reason}</> : null}
        </span>
        {headerCount || time ? (
          <span
            data-slot="task-list-meta"
            aria-hidden={state === "working" ? true : undefined}
            className="shrink-0 text-muted-foreground tabular-nums"
          >
            {`· ${[headerCount, time].filter(Boolean).join(" · ")}`}
          </span>
        ) : null}
        <ChevronRight
          aria-hidden
          className="text-muted-foreground transition-transform group-aria-expanded/task-list:rotate-90"
        />
      </CollapsibleTrigger>
      <CollapsibleContent
        data-slot="task-list-content"
        className="w-full min-w-0"
      >
        <div className="flex min-w-0 flex-col rounded-card border border-border bg-card px-2 py-1">
          {done.length > 0 ? (
            <Fold
              id={`${foldId}-done`}
              slot="task-list-done-fold"
              open={doneOpen}
              onOpenChange={(next) => setFold("done", next)}
              icon={
                <CircleCheck
                  aria-hidden
                  data-icon-tone=""
                  className="text-check"
                />
              }
              label={labels.doneFold(
                countOf(doneItems, "completed"),
                countOf(doneItems, "skipped"),
              )}
            >
              {done.map((row) => (
                <TaskListRow
                  key={row.key}
                  row={row}
                  state={state}
                  labels={labels}
                  format={format}
                  ticked={fresh.ticked.has(row.key)}
                  entered={fresh.entered.has(row.key)}
                  onFocus={() => setPinned(row.key)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget))
                      setPinned((key) => (key === row.key ? null : key));
                  }}
                />
              ))}
            </Fold>
          ) : null}
          <ol aria-label={labels.list} className="flex min-w-0 flex-col">
            {openRows.map((row) => (
              <TaskListRow
                key={row.key}
                row={row}
                state={state}
                labels={labels}
                format={format}
                ticked={fresh.ticked.has(row.key)}
                entered={fresh.entered.has(row.key)}
                onFocus={() => setPinned(row.key)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget))
                    setPinned((key) => (key === row.key ? null : key));
                }}
              />
            ))}
          </ol>
          {later.length > 0 ? (
            <Fold
              id={`${foldId}-more`}
              slot="task-list-more-fold"
              open={moreOpen}
              onOpenChange={(next) => setFold("more", next)}
              label={labels.moreFold(later.length)}
            >
              {later.map((row) => (
                <TaskListRow
                  key={row.key}
                  row={row}
                  state={state}
                  labels={labels}
                  format={format}
                  ticked={fresh.ticked.has(row.key)}
                  entered={fresh.entered.has(row.key)}
                  onFocus={() => setPinned(row.key)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget))
                      setPinned((key) => (key === row.key ? null : key));
                  }}
                />
              ))}
            </Fold>
          ) : null}
        </div>
        {note != null ? (
          <p
            data-slot="task-list-note"
            className="px-2 pt-1 text-xs text-muted-foreground"
          >
            {note}
          </p>
        ) : null}
      </CollapsibleContent>
      <Announcer />
    </Collapsible>
  );
}

/** One fold of a long list: a row that opens in place to the items it holds, as their own list. */
function Fold({
  id,
  slot,
  icon,
  label,
  open,
  onOpenChange,
  children,
}: {
  id: string;
  slot: string;
  icon?: React.ReactNode;
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Collapsible
      data-slot={`${slot}-root`}
      open={open}
      onOpenChange={(next) => onOpenChange(next)}
      className="flex min-w-0 flex-col"
    >
      <CollapsibleTrigger
        id={id}
        data-slot={slot}
        render={
          <Button
            variant="ghost"
            size="sm"
            className="group/fold -ms-1 max-w-full min-w-0 gap-2 self-start ps-1 text-sm font-normal text-muted-foreground hover:text-foreground"
          />
        }
      >
        <span aria-hidden className={cn(ROW_ICON, "h-auto")}>
          {icon}
        </span>
        <span className="min-w-0 truncate">{label}</span>
        <ChevronRight
          aria-hidden
          className="transition-transform duration-state ease-enter group-aria-expanded/fold:rotate-90"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ol aria-labelledby={id} className="flex min-w-0 flex-col">
          {children}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
}

function TaskListRow({
  row,
  state,
  labels,
  format,
  ticked,
  entered,
  onFocus,
  onBlur,
}: {
  onFocus: () => void;
  onBlur: (event: React.FocusEvent<HTMLLIElement>) => void;
  row: Row;
  state: TaskListState;
  labels: TaskListLabels;
  format: (ms: number) => string;
  ticked: boolean;
  entered: boolean;
}) {
  const { item, tone } = row;
  const stoppedPending = state === "stopped" && tone === "pending";
  const srState =
    tone === "unfinished"
      ? labels.unfinished
      : tone === "waiting"
        ? labels.waiting
        : labels.status[item.status];
  return (
    <li
      data-slot="task-list-item"
      data-status={item.status}
      data-tone={tone}
      onFocus={onFocus}
      onBlur={onBlur}
      className={cn("flex min-w-0 flex-col", entered && "motion-enter-up")}
    >
      <div className="flex min-w-0 items-start gap-2 text-sm">
        <span aria-hidden className={ROW_ICON}>
          <RowIcon tone={tone} ticked={ticked} />
        </span>
        <div className="flex min-h-7 min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 py-1">
          <span className="sr-only">{srState}:</span>
          <span
            data-slot="task-list-item-text"
            className={cn(
              "min-w-0",
              tone === "in_progress" && "font-medium text-foreground",
              tone === "pending" && "text-muted-foreground",
              tone === "completed" && "text-muted-foreground",
              tone === "skipped" && "text-muted-foreground line-through",
              tone === "unfinished" && "text-foreground",
              tone === "waiting" && "text-foreground",
            )}
          >
            {item.text}
            {tone === "unfinished" ? (
              <span className="text-muted-foreground">
                {" "}
                · {labels.didntFinish}
              </span>
            ) : null}
            {stoppedPending ? (
              <span className="text-muted-foreground"> · {labels.notDone}</span>
            ) : null}
          </span>
          {item.progress != null ? (
            item.onOpenProgress ? (
              <Button
                variant="ghost"
                size="xs"
                data-slot="task-list-item-progress"
                onClick={item.onOpenProgress}
                className="-my-1 font-normal text-muted-foreground hover:text-foreground"
              >
                {item.progress}
                <ChevronRight aria-hidden />
              </Button>
            ) : (
              <span
                data-slot="task-list-item-progress"
                className="text-xs text-muted-foreground"
              >
                {item.progress}
              </span>
            )
          ) : null}
          {tone === "waiting" ? (
            <span
              data-slot="task-list-item-waiting"
              className="inline-flex items-center gap-2"
            >
              <Badge variant="outline">{labels.waiting}</Badge>
              {item.waitingAction}
            </span>
          ) : null}
        </div>
        {item.ms != null ? (
          <span
            data-slot="task-list-item-time"
            className="shrink-0 py-1 text-xs/5 text-muted-foreground tabular-nums @max-sm/task-list:hidden"
          >
            {format(item.ms)}
          </span>
        ) : null}
      </div>
      {item.members?.length ? (
        // A group's members, nested under its text: the originals it stands for, each read with its state.
        <ol
          data-slot="task-list-item-members"
          className="flex min-w-0 flex-col ps-6"
        >
          {item.members.map((member, index) => (
            <li
              key={member.id ?? String(index)}
              data-slot="task-list-member"
              data-status={member.status}
              className="flex min-w-0 items-start gap-2 text-sm"
            >
              <span aria-hidden className={ROW_ICON}>
                <RowIcon tone={member.status} ticked={false} />
              </span>
              <span className="min-h-7 min-w-0 flex-1 py-1">
                <span className="sr-only">{labels.status[member.status]}:</span>
                <span
                  className={cn(
                    "text-muted-foreground",
                    member.status === "skipped" && "line-through",
                  )}
                >
                  {member.text}
                </span>
              </span>
              {member.ms != null ? (
                <span className="shrink-0 py-1 text-xs/5 text-muted-foreground tabular-nums @max-sm/task-list:hidden">
                  {format(member.ms)}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
    </li>
  );
}

/** Props accepted by `TaskListProgress`. */
export interface TaskListProgressProps extends Omit<
  React.ComponentProps<typeof Button>,
  "children"
> {
  /** The live item's 1-based position. */
  step: number;
  /** How many items the list has. */
  total: number;
  /** The live item: "Create the PDF". */
  text: string;
  /** How many are done, for the track. @default step - 1 */
  done?: number;
  /** The item waits on a person: a pause mark and the waiting words. @default false */
  waiting?: boolean;
  /** Override the words. @default undefined */
  labels?: Partial<Pick<TaskListLabels, "step" | "waitingHeader">>;
}

/**
 * `TaskListProgress` — the slim bar that stays in view while a long chat scrolls the task list away:
 * "Step 3 of 9 · Create the PDF" over a thin track. It is a button; the host scrolls back to the list
 * on click, pins it (`sticky top-0`) and removes it when the run ends.
 *
 * @example
 * <TaskListProgress className="sticky top-0" step={3} total={9} text="Create the PDF" onClick={scrollToList} />
 */
export function TaskListProgress({
  step,
  total,
  text,
  done = step - 1,
  waiting = false,
  labels: labelsProp,
  className,
  ...props
}: TaskListProgressProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const share =
    total > 0 ? Math.min(100, Math.max(0, (done / total) * 100)) : 0;
  return (
    <Button
      variant="ghost"
      data-slot="task-list-progress"
      data-waiting={waiting ? "" : undefined}
      className={cn(
        "relative h-auto w-full min-w-0 flex-col items-stretch rounded-item bg-background px-3 pt-1.5 pb-2.5 font-normal",
        className,
      )}
      {...props}
    >
      <span className="flex min-w-0 items-center gap-1.5 text-sm">
        <span
          aria-hidden
          className="inline-flex shrink-0 [&_svg:not([class*='size-'])]:size-3.5"
        >
          {waiting ? (
            <CirclePause data-icon-tone="" className="text-warning-text" />
          ) : (
            <Spinner
              role={undefined}
              aria-label={undefined}
              className="size-3.5"
            />
          )}
        </span>
        <span className="min-w-0 truncate">
          {waiting
            ? labels.waitingHeader(text)
            : labels.step(step, total, text)}
        </span>
      </span>
      <span
        aria-hidden
        className="absolute inset-x-3 bottom-1 block h-0.5 overflow-hidden rounded-full bg-muted"
      >
        <span
          data-slot="task-list-progress-track"
          className="block h-full rounded-full bg-primary transition-[width] duration-state ease-enter"
          style={{ width: `${share}%` }}
        />
      </span>
    </Button>
  );
}
