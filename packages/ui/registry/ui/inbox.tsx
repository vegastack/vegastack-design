// @vegastack inbox@0.114.0 sha256-caFWhcyCKFYNA976eXGhipj4td6EJwVo8vJNnr9DfxE=

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
import {
  PERSON_AVATAR_STACK_RING,
  PersonAvatar,
  type Person,
} from "@/components/ui/person-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RelativeTime } from "@/components/ui/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
   * The heading; with `layout="page"` it is visually hidden and still names the list.
   * @default "Inbox"
   */
  title?: React.ReactNode;
  /**
   * `panel`: a self-contained panel (a header, and a body that scrolls on its own) for a `Sheet`,
   * a `Popover` or a docked panel. `page`: the list of an Inbox page — no header (the page's
   * title and top bar hold the title and actions, a column the filters), and the rows scroll
   * with the page, so infinite scroll watches the viewport.
   * @default "panel"
   */
  layout?: "panel" | "page";
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
 * a scrolling body of inset rows and an optional footer. Pass `onLoadMore` + `hasMore` +
 * `loadingMore` for infinite scroll: an IntersectionObserver sentinel pages as the list nears its
 * end, three skeleton rows stand in while a page loads, a ghost "Try again" follows a failure and
 * "You’re all caught up" ends the list. It fills its container, so put it in
 * a `Sheet`, a `Popover` or a docked panel; on a phone give that container the whole screen.
 * On an Inbox page use `layout="page"`: no header, and the rows scroll with the page.
 *
 * Triage: give each row a `value`, then J / K (or ↓ / ↑) walk the rows — focus follows, the active
 * row is marked and scrolled into view, and `onActiveChange` reports it so the host's peek can
 * follow. Enter (or a click) calls `onOpen`, which never navigates or closes the Inbox.
 *
 * @example
 * <Inbox actions={<InboxHeaderAction label="Mark all read" icon={<CheckCheck />} onClick={markAll} />}
 *   filters={<InboxFilters value={tab} onValueChange={setTab} />}
 *   activeId={peekId} onActiveChange={setPeekId} onOpen={setPeekId}>
 *   <InboxGroup label="Today">{rows}</InboxGroup>
 * </Inbox>
 *
 * @example
 * <Inbox layout="page" title="Mentions" onLoadMore={loadOlder} hasMore={more} onOpen={open}>
 *   <InboxGroup label="Today">{rows}</InboxGroup>
 * </Inbox>
 */
export function Inbox({
  title = "Inbox",
  layout = "panel",
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
  const page = layout === "page";
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
      // A page's rows scroll with the page: the viewport is the root.
      { root: page ? null : bodyRef.current, rootMargin: "0px 0px 240px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [armed, page]);

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
      data-layout={layout}
      aria-labelledby={titleId}
      aria-keyshortcuts="J K"
      className={cn(
        "group/inbox flex w-full flex-col bg-background text-foreground",
        !page && "h-full min-h-0",
        className,
      )}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        walk(event);
      }}
      {...props}
    >
      {page ? (
        <h2 id={titleId} className="sr-only">
          {title}
        </h2>
      ) : (
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
      )}
      <div
        ref={bodyRef}
        data-slot="inbox-body"
        className={cn(!page && "min-h-0 flex-1 overflow-y-auto")}
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
   * The tab list's accessible name.
   * @default "Show"
   */
  label?: string;
  /** @default undefined */
  className?: string;
}

/**
 * The row under the Inbox title: the tabs (For you · Updates · Archived by default, each with an
 * optional count). Unread rows read as unread in every tab (dot and tint); there is no Unread
 * toggle.
 *
 * @example
 * <InboxFilters value={tab} onValueChange={setTab} />
 */
export function InboxFilters({
  value,
  onValueChange,
  tabs = INBOX_TABS,
  label = "Show",
  className,
}: InboxFiltersProps) {
  return (
    <div
      data-slot="inbox-filters"
      // The tabs fold into a dropdown only when they do not fit the row.
      className={cn("flex min-w-0 items-center", className)}
    >
      <Tabs
        value={value}
        onValueChange={(next) => onValueChange(String(next))}
        className="max-w-full min-w-0 grow"
      >
        {/* The list pages' pill tabs, folding by measurement (`overflow="menu"`), so a triage queue
            reads as a list. */}
        <TabsList aria-label={label} overflow="menu">
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
      className={cn(ROWS_CLASS, className)}
      {...props}
    />
  );
}

/**
 * The rows' list. In a panel it sits 8px inside the pane, so a row's fill never runs to the pane's
 * edge (LAY-20). On a page (`layout="page"`) the page's gutter is that inset: the list reaches 8px
 * into it and each row pads 8px, so the avatars, the day labels and the page's other content share
 * one edge and the hover fill is still an inset `rounded-item` shape (a select option's hover),
 * never a band across the pane, and never a second gutter inside the page's own.
 */
const ROWS_CLASS =
  "flex flex-col gap-px px-2 group-data-[layout=page]/inbox:-mx-2 group-data-[layout=page]/inbox:px-0";

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
        // On a page the label starts at the page's own edge, in line with the rows' avatars.
        className="sticky top-0 z-10 bg-background px-4 pt-4 pb-1.5 text-xs font-medium text-muted-foreground group-first/inbox-group:pt-2 group-data-[layout=page]/inbox:px-0"
      >
        {label}
      </div>
      <ul
        role="list"
        aria-labelledby={id}
        className={cn(ROWS_CLASS, className)}
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
   * `primary` marks the row's main action, drawn `secondary`; every other action is `outline`.
   * A row action is never the filled primary button — that is the page's top-bar action and a
   * dialog's confirm.
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

/**
 * An expanded event's line: plain text, or — with its own `href` — a link above the row's overlay
 * that opens that record (`onOpen` in place on a plain click), never the row.
 */
function InboxEventLine({
  event,
  children,
}: {
  event: InboxItemEvent;
  children: React.ReactNode;
}) {
  // One paragraph, 24px tall on one line (the target floor), so it wraps as a sentence.
  if (!event.href)
    return <span className="block min-w-0 py-0.5">{children}</span>;
  return (
    <a
      href={event.href}
      data-slot="inbox-item-event-link"
      // 24px tall however short the line (the target floor); a block, so a long line wraps.
      className="relative z-10 block min-w-0 py-0.5 hover:text-foreground hover:underline"
      onClick={(e) => {
        e.stopPropagation();
        if (
          !event.onOpen ||
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey
        )
          return;
        e.preventDefault();
        event.onOpen();
      }}
    >
      {children}
    </a>
  );
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
  /**
   * Where this event's own record lives (one of a batch's records): the line becomes a link above
   * the row's overlay, so it opens that record instead of the row. @default undefined
   */
  href?: string;
  /**
   * Opens the event's record in place (a peek beside the inbox): a plain click calls it instead of
   * following `href`; a modified click still opens `href` in a new tab. @default undefined
   */
  onOpen?: () => void;
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
   * Unread: a 6px dot just before the time, the title in the foreground colour (read titles are
   * muted) and an sr-only "Unread".
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
   * lists them under the row (collapsed at first), across the row's full width on a thread rail
   * that drops from the avatar, each event curving into its 16px avatar (the item radius, 10px), in
   * line with the title.
   * @default undefined
   */
  events?: readonly InboxItemEvent[];
  /**
   * The events list starts open (a batch whose records are the point of the row).
   * @default false
   */
  defaultExpanded?: boolean;
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
   * The `menu` carries Mark read / Mark unread too. On a touch screen the row then shows no buttons
   * (only the unread dot and the time), so the title keeps its width; a long press opens the menu.
   * Without it a touch row keeps the toggle in view.
   * @default false
   */
  readInMenu?: boolean;
  /**
   * `DropdownMenuItem`s for the row's ⋯ menu (Archive, Mark unread, Unwatch, Mute this type);
   * omit to hide it. On a touch screen a long press on the row opens it; with `readInMenu` (or no
   * `onToggleRead`) the row shows no buttons there.
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

/**
 * The text a node reads as, through elements' children. `strict` returns `null` for anything it
 * cannot read in full (a component, which may render more than its children — a time, a link), so
 * a meta line is only ever compared when all of it is plain text.
 */
function textOf(node: React.ReactNode, strict = false): string | null {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) {
    let text = "";
    for (const child of node) {
      const part = textOf(child as React.ReactNode, strict);
      if (part === null) return null;
      text += part;
    }
    return text;
  }
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    if (
      strict &&
      (node.type === React.Fragment
        ? false
        : typeof node.type !== "string" ||
          !PLAIN_TEXT_TAGS.has(node.type) ||
          "dangerouslySetInnerHTML" in (node.props as object))
    )
      return null;
    return textOf(node.props.children, strict);
  }
  return strict ? null : "";
}

// Inline formatting a meta line can hold and still be read in full as text.
const PLAIN_TEXT_TAGS = new Set([
  "span",
  "strong",
  "em",
  "b",
  "i",
  "code",
  "mark",
  "small",
]);

/** The words of a text, folded: case, quotes and punctuation do not count; marks stay in words. */
const wordsOf = (text: string) =>
  text
    .normalize("NFC")
    .toLowerCase()
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter(Boolean);

/** Whether the meta line only repeats the title: all plain text, its words a run of the title's. */
function metaRepeatsTitle(title: React.ReactNode, meta: React.ReactNode) {
  const metaText = textOf(meta, true);
  if (metaText === null) return false;
  const said = wordsOf(metaText);
  const heading = wordsOf(textOf(title) ?? "");
  if (said.length === 0 || said.length > heading.length) return false;
  for (let start = 0; start + said.length <= heading.length; start++)
    if (said.every((word, i) => heading[start + i] === word)) return true;
  return false;
}

/** The click was on one of the row's own controls (a chip, the toggle, the ⋯ menu, a link). */
const onControl = (event: React.SyntheticEvent) =>
  !!(event.target as HTMLElement).closest(
    "button,a,input,[role=menuitem],[role=button]",
  );

/** How long a touch holds still on a row before its ⋯ menu opens (the platforms' long press). */
const LONG_PRESS_MS = 500;
/** How far (px) a held touch may drift and still count as a press, not a scroll. */
const LONG_PRESS_SLOP = 10;
/** The compatibility mouse events a touch's release can send after a long press. */
const SWALLOWED = ["mousedown", "mouseup", "click"] as const;

/**
 * A touch's long press on a row opens its ⋯ menu: from anywhere on the row (the title's link
 * covers it on touch) but its own other controls. A press that moves is a scroll; the click a
 * long press may end in is swallowed, so the row does not also open; the platform's own long-press
 * menu (Android's `contextmenu`, iOS's link callout) gives way to the row's.
 */
type LongPressHandlers = Pick<
  React.HTMLAttributes<HTMLElement>,
  | "onPointerDown"
  | "onPointerMove"
  | "onPointerUp"
  | "onPointerCancel"
  | "onContextMenu"
  | "onClickCapture"
>;

function useLongPressMenu(enabled: boolean): {
  open: boolean;
  setOpen: (open: boolean) => void;
  handlers: LongPressHandlers;
} {
  const [open, setOpen] = React.useState(false);
  const press = React.useRef<{
    timer: ReturnType<typeof setTimeout>;
    x: number;
    y: number;
  } | null>(null);
  const fired = React.useRef(false);
  const touch = React.useRef(false);
  // Takes down the window listeners of the last long press (the gesture's end, or unmount).
  const unswallow = React.useRef<(() => void) | null>(null);
  const cancel = () => {
    if (press.current) clearTimeout(press.current.timer);
    press.current = null;
  };
  React.useEffect(
    () => () => {
      cancel();
      unswallow.current?.();
    },
    [],
  );
  const fire = () => {
    cancel();
    fired.current = true;
    // The mouse events a touch's release may still send (the compatibility mousedown and click)
    // would land outside the menu it just opened and close it: the window's capture phase swallows
    // them before the menu hears them. Only a pointer's events (`detail` > 0): a keyboard's or an
    // assistive technology's click on a menu item is never one. The gesture ends at its click or at
    // the next touch, whichever comes first.
    const swallow = (event: MouseEvent) => {
      if (event.detail === 0) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.type === "click") {
        fired.current = false;
        done();
      }
    };
    const done = () => {
      for (const type of SWALLOWED)
        window.removeEventListener(type, swallow, { capture: true });
      window.removeEventListener("pointerdown", done, { capture: true });
      unswallow.current = null;
    };
    unswallow.current?.();
    for (const type of SWALLOWED)
      window.addEventListener(type, swallow, { capture: true });
    window.addEventListener("pointerdown", done, { capture: true });
    unswallow.current = done;
    setOpen(true);
  };
  const ownControl = (event: React.SyntheticEvent) => {
    const control = (event.target as HTMLElement).closest(
      "button,a,input,[role=menuitem],[role=button]",
    );
    return !!control && control.getAttribute("data-slot") !== "inbox-item-link";
  };
  if (!enabled) return { open, setOpen, handlers: {} };
  return {
    open,
    setOpen,
    handlers: {
      onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
        touch.current = event.pointerType === "touch";
        fired.current = false;
        cancel();
        if (!touch.current || !event.isPrimary || ownControl(event)) return;
        press.current = {
          timer: setTimeout(fire, LONG_PRESS_MS),
          x: event.clientX,
          y: event.clientY,
        };
      },
      onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
        const at = press.current;
        if (
          at &&
          Math.hypot(event.clientX - at.x, event.clientY - at.y) >
            LONG_PRESS_SLOP
        )
          cancel();
      },
      onPointerUp: cancel,
      onPointerCancel: cancel,
      onContextMenu: (event: React.MouseEvent<HTMLElement>) => {
        if (!touch.current || ownControl(event)) return;
        event.preventDefault();
        if (!fired.current) fire();
      },
      onClickCapture: (event: React.MouseEvent<HTMLElement>) => {
        if (!fired.current || event.detail === 0) return;
        fired.current = false;
        event.preventDefault();
        event.stopPropagation();
      },
    },
  };
}

/**
 * One notification row: an inset `rounded-item` shape, 12px sides (8px on a page, so its content
 * keeps the page's edge) and 12px vertical padding, a 28px avatar or muted
 * icon tile (with an optional kind `badge` on its corner), the title, the `meta` line (a grouped
 * row's latest event), a line with the stacked `actors` and the `count` ("9 updates", a disclosure
 * for the `events` behind it), and the inline `actions` (Allow · Decline) or, once `status` is
 * `answered`, the `answeredLabel`.
 * Unread rows get a dot just before the time; the {@link Inbox}'s active row a start bar. A right
 * column holds the time; with a pointer, Mark read / Mark unread and the ⋯ menu take its place on
 * hover or keyboard focus (64px at least, so they fit). On a touch screen the row keeps its width for
 * the title when its `menu` carries Mark read / Mark unread (`readInMenu`): only the dot and the time
 * show, and a long press opens the ⋯ menu, as a touch list's row does. Otherwise the toggle stays in
 * view (and a long press still opens the menu).
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
  defaultExpanded = false,
  time,
  href,
  linkRender,
  status,
  answeredLabel,
  actions,
  onToggleRead,
  readInMenu = false,
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
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const eventsId = React.useId();
  const hasControls = Boolean(onToggleRead || menu);
  // On a touch screen a long press opens the ⋯ menu; a row whose menu holds everything its buttons
  // do shows none of them there, so the title keeps its width.
  const longPress = useLongPressMenu(Boolean(menu));
  const touchMenuOnly = Boolean(menu) && (readInMenu || !onToggleRead);
  const count = countProp ?? events?.length ?? 0;
  const showCount = count > 1;
  const expandable = showCount && !!events?.length;
  const answered = status === "answered";
  // A meta line that only repeats the title is dropped, so the row reads as one line.
  const showMeta =
    meta != null && meta !== false && !metaRepeatsTitle(title, meta);

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
          "static inline h-auto rounded-none border-0 p-0 text-start text-sm font-normal whitespace-normal text-inherit select-text hover:not-focus-visible:bg-none active:not-aria-[haspopup]:translate-y-0 pointer-coarse:after:inset-0",
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
  // One line of text: the row is 52px and its parts centre on the avatar.
  const singleLine = !showMeta && !hasByline;

  return (
    <li
      data-slot="inbox-item"
      data-value={value}
      data-unread={unread || undefined}
      data-active={active || undefined}
      data-status={status}
      data-single-line={singleLine || undefined}
      // A row with no link and nothing to open is focused itself while J / K walk the list.
      tabIndex={tracked && !href && !inbox.open ? -1 : undefined}
      aria-current={active && !href && !inbox.open ? "true" : undefined}
      className={cn(
        // LAY-20: the row sits 8px inside the pane (the list's `px-2`) on `rounded-item`, so its fill never
        // runs to the pane edge; on a page it pads 8px from a list that reaches 8px into the page's
        // gutter, so its content keeps the page's edge (`ROWS_CLASS`). Unread is the dot and the
        // title's ink, never a fill (COL-24).
        // Three columns — the avatar, the text, the time and controls — and, under them, the
        // expanded events across the whole row, threaded from the avatar.
        "group/inbox-item relative grid scroll-mt-10 grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 rounded-item px-3 py-3 transition-colors state-layer group-data-[layout=page]/inbox:px-2",
        // One line of text: 52px (12px + the 28px avatar + 12px), the text and time centred on it.
        "data-single-line:items-center",
        // The active row (the one the peek shows): the selected step and a 2px start bar.
        "data-active:bg-state-selected data-active:before:absolute data-active:before:inset-y-2 data-active:before:start-0 data-active:before:w-0.5 data-active:before:rounded-full data-active:before:bg-primary",
        tracked && !href && inbox.open && "cursor-pointer",
        // A long press opens the ⋯ menu: no text selection or link callout under the finger.
        menu &&
          "pointer-coarse:[-webkit-touch-callout:none] pointer-coarse:select-none",
        className,
      )}
      {...longPress.handlers}
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
      <div
        className={cn("relative shrink-0", !singleLine && "pt-0.5")}
        aria-hidden
      >
        {avatar ? (
          <PersonAvatar
            person={{ name: avatar.name, image: avatar.src, hue: avatar.hue }}
            size="default"
            className={cn(
              "size-7",
              // With a corner badge the initials step down and up a pixel, clear of it.
              badge &&
                "[&_[data-slot=person-avatar-initials]]:-translate-y-px [&_[data-slot=person-avatar-initials]]:text-[83.333%]",
            )}
          />
        ) : icon ? (
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-tile bg-state-tile [&_svg]:size-4",
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
        {expandable && expanded && (avatar || icon) ? (
          // The thread rail, from under the avatar's centre down to the events.
          <span
            data-slot="inbox-item-rail"
            className="absolute start-[13px] top-8 bottom-0 w-0 border-s border-border"
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p
          className={cn(
            "text-sm leading-5 font-normal [&_strong]:font-medium",
            unread ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {titleContent}
        </p>
        {showMeta ? (
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
                      className={cn(
                        PERSON_AVATAR_STACK_RING,
                        "data-[size=sm]:size-5",
                      )}
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
      </div>
      <div
        className={cn(
          "relative flex min-w-16 shrink-0 flex-col items-end gap-1",
          // Touch, with only the menu: the time's own width, so the title gets the rest.
          touchMenuOnly && "pointer-coarse:min-w-0",
        )}
      >
        {time !== undefined || unread || hasControls ? (
          // Held at one line even with no time, so the controls that overlay it on hover have a place.
          // Unread is a 6px dot just before the time (the title's ink says it too), so the row
          // keeps its normal start inset.
          <div
            className={cn(
              "flex h-5 items-center gap-1.5",
              // With a pointer the controls take the time's place on hover, so they add no height.
              hasControls &&
                "pointer-fine:group-focus-within/inbox-item:invisible pointer-fine:group-hover/inbox-item:invisible pointer-fine:group-has-data-popup-open/inbox-item:invisible",
              // Touch: the ⋯ shows in the time's place only while its menu is open or a keyboard
              // focuses it.
              touchMenuOnly &&
                "pointer-coarse:group-has-focus-visible/inbox-item:invisible pointer-coarse:group-has-data-popup-open/inbox-item:invisible",
            )}
          >
            {unread ? (
              <span
                data-slot="inbox-item-unread"
                aria-hidden
                className="size-1.5 shrink-0 rounded-full bg-info"
              />
            ) : null}
            {time !== undefined ? (
              <RelativeTime
                date={time}
                focusable={false}
                className="text-xs leading-5 whitespace-nowrap text-muted-foreground"
              />
            ) : null}
          </div>
        ) : null}
        {hasControls ? (
          <div
            className={cn(
              "relative z-10 -me-1 flex items-center gap-0.5 pointer-fine:absolute pointer-fine:end-0 pointer-fine:-top-1 pointer-fine:opacity-0 pointer-fine:group-focus-within/inbox-item:opacity-100 pointer-fine:group-hover/inbox-item:opacity-100 pointer-fine:group-has-data-popup-open/inbox-item:opacity-100",
              // Touch, with a menu: out of sight and out of the finger's way (the row's long press
              // opens the menu); in the time's place while it is open, or for a keyboard's focus.
              touchMenuOnly &&
                "pointer-coarse:pointer-events-none pointer-coarse:absolute pointer-coarse:end-0 pointer-coarse:-top-1 pointer-coarse:opacity-0 pointer-coarse:group-has-focus-visible/inbox-item:pointer-events-auto pointer-coarse:group-has-focus-visible/inbox-item:opacity-100 pointer-coarse:group-has-data-popup-open/inbox-item:opacity-100",
            )}
          >
            {onToggleRead ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={unread ? "Mark read" : "Mark unread"}
                      onClick={onToggleRead}
                      // Touch, with `readInMenu`: the menu carries it, so the row keeps its width.
                      className={cn(touchMenuOnly && "pointer-coarse:hidden")}
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
              <DropdownMenu
                open={longPress.open}
                onOpenChange={longPress.setOpen}
              >
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
      {expandable ? (
        <ul
          id={eventsId}
          data-slot="inbox-item-events"
          hidden={!expanded}
          // Across the whole row: the rail runs on from the avatar and each event curves into its own
          // avatar (the item radius, `rounded-es-item`; the rail stops at the last one), in line with
          // the title. Every vertical is a 1px start border at the same whole-pixel x. `--border` is
          // translucent, so two lines over each other read brighter: a middle event's rail runs its
          // full height and its connector masks off that first pixel column, leaving only the curve,
          // so each height draws one line with no gap. The last event has no rail and keeps its
          // whole connector.
          className="relative col-span-full flex flex-col pt-1 before:absolute before:start-[13px] before:top-0 before:h-1 before:w-0 before:border-s before:border-border"
        >
          {events!.map((event, i) => (
            <li
              key={event.id ?? i}
              data-slot="inbox-item-event"
              className="relative flex min-w-0 items-start gap-1.5 ps-10 pb-0.5 text-xs leading-5 text-muted-foreground before:absolute before:start-[13px] before:top-0 before:h-3 before:w-6 before:rounded-es-item before:border-s before:border-b before:border-border not-last:before:[mask-image:linear-gradient(to_right,transparent_1px,black_1px)] rtl:not-last:before:[mask-image:linear-gradient(to_left,transparent_1px,black_1px)] after:absolute after:inset-y-0 after:start-[13px] after:w-0 after:border-s after:border-border last:after:hidden"
            >
              {/* Top-aligned to the first line, whatever the line wraps to. */}
              <span
                aria-hidden
                className="mt-1 flex size-4 shrink-0 items-center justify-center"
              >
                {event.actor ? (
                  <PersonAvatar
                    person={{
                      name: event.actor.name,
                      image: event.actor.src,
                      hue: event.actor.hue,
                    }}
                    className="data-[size=sm]:size-4"
                  />
                ) : (
                  <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                )}
              </span>
              <InboxEventLine event={event}>
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
              </InboxEventLine>
            </li>
          ))}
        </ul>
      ) : null}
      {/* The answer or the inline actions, under the text (after the events). */}
      {answered ? (
        answeredLabel ? (
          <p
            data-slot="inbox-item-answered"
            className="col-start-2 mt-0.5 flex min-w-0 items-center gap-1 text-xs leading-5 text-muted-foreground"
          >
            <Check aria-hidden className="size-3.5 shrink-0" />
            <span className="min-w-0 truncate">{answeredLabel}</span>
          </p>
        ) : null
      ) : actions?.length ? (
        <div className="relative z-10 col-start-2 mt-1.5 flex flex-wrap gap-1.5">
          {actions.slice(0, 3).map((action, i) => (
            <Button
              key={action.label}
              size="sm"
              // Row actions are never filled: the main one (`primary`) is secondary, the rest
              // outline. The filled button is the page's top-bar action and a dialog's confirm.
              variant={
                action.variant === "primary" && i === 0
                  ? "secondary"
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
        className="flex size-10 items-center justify-center rounded-tile bg-muted text-muted-foreground [&_svg]:size-5"
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
        className="flex size-10 items-center justify-center rounded-tile bg-muted text-destructive-text [&_svg]:size-5"
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
  /**
   * The {@link Inbox} `layout` the rows stand in for. Inside an `Inbox` it follows that Inbox; a
   * page's loading state outside one passes `page`, so its rows keep the page's edge.
   * @default "panel"
   */
  layout?: "panel" | "page";
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
  layout,
}: InboxSkeletonProps) {
  return (
    <div
      role="status"
      aria-label={label}
      data-layout={layout}
      className={cn(ROWS_CLASS, layout === "page" && "-mx-2 px-0")}
    >
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className={cn(
            "flex gap-3 px-3 py-3 group-data-[layout=page]/inbox:px-2",
            layout === "page" && "px-2",
          )}
        >
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
