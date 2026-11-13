// @vegastack chat-message-parts@0.79.0 sha256-NcqzjmxYzUH0y7agnSqFiIQH9Z3XZFKl3IJD/mUTjJs=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { FileText } from "lucide-react";

import { ChatRow, formatChatDuration } from "@/components/ui/chat-card";
import {
  ChatTaskList,
  type TaskListData,
} from "@/components/ui/chat-task-list";
import { SubagentsBlock } from "@/components/ui/chat-subagents";
import {
  ErrorRow,
  LiveLine,
  WorkLog,
  WorkSummary,
  isSubagentPart,
  isToolPart,
  isToolRunning,
  isWorkPart,
  wordsOf,
  type ChatDetail,
  type ChatPart,
  type ChatToolPart,
} from "@/components/ui/chat-work-log";
import { MarkdownView } from "@/components/ui/markdown-view";

/* ------------------------------------------------------------------------------------------------
 * MessageParts — one agent turn, drawn straight from its AI SDK `UIMessage` parts.
 *
 * Layout, top to bottom: the task list when there is one (it IS the turn's progress); the work line
 * — `LiveLine` while the turn runs (the turn's one moving thing), `WorkSummary` once settled, both
 * 28px so the swap never reflows — with the work log under it; then, in the order they arrived, the
 * Subagents block, the answer's text (never folded), files, and the cards the app draws for data
 * parts (`renderData`); last, an error row if the turn couldn't finish.
 *
 * The reader setting decides how much work shows: Summary keeps the log closed; Normal opens it while
 * the turn runs and folds it when the answer starts; Verbose also opens the notes and each call's
 * input. A person's own toggle wins until the setting changes.
 * ----------------------------------------------------------------------------------------------*/

/** The turn's facts, under `metadata.turn` (the chat contract's `ChatMetadata`). */
export interface ChatTurn {
  state?: "running" | "paused" | "done" | "stopped" | "failed";
  /** When the turn started (ISO): the live timer. */
  startedAt?: string;
  /** Working time, waits on a person or a limit excluded; while running, as of `countedAt`. */
  workedMs?: number;
  /** When a running turn's `workedMs` was counted (ISO): the live timer counts on from it. */
  countedAt?: string;
  /** The server's settled sentence: "Worked for 41s · searched 3 times, opened 4 sites". */
  summary?: string;
  /** Why the turn couldn't finish. */
  error?: {
    code?: string;
    words: string;
    changed?: string;
    retryable?: boolean;
  };
  /** What a running turn waits on. */
  waitingOn?: "subagents" | "person" | "limit" | "model";
  /** When the last event arrived (ISO); the stuck line shows 45s later. */
  lastEventAt?: string;
}

/** A `UIMessage`, structurally: any app message whose parts are AI SDK parts fits. */
export interface ChatMessageLike {
  id: string;
  role: string;
  parts: readonly ChatPart[];
  metadata?: unknown;
}

/** A `data-*` part. */
export interface ChatDataPart extends ChatPart {
  readonly id?: string;
  readonly data: unknown;
}

/** Draws one kind of data part (a plan, a request, a question, memory…). */
export type ChatDataRenderer = (part: ChatDataPart) => React.ReactNode;

/** Props accepted by `MessageParts`. */
export interface MessagePartsProps {
  /** The agent's message. */
  message: ChatMessageLike;
  /** The reader setting. @default "summary" */
  detail?: ChatDetail;
  /** The turn is running: the live line shows, with its spinner and timer. @default false */
  live?: boolean;
  /** The cards for data parts, keyed by part type: `{ "data-plan": (part) => <ChatPlanCard … /> }`. `data-tasklist` has a default. @default undefined */
  renderData?: Partial<Record<`data-${string}`, ChatDataRenderer>>;
  /** Draws any other part this component doesn't (sources, custom parts); return `undefined` to skip. @default undefined */
  renderPart?: (part: ChatPart, index: number) => React.ReactNode;
  /** Opens a Subagent's steps beside the chat. @default undefined */
  onOpenSubagent?: (callId: string) => void;
  /** Opens the request a waiting Subagent asked. @default undefined */
  onOpenSubagentRequest?: (callId: string) => void;
  /** Re-runs a Subagent that stopped. @default undefined */
  onRetrySubagent?: (callId: string) => void;
  /** Opens a file the agent made. @default undefined */
  onOpenFile?: (url: string, mediaType: string, filename?: string) => void;
  /** Retries the step the turn couldn't finish (only offered when the error is retryable). @default undefined */
  onRetry?: () => void;
  /** The stuck line's Stop. @default undefined */
  onStop?: () => void;
  /** The stuck line's Keep waiting. @default undefined */
  onKeepWaiting?: () => void;
  /** Props for every answer's Markdown view (mention links, link origin). @default undefined */
  markdownProps?: Omit<
    React.ComponentProps<typeof MarkdownView>,
    "children" | "content" | "streaming"
  >;
  /** Extra classes on the root. @default undefined */
  className?: string;
}

const turnOf = (message: ChatMessageLike): ChatTurn => {
  const meta = message.metadata;
  if (!meta || typeof meta !== "object" || !("turn" in meta)) return {};
  const turn = (meta as { turn?: unknown }).turn;
  return turn && typeof turn === "object" ? (turn as ChatTurn) : {};
};

const textOf = (part: ChatPart) =>
  (part as unknown as { text?: string }).text ?? "";

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

/** The live line's words: the server's status, else the running step, else "Thinking". */
function liveWordsOf(parts: readonly ChatPart[]): string {
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i]!;
    if (part.type === "data-status") {
      const words = ((part as ChatDataPart).data as { words?: string })?.words;
      if (words) return words;
    }
  }
  const subagents = parts.filter(isSubagentPart);
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i]!;
    if (!isToolPart(part) || !isToolRunning(part)) continue;
    if (isSubagentPart(part))
      return `Running ${plural(subagents.length, "Subagent")}`;
    const words = wordsOf(part);
    if (words.doing) return words.doing;
    if (words.verb || words.subject)
      return [words.verb, words.subject].filter(Boolean).join(" ");
  }
  return "Thinking";
}

function waitingWords(turn: ChatTurn, parts: readonly ChatPart[]) {
  switch (turn.waitingOn) {
    case "subagents": {
      const running = parts
        .filter(isSubagentPart)
        .filter((p) => isToolRunning(p)).length;
      return running ? plural(running, "Subagent") : "Subagents";
    }
    case "person":
      return "you";
    case "limit":
      return "a usage limit";
    case "model":
      return "the model";
    default:
      return undefined;
  }
}

/**
 * One agent turn from its AI SDK parts: the task list, one live line (or its settled sentence) over
 * the work log, the Subagents block, the answer (never folded), files and the app's cards. At most
 * one spinner, whatever the parts.
 *
 * @example
 * <MessageParts message={message} detail={detail} live={running}
 *   renderData={{ "data-plan": (part) => <ChatPlanCard data={part.data as PlanData} … /> }}
 *   onOpenSubagent={openBeside} />
 */
function MessageParts({
  message,
  detail = "summary",
  live = false,
  renderData,
  renderPart,
  onOpenSubagent,
  onOpenSubagentRequest,
  onRetrySubagent,
  onOpenFile,
  onRetry,
  onStop,
  onKeepWaiting,
  markdownProps,
  className,
}: MessagePartsProps) {
  const parts = message.parts;
  const turn = turnOf(message);
  const workParts = parts.filter(isWorkPart);
  const subagents = parts.filter(isSubagentPart);

  let lastWork = -1;
  parts.forEach((part, index) => {
    if (isWorkPart(part) || isSubagentPart(part)) lastWork = index;
  });
  const answerStarted = parts.some(
    (part, index) =>
      part.type === "text" && index > lastWork && textOf(part).trim(),
  );

  // The reader setting opens the log; a person's own toggle wins until the setting changes.
  const auto = detail !== "summary" && live && !answerStarted;
  const [manual, setManual] = React.useState<boolean | null>(null);
  const [seenDetail, setSeenDetail] = React.useState(detail);
  if (seenDetail !== detail) {
    setSeenDetail(detail);
    setManual(null);
  }
  const open = manual ?? auto;
  const toggle = () => setManual(!open);

  const taskList = parts.find((part) => part.type === "data-tasklist") as
    ChatDataPart | undefined;
  // The live line shows while the turn works and nothing else says so: a task list is the turn's
  // progress, and once the answer starts the line settles into its sentence.
  const showLive = live && !answerStarted && !taskList;
  // The settled line fades in only when it replaces a live line, never on a history load.
  const [wasLive, setWasLive] = React.useState(showLive);
  if (showLive && !wasLive) setWasLive(true);
  // A turn that showed its live line keeps its line once settled, even with only Subagents.
  const showWork =
    showLive ||
    workParts.length > 0 ||
    (wasLive && (subagents.length > 0 || turn.summary != null));
  const summary =
    turn.summary ??
    (turn.workedMs != null && !live
      ? `Worked for ${formatChatDuration(turn.workedMs)}`
      : workParts.length
        ? `${plural(workParts.length, "step")}${live ? " so far" : ""}`
        : `Ran ${plural(subagents.length, "Subagent")}`);

  const body: React.ReactNode[] = [];
  let subagentsPlaced = false;
  parts.forEach((part, index) => {
    const key = `${part.type}-${index}`;
    if (isSubagentPart(part)) {
      if (subagentsPlaced) return;
      subagentsPlaced = true;
      body.push(
        <SubagentsBlock
          key="subagents"
          parts={subagents}
          live={live}
          onOpen={(callId) => onOpenSubagent?.(callId)}
          onOpenRequest={onOpenSubagentRequest}
          onRetry={onRetrySubagent}
        />,
      );
      return;
    }
    if (isWorkPart(part) || part === taskList) return;
    if (part.type === "text") {
      const text = textOf(part);
      if (!text.trim()) return;
      const streaming =
        live && (part as unknown as { state?: string }).state === "streaming";
      body.push(
        <MarkdownView
          key={key}
          {...markdownProps}
          streaming={streaming}
          className={cn(
            // New blocks of prose fade in while the answer streams; code and tables appear as they
            // are, and nothing fades on a history load.
            streaming &&
              "[&>:is(p,ul,ol,blockquote,h1,h2,h3,h4,h5,h6)]:animate-in [&>:is(p,ul,ol,blockquote,h1,h2,h3,h4,h5,h6)]:duration-stream-word [&>:is(p,ul,ol,blockquote,h1,h2,h3,h4,h5,h6)]:fade-in-0",
            markdownProps?.className,
          )}
        >
          {text}
        </MarkdownView>,
      );
      return;
    }
    if (part.type === "file") {
      const file = part as unknown as {
        url: string;
        mediaType: string;
        filename?: string;
      };
      body.push(
        <ChatRow
          key={key}
          verb="Made"
          subject={
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <FileText
                aria-hidden="true"
                strokeWidth={1.5}
                className="size-4 shrink-0 text-muted-foreground"
              />
              <span className="truncate">
                {file.filename ?? file.mediaType}
              </span>
            </span>
          }
          onOpen={
            onOpenFile
              ? () => onOpenFile(file.url, file.mediaType, file.filename)
              : undefined
          }
        />,
      );
      return;
    }
    if (part.type.startsWith("data-")) {
      if (part.type === "data-status") return;
      const render = renderData?.[part.type as `data-${string}`];
      const node = render?.(part as ChatDataPart);
      if (node != null)
        body.push(<React.Fragment key={key}>{node}</React.Fragment>);
      return;
    }
    if (part.type === "step-start") return;
    const node = renderPart?.(part, index);
    if (node != null)
      body.push(<React.Fragment key={key}>{node}</React.Fragment>);
  });

  const taskListData = taskList?.data as TaskListData | undefined;
  const taskListNode = taskList
    ? (renderData?.["data-tasklist"]?.(taskList) ?? (
        <ChatTaskList data={taskListData!} />
      ))
    : null;

  return (
    <div
      data-slot="message-parts"
      data-live={live ? "" : undefined}
      data-detail={detail}
      className={cn("flex min-w-0 flex-col gap-3", className)}
    >
      {taskListNode}
      {showWork ? (
        <div data-slot="message-work" className="flex min-w-0 flex-col">
          {showLive ? (
            <LiveLine
              words={liveWordsOf(parts)}
              startedAt={turn.startedAt}
              workedMs={turn.workedMs}
              countedAt={turn.countedAt}
              paused={turn.waitingOn === "person" || turn.waitingOn === "limit"}
              lastEventAt={turn.lastEventAt}
              waitingOn={waitingWords(turn, parts)}
              onStop={onStop}
              onKeepWaiting={onKeepWaiting}
              open={workParts.length ? open : undefined}
              onToggle={workParts.length ? toggle : undefined}
            />
          ) : (
            <WorkSummary
              summary={summary}
              open={open}
              onToggle={workParts.length ? toggle : undefined}
              animate={wasLive}
            />
          )}
          {workParts.length ? (
            <WorkLog parts={workParts} detail={detail} open={open} />
          ) : null}
        </div>
      ) : null}
      {body}
      {turn.error && !live ? (
        <ErrorRow
          words={turn.error.words}
          changed={turn.error.changed}
          action={
            turn.error.retryable && onRetry
              ? { label: "Retry this step", onClick: onRetry }
              : undefined
          }
        />
      ) : null}
    </div>
  );
}

export { MessageParts };
