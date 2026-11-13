// @vegastack chat-request-card@0.80.0 sha256-9/sYcLB0Hc5UrFS/P/+9zUAyIMSJ/FBEuIRzkzjxHxE=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FileText,
  Globe,
  KeyRound,
  ListTodo,
  Mail,
  MessageSquare,
  Share2,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChatCard } from "@/components/ui/chat-card";
import { ChatMenu, ChatMenuItem } from "@/components/ui/chat-menu";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { Textarea } from "@/components/ui/textarea";

/* ------------------------------------------------------------------------------------------------
 * ChatRequestCard — an agent asking a person's OK, drawn from the offer the server stored with the
 * request. The card never computes its own buttons: `once` is the primary button, every `always:*`
 * choice sits in one "Always allow" menu with its scope, and `decline` is a quiet text button that
 * can carry a note. Nothing on the card can fail when pressed because nothing on it was invented
 * here. Once answered, refused, withdrawn or expired the card settles into one muted line.
 * ----------------------------------------------------------------------------------------------*/

/** One choice the server says it will accept for a request. */
export type RequestChoice =
  | { id: "once"; label: string }
  | {
      id: `always:${string}`;
      label: string;
      scope: { kind: string; value: string; label: string };
    }
  | { id: "decline"; label: string };

/** A request as the chat contract carries it (the `data-request` part). */
export type RequestData = {
  /** The interaction this request answers. */
  interactionId: string;
  /** The permission kind ("gmail_send", "web_open"); picks the subject's icon. */
  kind: string;
  /** What the agent wants to do, as a sentence start: "Email sm@vegastack.com". */
  title: string;
  /** A quiet second line: the subject of the email, the page title. */
  detail?: string;
  /** A link to look at what will be sent or opened. */
  preview?: { label: string; href?: string };
  /** The Subagent that asked, when it wasn't the agent itself. */
  from?: { subagentTitle: string; callId: string };
  /** What the server will accept, in order, and why Always can't be offered when it can't. */
  offer: {
    choices: RequestChoice[];
    noAlways?: { code: string; words: string };
    bundle?: { key: string; count: number };
  };
  /** Where the request stands. */
  state: "open" | "answered" | "refused" | "withdrawn" | "expired";
  /** Who answered, with what, and whether it can be undone. */
  answer?: { choiceId: string; byName: string; at: string; undoable: boolean };
  /** Why it was refused by a rule, and the way on ("Ask an admin ›"). */
  refusal?: { words: string; way?: { label: string; href: string } };
};

const KIND_ICON: [RegExp, LucideIcon][] = [
  [/mail|gmail|email/i, Mail],
  [/share|permission/i, Share2],
  [/web|site|url|open|fetch|browse/i, Globe],
  [/slack|message|post|chat|dm/i, MessageSquare],
  [/calendar|event|meeting/i, CalendarDays],
  [/task|todo/i, ListTodo],
  [/doc|drive|file|sheet|slide/i, FileText],
];

/** The icon for a permission kind; a key when the kind names nothing it knows. */
function kindIcon(kind: string): LucideIcon {
  return KIND_ICON.find(([pattern]) => pattern.test(kind))?.[1] ?? KeyRound;
}

const lowerFirst = (text: string) =>
  text.length > 0 ? text[0]!.toLowerCase() + text.slice(1) : text;

/** The subject line: type icon, title, the asking Subagent, a quiet detail and the preview link. */
function RequestSubject({
  data,
  showFrom = false,
}: {
  data: RequestData;
  showFrom?: boolean;
}) {
  const Icon = kindIcon(data.kind);
  return (
    <div data-slot="request-subject" className="flex min-w-0 items-start gap-2">
      <Icon
        aria-hidden="true"
        strokeWidth={1.5}
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
          <span
            data-slot="request-title"
            className="min-w-0 font-medium text-foreground"
          >
            {data.title}
          </span>
          {showFrom && data.from ? (
            <span
              data-slot="request-from"
              className="min-w-0 truncate text-xs text-muted-foreground"
            >
              for “{data.from.subagentTitle}”
            </span>
          ) : null}
        </div>
        {data.detail || data.preview ? (
          <div className="flex min-w-0 items-baseline gap-2 text-xs text-muted-foreground">
            {data.detail ? (
              <span data-slot="request-detail" className="min-w-0 truncate">
                {data.detail}
              </span>
            ) : null}
            {data.preview?.href ? (
              <a
                data-slot="request-preview"
                href={data.preview.href}
                target="_blank"
                rel="noreferrer"
                className="relative ms-auto inline-flex shrink-0 items-center gap-0.5 text-muted-foreground before:absolute before:-inset-1 before:content-[''] underline-offset-4 hover:text-foreground hover:underline"
              >
                {data.preview.label}
                <ChevronRight
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-3 rtl:rotate-180"
                />
              </a>
            ) : data.preview ? (
              <span className="ms-auto shrink-0">{data.preview.label}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

type Answer = (choiceId: string, note?: string) => Promise<void>;

/**
 * The offered choices as buttons — exactly the server's, never more. `once` primary, the
 * `always:*` choices in one outline menu, `decline` a text button that opens a note field.
 */
function RequestChoices({
  choices,
  onAnswer,
  busy,
  size = "sm",
  declineLabel,
}: {
  choices: RequestChoice[];
  onAnswer: Answer;
  busy: boolean;
  size?: "sm" | "xs";
  declineLabel?: string;
}) {
  const [noting, setNoting] = React.useState(false);
  const [note, setNote] = React.useState("");
  const once = choices.find((choice) => choice.id === "once");
  const always = choices.filter((choice) => choice.id.startsWith("always:"));
  const decline = choices.find((choice) => choice.id === "decline");
  if (noting && decline) {
    const send = () => void onAnswer("decline", note.trim() || undefined);
    return (
      <div
        data-slot="request-decline-note"
        className="flex w-full min-w-0 flex-col gap-2"
      >
        <Textarea
          autoFocus
          aria-label="A note to the agent (optional)"
          placeholder="Tell the agent why, or what to do instead (optional)"
          value={note}
          disabled={busy}
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
            if (event.key === "Escape") setNoting(false);
          }}
        />
        <div className="flex items-center gap-2">
          <Button size={size} variant="outline" disabled={busy} onClick={send}>
            {declineLabel ?? decline.label}
          </Button>
          <Button
            size={size}
            variant="ghost"
            disabled={busy}
            onClick={() => setNoting(false)}
          >
            Back
          </Button>
        </div>
      </div>
    );
  }
  return (
    <>
      {once ? (
        <Button
          size={size}
          disabled={busy}
          data-choice="once"
          onClick={() => void onAnswer("once")}
        >
          {once.label}
        </Button>
      ) : null}
      {always.length > 0 ? (
        <ChatMenu
          trigger={
            <Button
              size={size}
              variant="outline"
              disabled={busy}
              data-choice="always"
            >
              Always allow
              <ChevronDown
                aria-hidden="true"
                data-icon="inline-end"
                strokeWidth={1.5}
              />
            </Button>
          }
        >
          {always.map((choice, index) => (
            <ChatMenuItem
              key={choice.id}
              shortcut={index < 9 ? String(index + 1) : undefined}
              hint={"scope" in choice ? choice.scope.label : undefined}
              onSelect={() => void onAnswer(choice.id)}
            >
              {choice.label}
            </ChatMenuItem>
          ))}
        </ChatMenu>
      ) : null}
      {decline ? (
        <Button
          size={size}
          variant="ghost"
          disabled={busy}
          data-choice="decline"
          className="text-muted-foreground"
          onClick={() => setNoting(true)}
        >
          {declineLabel ?? decline.label}
        </Button>
      ) : null}
    </>
  );
}

/**
 * Runs one answer at a time. The buttons hold from the press until the request settles (its new
 * state replaces the card), so a second answer can't follow the first; only a failed send lets go,
 * and says so.
 */
function useAnswer(onAnswer: Answer) {
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  // The answer that holds the buttons now; a release or a newer answer retires older ones, so a
  // late failure of a retired answer can't let go of the one that holds.
  const current = React.useRef<symbol | null>(null);
  const run: Answer = async (choiceId, note) => {
    if (current.current) return;
    const token = Symbol("answer");
    current.current = token;
    setBusy(true);
    setFailed(false);
    try {
      await onAnswer(choiceId, note);
    } catch {
      if (current.current !== token) return;
      current.current = null;
      setBusy(false);
      setFailed(true);
    }
  };
  /** Lets go of a held answer once what it answered has settled. */
  const release = React.useCallback(() => {
    current.current = null;
    setBusy(false);
  }, []);
  return { busy, failed, run, release };
}

const FAILED = "Couldn't send your answer. Try again.";
const SETTLE = "animate-in fade-in-0 duration-state ease-enter";

/** Props accepted by `RequestLine`. */
export interface RequestLineProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  /** The settled request. */
  data: RequestData;
  /** Removes the permission the answer made; shown only when the answer is undoable. @default undefined */
  onUndo?: () => void;
}

/** The words a settled request reads as, and the glyph before them. */
function settledWords(data: RequestData): {
  status: "done" | "skipped" | null;
  words: string;
} {
  if (data.state === "refused")
    return {
      status: "skipped",
      words: `Didn't ${lowerFirst(data.title)}${data.refusal ? `: ${data.refusal.words}` : ""}`,
    };
  if (data.state === "withdrawn")
    return { status: null, words: `No longer needed · ${data.title}` };
  if (data.state === "expired")
    return { status: null, words: `Not answered in time · ${data.title}` };
  const choiceId = data.answer?.choiceId;
  if (choiceId === "decline")
    return { status: "skipped", words: `Declined · ${data.title}` };
  if (choiceId?.startsWith("always:")) {
    const choice = data.offer.choices.find((c) => c.id === choiceId);
    const scope = choice && "scope" in choice ? ` ${choice.scope.label}` : "";
    return { status: "done", words: `Always allowed${scope} · ${data.title}` };
  }
  return { status: "done", words: `Allowed once · ${data.title}` };
}

/**
 * A settled request as one muted line in the turn's log: "✓ Allowed once · Email sm@vegastack.com
 * Undo ›", "⊘ Didn't share … : <why>. Ask an admin ›". The ✓ is primary (COL-25); a refusal is
 * the muted ⊘ with its words, never red.
 *
 * @example
 * <RequestLine data={answeredRequest} onUndo={() => removeAlways(answeredRequest.interactionId)} />
 */
function RequestLine({ data, onUndo, className, ...props }: RequestLineProps) {
  const { status, words } = settledWords(data);
  const by =
    data.answer && data.state === "answered" && data.answer.byName !== "you"
      ? ` · by ${data.answer.byName}`
      : "";
  return (
    <div
      data-slot="request-line"
      data-state={data.state}
      className={cn(
        "flex min-h-7 min-w-0 items-start gap-2 px-2 py-1 text-sm text-muted-foreground",
        className,
      )}
      {...props}
    >
      {status ? (
        <StatusGlyph status={status} label={null} className="mt-0.5" />
      ) : null}
      <span className="min-w-0 flex-1">
        <span data-slot="request-line-words">
          {words}
          {by}
          {data.state === "refused" ? "." : ""}
        </span>
        {data.state === "refused" && data.refusal?.way ? (
          <>
            {" "}
            <a
              href={data.refusal.way.href}
              className="whitespace-nowrap text-foreground underline-offset-4 hover:underline"
            >
              {data.refusal.way.label} ›
            </a>
          </>
        ) : null}
      </span>
      {data.state === "answered" && data.answer?.undoable && onUndo ? (
        <Button
          size="xs"
          variant="ghost"
          className="shrink-0 text-muted-foreground"
          onClick={onUndo}
        >
          Undo ›
        </Button>
      ) : null}
    </div>
  );
}

/** Props accepted by `ChatRequestCard`. */
export interface ChatRequestCardProps extends Omit<
  React.ComponentProps<"div">,
  "children" | "title"
> {
  /** The request, as the chat contract carries it. */
  data: RequestData;
  /** Answers with one of `data.offer.choices`' ids; a decline may carry a note. */
  onAnswer: (choiceId: string, note?: string) => Promise<void>;
  /** The agent asking, for the title ("William needs your OK"). */
  agent: { name: string };
  /** Removes the permission an answered request made (passed to its `RequestLine`). @default undefined */
  onUndo?: () => void;
}

/**
 * An agent asking a person's OK, drawn from the server's stored offer: Allow once (primary), one
 * "Always allow ▾" menu with each scope, and Decline as text with an optional note. When Always
 * can't be offered the card says why in a muted footnote. While an answer is in flight the buttons
 * hold (`aria-busy`); once settled the card becomes a `RequestLine`.
 *
 * @example
 * <ChatRequestCard agent={{ name: "William" }} data={request} onAnswer={(id, note) => answer(request.interactionId, id, note)} />
 */
function ChatRequestCard({
  data,
  onUndo,
  className,
  ...props
}: ChatRequestCardProps) {
  if (data.state !== "open") {
    const { onAnswer: _answer, agent: _agent, ...rest } = props;
    return (
      <RequestLine
        data={data}
        onUndo={onUndo}
        className={cn(SETTLE, className)}
        {...rest}
      />
    );
  }
  // A different request starts with its buttons free.
  return (
    <OpenRequestCard
      key={data.interactionId}
      data={data}
      className={className}
      {...props}
    />
  );
}

function OpenRequestCard({
  data,
  onAnswer,
  agent,
  className,
  ...props
}: Omit<ChatRequestCardProps, "onUndo">) {
  const { busy, failed, run } = useAnswer(onAnswer);
  return (
    <div
      data-slot="chat-request-card"
      data-state={data.state}
      aria-busy={busy || undefined}
      className={cn("min-w-0", className)}
      {...props}
    >
      <ChatCard
        title={`${agent.name} needs your OK`}
        actions={
          <RequestChoices
            choices={data.offer.choices}
            onAnswer={run}
            busy={busy}
          />
        }
        footnote={
          failed
            ? FAILED
            : data.offer.noAlways
              ? data.offer.noAlways.words
              : undefined
        }
      >
        <RequestSubject data={data} showFrom />
      </ChatCard>
    </div>
  );
}

/** Props accepted by `RequestBundleCard`. */
export interface RequestBundleCardProps extends Omit<
  React.ComponentProps<"div">,
  "children" | "title"
> {
  /** The requests asked together (Subagents asking at once), in the order they were asked. */
  items: RequestData[];
  /** Answers every open item at once. */
  onAnswerAll: (choiceId: "once" | "always:sites" | "decline") => Promise<void>;
  /** Answers one item, from "Choose each"; a decline may carry a note. */
  onAnswer: (
    interactionId: string,
    choiceId: string,
    note?: string,
  ) => Promise<void>;
  /** The agent asking, for the title ("William needs 4 answers"). @default { name: "Your agent" } */
  agent?: { name: string };
}

const WEB_KIND = /web|site|url|open|fetch|browse/i;

/**
 * Several asks at once — usually Subagents opening sites in parallel — as one card: one row per
 * ask (subject · for "<Subagent>"), then Allow all once, Always allow these (only when every ask
 * offers an Always), Choose each › (each row gets its own buttons) and Decline. Settled asks
 * become `RequestLine`s; when none is open the card is gone.
 *
 * @example
 * <RequestBundleCard agent={{ name: "William" }} items={asks} onAnswerAll={answerAll} onAnswer={answerOne} />
 */
function RequestBundleCard({
  items,
  onAnswerAll,
  onAnswer,
  agent = { name: "Your agent" },
  className,
  ...props
}: RequestBundleCardProps) {
  const [each, setEach] = React.useState(false);
  const [rowsBusy, setRowsBusy] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const onRowBusy = React.useCallback((id: string, busy: boolean) => {
    setRowsBusy((now) => {
      if (now.has(id) === busy) return now;
      const next = new Set(now);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  // The asks an answer for all covered; it holds only while one of them is still open.
  const covered = React.useRef<ReadonlySet<string>>(new Set());
  const open = items.filter((item) => item.state === "open");
  const all = useAnswer((choiceId) => {
    covered.current = new Set(open.map((item) => item.interactionId));
    return onAnswerAll(choiceId as "once" | "always:sites" | "decline");
  });
  const allHeld =
    all.busy && open.some((item) => covered.current.has(item.interactionId));
  const { busy: allBusy, release } = all;
  React.useEffect(() => {
    if (allBusy && !allHeld) release();
  }, [allBusy, allHeld, release]);
  // A row's answer in flight holds the answers for all, and the other way round.
  const bulkHeld = allHeld || rowsBusy.size > 0;
  const settled = items.filter((item) => item.state !== "open");
  const offers = (id: "once" | "decline") =>
    open.every((item) => item.offer.choices.some((c) => c.id === id));
  const allAlways = open.every((item) =>
    item.offer.choices.some((c) => c.id.startsWith("always:")),
  );
  const sites = open.every((item) => WEB_KIND.test(item.kind));
  return (
    <div
      data-slot="request-bundle-card"
      aria-busy={allHeld || undefined}
      className={cn("flex min-w-0 flex-col gap-1", className)}
      {...props}
    >
      {settled.map((item) => (
        <RequestLine key={item.interactionId} data={item} className={SETTLE} />
      ))}
      {open.length > 0 ? (
        <ChatCard
          title={
            open.length === 1
              ? `${agent.name} needs your OK`
              : `${agent.name} needs ${open.length} answers`
          }
          footnote={all.failed ? FAILED : undefined}
          actions={
            each ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={bulkHeld}
                onClick={() => setEach(false)}
              >
                Answer all together
              </Button>
            ) : (
              <>
                {offers("once") ? (
                  <Button
                    size="sm"
                    disabled={bulkHeld}
                    onClick={() => void all.run("once")}
                  >
                    Allow all once
                  </Button>
                ) : null}
                {allAlways ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkHeld}
                    onClick={() => void all.run("always:sites")}
                  >
                    {sites ? "Always allow these sites" : "Always allow these"}
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={bulkHeld}
                  onClick={() => setEach(true)}
                >
                  Choose each
                  <ChevronRight
                    aria-hidden="true"
                    data-icon="inline-end"
                    strokeWidth={1.5}
                    className="rtl:rotate-180"
                  />
                </Button>
                {offers("decline") ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={bulkHeld}
                    className="text-muted-foreground"
                    onClick={() => void all.run("decline")}
                  >
                    Decline
                  </Button>
                ) : null}
              </>
            )
          }
        >
          <ul
            data-slot="request-bundle-items"
            className="flex min-w-0 flex-col divide-y divide-chat-hairline"
          >
            {open.map((item) => (
              <BundleRow
                key={item.interactionId}
                item={item}
                each={each}
                held={allHeld}
                onBusy={onRowBusy}
                onAnswer={onAnswer}
              />
            ))}
          </ul>
        </ChatCard>
      ) : null}
    </div>
  );
}

function BundleRow({
  item,
  each,
  held,
  onBusy,
  onAnswer,
}: {
  item: RequestData;
  each: boolean;
  held: boolean;
  onBusy: (interactionId: string, busy: boolean) => void;
  onAnswer: RequestBundleCardProps["onAnswer"];
}) {
  const { busy, failed, run } = useAnswer((choiceId, note) =>
    onAnswer(item.interactionId, choiceId, note),
  );
  React.useEffect(() => {
    onBusy(item.interactionId, busy);
    return () => onBusy(item.interactionId, false);
  }, [busy, item.interactionId, onBusy]);
  return (
    <li
      data-slot="request-bundle-item"
      aria-busy={busy || undefined}
      className="flex min-w-0 flex-col gap-2 py-2 first:pt-0 last:pb-0"
    >
      <RequestSubject data={item} showFrom />
      {each ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2 ps-6">
          <RequestChoices
            choices={item.offer.choices}
            onAnswer={run}
            busy={busy || held}
            size="xs"
          />
        </div>
      ) : null}
      {each && (failed || item.offer.noAlways) ? (
        <p className="ps-6 text-xs text-muted-foreground">
          {failed ? FAILED : item.offer.noAlways?.words}
        </p>
      ) : null}
    </li>
  );
}

export { ChatRequestCard, RequestBundleCard, RequestLine };
