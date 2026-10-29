// @vegastack inbox@0.25.100 sha256-e+dJrk2kV4OrKB6cqOeJ+cXnWITPwfLz2mLf50MWrvk=

"use client";

import * as React from "react";
import {
  BellOff,
  Check,
  CheckCheck,
  ChevronDown,
  Mail,
  MailOpen,
  MoreHorizontal,
  TriangleAlert,
  X,
} from "lucide-react";
import { cn } from "@vegastack/design";
import { PersonAvatar, type Person } from "@/components/ui/person-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RelativeTime } from "@/components/ui/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------ frame */

/** What a row needs from its {@link Inbox}: the active row, and how to activate or open one. */
interface InboxContextValue {
  activeId: string | null;
  activate: (value: string) => void;
  open?: (value: string) => void;
}

const InboxContext = React.createContext<InboxContextValue | null>(null);

/**
 * A key press that belongs to a text field, an open menu or a dialog opened over the Inbox (its
 * events bubble here through the portal) — never a list shortcut. A dialog that HOLDS the Inbox (a
 * `Sheet`) does not count.
 */
function typingTarget(target: EventTarget | null, inbox: HTMLElement) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const dialog = el.closest("[role=dialog],[role=alertdialog]");
  return (
    el.isContentEditable ||
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    !!el.closest(
      "[contenteditable=true],[role=menu],[role=listbox],[role=combobox]",
    ) ||
    (!!dialog && !dialog.contains(inbox))
  );
}

/** Props for {@link Inbox}. */
export interface InboxProps extends Omit<
  React.ComponentProps<"section">,
  "title"
> {
  /**
   * The heading.
   * @default "Inbox"
   */
  title?: React.ReactNode;
  /**
   * Header icon buttons before the close button — usually {@link InboxHeaderAction}s
   * ("Mark all read", a settings menu).
   * @default undefined
   */
  actions?: React.ReactNode;
  /**
   * Called by the ✕ button; omit to hide it.
   * @default undefined
   */
  onClose?: () => void;
  /**
   * Accessible name of the close button.
   * @default "Close inbox"
   */
  closeLabel?: string;
  /**
   * The row under the title — usually {@link InboxFilters}.
   * @default undefined
   */
  filters?: React.ReactNode;
  /**
   * Content under the list; with `onLoadMore` the end of the list is drawn for you.
   * @default undefined
   */
  footer?: React.ReactNode;
  /**
   * Infinite scroll: called when the sentinel under the last row scrolls into view while
   * `hasMore` is true and nothing is loading. Load the next page (15 rows is the house size).
   * @default undefined
   */
  onLoadMore?: () => void;
  /**
   * More rows exist; `false` ends the list on `endLabel`.
   * @default false
   */
  hasMore?: boolean;
  /**
   * A page is loading: three skeleton rows show under the list.
   * @default false
   */
  loadingMore?: boolean;
  /**
   * The last page failed: a ghost "Try again" button replaces the sentinel and calls `onLoadMore`.
   * @default false
   */
  loadMoreError?: boolean;
  /**
   * The end of the list once `hasMore` is false.
   * @default "You’re all caught up"
   */
  endLabel?: React.ReactNode;
  /**
   * The active row's `value` (an {@link InboxItem} `value`) — the one the host's peek shows. It is
   * marked (`data-active`, a start bar and `aria-current`) and scrolled into view. Controlled when
   * set; otherwise the Inbox keeps its own.
   * @default undefined
   */
  activeId?: string | null;
  /**
   * Called with the row J / K (or ↓ / ↑) moves to, and with a row as it opens. Drive the peek here.
   * @default undefined
   */
  onActiveChange?: (value: string) => void;
  /**
   * Open a row: Enter, or a plain click on its link (a modified click still opens `href` in a new
   * tab). When set, opening never navigates — show the record in a peek beside the Inbox and keep
   * the Inbox open. Omit it and a row's link navigates.
   * @default undefined
   */
  onOpen?: (value: string) => void;
}

/**
 * `Inbox` — the notification panel's frame: a header (title, icon actions, close), a filter row,
 * a scrolling body of full-bleed rows and an optional footer. Pass `onLoadMore` + `hasMore` +
 * `loadingMore` for infinite scroll: an IntersectionObserver sentinel pages as the list nears its
 * end, three skeleton rows stand in while a page loads, a ghost "Try again" follows a failure and
 * "You’re all caught up" ends the list. It fills its container, so put it in
 * a `Sheet`, a `Popover` or a docked panel; on a phone give that container the whole screen.
 *
 * Triage: give each row a `value`, then J / K (or ↓ / ↑) walk the rows — focus follows, the active
 * row is marked and scrolled into view, and `onActiveChange` reports it so the host's peek can
 * follow. Enter (or a click) calls `onOpen`, which never navigates or closes the Inbox.
 *
 * @example
 * <Inbox actions={<InboxHeaderAction label="Mark all read" icon={<CheckCheck />} onClick={markAll} />}
 *   filters={<InboxFilters value={tab} onValueChange={setTab} unreadOnly={unread} onUnreadOnlyChange={setUnread} />}
 *   activeId={peekId} onActiveChange={setPeekId} onOpen={setPeekId}>
 *   <InboxGroup label="Today">{rows}</InboxGroup>
 * </Inbox>
 */
export function Inbox({
  title = "Inbox",
  actions,
  onClose,
  closeLabel = "Close inbox",
  filters,
  footer,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  loadMoreError = false,
  endLabel = "You’re all caught up",
  activeId: activeIdProp,
  onActiveChange,
  onOpen,
  onKeyDown,
  className,
  children,
  ...props
}: InboxProps) {
  const titleId = React.useId();
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const [ownActiveId, setOwnActiveId] = React.useState<string | null>(null);
  const activeId = activeIdProp !== undefined ? activeIdProp : ownActiveId;
  const reportActive = React.useRef(onActiveChange);
  reportActive.current = onActiveChange;
  const activate = React.useCallback((value: string) => {
    setOwnActiveId(value);
    reportActive.current?.(value);
  }, []);
  const context = React.useMemo<InboxContextValue>(
    () => ({ activeId, activate, open: onOpen }),
    [activeId, activate, onOpen],
  );

  // The active row stays in view, clear of the sticky day label (its `scroll-mt`).
  React.useEffect(() => {
    if (activeId == null) return;
    rowFor(bodyRef.current, activeId)?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  const walk = (event: React.KeyboardEvent<HTMLElement>) => {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      typingTarget(event.target, event.currentTarget)
    )
      return;
    const key = event.key;
    const letter = key === "j" || key === "J" || key === "k" || key === "K";
    // Arrows walk only from the list itself; the tabs and the header keep theirs.
    const arrow =
      (key === "ArrowDown" || key === "ArrowUp") &&
      !!bodyRef.current?.contains(event.target as Node);
    if (!letter && !arrow) return;
    const rows = Array.from(
      bodyRef.current?.querySelectorAll<HTMLElement>(
        '[data-slot="inbox-item"][data-value]',
      ) ?? [],
    );
    if (!rows.length) return;
    event.preventDefault();
    const at = rows.findIndex((row) => row.dataset.value === activeId);
    const down = key === "ArrowDown" || key === "j" || key === "J";
    const next = down
      ? Math.min(at + 1, rows.length - 1)
      : at === -1
        ? rows.length - 1
        : Math.max(at - 1, 0);
    const row = rows[next]!;
    activate(row.dataset.value!);
    focusRow(row);
  };
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const loadRef = React.useRef(onLoadMore);
  loadRef.current = onLoadMore;
  const armed =
    Boolean(onLoadMore) && hasMore && !loadingMore && !loadMoreError;

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!armed || !sentinel || typeof IntersectionObserver === "undefined") {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadRef.current?.();
      },
      { root: bodyRef.current, rootMargin: "0px 0px 240px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [armed]);

  let end: React.ReactNode = footer;
  if (onLoadMore) {
    if (loadingMore) {
      end = <InboxSkeleton rows={3} label="Loading more notifications" />;
    } else if (loadMoreError) {
      end = (
        <div className="flex justify-center px-4 py-3">
          <Button variant="ghost" size="sm" onClick={onLoadMore}>
            Try again
          </Button>
        </div>
      );
    } else if (hasMore) {
      end = <div ref={sentinelRef} aria-hidden className="h-px" />;
    } else {
      end = (
        <div className="px-4 py-4 text-center text-xs text-muted-foreground">
          {endLabel}
        </div>
      );
    }
  } else if (footer) {
    end = (
      <div className="px-4 py-4 text-center text-xs text-muted-foreground">
        {footer}
      </div>
    );
  }
  return (
    <section
      data-slot="inbox"
      aria-labelledby={titleId}
      aria-keyshortcuts="J K"
      className={cn(
        "flex h-full min-h-0 w-full flex-col bg-background text-foreground",
        className,
      )}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        walk(event);
      }}
      {...props}
    >
      <header className="flex shrink-0 flex-col gap-2 px-4 pt-3 pb-2">
        <div className="flex min-h-8 items-center gap-1">
          <h2 id={titleId} className="me-auto text-base font-semibold">
            {title}
          </h2>
          {actions}
          {onClose ? (
            <InboxHeaderAction
              label={closeLabel}
              icon={<X />}
              onClick={onClose}
              className="ms-2"
            />
          ) : null}
        </div>
        {filters}
      </header>
      <div
        ref={bodyRef}
        data-slot="inbox-body"
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <InboxContext.Provider value={context}>
          {children}
        </InboxContext.Provider>
        {end}
      </div>
    </section>
  );
}

/** The row whose `value` is `value`, inside `root`. */
function rowFor(root: HTMLElement | null, value: string) {
  return (
    Array.from(
      root?.querySelectorAll<HTMLElement>(
        '[data-slot="inbox-item"][data-value]',
      ) ?? [],
    ).find((row) => row.dataset.value === value) ?? null
  );
}

/** Focus a row's link, or the row itself when it has none. */
function focusRow(row: HTMLElement) {
  const target =
    row.querySelector<HTMLElement>('[data-slot="inbox-item-link"]') ?? row;
  target.focus({ preventScroll: true });
}

/** Props for {@link InboxHeaderAction}. */
export interface InboxHeaderActionProps extends Omit<
  React.ComponentProps<typeof Button>,
  "children" | "size" | "variant"
> {
  /** The accessible name, also shown as the tooltip. */
  label: string;
  /** The icon. */
  icon: React.ReactNode;
}

/**
 * An icon button in the Inbox header, named by its tooltip.
 *
 * @example
 * <InboxHeaderAction label="Settings" icon={<Settings />} onClick={openSettings} />
 */
export function InboxHeaderAction({
  label,
  icon,
  ...props
}: InboxHeaderActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={label} {...props}>
            {icon}
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** Props for {@link InboxMenuAction}. */
export interface InboxMenuActionProps {
  /**
   * The accessible name of the trigger, also its tooltip.
   * @default "Inbox settings"
   */
  label?: string;
  /** `DropdownMenuItem`s. */
  children: React.ReactNode;
}

/**
 * The header's ⋯ settings menu.
 *
 * @example
 * <InboxMenuAction><DropdownMenuItem>Notification settings</DropdownMenuItem></InboxMenuAction>
 */
export function InboxMenuAction({
  label = "Inbox settings",
  children,
}: InboxMenuActionProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={label}>
            <MoreHorizontal />
          </Button>
        }
      />
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * "Mark all read" as a header action: the ✓✓ icon with its tooltip.
 *
 * @example
 * <InboxMarkAllRead disabled={unread === 0} onClick={markAllRead} />
 */
export function InboxMarkAllRead(
  props: Omit<InboxHeaderActionProps, "label" | "icon"> & { label?: string },
) {
  return (
    <InboxHeaderAction
      label={props.label ?? "Mark all read"}
      icon={<CheckCheck />}
      {...props}
    />
  );
}

/* ---------------------------------------------------------------- filters */

/** One tab of {@link InboxFilters}. */
export interface InboxTab {
  /** The value `onValueChange` receives. */
  value: string;
  /** The tab's label. */
  label: string;
  /** A count after the label; 0 or unset hides it. @default undefined */
  count?: number;
}

/** The tabs {@link InboxFilters} shows unless given its own: For you · Updates · Archived. */
export const INBOX_TABS: readonly InboxTab[] = [
  { value: "for-you", label: "For you" },
  { value: "updates", label: "Updates" },
  { value: "archived", label: "Archived" },
];

function FilterCount({ count }: { count?: number }) {
  if (!count || count <= 0) return null;
  return (
    <span className="text-muted-foreground tabular-nums">
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** Props for {@link InboxFilters}. */
export interface InboxFiltersProps {
  /** The selected tab's `value`. */
  value: string;
  /** Called with the tab picked. */
  onValueChange: (value: string) => void;
  /**
   * The tabs, each with an optional count.
   * @default INBOX_TABS — For you · Updates · Archived
   */
  tabs?: readonly InboxTab[];
  /**
   * Show unread rows only — the Unread toggle's pressed state, independent of the tab.
   * @default false
   */
  unreadOnly?: boolean;
  /**
   * Called from the Unread toggle; the toggle shows only when this is set.
   * @default undefined
   */
  onUnreadOnlyChange?: (unreadOnly: boolean) => void;
  /**
   * The unread count on the toggle; 0 hides it.
   * @default 0
   */
  unreadCount?: number;
  /**
   * The toggle's label.
   * @default "Unread"
   */
  unreadLabel?: string;
  /**
   * The tab list's accessible name.
   * @default "Show"
   */
  label?: string;
  /** @default undefined */
  className?: string;
}

/**
 * The row under the Inbox title: tabs (For you · Updates · Archived by default, each with an
 * optional count) and, at the end, an Unread toggle that filters whichever tab is open.
 *
 * @example
 * <InboxFilters
 *   value={tab}
 *   onValueChange={setTab}
 *   unreadOnly={unreadOnly}
 *   onUnreadOnlyChange={setUnreadOnly}
 *   unreadCount={3}
 * />
 */
export function InboxFilters({
  value,
  onValueChange,
  tabs = INBOX_TABS,
  unreadOnly = false,
  onUnreadOnlyChange,
  unreadCount = 0,
  unreadLabel = "Unread",
  label = "Show",
  className,
}: InboxFiltersProps) {
  return (
    <div
      data-slot="inbox-filters"
      className={cn("flex min-w-0 items-center gap-2", className)}
    >
      <Tabs
        value={value}
        onValueChange={(next) => onValueChange(String(next))}
        className="min-w-0 flex-1"
      >
        {/* The list pages' scope tabs: the pill list, so a triage queue reads as a list. */}
        <TabsList aria-label={label}>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              data-slot="inbox-filters-tab"
            >
              {tab.label}
              {/* A space so the name reads "For you 2"; flex drops it visually. */}
              {tab.count ? " " : null}
              <FilterCount count={tab.count} />
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {onUnreadOnlyChange ? (
        <Toggle
          variant="outline"
          size="sm"
          data-slot="inbox-filters-unread"
          pressed={unreadOnly}
          onPressedChange={(pressed) => onUnreadOnlyChange(pressed)}
          className="shrink-0"
        >
          {unreadLabel}
          {unreadCount ? " " : null}
          <FilterCount count={unreadCount} />
        </Toggle>
      ) : null}
    </div>
  );
}

/* ----------------------------------------------------------------- groups */

/** Props for {@link InboxList}. */
export interface InboxListProps extends React.ComponentProps<"ul"> {
  /**
   * The list's accessible name.
   * @default "Notifications"
   */
  "aria-label"?: string;
}

/**
 * An ungrouped, named list of {@link InboxItem}s.
 *
 * @example
 * <InboxList>{items.map((n) => <InboxItem key={n.id} title={n.title} />)}</InboxList>
 */
export function InboxList({
  className,
  "aria-label": label = "Notifications",
  ...props
}: InboxListProps) {
  return (
    <ul
      role="list"
      aria-label={label}
      data-slot="inbox-list"
      className={cn("divide-y", className)}
      {...props}
    />
  );
}

/** Props for {@link InboxGroup}. */
export interface InboxGroupProps extends React.ComponentProps<"ul"> {
  /** The small-caps sticky label ("Today"), also the list's name. */
  label: React.ReactNode;
}

/**
 * A day (or other) group: a label that sticks to the top of the scroll area (no dividers; 16px
 * above except on the first group, 6px below) over a list named by it.
 *
 * @example
 * <InboxGroup label="Today">{rows}</InboxGroup>
 */
export function InboxGroup({
  label,
  className,
  children,
  ...props
}: InboxGroupProps) {
  const id = React.useId();
  return (
    <div data-slot="inbox-group" className="group/inbox-group">
      <div
        id={id}
        className="sticky top-0 z-10 bg-background px-4 pt-4 pb-1.5 text-xs font-medium text-muted-foreground group-first/inbox-group:pt-2"
      >
        {label}
      </div>
      <ul
        role="list"
        aria-labelledby={id}
        className={cn("divide-y", className)}
        {...props}
      >
        {children}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ items */

/**
 * Emphasis inside an item title: the actor or record name.
 *
 * @example
 * <><InboxEmphasis>Asha</InboxEmphasis> assigned you a task</>
 */
export function InboxEmphasis({
  className,
  ...props
}: React.ComponentProps<"strong">) {
  return <strong className={cn("font-medium", className)} {...props} />;
}

/** One action chip on an {@link InboxItem}. */
export interface InboxItemAction {
  /** The chip's words. */
  label: string;
  /** Runs the action. */
  onClick: () => void;
  /**
   * `primary` fills the chip; use it for the first action only.
   * @default "default"
   */
  variant?: "default" | "primary";
  /**
   * `loading` spins and disables; `done` shows a check and `doneLabel`.
   * @default "idle"
   */
  state?: "idle" | "loading" | "done";
  /**
   * The words once done.
   * @default the label
   */
  doneLabel?: string;
}

/** A person behind a row or one of its events: the photo, else initials on their hue. */
export interface InboxActor {
  /** The name — the initials and the accessible name. */
  name: string;
  /** The photo. @default undefined */
  src?: string | null;
  /** The hue behind the initials. @default undefined */
  hue?: Person["hue"];
}

/** One of the events a grouped {@link InboxItem} stands for, listed when the row expands. */
export interface InboxItemEvent {
  /** A stable key. @default the index */
  id?: string;
  /** Who did it; `null` or unset for the system. @default undefined */
  actor?: InboxActor | null;
  /** What happened, after the actor's name ("commented: “Looks good”"). */
  text: React.ReactNode;
  /** When it happened. @default undefined */
  time?: Date | string | number;
}

/** Props for {@link InboxItem}. */
export interface InboxItemProps extends Omit<
  React.ComponentProps<"li">,
  "title"
> {
  /** The sentence: plain text, or a template with {@link InboxEmphasis} for the actor and record. */
  title: React.ReactNode;
  /**
   * The row's identity for the {@link Inbox}'s `activeId`, J / K and `onOpen`. Rows without one
   * are skipped by J / K.
   * @default undefined
   */
  value?: string;
  /**
   * Unread: a dot in the start gutter, a soft full-bleed tint, the title in the foreground colour
   * (read titles are muted) and an sr-only "Unread".
   * @default false
   */
  unread?: boolean;
  /**
   * The actor, as a 28px avatar — the photo, else initials on their hue. Takes precedence over
   * `icon`.
   * @default undefined
   */
  avatar?: InboxActor;
  /**
   * A system event's (or a record's) icon, drawn muted in a 28px tile.
   * @default undefined
   */
  icon?: React.ReactNode;
  /**
   * A small glyph on the avatar's or icon tile's corner naming the kind of event (assigned, a
   * mention, a comment…), so a person's rows still say what happened at a glance. Decorative: the
   * title carries the meaning.
   * @default undefined
   */
  badge?: React.ReactNode;
  /**
   * Draw the icon in the destructive ink (a failure).
   * @default false
   */
  destructive?: boolean;
  /**
   * The muted line under the title — a grouped row's latest event ("Sanjay commented"), or
   * context ("Skyline Tower B · Project").
   * @default undefined
   */
  meta?: React.ReactNode;
  /**
   * Everyone behind a grouped row, as stacked 20px avatars on a line under `meta` — three, then
   * "+n" — before the count. Their names are read out.
   * @default undefined
   */
  actors?: readonly InboxActor[];
  /**
   * How many events this row stands for (one record's updates, grouped); above 1 it shows after
   * the actors through `countLabel` ("9 updates").
   * @default events.length
   */
  count?: number;
  /**
   * The count's words.
   * @default (n) => "1 update" | "n updates"
   */
  countLabel?: (count: number) => string;
  /**
   * The events behind a grouped row, newest first. The count becomes a disclosure button that
   * lists them under the row (collapsed at first).
   * @default undefined
   */
  events?: readonly InboxItemEvent[];
  /**
   * When it happened; shown short, absolute on hover.
   * @default undefined
   */
  time?: Date | string | number;
  /**
   * Where the row goes; the whole row is the link. With the {@link Inbox}'s `onOpen` a plain click
   * opens the row in place instead, and a modified click still opens `href` in a new tab.
   * @default undefined
   */
  href?: string;
  /**
   * The link element to render instead of `<a>` (a router `Link`); it receives `href`, `className`,
   * `onClick` and children.
   * @default undefined
   */
  linkRender?: React.ReactElement<Record<string, unknown>>;
  /**
   * A request's state. `pending` shows the `actions` (Allow · Decline); `answered` replaces them
   * with the `answeredLabel` line.
   * @default undefined
   */
  status?: "pending" | "answered";
  /**
   * The line an answered request shows instead of its actions ("Granted by Sanjay · 5d").
   * @default undefined
   */
  answeredLabel?: React.ReactNode;
  /**
   * Up to three action chips (hidden once `status` is `answered`).
   * @default undefined
   */
  actions?: InboxItemAction[];
  /**
   * Called by the hover Mark read / Mark unread toggle; omit to hide it.
   * @default undefined
   */
  onToggleRead?: () => void;
  /**
   * `DropdownMenuItem`s for the row's ⋯ menu (Archive, Mark unread, Unwatch, Mute this type);
   * omit to hide it.
   * @default undefined
   */
  menu?: React.ReactNode;
  /**
   * The ⋯ button's accessible name.
   * @default "More actions"
   */
  menuLabel?: string;
}

const defaultCountLabel = (n: number) =>
  `${n} ${n === 1 ? "update" : "updates"}`;

/** At most this many stacked avatars; the rest read "+n". */
const ACTORS_SHOWN = 3;

/** The click was on one of the row's own controls (a chip, the toggle, the ⋯ menu, a link). */
const onControl = (event: React.SyntheticEvent) =>
  !!(event.target as HTMLElement).closest(
    "button,a,input,[role=menuitem],[role=button]",
  );

/**
 * One notification row: full-bleed, 16px sides and 12px vertical padding, a 28px avatar or muted
 * icon tile (with an optional kind `badge` on its corner), the title, the `meta` line (a grouped
 * row's latest event), a line with the stacked `actors` and the `count` ("9 updates", a disclosure
 * for the `events` behind it), and the inline `actions` (Allow · Decline) or, once `status` is
 * `answered`, the `answeredLabel`.
 * Unread rows get a dot in the start gutter and a soft tint; the {@link Inbox}'s active row a start
 * bar. A fixed 64px right column holds the time, with Mark read / Mark unread and the ⋯ menu below
 * it, shown on hover or keyboard focus.
 *
 * @example
 * <InboxItem value="task-39" unread icon={<SquareCheck />} title="#39 Agent link RCA test"
 *   actors={[sanjay, arjun]} count={9} events={events} meta="Sanjay commented" href="/tasks/39"
 *   menu={<DropdownMenuItem onClick={archive}>Archive</DropdownMenuItem>} />
 */
export function InboxItem({
  title,
  value,
  unread = false,
  avatar,
  icon,
  badge,
  destructive = false,
  meta,
  actors,
  count: countProp,
  countLabel = defaultCountLabel,
  events,
  time,
  href,
  linkRender,
  status,
  answeredLabel,
  actions,
  onToggleRead,
  menu,
  menuLabel = "More actions",
  className,
  onClick,
  onKeyDown,
  ...props
}: InboxItemProps) {
  const inbox = React.useContext(InboxContext);
  const tracked = !!inbox && value !== undefined;
  const active = tracked && inbox.activeId === value;
  const [expanded, setExpanded] = React.useState(false);
  const eventsId = React.useId();
  const hasControls = Boolean(onToggleRead || menu);
  const count = countProp ?? events?.length ?? 0;
  const showCount = count > 1;
  const expandable = showCount && !!events?.length;
  const answered = status === "answered";

  const open = () => {
    if (!tracked) return;
    inbox.activate(value);
    inbox.open?.(value);
  };

  const titleNode = (
    <>
      {unread ? <span className="sr-only">Unread: </span> : null}
      {title}
    </>
  );
  const linkClass = "after:absolute after:inset-0 after:content-['']";
  const linkClick = (event: React.MouseEvent) => {
    if (!tracked) return;
    // A modified or middle click keeps the browser's own (a new tab); a plain one opens in place.
    if (
      !inbox.open ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      inbox.activate(value);
      return;
    }
    event.preventDefault();
    open();
  };
  const linkProps = {
    href,
    "data-slot": "inbox-item-link",
    "aria-current": active ? ("true" as const) : undefined,
  };

  let titleContent: React.ReactNode = titleNode;
  if (!href && tracked && inbox.open) {
    // No link, but the row opens: the title is the row's button (a span, so the sentence wraps
    // like a link's), its overlay covering the row.
    titleContent = (
      <Button
        variant="ghost"
        nativeButton={false}
        render={<span />}
        data-slot="inbox-item-link"
        aria-current={active ? "true" : undefined}
        onClick={open}
        className={cn(
          "static inline h-auto rounded-none border-0 p-0 text-start text-sm font-normal whitespace-normal text-inherit select-text hover:bg-transparent active:not-aria-[haspopup]:translate-y-0 dark:hover:bg-transparent pointer-coarse:after:inset-0",
          linkClass,
        )}
      >
        {titleNode}
      </Button>
    );
  } else if (href) {
    titleContent = linkRender ? (
      React.cloneElement(linkRender, {
        ...linkProps,
        className: cn(linkClass, linkRender.props.className as string),
        onClick: (event: React.MouseEvent) => {
          (
            linkRender.props.onClick as
              ((event: React.MouseEvent) => void) | undefined
          )?.(event);
          if (!event.defaultPrevented) linkClick(event);
        },
        children: titleNode,
      })
    ) : (
      <a {...linkProps} className={linkClass} onClick={linkClick}>
        {titleNode}
      </a>
    );
  }

  const shownActors = actors?.slice(0, ACTORS_SHOWN) ?? [];
  const moreActors = (actors?.length ?? 0) - shownActors.length;
  const countText = showCount ? countLabel(count) : null;
  const hasByline = shownActors.length > 0 || showCount;

  return (
    <li
      data-slot="inbox-item"
      data-value={value}
      data-unread={unread || undefined}
      data-active={active || undefined}
      data-status={status}
      // A row with no link and nothing to open is focused itself while J / K walk the list.
      tabIndex={tracked && !href && !inbox.open ? -1 : undefined}
      aria-current={active && !href && !inbox.open ? "true" : undefined}
      className={cn(
        "group/inbox-item relative flex scroll-mt-10 gap-3 px-4 py-3 transition-colors hover:bg-muted/60 data-unread:bg-accent/40 data-unread:hover:bg-accent/60",
        // The active row (the one the peek shows): a 2px start bar over the accent tint.
        "data-active:bg-accent data-active:before:absolute data-active:before:inset-y-0 data-active:before:start-0 data-active:before:w-0.5 data-active:before:bg-primary data-active:hover:bg-accent",
        tracked && !href && inbox.open && "cursor-pointer",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || href || onControl(event)) return;
        open();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          event.defaultPrevented ||
          href ||
          event.key !== "Enter" ||
          event.target !== event.currentTarget
        )
          return;
        event.preventDefault();
        open();
      }}
      {...props}
    >
      {unread ? (
        <span
          data-slot="inbox-item-unread"
          aria-hidden
          className="absolute start-1.5 top-7 size-1.5 -translate-y-1/2 rounded-full bg-info"
        />
      ) : null}
      <div className="relative shrink-0 pt-0.5" aria-hidden>
        {avatar ? (
          <PersonAvatar
            person={{ name: avatar.name, image: avatar.src, hue: avatar.hue }}
            size="default"
            className="size-7"
          />
        ) : icon ? (
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-md bg-muted group-hover/inbox-item:bg-background [&_svg]:size-4",
              destructive ? "text-destructive-text" : "text-muted-foreground",
            )}
          >
            {icon}
          </span>
        ) : null}
        {badge && (avatar || icon) ? (
          <span
            data-slot="inbox-item-badge"
            className="absolute -end-1 top-4.5 flex size-4 items-center justify-center rounded-full border border-border bg-background text-muted-foreground [&_svg]:size-2.5"
          >
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p
          className={cn(
            "text-sm leading-5 font-normal [&_strong]:font-medium",
            unread ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {titleContent}
        </p>
        {meta ? (
          <p className="truncate text-xs leading-5 text-muted-foreground">
            {meta}
          </p>
        ) : null}
        {hasByline ? (
          <div
            data-slot="inbox-item-byline"
            className="flex min-w-0 items-center gap-1.5 text-xs leading-5 text-muted-foreground"
          >
            {shownActors.length ? (
              <span
                data-slot="inbox-item-actors"
                className="flex shrink-0 items-center gap-1"
              >
                <span aria-hidden className="flex -space-x-1">
                  {shownActors.map((actor, i) => (
                    <PersonAvatar
                      key={`${actor.name}-${i}`}
                      person={{
                        name: actor.name,
                        image: actor.src,
                        hue: actor.hue,
                      }}
                      className="ring-2 ring-background data-[size=sm]:size-5"
                    />
                  ))}
                </span>
                {moreActors > 0 ? (
                  <span aria-hidden className="tabular-nums">
                    +{moreActors}
                  </span>
                ) : null}
                <span className="sr-only">
                  {actors!.map((actor) => actor.name).join(", ")}
                </span>
              </span>
            ) : null}
            {expandable ? (
              <Button
                variant="ghost"
                size="xs"
                data-slot="inbox-item-count"
                aria-expanded={expanded}
                aria-controls={eventsId}
                onClick={() => setExpanded((e) => !e)}
                className="relative z-10 -my-0.5 -ms-1 gap-0.5 px-1 font-normal text-muted-foreground hover:text-foreground"
              >
                {countText}
                <ChevronDown
                  aria-hidden
                  className={cn(
                    "transition-transform",
                    expanded && "rotate-180",
                  )}
                />
              </Button>
            ) : showCount ? (
              <span
                data-slot="inbox-item-count"
                className="shrink-0 tabular-nums"
              >
                {countText}
              </span>
            ) : null}
          </div>
        ) : null}
        {expandable ? (
          <ul
            id={eventsId}
            data-slot="inbox-item-events"
            hidden={!expanded}
            className="mt-1 flex flex-col gap-1 border-s border-border ps-3"
          >
            {events!.map((event, i) => (
              <li
                key={event.id ?? i}
                className="flex min-w-0 items-start gap-1.5 text-xs leading-5 text-muted-foreground"
              >
                {event.actor ? (
                  <PersonAvatar
                    aria-hidden
                    person={{
                      name: event.actor.name,
                      image: event.actor.src,
                      hue: event.actor.hue,
                    }}
                    className="mt-0.5 shrink-0 data-[size=sm]:size-4"
                  />
                ) : null}
                <span className="min-w-0">
                  {event.actor ? (
                    <span className="font-medium text-foreground">
                      {event.actor.name}
                    </span>
                  ) : null}{" "}
                  {event.text}
                  {event.time !== undefined ? (
                    <>
                      {" "}
                      <span aria-hidden>·</span>{" "}
                      <RelativeTime date={event.time} focusable={false} />
                    </>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {answered ? (
          answeredLabel ? (
            <p
              data-slot="inbox-item-answered"
              className="flex min-w-0 items-center gap-1 text-xs leading-5 text-muted-foreground"
            >
              <Check aria-hidden className="size-3.5 shrink-0" />
              <span className="min-w-0 truncate">{answeredLabel}</span>
            </p>
          ) : null
        ) : actions?.length ? (
          <div className="relative z-10 mt-1.5 flex flex-wrap gap-1.5">
            {actions.slice(0, 3).map((action, i) => (
              <Button
                key={action.label}
                size="sm"
                variant={
                  action.variant === "primary" && i === 0
                    ? "default"
                    : "outline"
                }
                loading={action.state === "loading"}
                disabled={action.state === "done"}
                onClick={action.onClick}
              >
                {action.state === "done" ? (
                  <>
                    <Check data-icon="inline-start" />
                    {action.doneLabel ?? action.label}
                  </>
                ) : (
                  action.label
                )}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex w-16 shrink-0 flex-col items-end gap-1">
        {time !== undefined ? (
          <RelativeTime
            date={time}
            focusable={false}
            className="text-xs leading-5 whitespace-nowrap text-muted-foreground"
          />
        ) : null}
        {hasControls ? (
          <div className="relative z-10 -me-1 flex items-center gap-0.5 pointer-fine:opacity-0 pointer-fine:group-focus-within/inbox-item:opacity-100 pointer-fine:group-hover/inbox-item:opacity-100 pointer-fine:group-has-data-popup-open/inbox-item:opacity-100">
            {onToggleRead ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={unread ? "Mark read" : "Mark unread"}
                      onClick={onToggleRead}
                    >
                      {unread ? <MailOpen /> : <Mail />}
                    </Button>
                  }
                />
                <TooltipContent>
                  {unread ? "Mark read" : "Mark unread"}
                </TooltipContent>
              </Tooltip>
            ) : null}
            {menu ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={menuLabel}
                    >
                      <MoreHorizontal />
                    </Button>
                  }
                />
                <DropdownMenuContent
                  align="end"
                  className="w-max max-w-80 min-w-56"
                >
                  {menu}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}

/* ----------------------------------------------------------------- states */

/** Props for {@link InboxEmpty}. */
export interface InboxEmptyProps {
  /** @default "You're all caught up" */
  title?: React.ReactNode;
  /** @default undefined */
  description?: React.ReactNode;
  /** @default a BellOff icon */
  icon?: React.ReactNode;
}

/**
 * The empty state.
 *
 * @example
 * <InboxEmpty description="New assignments show up here." />
 */
export function InboxEmpty({
  title = "You’re all caught up",
  description,
  icon = <BellOff />,
}: InboxEmptyProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span
        aria-hidden
        className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-5"
      >
        {icon}
      </span>
      <h3 className="text-sm font-medium">{title}</h3>
      {description ? (
        <p className="max-w-64 text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

/** Props for {@link InboxError}. */
export interface InboxErrorProps {
  /** @default "Couldn't load notifications" */
  title?: React.ReactNode;
  /** @default undefined */
  description?: React.ReactNode;
  /** Called by "Try again". */
  onRetry: () => void;
  /** @default false */
  retrying?: boolean;
}

/**
 * The failed-load state, with Try again.
 *
 * @example
 * <InboxError onRetry={retry} />
 */
export function InboxError({
  title = "Couldn’t load notifications",
  description,
  onRetry,
  retrying = false,
}: InboxErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-2 px-6 py-12 text-center"
    >
      <span
        aria-hidden
        className="flex size-10 items-center justify-center rounded-lg bg-muted text-destructive-text [&_svg]:size-5"
      >
        <TriangleAlert />
      </span>
      <h3 className="text-sm font-medium">{title}</h3>
      {description ? (
        <p className="max-w-64 text-xs text-muted-foreground">{description}</p>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        className="mt-2"
        loading={retrying}
        onClick={onRetry}
      >
        Try again
      </Button>
    </div>
  );
}

/** Props for {@link InboxSkeleton}. */
export interface InboxSkeletonProps {
  /** @default 5 */
  rows?: number;
  /** @default "Loading notifications" */
  label?: string;
}

/**
 * Placeholder rows while the first page loads.
 *
 * @example
 * <InboxSkeleton rows={4} />
 */
export function InboxSkeleton({
  rows = 5,
  label = "Loading notifications",
}: InboxSkeletonProps) {
  return (
    <div role="status" aria-label={label} className="divide-y">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-3 px-4 py-3">
          <Skeleton className="size-7 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2 pt-0.5">
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
