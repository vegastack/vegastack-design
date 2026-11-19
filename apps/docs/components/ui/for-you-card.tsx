// @vegastack for-you-card@0.120.0 sha256-aDh8Z8iDa0VtfKurlDiwUtsSx/tSFoV0sFVnqrt+1KU=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import {
  CircleAlert,
  Clock,
  Ellipsis,
  Lightbulb,
  MessageCircleQuestion,
  SearchCheck,
  ShieldCheck,
  TriangleAlert,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import {
  AgentQuestionForm,
  type AgentQuestionFormAnswer,
  type AgentQuestionFormQuestion,
} from "@/components/ui/agent-question-form";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { TextSpinner } from "@/components/ui/text-spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------------------------------------
 * ForYouCard — one thing waiting on a person in For you: what kind of ask it is (Answer, Approve,
 * Review, Fix, Suggest), who asks, what it is, the facts that decide it, what happens if nobody
 * answers, and the source's own options in the server's order. The preferred option is drawn
 * secondary and nothing on the card is ever a filled primary. Laid out for the 26rem Inbox panel
 * first (one column, facts and buttons wrap) and the phone's /inbox. Settled, it reads as its
 * outcome; withdrawn because access was lost, it shows nothing of the source at all.
 * ----------------------------------------------------------------------------------------------*/

/** What kind of ask the card is. */
export type ForYouVerb = "answer" | "approve" | "review" | "fix" | "suggest";

/** Where a card stands. */
export type ForYouState =
  | "open"
  | "sending"
  | "done"
  | "declined"
  | "skipped"
  | "stale"
  | "expired"
  | "withdrawn"
  | "submit_failed";

/** One fact that decides the card: an amount, a deadline, a consequence. */
export type ForYouFact = {
  label: string;
  value: string;
  tone?: "default" | "warning" | "danger";
};

/** One of the source's options, with K-FY `CardOption.kind` verbatim. */
export type ForYouOption = {
  id: string;
  label: string;
  kind: "primary" | "decline" | "skip" | "neutral" | "navigate" | "inspect";
  href?: string;
};

/** A `fields` card's source body (R-BODY). */
export type ForYouSourceBody =
  | { kind: "question_form"; questions: AgentQuestionFormQuestion[] }
  | { kind: "workflow_fields"; v: 1; fields: unknown[] }
  | { kind: "checkin"; v: 1; checkinId: string }
  | {
      kind: "memory_review";
      v: 1;
      rows: unknown[];
      unavailableCount: number;
    };

/** Props accepted by `ForYouCard`. */
export interface ForYouCardProps {
  /** What kind of ask: shown as a small label with its icon. */
  verb: ForYouVerb;
  /** Who asks: "Donna", on behalf of "Anu's Assistant". */
  from: { name: string; avatar: React.ReactNode; onBehalfOf?: string };
  /** What it is. Not drawn when withdrawn because access was lost. */
  title: string;
  /** One or two lines under the title. @default undefined */
  summary?: string;
  /** The facts that decide it; a tone adds a warning or danger glyph. @default undefined */
  facts?: ForYouFact[];
  /** The source's evidence: a diff, a quote, a link. @default undefined */
  evidence?: React.ReactNode;
  /** When it's due; `urgent` marks it. @default undefined */
  deadline?: { label: string; urgent?: boolean };
  /** What happens if nobody answers. Every card says it. */
  ifNobodyAnswers: string;
  /**
   * Where it stands. `sending`: an option or the body's submit is in flight. `stale`: "This changed.
   * Review the new version." `submit_failed`: the answer didn't save; the options are live again.
   */
  state: ForYouState;
  /**
   * `sending`: the option in flight, or `"body"` for a submitted `sourceBody`. That button keeps its
   * label with the bolt; every other option, the body's submit and Snooze/Skip hold.
   * @default undefined
   */
  sendingOptionId?: string | "body";
  /**
   * `withdrawn`: `not_needed` keeps the title with "No longer needed"; `access_lost` draws only "No
   * longer available to you", with nothing of the source and no action.
   * @default "not_needed"
   */
  withdrawnReason?: "not_needed" | "access_lost";
  /** The verb's body: an inline `AskCard`, a draft, a `SuggestionCard`. @default undefined */
  children?: React.ReactNode;
  /** A `fields` card's source body; `question_form` renders `AgentQuestionForm`. @default undefined */
  sourceBody?: ForYouSourceBody;
  /** The app's renderer for bodies other than `question_form`. @default undefined */
  renderBody?: (body: ForYouSourceBody) => React.ReactNode;
  /** Submits the body; an error string keeps it editable, `null` once sent. @default undefined */
  onSubmitBody?: (
    answers: AgentQuestionFormAnswer[] | Record<string, unknown>,
  ) => Promise<string | null>;
  /**
   * The source's options in server order. `primary` is drawn secondary (never filled); `decline`,
   * `skip`, `neutral` outline; `navigate` a link to `href`; `inspect` calls `onInspect` and never
   * settles the card.
   * @default undefined
   */
  options?: ForYouOption[];
  /** An option was pressed. @default undefined */
  onOption?: (optionId: string) => void | Promise<void>;
  /** An `inspect` option was pressed. @default undefined */
  onInspect?: (optionId: string) => void;
  /** What became of it: "Approved by Priya in Slack · 14:02". @default undefined */
  outcome?: {
    label: string;
    actorName: string | null;
    via: string | null;
    at: string;
    note?: string;
  };
  /** Extra buttons the caller adds (rare; options cover decisions). @default undefined */
  actions?: React.ReactNode;
  /** Snooze it. @default undefined */
  onSnooze?: () => void;
  /** Skip it: not a decline, it just leaves For you. @default undefined */
  onSkip?: () => void;
  /** "Fewer like this", for `suggest` only. @default undefined */
  onFewerLikeThis?: () => void;
  /** No connection: options hold and "Connect to answer" shows. @default false */
  offline?: boolean;
  /** The Inbox's active row. @default false */
  selected?: boolean;
  /** Classes for the root. @default undefined */
  className?: string;
}

const VERB: Record<ForYouVerb, { label: string; icon: LucideIcon }> = {
  answer: { label: "Answer", icon: MessageCircleQuestion },
  approve: { label: "Approve", icon: ShieldCheck },
  review: { label: "Review", icon: SearchCheck },
  fix: { label: "Fix", icon: Wrench },
  suggest: { label: "Suggest", icon: Lightbulb },
};

const VIA_WORDS: Record<string, string> = {
  web: "on the web",
  phone: "on the phone",
  slack: "in Slack",
  email: "by email",
};

/** "Approved by Priya in Slack · 14:02 · Fine for this quarter". */
function outcomeWords(outcome: NonNullable<ForYouCardProps["outcome"]>) {
  const via = outcome.via
    ? ` ${VIA_WORDS[outcome.via.toLowerCase()] ?? `in ${outcome.via}`}`
    : "";
  const by = outcome.actorName ? ` by ${outcome.actorName}` : "";
  return [`${outcome.label}${by}${via}`, outcome.at, outcome.note]
    .filter(Boolean)
    .join(" · ");
}

/** The look of an option: the preferred one secondary, the rest outline. Never filled. */
function optionVariant(kind: ForYouOption["kind"]): "secondary" | "outline" {
  return kind === "primary" ? "secondary" : "outline";
}

/** The ⋯: Snooze and Fewer like this; one item is its own quiet icon button. */
function CardMore({
  onSnooze,
  onFewerLikeThis,
  disabled,
  title,
}: {
  onSnooze?: () => void;
  onFewerLikeThis?: () => void;
  disabled: boolean;
  title: string;
}) {
  if (onSnooze && !onFewerLikeThis)
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon-xs"
              variant="ghost"
              disabled={disabled}
              aria-label={`Snooze: ${title}`}
              onClick={onSnooze}
            />
          }
        >
          <Clock aria-hidden />
        </TooltipTrigger>
        <TooltipContent>Snooze</TooltipContent>
      </Tooltip>
    );
  if (!onSnooze && !onFewerLikeThis) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            size="icon-xs"
            variant="ghost"
            disabled={disabled}
            aria-label={`More for ${title}`}
          />
        }
      >
        <Ellipsis aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onSnooze ? (
          <DropdownMenuItem onClick={onSnooze}>Snooze</DropdownMenuItem>
        ) : null}
        {onFewerLikeThis ? (
          <DropdownMenuItem onClick={onFewerLikeThis}>
            Fewer like this
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** One fact; a warning or danger tone adds its glyph, never a fill. */
function Fact({ fact }: { fact: ForYouFact }) {
  const Glyph =
    fact.tone === "danger"
      ? CircleAlert
      : fact.tone === "warning"
        ? TriangleAlert
        : null;
  return (
    <div className="flex min-w-0 flex-col">
      <dt className="text-xs text-muted-foreground">{fact.label}</dt>
      <dd className="flex min-w-0 items-center gap-1 text-sm text-foreground">
        {Glyph ? (
          <Glyph
            role="img"
            aria-label={fact.tone === "danger" ? "Critical" : "Warning"}
            className={cn(
              "size-3.5 shrink-0",
              fact.tone === "danger"
                ? "text-destructive-text"
                : "text-warning-text",
            )}
          />
        ) : null}
        <span className="min-w-0 wrap-anywhere">{fact.value}</span>
      </dd>
    </div>
  );
}

/**
 * `ForYouCard` — one thing waiting on a person in For you: verb, who asks, what, the deciding
 * facts, what happens if nobody answers, and the source's options (the preferred one secondary,
 * none filled).
 *
 * @example
 * <ForYouCard
 *   verb="approve"
 *   from={{ name: "Expense checker", avatar: <PersonAvatar person={agent} size="xs" /> }}
 *   title="Ravi's taxi claim, ₹4,200"
 *   facts={[{ label: "Over policy by", value: "₹1,200", tone: "warning" }]}
 *   deadline={{ label: "Due today", urgent: true }}
 *   ifNobodyAnswers="It goes to Finance on Friday."
 *   state="open"
 *   options={[
 *     { id: "approve", label: "Approve", kind: "primary" },
 *     { id: "decline", label: "Decline", kind: "decline" },
 *   ]}
 *   onOption={(id) => answer(card.id, id)}
 *   onSnooze={snooze}
 *   onSkip={skip}
 * />
 */
export function ForYouCard({
  verb,
  from,
  title,
  summary,
  facts,
  evidence,
  deadline,
  ifNobodyAnswers,
  state,
  sendingOptionId,
  withdrawnReason = "not_needed",
  children,
  sourceBody,
  renderBody,
  onSubmitBody,
  options,
  onOption,
  onInspect,
  outcome,
  actions,
  onSnooze,
  onSkip,
  onFewerLikeThis,
  offline = false,
  selected = false,
  className,
}: ForYouCardProps) {
  const titleId = React.useId();
  const sending = state === "sending";
  const live = state === "open" || state === "submit_failed" || sending;
  const hold = sending || offline;
  const root = cn(
    "flex min-w-0 flex-col gap-3 rounded-card border border-border bg-card p-3 text-sm text-card-foreground",
    selected && "layer-selected",
    className,
  );

  if (state === "withdrawn" && withdrawnReason === "access_lost")
    return (
      <article
        data-slot="for-you-card"
        data-state={state}
        data-verb={verb}
        data-withdrawn="access_lost"
        data-selected={selected ? "" : undefined}
        aria-label="No longer available to you"
        className={root}
      >
        <p className="text-sm text-muted-foreground">
          No longer available to you
        </p>
      </article>
    );

  const Verb = VERB[verb];
  const closedLine = (() => {
    const more = outcome ? ` · ${outcomeWords(outcome)}` : "";
    if (state === "stale")
      return `This changed. Review the new version.${more}`;
    if (state === "expired") return `Not answered in time${more}`;
    if (state === "withdrawn") return `No longer needed${more}`;
    if (state === "done" || state === "declined" || state === "skipped")
      return outcome
        ? outcomeWords(outcome)
        : state === "done"
          ? "Done"
          : state === "declined"
            ? "Declined"
            : "Skipped";
    return null;
  })();

  // A stale card keeps only its way to the new version: links and Inspect.
  const shownOptions = live
    ? options
    : state === "stale"
      ? options?.filter(
          (option) => option.kind === "navigate" || option.kind === "inspect",
        )
      : undefined;
  const optionButtons =
    shownOptions?.length || (live && (actions != null || onSkip)) ? (
      <div
        role="group"
        aria-label={`Options: ${title}`}
        data-slot="for-you-card-options"
        className="flex min-w-0 flex-wrap items-center gap-2"
      >
        {(shownOptions ?? []).map((option) => {
          const inFlight = sending && sendingOptionId === option.id;
          if (option.kind === "navigate" && option.href)
            return (
              <a
                key={option.id}
                href={option.href}
                data-option={option.kind}
                data-variant="outline"
                aria-disabled={hold || undefined}
                onClick={(event) => {
                  if (hold) event.preventDefault();
                }}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-auto min-h-7 max-w-full py-1 text-start whitespace-normal no-underline aria-disabled:opacity-50",
                )}
              >
                {option.label}
              </a>
            );
          return (
            <Button
              key={option.id}
              size="sm"
              variant={optionVariant(option.kind)}
              className={cn(
                // A long server label wraps inside the panel instead of running past it.
                "h-auto min-h-7 max-w-full py-1 text-start whitespace-normal",
                // Skip leaves For you without deciding: quieter than Decline.
                option.kind === "skip" && "text-muted-foreground",
              )}
              data-option={option.kind}
              data-option-id={option.id}
              disabled={hold && !inFlight}
              aria-busy={inFlight || undefined}
              onClick={() => {
                if (hold) return;
                if (option.kind === "inspect") onInspect?.(option.id);
                else void onOption?.(option.id);
              }}
            >
              {inFlight ? <TextSpinner variant="waiting" label="" /> : null}
              {option.label}
            </Button>
          );
        })}
        {live ? actions : null}
        {onSkip && live ? (
          <Button
            size="sm"
            variant="ghost"
            data-slot="for-you-card-skip"
            disabled={hold}
            className="text-muted-foreground"
            onClick={onSkip}
          >
            Skip
          </Button>
        ) : null}
      </div>
    ) : null;

  const body =
    sourceBody && live ? (
      <div data-slot="for-you-card-body" className="min-w-0">
        {sourceBody.kind === "question_form" ? (
          <AgentQuestionForm
            questions={sourceBody.questions}
            actionVariant="secondary"
            disabled={hold}
            onSubmit={(answers) =>
              onSubmitBody
                ? onSubmitBody(answers)
                : Promise.resolve("This can't be answered here.")
            }
          />
        ) : (
          // The app's own body holds with the card: a fieldset disables every control inside it.
          <fieldset disabled={hold} className="m-0 min-w-0 border-0 p-0">
            {renderBody?.(sourceBody)}
          </fieldset>
        )}
        {sourceBody.kind === "memory_review" &&
        sourceBody.unavailableCount > 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {sourceBody.unavailableCount === 1
              ? "1 note is no longer yours to review."
              : `${sourceBody.unavailableCount} notes are no longer yours to review.`}
          </p>
        ) : null}
        {sending && sendingOptionId === "body" ? (
          <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <TextSpinner variant="waiting" label="" /> Sending
          </p>
        ) : null}
      </div>
    ) : null;

  return (
    <article
      data-slot="for-you-card"
      data-state={state}
      data-verb={verb}
      data-selected={selected ? "" : undefined}
      aria-labelledby={titleId}
      aria-busy={sending || undefined}
      className={root}
    >
      <header
        data-slot="for-you-card-header"
        className="flex min-w-0 items-center gap-2"
      >
        <span
          data-slot="for-you-card-verb"
          className="flex shrink-0 items-center gap-1 text-xs font-medium text-foreground"
        >
          <Verb.icon aria-hidden className="size-3.5 text-muted-foreground" />
          {Verb.label}
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted-foreground">
          <span aria-hidden className="text-muted-foreground/60">
            ·
          </span>
          <span className="inline-flex shrink-0">{from.avatar}</span>
          <span className="min-w-0 truncate">
            {from.name}
            {from.onBehalfOf ? ` · ${from.onBehalfOf}` : null}
          </span>
        </span>
        {deadline && live ? (
          <span
            data-slot="for-you-card-deadline"
            data-urgent={deadline.urgent ? "" : undefined}
            className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground tabular-nums"
          >
            {deadline.urgent ? (
              <TriangleAlert
                role="img"
                aria-label="Urgent"
                className="size-3.5 text-warning-text"
              />
            ) : null}
            {deadline.label}
          </span>
        ) : null}
        {live ? (
          <CardMore
            onSnooze={onSnooze}
            onFewerLikeThis={verb === "suggest" ? onFewerLikeThis : undefined}
            disabled={hold}
            title={title}
          />
        ) : null}
      </header>

      <div className="flex min-w-0 flex-col gap-1">
        <h3
          id={titleId}
          data-slot="for-you-card-title"
          className={cn(
            "min-w-0 text-sm font-medium wrap-anywhere",
            live ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {title}
        </h3>
        {summary && live ? (
          <p className="line-clamp-2 min-w-0 text-sm text-muted-foreground">
            {summary}
          </p>
        ) : null}
      </div>

      {live && facts?.length ? (
        <dl
          data-slot="for-you-card-facts"
          className="grid min-w-0 grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-x-4 gap-y-2"
        >
          {facts.map((fact, index) => (
            <Fact key={`${fact.label}-${index}`} fact={fact} />
          ))}
        </dl>
      ) : null}

      {live && evidence != null ? (
        <div data-slot="for-you-card-evidence" className="min-w-0">
          {evidence}
        </div>
      ) : null}

      {live && children != null ? (
        <div data-slot="for-you-card-children" className="min-w-0">
          {children}
        </div>
      ) : null}

      {body}

      {state === "submit_failed" ? (
        <p
          role="alert"
          data-slot="for-you-card-failed"
          className="text-xs text-destructive-text"
        >
          Your answer didn't save. Try again.
        </p>
      ) : null}

      {optionButtons}

      {closedLine ? (
        <p
          data-slot="for-you-card-outcome"
          className="flex min-w-0 items-start gap-2 text-sm text-muted-foreground"
        >
          {state === "done" ? (
            <StatusGlyph status="done" label={null} className="mt-0.5" />
          ) : state === "declined" ? (
            <StatusGlyph status="skipped" label={null} className="mt-0.5" />
          ) : null}
          <span className="min-w-0 wrap-anywhere">{closedLine}</span>
        </p>
      ) : null}

      {live ? (
        <p
          data-slot="for-you-card-if-nobody"
          className="min-w-0 text-xs text-muted-foreground"
        >
          {offline
            ? `Connect to answer · If nobody answers: ${ifNobodyAnswers}`
            : `If nobody answers: ${ifNobodyAnswers}`}
        </p>
      ) : null}
    </article>
  );
}

/**
 * `ForYouCardSkeleton` — a For you card's shape while the list loads.
 *
 * @example
 * <ForYouCardSkeleton />
 */
export function ForYouCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      data-slot="for-you-card-skeleton"
      aria-hidden
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-card border border-border bg-card p-3",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="h-3.5 w-24" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3.5 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-16" />
      </div>
    </div>
  );
}
