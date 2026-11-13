// @vegastack request-card@0.77.1 sha256-q7gi2PqpLK4DIm4xtsY37zo5AJSEmTbiZiSIAX9/6gw=

"use client";

import * as React from "react";
import {
  ArrowRight,
  Ban,
  ChevronDown,
  CircleCheck,
  CircleSlash,
  CircleX,
  Clock,
  FileText,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { cn } from "@vegastack/design";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PersonAvatar,
  type Person,
  type PersonMark,
} from "@/components/ui/person-avatar";
import { Textarea } from "@/components/ui/textarea";
import { useAnnouncer } from "@/components/ui/use-announcer";

/* ------------------------------------------------------------------------------------------------
 * RequestCard — one card for every question an agent asks before it acts: "Inbox assistant wants
 * to post in #ops", why it asks, what it would send, and three answers — Allow once · Always allow
 * (a menu that widens one step) · Decline (with a note, or Never allow this). A hard-rule request
 * has two answers only. Several requests from one run read as one bundle. Once answered, the
 * buttons give way to one line in the same words on every channel ("✓ Always allowed by you ·
 * Revoke"). The props are data only — a `CardSpec` and a `CardState` the web, Slack and the phone
 * all draw from — plus callbacks; the host owns the request and passes its state back.
 *
 * `PermissionList` and `PermissionRow` are "What I've allowed": each standing answer with how often
 * it was used, and Revoke (or Undo for a Never).
 * ----------------------------------------------------------------------------------------------*/

/** What a place is: a Slack channel, a space, a site, an outside tool, a recipient… */
export type PlaceKind =
  | "slack_channel"
  | "slack_person"
  | "space"
  | "folder"
  | "table"
  | "record"
  | "site"
  | "outside_tool"
  | "outside_source"
  | "recipient"
  | "recipient_domain"
  | "audience"
  | "workflow_runs"
  | "chat";

/** Where an action lands: `{ kind: "slack_channel", id: "C123", label: "#ops" }`. */
export interface Place {
  /** What the place is. */
  kind: PlaceKind;
  /** Your stable id for it. */
  id: string;
  /** Its name as people read it: "#ops", "Ops / Reports". */
  label: string;
}

/** One way to say Always allow: the exact place, one step wider, or this chat only. */
export interface AlwaysOption {
  /** `exact` is the place asked about; `wider` one step out; `chat` ends with the chat. */
  scope: "exact" | "wider" | "chat";
  /** The place the permission covers. */
  place: Place;
  /** The answer in words: "Always allow in #ops", "Always allow in any Slack channel", "Allow for this chat". */
  label: string;
}

/** What the agent would do, shown under the reason: quoted text, recipients, records, a file, or a move. */
export type CardPreview =
  | {
      /** Text it would send or post, quoted. */
      kind: "quote";
      text: string;
    }
  | {
      /** People it would send to; count the rest in `more`. */
      kind: "recipients";
      items: string[];
      more?: number;
    }
  | {
      /** Records it touches (a move's linked items included); count the rest in `more`. */
      kind: "items";
      items: { title: string; place?: string | null }[];
      more?: number;
    }
  | {
      /** A file it would save, and where. */
      kind: "file";
      name: string;
      place?: string | null;
    }
  | {
      /** Something it would make visible more widely: from one place to another. */
      kind: "from_to";
      from: string;
      to: string;
    };

/** The agent that asks. */
export interface CardAgent {
  /** Your stable id for it. */
  id: string;
  /** Its name: "Inbox assistant". */
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

/** The answers a request offers. Allow once and Decline are always there. */
export interface CardAnswers {
  once: true;
  /** The Always allow options, narrowest first; `null` when Always isn't offered. */
  always: AlwaysOption[] | null;
  decline: true;
  /** Whether Decline offers "Never allow this". */
  never: boolean;
}

/**
 * The request, in words — the same JSON the web, Slack and the phone draw (`agent_requests.card`).
 * Times are rendered for the viewer before they get here.
 */
export interface CardSpec {
  /** The agent that asks. */
  agent: CardAgent;
  /** "Inbox assistant wants to post in #ops". */
  title: string;
  /** "It read an email from … in this run, so it checks with you first." */
  why: string | null;
  /** What it would do: quoted text, recipients, records, a file, from → to. */
  preview: CardPreview | null;
  /** "From the 09:46 run · asked 2 min ago". */
  from: string;
  /** The answers offered. */
  answers: CardAnswers;
  /** "Always also covers runs that read email. Undo any time in What I've allowed." */
  footnote: string | null;
  /** "You've allowed this 3 times. Always allow?" — shown above the buttons, Always first. */
  nudge: string | null;
  /** A hard-rule request: Allow once and Decline only. */
  hard: boolean;
}

/**
 * Where the request stands. `pending` shows the answers; the rest show one line. `expired` is an
 * attended request nobody answered in 7 days; `refused` is one a workspace rule turned down.
 */
export type CardState =
  | "pending"
  | "allowed_once"
  | "allowed_always"
  | "declined"
  | "never"
  | "skipped"
  | "withdrawn"
  | "cancelled"
  | "expired"
  | "refused";

/** Where the answer was given. */
export type AnsweredVia = "web" | "phone" | "slack";

/** One request in a bundle. */
export interface RequestCardBundleItem {
  /** What it would do: "post in #ops". */
  title: string;
  /** Where, when the title doesn't say: "Ops / Reports". */
  place: string;
}

/** Props for `RequestCard`. */
export interface RequestCardProps extends Omit<
  React.ComponentPropsWithRef<"section">,
  "children"
> {
  /** The request, in words. */
  spec: CardSpec;
  /** Where it stands. */
  state: CardState;
  /** Who answered: "you" or "Priya". @default null */
  answeredBy?: string | null;
  /** Where they answered: "from Slack", "from the phone", "on the web". @default null */
  answeredVia?: AnsweredVia | null;
  /** The settled line in place of the state's own words ("Already answered by Priya"). @default null */
  statusText?: string | null;
  /** An answer is on its way: the pressed button spins, the rest are disabled. @default false */
  busy?: boolean;
  /** An error under the card: "Couldn't answer. Try again." @default null */
  error?: string | null;
  /**
   * Several requests from one run: the card lists them and offers Allow all once · Always allow
   * these · Review each · Decline all. @default null
   */
  bundle?: { items: RequestCardBundleItem[] } | null;
  /**
   * The viewer may answer. Anyone else sees "Waiting for {waitingFor}'s answer".
   * @default true
   */
  canAnswer?: boolean;
  /** Who it waits for, when the viewer can't answer: "Manoj". @default null */
  waitingFor?: string | null;
  /** Allow once (a bundle: allow all once). @default undefined */
  onAllowOnce?: () => void;
  /** Always allow, with the option picked (a bundle: the exact option, for each). @default undefined */
  onAlways?: (option: AlwaysOption) => void;
  /** Decline, with the note when one was written (a bundle: decline all). @default undefined */
  onDecline?: (note?: string) => void;
  /** Never allow this. @default undefined */
  onNever?: () => void;
  /** Revoke an Always, or undo a Never. @default undefined */
  onRevoke?: () => void;
  /** Run a skipped step now. @default undefined */
  onDoItNow?: () => void;
  /** Answer a bundle's requests one by one. @default undefined */
  onReviewEach?: () => void;
  /** One row for Home and Inbox: the title, where it came from and the buttons. @default false */
  compact?: boolean;
}

const VIA: Record<AnsweredVia, string> = {
  web: "on the web",
  phone: "from the phone",
  slack: "from Slack",
};

function by(answeredBy: string | null | undefined): string {
  return answeredBy ? ` by ${answeredBy}` : "";
}

function via(answeredVia: AnsweredVia | null | undefined): string {
  return answeredVia ? ` ${VIA[answeredVia]}` : "";
}

type Settled = {
  text: string;
  icon: React.ReactNode;
  action?: "revoke" | "undo" | "do-it-now";
};

const ICON = "size-4 shrink-0";

/** The settled line, its icon and its one action, in the words every channel uses. */
function settled(
  state: CardState,
  answeredBy: string | null | undefined,
  answeredVia: AnsweredVia | null | undefined,
  waitingFor: string | null | undefined,
): Settled {
  const muted = (Icon: typeof Clock) => (
    <Icon aria-hidden className={cn(ICON, "text-muted-foreground")} />
  );
  const who = `${by(answeredBy)}${via(answeredVia)}`;
  switch (state) {
    case "allowed_once":
      return {
        text: `Allowed once${who}`,
        icon: <CircleCheck aria-hidden className={cn(ICON, "text-primary")} />,
      };
    case "allowed_always":
      return {
        text: `Always allowed${who}`,
        icon: <CircleCheck aria-hidden className={cn(ICON, "text-primary")} />,
        action: "revoke",
      };
    case "declined":
      return { text: `Declined${who}`, icon: muted(CircleX) };
    case "never":
      return {
        text: `Never: set${who}`,
        icon: muted(CircleSlash),
        action: "undo",
      };
    case "skipped":
      return {
        text: "Skipped: no answer in 24 h",
        icon: muted(Clock),
        action: "do-it-now",
      };
    case "withdrawn":
      return { text: "Withdrawn: a new message was sent", icon: muted(Ban) };
    case "cancelled":
      return { text: "Cancelled: the agent was archived", icon: muted(Ban) };
    case "expired":
      return { text: "Expired: no answer in 7 days", icon: muted(Clock) };
    case "refused":
      return {
        text: "Not allowed: a workspace rule blocks this",
        icon: muted(ShieldAlert),
      };
    default:
      return {
        text: waitingFor
          ? `Waiting for ${waitingFor}'s answer`
          : "Waiting for an answer",
        icon: muted(Clock),
      };
  }
}

const ACTION_LABEL = {
  revoke: "Revoke",
  undo: "Undo",
  "do-it-now": "Do it now",
} as const;

function agentPerson(agent: CardAgent): Person {
  return {
    id: agent.id,
    name: agent.name,
    image: agent.avatar,
    mark: agent.mark,
    hue: agent.hue,
    kind: "agent",
  };
}

function PreviewBlock({ preview }: { preview: CardPreview }) {
  switch (preview.kind) {
    case "quote":
      return (
        <blockquote
          data-slot="request-card-preview"
          data-kind="quote"
          className="rounded-lg bg-muted px-3 py-2 whitespace-pre-line wrap-anywhere"
        >
          “{preview.text}”
        </blockquote>
      );
    case "recipients": {
      const more = preview.more ?? 0;
      return (
        <p
          data-slot="request-card-preview"
          data-kind="recipients"
          className="wrap-anywhere text-muted-foreground"
        >
          To <span className="text-foreground">{preview.items.join(", ")}</span>
          {more > 0 ? ` and ${more} more` : null}
        </p>
      );
    }
    case "items": {
      const more = preview.more ?? 0;
      return (
        <div
          data-slot="request-card-preview"
          data-kind="items"
          className="flex min-w-0 flex-col gap-1.5"
        >
          <ul className="flex min-w-0 flex-col divide-y divide-border rounded-lg border border-border">
            {preview.items.map((item, i) => (
              <li
                key={`${item.title}-${i}`}
                className="flex min-h-9 min-w-0 items-center gap-2 px-3 py-1.5"
              >
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                {item.place ? (
                  <span className="max-w-1/2 shrink-0 truncate text-xs text-muted-foreground">
                    {item.place}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          {more > 0 ? (
            <p className="text-xs text-muted-foreground">and {more} more</p>
          ) : null}
        </div>
      );
    }
    case "file":
      return (
        <p
          data-slot="request-card-preview"
          data-kind="file"
          className="flex min-w-0 items-center gap-2 rounded-lg border border-border px-3 py-2"
        >
          <FileText
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground"
          />
          <span className="min-w-0 flex-1 truncate">{preview.name}</span>
          {preview.place ? (
            <span className="max-w-1/2 shrink-0 truncate text-xs text-muted-foreground">
              {preview.place}
            </span>
          ) : null}
        </p>
      );
    case "from_to":
      return (
        <p
          data-slot="request-card-preview"
          data-kind="from_to"
          className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border px-3 py-2"
        >
          <span className="min-w-0 wrap-anywhere">{preview.from}</span>
          <ArrowRight
            aria-label="to"
            className="size-4 shrink-0 text-muted-foreground"
          />
          <span className="min-w-0 wrap-anywhere">{preview.to}</span>
        </p>
      );
  }
}

type Pressed =
  "once" | "always" | "decline" | "never" | "review" | "action" | null;

/**
 * `RequestCard` — an agent asks before it acts, with the same card on every surface: who asks and
 * what, why, a preview, where it came from, and Allow once · Always allow ▾ · Decline ▾. Always
 * allow saves the exact place, or one step wider from its menu; Decline's menu writes a note or
 * says Never allow this. A hard-rule card has Allow once and Decline only, and a bundle answers a
 * run's requests together. Neither Allow nor Always is styled primary. Answered, the buttons give
 * way to one line, which is announced when it changes on screen.
 *
 * @example
 * <RequestCard
 *   spec={request.card}
 *   state={request.state}
 *   answeredBy={request.answeredBy}
 *   busy={pending}
 *   onAllowOnce={() => answer({ kind: "once" })}
 *   onAlways={(option) => answer({ kind: "always", scope: option.scope })}
 *   onDecline={(note) => answer({ kind: "decline", note })}
 *   onNever={() => answer({ kind: "never" })}
 *   onRevoke={() => revoke(request.permissionId)}
 * />
 */
export function RequestCard({
  spec,
  state,
  answeredBy = null,
  answeredVia = null,
  statusText = null,
  busy = false,
  error = null,
  bundle = null,
  canAnswer = true,
  waitingFor = null,
  onAllowOnce,
  onAlways,
  onDecline,
  onNever,
  onRevoke,
  onDoItNow,
  onReviewEach,
  compact = false,
  className,
  ...props
}: RequestCardProps) {
  const titleId = React.useId();
  const noteId = React.useId();
  const [pressed, setPressed] = React.useState<Pressed>(null);
  const [noting, setNoting] = React.useState(false);
  const [note, setNote] = React.useState("");
  const { announce, Announcer } = useAnnouncer();

  const pending = state === "pending";
  const answering = pending && canAnswer;
  const always =
    !spec.hard && spec.answers.always?.length ? spec.answers.always : null;
  const offersNever = !spec.hard && spec.answers.never && !!onNever;
  const isBundle = !!bundle && bundle.items.length > 0;
  const line = settled(state, answeredBy, answeredVia, waitingFor);
  const action =
    line.action === "revoke" || line.action === "undo"
      ? onRevoke
      : line.action === "do-it-now"
        ? onDoItNow
        : undefined;

  // Announce the settled line whenever it changes on screen (a new state, who answered, or the
  // host's own words) — never on first paint.
  const outcome = pending ? null : (statusText ?? line.text);
  const previous = React.useRef(outcome);
  React.useEffect(() => {
    if (previous.current === outcome) return;
    previous.current = outcome;
    if (outcome) {
      setNoting(false);
      announce(outcome);
    }
  }, [outcome, announce]);

  // Cancelling a note returns focus to Decline.
  const declineRef = React.useRef<HTMLButtonElement | null>(null);
  const [refocus, setRefocus] = React.useState(false);
  React.useEffect(() => {
    if (!refocus || noting) return;
    setRefocus(false);
    declineRef.current?.focus();
  }, [refocus, noting]);

  const press = (which: Exclude<Pressed, null>, run: () => void) => {
    if (busy) return;
    setPressed(which);
    run();
  };
  const loading = (which: Exclude<Pressed, null>) => busy && pressed === which;
  const size = compact ? "sm" : "default";
  // A compact row lines its body up under the title, past the avatar.
  const indent = compact ? "ps-8.5 @2xl/request-card:ps-0" : undefined;
  const full = compact ? "" : "w-full @md/request-card:w-auto";

  const allowOnce = onAllowOnce ? (
    <Button
      key="once"
      variant="secondary"
      size={size}
      aria-describedby={titleId}
      data-answer="once"
      loading={loading("once")}
      disabled={busy && pressed !== "once"}
      onClick={() => press("once", onAllowOnce)}
      className={full}
    >
      {isBundle ? "Allow all once" : "Allow once"}
    </Button>
  ) : null;

  const alwaysControl =
    always && onAlways ? (
      isBundle ? (
        <Button
          key="always"
          variant="outline"
          size={size}
          aria-describedby={titleId}
          data-answer="always"
          loading={loading("always")}
          disabled={busy && pressed !== "always"}
          onClick={() => press("always", () => onAlways(always[0]!))}
          className={full}
        >
          Always allow these
        </Button>
      ) : (
        <ButtonGroup
          key="always"
          data-answer="always"
          aria-label="Always allow"
          className={cn("min-w-0 max-w-full", full)}
        >
          <Button
            variant="outline"
            size={size}
            aria-describedby={titleId}
            loading={loading("always")}
            disabled={busy && pressed !== "always"}
            onClick={() => press("always", () => onAlways(always[0]!))}
            className="min-w-0 flex-1 @md/request-card:flex-initial"
          >
            <span className="min-w-0 truncate">{always[0]!.label}</span>
          </Button>
          {always.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size={compact ? "icon-sm" : "icon"}
                    aria-label="More ways to always allow"
                    disabled={busy}
                  />
                }
              >
                <ChevronDown aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="max-w-[var(--available-width)]"
              >
                <DropdownMenuGroup>
                  {always.map((option) => (
                    <DropdownMenuItem
                      key={`${option.scope}:${option.place.id}`}
                      data-scope={option.scope}
                      onClick={() => press("always", () => onAlways(option))}
                    >
                      <span className="min-w-0 wrap-anywhere">
                        {option.label}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </ButtonGroup>
      )
    ) : null;

  const declineButton = onDecline ? (
    <Button
      variant="outline"
      size={size}
      aria-describedby={titleId}
      ref={declineRef}
      loading={loading("decline") || loading("never")}
      disabled={busy && pressed !== "decline" && pressed !== "never"}
      onClick={() => press("decline", () => onDecline())}
      className={cn(
        spec.hard || isBundle
          ? full
          : "min-w-0 flex-1 @md/request-card:flex-initial",
      )}
    >
      {isBundle ? "Decline all" : "Decline"}
    </Button>
  ) : null;

  const declineControl = !declineButton ? null : spec.hard || isBundle ? (
    React.cloneElement(declineButton, {
      key: "decline",
      "data-answer": "decline",
    } as Record<string, unknown>)
  ) : (
    <ButtonGroup
      key="decline"
      data-answer="decline"
      aria-label="Decline"
      className={cn("min-w-0 max-w-full", full)}
    >
      {declineButton}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size={compact ? "icon-sm" : "icon"}
              aria-label="More ways to decline"
              disabled={busy}
            />
          }
        >
          <ChevronDown aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setNoting(true)}>
              Decline with a note…
            </DropdownMenuItem>
            {offersNever ? (
              <DropdownMenuItem
                data-answer="never"
                onClick={() => press("never", onNever!)}
              >
                Never allow this
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );

  const reviewEach =
    isBundle && onReviewEach ? (
      <Button
        key="review"
        variant="ghost"
        size={size}
        aria-describedby={titleId}
        data-answer="review"
        loading={loading("review")}
        disabled={busy && pressed !== "review"}
        onClick={() => press("review", onReviewEach)}
        className={full}
      >
        Review each
      </Button>
    ) : null;

  // The nudge puts Always first; otherwise Allow once leads.
  const buttons =
    spec.nudge && alwaysControl
      ? [alwaysControl, allowOnce, reviewEach, declineControl]
      : [allowOnce, alwaysControl, reviewEach, declineControl];

  const actions = answering ? (
    noting && onDecline ? (
      <div
        data-slot="request-card-note"
        className={cn(
          "flex min-w-0 flex-col gap-2",
          indent,
          compact && "@2xl/request-card:basis-full",
        )}
      >
        <Textarea
          id={noteId}
          aria-label="A note for the agent"
          placeholder="Tell the agent why, or what to do instead"
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
          disabled={busy}
          autoFocus
        />
        <div className="flex flex-col-reverse gap-2 @md/request-card:flex-row @md/request-card:justify-end">
          <Button
            variant="ghost"
            size={size}
            disabled={busy}
            onClick={() => {
              setNoting(false);
              setRefocus(true);
            }}
            className={full}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            size={size}
            aria-describedby={titleId}
            loading={loading("decline")}
            onClick={() =>
              press("decline", () => onDecline(note.trim() || undefined))
            }
            className={full}
          >
            Decline
          </Button>
        </div>
      </div>
    ) : (
      <div
        data-slot="request-card-actions"
        className={cn(
          "flex min-w-0 gap-2",
          compact
            ? "flex-row flex-wrap items-center"
            : "flex-col @md/request-card:flex-row @md/request-card:flex-wrap @md/request-card:items-center",
          indent,
        )}
      >
        {buttons}
      </div>
    )
  ) : (
    <p
      data-slot="request-card-status"
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1",
        indent,
      )}
    >
      {line.icon}
      <span className="min-w-0 wrap-anywhere">{statusText ?? line.text}</span>
      {line.action && action && !statusText ? (
        <>
          <span aria-hidden className="text-muted-foreground">
            ·
          </span>
          <Button
            variant="link"
            size="xs"
            data-answer="status-action"
            aria-describedby={titleId}
            loading={loading("action")}
            disabled={busy && pressed !== "action"}
            onClick={() => press("action", action)}
            className="-my-1 px-0 text-sm"
          >
            {ACTION_LABEL[line.action]}
          </Button>
        </>
      ) : null}
    </p>
  );

  const nudge =
    answering && spec.nudge && always && !compact ? (
      <p
        data-slot="request-card-nudge"
        className={cn(
          "flex min-w-0 items-start gap-1.5 rounded-md bg-info/10 px-2.5 py-1.5 text-xs text-info-text dark:bg-info/20",
        )}
      >
        <Sparkles aria-hidden className="mt-px size-3.5 shrink-0" />
        <span className="min-w-0">{spec.nudge}</span>
      </p>
    ) : null;

  const bundleList = isBundle ? (
    <ul
      data-slot="request-card-bundle"
      className={cn(
        "flex min-w-0 list-disc flex-col gap-1 ps-5 marker:text-muted-foreground",
        compact && "sr-only",
      )}
    >
      {bundle!.items.map((item, i) => (
        <li key={`${item.title}-${i}`} className="wrap-anywhere">
          {item.title}
          {item.place ? (
            <span className="text-muted-foreground"> · {item.place}</span>
          ) : null}
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <section
      data-slot="request-card"
      data-state={state}
      data-hard={spec.hard || undefined}
      data-bundle={isBundle || undefined}
      data-compact={compact || undefined}
      aria-labelledby={titleId}
      className={cn(
        "@container/request-card w-full min-w-0 text-sm text-card-foreground",
        compact ? "py-2" : "rounded-xl border border-border bg-card p-4",
        className,
      )}
      {...props}
    >
      <div
        data-slot="request-card-body"
        className={cn(
          "flex min-w-0 flex-col",
          compact
            ? "gap-2 @2xl/request-card:flex-row @2xl/request-card:flex-wrap @2xl/request-card:items-center @2xl/request-card:gap-x-4"
            : "gap-3",
        )}
      >
        <div
          data-slot="request-card-header"
          className={cn(
            "flex min-w-0 items-start gap-2.5",
            compact && "@2xl/request-card:flex-1",
          )}
        >
          <PersonAvatar
            person={agentPerson(spec.agent)}
            size={compact ? "sm" : "default"}
            aria-hidden
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p
              id={titleId}
              data-slot="request-card-title"
              className={cn(
                "font-medium wrap-anywhere",
                compact && "line-clamp-2",
              )}
            >
              {spec.title}
            </p>
            <p
              data-slot="request-card-from"
              className="text-xs text-muted-foreground wrap-anywhere"
            >
              {compact && isBundle
                ? `${bundle!.items.length} things · ${spec.from}`
                : spec.from}
            </p>
          </div>
          {spec.hard && !compact ? (
            <Badge variant="outline" className="shrink-0">
              Always asks
            </Badge>
          ) : null}
        </div>
        {bundleList}
        {!compact && spec.why ? (
          <p data-slot="request-card-why" className="text-muted-foreground">
            {spec.why}
          </p>
        ) : null}
        {!compact && spec.preview && !isBundle ? (
          <PreviewBlock preview={spec.preview} />
        ) : null}
        {nudge}
        {actions}
        {!compact && answering && spec.footnote && !noting ? (
          <p
            data-slot="request-card-footnote"
            className="text-xs text-muted-foreground"
          >
            {spec.footnote}
          </p>
        ) : null}
        {error ? (
          <p
            role="alert"
            className={cn(
              "text-xs text-destructive-text",
              indent,
              compact && "@2xl/request-card:basis-full",
            )}
          >
            {error}
          </p>
        ) : null}
      </div>
      <Announcer />
    </section>
  );
}

/* ------------------------------------------------------------------------------------------------
 * What I've allowed
 * ----------------------------------------------------------------------------------------------*/

/**
 * One standing answer, as "What I've allowed" shows it. Times are rendered for the viewer before
 * they get here.
 */
export interface PermissionView {
  /** Your stable id for it. */
  id: string;
  /** `allow` is an Always; `never` a standing no. */
  effect: "allow" | "never";
  /** What it allows, in words: "Post in #vegastack-agent-tests". */
  title: string;
  /** A muted note after it: "also after email". @default null */
  note?: string | null;
  /** The agent, in a list across agents. @default null */
  agent?: CardAgent | null;
  /** How many times it was used. @default 0 */
  uses?: number;
  /** When it was last used: "2 h ago". @default null */
  lastUsed?: string | null;
  /** When it was set: "set 10 Nov". @default null */
  setOn?: string | null;
  /** Why it's paused: "Paused by a rule", "Paused: Ravi is no longer a maintainer". @default null */
  paused?: string | null;
  /** A paused line the viewer can keep (its giver stopped maintaining the agent). @default false */
  confirmable?: boolean;
}

/** Props for `PermissionRow`. */
export interface PermissionRowProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /** The line. */
  permission: PermissionView;
  /** Revoke an Always or undo a Never; the button reads Revoke or Undo. @default undefined */
  onRevoke?: () => void;
  /** Keep a line paused because its giver stopped maintaining the agent. @default undefined */
  onConfirm?: () => void;
  /** An answer is on its way: the buttons are disabled. @default false */
  busy?: boolean;
}

function permissionMeta(p: PermissionView): string {
  if (p.effect === "never")
    return p.setOn ? `Set ${p.setOn.replace(/^set /i, "")}` : "";
  const uses = p.uses ?? 0;
  const used = uses === 0 ? "Not used yet" : `Used ${uses}×`;
  return p.lastUsed ? `${used} · last ${p.lastUsed}` : used;
}

/**
 * `PermissionRow` — one line of What I've allowed: what it allows (and for which agent), how often
 * it was used and when, why it's paused, and Revoke — or Undo for a Never, and Keep for a line
 * paused because its giver stopped maintaining the agent.
 *
 * @example
 * <PermissionRow
 *   permission={{ id: "p1", effect: "allow", title: "Post in #ops", uses: 14, lastUsed: "2 h ago" }}
 *   onRevoke={() => revoke("p1")}
 * />
 */
export function PermissionRow({
  permission: p,
  onRevoke,
  onConfirm,
  busy = false,
  className,
  ...props
}: PermissionRowProps) {
  const titleId = React.useId();
  const meta = permissionMeta(p);
  return (
    <div
      data-slot="permission-row"
      data-effect={p.effect}
      data-paused={p.paused ? true : undefined}
      className={cn(
        "flex min-h-12 min-w-0 items-center gap-3 px-3 py-2 text-sm",
        className,
      )}
      {...props}
    >
      {p.agent ? (
        <PersonAvatar
          person={agentPerson(p.agent)}
          size="xs"
          aria-hidden
          className="shrink-0"
        />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p id={titleId} className="min-w-0 wrap-anywhere">
          {p.agent ? (
            <span className="text-muted-foreground">{p.agent.name}: </span>
          ) : null}
          <span data-slot="permission-row-title">{p.title}</span>
          {p.note ? (
            <span className="text-muted-foreground"> ({p.note})</span>
          ) : null}
        </p>
        <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {meta ? (
            <span data-slot="permission-row-meta" className="tabular-nums">
              {meta}
            </span>
          ) : null}
          {p.paused ? (
            <Badge
              variant="warning"
              data-slot="permission-row-paused"
              className="h-auto max-w-full shrink py-0.5 text-start whitespace-normal"
            >
              {p.paused}
            </Badge>
          ) : null}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {p.confirmable && onConfirm ? (
          <Button
            variant="outline"
            size="sm"
            aria-describedby={titleId}
            disabled={busy}
            onClick={() => onConfirm()}
          >
            Keep
          </Button>
        ) : null}
        {onRevoke ? (
          <Button
            variant="ghost"
            size="sm"
            aria-describedby={titleId}
            disabled={busy}
            onClick={() => onRevoke()}
          >
            {p.effect === "never" ? "Undo" : "Revoke"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** Props for `PermissionList`. */
export interface PermissionListProps extends Omit<
  React.ComponentPropsWithRef<"section">,
  "children" | "title"
> {
  /** The group's heading: "Allowed" or "Never". */
  title: string;
  /** Its lines. */
  items: readonly PermissionView[];
  /** The line shown when there are none. @default "Nothing here yet." */
  empty?: string;
  /** Revoke (or undo) a line. @default undefined */
  onRevoke?: (id: string) => void;
  /** Keep a line paused because its giver stopped maintaining the agent. @default undefined */
  onConfirm?: (id: string) => void;
  /** The line whose answer is on its way. @default null */
  busyId?: string | null;
}

/**
 * `PermissionList` — a group of What I've allowed (Allowed or Never) as bordered rows under a small
 * heading, with its own empty line.
 *
 * @example
 * <PermissionList title="Allowed" items={allowed} onRevoke={revoke} />
 * <PermissionList title="Never" items={never} onRevoke={revoke} />
 */
export function PermissionList({
  title,
  items,
  empty = "Nothing here yet.",
  onRevoke,
  onConfirm,
  busyId = null,
  className,
  ...props
}: PermissionListProps) {
  const headingId = React.useId();
  return (
    <section
      data-slot="permission-list"
      aria-labelledby={headingId}
      className={cn("flex min-w-0 flex-col gap-2", className)}
      {...props}
    >
      <h3 id={headingId} className="text-xs font-medium text-muted-foreground">
        {title}
      </h3>
      {items.length === 0 ? (
        <p
          data-slot="permission-list-empty"
          className="rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted-foreground"
        >
          {empty}
        </p>
      ) : (
        <ul className="flex min-w-0 flex-col divide-y divide-border rounded-lg border border-border">
          {items.map((p) => (
            <li key={p.id} className="min-w-0">
              <PermissionRow
                permission={p}
                busy={busyId === p.id}
                onRevoke={onRevoke ? () => onRevoke(p.id) : undefined}
                onConfirm={onConfirm ? () => onConfirm(p.id) : undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
