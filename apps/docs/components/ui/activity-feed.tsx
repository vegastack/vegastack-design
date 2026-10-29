// @vegastack activity-feed@0.25.104 sha256-chctR5gdqMPpCDfb+ME43sNEBj82kpCzUwhfZBN9baE=

"use client";

import * as React from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Bot,
  BotOff,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  CirclePlay,
  CirclePlus,
  CircleX,
  Clock,
  CornerDownRight,
  Flag,
  FolderInput,
  Link2,
  MessageSquare,
  Paperclip,
  Pencil,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  PersonHoverCard,
  type Person,
} from "@/components/ui/person-hover-card";
import {
  PersonAgentLabel,
  PersonAvatar,
  PersonName,
} from "@/components/ui/person-avatar";
import { RelativeTime } from "@/components/ui/relative-time";
import { PersonBadge } from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------------------------------------
 * ActivityFeed — a record's history, Linear style: comment threads (`CommentThread` cards) and
 * activity events ("Priya changed status from Open to Done · 2h") in one chronological list, with
 * an All / Comments / Activity filter and an Oldest / Newest first toggle. The parts are
 * presentational and data-agnostic — the host merges and pages the items:
 *
 * - `ActivityFeed`: the section — a heading with its count, the filter and the order toggle.
 * - `ActivityFeedItem`: one row of the list (an event, a group, a thread, a divider); J/K land on it.
 * - `ActivityEvent`: an event row — a 20px icon (or the actor's avatar), the actor (with a person
 *   hover card), the description with `ActivityValue`s, and the relative time.
 * - `ActivityEventGroup`: one actor's run of events as one line — a chain of one field's values
 *   ("moved it Todo → In progress → In review") or "made 3 changes", expandable.
 * - `groupActivityRuns`: splits a chronological list into those runs (one actor, a time window).
 * - `ActivityKindIcon`: the icon for a common event kind.
 * - `ActivityUnreadDivider`: the "New" line before the first unread item; reports when seen.
 * - `ActivityJumpToLatest`: a floating "Jump to latest" button while the feed's end is off screen.
 * - `useActivityFeedKeyboard`: J / K move between items, X toggles a thread, Esc clears.
 * - `ActivityFeedSkeleton`: the feed's loading shape.
 * ----------------------------------------------------------------------------------------------*/

/** What the feed shows. */
export type ActivityFilter = "all" | "comments" | "activity";

/** The order the feed shows its items in. */
export type ActivityOrder = "oldest" | "newest";

/** "1 comment", "3 comments". */
const commentCount = (n: number) => `${n} ${n === 1 ? "comment" : "comments"}`;

const FILTER_LABELS: Record<ActivityFilter, string> = {
  all: "All",
  comments: "Comments",
  activity: "Activity",
};

/* ------------------------------------------------------------------------------------------------
 * ActivityFeed
 * ----------------------------------------------------------------------------------------------*/

/** Props for `ActivityFeed`. */
export interface ActivityFeedProps extends Omit<
  React.ComponentPropsWithRef<"section">,
  "title"
> {
  /** The heading (an `h2`). @default "Activity" */
  title?: string;
  /** The number of comments, after the heading through `countLabel`; hidden at zero. @default undefined */
  count?: number;
  /**
   * The count's words, so the number says what it counts ("Activity · 2 comments").
   * @default (n) => "1 comment" | "n comments"
   */
  countLabel?: (count: number) => string;
  /** The filter shown; the filter menu shows when `onFilterChange` is set. @default "all" */
  filter?: ActivityFilter;
  /** Called from the filter menu. @default undefined */
  onFilterChange?: (filter: ActivityFilter) => void;
  /** The order shown; the toggle shows when `onOrderChange` is set. @default "oldest" */
  order?: ActivityOrder;
  /** Called from the Oldest / Newest first toggle. @default undefined */
  onOrderChange?: (order: ActivityOrder) => void;
  /** Dim the list while a new filter or order loads (the old items stay). @default false */
  pending?: boolean;
  /** Cursor pagination, using the collection paging contract. @default undefined */
  loadMore?: {
    hasMore: boolean;
    onLoadMore: () => Promise<void> | void;
    loading?: boolean;
    error?: boolean;
  };
  /** Filter, list generation and cursor identity; changes re-arm loading. @default undefined */
  paginationKey?: string | null;
  /** Progress copy. @default "Loading earlier…" */
  loadingMoreLabel?: string;
  /** Retry action copy. @default "Retry loading earlier" */
  retryMoreLabel?: string;
}

/**
 * `ActivityFeed` — a record's history section: "Activity" with an optional "n comments", the All /
 * Comments / Activity filter and the Oldest / Newest first toggle, then its children (an
 * `ActivityFeedList`, the composer, `ActivityJumpToLatest`).
 *
 * @example
 * <ActivityFeed filter={filter} onFilterChange={setFilter} order={order} onOrderChange={setOrder}>
 *   <ActivityFeedList>{items}</ActivityFeedList>
 *   <CommentComposer onSubmit={post} />
 * </ActivityFeed>
 */
export function ActivityFeed({
  title = "Activity",
  count,
  countLabel = commentCount,
  filter = "all",
  onFilterChange,
  order = "oldest",
  onOrderChange,
  pending = false,
  loadMore,
  paginationKey,
  loadingMoreLabel = "Loading earlier…",
  retryMoreLabel = "Retry loading earlier",
  ref,
  className,
  children,
  ...props
}: ActivityFeedProps) {
  const {
    hasMore = false,
    onLoadMore,
    loading: loadingMore = false,
    error: loadMoreError = false,
  } = loadMore ?? {};
  const headingId = React.useId();
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const edgeRef = React.useRef<HTMLDivElement | null>(null);
  const requested = React.useRef<{ key: typeof paginationKey } | null>(null);
  const [failedPage, setFailedPage] = React.useState<{
    key: typeof paginationKey;
  } | null>(null);
  const automaticError =
    failedPage !== null && failedPage.key === paginationKey;
  type PageRequest = { key: typeof paginationKey; token: symbol };
  const [activeRequest, setActiveRequest] = React.useState<PageRequest | null>(
    null,
  );
  const automaticLoading =
    activeRequest !== null && activeRequest.key === paginationKey;
  const [hasScrolled, setHasScrolled] = React.useState(false);
  const running = React.useRef<PageRequest | null>(null);
  const captureCleanup = React.useRef<(() => void) | undefined>(undefined);
  const anchor = React.useRef<{
    node: HTMLElement;
    top: number;
    key: typeof paginationKey;
    order: ActivityOrder;
    ids: string[];
  } | null>(null);
  const attach = React.useMemo(
    () => mergeRefs<HTMLElement>(sectionRef, ref),
    [ref],
  );
  const load = React.useCallback(
    async (retry = false) => {
      if (
        !hasMore ||
        !onLoadMore ||
        pending ||
        loadingMore ||
        (running.current?.key === paginationKey && running.current !== null) ||
        (!retry &&
          (loadMoreError ||
            automaticError ||
            (requested.current && requested.current.key === paginationKey)))
      )
        return;
      requested.current = { key: paginationKey };
      setFailedPage(null);
      const request = { key: paginationKey, token: Symbol() };
      setActiveRequest(request);
      running.current = request;
      const section = sectionRef.current;
      captureCleanup.current?.();
      captureCleanup.current = undefined;
      let stopCapturing: (() => void) | undefined;
      anchor.current = null;
      if (hasScrolled && section) {
        const parent = scrollParent(section);
        const top =
          parent instanceof Window ? 0 : parent.getBoundingClientRect().top;
        const bottom =
          parent instanceof Window
            ? parent.innerHeight
            : parent.getBoundingClientRect().bottom;
        const visible = (node: HTMLElement) => {
          const rect = node.getBoundingClientRect();
          return rect.bottom > top && rect.top < bottom;
        };
        const capture = () => {
          anchor.current = null;
          const item = Array.from(
            section.querySelectorAll<HTMLElement>(
              '[data-slot="activity-feed-item"]:not([data-kind="divider"])',
            ),
          ).find(visible);
          const node = item
            ? (Array.from(
                item.querySelectorAll<HTMLElement>(
                  '[data-slot="activity-change"][data-activity-id]',
                ),
              ).find(visible) ?? item)
            : null;
          if (node)
            anchor.current = {
              node,
              top: node.getBoundingClientRect().top,
              key: paginationKey,
              order,
              ids: anchorIds(node),
            };
        };
        capture();
        const trackReadingPosition = () => {
          if (
            running.current === request &&
            captureCleanup.current === stopCapturing
          )
            capture();
        };
        parent.addEventListener("scroll", trackReadingPosition, {
          passive: true,
        });
        stopCapturing = () =>
          parent.removeEventListener("scroll", trackReadingPosition);
        captureCleanup.current = stopCapturing;
      }
      try {
        await onLoadMore();
      } catch {
        if (running.current === request) setFailedPage({ key: paginationKey });
      } finally {
        stopCapturing?.();
        if (captureCleanup.current === stopCapturing)
          captureCleanup.current = undefined;
        if (running.current === request) running.current = null;
        setActiveRequest((current) =>
          current?.token === request.token ? null : current,
        );
      }
    },
    [
      hasMore,
      onLoadMore,
      pending,
      loadingMore,
      loadMoreError,
      automaticError,
      paginationKey,
      order,
      hasScrolled,
    ],
  );
  React.useLayoutEffect(() => {
    const saved = anchor.current;
    if (!saved || saved.key === paginationKey) return;
    anchor.current = null;
    if (saved.order !== order) return;
    // A run's summary carries every event it stands for, so a page that joins the run (and changes
    // its first event) still finds the line the reader was on.
    const node = saved.node.isConnected
      ? saved.node
      : saved.ids.length
        ? Array.from(
            sectionRef.current?.querySelectorAll<HTMLElement>(
              '[data-slot="activity-change"][data-activity-id]',
            ) ?? [],
          ).find((change) =>
            anchorIds(change).some((id) => saved.ids.includes(id)),
          )
        : null;
    if (!node) return;
    const delta = node.getBoundingClientRect().top - saved.top;
    if (delta) scrollParent(node).scrollBy({ top: delta, behavior: "instant" });
  }, [paginationKey, order]);
  React.useLayoutEffect(
    () => () => {
      captureCleanup.current?.();
      captureCleanup.current = undefined;
    },
    [paginationKey, order],
  );
  React.useEffect(() => {
    if (!sectionRef.current) return;
    const parent = scrollParent(sectionRef.current);
    const arm = () => setHasScrolled(true);
    if (parent instanceof Window ? parent.scrollY > 0 : parent.scrollTop > 0)
      arm();
    parent.addEventListener("scroll", arm, { passive: true });
    return () => parent.removeEventListener("scroll", arm);
  }, []);
  React.useEffect(() => {
    if (
      !hasMore ||
      !onLoadMore ||
      pending ||
      loadingMore ||
      automaticLoading ||
      loadMoreError ||
      automaticError ||
      !edgeRef.current
    )
      return;
    // Fill a short page without scrolling the task header away at mount.
    const parent = scrollParent(edgeRef.current);
    const scrollable =
      parent instanceof Window
        ? document.documentElement.scrollHeight > parent.innerHeight
        : parent.scrollHeight > parent.clientHeight;
    if (!hasScrolled && scrollable) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) void load();
    });
    observer.observe(edgeRef.current);
    return () => observer.disconnect();
  }, [
    hasMore,
    onLoadMore,
    pending,
    loadingMore,
    automaticLoading,
    loadMoreError,
    automaticError,
    hasScrolled,
    load,
  ]);
  const edge =
    hasMore && onLoadMore ? (
      <div
        ref={edgeRef}
        data-slot="activity-feed-more"
        aria-busy={loadingMore || automaticLoading || undefined}
        className="flex min-h-8 items-center justify-center text-xs text-muted-foreground"
      >
        {loadingMore || automaticLoading ? (
          // Skeleton event rows in the feed's own shape; the label is for screen readers only.
          <div
            data-slot="activity-feed-more-skeleton"
            className="flex w-full flex-col gap-3 py-1"
          >
            <span className="sr-only">{loadingMoreLabel}</span>
            {["w-48", "w-36", "w-56"].map((width) => (
              <div key={width} aria-hidden className="flex items-center gap-2">
                <Skeleton className="size-3.5 shrink-0 rounded-full" />
                <Skeleton className={cn("h-3", width)} />
              </div>
            ))}
          </div>
        ) : loadMoreError || automaticError ? (
          <Button variant="ghost" size="sm" onClick={() => void load(true)}>
            {retryMoreLabel}
          </Button>
        ) : null}
      </div>
    ) : null;
  return (
    <section
      ref={attach}
      data-slot="activity-feed"
      data-pending={pending ? "" : undefined}
      aria-labelledby={headingId}
      aria-busy={pending || undefined}
      className={cn(
        "flex min-w-0 flex-col gap-3 [&>[data-slot=activity-feed-list]]:transition-opacity data-pending:[&>[data-slot=activity-feed-list]]:opacity-50",
        className,
      )}
      {...props}
    >
      <div
        data-slot="activity-feed-header"
        // At a narrow width the filter and order controls wrap under the heading, kept at the end.
        className="flex min-h-8 flex-wrap items-center justify-between gap-x-2 gap-y-1"
      >
        <h2
          id={headingId}
          className="flex items-center gap-2 text-base font-medium"
        >
          {title}
          {/* A space keeps the name "Activity 3 comments", not "Activity3 comments". */}{" "}
          {count ? (
            <span
              data-slot="activity-feed-count"
              className="font-normal whitespace-nowrap text-muted-foreground tabular-nums"
            >
              {countLabel(count)}
            </span>
          ) : null}
        </h2>
        <div className="-me-2 ms-auto flex items-center gap-1">
          {onFilterChange ? (
            <Select
              value={filter}
              onValueChange={(value) => onFilterChange(value as ActivityFilter)}
              items={FILTER_LABELS}
            >
              <SelectTrigger
                size="sm"
                variant="ghost"
                aria-label="Show"
                data-slot="activity-feed-filter"
                className="text-muted-foreground"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {(Object.keys(FILTER_LABELS) as ActivityFilter[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {FILTER_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {onOrderChange ? (
            <Button
              variant="ghost"
              size="sm"
              data-slot="activity-feed-order"
              className="text-muted-foreground"
              onClick={() =>
                onOrderChange(order === "newest" ? "oldest" : "newest")
              }
            >
              <ArrowUpDown aria-hidden />
              {order === "newest" ? "Newest first" : "Oldest first"}
            </Button>
          ) : null}
        </div>
      </div>
      {order === "oldest" ? edge : null}
      {children}
      {order === "newest" ? edge : null}
    </section>
  );
}

/** `ActivityFeedList` — the feed's list (`<ol>`): events sit 4px apart, threads 12px. @example <ActivityFeedList>{items}</ActivityFeedList> */
export function ActivityFeedList({
  className,
  ...props
}: React.ComponentPropsWithRef<"ol">) {
  return (
    <ol
      data-slot="activity-feed-list"
      aria-label="Activity"
      className={cn("flex min-w-0 list-none flex-col", className)}
      {...props}
    />
  );
}

/** Props for `ActivityFeedItem`. */
export interface ActivityFeedItemProps extends React.ComponentPropsWithRef<"li"> {
  /**
   * What the row holds — its spacing follows: `event` rows sit 4px apart, a `thread` card or a
   * `divider` keeps 12px around it.
   * @default "event"
   */
  kind?: "event" | "thread" | "divider";
}

/**
 * `ActivityFeedItem` — one row of the feed. `useActivityFeedKeyboard` moves between these and
 * tints the one it lands on.
 *
 * @example
 * <ActivityFeedItem kind="thread"><CommentThread thread={t} /></ActivityFeedItem>
 */
export function ActivityFeedItem({
  kind = "event",
  className,
  ...props
}: ActivityFeedItemProps) {
  return (
    <li
      data-slot="activity-feed-item"
      data-kind={kind}
      className={cn(
        "min-w-0 scroll-mt-24 rounded-lg transition-colors data-focused:bg-accent/60",
        // 4px between events; 12px around a thread or a divider (the larger gap wins).
        kind === "event" ? "py-0.5" : "py-1.5 [&+[data-kind=event]]:mt-1",
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------------------------------------
 * ActivityEvent
 * ----------------------------------------------------------------------------------------------*/

/**
 * Common event kinds `ActivityKindIcon` draws. The agent kinds: `delegated` / `undelegated` (a
 * member hands a record to their agent, or takes it back), the agent's own run — `agent-queued`,
 * `agent-working`, `agent-needs-you`, `agent-done`, `agent-failed` — and `agent-step`, one
 * server-written step of a run ("Updated the description").
 */
export type ActivityKind =
  | "created"
  | "edited"
  | "renamed"
  | "status"
  | "priority"
  | "assigned"
  | "unassigned"
  | "due"
  | "moved"
  | "file-added"
  | "file-removed"
  | "linked"
  | "unlinked"
  | "commented"
  | "archived"
  | "restored"
  | "deleted"
  | "approved"
  | "rejected"
  | "requested"
  | "delegated"
  | "undelegated"
  | "agent-queued"
  | "agent-working"
  | "agent-needs-you"
  | "agent-done"
  | "agent-failed"
  | "agent-step";

const KIND_ICONS: Record<
  ActivityKind,
  React.ComponentType<{ className?: string }>
> = {
  created: CirclePlus,
  edited: Pencil,
  renamed: Pencil,
  status: CheckCircle2,
  priority: Flag,
  assigned: UserPlus,
  unassigned: UserMinus,
  due: Calendar,
  moved: FolderInput,
  "file-added": Paperclip,
  "file-removed": Paperclip,
  linked: Link2,
  unlinked: Link2,
  commented: MessageSquare,
  archived: Archive,
  restored: ArchiveRestore,
  deleted: Trash2,
  approved: CircleCheck,
  rejected: CircleX,
  requested: Clock,
  delegated: Bot,
  undelegated: BotOff,
  "agent-queued": Clock,
  // Started, not spinning: a history line never stops loading.
  "agent-working": CirclePlay,
  "agent-needs-you": CircleAlert,
  "agent-done": CircleCheck,
  "agent-failed": CircleX,
  "agent-step": CornerDownRight,
};

/** Semantic kinds keep their colour (an agent run's in its status tone); the rest are muted. */
const KIND_TONES: Partial<Record<ActivityKind, string>> = {
  approved: "text-success",
  rejected: "text-destructive",
  requested: "text-warning",
  delegated: "text-tag-purple-text",
  "agent-working": "text-info",
  "agent-needs-you": "text-warning",
  "agent-done": "text-success",
  "agent-failed": "text-destructive",
};

/**
 * `ActivityKindIcon` — the 14px icon for a common event kind (muted; approvals keep their
 * colour). Pass a `StatusIcon` or `PriorityIcon` to `ActivityEvent` instead when the value has one.
 *
 * @example
 * <ActivityEvent icon={<ActivityKindIcon kind="assigned" />} … />
 */
export function ActivityKindIcon({
  kind,
  className,
}: {
  /** The event kind. */
  kind: ActivityKind;
  /** Classes for the icon. @default undefined */
  className?: string;
}) {
  const Icon = KIND_ICONS[kind] ?? CirclePlus;
  return (
    <Icon
      aria-hidden
      data-slot="activity-kind-icon"
      className={cn(
        "size-3.5 shrink-0",
        KIND_TONES[kind] ?? "text-muted-foreground",
        className,
      )}
    />
  );
}

/**
 * The field an event changed, from one value to another — what lets a run of changes to one field
 * read as one chain ("moved it Todo → In progress → In review").
 */
export interface ActivityChange {
  /** The field's stable key ("status"); a run whose events all change it reads as a chain. */
  field: string;
  /** The chain's words before the values ("moved it"). @default "changed <field>" */
  verb?: React.ReactNode;
  /** The value before. @default undefined */
  from?: React.ReactNode;
  /** The value after. */
  to: React.ReactNode;
}

/** Props for `ActivityEvent`. */
export interface ActivityEventProps {
  /** Stable event identity for preserving position across cursor-page joins. @default undefined */
  id?: string;
  /**
   * The field this event changed, for `ActivityEventGroup`'s run summary; the event alone still
   * reads its `children`. @default undefined
   */
  change?: ActivityChange;
  /** Who did it; `null` for the system. A `badge` on the person ("Inactive") follows the name. */
  actor: Person | null;
  /**
   * @deprecated Give the actor `kind: "agent"` (and `via`) instead; kept for one release. The
   * actor is an agent: read as if `actor.kind` were `"agent"`. @default false
   */
  agent?: boolean;
  /**
   * The 20px node before the text — an `ActivityKindIcon`, a `StatusIcon`, a `PriorityIcon`.
   * `"avatar"` draws the actor's avatar (an assignee change, say). @default a muted dot
   */
  icon?: React.ReactNode | "avatar";
  /** What happened, after the actor's name — plain words with `ActivityValue`s. */
  children: React.ReactNode;
  /** When it happened. */
  date: Date | string | number;
  /** Pin the clock (docs, tests). @default undefined */
  now?: number;
  /** Classes for the row. @default undefined */
  className?: string;
}

/**
 * `ActivityEvent` — one event: the icon (or the actor's avatar) in the comments' 20px avatar
 * column, then "Actor did something · 2h" in muted 12px text. The actor opens a person hover
 * card, and the actor's `badge` ("Inactive") follows the name; the time shows the exact date on hover.
 *
 * @example
 * <ActivityEvent actor={priya} icon={<StatusIcon status="done" size="xs" />} date={at}>
 *   changed status from <ActivityValue>Open</ActivityValue> to <ActivityValue>Done</ActivityValue>
 * </ActivityEvent>
 */
export function ActivityEvent({
  id,
  actor,
  agent: agentFlag = false,
  icon,
  children,
  date,
  now,
  className,
}: ActivityEventProps) {
  // An agent is its actor's `kind`; the `agent` flag is the deprecated spelling of the same.
  const agent = agentFlag || actor?.kind === "agent";
  const who: Person | null =
    agent && actor ? { ...actor, kind: "agent" } : actor;
  return (
    <div
      data-slot="activity-event"
      data-activity-id={id}
      data-agent={agent ? "" : undefined}
      // 16px in, like a comment card's rows, so the icon sits in the avatars' column.
      className={cn(
        "flex min-h-8 min-w-0 items-start gap-2 break-words px-4",
        className,
      )}
    >
      <span
        aria-hidden
        data-slot="activity-event-icon"
        className="flex h-8 w-5 shrink-0 items-center justify-center"
      >
        {icon === "avatar" && who ? (
          <PersonAvatar person={who} className="data-[size=sm]:size-4" />
        ) : icon && icon !== "avatar" ? (
          icon
        ) : (
          <span className="size-1.5 rounded-full bg-muted-foreground/50" />
        )}
      </span>
      <p className="min-w-0 flex-1 py-1 text-xs/6 text-muted-foreground">
        {who ? (
          <PersonHoverCard person={who} trigger="name">
            <PersonName person={who} agentLabel={false} />
          </PersonHoverCard>
        ) : (
          <span className="font-medium text-foreground">System</span>
        )}{" "}
        {actor?.badge != null && actor.badge !== false ? (
          <>
            <PersonBadge badge={actor.badge} />{" "}
          </>
        ) : null}
        {agent ? (
          <>
            <PersonAgentLabel />{" "}
          </>
        ) : null}
        {children} <span aria-hidden>·</span>{" "}
        <RelativeTime date={date} now={now} />
      </p>
    </div>
  );
}

/** `ActivityValue` — a value inside an event's sentence ("Done", "Kavya Nair"), in the foreground colour. @example <ActivityValue>Done</ActivityValue> */
export function ActivityValue({
  className,
  ...props
}: React.ComponentPropsWithRef<"span">) {
  return (
    <span
      data-slot="activity-value"
      className={cn("font-medium text-foreground", className)}
      {...props}
    />
  );
}

/** Props for `ActivityEventGroup`. */
export interface ActivityEventGroupProps {
  /**
   * One run of events, in chronological order — one actor, close together (`groupActivityRuns`
   * finds them). It reads as one line with the latest time: a run that changes one `change.field`
   * is a chain ("moved it Todo → In progress → In review"); other runs list every change joined by
   * "; ", or — from `summarizeAt` changes — read "made 3 changes" and expand to list them.
   * @default undefined
   */
  events?: readonly ActivityEventProps[];
  /**
   * The words for a run of different changes, after the actor ("updated the brief"), instead of
   * `changesLabel`; it still expands to list them. Return `null` for the default.
   * @default undefined
   */
  summarizeRun?: (events: readonly ActivityEventProps[]) => React.ReactNode;
  /**
   * Fold a run of different changes this long or longer (at least 2) into one expandable line
   * ("made 3 changes"); unset, every change stays listed. 3 is the house setting.
   * @default undefined
   */
  summarizeAt?: number;
  /**
   * The folded line's words.
   * @default (n) => "made n changes"
   */
  changesLabel?: (count: number) => string;
  /** Event rows, when not using `events`. @default undefined */
  children?: React.ReactNode;
  /** Events shown while folded (the `children` form). @default 1 */
  visible?: number;
  /** Start unfolded. @default false */
  defaultOpen?: boolean;
  /** Classes for the group. @default undefined */
  className?: string;
}

const madeChanges = (n: number) => `made ${n} changes`;

const epoch = (date: ActivityEventProps["date"]) =>
  date instanceof Date ? date.getTime() : new Date(date).getTime();

/** "Todo → In progress → In review": the first `from`, then every `to`. */
function chainOf(events: readonly ActivityEventProps[]) {
  const first = events[0]!.change!;
  const values = [
    ...(first.from != null ? [first.from] : []),
    ...events.map((event) => event.change!.to),
  ];
  return (
    <span data-slot="activity-run-chain">
      {first.verb ?? `changed ${first.field}`}{" "}
      {values.map((value, i) => (
        <React.Fragment key={i}>
          {i > 0 ? (
            <>
              {" "}
              <span aria-hidden>→</span>
              <span className="sr-only">to</span>{" "}
            </>
          ) : null}
          <ActivityValue>{value}</ActivityValue>
        </React.Fragment>
      ))}
    </span>
  );
}

/**
 * `ActivityEventGroup` — one actor's run of events as one line with the latest time. With
 * `events`: a run of one field's changes is a chain ("moved it Todo → In progress → In review"),
 * other runs list their changes ("renamed it; set the due date"), and with `summarizeAt` a run that
 * long or longer reads "made 3 changes" (or `summarizeRun`'s words), a disclosure that lists them
 * under the line. The `children` form folds rows to the first `visible`, with "N more changes" to
 * unfold.
 *
 * @example
 * {groupActivityRuns(events, { actorKey: (e) => e.actorId, date: (e) => e.at }).map((run) => (
 *   <ActivityFeedItem key={run[0].id}><ActivityEventGroup events={run.map(toEventProps)} summarizeAt={3} /></ActivityFeedItem>
 * ))}
 */
export function ActivityEventGroup({
  events: combined,
  summarizeRun,
  summarizeAt,
  changesLabel = madeChanges,
  children,
  visible = 1,
  defaultOpen = false,
  className,
}: ActivityEventGroupProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const listId = React.useId();
  if (combined) {
    const first = combined[0];
    if (!first) return null;
    const latest = combined.reduce((last, event) =>
      epoch(event.date) > epoch(last.date) ? event : last,
    );
    const last = combined[combined.length - 1]!;
    const ids = combined.flatMap((event) => (event.id ? [event.id] : []));
    const runIds = ids.length ? JSON.stringify(ids) : undefined;
    const field = first.change?.field;
    const chain =
      combined.length > 1 &&
      field !== undefined &&
      combined.every((event) => event.change?.field === field);
    const folds =
      !chain &&
      summarizeAt !== undefined &&
      combined.length >= Math.max(2, summarizeAt);
    const shared = {
      actor: first.actor,
      agent: first.agent,
      date: latest.date,
      now: latest.now ?? first.now,
    };
    if (folds) {
      const summary = summarizeRun?.(combined) ?? changesLabel(combined.length);
      return (
        <div
          data-slot="activity-event-group"
          data-layout="run"
          data-open={open ? "" : undefined}
          className={cn("min-w-0", className)}
        >
          <ActivityEvent {...shared} icon={<ActivityKindIcon kind="edited" />}>
            <span
              data-slot="activity-change"
              data-activity-id={open ? undefined : first.id}
              data-activity-ids={open ? undefined : runIds}
            >
              <Button
                variant="ghost"
                size="xs"
                aria-expanded={open}
                aria-controls={listId}
                data-slot="activity-run-toggle"
                onClick={() => setOpen((o) => !o)}
                className="-my-1 -ms-1 h-auto min-h-6 gap-0.5 px-1 py-0.5 text-xs font-normal whitespace-normal text-muted-foreground hover:text-foreground"
              >
                {summary}
                <ChevronDown
                  aria-hidden
                  className={cn(
                    "size-3.5 transition-transform",
                    open && "rotate-180",
                  )}
                />
              </Button>
            </span>
          </ActivityEvent>
          <ul
            id={listId}
            hidden={!open}
            data-slot="activity-run-changes"
            // Under the text: 16px card padding + the 20px icon column + 8px.
            className="ms-11 flex min-w-0 flex-col pb-1"
          >
            {combined.map((event, index) => (
              <li
                key={event.id ?? index}
                data-slot="activity-change"
                data-activity-id={open ? event.id : undefined}
                className="flex min-w-0 items-start gap-1.5 text-xs/6 text-muted-foreground"
              >
                <span
                  aria-hidden
                  className="flex h-6 w-3.5 shrink-0 items-center justify-center"
                >
                  {event.icon && event.icon !== "avatar" ? (
                    event.icon
                  ) : (
                    <span className="size-1 rounded-full bg-muted-foreground/50" />
                  )}
                </span>
                <span className="min-w-0 break-words">{event.children}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return (
      <div
        data-slot="activity-event-group"
        data-layout={chain ? "chain" : "combined"}
        className={cn("min-w-0", className)}
      >
        <ActivityEvent
          {...shared}
          icon={
            chain ? (
              last.icon
            ) : combined.length > 1 ? (
              <ActivityKindIcon kind="edited" />
            ) : (
              first.icon
            )
          }
        >
          {chain ? (
            <span
              data-slot="activity-change"
              data-activity-id={first.id}
              data-activity-ids={runIds}
            >
              {chainOf(combined)}
            </span>
          ) : (
            combined.map((event, index) => (
              <React.Fragment key={event.id ?? index}>
                {index > 0 ? "; " : null}
                <span data-slot="activity-change" data-activity-id={event.id}>
                  {event.children}
                </span>
              </React.Fragment>
            ))
          )}
        </ActivityEvent>
      </div>
    );
  }
  const events = React.Children.toArray(children);
  const hidden = events.length - visible;
  const shown = open || hidden <= 0 ? events : events.slice(0, visible);
  return (
    <div
      data-slot="activity-event-group"
      data-open={open ? "" : undefined}
      className={cn("flex min-w-0 flex-col gap-1", className)}
    >
      {shown}
      {hidden > 0 ? (
        <Button
          variant="ghost"
          size="xs"
          aria-expanded={open}
          data-slot="activity-event-group-toggle"
          onClick={() => setOpen((o) => !o)}
          // Under the text: 16px card padding + the 20px icon column + 8px.
          className="ms-11 self-start px-1 text-xs font-normal text-muted-foreground hover:text-foreground"
        >
          {open ? (
            <ChevronUp aria-hidden className="size-3.5" />
          ) : (
            <ChevronDown aria-hidden className="size-3.5" />
          )}
          {open
            ? "Show less"
            : `${hidden} more ${hidden === 1 ? "change" : "changes"}`}
        </Button>
      ) : null}
    </div>
  );
}

/** Options for `groupActivityRuns`. */
export interface ActivityRunOptions<T> {
  /** Who did it — a run is one actor's (`null` is the system). */
  actorKey: (item: T) => string | null | undefined;
  /** When it happened. */
  date: (item: T) => Date | string | number;
  /** An item that never joins a run and ends the one before it (a comment). @default undefined */
  isBreak?: (item: T) => boolean;
  /** A boundary the host knows of between two items (a new day, the unread line). @default undefined */
  breakBefore?: (item: T, previous: T) => boolean;
  /** How long one run may span, from its first event, in milliseconds. @default 600000 (10 minutes) */
  runWindowMs?: number;
}

/**
 * `groupActivityRuns` — splits a chronological list (oldest first) into runs: consecutive events
 * by one actor within `runWindowMs` of the run's first, with no break (a comment, or the host's
 * `breakBefore`) between them. Every other item is a run of one. Render each run with
 * `ActivityEventGroup`; reverse the runs for newest first, so the order never changes membership.
 *
 * @example
 * const runs = groupActivityRuns(items, {
 *   actorKey: (item) => item.actorId,
 *   date: (item) => item.createdAt,
 *   isBreak: (item) => item.type === "comment",
 * });
 */
export function groupActivityRuns<T>(
  items: readonly T[],
  {
    actorKey,
    date,
    isBreak,
    breakBefore,
    runWindowMs = 10 * 60_000,
  }: ActivityRunOptions<T>,
): T[][] {
  const runs: T[][] = [];
  let open: { run: T[]; actor: string | null; start: number } | null = null;
  for (const item of items) {
    if (isBreak?.(item)) {
      runs.push([item]);
      open = null;
      continue;
    }
    const actor = actorKey(item) ?? null;
    const at = epoch(date(item));
    const previous = open?.run[open.run.length - 1];
    if (
      open &&
      previous !== undefined &&
      open.actor === actor &&
      Math.abs(at - open.start) <= runWindowMs &&
      !breakBefore?.(item, previous)
    ) {
      open.run.push(item);
      continue;
    }
    const run = [item];
    runs.push(run);
    open = { run, actor, start: at };
  }
  return runs;
}

/* ------------------------------------------------------------------------------------------------
 * ActivityUnreadDivider
 * ----------------------------------------------------------------------------------------------*/

/**
 * `ActivityUnreadDivider` — a primary "New" line before the first item the viewer hasn't seen.
 * `onVisible` fires once, when half of it is on screen — mark the record read there.
 *
 * @example
 * {firstUnread ? <ActivityUnreadDivider onVisible={markRead} /> : null}
 */
export function ActivityUnreadDivider({
  label = "New",
  onVisible,
  className,
}: {
  /** The label. @default "New" */
  label?: string;
  /** Called once, the first time the line is half on screen. @default undefined */
  onVisible?: () => void;
  /** Classes for the line. @default undefined */
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const seen = React.useRef(false);
  const callback = React.useRef(onVisible);
  React.useEffect(() => {
    callback.current = onVisible;
  });
  React.useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Half of it on screen (an observer's first report may be any sliver of it).
        if (
          !entry?.isIntersecting ||
          entry.intersectionRatio < 0.5 ||
          seen.current
        )
          return;
        seen.current = true;
        callback.current?.();
        observer.disconnect();
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      role="separator"
      aria-label={label}
      data-slot="activity-unread-divider"
      className={cn("flex items-center gap-3 py-1", className)}
    >
      <span className="h-px flex-1 bg-primary/40" />
      <span className="flex items-center gap-1 text-xs font-medium text-primary">
        <span className="size-1.5 rounded-full bg-primary" />
        {label}
      </span>
      <span className="h-px flex-1 bg-primary/40" />
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * ActivityJumpToLatest
 * ----------------------------------------------------------------------------------------------*/

/** Smooth unless the viewer asked for reduced motion (an explicit `behavior` beats the CSS reset). */
const scrollBehavior = (): ScrollBehavior =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";

/** The event ids a change node stands for: a run summary's `data-activity-ids` (JSON), else its own id. */
function anchorIds(node: HTMLElement): string[] {
  const { activityIds, activityId } = node.dataset;
  if (activityIds) {
    try {
      const ids: unknown = JSON.parse(activityIds);
      if (Array.isArray(ids)) return ids.map(String);
    } catch {
      // Not ours: fall back to the node's own id.
    }
  }
  return activityId ? [activityId] : [];
}

/** The nearest scrolling ancestor of `node`, or the window. */
function scrollParent(node: HTMLElement): HTMLElement | Window {
  let el = node.parentElement;
  while (el) {
    const { overflowY } = getComputedStyle(el);
    if (overflowY === "auto" || overflowY === "scroll") return el;
    el = el.parentElement;
  }
  return window;
}

/** Current arrival and direction within the viewport and all ancestor clips. */
function boundaryGeometry(boundary: HTMLElement) {
  const rect = boundary.getBoundingClientRect();
  let top = 0;
  let bottom = window.innerHeight;
  let left = 0;
  let right = window.innerWidth;
  for (let el = boundary.parentElement; el; el = el.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(el);
    if (overflowX === "visible" && overflowY === "visible") continue;
    const clip = el.getBoundingClientRect();
    // DOM client dimensions are unscaled CSS units; the rectangles are rendered
    // coordinates. Convert the client box before intersecting scaled ancestors.
    const scaleX = el.offsetWidth ? clip.width / el.offsetWidth : 1;
    const scaleY = el.offsetHeight ? clip.height / el.offsetHeight : 1;
    const clipTop = clip.top + el.clientTop * scaleY;
    const clipLeft = clip.left + el.clientLeft * scaleX;
    if (overflowY !== "visible") {
      top = Math.max(top, clipTop);
      bottom = Math.min(bottom, clipTop + el.clientHeight * scaleY);
    }
    if (overflowX !== "visible") {
      left = Math.max(left, clipLeft);
      right = Math.min(right, clipLeft + el.clientWidth * scaleX);
    }
  }
  return {
    visible:
      Math.min(rect.bottom, bottom) > Math.max(rect.top, top) &&
      Math.min(rect.right, right) > Math.max(rect.left, left),
    above: rect.bottom <= top,
  };
}

/** How long a floating control stays after the reader's last scroll before it fades. */
const SCROLL_IDLE_MS = 1500;

/**
 * True while the reader scrolls anything that holds `node` (or the page), and for
 * `SCROLL_IDLE_MS` after the last scroll, so a floating control fades once the reader settles.
 */
function useScrollActivity(node: HTMLElement | null) {
  const [active, setActive] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const ping = React.useCallback(() => {
    setActive(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setActive(false), SCROLL_IDLE_MS);
  }, []);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  React.useEffect(() => {
    if (!node) return;
    const onScroll = (event: Event) => {
      const source = event.target;
      if (
        source !== document &&
        !(source instanceof Node && source.contains(node))
      )
        return;
      ping();
    };
    document.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
    return () => document.removeEventListener("scroll", onScroll, true);
  }, [node, ping]);
  return [active, ping] as const;
}

/** Props for a floating, data-agnostic latest-content control. */
export interface ActivityJumpToLatestProps {
  /** The latest content's focusable boundary, supplied by the host. */
  target: HTMLElement | null;
  /** Keep the action available for a new batch already on screen; turning it on surfaces the control until the reader settles. @default false */
  forceVisible?: boolean;
  /** The selected feed direction; when omitted, points toward the observed boundary. @default undefined */
  direction?: "up" | "down";
  /** The button's label. @default "Jump to latest" */
  label?: string;
  /** Enable the control. @default true */
  enabled?: boolean;
  /** Called at activation; capture the batch here. @default undefined */
  onJump?: (target: HTMLElement) => void;
  /** Called once after that same boundary is reached. @default undefined */
  onReached?: (target: HTMLElement) => void;
  /** Called when user interaction or a changed boundary cancels a jump. @default undefined */
  onCancel?: (target: HTMLElement) => void;
  /** Classes for the floating row. @default undefined */
  className?: string;
}

/**
 * Floats while the supplied latest boundary is off screen (or a new batch awaits catch-up) and the
 * reader is scrolling or a new batch just arrived, and fades once they settle; hovering or focusing
 * it holds it in place.
 * Positioning lives on the wrapper: the Button's pressed translation never displaces the pill.
 * @example <ActivityJumpToLatest target={latestBoundary} onReached={acknowledgeCapturedBatch} />
 */
export function ActivityJumpToLatest({
  target,
  forceVisible = false,
  direction,
  label = "Jump to latest",
  enabled = true,
  onJump,
  onReached,
  onCancel,
  className,
}: ActivityJumpToLatestProps) {
  const [visibility, setVisibility] = React.useState<{
    target: HTMLElement;
    offScreen: boolean;
    above: boolean;
  } | null>(null);
  const pending = React.useRef<HTMLElement | null>(null);
  const callbacks = React.useRef({ onReached, onCancel });
  React.useLayoutEffect(() => {
    callbacks.current = { onReached, onCancel };
  }, [onReached, onCancel]);
  const cancel = React.useCallback(() => {
    const boundary = pending.current;
    pending.current = null;
    if (boundary) callbacks.current.onCancel?.(boundary);
  }, []);
  const complete = React.useCallback((boundary: HTMLElement) => {
    if (pending.current !== boundary || !boundary.isConnected) return;
    if (!boundaryGeometry(boundary).visible) return;
    pending.current = null;
    boundary.focus({ preventScroll: true });
    callbacks.current.onReached?.(boundary);
  }, []);
  React.useLayoutEffect(() => {
    if (!target || !enabled) return;
    // A viewport-root observer includes every ancestor's clipping, unlike a
    // nearest-scroll-root observer, which can report a still-hidden boundary.
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              if (!entry) return;
              const geometry = boundaryGeometry(target);
              setVisibility({
                target,
                offScreen: !entry.isIntersecting || !geometry.visible,
                above: geometry.above,
              });
              if (entry.isIntersecting) complete(target);
            },
            { root: null, threshold: 0.01 },
          );
    observer?.observe(target);
    // Any subsequent gesture cancels completion, so later unrelated scrolling
    // cannot acknowledge the batch or steal keyboard focus.
    const events = ["pointerdown", "touchstart", "wheel", "keydown"] as const;
    for (const event of events)
      document.addEventListener(event, cancel, {
        capture: true,
        passive: true,
      });
    return () => {
      cancel();
      observer?.disconnect();
      for (const event of events)
        document.removeEventListener(event, cancel, true);
    };
  }, [target, enabled, cancel, complete]);
  const [scrolling, ping] = useScrollActivity(enabled ? target : null);
  const [engaged, setEngaged] = React.useState(false);
  // A new batch (forceVisible turning on) surfaces the control like a scroll does, then it settles.
  React.useEffect(() => {
    if (forceVisible) ping();
  }, [forceVisible, ping]);
  const knownVisibility = visibility?.target === target ? visibility : null;
  const above = knownVisibility?.above ?? false;
  const shown =
    enabled &&
    target !== null &&
    (knownVisibility?.offScreen || forceVisible) &&
    (scrolling || engaged);
  return (
    <div
      data-slot="activity-jump-floating"
      data-shown={shown ? "" : undefined}
      className={cn(
        "pointer-events-none sticky bottom-4 z-10 flex h-0 items-start justify-center",
        className,
      )}
    >
      <span
        onPointerEnter={() => setEngaged(true)}
        onPointerLeave={() => setEngaged(false)}
        onFocus={() => setEngaged(true)}
        onBlur={() => setEngaged(false)}
        className={cn(
          "inline-flex transition-[opacity,translate] duration-200 ease-out",
          shown
            ? "pointer-events-auto -translate-y-full opacity-100"
            : "-translate-y-1/2 opacity-0",
        )}
      >
        <Button
          variant="secondary"
          size="sm"
          tabIndex={shown ? 0 : -1}
          aria-hidden={!shown}
          className="rounded-full shadow-md"
          onClick={() => {
            if (!target || !shown) return;
            setEngaged(false);
            cancel();
            pending.current = target;
            onJump?.(target);
            // Defer until host callbacks have committed any replacement target.
            // Never use a previous observer report to decide that arrival occurred.
            requestAnimationFrame(() => {
              if (pending.current !== target || !target.isConnected) return;
              complete(target);
              if (pending.current === target) {
                target.scrollIntoView({
                  behavior: scrollBehavior(),
                  block: "nearest",
                });
              }
            });
          }}
        >
          {(direction ? direction === "up" : above) ? (
            <ArrowUp aria-hidden />
          ) : (
            <ArrowDown aria-hidden />
          )}
          {label}
        </Button>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * useActivityFeedKeyboard
 * ----------------------------------------------------------------------------------------------*/

const ITEM = '[data-slot="activity-feed-item"]';
/** Mounted feeds listening for J/K, in mount order. */
const FEEDS: string[] = [];

/** Whether a key press belongs to a text field (never a feed shortcut). */
function typing(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return (
    !!el &&
    (el.isContentEditable ||
      el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.tagName === "SELECT" ||
      !!el.closest(
        "[contenteditable=true],[role=dialog],[role=menu],[role=listbox],[role=combobox],[role=option]",
      ))
  );
}

/**
 * `useActivityFeedKeyboard` — J / K move to the next / previous feed item (tinted, scrolled into
 * view), X calls `onToggle` with the item (unfold a thread's replies), Esc clears. Keys typed in
 * a field, a menu or a dialog are ignored. Attach the returned ref to the feed.
 *
 * @example
 * const feedRef = useActivityFeedKeyboard({ onToggle: (item) => item.querySelector("[data-slot=comment-thread-more] button")?.click() });
 * <ActivityFeed ref={feedRef}>…</ActivityFeed>
 */
export function useActivityFeedKeyboard({
  onToggle,
  enabled = true,
}: {
  /** X on an item. @default undefined */
  onToggle?: (item: HTMLElement) => void;
  /** Listen at all. @default true */
  enabled?: boolean;
} = {}) {
  const root = React.useRef<HTMLElement>(null);
  const toggle = React.useRef(onToggle);
  const id = React.useId();
  React.useEffect(() => {
    toggle.current = onToggle;
  });
  React.useEffect(() => {
    if (!enabled) return;
    let current: HTMLElement | null = null;
    FEEDS.push(id);
    const focus = (next: HTMLElement | null) => {
      current?.removeAttribute("data-focused");
      current = next;
      if (!next) return;
      next.setAttribute("data-focused", "");
      next.scrollIntoView({ block: "nearest", behavior: scrollBehavior() });
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        typing(event.target)
      )
        return;
      // One feed answers: the one focus is in, else the one mounted last.
      const inside = document.activeElement?.closest(
        "[data-activity-feed-keys]",
      );
      const mine = inside
        ? inside.getAttribute("data-activity-feed-keys") === id
        : FEEDS[FEEDS.length - 1] === id;
      if (!mine) return;
      const items = Array.from(
        root.current?.querySelectorAll<HTMLElement>(ITEM) ?? [],
      );
      // The selected item left the list (a filter, a delete): nothing is selected.
      if (current && !items.includes(current)) focus(null);
      if (!items.length) return;
      const at = current ? items.indexOf(current) : -1;
      const key = event.key.toLowerCase();
      if (key === "j" || key === "k") {
        event.preventDefault();
        const next =
          key === "j"
            ? Math.min(at + 1, items.length - 1)
            : Math.max(at === -1 ? items.length - 1 : at - 1, 0);
        focus(items[next] ?? null);
      } else if (key === "x" && current) {
        event.preventDefault();
        toggle.current?.(current);
      } else if (event.key === "Escape" && current) {
        focus(null);
      }
    };
    root.current?.setAttribute("data-activity-feed-keys", id);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      FEEDS.splice(FEEDS.indexOf(id), 1);
      focus(null);
    };
  }, [enabled, id]);
  return root;
}

/* ------------------------------------------------------------------------------------------------
 * ActivityFeedSkeleton
 * ----------------------------------------------------------------------------------------------*/

/** `ActivityFeedSkeleton` — the feed while it loads: event rows, a thread card and the composer, in their real shapes. @example <ActivityFeedSkeleton /> */
export function ActivityFeedSkeleton() {
  const event = (width: string) => (
    <div className="flex h-8 items-center gap-2 px-4">
      <Skeleton className="size-3.5 shrink-0 rounded-full" />
      <Skeleton className={cn("h-3", width)} />
    </div>
  );
  return (
    <div
      aria-hidden
      data-slot="activity-feed-skeleton"
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-1">
        {event("w-56")}
        {event("w-40")}
      </div>
      <div className="flex flex-col gap-1 rounded-lg border border-border px-4 py-3">
        <div className="flex h-6 items-center gap-2">
          <Skeleton className="size-5 shrink-0 rounded-full" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-10" />
        </div>
        <div className="flex flex-col gap-1.5 py-1">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      </div>
      {event("w-48")}
      <div className="flex flex-col rounded-lg border border-border px-4 pt-3 pb-2">
        <Skeleton className="h-3.5 w-32" />
        <div className="flex justify-end gap-1 pt-5">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="size-6 rounded-full" />
        </div>
      </div>
    </div>
  );
}
