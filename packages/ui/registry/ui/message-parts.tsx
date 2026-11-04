// @vegastack message-parts@0.40.0 sha256-7IKOz/RQHWatVufdFCj4K8p3IyRVzlqGy2DiiqYcT6Q=

"use client";

import * as React from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleCheck,
  CircleX,
  CornerDownRight,
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

/* ------------------------------------------------------------------------------------------------
 * Message parts — what an agent's answer is made of beyond its text, for `Message` and `Bubble`.
 *
 * These live in their own item, not in `message.tsx`: that file is upstream's, and a new export
 * there would be a hunk no decision row covers. They compose inside `MessageContent` like upstream's
 * own parts do. Two things a chat needs are already upstream's, so nothing here repeats them: a
 * person's message is `Bubble` with `align="end"`, and a streaming message is `aria-busy` on
 * `Message` (it spreads its props).
 *
 * Every string is the caller's: this system knows steps and sources, never what an agent is called
 * or what it did.
 * ----------------------------------------------------------------------------------------------*/

/* ------------------------------------------------------------------------------------------------
 * MessageSteps
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `MessageSteps`. */
export interface MessageStepsProps extends React.ComponentProps<
  typeof Collapsible
> {
  /** The collapsed line: "3 steps · Searched meetings, read 2 notes". */
  summary: React.ReactNode;
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
              "group/message-steps -ms-1.5 max-w-full min-w-0 justify-start font-normal text-muted-foreground hover:text-foreground",
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

/** The three states a `MessageStep` reports. */
export type MessageStepStatus = "running" | "done" | "failed";

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
}

const STEP_ICONS: Record<MessageStepStatus, React.ReactNode> = {
  running: <Spinner aria-hidden role={undefined} aria-label={undefined} />,
  done: <Check aria-hidden />,
  failed: <X aria-hidden className="text-destructive-text" />,
};

/**
 * `MessageStep` — one step in `MessageSteps`: a `ToolCallChip` with a spinner, a check or a cross,
 * and the reason under it when it failed.
 *
 * @example
 * <MessageStep status="failed" label="Opened acme.com" error="The site didn't answer." />
 */
export function MessageStep({
  label,
  meta,
  status = "done",
  error,
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

/** Where one item of a `MessagePlan` stands. */
export type MessagePlanItemState = "todo" | "doing" | "done" | "failed";

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
   * @default { todo: "To do", doing: "In progress", done: "Done", failed: "Failed" }
   */
  stateLabels?: Partial<Record<MessagePlanItemState, string>>;
}

const PLAN_STATE_LABELS: Record<MessagePlanItemState, string> = {
  todo: "To do",
  doing: "In progress",
  done: "Done",
  failed: "Failed",
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
          className="flex min-w-0 items-start gap-2 text-sm data-[state=done]:text-muted-foreground data-[state=todo]:text-muted-foreground"
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
 * `action` is how a failed turn offers Retry.
 *
 * @example
 * <MessageStatus>Reading 2 meeting notes…</MessageStatus>
 */
export function MessageStatus({
  status = "progress",
  ...props
}: StatusLineProps) {
  return <StatusLine data-slot="message-status" status={status} {...props} />;
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
export function MessageNotice(props: MessageNoticeProps) {
  return <StatusLine data-slot="message-notice" status="info" {...props} />;
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
      <span className="min-w-0 truncate">{children}</span>
      <Separator className="min-w-4 flex-1" />
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
 * Their place is kept while they are hidden, so the conversation never jumps.
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
          "opacity-0 transition-opacity duration-150 group-hover/message:opacity-100 group-focus-within/message:opacity-100 focus-within:opacity-100 has-data-popup-open:opacity-100 pointer-coarse:opacity-100",
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
  formatPosition = (at, of) => `${at} of ${of}`,
  className,
  ...props
}: MessageVersionSwitchProps) {
  if (total < 2) return null;
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
        disabled={current <= 1}
        onClick={onPrevious}
      >
        <ChevronLeft aria-hidden />
      </Button>
      <span data-slot="message-version-position" className="tabular-nums">
        {formatPosition(current, total)}
      </span>
      <Button
        size="icon-xs"
        variant="ghost"
        aria-label={nextLabel}
        disabled={current >= total}
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
  /**
   * The content is long enough to fold. The host measures it (a message's rendered length), so a
   * short answer never carries the button.
   * @default true
   */
  foldable?: boolean;
  /** Start unfolded. @default false */
  defaultOpen?: boolean;
  /** @default "Show more" */
  showMoreLabel?: string;
  /** @default "Show less" */
  showLessLabel?: string;
}

/**
 * `MessageFold` — holds a long message to a few lines' height, fading at the foot, with Show more.
 *
 * @example
 * <MessageFold foldable={text.length > 1500}>
 *   <MarkdownView>{text}</MarkdownView>
 * </MessageFold>
 */
export function MessageFold({
  foldable = true,
  defaultOpen = false,
  showMoreLabel = "Show more",
  showLessLabel = "Show less",
  className,
  children,
  ...props
}: MessageFoldProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const contentId = React.useId();
  const folded = foldable && !open;
  return (
    <div
      data-slot="message-fold"
      data-folded={folded ? "" : undefined}
      className={cn("flex min-w-0 flex-col items-start gap-1", className)}
      {...props}
    >
      <div
        id={contentId}
        data-slot="message-fold-content"
        className={cn(
          "w-full min-w-0",
          folded && "max-h-80 overflow-hidden mask-b-from-80% mask-b-to-100%",
        )}
      >
        {children}
      </div>
      {foldable ? (
        <Button
          variant="ghost"
          size="xs"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            disclosureTriggerClasses,
            "-ms-2 text-muted-foreground hover:text-foreground",
          )}
        >
          {open ? showLessLabel : showMoreLabel}
        </Button>
      ) : null}
    </div>
  );
}
