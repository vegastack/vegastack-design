// @vegastack activity-feed@0.23.122 sha256-5blRSlIsjavQdBpMtpD8SQuR+XDv/SDcJ+bF9X6EuzM=

"use client";

import * as React from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
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
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  PersonHoverCard,
  type Person,
} from "@/components/ui/person-hover-card";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { RelativeTime } from "@/components/ui/relative-time";
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
  className,
  children,
  ...props
}: ActivityFeedProps) {
  const headingId = React.useId();
  return (
    <section
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
      {children}
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
  /** Who did it; `null` for the system. */
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
 * card; the time shows the exact date on hover.
 *
 * @example
 * <ActivityEvent actor={priya} icon={<StatusIcon status="done" size="xs" />} date={at}>
 *   changed status from <ActivityValue>Open</ActivityValue> to <ActivityValue>Done</ActivityValue>
 * </ActivityEvent>
 */
export function ActivityEvent({
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
      data-agent={agent ? "" : undefined}
      // 16px in, like a comment card's rows, so the icon sits in the avatars' column.
      className={cn("flex min-h-6 min-w-0 items-start gap-2 px-4", className)}
    >
      <span
        aria-hidden
        data-slot="activity-event-icon"
        className="flex h-6 w-5 shrink-0 items-center justify-center"
      >
        {icon === "avatar" && actor ? (
          <PersonAvatar person={actor} className="data-[size=sm]:size-4" />
        ) : icon && icon !== "avatar" ? (
          icon
        ) : (
          <span className="size-1.5 rounded-full bg-muted-foreground/50" />
        )}
      </span>
      <p className="min-w-0 flex-1 py-1 text-xs/4 text-muted-foreground">
        {actor ? (
          <PersonHoverCard person={actor} trigger="name">
            {actor.name}
          </PersonHoverCard>
        ) : (
          <span className="font-medium text-foreground">System</span>
        )}{" "}
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
  /** The events (`ActivityEvent`s), in order. */
  children: React.ReactNode;
  /** Events shown while folded. @default 1 */
  visible?: number;
  /** Start unfolded. @default false */
  defaultOpen?: boolean;
  /** Classes for the group. @default undefined */
  className?: string;
}

/**
 * `ActivityEventGroup` — a run of events (one person's quick edits, say) folded to the first
 * `visible` with "N more changes" under them; "Show less" folds them back.
 *
 * @example
 * <ActivityEventGroup>{events.map((e) => <ActivityEvent key={e.id} … />)}</ActivityEventGroup>
 */
export function ActivityEventGroup({
  children,
  visible = 1,
  defaultOpen = false,
  className,
}: ActivityEventGroupProps) {
  const [open, setOpen] = React.useState(defaultOpen);
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
        if (!entry?.isIntersecting || seen.current) return;
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

/**
 * `ActivityJumpToLatest` — put it last in the feed: while the feed's end is off screen, and the
 * viewer isn't scrolling up, a floating "Jump to latest" pill shows at the bottom of the view;
 * it scrolls to the end. Nothing shows while `enabled` is false (a short feed).
 *
 * @example
 * <ActivityJumpToLatest enabled={items.length > 3} />
 */
export function ActivityJumpToLatest({
  label = "Jump to latest",
  enabled = true,
  className,
}: {
  /** The button's label. @default "Jump to latest" */
  label?: string;
  /** Show the button at all. @default true */
  enabled?: boolean;
  /** Classes for the floating row. @default undefined */
  className?: string;
}) {
  const sentinel = React.useRef<HTMLDivElement>(null);
  const [offScreen, setOffScreen] = React.useState(false);
  const [scrollingUp, setScrollingUp] = React.useState(false);

  React.useEffect(() => {
    const node = sentinel.current;
    if (!node || !enabled || typeof IntersectionObserver === "undefined")
      return;
    const observer = new IntersectionObserver(
      ([entry]) => setOffScreen(!!entry && !entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(node);
    // Hide while the viewer scrolls up (reading back); show again once they pause.
    const container = scrollParent(node);
    const top = () =>
      container instanceof Window ? container.scrollY : container.scrollTop;
    let last = top();
    let frame = 0;
    let pause: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = top();
        if (Math.abs(y - last) > 15) {
          setScrollingUp(y < last);
          last = y;
        }
        clearTimeout(pause);
        pause = setTimeout(() => setScrollingUp(false), 300);
      });
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      container.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      clearTimeout(pause);
    };
  }, [enabled]);

  const shown = enabled && offScreen && !scrollingUp;
  return (
    <>
      <div
        data-slot="activity-jump-floating"
        data-shown={shown ? "" : undefined}
        // Zero-height and sticky: the pill floats over the view's bottom edge without taking room.
        className={cn(
          "pointer-events-none sticky bottom-4 z-10 flex h-0 justify-center",
          className,
        )}
      >
        <Button
          variant="secondary"
          size="sm"
          tabIndex={shown ? 0 : -1}
          aria-hidden={!shown}
          onClick={() =>
            sentinel.current?.scrollIntoView({
              behavior: "smooth",
              block: "end",
            })
          }
          className={cn(
            "rounded-full shadow-md transition-[opacity,translate] duration-200 ease-out",
            shown
              ? "pointer-events-auto -translate-y-full opacity-100"
              : "-translate-y-1/2 opacity-0",
          )}
        >
          <ArrowDown aria-hidden />
          {label}
        </Button>
      </div>
      <div
        ref={sentinel}
        aria-hidden
        data-slot="activity-feed-end"
        className="h-px"
      />
    </>
  );
}

/* ------------------------------------------------------------------------------------------------
 * useActivityFeedKeyboard
 * ----------------------------------------------------------------------------------------------*/

const ITEM = '[data-slot="activity-feed-item"]';

/** Whether a key press belongs to a text field (never a feed shortcut). */
function typing(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return (
    !!el &&
    (el.isContentEditable ||
      el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.tagName === "SELECT" ||
      !!el.closest("[contenteditable=true],[role=dialog],[role=menu]"))
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
  React.useEffect(() => {
    toggle.current = onToggle;
  });
  React.useEffect(() => {
    if (!enabled) return;
    let current: HTMLElement | null = null;
    const focus = (next: HTMLElement | null) => {
      current?.removeAttribute("data-focused");
      current = next;
      if (!next) return;
      next.setAttribute("data-focused", "");
      next.scrollIntoView({ block: "nearest", behavior: "smooth" });
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        typing(event.target)
      )
        return;
      const items = Array.from(
        root.current?.querySelectorAll<HTMLElement>(ITEM) ?? [],
      );
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
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      focus(null);
    };
  }, [enabled]);
  return root;
}

/* ------------------------------------------------------------------------------------------------
 * ActivityFeedSkeleton
 * ----------------------------------------------------------------------------------------------*/

/** `ActivityFeedSkeleton` — the feed while it loads: event rows, a thread card and the composer, in their real shapes. @example <ActivityFeedSkeleton /> */
export function ActivityFeedSkeleton() {
  const event = (width: string) => (
    <div className="flex h-6 items-center gap-2 px-4">
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
