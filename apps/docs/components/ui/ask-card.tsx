// @vegastack ask-card@0.139.0 sha256-wSPAqoGAXXyzeL9U1/v0jOaAOeG0ek6y+lEAi3pD+L4=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { Textarea } from "@/components/ui/textarea";

/* ------------------------------------------------------------------------------------------------
 * AskCard — the one card an agent uses to ask a person's OK, in a chat, in For you and in a push
 * preview. Every choice is the server's: the card draws them in the server's order with their ids
 * and words, never builds one and never draws a filled primary. The preferred choice (`once`) is
 * secondary, every other one outline (`never` in the destructive ink); more than one Always choice
 * folds into one "Always…" menu, and Never and Decline share one "Decline ▾" menu. A "Delete or send" action shows its preview before the
 * buttons. Once settled, the buttons give way to one muted line: what was answered, by whom, where.
 * ----------------------------------------------------------------------------------------------*/

/**
 * K-PERM `TOOL_CLASSES` spelling: `ToolPermissionList` and `AskCard` class props are exactly
 * `read | write | delete_send`, never "send".
 */
export type ToolClass = "read" | "write" | "delete_send";

/** Where an ask stands. */
export type AskState =
  | "pending"
  | "allowed"
  | "allowed_always"
  | "declined"
  | "blocked"
  | "skipped"
  | "expired"
  | "stale"
  | "cancelled"
  | "refused";

/**
 * One server-offered choice. The card never builds a choice: the caller maps the server's offer
 * (`once`, any number of `always:<scope>`, `never`, `decline`) one to one and passes each `id` back
 * unchanged.
 */
export type AskChoice = {
  /** Opaque: "once" | "always:<scope>:<place>" | "never" | "decline" | … */
  id: string;
  /** The server's words: "Allow once", "Always in #ops", "Never", "Decline". */
  label: string;
  /** Drives placement and tone only (`never`: the destructive ink). */
  kind: "once" | "always" | "never" | "decline";
  /** An Always choice's place, shown under it in the Always menu: "only in this thread". */
  scopeLabel?: string;
  /** A decline that opens a one-line note before it is sent. */
  needsNote?: boolean;
};

/** Answers with one choice's `id`; a decline may carry a note. */
export type AskAnswerHandler = (
  choiceId: string,
  note?: string,
) => void | Promise<void>;

/** One label and value under the action ("To", "sm@vegastack.com"). */
export type AskFact = { label: string; value: string };

/** One call in a bundle: previewed, answered and settled on its own. */
export type AskBundleItem = {
  /** A stable key. */
  id: string;
  /** What this call does: "Email sm@vegastack.com". */
  title: string;
  /** Its permission class. */
  toolClass: ToolClass;
  /** Where this call stands. */
  state: AskState;
  /** Labels and values under its title. */
  facts?: AskFact[];
  /** The exact words or recipients of this one call; always shown for `delete_send`. */
  preview?: React.ReactNode;
  /** The server's choices for this call, in order. */
  choices: AskChoice[];
  /** Answers this call; absent, its buttons are not drawn. */
  onAnswer?: AskAnswerHandler;
  /** This call's answer is in flight. */
  busy?: boolean;
  /** Who answered it, with what, and when. */
  answered?: { choiceLabel: string; by: string; at: string };
};

/** Where an answer came from. */
export type AskAnsweredVia = "web" | "phone" | "slack" | "rule" | "auto_check";

/** Props accepted by `AskCard`. */
export interface AskCardProps extends Omit<
  React.ComponentPropsWithRef<"section">,
  "title" | "children"
> {
  /** The agent asking: "Donna", on behalf of "Anu's Assistant". */
  agent: { name: string; avatar: React.ReactNode; onBehalfOf?: string };
  /** What it wants to do, its class, the facts under it and the preview of what it would send. */
  action: {
    title: string;
    toolClass: ToolClass;
    facts?: AskFact[];
    preview?: React.ReactNode;
  };
  /** Where the ask stands. */
  state: AskState;
  /** The server's choices, in order. Empty: a read-only card (not the viewer's to answer). */
  choices: AskChoice[];
  /** Answers with a choice's id; absent, the buttons are not drawn. @default undefined */
  onAnswer?: AskAnswerHandler;
  /**
   * Why it asks, in the caller's full words ("Auto-check asked: the recipient isn't one anyone
   * named"): one muted line under the title and facts while the ask is open, wrapping, never
   * truncating the title. The card adds no prefix. @default undefined
   */
  reason?: string;
  /** Why no Always is offered, in the server's words (`offer.noAlways.words`). @default undefined */
  noAlways?: { words: string };
  /** Who answered, with what, where and when; `undo` adds Undo to the line. @default undefined */
  answered?: {
    choiceLabel: string;
    by: string;
    via: AskAnsweredVia;
    at: string;
    undo?: () => void;
  };
  /** `refused`: why a rule refused it, and the way on ("Ask an admin"). @default undefined */
  refusal?: { words: string; way?: { label: string; href: string } };
  /** "Why?": a link to the evidence, or a handler that opens it. @default undefined */
  why?: { href: string } | { onClick: () => void };
  /** When the ask lapses: "Until 17:00". @default undefined */
  deadline?: string;
  /** What happens if nobody answers: "It won't send." @default undefined */
  ifNobodyAnswers?: string;
  /**
   * Several calls in one card. Each item is previewed and answered on its own; the "Answer all"
   * row shows only the server's `sharedChoices`, and never while any item deletes or sends.
   * @default undefined
   */
  bundle?: {
    items: AskBundleItem[];
    sharedChoices: AskChoice[];
    onAnswerAll?: (choiceId: string) => void | Promise<void>;
  };
  /**
   * `card` — its own surface, in a chat. `inline` — no surface of its own, inside a host card such
   * as `ForYouCard`.
   * @default "card"
   */
  density?: "inline" | "card";
  /** An answer is in flight: every button holds. @default false */
  busy?: boolean;
  /** No connection: the buttons are disabled and "Connect to answer" shows. @default false */
  offline?: boolean;
}

const CLASS_LABEL: Record<ToolClass, string> = {
  read: "Read",
  write: "Write",
  delete_send: "Delete or send",
};

const VIA_WORDS: Record<AskAnsweredVia, string> = {
  web: "on the web",
  phone: "on the phone",
  slack: "in Slack",
  rule: "by a rule",
  auto_check: "by Auto-check",
};

/** The words of a settled state, used when there is no `answered` line to say more. */
const CLOSED_WORDS: Partial<Record<AskState, string>> = {
  allowed: "Allowed",
  allowed_always: "Always allowed",
  declined: "Declined",
  blocked: "Never allowed",
  skipped: "Skipped",
  expired: "Not answered in time",
  stale: "This changed. Review the new version.",
  cancelled: "No longer needed",
};

const ANSWERED: ReadonlySet<AskState> = new Set([
  "allowed",
  "allowed_always",
  "declined",
  "blocked",
  "skipped",
]);

/** The glyph a settled line starts with: a primary check when allowed, the muted ⊘ when not. */
function settledGlyph(state: AskState): "done" | "skipped" | null {
  if (state === "allowed" || state === "allowed_always") return "done";
  if (
    state === "declined" ||
    state === "blocked" ||
    state === "skipped" ||
    state === "refused"
  )
    return "skipped";
  return null;
}

/** The button look for a choice: `once` secondary, the rest outline. Never filled. */
function choiceLook(kind: AskChoice["kind"]): {
  variant: "secondary" | "outline";
  className?: string;
} {
  if (kind === "once") return { variant: "secondary" };
  if (kind === "never")
    return { variant: "outline", className: "text-destructive-text" };
  return { variant: "outline" };
}

/**
 * Runs one answer at a time and holds the buttons until the caller settles the state; a failed
 * send lets go and says so.
 */
function useOneAnswer(handler: AskAnswerHandler | undefined) {
  const [pending, setPending] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const holding = React.useRef(false);
  const run = React.useCallback(
    async (choiceId: string, note?: string) => {
      if (!handler || holding.current) return;
      holding.current = true;
      setPending(true);
      setFailed(false);
      try {
        await (note === undefined
          ? handler(choiceId)
          : handler(choiceId, note));
      } catch {
        setFailed(true);
      } finally {
        holding.current = false;
        setPending(false);
      }
    },
    [handler],
  );
  return { pending, failed, run };
}

const FAILED = "Couldn't send your answer. Try again.";

/** The Decline menu's item that opens the note field. */
const DECLINE_WITH_NOTE = "Decline with a note…";

/**
 * The server's choices as buttons, in the server's order; more than one Always choice, one menu, so the row fits 390px. Never
 * and Decline, when both are offered, share one "Decline ▾" menu: "Decline with a note…" and Never.
 */
function AskChoices({
  choices,
  onAnswer,
  disabled,
  label,
}: {
  choices: AskChoice[];
  onAnswer: (choiceId: string, note?: string) => void;
  disabled: boolean;
  /** The group's accessible name: "Answer: Email sm@vegastack.com". */
  label: string;
}) {
  const [notingId, setNotingId] = React.useState<string | null>(null);
  const [note, setNote] = React.useState("");
  const group = React.useRef<HTMLDivElement>(null);
  const returnTo = React.useRef<string | null>(null);
  // A choice the server withdrew while its note was open can't be sent.
  const noting = notingId
    ? (choices.find((choice) => choice.id === notingId) ?? null)
    : null;
  const always = choices.filter((choice) => choice.kind === "always");
  // Two or more Always choices fold, so the row fits one line at 390px beside Decline ▾.
  const folded = always.length > 1;
  // Every press reads the hold when it lands, so a menu left open can't answer late.
  const answer = (choiceId: string, text?: string) => {
    if (!disabled) onAnswer(choiceId, text);
  };

  React.useEffect(() => {
    if (noting || !returnTo.current) return;
    const id = returnTo.current;
    returnTo.current = null;
    group.current
      ?.querySelector<HTMLElement>(`[data-choice-id="${CSS.escape(id)}"]`)
      ?.focus();
  }, [noting]);

  if (noting) {
    const send = () => answer(noting.id, note.trim() || undefined);
    const back = () => {
      returnTo.current = noting.id;
      setNotingId(null);
    };
    return (
      <div
        data-slot="ask-card-note"
        className="flex w-full min-w-0 flex-col gap-2"
      >
        <Textarea
          autoFocus
          rows={1}
          aria-label="A note to the agent (optional)"
          placeholder="Tell the agent why, or what to do instead (optional)"
          value={note}
          disabled={disabled}
          onChange={(event) => setNote(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing &&
              event.keyCode !== 229
            ) {
              event.preventDefault();
              send();
            }
            if (event.key === "Escape") back();
          }}
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            data-choice={noting.kind}
            onClick={send}
          >
            {noting.label}
          </Button>
          <Button size="sm" variant="ghost" disabled={disabled} onClick={back}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  const ordered = [
    ...choices.filter((choice) => choice.kind !== "decline"),
    ...choices.filter((choice) => choice.kind === "decline"),
  ];
  // Never and Decline share one "Decline ▾" menu when both are offered.
  const declineChoice = choices.find((choice) => choice.kind === "decline");
  const neverChoice = choices.find((choice) => choice.kind === "never");
  const refusalsFolded = Boolean(declineChoice && neverChoice);
  const press = (choice: AskChoice) => {
    if (disabled) return;
    if (choice.needsNote) {
      setNote("");
      setNotingId(choice.id);
    } else answer(choice.id);
  };
  let menuDrawn = false;
  return (
    <div
      ref={group}
      role="group"
      aria-label={label}
      data-slot="ask-card-choices"
      className="flex min-w-0 flex-wrap items-center gap-2"
    >
      {ordered.map((choice) => {
        if (choice.kind === "always" && folded) {
          if (menuDrawn) return null;
          menuDrawn = true;
          return (
            <DropdownMenu key="always">
              <DropdownMenuTrigger
                disabled={disabled}
                render={
                  <Button
                    size="sm"
                    variant="outline"
                    data-choice="always"
                    disabled={disabled}
                  />
                }
              >
                Always…
                <ChevronDown aria-hidden data-icon="inline-end" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                {always.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    data-choice-id={option.id}
                    disabled={disabled}
                    onClick={() => answer(option.id)}
                  >
                    {option.scopeLabel ? (
                      <ItemContent className="gap-0">
                        <ItemTitle className="font-normal">
                          {option.label}
                        </ItemTitle>
                        <ItemDescription className="line-clamp-2 text-xs">
                          {option.scopeLabel}
                        </ItemDescription>
                      </ItemContent>
                    ) : (
                      option.label
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }
        if (refusalsFolded && choice.kind === "never") return null;
        if (refusalsFolded && choice.kind === "decline")
          return (
            <DropdownMenu key="decline">
              <DropdownMenuTrigger
                disabled={disabled}
                render={
                  <Button
                    size="sm"
                    variant="outline"
                    data-choice="decline"
                    data-choice-id={choice.id}
                    disabled={disabled}
                  />
                }
              >
                {choice.label}
                <ChevronDown aria-hidden data-icon="inline-end" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-56">
                <DropdownMenuItem
                  data-choice-id={`${choice.id}:menu`}
                  disabled={disabled}
                  onClick={() => press(choice)}
                >
                  {choice.needsNote ? DECLINE_WITH_NOTE : choice.label}
                </DropdownMenuItem>
                <DropdownMenuItem
                  data-choice-id={neverChoice!.id}
                  disabled={disabled}
                  onClick={() => answer(neverChoice!.id)}
                >
                  {neverChoice!.label}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        const look = choiceLook(choice.kind);
        return (
          <Button
            key={choice.id}
            size="sm"
            variant={look.variant}
            className={look.className}
            disabled={disabled}
            data-choice={choice.kind}
            data-choice-id={choice.id}
            title={choice.scopeLabel}
            onClick={() => press(choice)}
          >
            {choice.label}
          </Button>
        );
      })}
    </div>
  );
}

/** A preview that draws something: not null, false, an empty string or an empty list. */
function hasPreview(preview: React.ReactNode): boolean {
  if (preview == null || preview === false || preview === "") return false;
  return !(Array.isArray(preview) && preview.length === 0);
}

/**
 * The choices a person may press. A delete or send with nothing to preview keeps only its refusals
 * (Never, Decline): every surface that can allow a send shows its words first.
 */
function pressable(
  choices: AskChoice[],
  toolClass: ToolClass,
  preview: React.ReactNode,
): { choices: AskChoice[]; withheld: boolean } {
  if (toolClass !== "delete_send" || hasPreview(preview))
    return { choices, withheld: false };
  const refusals = choices.filter(
    (choice) => choice.kind === "never" || choice.kind === "decline",
  );
  return { choices: refusals, withheld: refusals.length < choices.length };
}

const WITHHELD = "There's nothing to preview, so it can't be allowed here.";
/** Labels and values, two columns that wrap. */
function AskFacts({ facts }: { facts: AskFact[] }) {
  return (
    <dl
      data-slot="ask-card-facts"
      className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-xs"
    >
      {facts.map((fact, index) => (
        <React.Fragment key={`${fact.label}-${index}`}>
          <dt className="text-muted-foreground">{fact.label}</dt>
          <dd className="min-w-0 wrap-anywhere text-foreground">
            {fact.value}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

/** The exact words a call would send: a quiet block that scrolls when long, a keyboard stop. */
function AskPreview({
  children,
  toolClass,
}: {
  children: React.ReactNode;
  toolClass: ToolClass;
}) {
  return (
    <div
      data-slot="ask-card-preview"
      tabIndex={0}
      role="region"
      aria-label={
        toolClass === "delete_send" ? "What it would send" : "Preview"
      }
      className="relative max-h-48 min-w-0 overflow-y-auto rounded-block bg-muted px-3 py-2 text-sm whitespace-pre-wrap wrap-anywhere text-foreground"
    >
      {children}
    </div>
  );
}

/** The muted line a settled ask reads as. */
function SettledLine({
  state,
  answered,
  refusal,
  via,
  undo,
}: {
  state: AskState;
  answered?: { choiceLabel: string; by: string; at: string };
  refusal?: AskCardProps["refusal"];
  via?: AskAnsweredVia;
  undo?: () => void;
}) {
  const glyph = settledGlyph(state);
  let words: React.ReactNode = CLOSED_WORDS[state] ?? null;
  if (state === "refused") words = refusal?.words ?? "Refused by a rule";
  else if (ANSWERED.has(state) && answered) {
    const where = via ? ` ${VIA_WORDS[via]}` : "";
    words = `${answered.choiceLabel} · ${answered.by}${where} · ${answered.at}`;
  }
  if (words == null) return null;
  return (
    <div
      data-slot="ask-card-settled"
      data-state={state}
      className="flex min-h-7 min-w-0 items-start gap-2 text-sm text-muted-foreground"
    >
      {glyph ? (
        <StatusGlyph status={glyph} label={null} className="mt-0.5" />
      ) : null}
      <span className="min-w-0 flex-1 wrap-anywhere">
        {words}
        {state === "refused" && refusal?.way ? (
          <>
            {" "}
            <a
              href={refusal.way.href}
              className="whitespace-nowrap text-foreground underline-offset-4 hover:underline"
            >
              {refusal.way.label} ›
            </a>
          </>
        ) : null}
      </span>
      {undo && ANSWERED.has(state) ? (
        <Button
          size="xs"
          variant="ghost"
          className="shrink-0 text-muted-foreground"
          onClick={undo}
        >
          Undo
        </Button>
      ) : null}
    </div>
  );
}

/** A call's title with its class: "Email sm@vegastack.com · Delete or send". */
function ActionTitle({
  id,
  title,
  toolClass,
}: {
  id?: string;
  title: string;
  toolClass: ToolClass;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span
        id={id}
        data-slot="ask-card-title"
        className="min-w-0 font-medium wrap-anywhere text-foreground"
      >
        {title}
      </span>
      <span
        data-slot="ask-card-class"
        data-class={toolClass}
        className="shrink-0 text-xs text-muted-foreground"
      >
        {CLASS_LABEL[toolClass]}
      </span>
    </div>
  );
}

/** One call in a bundle, answered on its own. */
function AskBundleRow({
  item,
  offline,
  holdAll,
  onPendingChange,
}: {
  item: AskBundleItem;
  offline: boolean;
  holdAll: boolean;
  /** Tells the card an answer for this item is in flight, so Answer all holds meanwhile. */
  onPendingChange: (id: string, pending: boolean) => void;
}) {
  const { pending, failed, run } = useOneAnswer(item.onAnswer);
  const busy = Boolean(item.busy) || pending;
  const open = item.state === "pending";
  const offer = pressable(item.choices, item.toolClass, item.preview);
  const answerable = open && item.onAnswer && offer.choices.length > 0;
  React.useEffect(() => {
    onPendingChange(item.id, busy);
    return () => onPendingChange(item.id, false);
  }, [busy, item.id, onPendingChange]);
  return (
    <li
      data-slot="ask-card-item"
      data-state={item.state}
      aria-busy={busy || undefined}
      className="flex min-w-0 flex-col gap-2 py-3 first:pt-0 last:pb-0"
    >
      <ActionTitle title={item.title} toolClass={item.toolClass} />
      {item.facts?.length ? <AskFacts facts={item.facts} /> : null}
      {hasPreview(item.preview) && open ? (
        <AskPreview toolClass={item.toolClass}>{item.preview}</AskPreview>
      ) : null}
      {answerable ? (
        <AskChoices
          choices={offer.choices}
          onAnswer={(id, note) => void run(id, note)}
          disabled={busy || offline || holdAll}
          label={`Answer: ${item.title}`}
        />
      ) : open ? null : (
        <SettledLine state={item.state} answered={item.answered} />
      )}
      {open && offer.withheld ? (
        <p className="text-xs text-muted-foreground">{WITHHELD}</p>
      ) : null}
      {failed ? (
        <p role="alert" className="text-xs text-destructive-text">
          {FAILED}
        </p>
      ) : null}
    </li>
  );
}
/**
 * `AskCard` — an agent asks a person's OK. The choices are the server's, in its order, each passed
 * back by `id`; the preferred one is secondary and none is filled. A "Delete or send" action shows
 * its preview before the buttons. Settled, the card keeps its title and reads as one muted line.
 *
 * @example
 * <AskCard
 *   agent={{ name: "Donna", avatar: <PersonAvatar person={donna} size="xs" />, onBehalfOf: "Anu's Assistant" }}
 *   action={{ title: "Email sm@vegastack.com", toolClass: "delete_send", preview: "Weekly summary…" }}
 *   state="pending"
 *   choices={[
 *     { id: "once", label: "Allow once", kind: "once" },
 *     { id: "always:thread", label: "Always in this thread", kind: "always" },
 *     { id: "decline", label: "Decline", kind: "decline", needsNote: true },
 *   ]}
 *   onAnswer={(id, note) => answer(request.id, id, note)}
 * />
 */
export function AskCard({
  agent,
  action,
  state,
  choices,
  onAnswer,
  reason,
  noAlways,
  answered,
  refusal,
  why,
  deadline,
  ifNobodyAnswers,
  bundle,
  density = "card",
  busy: busyProp = false,
  offline = false,
  className,
  ...props
}: AskCardProps) {
  const titleId = React.useId();
  const { pending, failed, run } = useOneAnswer(onAnswer);
  const busy = busyProp || pending;
  const open = state === "pending";
  const offer = pressable(choices, action.toolClass, action.preview);
  const answerable = open && Boolean(onAnswer) && offer.choices.length > 0;
  const [itemsPending, setItemsPending] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const onItemPending = React.useCallback((id: string, value: boolean) => {
    setItemsPending((current) => {
      if (current.has(id) === value) return current;
      const next = new Set(current);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  const hasSend = bundle?.items.some(
    (item) => item.toolClass === "delete_send",
  );
  const shared =
    open &&
    bundle &&
    bundle.onAnswerAll &&
    bundle.sharedChoices.length > 0 &&
    !hasSend &&
    bundle.items.filter((item) => item.state === "pending").length > 1;
  const answerAll = useOneAnswer(bundle?.onAnswerAll);
  const holdAll = busy || answerAll.pending;

  const whyControl = why ? (
    "href" in why ? (
      <a
        data-slot="ask-card-why"
        href={why.href}
        className="relative shrink-0 text-xs text-muted-foreground underline-offset-4 before:absolute before:-inset-1 before:content-[''] hover:text-foreground hover:underline"
      >
        Why?
      </a>
    ) : (
      <Button
        data-slot="ask-card-why"
        size="xs"
        variant="ghost"
        className="shrink-0 text-muted-foreground"
        onClick={why.onClick}
      >
        Why?
      </Button>
    )
  ) : null;

  const footLines = open
    ? [
        deadline,
        ifNobodyAnswers ? `If nobody answers: ${ifNobodyAnswers}` : null,
      ].filter(Boolean)
    : [];

  return (
    <section
      data-slot="ask-card"
      data-state={state}
      data-density={density}
      aria-labelledby={titleId}
      aria-busy={holdAll || undefined}
      className={cn(
        "flex min-w-0 flex-col gap-3 text-sm",
        density === "card" &&
          "rounded-card border border-chat-hairline bg-chat-card p-4 max-sm:p-3",
        className,
      )}
      {...props}
    >
      <header
        data-slot="ask-card-header"
        className="flex min-w-0 items-center gap-2"
      >
        <span data-slot="ask-card-avatar" className="inline-flex shrink-0">
          {agent.avatar}
        </span>
        <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{agent.name}</span>
          {agent.onBehalfOf ? ` · ${agent.onBehalfOf}` : null}
        </p>
        {whyControl}
      </header>

      <div data-slot="ask-card-body" className="flex min-w-0 flex-col gap-2">
        <ActionTitle
          id={titleId}
          title={action.title}
          toolClass={action.toolClass}
        />
        {action.facts?.length ? <AskFacts facts={action.facts} /> : null}
        {reason && open ? (
          <p
            data-slot="ask-card-reason"
            className="min-w-0 text-xs text-pretty wrap-break-word text-muted-foreground"
          >
            {reason}
          </p>
        ) : null}
        {hasPreview(action.preview) && open ? (
          <AskPreview toolClass={action.toolClass}>{action.preview}</AskPreview>
        ) : null}
      </div>

      {bundle && bundle.items.length > 0 ? (
        <ul
          data-slot="ask-card-items"
          aria-label={`${bundle.items.length} actions`}
          className="flex min-w-0 flex-col divide-y divide-chat-hairline"
        >
          {bundle.items.map((item) => (
            <AskBundleRow
              key={item.id}
              item={item}
              offline={offline}
              holdAll={holdAll}
              onPendingChange={onItemPending}
            />
          ))}
        </ul>
      ) : null}

      {shared ? (
        <div
          data-slot="ask-card-shared"
          className="flex min-w-0 flex-wrap items-center gap-2 border-t border-chat-hairline pt-3"
        >
          <span className="text-xs text-muted-foreground">Answer all</span>
          <AskChoices
            choices={bundle.sharedChoices.map(
              ({ needsNote: _note, ...choice }) => choice,
            )}
            onAnswer={(id) => void answerAll.run(id)}
            disabled={holdAll || offline || itemsPending.size > 0}
            label="Answer all"
          />
        </div>
      ) : null}

      {answerable ? (
        <AskChoices
          choices={offer.choices}
          onAnswer={(id, note) => void run(id, note)}
          disabled={holdAll || offline}
          label={`Answer: ${action.title}`}
        />
      ) : open ? (
        !bundle ? (
          <p
            data-slot="ask-card-readonly"
            className="text-xs text-muted-foreground"
          >
            Waiting for an answer
          </p>
        ) : null
      ) : (
        <SettledLine
          state={state}
          answered={answered}
          via={answered?.via}
          undo={answered?.undo}
          refusal={refusal}
        />
      )}

      {open && offer.withheld ? (
        <p
          data-slot="ask-card-withheld"
          className="min-w-0 text-xs text-muted-foreground"
        >
          {WITHHELD}
        </p>
      ) : null}

      {open && (offline || failed || answerAll.failed || noAlways) ? (
        <p
          data-slot="ask-card-footnote"
          role={failed || answerAll.failed ? "alert" : undefined}
          className={cn(
            "min-w-0 text-xs",
            failed || answerAll.failed
              ? "text-destructive-text"
              : "text-muted-foreground",
          )}
        >
          {offline
            ? "Connect to answer"
            : failed || answerAll.failed
              ? FAILED
              : noAlways?.words}
        </p>
      ) : null}

      {footLines.length ? (
        <p
          data-slot="ask-card-deadline"
          className="min-w-0 text-xs text-muted-foreground"
        >
          {footLines.join(" · ")}
        </p>
      ) : null}
    </section>
  );
}
