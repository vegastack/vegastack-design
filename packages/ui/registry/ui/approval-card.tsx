// @vegastack approval-card@0.25.33 sha256-1Hy9Vb/804ENFQYDiHmWfXS87Wqd+qftNbf5s23UEfc=

"use client";

import * as React from "react";
import { Ban, CircleCheck, CircleX, Clock } from "lucide-react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  PersonAvatar,
  PersonName,
  type Person,
} from "@/components/ui/person-avatar";
import { RelativeTime } from "@/components/ui/relative-time";
import { useAnnouncer } from "@/components/ui/use-announcer";

/* ------------------------------------------------------------------------------------------------
 * ApprovalCard — a risky action an agent asked to take, waiting on the person it works for: who
 * asks (the agent's purple bot, "Claude Code via Manoj" and the "Agent" label), what it wants to
 * do in plain words, the records it touches (the first few, "and N more"), its reason, a
 * reassurance ("You can restore them from Trash for 30 days."), when it was asked and when it
 * expires, and one Approve / Decline for the whole request — all or nothing. Once decided, the
 * buttons give way to the outcome. The host owns the request and its state; a callback that
 * returns a promise keeps its button busy and, on rejection, shows the error.
 * ----------------------------------------------------------------------------------------------*/

/** Where an approval request stands. */
export type ApprovalCardStatus =
  | "pending"
  | "approving"
  | "approved"
  | "declined"
  | "expired"
  | "cancelled"
  | "already";

/** One record the request touches. */
export interface ApprovalCardItem {
  /** A stable key. */
  id: string;
  /** The record's icon (a task's status, a page's icon). @default undefined */
  icon?: React.ReactNode;
  /** The record's title. */
  title: React.ReactNode;
  /** Where the title links. @default undefined */
  href?: string | null;
  /** A muted note at the row's end — the record's space. @default undefined */
  meta?: React.ReactNode;
}

/** Props for `ApprovalCard`. */
export interface ApprovalCardProps extends Omit<
  React.ComponentPropsWithRef<"section">,
  "children"
> {
  /** Who asks — an agent (`kind: "agent"`, `via` its owner). */
  actor: Person;
  /** What it wants to do, after its name: "wants to move 2 tasks to Trash". */
  verb: React.ReactNode;
  /** The records it touches; list the first few and count the rest in `moreCount`. @default [] */
  items?: readonly ApprovalCardItem[];
  /** How many more records it touches than `items` lists: "and 3 more". @default 0 */
  moreCount?: number;
  /** The agent's own reason, quoted. @default undefined */
  reason?: React.ReactNode;
  /** What makes the action safe to approve: "You can restore them from Trash for 30 days." @default undefined */
  reassurance?: React.ReactNode;
  /** When it was asked. */
  requestedAt: Date | string | number;
  /** When the request lapses, shown while it waits: "Expires in 7 days". @default undefined */
  expiresAt?: Date | string | number | null;
  /**
   * Where it stands. `pending` shows Approve / Decline to whoever `canDecide`; `approving` keeps
   * Approve busy; the rest show the outcome in place of the buttons.
   * @default "pending"
   */
  status?: ApprovalCardStatus;
  /**
   * The outcome line in place of the default for `status` ("Approved by you · just now").
   * @default the status's own line
   */
  statusLine?: React.ReactNode;
  /** Approve the whole request; a promise keeps Approve busy. @default undefined */
  onApprove?: () => void | Promise<unknown>;
  /** Decline the whole request; a promise keeps Decline busy. @default undefined */
  onDecline?: () => void | Promise<unknown>;
  /**
   * The viewer may decide — the agent's owner. Anyone else sees "Waiting for Manoj's approval".
   * @default true
   */
  canDecide?: boolean;
  /** Pin the relative times' clock (docs, tests). @default undefined */
  now?: number;
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Couldn't answer the request. Try again.";
}

/** The outcome line and its icon for a decided (or someone else's) request. */
function outcome(
  status: ApprovalCardStatus,
  actor: Person,
): { text: string; icon: React.ReactNode } {
  const icon = "size-4 shrink-0";
  switch (status) {
    case "approved":
      return {
        text: "Approved",
        icon: <CircleCheck aria-hidden className={cn(icon, "text-success")} />,
      };
    case "declined":
      return {
        text: `Declined. ${actor.name} was told.`,
        icon: (
          <CircleX aria-hidden className={cn(icon, "text-muted-foreground")} />
        ),
      };
    case "expired":
      return {
        text: `Expired. ${actor.name} can ask again.`,
        icon: (
          <Clock aria-hidden className={cn(icon, "text-muted-foreground")} />
        ),
      };
    case "cancelled":
      return {
        text: "Cancelled",
        icon: <Ban aria-hidden className={cn(icon, "text-muted-foreground")} />,
      };
    case "already":
      return {
        text: "Already answered on another device",
        icon: (
          <CircleCheck
            aria-hidden
            className={cn(icon, "text-muted-foreground")}
          />
        ),
      };
    default:
      return {
        text: actor.via
          ? `Waiting for ${actor.via}'s approval`
          : "Waiting for approval",
        icon: (
          <Clock aria-hidden className={cn(icon, "text-muted-foreground")} />
        ),
      };
  }
}

/**
 * `ApprovalCard` — approve or decline a risky action an agent asked to take: the agent, the action
 * in words, the records it touches, its reason and a reassurance, then "Requested 2m ago · Expires
 * in 7 days" beside Decline and Approve. One decision covers the whole request. Decided, expired,
 * cancelled or answered elsewhere, the buttons give way to the outcome, which is announced. The
 * buttons stack full width, Approve on top, when the card is narrow.
 *
 * @example
 * <ApprovalCard
 *   actor={{ name: "Claude Code", kind: "agent", via: "Manoj" }}
 *   verb={<>wants to <strong>move 2 tasks to Trash</strong></>}
 *   items={[{ id: "12", title: "#12 Update launch spec", href: "/tasks/12", meta: "Marketing" }]}
 *   reason="These duplicate #10 and #11."
 *   reassurance="You can restore them from Trash for 30 days."
 *   requestedAt={request.createdAt}
 *   expiresAt={request.expiresAt}
 *   onApprove={() => approve(request.id)}
 *   onDecline={() => decline(request.id)}
 * />
 */
export function ApprovalCard({
  actor,
  verb,
  items = [],
  moreCount = 0,
  reason,
  reassurance,
  requestedAt,
  expiresAt,
  status = "pending",
  statusLine,
  onApprove,
  onDecline,
  canDecide = true,
  now,
  className,
  ...props
}: ApprovalCardProps) {
  const titleId = React.useId();
  const [busy, setBusy] = React.useState<"approve" | "decline" | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const { announce, Announcer } = useAnnouncer();

  const open = status === "pending" || status === "approving";
  const deciding = open && canDecide && (!!onApprove || !!onDecline);
  const approving = status === "approving" || busy === "approve";
  const result = outcome(open ? "pending" : status, actor);

  // Announce the outcome when it changes while the card is on screen — never on first paint.
  // What is announced is what the line renders — a `statusLine` node included.
  const line = React.useRef<HTMLSpanElement | null>(null);
  const previous = React.useRef(status);
  React.useEffect(() => {
    if (previous.current === status) return;
    previous.current = status;
    if (!open) announce(line.current?.textContent?.trim() || result.text);
  }, [status, open, result.text, announce]);

  const decide = async (
    which: "approve" | "decline",
    run: (() => void | Promise<unknown>) | undefined,
  ) => {
    if (!run || busy || status === "approving") return;
    setBusy(which);
    setError(null);
    try {
      await run();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      data-slot="approval-card"
      data-status={status}
      aria-labelledby={titleId}
      className={cn(
        "@container/approval-card flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 text-sm text-card-foreground",
        className,
      )}
      {...props}
    >
      <div
        data-slot="approval-card-header"
        className="flex min-w-0 items-start gap-2.5"
      >
        <PersonAvatar person={actor} size="default" aria-hidden />
        <p
          id={titleId}
          data-slot="approval-card-title"
          className="flex min-w-0 flex-col gap-0.5"
        >
          <PersonName person={actor} className="font-medium wrap-anywhere" />
          <span data-slot="approval-card-verb" className="wrap-anywhere">
            {verb}
          </span>
        </p>
      </div>
      {items.length > 0 ? (
        <div className="flex min-w-0 flex-col gap-1.5">
          <ul
            data-slot="approval-card-items"
            className="flex min-w-0 flex-col divide-y divide-border rounded-lg border border-border"
          >
            {items.map((item) => (
              <li
                key={item.id}
                data-slot="approval-card-item"
                className="flex min-h-9 min-w-0 items-center gap-2 px-3 py-1.5"
              >
                {item.icon ? (
                  <span
                    aria-hidden
                    className="flex shrink-0 text-muted-foreground [&_svg:not([class*='size-'])]:size-4"
                  >
                    {item.icon}
                  </span>
                ) : null}
                <span className="min-w-0 flex-1 truncate">
                  {item.href ? (
                    <a
                      href={item.href}
                      className="font-medium text-foreground hover:underline"
                    >
                      {item.title}
                    </a>
                  ) : (
                    item.title
                  )}
                </span>
                {item.meta != null ? (
                  <span className="max-w-1/2 shrink-0 truncate text-xs text-muted-foreground">
                    {item.meta}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          {moreCount > 0 ? (
            <p
              data-slot="approval-card-more"
              className="text-xs text-muted-foreground"
            >
              and {moreCount} more
            </p>
          ) : null}
        </div>
      ) : null}
      {reason != null && reason !== false ? (
        <blockquote
          data-slot="approval-card-reason"
          className="border-s-2 border-border ps-3 text-muted-foreground wrap-anywhere"
        >
          “{reason}”
        </blockquote>
      ) : null}
      {reassurance != null && reassurance !== false ? (
        <p
          data-slot="approval-card-reassurance"
          className="text-muted-foreground"
        >
          {reassurance}
        </p>
      ) : null}
      <div
        data-slot="approval-card-footer"
        className="flex flex-col-reverse gap-3 @sm/approval-card:flex-row @sm/approval-card:items-center @sm/approval-card:justify-between"
      >
        <p
          data-slot="approval-card-meta"
          className="min-w-0 text-xs text-muted-foreground"
        >
          Requested <RelativeTime date={requestedAt} now={now} />
          {open && expiresAt != null ? (
            <>
              {" "}
              <span aria-hidden>·</span> Expires{" "}
              <RelativeTime date={expiresAt} format="long" now={now} />
            </>
          ) : null}
        </p>
        {deciding ? (
          <div
            data-slot="approval-card-actions"
            className="flex flex-col-reverse gap-2 @sm/approval-card:flex-row @sm/approval-card:shrink-0"
          >
            {onDecline ? (
              <Button
                variant="outline"
                aria-describedby={titleId}
                loading={busy === "decline"}
                disabled={approving}
                onClick={() => void decide("decline", onDecline)}
                className="w-full @sm/approval-card:w-auto"
              >
                Decline
              </Button>
            ) : null}
            {onApprove ? (
              <Button
                aria-describedby={titleId}
                loading={approving}
                disabled={busy === "decline"}
                onClick={() => void decide("approve", onApprove)}
                className="w-full @sm/approval-card:w-auto"
              >
                Approve
              </Button>
            ) : null}
          </div>
        ) : (
          <p
            data-slot="approval-card-status"
            className="flex min-w-0 items-center gap-1.5"
          >
            {result.icon}
            <span ref={line} className="min-w-0">
              {statusLine ?? result.text}
            </span>
          </p>
        )}
      </div>
      {error ? (
        <p role="alert" className="text-xs text-destructive-text">
          {error}
        </p>
      ) : null}
      <Announcer />
    </section>
  );
}
