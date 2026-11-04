// @vegastack message-parts@0.40.0 sha256-ZQhJN263x7q1216+8yCszZVOJwNpwZEOtKWUXTKntUU=

"use client";

import * as React from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleCheck,
  CircleMinus,
  CircleX,
  CornerDownRight,
  Minus,
  X,
} from "lucide-react";
import { cn } from "@vegastack/design";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { disclosureTriggerClasses } from "@/lib/disclosure-trigger";
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
export type MessageStepStatus = "running" | "done" | "failed" | "stopped";

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
  running: "Running",
  done: "Done",
  failed: "Failed",
  stopped: "Stopped",
};

const STEP_ICONS: Record<MessageStepStatus, React.ReactNode> = {
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
 * `MessageActions` — Copy, Retry and the rest, in a row under the message. Pass small ghost buttons.
 * Their place is kept while they are hidden, so the conversation never jumps. Hover reveals them
 * across the whole `Message`; outside one, only over the row itself.
 *
 * @example
 * <MessageActions>
 *   <Button size="icon-xs" variant="ghost" aria-label="Copy"><Copy aria-hidden /></Button>
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
        reveal === "hover" &&
          "opacity-0 transition-opacity duration-150 group-hover/message:opacity-100 group-focus-within/message:opacity-100 hover:opacity-100 focus-within:opacity-100 has-data-popup-open:opacity-100 pointer-coarse:opacity-100",
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
 * `MessageFold` — holds a long message to 20rem, fading at the foot, with Show more. It measures:
 * content that fits is left alone, with no fade and no button. Tabbing to a link in the hidden part
 * opens it, so the keyboard never lands on something out of sight.
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
