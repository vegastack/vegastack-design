// @vegastack chat-work-log@0.83.0 sha256-2S2hzmFmjHbQkNzb/ONQwGi62yYBizFx06+YRXH3cBw=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChatRow } from "@/components/ui/chat-card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { TextSpinner } from "@/components/ui/text-spinner";

/* ------------------------------------------------------------------------------------------------
 * The work of one agent turn, read as sentences (Claude Code's two weights).
 *
 * While the turn runs, ONE line moves: `LiveLine`, the braille spinner, the current step's words and
 * a timer. When the answer starts it crossfades into `WorkSummary`, a muted line of the same 28px
 * height, so nothing below it moves. Both open `WorkLog`: a fold of rows that read as a muted verb,
 * the subject in the body ink and muted meta, with the agent's thinking as muted notes. No row has
 * an icon or a spinner of its own; "Running" is a word.
 *
 * The parts are the AI SDK's `UIMessage` part shapes, typed structurally here so the registry needs
 * no `ai` dependency: an app's `UIMessage` parts are assignable to `ChatPart`. Every sentence comes
 * from the server (`providerMetadata.vegastack`), so web, phone and Slack say the same words.
 * ----------------------------------------------------------------------------------------------*/

/** How much of a turn's work shows: the reader setting (Summary by default). */
export type ChatDetail = "summary" | "normal" | "verbose";

/** The server's words for one part, under `providerMetadata.vegastack` (or a tool's call/result metadata). */
export interface ChatWords {
  /** The muted verb: "Searched", "Opened", "Couldn't call". */
  verb?: string;
  /** What the step was about, in the body ink: "regent-lighting.in". */
  subject?: string;
  /** Quiet words after the subject: "12 results", "1 retried". */
  meta?: string;
  /** How long the step took. */
  durationMs?: number;
  /** The step's words while it runs, for the live line: "Searching the web". */
  doing?: string;
  /** The call that started this one (a Subagent's own steps). */
  parentCallId?: string;
  /** Why a step was refused, in words. */
  refusal?: { code: string; words: string };
  /** A `reasoning` part that is the agent narrating rather than thinking. */
  narration?: boolean;
}

/** Where an AI SDK tool part stands. */
export type ChatToolState =
  | "input-streaming"
  | "input-available"
  | "approval-requested"
  | "approval-responded"
  | "output-available"
  | "output-error"
  | "output-denied";

/** Provider metadata as the AI SDK carries it: a record per provider. */
export type ChatProviderMetadata = Readonly<Record<string, unknown>>;

/** Any `UIMessage` part. The renderers read `type` and narrow; other fields pass through. */
export interface ChatPart {
  readonly type: string;
  readonly [field: string]: unknown;
}

/** An AI SDK `dynamic-tool` (or `tool-<name>`) part, structurally. */
export interface ChatToolPart extends ChatPart {
  readonly toolName?: string;
  readonly toolCallId: string;
  readonly state: ChatToolState;
  readonly title?: string;
  readonly input?: unknown;
  readonly output?: unknown;
  readonly errorText?: string;
  readonly preliminary?: boolean;
  readonly approval?: { id: string; approved?: boolean; reason?: string };
  readonly callProviderMetadata?: ChatProviderMetadata;
  readonly resultProviderMetadata?: ChatProviderMetadata;
  readonly providerMetadata?: ChatProviderMetadata;
}

/** An AI SDK `reasoning` part, structurally. */
export interface ChatReasoningPart extends ChatPart {
  readonly text: string;
  readonly state?: "streaming" | "done";
  readonly providerMetadata?: ChatProviderMetadata;
}

/** A tool part, whatever its name: `dynamic-tool` or a static `tool-<name>`. */
function isToolPart(part: ChatPart): part is ChatToolPart {
  return part.type === "dynamic-tool" || part.type.startsWith("tool-");
}

/** The tool's name: `toolName` on a dynamic part, the `tool-` suffix on a static one. */
function toolNameOf(part: ChatToolPart): string {
  return part.toolName ?? part.type.replace(/^tool-/, "");
}

/** A Subagent call: its own block, never a work row. */
function isSubagentPart(part: ChatPart): part is ChatToolPart {
  return isToolPart(part) && toolNameOf(part) === "subagent";
}

function vegastackOf(meta: ChatProviderMetadata | undefined): ChatWords {
  const words = meta?.vegastack;
  return words && typeof words === "object" ? (words as ChatWords) : {};
}

/** The server's words for a part; a tool's result words win over its call words. */
function wordsOf(part: ChatPart): ChatWords {
  const p = part as ChatToolPart;
  return {
    ...vegastackOf(p.providerMetadata),
    ...vegastackOf(p.callProviderMetadata),
    ...vegastackOf(p.resultProviderMetadata),
  };
}

/** A part the work log draws: a thought or narration, or a tool call that isn't a Subagent. */
function isWorkPart(part: ChatPart): boolean {
  if (part.type === "reasoning")
    return Boolean((part as ChatReasoningPart).text?.trim());
  return isToolPart(part) && !isSubagentPart(part);
}

/** Whether a tool call is still going: no output yet, or only a preliminary one. */
function isToolRunning(part: ChatToolPart): boolean {
  return (
    part.state === "input-streaming" ||
    part.state === "input-available" ||
    part.state === "approval-responded" ||
    (part.state === "output-available" && part.preliminary === true)
  );
}

/** "submit_form" → "Submit form": the fallback subject when the server sent no words. */
function humanize(name: string): string {
  const words = name.replace(/[_-]+/g, " ").trim();
  return words ? words[0]!.toUpperCase() + words.slice(1) : name;
}

/** A clock reading: `0:09`, `1:20`, `1:02:05`. */
function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
}

const sinceMs = (iso: string | undefined, now: number) => {
  const at = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(at) ? Math.max(0, now - at) : 0;
};

/** `Date.now()`, refreshed every second while `running`; a still reading otherwise. */
function useNow(running: boolean): number {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  return now;
}

/** Props accepted by `ChatClock`. */
export interface ChatClockProps extends Omit<
  React.ComponentProps<"span">,
  "children"
> {
  /** When the work started (ISO); the clock counts up from it while `running`. @default undefined */
  startedAt?: string;
  /** A fixed reading, for settled work. Ignored while `running` with a `startedAt`. @default undefined */
  ms?: number;
  /** Whether the clock ticks. @default true */
  running?: boolean;
  /**
   * Working time already counted (waits on a person or a limit left out), as of `countedAt`; the
   * clock counts on from it instead of from `startedAt`, so a live reading never runs ahead of the
   * settled one. @default undefined
   */
  workedMs?: number;
  /** When `workedMs` was counted (ISO). @default undefined */
  countedAt?: string;
}

/**
 * A live timer in tabular figures with its width reserved, so the words beside it never move: `0:09`,
 * `1:20`. It ticks once a second and keeps counting under reduced motion.
 *
 * @example
 * <ChatClock startedAt={turn.startedAt} />
 */
function ChatClock({
  startedAt,
  ms,
  running = true,
  workedMs,
  countedAt,
  className,
  ...props
}: ChatClockProps) {
  const counted = workedMs != null && countedAt != null;
  const ticking = running && (counted || startedAt != null);
  const now = useNow(ticking);
  // Without a server count, a paused wall clock holds its last reading rather than dropping to 0.
  const held = React.useRef(0);
  let reading: number;
  if (counted) reading = workedMs + (running ? sinceMs(countedAt, now) : 0);
  else if (ticking) reading = held.current = sinceMs(startedAt, now);
  else reading = ms ?? workedMs ?? held.current;
  return (
    <span
      data-slot="chat-clock"
      // The server can't know the reader's clock; the first client tick corrects it.
      suppressHydrationWarning
      className={cn("inline-block min-w-8 tabular-nums", className)}
      {...props}
    >
      {formatClock(reading)}
    </span>
  );
}

/** A turn is "stuck" after this long with no new event. */
const STUCK_AFTER_MS = 45_000;
/** "Keep waiting" quiets the stuck line for this long. */
const KEEP_WAITING_MS = 5 * 60_000;

/** Props accepted by `LiveLine`. */
export interface LiveLineProps {
  /** The current step, in words: "Searching the web", "Running 4 Subagents". */
  words: React.ReactNode;
  /**
   * Who is working, for a screen reader only: the status says "William is working: Searching the
   * web". @default undefined
   */
  agentName?: string;
  /** When the turn started (ISO); the timer counts from it. @default undefined */
  startedAt?: string;
  /** Working time so far, as of `countedAt`; the timer counts on from it (see `ChatClock`). @default undefined */
  workedMs?: number;
  /** When `workedMs` was counted (ISO). @default undefined */
  countedAt?: string;
  /** The turn waits on a person or a limit: the timer holds still. @default false */
  paused?: boolean;
  /** What the turn waits on, for the stuck line: "4 Subagents", "you". @default undefined */
  waitingOn?: string;
  /** When the turn's last event arrived (ISO); 45s later the stuck line shows. @default undefined */
  lastEventAt?: string;
  /** Forces the stuck line on or off; by default it follows `lastEventAt`. @default undefined */
  stuck?: boolean;
  /** The stuck line's Stop: the composer's Stop. @default undefined */
  onStop?: () => void;
  /** The stuck line's Keep waiting; it also quiets the line for five minutes. @default undefined */
  onKeepWaiting?: () => void;
  /** Whether the work log under the line is open; with `onToggle` the line is its trigger. @default undefined */
  open?: boolean;
  /** Opens or closes the work log. @default undefined */
  onToggle?: () => void;
  /** Extra classes on the root. @default undefined */
  className?: string;
}

const LINE =
  "-mx-2 flex h-7 w-fit max-w-[calc(100%+1rem)] min-w-0 items-center gap-2 rounded-md px-2 text-start text-sm text-muted-foreground";

function Chevron({ open }: { open?: boolean }) {
  return (
    <ChevronRight
      aria-hidden="true"
      strokeWidth={1.5}
      data-open={open ? "" : undefined}
      data-icon-tone="muted"
      className="size-3.5 shrink-0 transition-transform duration-state ease-enter data-open:rotate-90 rtl:rotate-180 rtl:data-open:rotate-90"
    />
  );
}

/**
 * The turn's one moving thing: the braille spinner, the current step in words and a live timer, in
 * one 28px line. After 45 seconds with no event a second line says what the turn waits on, with Stop
 * and Keep waiting. When the answer starts, swap it for `WorkSummary`: same height, no reflow.
 *
 * @example
 * <LiveLine words="Searching the web" startedAt={turn.startedAt} lastEventAt={turn.lastEventAt}
 *   waitingOn="4 Subagents" onStop={stop} open={open} onToggle={toggle} />
 */
function LiveLine({
  words,
  agentName,
  startedAt,
  workedMs,
  countedAt,
  paused = false,
  waitingOn,
  lastEventAt,
  stuck,
  onStop,
  onKeepWaiting,
  open,
  onToggle,
  className,
}: LiveLineProps) {
  const [quietUntil, setQuietUntil] = React.useState(0);
  const watching =
    (stuck === undefined && lastEventAt != null) || quietUntil > 0;
  const now = useNow(watching);
  const quiet = sinceMs(lastEventAt, now);
  // Keep waiting quiets the line whether it was derived or forced.
  const isStuck =
    (stuck ?? (lastEventAt != null && quiet >= STUCK_AFTER_MS)) &&
    now >= quietUntil;
  const content = (
    <>
      <TextSpinner label="" />
      <span data-slot="live-line-words" className="min-w-0 truncate">
        {words}
      </span>
      {startedAt || (workedMs != null && countedAt) ? (
        <>
          <span aria-hidden="true">·</span>
          <ChatClock
            startedAt={startedAt}
            workedMs={workedMs}
            countedAt={countedAt}
            running={!paused}
            aria-hidden="true"
          />
        </>
      ) : null}
      {onToggle ? <Chevron open={open} /> : null}
    </>
  );
  return (
    <div
      data-slot="live-line"
      data-stuck={isStuck ? "" : undefined}
      className={cn("flex min-w-0 flex-col", className)}
    >
      {onToggle ? (
        <Button
          variant="ghost"
          aria-expanded={open ?? false}
          onClick={onToggle}
          className={cn(
            LINE,
            "border-0 font-normal hover:text-muted-foreground aria-expanded:bg-transparent aria-expanded:text-muted-foreground",
          )}
          data-slot="live-line-trigger"
        >
          {content}
        </Button>
      ) : (
        <div className={LINE}>{content}</div>
      )}
      {/* The words, for a screen reader: polite, and never the ticking timer. */}
      <span role="status" className="sr-only">
        {agentName ? `${agentName} is working: ` : null}
        {words}
      </span>
      {isStuck ? (
        <div
          data-slot="live-line-stuck"
          className="flex min-h-7 min-w-0 animate-in flex-wrap items-center gap-x-3 gap-y-1 ps-8 pe-2 text-xs text-muted-foreground duration-quick fade-in-0"
        >
          <span className="min-w-0">
            {waitingOn ? `Waiting on ${waitingOn}` : "No news for a while"}
            {lastEventAt ? (
              <>
                {" · last step "}
                <span className="tabular-nums">
                  {formatClock(quiet).replace(/^0:/, "")}
                  {quiet < 60_000 ? "s" : ""}
                </span>
                {" ago"}
              </>
            ) : null}
          </span>
          <span className="flex items-center gap-1">
            {onStop ? (
              <Button variant="outline" size="xs" onClick={onStop}>
                Stop
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setQuietUntil(Date.now() + KEEP_WAITING_MS);
                onKeepWaiting?.();
              }}
            >
              Keep waiting
            </Button>
          </span>
        </div>
      ) : null}
    </div>
  );
}

/** Props accepted by `WorkSummary`. */
export interface WorkSummaryProps {
  /** The settled sentence: "Worked for 41s · searched 3 times, opened 4 sites". */
  summary: React.ReactNode;
  /** Whether the work log is open. */
  open: boolean;
  /** Opens or closes the work log; without it the line is plain text (no log to open). @default undefined */
  onToggle?: () => void;
  /** Fade in: only when it replaces a live line, never on a history load. @default false */
  animate?: boolean;
  /** Extra classes on the line. @default undefined */
  className?: string;
}

/**
 * A turn's settled work as one muted sentence and a chevron, the same 28px as `LiveLine`, which it
 * replaces in place with a quick fade. Something that changed the outcome adds words, never colour.
 *
 * @example
 * <WorkSummary summary="Worked for 41s · searched 3 times, opened 4 sites" open={open} onToggle={toggle} />
 */
function WorkSummary({
  summary,
  open,
  onToggle,
  animate = false,
  className,
}: WorkSummaryProps) {
  if (!onToggle)
    return (
      <p
        data-slot="work-summary"
        className={cn(
          LINE,
          animate && "animate-in duration-quick fade-in-0",
          className,
        )}
      >
        <span className="min-w-0 truncate">{summary}</span>
      </p>
    );
  return (
    <Button
      variant="ghost"
      aria-expanded={open}
      onClick={onToggle}
      data-slot="work-summary"
      className={cn(
        LINE,
        "border-0 font-normal hover:text-muted-foreground aria-expanded:bg-transparent aria-expanded:text-muted-foreground",
        animate && "animate-in duration-quick fade-in-0",
        className,
      )}
    >
      <span className="min-w-0 truncate">{summary}</span>
      <Chevron open={open} />
    </Button>
  );
}

/** A thought or narration: 13px muted, two lines until opened (when it runs longer than two). */
function WorkNote({ text, clamp }: { text: string; clamp: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [overflows, setOverflows] = React.useState(false);
  // A callback ref: the measured span remounts when the note turns into a button and back.
  const [node, setNode] = React.useState<HTMLSpanElement | null>(null);
  React.useLayoutEffect(() => {
    if (!clamp || !node) return;
    const measure = () => {
      // Measured while clamped; once opened the answer is already known.
      if (node.classList.contains("line-clamp-2"))
        setOverflows(node.scrollHeight > node.clientHeight + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [clamp, text, node]);
  const body = (
    <span
      ref={setNode}
      className={cn("min-w-0", clamp && !open && "line-clamp-2")}
    >
      {text}
    </span>
  );
  if (!clamp || !overflows)
    return (
      <p
        data-slot="work-note"
        className="-mx-2 min-w-0 px-2 py-0.5 text-xs whitespace-pre-line text-muted-foreground"
      >
        {body}
      </p>
    );
  return (
    <Button
      variant="ghost"
      aria-expanded={open}
      onClick={() => setOpen((value) => !value)}
      data-slot="work-note"
      className="-mx-2 h-auto w-[calc(100%+1rem)] justify-start border-0 px-2 py-0.5 text-start text-xs font-normal whitespace-pre-line text-muted-foreground hover:text-muted-foreground aria-expanded:bg-transparent aria-expanded:text-muted-foreground"
    >
      {body}
    </Button>
  );
}

const STATE_WORDS: Partial<Record<ChatToolState, string>> = {
  "input-streaming": "Running",
  "input-available": "Running",
  "approval-requested": "Waiting on you",
  "approval-responded": "Running",
};

function inputText(input: unknown): string | null {
  if (input == null) return null;
  if (typeof input === "string") return input;
  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return null;
  }
}

/** One tool call as a row: muted verb, the subject, muted meta; states are words, not icons. */
function WorkToolRow({
  part,
  showInput,
}: {
  part: ChatToolPart;
  showInput: boolean;
}) {
  const words = wordsOf(part);
  const name = humanize(toolNameOf(part));
  let verb = words.verb;
  let meta: React.ReactNode = words.meta;
  if (part.state === "output-error") {
    verb ??= "Couldn't call";
    meta = part.errorText ?? meta;
  } else if (part.state === "output-denied") {
    verb ??= "Didn't";
    meta = words.refusal?.words ?? part.approval?.reason ?? meta;
  } else if (isToolRunning(part) || part.state === "approval-requested") {
    meta = STATE_WORDS[part.state] ?? "Running";
  }
  const input = showInput ? inputText(part.input) : null;
  return (
    <div data-slot="work-row" data-state={part.state} className="min-w-0">
      <ChatRow
        verb={verb}
        subject={words.subject ?? part.title ?? name}
        meta={meta}
        durationMs={isToolRunning(part) ? undefined : words.durationMs}
      />
      {input ? (
        <pre
          data-slot="work-row-input"
          className="-mx-2 mb-1 max-h-40 overflow-auto rounded-md bg-chat-card px-2 py-1 font-mono text-xs whitespace-pre-wrap text-muted-foreground"
        >
          {input}
        </pre>
      ) : null}
    </div>
  );
}

/** Props accepted by `WorkLog`. */
export interface WorkLogProps {
  /** The turn's parts; only thoughts and tool calls draw (Subagents have their own block). */
  parts: readonly ChatPart[];
  /** Verbose opens the notes and shows each call's input. @default "summary" */
  detail?: ChatDetail;
  /** Whether the log shows; it opens and closes on the chat motion. @default true */
  open?: boolean;
  /** Extra classes on the log. @default undefined */
  className?: string;
}

/**
 * The rows of a turn's work behind one hairline guide: each tool call as a muted verb, the subject in
 * the body ink and muted meta and duration, the agent's thinking as 13px muted notes clamped to two
 * lines. No per-row icon or spinner. Opened by `LiveLine` or `WorkSummary`.
 *
 * @example
 * <WorkSummary summary={turn.summary} open={open} onToggle={toggle} />
 * <WorkLog parts={message.parts} detail="normal" open={open} />
 */
function WorkLog({
  parts,
  detail = "summary",
  open = true,
  className,
}: WorkLogProps) {
  const verbose = detail === "verbose";
  const rows = parts.filter(isWorkPart);
  return (
    <Collapsible
      open={open}
      data-slot="work-log-root"
      // The panel clips, so it reaches into both gutters to keep the rows' hanging fills.
      className="min-w-0 [&>[data-slot=work-log]]:-mx-2 [&>[data-slot=work-log]]:w-[calc(100%+1rem)]"
    >
      <CollapsibleContent
        data-slot="work-log"
        className={cn(
          "ms-3.5 flex min-w-0 flex-col gap-1 border-s border-chat-hairline ps-4 pe-2 pt-1",
          className,
        )}
      >
        {rows.map((part, index) =>
          part.type === "reasoning" ? (
            <WorkNote
              key={index}
              text={(part as ChatReasoningPart).text.trim()}
              clamp={!verbose}
            />
          ) : (
            <WorkToolRow
              key={(part as ChatToolPart).toolCallId ?? index}
              part={part as ChatToolPart}
              showInput={verbose}
            />
          ),
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Props accepted by `ErrorRow` and `StuckRow`. */
export interface ChatNoticeRowProps {
  /** What happened, in plain words: "Couldn't finish: Google refused the slide update." */
  words: React.ReactNode;
  /** What was and wasn't changed: "Nothing else was changed." @default undefined */
  changed?: React.ReactNode;
  /** The one thing to do next: "Retry this step". @default undefined */
  action?: { label: string; onClick: () => void };
  /** Extra classes on the row. @default undefined */
  className?: string;
}

function NoticeRow({
  kind,
  words,
  changed,
  action,
  className,
}: ChatNoticeRowProps & { kind: "error" | "stuck" }) {
  return (
    <div
      data-slot={kind === "error" ? "error-row" : "stuck-row"}
      className={cn(
        "-mx-2 flex min-w-0 items-start gap-2 px-2 py-1 text-sm",
        className,
      )}
    >
      <StatusGlyph
        status={kind === "error" ? "needs-you" : "pending"}
        label={null}
        className="mt-0.5"
      />
      <p className="min-w-0 flex-1 text-foreground">
        {words}
        {changed ? (
          <span className="text-muted-foreground"> {changed}</span>
        ) : null}
      </p>
      {action ? (
        <Button
          variant="outline"
          size="xs"
          onClick={action.onClick}
          className="shrink-0"
        >
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

/**
 * A step or turn that couldn't finish, as a quiet row: the amber ⚠ glyph only, plain words, what
 * was and wasn't changed, and one action. Never a red fill or a red ✕.
 *
 * @example
 * <ErrorRow words="Couldn't finish: Google refused the slide update." changed="Nothing else was changed."
 *   action={{ label: "Retry this step", onClick: retry }} />
 */
function ErrorRow(props: ChatNoticeRowProps) {
  return <NoticeRow kind="error" {...props} />;
}

/**
 * A turn waiting on something outside it (a limit, a person, a service), as a quiet row with a muted
 * ◌, the words and one action.
 *
 * @example
 * <StuckRow words="Paused: this workspace reached today's limit." action={{ label: "See limits", onClick: open }} />
 */
function StuckRow(props: ChatNoticeRowProps) {
  return <NoticeRow kind="stuck" {...props} />;
}

export {
  ChatClock,
  LiveLine,
  WorkSummary,
  WorkLog,
  ErrorRow,
  StuckRow,
  formatClock,
  isSubagentPart,
  isToolPart,
  isToolRunning,
  isWorkPart,
  toolNameOf,
  wordsOf,
  humanize,
};
