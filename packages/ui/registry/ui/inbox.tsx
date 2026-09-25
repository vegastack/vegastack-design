// @vegastack inbox@0.23.29 sha256-BTQGdYe3JPve16D9GoDoik9O99LseEtSABvHPccKR3Q=

"use client";

import * as React from "react";
import {
  BellOff,
  Check,
  CheckCheck,
  Mail,
  MailOpen,
  MoreHorizontal,
  TriangleAlert,
  X,
} from "lucide-react";
import { cn } from "@vegastack/design";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RelativeTime } from "@/components/ui/relative-time";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------ frame */

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
}

/**
 * `Inbox` — the notification panel's frame: a header (title, icon actions, close), a filter row,
 * a scrolling body of full-bleed rows and an optional footer. Pass `onLoadMore` + `hasMore` +
 * `loadingMore` for infinite scroll: an IntersectionObserver sentinel pages as the list nears its
 * end, three skeleton rows stand in while a page loads, a ghost "Try again" follows a failure and
 * "You’re all caught up" ends the list. It fills its container, so put it in
 * a `Sheet`, a `Popover` or a docked panel; on a phone give that container the whole screen.
 *
 * @example
 * <Inbox actions={<InboxHeaderAction label="Mark all read" icon={<CheckCheck />} onClick={markAll} />}
 *   filters={<InboxFilters value={view} onValueChange={setView} unreadCount={3} />}>
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
  className,
  children,
  ...props
}: InboxProps) {
  const titleId = React.useId();
  const bodyRef = React.useRef<HTMLDivElement>(null);
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
      className={cn(
        "flex h-full min-h-0 w-full flex-col bg-background text-foreground",
        className,
      )}
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
        {children}
        {end}
      </div>
    </section>
  );
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

/** Which rows the Inbox shows. */
export type InboxFilter = "all" | "unread";

/** Props for {@link InboxFilters}. */
export interface InboxFiltersProps {
  /** The selected filter. */
  value: InboxFilter;
  /** Called with the filter a chip selects. */
  onValueChange: (value: InboxFilter) => void;
  /**
   * The unread count shown on the Unread chip; 0 hides it.
   * @default 0
   */
  unreadCount?: number;
  /** @default undefined */
  className?: string;
}

/**
 * The All | Unread chips under the title, with the count on Unread.
 *
 * @example
 * <InboxFilters value={view} onValueChange={setView} unreadCount={3} />
 */
export function InboxFilters({
  value,
  onValueChange,
  unreadCount = 0,
  className,
}: InboxFiltersProps) {
  const chips: { value: InboxFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "unread", label: "Unread" },
  ];
  return (
    <div
      role="group"
      aria-label="Show"
      className={cn("flex items-center gap-1.5", className)}
    >
      {chips.map((chip) => {
        const selected = chip.value === value;
        return (
          <Button
            key={chip.value}
            size="sm"
            variant={selected ? "default" : "outline"}
            aria-pressed={selected}
            onClick={() => onValueChange(chip.value)}
            className="rounded-full px-2.5"
          >
            {chip.label}
            {chip.value === "unread" && unreadCount > 0 ? (
              <span className="tabular-nums opacity-80">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </Button>
        );
      })}
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

/** Props for {@link InboxItem}. */
export interface InboxItemProps extends Omit<
  React.ComponentProps<"li">,
  "title"
> {
  /** The sentence: plain text, or a template with {@link InboxEmphasis} for the actor and record. */
  title: React.ReactNode;
  /**
   * Unread: a soft full-bleed tint, the title in the foreground colour (read titles are muted) and
   * an sr-only "Unread".
   * @default false
   */
  unread?: boolean;
  /**
   * The actor, as a 28px avatar: `{ name, src? }`. Takes precedence over `icon`.
   * @default undefined
   */
  avatar?: { name: string; src?: string };
  /**
   * A system event's icon, drawn muted in a 28px tile.
   * @default undefined
   */
  icon?: React.ReactNode;
  /**
   * Draw the icon in the destructive ink (a failure).
   * @default false
   */
  destructive?: boolean;
  /**
   * The muted line under the title ("Skyline Tower B · Project").
   * @default undefined
   */
  meta?: React.ReactNode;
  /**
   * When it happened; shown short, absolute on hover.
   * @default undefined
   */
  time?: Date | string | number;
  /**
   * Where the row goes; the whole row is the link.
   * @default undefined
   */
  href?: string;
  /**
   * The link element to render instead of `<a>` (a router `Link`); it receives `href`, `className`
   * and children.
   * @default undefined
   */
  linkRender?: React.ReactElement<Record<string, unknown>>;
  /**
   * Up to three action chips.
   * @default undefined
   */
  actions?: InboxItemAction[];
  /**
   * Called by the hover Mark read / Mark unread toggle; omit to hide it.
   * @default undefined
   */
  onToggleRead?: () => void;
  /**
   * `DropdownMenuItem`s for the row's ⋯ menu; omit to hide it.
   * @default undefined
   */
  menu?: React.ReactNode;
  /**
   * How many events this row stands for; above 1 shows a count.
   * @default undefined
   */
  count?: number;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/**
 * One notification row: full-bleed, 16px sides and 12px vertical padding, a 28px avatar or muted
 * icon tile, the title, a muted meta line and optional action chips. Unread rows get a soft tint.
 * A fixed 64px right column holds the time, with Mark read / Mark unread and the ⋯ menu below it,
 * shown on hover or keyboard focus.
 *
 * @example
 * <InboxItem unread avatar={{ name: "Asha Kumar" }} title="Asha assigned you a task" href="/tasks/41" onToggleRead={toggle} />
 */
export function InboxItem({
  title,
  unread = false,
  avatar,
  icon,
  destructive = false,
  meta,
  time,
  href,
  linkRender,
  actions,
  onToggleRead,
  menu,
  count,
  className,
  ...props
}: InboxItemProps) {
  const hasControls = Boolean(onToggleRead || menu);
  const titleNode = (
    <>
      {unread ? <span className="sr-only">Unread: </span> : null}
      {title}
      {count && count > 1 ? (
        <span className="ms-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 align-middle text-xs font-medium text-muted-foreground tabular-nums">
          {count}
        </span>
      ) : null}
    </>
  );
  const linkClass = "after:absolute after:inset-0 after:content-['']";

  let titleContent: React.ReactNode = titleNode;
  if (href) {
    titleContent = linkRender ? (
      React.cloneElement(linkRender, {
        href,
        className: cn(linkClass, linkRender.props.className as string),
        children: titleNode,
      })
    ) : (
      <a href={href} className={linkClass}>
        {titleNode}
      </a>
    );
  }

  return (
    <li
      data-slot="inbox-item"
      data-unread={unread || undefined}
      className={cn(
        "group/inbox-item relative flex gap-3 px-4 py-3 transition-colors hover:bg-muted/60 data-unread:bg-accent/40 data-unread:hover:bg-accent/60",
        className,
      )}
      {...props}
    >
      <div className="shrink-0 pt-0.5" aria-hidden>
        {avatar ? (
          <Avatar className="size-7">
            {avatar.src ? <AvatarImage src={avatar.src} alt="" /> : null}
            <AvatarFallback className="text-xs">
              {initials(avatar.name)}
            </AvatarFallback>
          </Avatar>
        ) : icon ? (
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-md bg-muted [&_svg]:size-4",
              destructive ? "text-destructive-text" : "text-muted-foreground",
            )}
          >
            {icon}
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
        {actions?.length ? (
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
            unitStyle="narrow"
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
                      aria-label="More actions"
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
