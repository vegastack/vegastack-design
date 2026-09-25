// @vegastack record-aside@0.23.29 sha256-YgioZFY12oPPPMP92CPrENiTE36besxkX2ZfTUNTYfg=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Item, ItemContent, ItemGroup } from "@/components/ui/item";
import { PersonAvatar } from "@/components/ui/person-hover-card";
import { PersonBadge } from "@/components/ui/searchable-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------------------------------------
 * RecordAside — the cards of a record page's right rail (and of its small-screen Details sheet):
 * a `RecordAsideCard` holds `RecordAsideSection`s, each a small header (title, count, an icon
 * action with a tooltip, or a button) above its content — an inline `PropertyList`, a
 * `PropertySection`, or an `ActionList` whose rows run to the card's edges like the Inbox's.
 * `PropertyPerson` and `PropertyClamp` are the rail's value shapes (people stacks are
 * `AvatarStack`), and the `*Skeleton` parts draw the same layout while it loads.
 * ----------------------------------------------------------------------------------------------*/

/** Native container props for `RecordAsideCard`. */
export type RecordAsideCardProps = React.ComponentPropsWithRef<"div">;

/**
 * `RecordAsideCard` — one card of the rail: a small outline `Card` (a border, no fill) whose sections
 * stack with a steady gap.
 *
 * @example
 * <RecordAsideCard><RecordAsideSection title="Details">…</RecordAsideSection></RecordAsideCard>
 */
export function RecordAsideCard({
  className,
  children,
  ...props
}: RecordAsideCardProps) {
  return (
    <Card
      size="sm"
      variant="outline"
      data-slot="record-aside-card"
      // The small card's inset, restated here: ActionList rows use it to run edge to edge.
      className={cn("shrink-0 [--card-spacing:--spacing(3)]", className)}
      {...props}
    >
      <CardContent className="flex min-w-0 flex-col gap-5">
        {children}
      </CardContent>
    </Card>
  );
}

/** Props for `RecordAsideSection`. */
export interface RecordAsideSectionProps extends Omit<
  React.ComponentPropsWithRef<"section">,
  "title"
> {
  /** The section's title, e.g. "Details" or "Tasks from this meeting". */
  title: React.ReactNode;
  /** A count shown muted after the title. @default undefined */
  count?: number;
  /** The header's trailing control: a `RecordAsideAction`, or a small `Button`. @default undefined */
  action?: React.ReactNode;
}

/**
 * `RecordAsideSection` — a titled block inside a `RecordAsideCard`.
 *
 * @example
 * <RecordAsideSection title="Action items" count={3} action={<Button size="xs">Create 3 tasks</Button>}>
 *   <ActionList>…</ActionList>
 * </RecordAsideSection>
 */
export function RecordAsideSection({
  className,
  title,
  count,
  action,
  children,
  ...props
}: RecordAsideSectionProps) {
  const id = React.useId();
  return (
    <section
      data-slot="record-aside-section"
      aria-labelledby={id}
      className={cn("flex min-w-0 flex-col gap-2", className)}
      {...props}
    >
      <div
        data-slot="record-aside-section-header"
        className="flex min-h-6 min-w-0 items-center justify-between gap-2"
      >
        <h2 id={id} className="min-w-0 text-sm font-medium">
          {title}
          {count !== undefined ? (
            <span className="ms-1.5 text-muted-foreground tabular-nums">
              {count}
            </span>
          ) : null}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Props for `RecordAsideAction`. */
export interface RecordAsideActionProps extends Omit<
  React.ComponentProps<typeof Button>,
  "children"
> {
  /** The tooltip, and the button's accessible name. */
  label: string;
  /** The icon shown. */
  icon: React.ReactNode;
}

/**
 * `RecordAsideAction` — a section header's icon action: a ghost `icon-xs` Button with a tooltip.
 * Pass `render={<a href="…" />}` (with `nativeButton={false}`) for a link.
 *
 * @example
 * <RecordAsideAction label="View in all tasks" icon={<ArrowUpRight />} render={<Link href="/tasks" />} nativeButton={false} />
 */
export function RecordAsideAction({
  label,
  icon,
  ...props
}: RecordAsideActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={label}
            {...props}
          />
        }
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** Native container props for `ActionList`. */
export type ActionListProps = React.ComponentPropsWithRef<"div">;

/**
 * `ActionList` — full-width rows that run to the card's edges (the Inbox's rows), for a section's
 * records: tasks, suggestions. Put `ActionListItem`s inside, or one `ActionListEmpty`.
 *
 * @example
 * <ActionList><ActionListItem>…</ActionListItem></ActionList>
 */
export function ActionList({ className, ...props }: ActionListProps) {
  return (
    <ItemGroup
      data-slot="action-list"
      className={cn(
        "-mx-(--card-spacing) w-auto gap-0 has-data-[size=sm]:gap-0 has-data-[size=xs]:gap-0",
        className,
      )}
      {...props}
    />
  );
}

/** Props for `ActionListItem` — `Item`'s own, less the size and variant it fixes. */
export type ActionListItemProps = Omit<
  React.ComponentProps<typeof Item>,
  "size" | "variant"
>;

/**
 * `ActionListItem` — one edge-to-edge row: a hover tint, no underline, the card's own inset. A row
 * that opens something takes `render` (a link or a button) or an `onClick`; `highlighted` flashes
 * a row that just arrived.
 *
 * @example
 * <ActionListItem render={<a href="/tasks/1" />}><ItemContent><ItemTitle>Send the quote</ItemTitle></ItemContent></ActionListItem>
 */
export function ActionListItem({ className, ...props }: ActionListItemProps) {
  return (
    <Item
      size="xs"
      data-slot="action-list-item"
      className={cn(
        "flex-nowrap items-start rounded-none px-(--card-spacing) no-underline hover:bg-muted/50",
        className,
      )}
      {...props}
    />
  );
}

/** Native container props for `ActionListChips`. */
export type ActionListChipsProps = React.ComponentPropsWithRef<"div">;

/**
 * `ActionListChips` — a row's small picker chips (ghost `sm` triggers: assignee, due date,
 * priority), wrapping when the rail is narrow.
 *
 * @example
 * <ActionListChips><Button variant="ghost" size="xs">Assignee</Button></ActionListChips>
 */
export function ActionListChips({ className, ...props }: ActionListChipsProps) {
  return (
    <div
      data-slot="action-list-chips"
      className={cn("flex min-w-0 flex-wrap items-center gap-1", className)}
      {...props}
    />
  );
}

/** Native paragraph props for `ActionListEmpty`. */
export type ActionListEmptyProps = React.ComponentPropsWithRef<"p">;

/** `ActionListEmpty` — the compact one-line empty state of a section. @example <ActionListEmpty>No suggestions</ActionListEmpty> */
export function ActionListEmpty({ className, ...props }: ActionListEmptyProps) {
  return (
    <p
      data-slot="action-list-empty"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

/** A person shown by `PropertyPerson`. */
export interface PropertyPersonValue {
  /** The name shown, and the avatar's initials. */
  name: string;
  /** The avatar image. @default undefined */
  image?: string | null;
  /** A status after the name, such as "Inactive" — a string is a small muted outline badge. @default undefined */
  badge?: React.ReactNode;
}

/** Props for `PropertyPerson`. */
export interface PropertyPersonProps
  extends PropertyPersonValue, React.ComponentPropsWithRef<"span"> {}

/** `PropertyPerson` — a person value: a small avatar and the name. @example <PropertyPerson name="Asha Rao" /> */
export function PropertyPerson({
  name,
  image,
  badge,
  className,
  ...props
}: PropertyPersonProps) {
  return (
    <span
      data-slot="property-person"
      className={cn("inline-flex min-w-0 items-center gap-2", className)}
      {...props}
    >
      <PersonAvatar person={{ name, image }} />
      <span className="min-w-0 truncate">{name}</span>
      <PersonBadge badge={badge} />
    </span>
  );
}

/** Props for `PropertyClamp`. */
export interface PropertyClampProps {
  /** The long value. */
  children: React.ReactNode;
  /** Classes for the text. @default undefined */
  className?: string;
}

/** `PropertyClamp` — a long value clamped to three lines, with "Show more" / "Show less". @example <PropertyClamp>{notes}</PropertyClamp> */
export function PropertyClamp({ children, className }: PropertyClampProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [clamped, setClamped] = React.useState(false);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const measure = () => setClamped(el.scrollHeight > el.clientHeight + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children, open]);
  return (
    <div
      data-slot="property-clamp"
      className="flex min-w-0 flex-col items-start"
    >
      <div
        ref={ref}
        className={cn(
          "min-w-0 text-sm wrap-anywhere",
          !open && "line-clamp-3",
          className,
        )}
      >
        {children}
      </div>
      {clamped || open ? (
        <Button
          variant="ghost"
          size="xs"
          className="-ms-2 text-muted-foreground"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Show less" : "Show more"}
        </Button>
      ) : null}
    </div>
  );
}

/** Props for `PropertyListSkeleton`. */
export interface PropertyListSkeletonProps {
  /** How many rows. @default 4 */
  rows?: number;
}

/** `PropertyListSkeleton` — inline property rows while they load: an icon, a label bar and a value bar. @example <PropertyListSkeleton rows={4} /> */
export function PropertyListSkeleton({ rows = 4 }: PropertyListSkeletonProps) {
  return (
    <div
      aria-hidden
      data-slot="property-list-skeleton"
      className="flex flex-col gap-1"
    >
      {Array.from({ length: rows }, (_, i) => (
        // The inline PropertyList row's own tracks: a 112px label column, then the value.
        <div
          key={i}
          className="grid min-h-7 grid-cols-[--spacing(28)_minmax(0,1fr)] items-center gap-x-3"
        >
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-3.5 rounded-sm" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-3.5 w-24" />
        </div>
      ))}
    </div>
  );
}

/** Props for `PropertySectionSkeleton`. */
export interface PropertySectionSkeletonProps {
  /** How many chips under the title. @default 2 */
  chips?: number;
}

/** `PropertySectionSkeleton` — a section's title bar with chip bars stacked below. @example <PropertySectionSkeleton chips={2} /> */
export function PropertySectionSkeleton({
  chips = 2,
}: PropertySectionSkeletonProps) {
  return (
    <div
      aria-hidden
      data-slot="property-section-skeleton"
      className="flex flex-col gap-2"
    >
      <Skeleton className="h-3 w-20" />
      {Array.from({ length: chips }, (_, i) => (
        <Skeleton key={i} className="h-6 w-36 rounded-full" />
      ))}
    </div>
  );
}

/** Props for `ActionListSkeleton`. */
export interface ActionListSkeletonProps {
  /** How many rows. @default 3 */
  rows?: number;
}

/** `ActionListSkeleton` — edge-to-edge action rows while they load: a status circle, a title bar and a meta bar. @example <ActionListSkeleton rows={3} /> */
export function ActionListSkeleton({ rows = 3 }: ActionListSkeletonProps) {
  return (
    <ActionList aria-hidden data-slot="action-list-skeleton">
      {Array.from({ length: rows }, (_, i) => (
        <ActionListItem key={i} className="hover:bg-transparent">
          <Skeleton className="size-4 rounded-full" />
          <ItemContent className="gap-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-24" />
          </ItemContent>
        </ActionListItem>
      ))}
    </ActionList>
  );
}

/** Props for `RecordAsideSectionSkeleton`. */
export interface RecordAsideSectionSkeletonProps {
  /** What loads under the header bar. @default undefined */
  children?: React.ReactNode;
}

/** `RecordAsideSectionSkeleton` — a section header bar over its loading content. @example <RecordAsideSectionSkeleton><ActionListSkeleton /></RecordAsideSectionSkeleton> */
export function RecordAsideSectionSkeleton({
  children,
}: RecordAsideSectionSkeletonProps) {
  return (
    <div
      aria-hidden
      data-slot="record-aside-section-skeleton"
      className="flex min-w-0 flex-col gap-2"
    >
      <div className="flex min-h-6 items-center">
        <Skeleton className="h-3.5 w-28" />
      </div>
      {children}
    </div>
  );
}
