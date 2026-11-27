// @vegastack run-timeline@0.136.7 sha256-LJwrVd9r+HttZhbFJGZ4KaB/4vQxEIuqzFblzMVzY0o=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";

import { Button } from "@/components/ui/button";
import { formatChatDuration } from "@/components/ui/chat-card";
import { ChatClock } from "@/components/ui/chat-work-log";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { TextSpinner } from "@/components/ui/text-spinner";

/* ------------------------------------------------------------------------------------------------
 * RunTimeline — what an agent's run did, step by step, in the chat work log's own anatomy: each
 * step a muted verb, its subject in the body ink, muted meta (cost and duration), one hairline
 * guide down the side and no per-row icon. A run page adds only what it needs on top: an ordered
 * list, per-step cost, the permission decision with "Why?", Undo, a delivery that isn't known yet,
 * and folding. The run's live state is one bolt in its header line, never one per row. Long runs of
 * tool steps fold, so a thousand steps stay a short page until opened; a step that is running,
 * waiting or broke never folds, so what is happening now and what went wrong stay in view.
 * ----------------------------------------------------------------------------------------------*/

/** What a step is. */
export type RunStepKind =
  "turn" | "tool" | "subagent" | "handoff" | "approval" | "wait" | "error";

/** Where a step stands. */
export type RunStepStatus =
  | "running"
  | "done"
  | "failed"
  | "waiting"
  | "skipped"
  | "stopped"
  | "delivery_unknown";

/** One step of a run. */
export type RunTimelineStep = {
  /** A stable key. */
  id: string;
  /** What it is; picks the muted verb before the title. */
  kind: RunStepKind;
  /** The step's subject: "Searched “Acme supplier dates”", "Gmail › Send to ravi@acme.com". */
  title: string;
  /** Where it stands. */
  status: RunStepStatus;
  /** When it started (ISO); a running step counts up from it. */
  startedAt: string;
  /** How long it took. */
  durationMs?: number;
  /** Its cost, formatted by the caller: "₹0.42". */
  cost?: string;
  /** The permission decision behind it: answer, who or what decided, the rule, and "Why?". */
  decision?: {
    answer: "allow" | "auto_check" | "ask" | "block";
    by: string;
    rule?: string;
    why?: { href: string };
  };
  /** More about the step, opened in place. */
  detail?: React.ReactNode;
  /** A subagent's or hand-off's own steps. */
  children?: RunTimelineStep[];
  /** Undo what the step did. */
  onUndo?: () => void;
  /** Who undid it. */
  undoneBy?: string;
};

/** Props accepted by `RunTimeline`. */
export interface RunTimelineProps {
  /** The steps, in order. */
  steps: RunTimelineStep[];
  /** The run's summary at the header's end, such as a `RunUsageChip`. @default undefined */
  summary?: React.ReactNode;
  /** Consecutive tool steps shown before the rest fold into "N more steps"; running, waiting and failed steps never fold. @default 5 */
  collapseRuns?: number;
  /** A step's detail was opened. @default undefined */
  onExpand?: (stepId: string) => void;
  /** Classes for the root. @default undefined */
  className?: string;
}

/** The muted verb before each kind of step. */
const KIND_VERB: Record<RunStepKind, string> = {
  turn: "Thought",
  tool: "Used",
  subagent: "Subagent",
  handoff: "Handed off",
  approval: "Asked",
  wait: "Waited",
  error: "Stopped",
};

const DECISION_WORDS: Record<
  NonNullable<RunTimelineStep["decision"]>["answer"],
  string
> = {
  allow: "Allowed",
  auto_check: "Auto-checked",
  ask: "Asked",
  block: "Blocked",
};

/** Words for the statuses a row states; a done step says nothing. */
const STATUS_WORDS: Partial<Record<RunStepStatus, string>> = {
  waiting: "Waiting",
  skipped: "Skipped",
  stopped: "Stopped",
  delivery_unknown: "Delivery unknown · checking before any retry",
};

/**
 * True when a step must stay in view: it is running or waiting (what is happening now), it broke,
 * or one of its own steps is in one of those states.
 */
function staysOpen(step: RunTimelineStep): boolean {
  return (
    step.status === "running" ||
    step.status === "waiting" ||
    step.status === "failed" ||
    step.kind === "error" ||
    (step.children?.some(staysOpen) ?? false)
  );
}

/** Splits `items` into the ones shown and runs of the rest, kept in order. */
function hideBetween<T>(
  items: T[],
  shown: (item: T, index: number) => boolean,
): ({ shown: true; item: T } | { shown: false; items: T[] })[] {
  const out: ({ shown: true; item: T } | { shown: false; items: T[] })[] = [];
  let hidden: T[] = [];
  items.forEach((item, index) => {
    if (!shown(item, index)) {
      hidden.push(item);
      return;
    }
    if (hidden.length) out.push({ shown: false, items: hidden });
    hidden = [];
    out.push({ shown: true, item });
  });
  if (hidden.length) out.push({ shown: false, items: hidden });
  return out;
}

/**
 * Turns a step list into rows and folds: tool steps past `limit` in a row fold together, except a
 * step that stays open, which splits the fold around itself.
 */
function fold(
  steps: RunTimelineStep[],
  limit: number,
): (
  | { type: "step"; step: RunTimelineStep }
  | { type: "fold"; key: string; steps: RunTimelineStep[] }
)[] {
  const out: ReturnType<typeof fold> = [];
  let run: RunTimelineStep[] = [];
  const flush = () => {
    for (const part of hideBetween(
      run,
      (step, index) => index < limit || staysOpen(step),
    ))
      out.push(
        part.shown
          ? { type: "step", step: part.item }
          : { type: "fold", key: part.items[0]!.id, steps: part.items },
      );
    run = [];
  };
  for (const step of steps) {
    if (step.kind === "tool") run.push(step);
    else {
      flush();
      out.push({ type: "step", step });
    }
  }
  flush();
  return out;
}

/** True when any step, nested ones included, is in `status`. */
function some(steps: RunTimelineStep[], status: RunStepStatus): boolean {
  return steps.some(
    (step) =>
      step.status === status ||
      (step.children ? some(step.children, status) : false),
  );
}

/** One step: verb, subject, meta, its status words, decision, Undo and its own steps. */
function StepRow({
  step,
  collapseRuns,
  onExpand,
}: {
  step: RunTimelineStep;
  collapseRuns: number;
  onExpand?: (stepId: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  // A branch that is running or waiting, or holds a step that is or broke, opens and stays open:
  // what is happening now and what went wrong are never hidden, including when it starts later.
  const [nestedOpen, setNestedOpen] = React.useState(false);
  if (
    !nestedOpen &&
    (step.status === "running" ||
      step.status === "waiting" ||
      (step.children?.some(staysOpen) ?? false))
  )
    setNestedOpen(true);
  const detailId = React.useId();
  const failed = step.status === "failed" || step.kind === "error";
  const words = STATUS_WORDS[step.status];
  return (
    <li
      data-slot="run-timeline-step"
      data-kind={step.kind}
      data-status={step.status}
      className="flex min-w-0 flex-col gap-0.5"
    >
      <div className="flex min-h-7 min-w-0 items-center gap-2 text-sm">
        {failed ? (
          <StatusGlyph status="needs-you" label="Couldn't finish" />
        ) : null}
        <span
          data-slot="run-timeline-verb"
          className="shrink-0 text-muted-foreground"
        >
          {KIND_VERB[step.kind]}
        </span>{" "}
        <span
          data-slot="run-timeline-title"
          className={cn(
            "min-w-0 truncate",
            step.undoneBy || step.status === "skipped"
              ? "text-muted-foreground line-through decoration-muted-foreground/60"
              : "text-foreground",
          )}
          title={step.title}
        >
          {step.title}
        </span>{" "}
        <span
          data-slot="run-timeline-meta"
          className="ms-auto flex shrink-0 items-center gap-2 text-xs text-muted-foreground tabular-nums"
        >
          {step.cost ? (
            <span data-slot="run-timeline-cost">{step.cost}</span>
          ) : null}
          {step.status === "running" ? (
            <ChatClock startedAt={step.startedAt} className="text-end" />
          ) : step.durationMs != null ? (
            <span>{formatChatDuration(step.durationMs)}</span>
          ) : null}
        </span>
      </div>
      {words || step.decision || step.onUndo || step.undoneBy || step.detail ? (
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {words ? (
            <span data-slot="run-timeline-status" className="min-w-0">
              {words}
            </span>
          ) : null}
          {step.decision ? (
            <span data-slot="run-timeline-decision" className="min-w-0">
              {DECISION_WORDS[step.decision.answer]} · {step.decision.by}
              {step.decision.rule ? ` · ${step.decision.rule}` : ""}
              {step.decision.why ? (
                <>
                  {" "}
                  <a
                    href={step.decision.why.href}
                    className="relative text-foreground underline-offset-4 before:absolute before:-inset-1 before:content-[''] hover:underline"
                  >
                    Why?
                  </a>
                </>
              ) : null}
            </span>
          ) : null}
          {step.undoneBy ? (
            <span data-slot="run-timeline-undone">
              Undone by {step.undoneBy}
            </span>
          ) : step.onUndo ? (
            <Button
              size="xs"
              variant="ghost"
              className="-my-1 text-muted-foreground"
              onClick={step.onUndo}
            >
              Undo
            </Button>
          ) : null}
          {step.detail != null ? (
            <Button
              size="xs"
              variant="ghost"
              aria-expanded={open}
              aria-controls={detailId}
              className="-my-1 text-muted-foreground aria-expanded:bg-transparent"
              onClick={() => {
                if (!open) onExpand?.(step.id);
                setOpen((value) => !value);
              }}
            >
              {open ? "Hide details" : "Details"}
            </Button>
          ) : null}
        </div>
      ) : null}
      {step.detail != null && open ? (
        <div
          id={detailId}
          data-slot="run-timeline-detail"
          className="min-w-0 py-1 text-sm"
        >
          {step.detail}
        </div>
      ) : null}
      {step.children?.length ? (
        // A subagent's own steps start folded, as the chat's Subagents block does, so a deep run
        // draws only its top level until someone opens a branch.
        nestedOpen ? (
          <StepList
            steps={step.children}
            collapseRuns={collapseRuns}
            onExpand={onExpand}
            nested
            label={step.title}
          />
        ) : (
          <div className="flex min-w-0">
            <Button
              size="xs"
              variant="ghost"
              aria-expanded={false}
              className="-ms-2 text-muted-foreground"
              onClick={() => setNestedOpen(true)}
            >
              {step.children.length === 1
                ? "Show 1 step"
                : `Show ${step.children.length} steps`}
            </Button>
          </div>
        )
      ) : null}
    </li>
  );
}

/** A fold: "38 more steps", opened in place. */
function MoreSteps({ count, onOpen }: { count: number; onOpen: () => void }) {
  return (
    <li data-slot="run-timeline-fold" className="flex min-w-0">
      <Button
        size="xs"
        variant="ghost"
        className="-ms-2 text-muted-foreground"
        onClick={onOpen}
      >
        {count === 1 ? "1 more step" : `${count} more steps`}
      </Button>
    </li>
  );
}

/** Rows a list draws before the rest wait behind "N more steps", so any long run stays small. */
const ROW_BUDGET = 25;

type Entry = ReturnType<typeof fold>[number];

const entrySteps = (entry: Entry) =>
  entry.type === "step" ? [entry.step] : entry.steps;

function StepList({
  steps,
  collapseRuns,
  onExpand,
  nested = false,
  label,
}: {
  steps: RunTimelineStep[];
  collapseRuns: number;
  onExpand?: (stepId: string) => void;
  nested?: boolean;
  label?: string;
}) {
  // What someone opened, by step id: the steps of a fold (`folds`) and the rows past the budget
  // (`rest`). Kept by id, and every row is one keyed child of this list, so when a fold splits
  // around a step that turns live or fails, nothing re-folds or remounts (open details, focus).
  const [opened, setOpened] = React.useState<{
    folds: ReadonlySet<string>;
    rest: ReadonlySet<string>;
  }>(() => ({ folds: new Set(), rest: new Set() }));
  const open = (key: "folds" | "rest", from: RunTimelineStep[]) =>
    setOpened((prev) => ({
      ...prev,
      [key]: new Set([...prev[key], ...from.map((step) => step.id)]),
    }));
  const row = (step: RunTimelineStep) => (
    <StepRow
      key={`step:${step.id}`}
      step={step}
      collapseRuns={collapseRuns}
      onExpand={onExpand}
    />
  );
  const rows: React.ReactNode[] = [];
  const addEntry = (entry: Entry) => {
    if (entry.type === "step") {
      rows.push(row(entry.step));
      return;
    }
    for (const part of hideBetween(entry.steps, (step) =>
      opened.folds.has(step.id),
    ))
      rows.push(
        part.shown ? (
          row(part.item)
        ) : (
          <MoreSteps
            key={`fold:${part.items[0]!.id}`}
            count={part.items.length}
            onOpen={() => open("folds", part.items)}
          />
        ),
      );
  };
  const entries = fold(steps, collapseRuns);
  entries.slice(0, ROW_BUDGET).forEach(addEntry);
  // Past the budget, rows wait behind one "N more steps", except a step that stays open and
  // anything already opened (a fold whose split pushed it past the budget stays open).
  for (const part of hideBetween(
    entries.slice(ROW_BUDGET),
    (entry) =>
      (entry.type === "step" && staysOpen(entry.step)) ||
      entrySteps(entry).some(
        (step) => opened.rest.has(step.id) || opened.folds.has(step.id),
      ),
  )) {
    if (part.shown) {
      addEntry(part.item);
      continue;
    }
    const hidden = part.items.flatMap(entrySteps);
    rows.push(
      <MoreSteps
        key={`rest:${hidden[0]!.id}`}
        count={hidden.length}
        onOpen={() => open("rest", hidden)}
      />,
    );
  }
  return (
    <ol
      aria-label={nested ? `Steps of ${label}` : "Steps"}
      data-slot="run-timeline-steps"
      className={cn(
        "flex min-w-0 flex-col gap-1 border-s border-chat-hairline ps-4",
        nested ? "ms-1 mt-1" : "ms-1.5",
      )}
    >
      {rows}
    </ol>
  );
}

/**
 * `RunTimeline` — an agent run's steps in the work log's anatomy, with per-step cost, decisions,
 * Undo and folding; one live bolt for the whole run.
 *
 * @example
 * <RunTimeline
 *   steps={run.steps}
 *   summary={<RunUsageChip usage={run.usage} />}
 *   onExpand={(stepId) => loadStepDetail(stepId)}
 * />
 */
export function RunTimeline({
  steps,
  summary,
  collapseRuns = 5,
  onExpand,
  className,
}: RunTimelineProps) {
  const running = some(steps, "running");
  const waiting = !running && some(steps, "waiting");
  return (
    <section
      data-slot="run-timeline"
      data-live={running ? "running" : waiting ? "waiting" : undefined}
      aria-label="Run steps"
      aria-busy={running || undefined}
      className={cn("flex min-w-0 flex-col gap-2", className)}
    >
      {running || waiting || summary != null ? (
        <header
          data-slot="run-timeline-header"
          className="flex min-h-7 min-w-0 items-center gap-2 text-sm text-muted-foreground"
        >
          {running ? (
            <>
              <TextSpinner variant="working" label="" />
              <span>Working</span>
            </>
          ) : waiting ? (
            <>
              <TextSpinner variant="waiting" label="" />
              <span>Waiting</span>
            </>
          ) : null}
          {summary != null ? (
            <span
              data-slot="run-timeline-summary"
              className="ms-auto flex min-w-0"
            >
              {summary}
            </span>
          ) : null}
        </header>
      ) : null}
      {steps.length === 0 ? (
        <p className="text-sm text-muted-foreground">No steps yet</p>
      ) : (
        <StepList
          steps={steps}
          collapseRuns={collapseRuns}
          onExpand={onExpand}
        />
      )}
    </section>
  );
}
