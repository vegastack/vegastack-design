// @vegastack for-you-card@0.129.0 sha256-GtCM0PaEKI3kCg1cURb1wfbsN+bhjd1jqekbXC3PICo=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import {
  ChevronUp,
  CircleAlert,
  Clock,
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
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  InboxRowMenu,
  InboxRowTitle,
  useInboxRow,
  type InboxRow,
} from "@/components/ui/inbox";
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
 * outcome; withdrawn because access was lost, it shows nothing of the source at all. Inside an
 * `Inbox` it is that list's row (`useInboxRow`, the same behaviour as `InboxItem`): J / K reach it by
 * its `value`, the Inbox's active row selects it, and its ⋯ menu carries the row's `menu` (Archive,
 * Mark read) beside Snooze, opened by a long press on touch.
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

/** Where an answer came from, K-FY `ForYouVia` verbatim; `system` closes a card nobody answered. */
export type ForYouVia =
  "app" | "phone" | "desktop" | "slack" | "email" | "system";

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
    via: ForYouVia | null;
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
  /**
   * The card's identity in an `Inbox` (the card's id): J / K walk to it, the Inbox's `activeId`
   * selects it and `onOpen` receives it. Without it the card is skipped by J / K.
   * @default undefined
   */
  value?: string;
  /**
   * Unread: a 6px dot before the deadline and an sr-only "Unread", as an `InboxItem` shows it.
   * @default false
   */
  unread?: boolean;
  /**
   * `DropdownMenuItem`s for the card's ⋯ menu, after Snooze and Fewer like this: the Inbox row's
   * Archive, Mark read / Mark unread, Unsnooze, Move to Inbox. It stays on a settled card. On a
   * touch screen a long press on the card opens it.
   * @default undefined
   */
  menu?: React.ReactNode;
  /**
   * Selected outside an `Inbox`; inside one, the Inbox's active row is selected.
   * @default false
   */
  selected?: boolean;
  /**
   * The calm list row (For you's list, Home's top three): the verb's tile, "Answer · Assistant" and
   * the time, the title, one `why` line and one main button; the rest (facts, the body, every
   * option) opens in place under it. Settled, it is one line with `onUndo`'s Undo.
   * @default false
   */
  compact?: boolean;
  /**
   * `compact`: one line saying why it is here — who or what asked, and why it waits on the reader.
   * Falls back to `summary`. @default undefined
   */
  why?: string;
  /** When it arrived ("2h", "Yesterday"), at the header's end. @default undefined */
  time?: string;
  /**
   * `compact`: the one main button. With `onPress` or `href` it acts (a draft opens its page, a
   * broken connection reconnects); without either it opens the card in place. Its label is the verb's
   * by default ("Answer", "Approve", "Review", "Fix").
   * @default { label: the verb's }
   */
  primary?: { label?: string; onPress?: () => void; href?: string };
  /** `compact`: opened in place (controlled). @default undefined */
  expanded?: boolean;
  /** `compact`: opened in place at first (uncontrolled). @default false */
  defaultExpanded?: boolean;
  /** `compact`: the card opened or closed in place. @default undefined */
  onExpandedChange?: (expanded: boolean) => void;
  /**
   * `compact`, settled: Undo on its one line (the app holds the answer back for a moment before it
   * sends). @default undefined
   */
  onUndo?: () => void;
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

/** Where it was answered, in the app's words; `system` (nobody answered) says nothing. */
const VIA_WORDS: Record<ForYouVia, string | null> = {
  app: "on the web",
  phone: "in the mobile app",
  desktop: "in the desktop app",
  slack: "in Slack",
  email: "by email",
  system: null,
};

/** "Approved by Priya in Slack · 14:02 · Fine for this quarter". */
function outcomeWords(outcome: NonNullable<ForYouCardProps["outcome"]>) {
  const words = outcome.via ? VIA_WORDS[outcome.via] : null;
  const via = words ? ` ${words}` : "";
  const by = outcome.actorName ? ` by ${outcome.actorName}` : "";
  return [`${outcome.label}${by}${via}`, outcome.at, outcome.note]
    .filter(Boolean)
    .join(" · ");
}

/** The look of an option: the preferred one secondary, the rest outline. Never filled. */
function optionVariant(kind: ForYouOption["kind"]): "secondary" | "outline" {
  return kind === "primary" ? "secondary" : "outline";
}

/**
 * The ⋯: Snooze and Fewer like this while the card is open, then the row's `menu`. Snooze alone is
 * its own quiet icon button; a menu opens from the button or a long press on the card.
 */
function CardMore({
  row,
  onSnooze,
  onFewerLikeThis,
  menu,
  hold,
  title,
}: {
  row: InboxRow;
  onSnooze?: () => void;
  onFewerLikeThis?: () => void;
  menu?: React.ReactNode;
  hold: boolean;
  title: string;
}) {
  if (onSnooze && !onFewerLikeThis && menu == null)
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon-xs"
              variant="ghost"
              disabled={hold}
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
  const own = Boolean(onSnooze || onFewerLikeThis);
  if (!own && menu == null) return null;
  return (
    <InboxRowMenu
      row={row}
      size="icon-xs"
      // Held while sending only when the card's own items are all it holds.
      disabled={hold && menu == null}
      label={`More for ${title}`}
    >
      {onSnooze ? (
        <DropdownMenuItem disabled={hold} onClick={onSnooze}>
          Snooze
        </DropdownMenuItem>
      ) : null}
      {onFewerLikeThis ? (
        <DropdownMenuItem disabled={hold} onClick={onFewerLikeThis}>
          Fewer like this
        </DropdownMenuItem>
      ) : null}
      {own && menu != null ? <DropdownMenuSeparator /> : null}
      {menu}
    </InboxRowMenu>
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
  value,
  unread = false,
  menu,
  selected: selectedProp = false,
  compact = false,
  why,
  time,
  primary,
  expanded: expandedProp,
  defaultExpanded = false,
  onExpandedChange,
  onUndo,
  className,
}: ForYouCardProps) {
  const [expandedOwn, setExpandedOwn] = React.useState(defaultExpanded);
  const expanded = expandedProp ?? expandedOwn;
  const setExpanded = (next: boolean) => {
    if (expandedProp === undefined) setExpandedOwn(next);
    onExpandedChange?.(next);
  };
  const titleId = React.useId();
  const sending = state === "sending";
  const live = state === "open" || state === "submit_failed" || sending;
  const hold = sending || offline;
  const accessLost = state === "withdrawn" && withdrawnReason === "access_lost";
  const ownMenu =
    live && Boolean(onFewerLikeThis && verb === "suggest" && !accessLost);
  // A long press opens the ⋯ whenever it is a menu (more than Snooze alone).
  const row = useInboxRow({ value, menu: menu != null || ownMenu });
  const selected = row.inInbox ? row.active : selectedProp;
  const root = cn(
    compact
      ? // The calm row: an InboxItem's shape (LAY-20), no box of its own.
        "flex min-w-0 flex-col gap-3 rounded-item px-3 py-3 text-sm text-foreground"
      : "flex min-w-0 flex-col gap-3 rounded-card border border-border bg-card p-3 text-sm text-card-foreground",
    // In an Inbox the row's start bar marks the active card: a fill would sink its options.
    selected && !row.inInbox && "layer-selected",
    !row.inInbox && className,
  );
  const more = (
    <CardMore
      row={row}
      onSnooze={live && !accessLost ? onSnooze : undefined}
      onFewerLikeThis={ownMenu ? onFewerLikeThis : undefined}
      menu={menu}
      hold={hold}
      title={accessLost ? "No longer available to you" : title}
    />
  );
  /**
   * In an Inbox the card is its list's row: the `li` is exactly the card's box (spaced by margin),
   * so the row's focus ring follows the card's corner. Elsewhere it stands alone, with its long press.
   */
  const asRow = (
    article: React.ReactElement<React.HTMLAttributes<HTMLElement>>,
  ) =>
    row.inInbox ? (
      <li
        {...row.rowProps}
        data-unread={unread || undefined}
        className={cn(
          compact
            ? // As an InboxItem: the row's tint on hover and the selected step when active.
              "relative scroll-mt-10 rounded-item transition-colors state-layer data-active:bg-state-selected"
            : "relative my-1 scroll-mt-10 rounded-card",
          // The Inbox's active row: the rows' 2px start bar.
          "data-active:before:absolute data-active:before:inset-y-2 data-active:before:start-0 data-active:before:z-10 data-active:before:w-0.5 data-active:before:rounded-full data-active:before:bg-primary",
          row.opens && "cursor-pointer",
          // A long press opens the ⋯ menu: no text selection or callout under the finger.
          row.longPress &&
            "pointer-coarse:[-webkit-touch-callout:none] pointer-coarse:select-none",
          className,
        )}
      >
        {article}
      </li>
    ) : (
      React.cloneElement(article, row.pressProps)
    );

  if (accessLost)
    return asRow(
      <article
        data-slot="for-you-card"
        data-state={state}
        data-verb={verb}
        data-withdrawn="access_lost"
        data-selected={selected ? "" : undefined}
        aria-label="No longer available to you"
        className={cn(root, "flex-row items-center")}
      >
        <p className="min-w-0 flex-1 text-sm text-muted-foreground">
          {/* Still the row's focus target, so J / K and Enter reach it. */}
          <InboxRowTitle row={row}>No longer available to you</InboxRowTitle>
        </p>
        {more}
      </article>,
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
                  "h-auto min-h-7 max-w-full py-1 text-start whitespace-normal wrap-anywhere no-underline aria-disabled:opacity-50",
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
                "h-auto min-h-7 max-w-full py-1 text-start whitespace-normal wrap-anywhere",
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
          <fieldset
            disabled={hold}
            inert={hold}
            className="m-0 min-w-0 border-0 p-0"
          >
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

  if (compact && !live && state !== "stale") {
    // Settled: one line — what became of it and the title — with Undo while the app allows it.
    const word =
      state === "done"
        ? "Done"
        : state === "declined"
          ? "Declined"
          : state === "skipped"
            ? "Skipped"
            : null;
    const head = outcome ? outcomeWords(outcome) : (closedLine ?? word ?? "");
    return asRow(
      <article
        data-slot="for-you-card"
        data-state={state}
        data-verb={verb}
        data-compact=""
        data-selected={selected ? "" : undefined}
        aria-labelledby={titleId}
        className={cn(
          root,
          "flex-row items-center gap-2 bg-state-tile py-2 text-muted-foreground",
        )}
      >
        {state === "done" ? (
          <StatusGlyph status="done" label={null} />
        ) : state === "declined" ? (
          <StatusGlyph status="skipped" label={null} />
        ) : null}
        <p
          id={titleId}
          data-slot="for-you-card-outcome"
          className="min-w-0 flex-1 truncate"
        >
          <InboxRowTitle row={row} className="whitespace-nowrap">
            {head}
            {head ? ": " : null}
            {title}
          </InboxRowTitle>
        </p>
        {onUndo ? (
          <Button
            size="xs"
            variant="ghost"
            data-slot="for-you-card-undo"
            className="shrink-0"
            aria-label={`Undo: ${title}`}
            onClick={onUndo}
          >
            Undo
          </Button>
        ) : null}
        {more}
      </article>,
    );
  }

  if (compact) {
    // Stale: the line says so and the row keeps only its way to the new version.
    const line = state === "stale" ? closedLine : (why ?? summary);
    const main = primary?.label ?? Verb.label;
    const acts = Boolean(primary?.onPress || primary?.href);
    const mainButton = acts ? (
      primary?.href ? (
        <a
          href={primary.href}
          data-slot="for-you-card-primary"
          aria-disabled={hold || undefined}
          onClick={(event) => {
            if (hold) event.preventDefault();
            else primary.onPress?.();
          }}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "no-underline aria-disabled:opacity-50",
          )}
        >
          {main}
        </a>
      ) : (
        <Button
          size="sm"
          variant="outline"
          data-slot="for-you-card-primary"
          disabled={hold}
          onClick={primary?.onPress}
        >
          {main}
        </Button>
      )
    ) : (
      <Button
        size="sm"
        variant="outline"
        data-slot="for-you-card-primary"
        aria-expanded={false}
        disabled={offline}
        onClick={() => setExpanded(true)}
      >
        {main}
      </Button>
    );
    return asRow(
      <article
        data-slot="for-you-card"
        data-state={state}
        data-verb={verb}
        data-compact=""
        data-expanded={expanded ? "" : undefined}
        data-selected={selected ? "" : undefined}
        data-unread={unread || undefined}
        aria-labelledby={titleId}
        aria-busy={sending || undefined}
        className={cn(
          root,
          "grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0",
        )}
      >
        <span
          aria-hidden
          className="flex size-7 items-center justify-center rounded-tile bg-state-tile text-muted-foreground [&_svg]:size-4"
        >
          <Verb.icon />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <header
            data-slot="for-you-card-header"
            className="flex min-w-0 items-center gap-1.5 text-xs leading-5 text-muted-foreground"
          >
            <span className="min-w-0 flex-1 truncate">
              <span data-slot="for-you-card-verb">{Verb.label}</span>
              {" · "}
              {from.name}
              {from.onBehalfOf ? ` · ${from.onBehalfOf}` : null}
            </span>
            {deadline ? (
              <span
                data-slot="for-you-card-deadline"
                data-urgent={deadline.urgent ? "" : undefined}
                className="flex shrink-0 items-center gap-1 tabular-nums"
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
            ) : time ? (
              <span className="shrink-0 tabular-nums">{time}</span>
            ) : null}
            {unread ? (
              <span
                data-slot="for-you-card-unread"
                aria-hidden
                className="size-1.5 shrink-0 rounded-full bg-info"
              />
            ) : null}
          </header>
          <h3
            id={titleId}
            data-slot="for-you-card-title"
            className="min-w-0 text-sm font-medium wrap-anywhere text-foreground"
          >
            <InboxRowTitle row={row} className="relative font-medium">
              {unread ? <span className="sr-only">Unread: </span> : null}
              {title}
            </InboxRowTitle>
          </h3>
          {line ? (
            <p
              data-slot="for-you-card-why"
              className={cn(
                "min-w-0 text-sm text-muted-foreground",
                expanded ? "wrap-anywhere" : "truncate",
              )}
            >
              {line}
            </p>
          ) : null}
          {expanded && live ? (
            <div
              data-slot="for-you-card-expanded"
              className="mt-2 flex min-w-0 flex-col gap-3"
            >
              {summary && summary !== line ? (
                <p className="min-w-0 text-sm text-muted-foreground">
                  {summary}
                </p>
              ) : null}
              {facts?.length ? (
                <dl
                  data-slot="for-you-card-facts"
                  className="grid min-w-0 grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-x-4 gap-y-2"
                >
                  {facts.map((fact, index) => (
                    <Fact key={`${fact.label}-${index}`} fact={fact} />
                  ))}
                </dl>
              ) : null}
              {evidence != null ? (
                <div data-slot="for-you-card-evidence" className="min-w-0">
                  {evidence}
                </div>
              ) : null}
              {children != null ? (
                <div data-slot="for-you-card-children" className="min-w-0">
                  {children}
                </div>
              ) : null}
              {body}
              {optionButtons}
              <p
                data-slot="for-you-card-if-nobody"
                className="min-w-0 text-xs text-muted-foreground"
              >
                {offline
                  ? `Connect to answer · If nobody answers: ${ifNobodyAnswers}`
                  : `If nobody answers: ${ifNobodyAnswers}`}
              </p>
            </div>
          ) : null}
          {state === "submit_failed" ? (
            // Outside the disclosure: a folded card still says it.
            <p
              role="alert"
              data-slot="for-you-card-failed"
              className="mt-1 text-xs text-destructive-text"
            >
              Your answer didn't save. Try again.
            </p>
          ) : null}
          <div
            data-slot="for-you-card-actions"
            className="mt-2 flex min-w-0 items-center gap-2"
          >
            {state === "stale" ? (
              optionButtons
            ) : expanded ? (
              <Button
                size="sm"
                variant="ghost"
                aria-expanded
                className="text-muted-foreground"
                disabled={sending}
                onClick={() => setExpanded(false)}
              >
                <ChevronUp aria-hidden />
                Less
              </Button>
            ) : (
              mainButton
            )}
            <span className="flex-1" />
            {more}
          </div>
        </div>
      </article>,
    );
  }

  return asRow(
    <article
      data-slot="for-you-card"
      data-state={state}
      data-verb={verb}
      data-selected={selected ? "" : undefined}
      data-unread={unread || undefined}
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
        ) : time ? (
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {time}
          </span>
        ) : null}
        {unread ? (
          <span
            data-slot="for-you-card-unread"
            aria-hidden
            className="size-1.5 shrink-0 rounded-full bg-info"
          />
        ) : null}
        {more}
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
          <InboxRowTitle
            row={row}
            // Its touch target stays on the title, clear of the header's ⋯ and Snooze.
            className="relative font-medium"
          >
            {unread ? <span className="sr-only">Unread: </span> : null}
            {title}
          </InboxRowTitle>
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
    </article>,
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
