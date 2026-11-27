// @vegastack chat-subagents@0.136.8 sha256-OdHSL5xPT7xDNwUMZ72NMCbrAeFQEQCirE3qluj3xcw=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChatGroup, formatChatDuration } from "@/components/ui/chat-card";
import { ChatChip } from "@/components/ui/chat-chip";
import { StatusGlyph } from "@/components/ui/status-glyph";
import {
  isToolRunning,
  wordsOf,
  type ChatToolPart,
} from "@/components/ui/chat-work-log";

/* ------------------------------------------------------------------------------------------------
 * Subagents: one block per turn, whose rows open beside the chat.
 *
 * While the turn runs the rows show at once (the turn's live line already carries its one spinner,
 * so the block has none): a status word, the short title the engine gave the Subagent, and quiet
 * meta — "3 steps · 0:41", "waiting on you", "ran out of steps · Retry". Settled, the block is one
 * muted sentence that opens the same rows. Failures are words with a Retry, never a red ✕.
 * A Subagent that finished says how its part went: Done (the only row with a check), Partially done
 * or Couldn't finish with its reason, or Finished with "No outcome reported" when its answer didn't say.
 * ----------------------------------------------------------------------------------------------*/

/** Where one Subagent stands. */
export type SubagentStatus =
  "running" | "waiting" | "done" | "stopped" | "failed";

/**
 * How a finished Subagent said its part went: done, partially done, couldn't finish, or `unknown`
 * when its answer didn't say (never shown as done).
 */
export type SubagentOutcome = "done" | "partial" | "couldnt" | "unknown";

/** A Subagent's preliminary or final output, as the server sends it. */
export interface SubagentOutput {
  title?: string;
  status?: SubagentStatus;
  /** Why it stopped or failed, in words: "ran out of steps". */
  reason?: string;
  /** How it said its part went, once `status` is `done`; absent reads as `unknown`, never as done. */
  outcome?: SubagentOutcome;
  /** Why it's partially done or couldn't finish, in its own words (one line). */
  outcomeReason?: string;
  steps?: number;
  durationMs?: number;
  costMicroUsd?: number;
}

/** One Subagent, read from its tool part. */
export interface SubagentView {
  callId: string;
  title: string;
  status: SubagentStatus;
  /** The running verb from the server ("Researching"); "Running" by default. */
  verb?: string;
  reason?: string;
  /** How it said its part went, once done. @default undefined */
  outcome?: SubagentOutcome;
  /** Why it's partially done or couldn't finish. @default undefined */
  outcomeReason?: string;
  steps?: number;
  durationMs?: number;
  costMicroUsd?: number;
}

const inputTitle = (input: unknown): string | undefined =>
  input && typeof input === "object" && "title" in input
    ? String((input as { title: unknown }).title)
    : undefined;

/** Reads a Subagent tool part into what its row shows. */
function subagentOf(part: ChatToolPart): SubagentView {
  const output = (
    part.output && typeof part.output === "object" ? part.output : {}
  ) as SubagentOutput;
  const words = wordsOf(part);
  let status: SubagentStatus = output.status ?? "running";
  if (part.state === "approval-requested") status = "waiting";
  else if (part.state === "output-error" || part.state === "output-denied")
    status = output.status === "stopped" ? "stopped" : "failed";
  else if (!output.status) status = isToolRunning(part) ? "running" : "done";
  return {
    callId: part.toolCallId,
    title:
      output.title ??
      inputTitle(part.input) ??
      part.title ??
      words.subject ??
      "Subagent",
    status,
    verb: words.verb,
    reason:
      output.reason ??
      (part.state === "output-error" ? part.errorText : undefined) ??
      words.refusal?.words,
    // Only a part said done is done: an answer that didn't say reads "No outcome reported".
    ...(status === "done"
      ? {
          outcome: output.outcome ?? "unknown",
          outcomeReason: output.outcomeReason,
        }
      : {}),
    steps: output.steps,
    durationMs: output.durationMs ?? words.durationMs,
    costMicroUsd: output.costMicroUsd,
  };
}

const STATUS_WORD: Record<SubagentStatus, string> = {
  running: "Running",
  waiting: "Waiting",
  done: "Finished",
  stopped: "Stopped",
  failed: "Couldn't finish",
};

/** A finished row's word for what it said of its part; "Finished" when it didn't say. */
const OUTCOME_WORD: Record<SubagentOutcome, string> = {
  done: "Done",
  partial: "Partially done",
  couldnt: "Couldn't finish",
  unknown: "Finished",
};

/** The quiet end of a row whose part isn't done: its reason, or that it didn't say. */
function outcomeMeta(view: SubagentView): string | null {
  if (view.status !== "done" || !view.outcome || view.outcome === "done")
    return null;
  if (view.outcome === "unknown") return "No outcome reported";
  return view.outcomeReason ?? null;
}

/** Done with the check: only a finished row whose Subagent said its part is done. */
const saidDone = (view: SubagentView) =>
  view.status === "done" && view.outcome === "done";

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

/** "$0.006": a small cost, in dollars, to the precision it needs. */
function formatCost(microUsd: number): string {
  const usd = microUsd / 1_000_000;
  return `$${usd >= 1 ? usd.toFixed(2) : usd.toPrecision(1)}`;
}

/** "Finished 4 Subagents · 1 stopped (ran out of steps) · $0.006". */
function subagentsSummary(views: readonly SubagentView[]): string {
  const total = views.length;
  const running = views.filter(
    (v) => v.status === "running" || v.status === "waiting",
  ).length;
  if (running) {
    const finished = views.filter((v) => v.status === "done").length;
    const ended = views.filter(
      (v) => v.status === "stopped" || v.status === "failed",
    ).length;
    return [
      `${running} running`,
      finished ? `${finished} finished` : null,
      ended ? `${ended} stopped` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  const stopped = views.filter((v) => v.status === "stopped");
  const said = (outcome: SubagentOutcome) =>
    views.filter((v) => v.status === "done" && v.outcome === outcome);
  const partial = said("partial");
  const failed = [
    ...views.filter((v) => v.status === "failed"),
    ...said("couldnt"),
  ];
  const unstated = said("unknown");
  const bits = [`Finished ${plural(total, "Subagent")}`];
  const why = (list: SubagentView[]) => {
    const reasons = [
      ...new Set(list.map((v) => v.reason ?? v.outcomeReason).filter(Boolean)),
    ];
    return reasons.length === 1 ? ` (${reasons[0]})` : "";
  };
  if (stopped.length) bits.push(`${stopped.length} stopped${why(stopped)}`);
  if (partial.length)
    bits.push(`${partial.length} partially done${why(partial)}`);
  if (failed.length)
    bits.push(`${failed.length} couldn't finish${why(failed)}`);
  if (unstated.length) bits.push(`${unstated.length} no outcome reported`);
  const cost = views.reduce((sum, v) => sum + (v.costMicroUsd ?? 0), 0);
  if (cost > 0) bits.push(formatCost(cost));
  return bits.join(" · ");
}

/** Props accepted by `SubagentsBlock`. */
export interface SubagentsBlockProps {
  /** The turn's Subagent tool parts, in order. */
  parts: readonly ChatToolPart[];
  /** Opens a Subagent's steps beside the chat (a sheet on a phone). */
  onOpen: (callId: string) => void;
  /** Opens the request a waiting Subagent asked. @default undefined */
  onOpenRequest?: (callId: string) => void;
  /** Re-runs a Subagent that stopped or couldn't finish. @default undefined */
  onRetry?: (callId: string) => void;
  /** While the turn runs the rows show at once; settled, they fold behind one line. @default false */
  live?: boolean;
  /** The settled line's words from the server; built from the rows by default. @default undefined */
  summary?: React.ReactNode;
  /** Extra classes on the block. @default undefined */
  className?: string;
}

function SubagentRow({
  view,
  onOpen,
  onOpenRequest,
  onRetry,
}: {
  view: SubagentView;
  onOpen: (callId: string) => void;
  onOpenRequest?: (callId: string) => void;
  onRetry?: (callId: string) => void;
}) {
  const word =
    view.status === "running"
      ? (view.verb ?? STATUS_WORD.running)
      : view.status === "done" && view.outcome
        ? OUTCOME_WORD[view.outcome]
        : STATUS_WORD[view.status];
  const outcome = outcomeMeta(view);
  const settledMeta = [
    view.steps != null ? plural(view.steps, "step") : null,
    view.durationMs != null ? formatChatDuration(view.durationMs) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  // A part it didn't finish can be run again, however the call itself ended.
  const ended =
    view.status === "stopped" ||
    view.status === "failed" ||
    (view.status === "done" &&
      (view.outcome === "partial" || view.outcome === "couldnt"));
  return (
    <li
      data-slot="subagent-row"
      data-status={view.status}
      data-outcome={view.outcome}
      className="flex min-h-9 min-w-0 items-center gap-1 p-1.25"
    >
      <Button
        variant="ghost"
        onClick={() => onOpen(view.callId)}
        className="h-auto min-h-8 min-w-0 flex-1 justify-start gap-2 rounded-item border-0 px-2 py-1 text-start font-normal whitespace-normal"
        data-slot="subagent-open"
      >
        <span className="w-24 shrink-0 truncate text-muted-foreground max-sm:w-auto">
          {word}
        </span>{" "}
        <span className="min-w-0 flex-1 truncate text-foreground">
          {view.title}
        </span>{" "}
        {saidDone(view) ? (
          <StatusGlyph status="done" size={14} label={null} />
        ) : null}
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {outcome != null
            ? outcome
            : ended
              ? (view.reason ?? settledMeta)
              : view.status === "waiting"
                ? null
                : settledMeta}
        </span>
        <ChevronRight
          aria-hidden="true"
          strokeWidth={1.5}
          className="size-3.5 shrink-0 text-muted-foreground rtl:rotate-180"
        />
      </Button>
      {view.status === "waiting" ? (
        <Button
          variant="link"
          size="xs"
          onClick={() => onOpenRequest?.(view.callId)}
          disabled={!onOpenRequest}
          className="shrink-0"
        >
          waiting on you
        </Button>
      ) : null}
      {ended && onRetry ? (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onRetry(view.callId)}
          className="shrink-0"
        >
          Retry
        </Button>
      ) : null}
    </li>
  );
}

/**
 * A turn's Subagents as one block. Live, the rows show at once — status word, title, quiet meta,
 * "waiting on you" linking to the one bundled request, "ran out of steps · Retry" — and each opens
 * its steps beside the chat. Settled, one muted sentence ("Finished 4 Subagents · 1 stopped (ran
 * out of steps) · $0.006") opens the same rows. The block never spins: the turn's live line does.
 *
 * @example
 * <SubagentsBlock parts={subagentParts} live={running} onOpen={openBeside} onRetry={retry} />
 */
function SubagentsBlock({
  parts,
  onOpen,
  onOpenRequest,
  onRetry,
  live = false,
  summary,
  className,
}: SubagentsBlockProps) {
  const views = parts.map(subagentOf);
  if (!views.length) return null;
  const rows = (
    <ul
      data-slot="subagents-rows"
      className="flex min-w-0 flex-col divide-y divide-chat-hairline overflow-hidden rounded-card border border-chat-hairline"
    >
      {views.map((view) => (
        <SubagentRow
          key={view.callId}
          view={view}
          onOpen={onOpen}
          onOpenRequest={onOpenRequest}
          onRetry={onRetry}
        />
      ))}
    </ul>
  );
  return (
    <div
      data-slot="subagents-block"
      data-live={live ? "" : undefined}
      className={cn("min-w-0", className)}
    >
      {live ? (
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-xs text-muted-foreground tabular-nums">
            {summary ?? subagentsSummary(views)}
          </p>
          {rows}
        </div>
      ) : (
        <ChatGroup summary={summary ?? subagentsSummary(views)} guide={false}>
          {rows}
        </ChatGroup>
      )}
    </div>
  );
}

/** Props accepted by `BackgroundWork`. */
export interface BackgroundWorkProps {
  /** What the work counts: "7 background commands done, 3 running". */
  label: React.ReactNode;
  /** Live work (or work that partly failed) is a chip; settled work is a muted line. @default false */
  live?: boolean;
  /** Something needs a look (one failed): the chip lifts its words, never a fill. @default false */
  attention?: boolean;
  /** Quiet words after the label ("2m"). @default undefined */
  meta?: React.ReactNode;
  /** Opens the work's details. */
  onOpen: () => void;
  /** Extra classes on the root. @default undefined */
  className?: string;
}

/**
 * Background work in Claude Code's two weights: live or partly failed, a bordered chip ("◐ 4
 * Subagents · 3 done, 1 running ›"); settled, a muted sentence ("Finished 2 background commands, 1
 * failed ›"). Both open the details.
 *
 * @example
 * <BackgroundWork live label="4 Subagents · 3 done, 1 running" onOpen={openRail} />
 */
function BackgroundWork({
  label,
  live = false,
  attention = false,
  meta,
  onOpen,
  className,
}: BackgroundWorkProps) {
  if (live || attention)
    return (
      <ChatChip
        icon={
          <StatusGlyph
            status={attention ? "needs-you" : "running"}
            size={14}
            label={null}
          />
        }
        tone={attention ? "attention" : "default"}
        label={label}
        meta={meta}
        onClick={onOpen}
        className={className}
        data-slot="background-work"
      />
    );
  return (
    <Button
      variant="ghost"
      onClick={onOpen}
      data-slot="background-work"
      className={cn(
        "-mx-2 h-7 w-fit max-w-[calc(100%+1rem)] min-w-0 justify-start gap-1.5 border-0 px-2 text-sm font-normal text-muted-foreground hover:text-muted-foreground",
        className,
      )}
    >
      <span className="min-w-0 truncate">{label}</span>
      {meta != null ? <span className="shrink-0 text-xs">{meta}</span> : null}
      <ChevronRight
        aria-hidden="true"
        strokeWidth={1.5}
        className="size-3.5 shrink-0 rtl:rotate-180"
      />
    </Button>
  );
}

export { SubagentsBlock, BackgroundWork, subagentOf, subagentsSummary };
