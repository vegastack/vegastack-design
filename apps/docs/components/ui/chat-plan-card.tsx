// @vegastack chat-plan-card@0.84.1 sha256-orw1OT4u0My5lJbaHC3fl7ohueiU1lmOOMBJBJBMhGk=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChatCard } from "@/components/ui/chat-card";
import { ChatMenu, ChatMenuItem } from "@/components/ui/chat-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { Textarea } from "@/components/ui/textarea";

/* ------------------------------------------------------------------------------------------------
 * ChatPlanCard — a plan the agent wants approved, as a document inside the turn: what it will do,
 * what will change, what won't, and what will still ask (from the permission engine at plan time).
 * After "Keep planning" the next version says what changed. Approved, rejected or replaced, it
 * settles into one line (`PlanLine`) and its steps become the task list.
 * ----------------------------------------------------------------------------------------------*/

/** A plan as the chat contract carries it (the `data-plan` part). */
export type PlanData = {
  /** The plan's id. */
  id: string;
  /** Its version, from 1; "Plan · v2" from the second. */
  version: number;
  /** Where it stands. */
  state: "waiting" | "approved" | "rejected" | "superseded";
  /** One line: what the plan does. */
  title: string;
  /** A short goal under the title. */
  goal: string;
  /** Numbered steps; the first 8 show and the rest open. */
  steps: { n: number; text: string; detail?: string; subagents?: number }[];
  /** What the run will change ("a new Google Doc", "1 email"). */
  willChange: string[];
  /** What it won't touch ("create tasks", "post in Slack"). */
  wont: string[];
  /** Steps that will still ask, from the permission engine at plan time. */
  needsOk: { step: number; words: string }[];
  /** What changed since the previous version. */
  changedFrom?: {
    version: number;
    added: number[];
    removed: string[];
    edited: number[];
  };
  /** Who answered and how. */
  answer?: { by: string; at: string; mode: "run" | "ask_before_changes" };
};

const SHOWN_STEPS = 8;
const SETTLE = "animate-in fade-in-0 duration-state ease-enter";

/** "a, b and c" — the way a list reads in a sentence. */
function inWords(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

function PlanStepRow({
  step,
  change,
  asks,
}: {
  step: PlanData["steps"][number];
  change?: "new" | "edited";
  asks: boolean;
}) {
  const meta = [
    step.subagents
      ? `${step.subagents} Subagent${step.subagents === 1 ? "" : "s"}`
      : null,
    asks ? "asks first" : null,
    change ?? null,
  ].filter(Boolean);
  const line = (
    <>
      <span
        aria-hidden="true"
        className="w-4 shrink-0 text-end text-muted-foreground tabular-nums"
      >
        {step.n}
      </span>
      <span className="min-w-0 flex-1 text-start text-foreground">
        <span className="sr-only">Step {step.n}: </span>
        {step.text}
      </span>
      {meta.length > 0 ? (
        <span
          data-slot="plan-step-meta"
          className="shrink-0 text-xs text-muted-foreground"
        >
          {meta.join(" · ")}
        </span>
      ) : null}
    </>
  );
  if (!step.detail)
    return (
      <li
        data-slot="plan-step"
        data-change={change}
        className="flex min-h-7 min-w-0 items-baseline gap-3 px-2 py-1"
      >
        {line}
      </li>
    );
  return (
    <li data-slot="plan-step" data-change={change} className="min-w-0">
      <Collapsible>
        <CollapsibleTrigger className="group/plan-step state-layer flex min-h-7 w-full min-w-0 items-baseline gap-3 rounded-md px-2 py-1 text-sm">
          {line}
          <ChevronRight
            aria-hidden="true"
            strokeWidth={1.5}
            className="size-3.5 shrink-0 self-center text-muted-foreground transition-transform duration-state ease-enter group-data-panel-open/plan-step:rotate-90 rtl:rotate-180 rtl:group-data-panel-open/plan-step:rotate-90"
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="ps-9 pe-2 pb-1 text-xs text-muted-foreground">
          {step.detail}
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

/** The plan's body: goal, steps, and the three quiet rows. Shared by the card and a shown line. */
function PlanBody({
  data,
  showChanges,
}: {
  data: PlanData;
  showChanges: boolean;
}) {
  const [all, setAll] = React.useState(false);
  const steps = all ? data.steps : data.steps.slice(0, SHOWN_STEPS);
  const hidden = data.steps.length - steps.length;
  const changeOf = (n: number): "new" | "edited" | undefined => {
    if (!showChanges || !data.changedFrom) return undefined;
    if (data.changedFrom.added.includes(n)) return "new";
    if (data.changedFrom.edited.includes(n)) return "edited";
    return undefined;
  };
  const asks = new Set(data.needsOk.map((item) => item.step));
  const facts: [string, string][] = [];
  if (data.willChange.length)
    facts.push(["Will change", inWords(data.willChange)]);
  if (data.wont.length) facts.push(["Won't", inWords(data.wont)]);
  if (data.needsOk.length)
    facts.push([
      "Needs your OK",
      data.needsOk
        .map((item) => `step ${item.step} (${item.words})`)
        .join(", "),
    ]);
  return (
    <div data-slot="plan-body" className="flex min-w-0 flex-col gap-3">
      <p data-slot="plan-goal" className="text-muted-foreground">
        {data.goal}
      </p>
      <ol data-slot="plan-steps" className="-mx-2 flex min-w-0 flex-col">
        {steps.map((step) => (
          <PlanStepRow
            key={step.n}
            step={step}
            change={changeOf(step.n)}
            asks={asks.has(step.n)}
          />
        ))}
      </ol>
      {hidden > 0 || all ? (
        <Button
          size="xs"
          variant="ghost"
          className="-ms-2 w-fit text-muted-foreground"
          onClick={() => setAll((open) => !open)}
        >
          {all ? "Show fewer steps" : `Show ${hidden} more`}
        </Button>
      ) : null}
      {showChanges && data.changedFrom?.removed.length ? (
        <p data-slot="plan-removed" className="text-xs text-muted-foreground">
          Removed since v{data.changedFrom.version}:{" "}
          {inWords(data.changedFrom.removed)}
        </p>
      ) : null}
      {facts.length > 0 ? (
        <dl
          data-slot="plan-facts"
          className="grid min-w-0 grid-cols-[auto_1fr] gap-x-4 gap-y-1"
        >
          {facts.map(([label, words]) => (
            <React.Fragment key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="min-w-0 text-foreground">{words}</dd>
            </React.Fragment>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

/** Props accepted by `PlanLine`. */
export interface PlanLineProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  /** The settled plan. */
  data: PlanData;
  /** Shows the plan again; without it there is no "Show ›". @default undefined */
  onShow?: () => void;
  /** Whether the plan is shown, for the toggle's words and `aria-expanded`. @default false */
  shown?: boolean;
}

/** The words a settled plan reads as. */
function planWords(data: PlanData): string {
  const count = `${data.steps.length} step${data.steps.length === 1 ? "" : "s"}`;
  if (data.state === "rejected") return "You didn't approve this plan";
  if (data.state === "superseded")
    return `Replaced by a newer plan · v${data.version}`;
  if (data.state === "waiting") return `Plan waiting for approval · ${count}`;
  const by = data.answer?.by ?? "you";
  // With nothing that needed an OK there was one Approve, and nothing to ask about.
  const mode =
    data.answer?.mode === "ask_before_changes" && data.needsOk.length
      ? " · asks before changes"
      : "";
  return `Plan approved by ${by} · ${count}${mode}`;
}

/**
 * A settled plan as one muted line: "✓ Plan approved by you · 4 steps  Show ›", "You didn't approve
 * this plan", "Replaced by a newer plan". The ✓ is primary (COL-25).
 *
 * @example
 * <PlanLine data={plan} onShow={() => setShown(true)} />
 */
function PlanLine({
  data,
  onShow,
  shown = false,
  className,
  ...props
}: PlanLineProps) {
  return (
    <div
      data-slot="plan-line"
      data-state={data.state}
      className={cn(
        "-mx-2 flex min-h-7 min-w-0 items-center gap-2 px-2 text-sm text-muted-foreground",
        className,
      )}
      {...props}
    >
      {data.state === "approved" ? (
        <StatusGlyph status="done" label={null} />
      ) : null}
      <span className="min-w-0 flex-1 truncate">{planWords(data)}</span>
      {onShow ? (
        <Button
          size="xs"
          variant="ghost"
          aria-expanded={shown}
          className="shrink-0 text-muted-foreground"
          onClick={onShow}
        >
          {shown ? "Hide" : "Show"}
          <ChevronRight
            aria-hidden="true"
            data-icon="inline-end"
            strokeWidth={1.5}
            className={cn(
              "transition-transform duration-state ease-enter rtl:rotate-180",
              shown && "rotate-90 rtl:rotate-90",
            )}
          />
        </Button>
      ) : null}
    </div>
  );
}

/** Props accepted by `ChatPlanCard`. */
export interface ChatPlanCardProps extends Omit<
  React.ComponentProps<"div">,
  "children" | "title"
> {
  /** The plan, as the chat contract carries it. */
  data: PlanData;
  /**
   * Approves: run it, or run it asking before anything that changes something. Leave all three
   * handlers out for a reader who can't decide: the plan shows read-only, "Waiting for approval".
   * @default undefined
   */
  onApprove?: (mode: "run" | "ask_before_changes") => void | Promise<void>;
  /** Asks for another version, with an optional note. @default undefined */
  onKeepPlanning?: (note?: string) => void | Promise<void>;
  /** Turns the plan down, with an optional note. @default undefined */
  onReject?: (note?: string) => void | Promise<void>;
}

/**
 * A plan waiting for the person, inside the turn: "Plan · v2", a one-line title, a short goal,
 * numbered steps, then Will change / Won't / Needs your OK as quiet rows — no colour pills, no risk
 * dot. Actions: Approve and run (primary) and Approve, ask before changes (outline), or one Approve
 * when no step needs an OK; then Keep planning ▾ (with a note; Reject inside it). "Changed ›"
 * shows what changed since the previous version. Without handlers it is read-only, for a reader
 * who can't decide.
 * Approved, rejected or replaced, it settles into a `PlanLine` that can show the plan again.
 *
 * @example
 * <ChatPlanCard data={plan} onApprove={approve} onKeepPlanning={revise} onReject={reject} />
 */
function ChatPlanCard(props: ChatPlanCardProps) {
  // A new plan or version starts with its actions free.
  return (
    <PlanCardBody key={`${props.data.id}:${props.data.version}`} {...props} />
  );
}

function PlanCardBody({
  data,
  onApprove,
  onKeepPlanning,
  onReject,
  className,
  ...props
}: ChatPlanCardProps) {
  const [changes, setChanges] = React.useState(false);
  const [decided, setDecided] = React.useState(false);
  const deciding = React.useRef(false);
  const [noting, setNoting] = React.useState<"keep" | "reject" | null>(null);
  const [note, setNote] = React.useState("");
  const [shown, setShown] = React.useState(false);

  if (data.state !== "waiting")
    return (
      <div
        data-slot="chat-plan-card"
        data-state={data.state}
        className={cn("flex min-w-0 flex-col gap-1", SETTLE, className)}
        {...props}
      >
        <PlanLine
          data={data}
          shown={shown}
          onShow={() => setShown((open) => !open)}
        />
        {shown ? (
          <ChatCard
            className={SETTLE}
            title={data.title}
            meta={`Plan · v${data.version}`}
          >
            <PlanBody data={data} showChanges={false} />
          </ChatCard>
        ) : null}
      </div>
    );

  /**
   * One decision per version: the actions hold from the press until the plan's new state (or a new
   * version) replaces the card; a returned promise that rejects lets the person decide again.
   */
  const decide = (run: () => void | Promise<void>) => {
    if (deciding.current) return;
    deciding.current = true;
    setDecided(true);
    void Promise.resolve()
      .then(run)
      .catch(() => {
        deciding.current = false;
        setDecided(false);
      });
  };
  const readOnly = !onApprove && !onKeepPlanning && !onReject;
  const send = () => {
    const text = note.trim() || undefined;
    const kind = noting;
    decide(() =>
      kind === "reject" ? onReject?.(text) : onKeepPlanning?.(text),
    );
    setNoting(null);
    setNote("");
  };
  return (
    <div
      data-slot="chat-plan-card"
      data-state={data.state}
      aria-busy={decided || undefined}
      className={cn("min-w-0", className)}
      {...props}
    >
      <ChatCard
        title={data.title}
        meta={
          readOnly
            ? `Plan · v${data.version} · Waiting for approval`
            : `Plan · v${data.version}`
        }
        aside={
          data.changedFrom ? (
            <Button
              size="xs"
              variant="ghost"
              aria-expanded={changes}
              className="text-muted-foreground"
              onClick={() => setChanges((open) => !open)}
            >
              Changed
              <ChevronRight
                aria-hidden="true"
                data-icon="inline-end"
                strokeWidth={1.5}
                className={cn(
                  "transition-transform duration-state ease-enter rtl:rotate-180",
                  changes && "rotate-90 rtl:rotate-90",
                )}
              />
            </Button>
          ) : undefined
        }
        actions={
          readOnly ? undefined : noting ? (
            <div
              data-slot="plan-note"
              className="flex w-full min-w-0 flex-col gap-2"
            >
              <Textarea
                autoFocus
                aria-label={
                  noting === "reject"
                    ? "Why you're turning it down (optional)"
                    : "What to change (optional)"
                }
                placeholder={
                  noting === "reject"
                    ? "Why you're turning it down (optional)"
                    : "What should change? (optional)"
                }
                value={note}
                onChange={(event) => setNote(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    // An input method's Enter confirms its candidate, not the note.
                    !event.nativeEvent.isComposing &&
                    event.keyCode !== 229
                  ) {
                    event.preventDefault();
                    send();
                  }
                  if (event.key === "Escape") setNoting(null);
                }}
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={decided}
                  onClick={send}
                >
                  {noting === "reject" ? "Reject plan" : "Keep planning"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setNoting(null)}
                >
                  Back
                </Button>
              </div>
            </div>
          ) : (
            <>
              {!onApprove ? null : data.needsOk.length ? (
                <>
                  <Button
                    size="sm"
                    disabled={decided}
                    onClick={() => decide(() => onApprove("run"))}
                  >
                    Approve and run
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={decided}
                    onClick={() =>
                      decide(() => onApprove("ask_before_changes"))
                    }
                  >
                    Approve, ask before changes
                  </Button>
                </>
              ) : (
                // Nothing still asks, so there is nothing to allow: one Approve.
                <Button
                  size="sm"
                  disabled={decided}
                  onClick={() => decide(() => onApprove("ask_before_changes"))}
                >
                  Approve
                </Button>
              )}
              {onKeepPlanning || onReject ? (
                <ChatMenu
                  trigger={
                    <Button size="sm" variant="ghost" disabled={decided}>
                      {onKeepPlanning ? "Keep planning" : "Reject"}
                      <ChevronDown
                        aria-hidden="true"
                        data-icon="inline-end"
                        strokeWidth={1.5}
                      />
                    </Button>
                  }
                >
                  {onKeepPlanning ? (
                    <ChatMenuItem
                      hint="Tell the agent what to change"
                      onSelect={() => setNoting("keep")}
                    >
                      Keep planning…
                    </ChatMenuItem>
                  ) : null}
                  {onReject ? (
                    <ChatMenuItem
                      hint="Nothing runs"
                      onSelect={() => setNoting("reject")}
                    >
                      Reject…
                    </ChatMenuItem>
                  ) : null}
                </ChatMenu>
              ) : null}
            </>
          )
        }
      >
        <PlanBody data={data} showChanges={changes} />
      </ChatCard>
    </div>
  );
}

export { ChatPlanCard, PlanLine };
