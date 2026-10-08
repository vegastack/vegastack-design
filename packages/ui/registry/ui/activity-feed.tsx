// @vegastack activity-feed@0.25.0 sha256-t+S55Hk3YqnRVXlGy8xh3K+i/ZK3aYuXVCsKJwVfIdA=

"use client";

import * as React from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CirclePlus,
  CircleX,
  Clock,
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
import { PersonAvatar } from "@/components/ui/person-avatar";
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
 * - `ActivityEventGroup`: consecutive events folded to the first few, "N more changes" to unfold.
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
  /** A count after the heading (the comments, say); hidden at zero. @default undefined */
  count?: number;
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
 * `ActivityFeed` — a record's history section: "Activity" with an optional count, the All /
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
    id?: string;
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
              id: node.dataset.activityId,
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
    const node = saved.node.isConnected
      ? saved.node
      : saved.id
        ? Array.from(
            sectionRef.current?.querySelectorAll<HTMLElement>(
              '[data-slot="activity-change"][data-activity-id]',
            ) ?? [],
          ).find((change) => change.dataset.activityId === saved.id)
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
          <Button variant="ghost" size="sm" loading disabled>
            {loadingMoreLabel}
          </Button>
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
        className="flex min-h-8 items-center justify-between gap-2"
      >
        <h2
          id={headingId}
          className="flex items-center gap-2 text-base font-medium"
        >
          {title}
          {/* A space keeps the name "Activity 3", not "Activity3". */}{" "}
          {count ? (
            <span className="text-muted-foreground tabular-nums">{count}</span>
          ) : null}
        </h2>
        <div className="-me-2 flex items-center gap-1">
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

/** Common event kinds `ActivityKindIcon` draws. */
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
  | "requested";

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
};

/** Semantic kinds keep their colour; the rest are muted. */
const KIND_TONES: Partial<Record<ActivityKind, string>> = {
  approved: "text-success",
  rejected: "text-destructive",
  requested: "text-warning",
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

/** Props for `ActivityEvent`. */
export interface ActivityEventProps {
  /** Stable event identity for preserving position across cursor-page joins. @default undefined */
  id?: string;
  /** Who did it; `null` for the system. A `badge` on the person ("Inactive") follows the name. */
  actor: Person | null;
  /** The actor is an agent: its name reads as an agent's. @default false */
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
  agent = false,
  icon,
  children,
  date,
  now,
  className,
}: ActivityEventProps) {
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
        {icon === "avatar" && actor ? (
          <PersonAvatar person={actor} className="data-[size=sm]:size-4" />
        ) : icon && icon !== "avatar" ? (
          icon
        ) : (
          <span className="size-1.5 rounded-full bg-muted-foreground/50" />
        )}
      </span>
      <p className="min-w-0 flex-1 py-1 text-xs/6 text-muted-foreground">
        {actor ? (
          <PersonHoverCard person={actor} trigger="name">
            {actor.name}
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
            <span
              data-slot="activity-event-agent"
              className="rounded-sm bg-tag-purple-subtle px-1 font-medium text-tag-purple-text"
            >
              Agent
            </span>{" "}
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
  /** Pre-grouped event props, in chronological order: one actor and time, all changes visible. @default undefined */
  events?: readonly ActivityEventProps[];
  /** Event rows, when not using `events`. @default undefined */
  children?: React.ReactNode;
  /** Events shown while folded. @default 1 */
  visible?: number;
  /** Start unfolded. @default false */
  defaultOpen?: boolean;
  /** Classes for the group. @default undefined */
  className?: string;
}

/**
 * `ActivityEventGroup` — pre-grouped `events` read as one visible sentence with one actor and
 * time. The children form supports legacy disclosure with `visible` and `defaultOpen`.
 *
 * @example
 * <ActivityEventGroup>{events.map((e) => <ActivityEvent key={e.id} … />)}</ActivityEventGroup>
 */
export function ActivityEventGroup({
  events: combined,
  children,
  visible = 1,
  defaultOpen = false,
  className,
}: ActivityEventGroupProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  if (combined) {
    const first = combined[0];
    if (!first) return null;
    const epoch = (date: ActivityEventProps["date"]) =>
      date instanceof Date ? date.getTime() : new Date(date).getTime();
    const latest = combined.reduce((last, event) =>
      epoch(event.date) > epoch(last.date) ? event : last,
    );
    return (
      <div
        data-slot="activity-event-group"
        data-layout="combined"
        className={cn("min-w-0", className)}
      >
        <ActivityEvent
          actor={first.actor}
          agent={first.agent}
          icon={
            combined.length > 1 ? (
              <ActivityKindIcon kind="edited" />
            ) : (
              first.icon
            )
          }
          date={latest.date}
          now={latest.now ?? first.now}
        >
          {combined.map((event, index) => (
            <React.Fragment key={event.id ?? index}>
              {index > 0 ? "; " : null}
              <span data-slot="activity-change" data-activity-id={event.id}>
                {event.children}
              </span>
            </React.Fragment>
          ))}
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

/** Props for a floating, data-agnostic latest-content control. */
export interface ActivityJumpToLatestProps {
  /** The latest content's focusable boundary, supplied by the host. */
  target: HTMLElement | null;
  /** Keep the action available for a new batch already on screen. @default false */
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
 * Floats while the supplied latest boundary is off screen, or a new batch awaits catch-up.
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
  const knownVisibility = visibility?.target === target ? visibility : null;
  const above = knownVisibility?.above ?? false;
  const shown =
    enabled && target !== null && (knownVisibility?.offScreen || forceVisible);
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
