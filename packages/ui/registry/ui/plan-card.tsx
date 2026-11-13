// @vegastack plan-card@0.77.0 sha256-+smPztp1kMDz17RbnZB5wSs9B3ZUKmxLRZD+lxPQjb4=

"use client";

import * as React from "react";
import {
  ChevronDown,
  CircleCheck,
  CircleX,
  ClipboardList,
  Clock,
  MessageSquare,
  PencilLine,
  Replace,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@vegastack/design";

import { Button } from "@/components/ui/button";
import { EffectPill, type PlanEffect } from "@/components/ui/effect-pill";
import {
  PersonAvatar,
  type Person,
  type PersonMark,
} from "@/components/ui/person-avatar";
import { Textarea } from "@/components/ui/textarea";
import { useAnnouncer } from "@/components/ui/use-announcer";

/* ------------------------------------------------------------------------------------------------
 * PlanCard — an agent's plan, put to the person before it changes anything: a title and a goal,
 * numbered steps each with what it does (an `EffectPill`) and what it touches, what it assumes,
 * what it won't do, what it will still ask about, and how risky it is. Four answers: Accept ·
 * Accept and allow these in this chat · Request changes (overall and per step) · Reject. A revised
 * plan marks what changed since the last version. Once answered, the card closes to one line in
 * the same words on every channel ("✓ Plan accepted by Priya · 6 steps").
 *
 * It shares `RequestCard`'s shell (the bordered card, the agent's hexagon, the answers row that
 * stacks in a narrow column, the settled line that is announced when it changes), since a plan is
 * one more question an agent asks before it acts. Every string is the caller's or overridable.
 * ----------------------------------------------------------------------------------------------*/

/** The agent that proposes the plan. */
export interface PlanAgent {
  /** Your stable id for it. */
  id: string;
  /** Its name: "Ops assistant". */
  name: string;
  /** Its mark, shown inside its hexagon. */
  avatar: string | null;
  /**
   * Its own face: a glyph (a ReactNode, such as a lucide icon) or an image object, drawn inside its
   * hexagon. When set it wins over `avatar`, which shows only when `mark` is nullish. Same as
   * `Person.mark`. @default undefined
   */
  mark?: PersonMark;
  /** The hue its hexagon takes behind a glyph or the fallback bot. Same as `Person.hue`. @default undefined */
  hue?: Person["hue"];
}

/** What changed in a step since the previous version. */
export type PlanStepChange = "new" | "changed" | "removed";

/** One step of a plan. */
export interface PlanStep {
  /** A stable key, also passed back with a step comment; the step's position when omitted. */
  id?: string;
  /** The step, imperative and plain: "Move them to Backlog". */
  text: string;
  /** How, in a line or two; shown when the full plan is open. @default undefined */
  detail?: string | null;
  /** What it does to the world. */
  effect: PlanEffect;
  /** What it touches: "12 tasks", "#ops". @default undefined */
  touches?: string | null;
  /** Since the previous version: a dot for new or changed, struck through when removed. @default undefined */
  change?: PlanStepChange | null;
}

/** How risky the host judged the plan. */
export type PlanRisk = "low" | "medium" | "high";

/** The plan, in words — the same data the web, Slack and the phone draw. */
export interface PlanSpec {
  /** The agent that proposes it. */
  agent: PlanAgent;
  /** Its version, from 1. */
  version: number;
  /** "Clean up overdue tasks in Ops". */
  title: string;
  /** What done looks like. */
  goal: string;
  /** The steps, in order (removed ones included, struck through). */
  steps: readonly PlanStep[];
  /** "Overdue means due date before today." @default undefined */
  assumptions?: readonly string[];
  /** What it won't do. @default undefined */
  outOfScope?: readonly string[];
  /** Open points it will assume if nobody says. @default undefined */
  questions?: readonly string[];
  /** What it will still ask about while working: "1 post to #ops". @default undefined */
  willAsk?: string | null;
  /** How risky. */
  risk: PlanRisk;
  /** Why, in a few words: "changes 12 items, posts to a channel". @default undefined */
  riskReason?: string | null;
  /** v2 and later: what changed, in the agent's words. @default undefined */
  revisionNote?: string | null;
}

/**
 * Where the plan stands. `pending` shows the answers; the rest show one line. `accepted_allowed`
 * is Accept and allow these in this chat; `replaced` a plan a newer version took over.
 */
export type PlanCardState =
  | "pending"
  | "accepted"
  | "accepted_allowed"
  | "changes_requested"
  | "rejected"
  | "replaced"
  | "expired";

/** A Request changes answer: an overall note and notes on single steps. */
export interface PlanChangeRequest {
  /** The overall note, trimmed; undefined when empty. */
  note?: string;
  /** Notes on single steps, in step order. */
  steps: { index: number; id?: string; note: string }[];
}

/** Every word the card shows, for another language or another voice. */
export interface PlanCardLabels {
  plan: string;
  version: (version: number) => string;
  goal: string;
  assumes: string;
  wontDo: string;
  questions: string;
  willAsk: string;
  risk: string;
  risks: Record<PlanRisk, string>;
  changes: Record<PlanStepChange, string>;
  moreSteps: (count: number) => string;
  fullPlan: string;
  lessPlan: string;
  commentOnStep: (index: number) => string;
  accept: string;
  acceptAndAllow: string;
  requestChanges: string;
  reject: string;
  whatShouldChange: string;
  notePlaceholder: string;
  stepNote: (index: number) => string;
  tip: string;
  sendChanges: string;
  cancel: string;
  showPlan: string;
  hidePlan: string;
  steps: (count: number) => string;
  accepted: (by: string, steps: number) => string;
  acceptedAllowed: (by: string, steps: number) => string;
  changesRequested: (by: string) => string;
  rejected: (by: string) => string;
  replaced: (version: number | null) => string;
  expired: string;
  waiting: (who: string | null) => string;
}

const LABELS: PlanCardLabels = {
  plan: "Plan",
  version: (v) => `v${v}`,
  goal: "Goal:",
  assumes: "Assumes:",
  wontDo: "Won't do:",
  questions: "Open questions:",
  willAsk: "You'll be asked about:",
  risk: "Risk:",
  risks: { low: "Low", medium: "Medium", high: "High" },
  changes: { new: "New", changed: "Changed", removed: "Removed" },
  moreSteps: (n) => `+ ${n} more ${n === 1 ? "step" : "steps"}`,
  fullPlan: "Full plan",
  lessPlan: "Less",
  commentOnStep: (i) => `Comment on step ${i}`,
  accept: "Accept",
  acceptAndAllow: "Accept and allow these in this chat",
  requestChanges: "Request changes…",
  reject: "Reject",
  whatShouldChange: "What should change?",
  notePlaceholder: "Skip step 4; I'll post it myself.",
  stepNote: (i) => `A note on step ${i}`,
  tip: "Tip: comment on a step with the button beside it.",
  sendChanges: "Send changes",
  cancel: "Cancel",
  showPlan: "Show plan",
  hidePlan: "Hide plan",
  steps: (n) => `${n} ${n === 1 ? "step" : "steps"}`,
  accepted: (by, n) =>
    `Plan accepted${by} · ${n} ${n === 1 ? "step" : "steps"}`,
  acceptedAllowed: (by, n) =>
    `Plan accepted${by} · ${n} ${n === 1 ? "step" : "steps"} · these actions are allowed in this chat`,
  changesRequested: (by) =>
    by ? `${by.trim()} asked for changes` : "Changes asked for",
  rejected: (by) => `Plan rejected${by}`,
  replaced: (v) => (v ? `Plan replaced by v${v}` : "Plan replaced"),
  expired: "Plan expired: no answer in 7 days",
  waiting: (who) =>
    who ? `Waiting for ${who}'s answer` : "Waiting for an answer",
};

const ICON = "size-4 shrink-0";

// COL-25: risk is words, with the ⚠ glyph in the warning ink from medium up — never a coloured dot.
const RISK_TEXT: Record<PlanRisk, string> = {
  low: "text-foreground",
  medium: "text-foreground",
  high: "font-medium text-foreground",
};

/** How many steps show before "+ N more steps". */
const VISIBLE_STEPS = 6;

type Pressed = "accept" | "allow" | "changes" | "reject" | null;

/** Props for `PlanCard`. */
export interface PlanCardProps extends Omit<
  React.ComponentPropsWithRef<"section">,
  "children"
> {
  /** The plan, in words. */
  plan: PlanSpec;
  /** Where it stands. @default "pending" */
  state?: PlanCardState;
  /** Who answered: "you" or "Priya". @default null */
  answeredBy?: string | null;
  /** The version that replaced this one, for `replaced`. @default null */
  replacedBy?: number | null;
  /** The settled line in place of the state's own words. @default null */
  statusText?: string | null;
  /** An answer is on its way: the pressed button spins, the rest are disabled. @default false */
  busy?: boolean;
  /** An error under the card: "Couldn't answer. Try again." @default null */
  error?: string | null;
  /** The viewer may answer. Anyone else sees "Waiting for {waitingFor}'s answer". @default true */
  canAnswer?: boolean;
  /** Who it waits for, when the viewer can't answer: "Manoj". @default null */
  waitingFor?: string | null;
  /** Accept: work starts, nothing new is allowed. @default undefined */
  onAccept?: () => void;
  /** Accept and allow the plan's declared actions in this chat. Without it the button is not offered. @default undefined */
  onAcceptAndAllow?: () => void;
  /** Request changes, with the overall note and any step notes. @default undefined */
  onRequestChanges?: (request: PlanChangeRequest) => void;
  /** Reject the plan. @default undefined */
  onReject?: () => void;
  /** Overrides for any of the card's words. @default undefined */
  labels?: Partial<PlanCardLabels>;
}

function settledLine(
  state: PlanCardState,
  plan: PlanSpec,
  answeredBy: string | null,
  replacedBy: number | null,
  waitingFor: string | null,
  words: PlanCardLabels,
): { text: string; icon: React.ReactNode } {
  const by = answeredBy ? ` by ${answeredBy}` : "";
  const live = plan.steps.filter((s) => s.change !== "removed").length;
  const muted = (Icon: typeof Clock) => (
    <Icon aria-hidden className={cn(ICON, "text-muted-foreground")} />
  );
  switch (state) {
    case "accepted":
      return {
        text: words.accepted(by, live),
        icon: (
          <CircleCheck aria-hidden className={cn(ICON, "text-info-text")} />
        ),
      };
    case "accepted_allowed":
      return {
        text: words.acceptedAllowed(by, live),
        icon: (
          <CircleCheck aria-hidden className={cn(ICON, "text-info-text")} />
        ),
      };
    case "changes_requested":
      return {
        text: words.changesRequested(answeredBy ?? ""),
        icon: muted(PencilLine),
      };
    case "rejected":
      return { text: words.rejected(by), icon: muted(CircleX) };
    case "replaced":
      return { text: words.replaced(replacedBy), icon: muted(Replace) };
    case "expired":
      return { text: words.expired, icon: muted(Clock) };
    default:
      return { text: words.waiting(waitingFor), icon: muted(Clock) };
  }
}

/** A short list under a lead word: "Won't do: touch other spaces · email anyone." */
function NoteLine({
  lead,
  items,
  slot,
}: {
  lead: string;
  items: readonly string[] | undefined;
  slot: string;
}) {
  if (!items?.length) return null;
  return (
    <p data-slot={slot} className="min-w-0 wrap-anywhere">
      <span className="text-muted-foreground">{lead}</span> {items.join(" · ")}
    </p>
  );
}

/**
 * `PlanCard` — an agent's plan before it acts: the goal, the steps with their effects, what it
 * assumes and won't do, what it will still ask, the risk, and Accept · Accept and allow these in
 * this chat · Request changes · Reject. Accept is the one primary answer: the card shows the whole
 * plan, so the click is informed. Request changes opens a note in place, and each step can take
 * its own. A revised plan marks new and changed steps with a dot and strikes removed ones. Answered,
 * the card closes to one line, which is announced when it changes on screen.
 *
 * @example
 * <PlanCard
 *   plan={plan}
 *   state={state}
 *   answeredBy={answeredBy}
 *   busy={pending}
 *   onAccept={() => answer({ kind: "accept" })}
 *   onAcceptAndAllow={() => answer({ kind: "accept", allow: true })}
 *   onRequestChanges={(request) => answer({ kind: "changes", ...request })}
 *   onReject={() => answer({ kind: "reject" })}
 * />
 */
export function PlanCard({
  plan,
  state = "pending",
  answeredBy = null,
  replacedBy = null,
  statusText = null,
  busy = false,
  error = null,
  canAnswer = true,
  waitingFor = null,
  onAccept,
  onAcceptAndAllow,
  onRequestChanges,
  onReject,
  labels,
  className,
  ...props
}: PlanCardProps) {
  const words = { ...LABELS, ...labels } as PlanCardLabels;
  const titleId = React.useId();
  const noteId = React.useId();
  const [pressed, setPressed] = React.useState<Pressed>(null);
  const [expanded, setExpanded] = React.useState(false);
  const [showSettled, setShowSettled] = React.useState(false);
  const [changing, setChanging] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [stepNotes, setStepNotes] = React.useState<Record<number, string>>({});
  const { announce, Announcer } = useAnnouncer();

  const pending = state === "pending";
  const answering = pending && canAnswer;
  const line = settledLine(
    state,
    plan,
    answeredBy,
    replacedBy,
    waitingFor,
    words,
  );

  // Announce the settled line whenever it changes on screen — never on first paint.
  const outcome = pending ? null : (statusText ?? line.text);
  // When the answer removed the control that had focus, focus moves to Show plan.
  const previous = React.useRef(outcome);
  const toggleRef = React.useRef<HTMLButtonElement | null>(null);
  const answeredHere = React.useRef(false);
  React.useEffect(() => {
    if (previous.current === outcome) return;
    previous.current = outcome;
    if (outcome) {
      setChanging(false);
      announce(outcome);
      // Only after this reader's own answer: a remote answer or an expiry never moves focus.
      const active = document.activeElement;
      if (
        answeredHere.current &&
        (!active || active === document.body || !active.isConnected)
      )
        toggleRef.current?.focus();
      answeredHere.current = false;
    }
  }, [outcome, announce]);

  // A new version starts with no notes: a draft keyed to the old steps would land on the wrong one.
  const [version, setVersion] = React.useState(plan.version);
  if (version !== plan.version) {
    setVersion(plan.version);
    setChanging(false);
    setNote("");
    setStepNotes({});
  }

  // Cancelling the change note returns focus to Request changes.
  const changesRef = React.useRef<HTMLButtonElement | null>(null);
  const [refocus, setRefocus] = React.useState(false);
  React.useEffect(() => {
    if (!refocus || changing) return;
    setRefocus(false);
    changesRef.current?.focus();
  }, [refocus, changing]);

  // A step's comment button opens its note and moves focus into it.
  const [focusStep, setFocusStep] = React.useState<number | null>(null);
  const stepNoteRefs = React.useRef(new Map<number, HTMLTextAreaElement>());
  React.useEffect(() => {
    if (focusStep === null) return;
    stepNoteRefs.current.get(focusStep)?.focus();
    setFocusStep(null);
  }, [focusStep]);

  const press = (which: Exclude<Pressed, null>, run: () => void) => {
    if (busy) return;
    setPressed(which);
    answeredHere.current = true;
    run();
  };
  const loading = (which: Exclude<Pressed, null>) => busy && pressed === which;

  const commenting = answering && !!onRequestChanges;
  const openStepNote = (index: number) => {
    setChanging(true);
    setStepNotes((notes) =>
      index in notes ? notes : { ...notes, [index]: "" },
    );
    // The step might sit past the fold.
    if (index >= VISIBLE_STEPS) setExpanded(true);
    setFocusStep(index);
  };

  const sendChanges = () => {
    if (!onRequestChanges) return;
    const steps = Object.entries(stepNotes)
      .map(([i, text]) => ({ index: Number(i), text: text.trim() }))
      .filter((s) => s.text)
      .sort((a, b) => a.index - b.index)
      .map(({ index, text }) => ({
        index,
        ...(plan.steps[index]?.id ? { id: plan.steps[index]!.id } : {}),
        note: text,
      }));
    const overall = note.trim() || undefined;
    press("changes", () => onRequestChanges({ note: overall, steps }));
  };
  const hasChanges =
    note.trim().length > 0 ||
    Object.values(stepNotes).some((text) => text.trim().length > 0);

  const hidden = plan.steps.length - VISIBLE_STEPS;
  const hasDetail = plan.steps.some((s) => s.detail);
  const showAll = expanded || hidden <= 0;
  const visibleSteps = showAll
    ? plan.steps
    : plan.steps.slice(0, VISIBLE_STEPS);

  const steps = (
    <ol
      data-slot="plan-card-steps"
      aria-label={words.steps(plan.steps.length)}
      className="flex min-w-0 flex-col divide-y divide-border border-y border-border"
    >
      {visibleSteps.map((step, index) => {
        const removed = step.change === "removed";
        const stepNote = stepNotes[index];
        return (
          <li
            key={step.id ?? index}
            data-slot="plan-card-step"
            data-effect={step.effect}
            data-change={step.change ?? undefined}
            className="flex min-w-0 flex-col gap-1 py-2"
          >
            <div className="flex min-w-0 items-start gap-2">
              <span
                aria-hidden
                className="inline-flex h-5 w-4 shrink-0 items-center justify-end text-xs text-muted-foreground tabular-nums"
              >
                {index + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 @md/plan-card:flex-row @md/plan-card:items-start @md/plan-card:gap-2">
                <p
                  className={cn(
                    "flex min-w-0 flex-1 items-start gap-1.5",
                    removed && "text-muted-foreground",
                  )}
                >
                  <span className="sr-only">{`${index + 1}. `}</span>
                  {step.change ? (
                    <span className="sr-only">{`${words.changes[step.change]}: `}</span>
                  ) : null}
                  <span
                    className={cn(
                      "min-w-0 wrap-anywhere",
                      removed && "line-through",
                    )}
                  >
                    {step.text}
                  </span>
                  {step.change === "new" || step.change === "changed" ? (
                    <span
                      aria-hidden
                      data-slot="plan-card-step-change"
                      title={words.changes[step.change]}
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                    />
                  ) : null}
                </p>
                <div
                  className={cn(
                    "flex min-w-0 shrink-0 items-center gap-1.5 text-xs text-muted-foreground",
                    removed && "opacity-60",
                  )}
                >
                  {/* Wide: the pill with its word. Narrow: the icon, its word for screen readers. */}
                  <EffectPill
                    effect={step.effect}
                    className="hidden @md/plan-card:inline-flex"
                  />
                  <EffectPill
                    effect={step.effect}
                    iconOnly
                    className="@md/plan-card:hidden"
                  />
                  {step.touches ? (
                    <span className="min-w-0 wrap-anywhere">
                      {step.touches}
                    </span>
                  ) : null}
                </div>
              </div>
              {commenting && !removed ? (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={words.commentOnStep(index + 1)}
                  aria-expanded={stepNote !== undefined}
                  data-slot="plan-card-step-comment"
                  disabled={busy}
                  onClick={() => openStepNote(index)}
                  className="shrink-0"
                >
                  <MessageSquare aria-hidden />
                </Button>
              ) : null}
            </div>
            {showAll && expanded && step.detail ? (
              <p
                data-slot="plan-card-step-detail"
                className="ps-6 text-xs text-muted-foreground wrap-anywhere"
              >
                {step.detail}
              </p>
            ) : null}
            {commenting && changing && stepNote !== undefined ? (
              <div className="ps-6">
                <Textarea
                  ref={(node) => {
                    if (node) stepNoteRefs.current.set(index, node);
                    else stepNoteRefs.current.delete(index);
                  }}
                  data-slot="plan-card-step-note"
                  aria-label={words.stepNote(index + 1)}
                  value={stepNote}
                  onChange={(e) => {
                    const value = e.currentTarget.value;
                    setStepNotes((notes) => ({ ...notes, [index]: value }));
                  }}
                  disabled={busy}
                  className="min-h-14"
                />
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );

  const fold =
    hidden > 0 || hasDetail ? (
      <Button
        variant="ghost"
        size="sm"
        data-slot="plan-card-fold"
        aria-expanded={expanded}
        onClick={() => setExpanded((e) => !e)}
        className="-ms-2 self-start font-normal text-muted-foreground"
      >
        {expanded
          ? words.lessPlan
          : hidden > 0
            ? words.moreSteps(hidden)
            : words.fullPlan}
        <ChevronDown
          aria-hidden
          className={cn("transition-transform", expanded && "rotate-180")}
        />
      </Button>
    ) : null;

  const notes = (
    <div data-slot="plan-card-notes" className="flex min-w-0 flex-col gap-1">
      <NoteLine
        lead={words.assumes}
        items={plan.assumptions}
        slot="plan-card-assumptions"
      />
      <NoteLine
        lead={words.wontDo}
        items={plan.outOfScope}
        slot="plan-card-out-of-scope"
      />
      <NoteLine
        lead={words.questions}
        items={plan.questions}
        slot="plan-card-questions"
      />
      {plan.willAsk ? (
        <p data-slot="plan-card-will-ask" className="min-w-0 wrap-anywhere">
          <span className="text-muted-foreground">{words.willAsk}</span>{" "}
          {plan.willAsk}
        </p>
      ) : null}
      <p
        data-slot="plan-card-risk"
        data-risk={plan.risk}
        className="flex min-w-0 flex-wrap items-center gap-x-1.5"
      >
        <span className="text-muted-foreground">{words.risk}</span>
        {plan.risk === "low" ? null : (
          <TriangleAlert
            aria-hidden
            data-icon-tone=""
            className="size-3.5 shrink-0 text-warning-text"
          />
        )}
        <span className={RISK_TEXT[plan.risk]}>{words.risks[plan.risk]}</span>
        {plan.riskReason ? (
          <span className="min-w-0 text-muted-foreground wrap-anywhere">
            — {plan.riskReason}
          </span>
        ) : null}
      </p>
    </div>
  );

  const full = "w-full @md/plan-card:w-auto";
  const actions = answering ? (
    changing && onRequestChanges ? (
      <div
        data-slot="plan-card-changes"
        className="flex min-w-0 flex-col gap-2"
      >
        <label htmlFor={noteId} className="font-medium">
          {words.whatShouldChange}
        </label>
        <Textarea
          id={noteId}
          placeholder={words.notePlaceholder}
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
          disabled={busy}
          autoFocus={focusStep === null}
        />
        <div className="flex flex-col-reverse gap-2 @md/plan-card:flex-row @md/plan-card:items-center">
          <span className="text-xs text-muted-foreground @md/plan-card:me-auto">
            {words.tip}
          </span>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => {
              setChanging(false);
              setNote("");
              setStepNotes({});
              setRefocus(true);
            }}
            className={full}
          >
            {words.cancel}
          </Button>
          <Button
            variant="default"
            aria-describedby={titleId}
            data-answer="send-changes"
            loading={loading("changes")}
            disabled={!hasChanges || (busy && pressed !== "changes")}
            onClick={sendChanges}
            className={full}
          >
            {words.sendChanges}
          </Button>
        </div>
      </div>
    ) : (
      <div
        data-slot="plan-card-actions"
        className="flex min-w-0 flex-col gap-2 @md/plan-card:flex-row @md/plan-card:flex-wrap @md/plan-card:items-center"
      >
        {onAccept ? (
          <Button
            variant="default"
            aria-describedby={titleId}
            data-answer="accept"
            loading={loading("accept")}
            disabled={busy && pressed !== "accept"}
            onClick={() => press("accept", onAccept)}
            className={full}
          >
            {words.accept}
          </Button>
        ) : null}
        {onAcceptAndAllow ? (
          <Button
            variant="outline"
            aria-describedby={titleId}
            data-answer="accept-allow"
            loading={loading("allow")}
            disabled={busy && pressed !== "allow"}
            onClick={() => press("allow", onAcceptAndAllow)}
            className={cn(full, "h-auto min-h-8 py-1.5 whitespace-normal")}
          >
            {words.acceptAndAllow}
          </Button>
        ) : null}
        {onRequestChanges ? (
          <Button
            ref={changesRef}
            variant="outline"
            aria-describedby={titleId}
            data-answer="request-changes"
            disabled={busy}
            onClick={() => setChanging(true)}
            className={full}
          >
            {words.requestChanges}
          </Button>
        ) : null}
        {onReject ? (
          <Button
            variant="ghost"
            aria-describedby={titleId}
            data-answer="reject"
            loading={loading("reject")}
            disabled={busy && pressed !== "reject"}
            onClick={() => press("reject", onReject)}
            className={full}
          >
            {words.reject}
          </Button>
        ) : null}
      </div>
    )
  ) : (
    <p
      data-slot="plan-card-status"
      className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1"
    >
      {line.icon}
      <span className="min-w-0 wrap-anywhere">{statusText ?? line.text}</span>
    </p>
  );

  // Answered or waiting on someone else, the plan itself is one click away.
  const body = pending || showSettled;
  const contentId = React.useId();

  return (
    <section
      data-slot="plan-card"
      data-state={state}
      data-risk={plan.risk}
      aria-labelledby={titleId}
      className={cn(
        "@container/plan-card w-full min-w-0 rounded-xl border border-border bg-card p-4 text-sm text-card-foreground",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-col gap-3">
        <div
          data-slot="plan-card-header"
          className="flex min-w-0 items-start gap-2.5"
        >
          <PersonAvatar
            person={{
              name: plan.agent.name,
              image: plan.agent.avatar,
              mark: plan.agent.mark,
              hue: plan.agent.hue,
              kind: "agent",
            }}
            aria-hidden
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p
              data-slot="plan-card-eyebrow"
              className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground"
            >
              <ClipboardList aria-hidden className="size-3.5 shrink-0" />
              <span>
                {words.plan} · {words.version(plan.version)}
              </span>
              <span aria-hidden>·</span>
              <span className="min-w-0 wrap-anywhere">{plan.agent.name}</span>
            </p>
            <p
              id={titleId}
              data-slot="plan-card-title"
              className="font-medium wrap-anywhere"
            >
              {plan.title}
            </p>
          </div>
        </div>
        {body ? (
          <div id={contentId} className="flex min-w-0 flex-col gap-3">
            <p data-slot="plan-card-goal" className="min-w-0 wrap-anywhere">
              <span className="text-muted-foreground">{words.goal}</span>{" "}
              {plan.goal}
            </p>
            {plan.revisionNote && plan.version > 1 ? (
              <p
                data-slot="plan-card-revision"
                className="flex min-w-0 items-start gap-1.5 rounded-md bg-info/10 px-2.5 py-1.5 text-xs text-info-text dark:bg-info/20"
              >
                <PencilLine aria-hidden className="mt-px size-3.5 shrink-0" />
                <span className="min-w-0">{plan.revisionNote}</span>
              </p>
            ) : null}
            <div className="flex min-w-0 flex-col gap-1">
              {steps}
              {fold}
            </div>
            {notes}
          </div>
        ) : null}
        {actions}
        {!pending ? (
          <Button
            ref={toggleRef}
            variant="link"
            size="xs"
            data-slot="plan-card-toggle"
            aria-expanded={showSettled}
            aria-controls={showSettled ? contentId : undefined}
            onClick={() => setShowSettled((s) => !s)}
            className="-mt-1 self-start px-0"
          >
            {showSettled ? words.hidePlan : words.showPlan}
          </Button>
        ) : null}
        {error ? (
          <p role="alert" className="text-xs text-destructive-text">
            {error}
          </p>
        ) : null}
      </div>
      <Announcer />
    </section>
  );
}
