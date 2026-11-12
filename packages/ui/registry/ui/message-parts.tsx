// @vegastack message-parts@0.67.2 sha256-/a/8zYdkKKqRc7E/lnnEpbpFo3luWZx4eMcFoSHDtFU=

"use client";

import * as React from "react";
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleCheck,
  CircleMinus,
  CircleX,
  CornerDownRight,
  Globe,
  Minus,
  X,
} from "lucide-react";
import { cn, proseReading } from "@vegastack/design";

import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { disclosureTriggerClasses } from "@/lib/disclosure-trigger";
import { formatDuration } from "@/lib/date-time";
import {
  RelativeTime,
  type RelativeTimeProps,
} from "@/components/ui/relative-time";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { StatusLine, type StatusLineProps } from "@/components/ui/status-line";
import { ToolCallChip } from "@/components/ui/tool-call-chip";
import { useOverflow } from "@/components/ui/use-overflow";

/* ------------------------------------------------------------------------------------------------
 * Message parts — what an agent's answer is made of beyond its text, composed inside
 * `MessageContent`.
 *
 * These live in their own item, not in `message.tsx`: that file is upstream's, and a new export
 * there would be a hunk no decision row covers. A person's message needs nothing here: it is
 * `Bubble` with `align="end"`.
 *
 * None of these parts is a live region by default. A conversation is `role="log"`, so a part that
 * were also `role="status"` would be read twice, and a past failure would interrupt whenever the
 * chat opened. The host announces with one `useAnnouncer` region and marks the text still streaming
 * `aria-busy`, on the text's own wrapper, so nothing around it is held back.
 *
 * Every string is the caller's: this system knows steps and sources, never what an agent is called
 * or what it did.
 * ----------------------------------------------------------------------------------------------*/

/* ------------------------------------------------------------------------------------------------
 * MessageSteps
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `MessageSteps`. */
export interface MessageStepsProps extends Omit<
  React.ComponentProps<typeof Collapsible>,
  "className"
> {
  /** The collapsed line: "3 steps · Searched meetings, read 2 notes". */
  summary: React.ReactNode;
  /** Classes for the root. @default undefined */
  className?: string;
}

/**
 * `MessageSteps` — what the agent did to reach its answer: one quiet line that opens to the list of
 * steps. Closed by default, so the answer stays the first thing to read. Pass `MessageStep` children.
 *
 * @example
 * <MessageSteps summary="3 steps · Searched meetings, read 2 notes">
 *   <MessageStep label="Searched meetings" meta="2 results" />
 *   <MessageStep label="Read 2 notes" />
 * </MessageSteps>
 */
export function MessageSteps({
  summary,
  className,
  children,
  ...props
}: MessageStepsProps) {
  return (
    <Collapsible
      data-slot="message-steps"
      className={cn("flex min-w-0 flex-col gap-1.5", className)}
      {...props}
    >
      <CollapsibleTrigger
        data-slot="message-steps-trigger"
        render={
          <Button
            variant="ghost"
            size="xs"
            className={cn(
              disclosureTriggerClasses,
              "group/message-steps -ms-1.5 max-w-full min-w-0 justify-start font-normal text-muted-foreground hover:text-foreground aria-expanded:not-hover:text-muted-foreground aria-expanded:not-hover:**:[svg:not([data-icon-tone])]:text-muted-foreground",
            )}
          />
        }
      >
        <ChevronRight
          aria-hidden
          className="transition-transform group-aria-expanded/message-steps:rotate-90"
        />
        <span className="min-w-0 truncate">{summary}</span>
      </CollapsibleTrigger>
      <CollapsibleContent data-slot="message-steps-content">
        <ul className="flex min-w-0 flex-col items-start gap-1">{children}</ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Where a `MessageStep` stands. `stopped`: the turn was stopped while the step ran. */
export type MessageStepStatus =
  "pending" | "running" | "done" | "failed" | "stopped";

/** Props accepted by `MessageStep`. */
export interface MessageStepProps extends Omit<
  React.ComponentProps<"li">,
  "children"
> {
  /** What the step does or did: "Searching tasks…", "Searched tasks". */
  label: React.ReactNode;
  /** A short result after the label: "2 results". @default undefined */
  meta?: React.ReactNode;
  /** @default "done" */
  status?: MessageStepStatus;
  /** Why a failed step failed, under the chip in muted text. @default undefined */
  error?: React.ReactNode;
  /**
   * The words a screen reader hears for each status, since the icon is what shows it.
   * @default { running: "Running", done: "Done", failed: "Failed", stopped: "Stopped" }
   */
  statusLabels?: Partial<Record<MessageStepStatus, string>>;
}

const STEP_STATUS_LABELS: Record<MessageStepStatus, string> = {
  pending: "Not started",
  running: "Running",
  done: "Done",
  failed: "Failed",
  stopped: "Stopped",
};

const STEP_ICONS: Record<MessageStepStatus, React.ReactNode> = {
  pending: <Circle aria-hidden className="text-muted-foreground/50" />,
  running: <Spinner aria-hidden role={undefined} aria-label={undefined} />,
  done: <Check aria-hidden />,
  failed: <X aria-hidden className="text-destructive-text" />,
  stopped: <Minus aria-hidden />,
};

/**
 * `MessageStep` — one step in `MessageSteps`: a `ToolCallChip` with a spinner, a check, a cross or a
 * dash, and the reason under it when it failed.
 *
 * @example
 * <MessageStep status="failed" label="Opened acme.com" error="The site didn't answer." />
 */
export function MessageStep({
  label,
  meta,
  status = "done",
  error,
  statusLabels,
  className,
  ...props
}: MessageStepProps) {
  return (
    <li
      data-slot="message-step"
      data-status={status}
      className={cn("flex max-w-full min-w-0 flex-col gap-0.5", className)}
      {...props}
    >
      <span className="sr-only">
        {statusLabels?.[status] ?? STEP_STATUS_LABELS[status]}:
      </span>
      <ToolCallChip label={label} meta={meta}>
        {STEP_ICONS[status]}
      </ToolCallChip>
      {error ? (
        <span
          data-slot="message-step-error"
          className="ps-2 text-xs text-muted-foreground"
        >
          {error}
        </span>
      ) : null}
    </li>
  );
}

/* ------------------------------------------------------------------------------------------------
 * MessagePlan
 * ----------------------------------------------------------------------------------------------*/

/** Where one item of a `MessagePlan` stands. `stopped`: the turn was stopped before it finished. */
export type MessagePlanItemState =
  "todo" | "doing" | "done" | "failed" | "stopped";

/** One item of a `MessagePlan`. */
export interface MessagePlanItem {
  /** A stable key; the item's position when omitted. @default undefined */
  id?: string;
  /** What the item is: "Match lines 10–20". */
  label: React.ReactNode;
  /** Where it stands. */
  state: MessagePlanItemState;
}

/** Props accepted by `MessagePlan`. */
export interface MessagePlanProps extends React.ComponentProps<"ol"> {
  /** The checklist, in order; the agent updates it in place. */
  items: readonly MessagePlanItem[];
  /**
   * The words a screen reader hears for each state, since the icon is what shows it.
   * @default { todo: "To do", doing: "In progress", done: "Done", failed: "Failed", stopped: "Stopped" }
   */
  stateLabels?: Partial<Record<MessagePlanItemState, string>>;
}

const PLAN_STATE_LABELS: Record<MessagePlanItemState, string> = {
  todo: "To do",
  doing: "In progress",
  done: "Done",
  failed: "Failed",
  stopped: "Stopped",
};

const PLAN_ICONS: Record<MessagePlanItemState, React.ReactNode> = {
  todo: <Circle aria-hidden className="text-muted-foreground" />,
  doing: (
    <Spinner
      aria-hidden
      role={undefined}
      aria-label={undefined}
      className="size-3.5"
    />
  ),
  done: <CircleCheck aria-hidden className="text-success-text" />,
  failed: <CircleX aria-hidden className="text-destructive-text" />,
  stopped: <CircleMinus aria-hidden className="text-muted-foreground" />,
};

/**
 * `MessagePlan` — the agent's checklist, edited in place as it works. Pass the whole list each time;
 * the item in hand spins, the finished ones go quiet.
 *
 * @example
 * <MessagePlan items={[
 *   { label: "Read the BOQ sheet", state: "done" },
 *   { label: "Match lines 10–20", state: "doing" },
 *   { label: "Update the rows", state: "todo" },
 * ]} />
 */
export function MessagePlan({
  items,
  stateLabels,
  className,
  ...props
}: MessagePlanProps) {
  return (
    <ol
      data-slot="message-plan"
      className={cn("flex min-w-0 flex-col gap-1", className)}
      {...props}
    >
      {items.map((item, index) => (
        <li
          key={item.id ?? index}
          data-slot="message-plan-item"
          data-state={item.state}
          className="flex min-w-0 items-start gap-2 text-sm data-[state=done]:text-muted-foreground data-[state=stopped]:text-muted-foreground data-[state=todo]:text-muted-foreground"
        >
          <span
            aria-hidden
            className="inline-flex h-5 shrink-0 items-center [&_svg:not([class*='size-'])]:size-3.5"
          >
            {PLAN_ICONS[item.state]}
          </span>
          <span className="sr-only">
            {stateLabels?.[item.state] ?? PLAN_STATE_LABELS[item.state]}:
          </span>
          <span className="min-w-0">{item.label}</span>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------------------------------------
 * MessageStatus, MessageNotice
 * ----------------------------------------------------------------------------------------------*/

/**
 * `MessageStatus` — the one line that says what the agent is doing now, replaced as it moves on and
 * gone when the text starts. `StatusLine`, defaulting to `progress`; `status="error"` with an
 * `action` is how a failed turn offers Retry. Not a live region: the host announces (see above).
 *
 * @example
 * <MessageStatus>Reading 2 meeting notes…</MessageStatus>
 */
export function MessageStatus({
  status = "progress",
  live = false,
  ...props
}: StatusLineProps) {
  return (
    <StatusLine
      data-slot="message-status"
      status={status}
      live={live}
      {...props}
    />
  );
}

/** Props accepted by `MessageNotice`. */
export type MessageNoticeProps = Omit<StatusLineProps, "status">;

/**
 * `MessageNotice` — a quiet ⓘ line about the answer, with its one action.
 *
 * @example
 * <MessageNotice action={<Button size="xs" variant="outline">Reply privately</Button>}>
 *   1 more source is private to you.
 * </MessageNotice>
 */
export function MessageNotice({ live = false, ...props }: MessageNoticeProps) {
  return (
    <StatusLine
      data-slot="message-notice"
      status="info"
      live={live}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------------------------------------
 * MessageChange
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `MessageChange`. */
export interface MessageChangeProps extends React.ComponentProps<"div"> {
  /** Replaces the check. @default undefined */
  icon?: React.ReactNode;
  /** The row's action, at its end: a small `Button` such as Undo. @default undefined */
  action?: React.ReactNode;
}

/**
 * `MessageChange` — one thing the agent changed: what it did, and Undo at the end of the row.
 *
 * @example
 * <MessageChange action={<Button size="xs" variant="ghost">Undo</Button>}>
 *   Created task SR-41 Test 3000 K samples
 * </MessageChange>
 */
export function MessageChange({
  icon,
  action,
  className,
  children,
  ...props
}: MessageChangeProps) {
  return (
    <div
      data-slot="message-change"
      className={cn("flex min-w-0 items-start gap-2 text-sm", className)}
      {...props}
    >
      <span
        aria-hidden
        className="inline-flex h-5 shrink-0 items-center text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5"
      >
        {icon ?? <Check />}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
      {action ? (
        <span
          data-slot="message-change-action"
          className="-my-0.5 inline-flex shrink-0 items-center gap-1"
        >
          {action}
        </span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * MessageHandoff
 * ----------------------------------------------------------------------------------------------*/

/**
 * `MessageHandoff` — the divider where one agent passes the conversation to another.
 *
 * @example
 * <MessageHandoff>Assistant asked BOQ processor</MessageHandoff>
 */
export function MessageHandoff({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-handoff"
      className={cn(
        "flex min-w-0 items-center gap-2 text-xs text-muted-foreground",
        className,
      )}
      {...props}
    >
      <CornerDownRight aria-hidden className="size-3.5 shrink-0" />
      <span className="min-w-0">{children}</span>
      <Separator aria-hidden className="min-w-4 flex-1" />
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * MessageSources
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `MessageSources`. */
export interface MessageSourcesProps extends React.ComponentProps<"div"> {
  /** The word before the chips, which also names the group. @default "Sources" */
  label?: string;
}

/**
 * `MessageSources` — the row of records the answer came from. Pass `Citation` children, in the
 * order the answer's `[n]` markers cite them.
 *
 * @example
 * <MessageSources>
 *   <Citation href="/meetings/28">Range review 28 Oct</Citation>
 * </MessageSources>
 */
export function MessageSources({
  label = "Sources",
  className,
  children,
  ...props
}: MessageSourcesProps) {
  return (
    <div
      data-slot="message-sources"
      role="group"
      aria-label={label}
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-2",
        className,
      )}
      {...props}
    >
      <span aria-hidden className="text-xs text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * MessageDisclaimer
 * ----------------------------------------------------------------------------------------------*/

/**
 * `MessageDisclaimer` — the muted line under an AI answer.
 *
 * @example
 * <MessageDisclaimer>Generated by AI · can make mistakes</MessageDisclaimer>
 */
export function MessageDisclaimer({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="message-disclaimer"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------------------------------------
 * MessageActions
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `MessageActions`. */
export interface MessageActionsProps extends React.ComponentProps<"div"> {
  /**
   * `hover` — shown while the pointer is over the message or focus is inside it, and always on a
   * touch screen. `always` — for the last message, where the next step is likely one of these.
   * @default "hover"
   */
  reveal?: "hover" | "always";
  /** Names the group of buttons. @default "Message actions" */
  label?: string;
}

/**
 * Shown while the pointer is over the `Message` or focus is inside it, always on a touch screen —
 * `MessageActions reveal="hover"` and `MessageTime reveal="hover"`. The place is kept while hidden.
 */
const REVEAL_ON_HOVER =
  "opacity-0 transition-opacity duration-150 group-hover/message:opacity-100 group-focus-within/message:opacity-100 hover:opacity-100 focus-within:opacity-100 has-data-popup-open:opacity-100 pointer-coarse:opacity-100";

/**
 * One button style in the actions row, whatever size a host passes: every button in it (a `Button`,
 * `CopyButton` or `Toggle`, bare or inside a `TooltipTrigger` or `PopoverTrigger`, which rename its
 * `data-slot`) is the 28px square of `Button size="icon-sm"` with a 16px icon, so Copy, Retry, 👍
 * and 👎 always match. The rules outrank a button's own size rules (an `icon-xs` button's 12px icon,
 * a `Toggle`'s 32px height, the padding beside a `data-icon` icon: `:not([hidden])` lifts the
 * padding rule past `has-data-[icon=…]:ps-*`); an icon given its own `size-*` class keeps it.
 */
const ONE_BUTTON_SIZE =
  "[&_button]:size-7 [&_button]:min-w-7 [&_button:not([hidden])]:px-0 [&_button]:rounded-[min(var(--radius-md),12px)] [&_button_svg:not([class*='size-'])]:size-4";

/**
 * `MessageActions` — Copy, Retry and the rest, in a row under the message. Pass a ghost `Button`
 * for an action and a `Toggle` for a rating (👍, 👎), icon-only; the row makes every button the same
 * 28px square with a 16px icon, whatever size it was given or whatever trigger wraps it. Their
 * place is kept while they are hidden, so the conversation never jumps. Hover reveals them across
 * the whole `Message`; outside one, only over the row itself.
 *
 * @example
 * <MessageActions>
 *   <Button size="icon-sm" variant="ghost" aria-label="Copy"><Copy aria-hidden /></Button>
 *   <Toggle aria-label="Good answer"><ThumbsUp aria-hidden /></Toggle>
 * </MessageActions>
 */
export function MessageActions({
  reveal = "hover",
  label = "Message actions",
  className,
  ...props
}: MessageActionsProps) {
  return (
    <div
      data-slot="message-actions"
      data-reveal={reveal}
      role="group"
      aria-label={label}
      className={cn(
        "flex min-w-0 items-center gap-0.5 text-muted-foreground",
        ONE_BUTTON_SIZE,
        reveal === "hover" && REVEAL_ON_HOVER,
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------------------------------------
 * MessageVersionSwitch
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `MessageVersionSwitch`. */
export interface MessageVersionSwitchProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  /** The version on screen, counting from 1. */
  current: number;
  /** How many versions there are. */
  total: number;
  /** Go to the earlier version. @default undefined */
  onPrevious?: () => void;
  /** Go to the later version. @default undefined */
  onNext?: () => void;
  /** Names the control. @default "Versions" */
  label?: string;
  /** The ‹ button's name. @default "Previous version" */
  previousLabel?: string;
  /** The › button's name. @default "Next version" */
  nextLabel?: string;
  /** The position between the buttons. @default (current, total) => `${current} of ${total}` */
  formatPosition?: (current: number, total: number) => string;
}

/**
 * `MessageVersionSwitch` — "‹ 1 of 2 ›" on an answer that was retried, so the earlier one is never
 * lost. Renders nothing until there are two versions. Each arrow turns off at its end.
 *
 * @example
 * <MessageVersionSwitch current={version} total={2} onPrevious={back} onNext={forward} />
 */
export function MessageVersionSwitch({
  current,
  total,
  onPrevious,
  onNext,
  label = "Versions",
  previousLabel = "Previous version",
  nextLabel = "Next version",
  formatPosition = (position, count) => `${position} of ${count}`,
  className,
  ...props
}: MessageVersionSwitchProps) {
  if (total < 2) return null;
  const at = Math.min(Math.max(current, 1), total);
  return (
    <div
      data-slot="message-version-switch"
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-0.5 text-xs text-muted-foreground",
        className,
      )}
      {...props}
    >
      <Button
        size="icon-xs"
        variant="ghost"
        aria-label={previousLabel}
        disabled={at <= 1}
        onClick={onPrevious}
      >
        <ChevronLeft aria-hidden />
      </Button>
      <span
        data-slot="message-version-switch-position"
        className="tabular-nums"
      >
        {formatPosition(at, total)}
      </span>
      <Button
        size="icon-xs"
        variant="ghost"
        aria-label={nextLabel}
        disabled={at >= total}
        onClick={onNext}
      >
        <ChevronRight aria-hidden />
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * MessageFold
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `MessageFold`. */
export interface MessageFoldProps extends React.ComponentProps<"div"> {
  /** Controlled: the whole message shows. Pair with `onOpenChange`. @default undefined */
  open?: boolean;
  /**
   * Start with the whole message showing. A turn streamed in this session starts open, so an answer
   * never folds up while someone is reading it; only history folds.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when Show more or Show less is pressed, or focus reaches folded content. @default undefined */
  onOpenChange?: (open: boolean) => void;
  /** @default "Show more" */
  showMoreLabel?: string;
  /** @default "Show less" */
  showLessLabel?: string;
}

/**
 * Where a fold of `element` at `limit` pixels should end so no line of text is cut through: the top
 * of the first text line that crosses `limit`, or `limit` when none does. Text only, line by line
 * (a Range over each text node), so a block's box never counts as a line; a cut that would keep
 * less than half the fold (one tall unbroken line) stays at `limit`.
 */
export function foldLineCut(element: HTMLElement, limit: number): number {
  if (typeof document === "undefined" || !document.createRange) return limit;
  const top = element.getBoundingClientRect().top;
  const range = document.createRange();
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let cut = limit;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    range.selectNodeContents(node);
    const box = range.getBoundingClientRect();
    // Text below the fold ends the walk; text wholly above the cut has no line to cut.
    if (box.top - top >= limit) break;
    if (box.bottom - top <= cut) continue;
    for (const rect of range.getClientRects()) {
      const lineTop = rect.top - top;
      if (lineTop >= limit) break;
      if (rect.height > 0 && lineTop < cut && rect.bottom - top > cut)
        cut = lineTop;
    }
  }
  return cut >= limit / 2 ? Math.floor(cut) : limit;
}

/**
 * `MessageFold` — holds a long message to 20rem, fading at the foot, with Show more. It measures:
 * content that fits is left alone, with no fade and no button. The fold ends between two lines of
 * text, never through one, and the fade covers the last whole lines. Tabbing to a link in the hidden
 * part opens it, so the keyboard never lands on something out of sight.
 *
 * @example
 * <MessageFold defaultOpen={streamedHere}>
 *   <MarkdownView>{text}</MarkdownView>
 * </MessageFold>
 */
export function MessageFold({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  showMoreLabel = "Show more",
  showLessLabel = "Show less",
  className,
  children,
  ...props
}: MessageFoldProps) {
  const [ownOpen, setOwnOpen] = React.useState(defaultOpen);
  const open = openProp ?? ownOpen;
  const setOpen = (next: boolean) => {
    setOwnOpen(next);
    onOpenChange?.(next);
  };
  const [content, setContent] = React.useState<HTMLDivElement | null>(null);
  // Frozen while open: unclamped content no longer overflows, which would take Show less away.
  const overflowing = useOverflow(content, { axis: "block", paused: open });
  const contentId = React.useId();
  const folded = !open && overflowing;
  // The fold's height: 20rem, raised to the line boundary above it once laid out.
  const [cut, setCut] = React.useState<number | null>(null);
  React.useLayoutEffect(() => {
    if (!folded || !content || typeof ResizeObserver === "undefined") {
      setCut(null);
      return;
    }
    const measure = () => {
      // `max-h-80`: 20rem, read from the root size rather than the element, whose max-height is
      // the last cut once one is set.
      const limit =
        20 * parseFloat(getComputedStyle(document.documentElement).fontSize);
      if (!Number.isFinite(limit)) return;
      // Content that now fits under 20rem needs no cut (and the fold lets it go).
      const next =
        content.scrollHeight <= limit ? null : foldLineCut(content, limit);
      setCut((previous) => (previous === next ? previous : next));
    };
    measure();
    // A width change rewraps the lines; the unclipped children change with the text.
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    for (const child of content.children) observer.observe(child);
    const mutations = new MutationObserver(() => {
      for (const child of content.children) observer.observe(child);
      measure();
    });
    mutations.observe(content, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [folded, content]);
  return (
    <div
      data-slot="message-fold"
      data-folded={folded ? "" : undefined}
      className={cn("flex min-w-0 flex-col items-start gap-1", className)}
      {...props}
    >
      <div
        ref={setContent}
        id={contentId}
        data-slot="message-fold-content"
        onFocusCapture={(event) => {
          if (folded && event.target.matches(":focus-visible")) setOpen(true);
        }}
        style={folded && cut !== null ? { maxHeight: cut } : undefined}
        className={cn(
          "w-full min-w-0",
          !open && "max-h-80 overflow-hidden",
          folded && "mask-b-from-80% mask-b-to-100%",
        )}
      >
        {children}
      </div>
      {overflowing ? (
        <Button
          variant="ghost"
          size="xs"
          aria-controls={contentId}
          onClick={() => setOpen(!open)}
          className="-ms-2 text-muted-foreground hover:text-foreground"
        >
          {open ? showLessLabel : showMoreLabel}
        </Button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * MessageBubble
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `MessageBubble`. */
export type MessageBubbleProps = React.ComponentProps<typeof Bubble>;

/**
 * `MessageBubble` — a person's message in a conversation: `Bubble` on the muted surface with
 * foreground text, the line breaks they typed kept, at the same reading size and leading as the
 * answer beside it (`proseReading.root`, the reading scale's body). End-aligned by default.
 *
 * @example
 * <Message align="end">
 *   <MessageContent>
 *     <MessageBubble>{"Search the web for TM-21\nand LM-80."}</MessageBubble>
 *   </MessageContent>
 * </Message>
 */
export function MessageBubble({
  variant = "muted",
  align = "end",
  children,
  ...props
}: MessageBubbleProps) {
  return (
    <Bubble data-message-bubble="" variant={variant} align={align} {...props}>
      <BubbleContent
        className={cn("whitespace-pre-wrap text-foreground", proseReading.root)}
      >
        {children}
      </BubbleContent>
    </Bubble>
  );
}

/* ------------------------------------------------------------------------------------------------
 * MessageTime
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `MessageTime`. */
export interface MessageTimeProps extends RelativeTimeProps {
  /**
   * `always` — a person's message: the time is always there. `hover` — an answer: shown while the
   * pointer is over the `Message` or focus is inside it, and always on a touch screen.
   * @default "always"
   */
  reveal?: "always" | "hover";
}

/**
 * `MessageTime` — when a message was sent: `RelativeTime` ("2m ago") in small muted type, with the
 * full date in its tooltip. Put it under the bubble or beside the answer's actions.
 *
 * @example
 * <MessageTime date={message.createdAt} />
 * <MessageTime date={answer.createdAt} reveal="hover" />
 */
export function MessageTime({
  reveal = "always",
  className,
  ...props
}: MessageTimeProps) {
  return (
    <RelativeTime
      data-slot="message-time"
      data-reveal={reveal}
      className={cn(
        "text-xs text-muted-foreground tabular-nums",
        reveal === "hover" && REVEAL_ON_HOVER,
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------------------------------------
 * Site icons and source rows — shared by MessageSourceList and MessageActivityResults
 * ----------------------------------------------------------------------------------------------*/

/** A web page an answer cites or a search found. */
export interface MessageSource {
  /** The page's address; the row links to it in a new tab. */
  href: string;
  /** The page's title. Absent: the site stands in. @default undefined */
  title?: string | null;
  /** The site, as people read it: "ies.org". */
  site: string;
  /**
   * The site's icon, served by the host (a favicon proxy on the app's own origin, so the reader's
   * browser never calls the cited site). Absent, or failing to load: a neutral globe.
   * @default undefined
   */
  icon?: string | null;
}

/** A site's 16px icon, or a globe when there is none or it fails to load. Decorative. */
function SiteIcon({
  src,
  className,
}: {
  src?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = React.useState<string | null>(null);
  const showImage = Boolean(src) && failed !== src;
  return (
    <span
      aria-hidden
      data-slot="message-site-icon"
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-background text-muted-foreground [&_svg]:size-3.5",
        className,
      )}
    >
      {showImage ? (
        <img
          src={src!}
          alt=""
          width={16}
          height={16}
          decoding="async"
          referrerPolicy="no-referrer"
          // Dark-on-transparent icons vanish on a dark ground: a light backing in dark mode.
          className="size-full rounded-[inherit] object-contain dark:bg-foreground/90"
          // An image that failed before hydration never fires `error` for React: check on mount.
          ref={(node) => {
            if (node?.complete && node.naturalWidth === 0) setFailed(src!);
          }}
          onError={() => setFailed(src!)}
        />
      ) : (
        <Globe />
      )}
    </span>
  );
}

/* ------------------------------------------------------------------------------------------------
 * MessageSourceList
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `MessageSourceList`. */
export interface MessageSourceListProps extends Omit<
  React.ComponentProps<typeof Collapsible>,
  "className" | "children"
> {
  /** The pages the answer cites, in the order of its `[[n]]` markers. Empty: nothing renders. */
  sources: readonly MessageSource[];
  /** The word on the closed line, which also names the list. @default "Sources" */
  label?: string;
  /** The closed line's words. @default (count) => `${label} · ${count}` */
  formatSummary?: (count: number) => React.ReactNode;
  /** Read after each row's title, since it opens a new tab. @default "(opens in new tab)" */
  newTabLabel?: string;
  /** Classes for the root. @default undefined */
  className?: string;
}

/**
 * `MessageSourceList` — the web pages an answer cites, under its text. Closed, one quiet line: the
 * first three sites' icons and "Sources · 3". Open, a numbered row per page — icon, title, site and
 * ↗ — each row the link. Numbers match the answer's `[[n]]` pills.
 *
 * @example
 * <MessageSourceList sources={[
 *   { href: "https://www.ies.org/standards/tm-21", title: "TM-21-21", site: "ies.org", icon: "/api/favicon?site=ies.org" },
 * ]} />
 */
export function MessageSourceList({
  sources,
  label = "Sources",
  formatSummary,
  newTabLabel = "(opens in new tab)",
  className,
  ...props
}: MessageSourceListProps) {
  if (!sources.length) return null;
  return (
    <Collapsible
      data-slot="message-source-list"
      className={cn(
        "flex w-full min-w-0 flex-col items-start gap-1",
        className,
      )}
      {...props}
    >
      <CollapsibleTrigger
        data-slot="message-source-list-trigger"
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              disclosureTriggerClasses,
              "group/message-source-list max-w-full min-w-0 gap-2 rounded-full border-border ps-1.5 pe-2.5 text-sm font-normal text-muted-foreground hover:text-foreground aria-expanded:not-hover:text-muted-foreground",
            )}
          />
        }
      >
        <span aria-hidden className="flex shrink-0 items-center -space-x-1.5">
          {sources.slice(0, 3).map((source, index) => (
            <SiteIcon
              key={`${source.href}-${index}`}
              src={source.icon}
              className="size-5 rounded-full bg-background p-0.5"
            />
          ))}
        </span>
        <span className="min-w-0 truncate">
          {formatSummary
            ? formatSummary(sources.length)
            : `${label} · ${sources.length}`}
        </span>
        <ChevronRight
          aria-hidden
          className="transition-transform group-aria-expanded/message-source-list:rotate-90"
        />
      </CollapsibleTrigger>
      <CollapsibleContent
        data-slot="message-source-list-content"
        className="w-full min-w-0"
      >
        <ol aria-label={label} className="flex min-w-0 flex-col">
          {sources.map((source, index) => (
            <li key={`${source.href}-${index}`} className="min-w-0">
              <a
                href={source.href}
                target="_blank"
                rel="noreferrer noopener"
                data-slot="message-source"
                className="group/message-source flex min-w-0 items-start gap-2 rounded-md px-2 py-1.5 no-underline state-layer"
              >
                <span className="w-4 shrink-0 text-end text-xs leading-5 text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
                <SiteIcon src={source.icon} className="mt-0.5" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm leading-5 text-foreground">
                    {source.title || source.site}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {source.site}
                  </span>
                </span>
                <ArrowUpRight
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover/message-source:text-foreground"
                />
                <span className="sr-only">{newTabLabel}</span>
              </a>
            </li>
          ))}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ------------------------------------------------------------------------------------------------
 * MessageActivity
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `MessageActivity`. */
export interface MessageActivityProps extends Omit<
  React.ComponentProps<typeof Collapsible>,
  "className" | "children"
> {
  /**
   * The closed line. While running, the current note or step ("Searching the web"); when done, a
   * summary ("Searched the web · 2 searches", "Worked").
   */
  summary: React.ReactNode;
  /**
   * The turn is still working: the line shimmers and a live timer counts. Uncontrolled, the block
   * opens when work starts and closes once, a second after it ends; once the reader closes it, it
   * never opens by itself again.
   * @default false
   */
  running?: boolean;
  /** When the work started, for the live timer while `running` (the server's time, so a reload agrees). @default undefined */
  startedAt?: Date | number | string;
  /** How long the work took, in milliseconds, after the summary once done ("· 14s"). @default undefined */
  ms?: number | null;
  /** Words for a duration in milliseconds. @default (ms) => formatDuration(ms, { unit: "milliseconds" }) → "14s" */
  formatDuration?: (ms: number) => string;
  /** Leads the closed line. @default undefined */
  icon?: React.ReactNode;
  /** Names the open timeline. @default "Activity" */
  label?: string;
  /** The timeline: `MessageActivityNote` and `MessageActivityStep` items, in order. @default undefined */
  children?: React.ReactNode;
  /** Classes for the root. @default undefined */
  className?: string;
}

const formatMs = (ms: number) => formatDuration(ms, { unit: "milliseconds" });

/** How long a finished block stays open before it closes by itself. */
const AUTO_CLOSE_MS = 1000;

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

/**
 * `MessageActivity` — what the agent thought and did on the way to its answer, above the text: one
 * disclosure. Closed, a single line: the current note or step with a shimmer and a live timer while
 * it works, a summary and the time it took once done. Open, a timeline on a thin rule: notes in
 * muted text, and steps with their markers (a spinner while running, a check or the step's icon
 * when done, a faint circle while pending, a cross when failed). A step with children opens in
 * place, indented on a rule of its own (a search's results). Every string is the caller's.
 *
 * Uncontrolled, it opens while `running` and closes once, a second after the work ends; after the
 * reader closes it, it stays closed. Pass `defaultOpen={false}` for a reader who didn't ask (another
 * person, a reloaded chat), or control it with `open` and `onOpenChange`.
 *
 * @example
 * <MessageActivity summary="Searched the web · 2 searches" ms={14000}>
 *   <MessageActivityNote>Planning a search for LM-80 and TM-21.</MessageActivityNote>
 *   <MessageActivityStep icon={<Search />} label="Searched the web" detail="TM-21 projection">
 *     <MessageActivityResults results={results} />
 *   </MessageActivityStep>
 * </MessageActivity>
 */
export function MessageActivity({
  summary,
  running = false,
  startedAt,
  ms,
  formatDuration: format = formatMs,
  icon,
  label = "Activity",
  open: openProp,
  defaultOpen,
  onOpenChange,
  className,
  children,
  ...props
}: MessageActivityProps) {
  const [ownOpen, setOwnOpen] = React.useState(defaultOpen ?? running);
  const open = openProp ?? ownOpen;
  // The reader's own choice wins over the automatic open and close from then on.
  const touched = React.useRef(defaultOpen === false);
  const root = React.useRef<HTMLDivElement>(null);
  const wasRunning = React.useRef(running);
  React.useEffect(() => {
    const started = running && !wasRunning.current;
    const ended = !running && wasRunning.current;
    wasRunning.current = running;
    if (openProp !== undefined || touched.current) return;
    if (started) {
      setOwnOpen(true);
      return;
    }
    if (!ended) return;
    const timer = setTimeout(() => {
      // Never close under the reader's keyboard: focus inside the timeline counts as reading it.
      const focused = root.current?.contains(document.activeElement) ?? false;
      if (!touched.current && !focused) setOwnOpen(false);
    }, AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [running, openProp]);
  const elapsed = useElapsed(startedAt, running);
  const time = running
    ? elapsed !== undefined
      ? format(elapsed)
      : null
    : ms != null
      ? format(ms)
      : null;
  return (
    <Collapsible
      ref={root}
      data-slot="message-activity"
      data-running={running ? "" : undefined}
      open={open}
      onOpenChange={(next, details) => {
        touched.current = true;
        setOwnOpen(next);
        onOpenChange?.(next, details);
      }}
      className={cn(
        "@container/message-activity flex w-full min-w-0 flex-col items-start gap-1",
        className,
      )}
      {...props}
    >
      <CollapsibleTrigger
        data-slot="message-activity-trigger"
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              disclosureTriggerClasses,
              "group/message-activity -ms-2 max-w-full min-w-0 gap-1.5 text-sm font-normal text-muted-foreground hover:text-foreground aria-expanded:not-hover:text-muted-foreground",
            )}
          />
        }
      >
        {icon ? (
          <span
            aria-hidden
            className="inline-flex shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            {icon}
          </span>
        ) : null}
        <span
          data-slot="message-activity-summary"
          className={cn(
            "min-w-0 truncate",
            running && "shimmer motion-reduce:shimmer-none",
          )}
        >
          {summary}
        </span>
        {time ? (
          <span
            data-slot="message-activity-time"
            aria-hidden={running ? true : undefined}
            className="shrink-0 tabular-nums"
          >
            {`· ${time}`}
          </span>
        ) : null}
        <ChevronRight
          aria-hidden
          className="transition-transform group-aria-expanded/message-activity:rotate-90"
        />
      </CollapsibleTrigger>
      <CollapsibleContent
        data-slot="message-activity-content"
        className="w-full min-w-0"
      >
        <ol aria-label={label} className="flex min-w-0 flex-col pt-0.5">
          {children}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
}

/*
 * The timeline. Every item has a 16px marker column at its start; a 1px rule runs from under one
 * marker to the next item's, centred on the column, and the last item draws none. Notes take a
 * small dot as their marker, steps their icon.
 */
const TIMELINE_ITEM =
  "relative flex min-w-0 gap-2 after:absolute after:start-2 after:top-6 after:-bottom-0.5 after:w-px after:-translate-x-1/2 after:bg-border last:after:hidden rtl:after:translate-x-1/2";
const TIMELINE_MARKER =
  "relative z-10 inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground [&_svg:not([class*='size-'])]:size-3.5";

/**
 * `MessageActivityNote` — a note the agent wrote while working ("Planning a search for TM-21."),
 * in muted body text on the timeline.
 *
 * @example
 * <MessageActivityNote>Planning a search for LM-80 and TM-21.</MessageActivityNote>
 */
export function MessageActivityNote({
  className,
  children,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="message-activity-note"
      className={cn(TIMELINE_ITEM, "pb-2", className)}
      {...props}
    >
      <span aria-hidden className={cn(TIMELINE_MARKER, "h-6")}>
        <span className="size-1.5 rounded-full bg-muted-foreground/60" />
      </span>
      <span className="min-w-0 flex-1 text-sm/6 whitespace-pre-wrap text-muted-foreground">
        {children}
      </span>
    </li>
  );
}

/** Props accepted by `MessageActivityStep`. */
export interface MessageActivityStepProps extends Omit<
  React.ComponentProps<"li">,
  "children"
> {
  /** What the step did, in muted type: "Searched the web", "Opened", "Used skill". */
  label: React.ReactNode;
  /** What it did it to, in body ink: the query, the page, the skill. @default undefined */
  detail?: React.ReactNode;
  /** A short result after it: "8 results". @default undefined */
  meta?: React.ReactNode;
  /**
   * The step's marker once done (a magnifier, a globe). Running shows a spinner, pending a faint
   * circle, failed a cross, stopped a dash.
   * @default a check
   */
  icon?: React.ReactNode;
  /** `running` is the active step; `pending` one not started yet. @default "done" */
  status?: MessageStepStatus;
  /** Why a failed step failed, under it in muted text. @default undefined */
  error?: React.ReactNode;
  /**
   * The words a screen reader hears for each status, read before the step.
   * @default { pending: "Not started", running: "Running", done: "Done", failed: "Failed", stopped: "Stopped" }
   */
  statusLabels?: Partial<Record<MessageStepStatus, string>>;
  /** What opens under the step (`MessageActivityResults`). With it, the step is a disclosure. @default undefined */
  children?: React.ReactNode;
  /** Start open. @default false */
  defaultOpen?: boolean;
  /** Controlled open state. @default undefined */
  open?: boolean;
  /** Called when the step opens or closes. @default undefined */
  onOpenChange?: (open: boolean) => void;
}

/**
 * `MessageActivityStep` — one thing the agent did, on `MessageActivity`'s timeline: its marker,
 * what it did and what to. A step with children is a button that opens them in place — a search's
 * results — indented on a rule of their own.
 *
 * @example
 * <MessageActivityStep icon={<Search />} label="Searched the web" detail="TM-21 projection" meta="8 results">
 *   <MessageActivityResults results={results} />
 * </MessageActivityStep>
 * <MessageActivityStep status="failed" icon={<Globe />} label="Opened" detail="ies.org" error="The site didn't answer." />
 */
export function MessageActivityStep({
  label,
  detail,
  meta,
  icon,
  status = "done",
  error,
  statusLabels,
  children,
  defaultOpen,
  open,
  onOpenChange,
  className,
  ...props
}: MessageActivityStepProps) {
  const marker =
    status === "done" ? (icon ?? STEP_ICONS.done) : STEP_ICONS[status];
  const words = (
    <>
      <span className="sr-only">
        {statusLabels?.[status] ?? STEP_STATUS_LABELS[status]}:
      </span>
      <span
        className={cn(
          "shrink-0 text-muted-foreground",
          status === "running" && "text-foreground",
        )}
      >
        {label}
      </span>
      {detail != null ? (
        <span
          className={cn(
            "min-w-0 truncate text-foreground",
            status === "pending" && "text-muted-foreground",
          )}
        >
          {detail}
        </span>
      ) : null}
      {meta != null ? (
        // In a narrow column the object reads first: the count steps aside.
        <span className="shrink-0 text-muted-foreground @max-sm/message-activity:sr-only">
          · {meta}
        </span>
      ) : null}
    </>
  );
  const reason = error ? (
    <span
      data-slot="message-activity-step-error"
      className="text-xs text-muted-foreground"
    >
      {error}
    </span>
  ) : null;
  return (
    <li
      data-slot="message-activity-step"
      data-status={status}
      className={cn(TIMELINE_ITEM, "pb-1", className)}
      {...props}
    >
      <span aria-hidden className={cn(TIMELINE_MARKER, "h-7")}>
        {marker}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        {children ? (
          <Collapsible
            defaultOpen={defaultOpen}
            open={open}
            onOpenChange={onOpenChange}
            className="flex min-w-0 flex-col"
          >
            <CollapsibleTrigger
              data-slot="message-activity-step-trigger"
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    disclosureTriggerClasses,
                    "group/message-activity-step -ms-2 max-w-full min-w-0 justify-start gap-2 self-start text-sm font-normal",
                  )}
                />
              }
            >
              {words}
              <ChevronRight
                aria-hidden
                className="text-muted-foreground transition-transform group-aria-expanded/message-activity-step:rotate-90"
              />
            </CollapsibleTrigger>
            {reason}
            <CollapsibleContent
              data-slot="message-activity-step-content"
              className="min-w-0 py-1"
            >
              {children}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <>
            <div className="flex min-h-7 max-w-full min-w-0 items-center gap-2 text-sm">
              {words}
            </div>
            {reason}
          </>
        )}
      </div>
    </li>
  );
}

/** Props accepted by `MessageActivityResults`. */
export interface MessageActivityResultsProps extends Omit<
  React.ComponentProps<"div">,
  "results"
> {
  /** The pages the step found, each a link that opens in a new tab. */
  results: readonly MessageSource[];
  /** The caption over the list, which also names it. @default "Results" */
  label?: string;
  /** Read after each title, since it opens a new tab. @default "(opens in new tab)" */
  newTabLabel?: string;
}

/**
 * `MessageActivityResults` — what a search found, under its `MessageActivityStep`: a captioned list
 * on a light panel — the only panel in the activity — each row the site's icon, the title and the site, and each row the link.
 *
 * @example
 * <MessageActivityResults results={[{ href: "https://www.ies.org/…", title: "TM-21-21", site: "ies.org" }]} />
 */
export function MessageActivityResults({
  results,
  label = "Results",
  newTabLabel = "(opens in new tab)",
  className,
  ...props
}: MessageActivityResultsProps) {
  const captionId = React.useId();
  return (
    <div
      data-slot="message-activity-results"
      className={cn(
        "flex min-w-0 flex-col gap-0.5 rounded-lg bg-muted/50 p-1",
        className,
      )}
      {...props}
    >
      <span
        id={captionId}
        className="px-2 pt-1 pb-0.5 text-xs text-muted-foreground"
      >
        {label}
      </span>
      <ul aria-labelledby={captionId} className="flex min-w-0 flex-col">
        {results.map((result, index) => (
          <li key={`${result.href}-${index}`} className="min-w-0">
            <a
              href={result.href}
              target="_blank"
              rel="noreferrer noopener"
              data-slot="message-activity-result"
              className="group/message-activity-result flex min-w-0 items-center gap-2 rounded-md px-2 py-1 text-sm no-underline state-layer"
            >
              <SiteIcon src={result.icon} />
              <span className="min-w-0 flex-1 truncate text-foreground">
                {result.title || result.site}
              </span>
              <span className="max-w-2/5 shrink-0 truncate text-xs text-muted-foreground">
                {result.site}
              </span>
              <span className="sr-only">{newTabLabel}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
