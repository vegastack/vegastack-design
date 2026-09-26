// @vegastack board-card@0.23.37 sha256-tmzTTSjZ5AMgmNe2fgJWwSryZYGJTLLovacvy9PFTVY=

"use client";

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { cn } from "@vegastack/design";
import {
  dayDelta,
  formatDueLabel,
  type DateInput,
  type DateTimeOptions,
} from "@/lib/date-time";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { PersonCard } from "@/components/ui/person-hover-card";

/* ---
`BoardCard` is the content of one card on a `Board` lane (a task, a deal, a ticket): a round
completion tick (or the host's status circle), a two-line title, a muted context line, and a bottom
row of assignee, due date and priority. The tick or status sits in a fixed leading column; the
title, the context and the bottom row all share the text column beside it. It is the default card of `DataList`'s board view and is also usable on its
own (a card grid, a "my tasks" rail).

On a `Board` the board owns the surface — the border, the hover tint, the focus cue, the drag, the
⋯ menu — so pass `surface={false}` there (DataList does). Standalone, the card draws its own
surface: 12px padding, a hairline border and a hover tint. There is no focus ring anywhere
(FOC-13): the system's focus cue is the background tint base.css paints on the focused control.

Deliberately NOT done here:
- No data behaviour. `done` is controlled; the host writes it.
- No date maths of its own: the due chip reads `formatDueLabel` and `dayDelta` from the system
  date helpers, so a card and a list row always agree on "Overdue 2d" and "Due today".
--- */

/** The priority ladder a card's priority chip speaks. */
export type BoardCardPriority = "urgent" | "high" | "medium" | "low";

/** The person a card is assigned to. */
export interface BoardCardAssignee {
  /** Full name — the avatar's accessible name and the source of its initials. */
  name: string;
  /**
   * Avatar image URL.
   * @default undefined
   */
  image?: string | null;
  /**
   * The muted line in the avatar's hover card — usually the email.
   * @default undefined
   */
  email?: string | null;
  /**
   * A status after the name in the hover card, such as "Inactive".
   * @default undefined
   */
  badge?: React.ReactNode;
}

/** Props accepted by `BoardCard`. */
export interface BoardCardProps extends Omit<
  React.ComponentProps<"div">,
  "title"
> {
  /** The card's title — wraps to two lines, then truncates. */
  title: React.ReactNode;
  /**
   * One muted line under the title — where the card belongs ("Website redesign · Acme").
   * @default undefined
   */
  context?: React.ReactNode;
  /**
   * Whether the card is done. Setting it (or `onDoneChange`) shows the round completion tick at
   * the top start; a done card's title is struck through.
   * @default undefined
   */
  done?: boolean;
  /**
   * Called with the new value when the tick is pressed. Without it the tick is read-only.
   * @default undefined
   */
  onDoneChange?: (done: boolean) => void;
  /**
   * A status control in place of the tick — the host's Status menu (a `StatusIcon` trigger that
   * opens the status menu on click and marks done on Alt-click), the same control its list rows
   * use. It takes the leading column; `done` still strikes the title.
   * @default undefined
   */
  status?: React.ReactNode;
  /**
   * The tick's accessible name.
   * @default "Mark done"
   */
  doneLabel?: string;
  /**
   * The due date. Renders a chip from the system date helpers: destructive when overdue, warning
   * when due today.
   * @default undefined
   */
  due?: DateInput | null;
  /**
   * `now` and `timeZone` for the due chip — pass the app's time zone so the server and browser
   * agree on "today".
   * @default undefined
   */
  dateOptions?: DateTimeOptions;
  /**
   * The priority chip. Urgent and High are coloured; Medium and Low are quiet.
   * @default undefined
   */
  priority?: BoardCardPriority | null;
  /**
   * The priority chip's text.
   * @default the priority in sentence case ("Urgent")
   */
  priorityLabel?: string;
  /**
   * Who the card is assigned to — an avatar leading the bottom row.
   * @default undefined
   */
  assignee?: BoardCardAssignee | null;
  /**
   * The ⋯ slot at the top end — a `RowActionsMenu`. It shows on hover and on focus, and always on
   * a touch screen. On a `Board`, leave it empty: the board's own card menu takes this place.
   * @default undefined
   */
  actions?: React.ReactNode;
  /**
   * Make the card a link: the title is the link, stretched over the card. Standalone cards only —
   * on a `Board`, use the board's `getItemHref`.
   * @default undefined
   */
  href?: string;
  /**
   * The element the link renders — a router link such as `<Link href="" />`. The card's `href`
   * wins over the template's.
   * @default <a />
   */
  linkRender?: React.ReactElement;
  /**
   * Draw the card's own border, padding and hover tint. Off on a `Board`, which owns the surface.
   * @default true
   */
  surface?: boolean;
}

const PRIORITY_VARIANT: Record<
  BoardCardPriority,
  "destructive" | "warning" | "outline"
> = {
  urgent: "destructive",
  high: "warning",
  medium: "outline",
  low: "outline",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** The due chip's badge variant: destructive when overdue, warning when due today. */
function dueVariant(due: DateInput, options?: DateTimeOptions) {
  const delta = dayDelta(due, options);
  if (delta < 0) return "destructive" as const;
  if (delta === 0) return "warning" as const;
  return "outline" as const;
}

/**
 * `BoardCard` — a work item as a board card: a round completion tick, a two-line title, a muted
 * context line, and a bottom row with the assignee's avatar, the due chip and the priority chip.
 * A `status` control replaces the tick. The default card of `DataList`'s board view; pass `surface={false}` inside a
 * `Board`, which owns the surface.
 *
 * @example
 * <BoardCard
 *   surface={false}
 *   title={task.title}
 *   context={`${task.project} · ${task.customer}`}
 *   done={task.done}
 *   onDoneChange={(done) => api.setDone(task.id, done)}
 *   due={task.dueAt}
 *   priority={task.priority}
 *   assignee={{ name: task.owner.name, image: task.owner.avatarUrl }}
 * />
 */
export function BoardCard({
  title,
  context,
  done,
  onDoneChange,
  status,
  doneLabel = "Mark done",
  due,
  dateOptions,
  priority,
  priorityLabel,
  assignee,
  actions,
  href,
  linkRender,
  surface = true,
  className,
  ...props
}: BoardCardProps) {
  const hasTick =
    status == null && (done !== undefined || onDoneChange !== undefined);
  const hasLead = status != null || hasTick;
  const dueLabel =
    due != null && due !== "" ? formatDueLabel(due, dateOptions) : null;
  const hasFooter = (dueLabel && dueLabel.label) || priority || assignee;

  const titleText = href
    ? React.cloneElement(
        linkRender ?? <a />,
        mergeProps((linkRender?.props ?? {}) as object, {
          href,
          "data-slot": "board-card-link",
          className:
            "text-inherit no-underline after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] hover:no-underline focus-visible:no-underline",
          children: title,
        }) as object,
      )
    : title;

  return (
    <div
      data-slot="board-card-content"
      data-done={done ? "" : undefined}
      className={cn(
        "group/board-card relative flex min-w-0 flex-col gap-2 text-start text-card-foreground",
        surface &&
          "rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50 has-[[data-slot=board-card-link]:focus-visible]:bg-accent/50",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "grid min-w-0 items-start gap-x-2 gap-y-2",
          hasLead ? "grid-cols-[auto_minmax(0,1fr)]" : "grid-cols-1",
        )}
      >
        {hasLead ? (
          <div
            data-slot="board-card-lead"
            className={cn(
              "relative z-10 flex min-h-5 items-center",
              hasFooter && "row-span-2 self-start",
            )}
          >
            {status != null ? (
              status
            ) : (
              <Checkbox
                shape="circle"
                data-slot="board-card-done"
                aria-label={doneLabel}
                checked={done ?? false}
                readOnly={onDoneChange === undefined}
                onCheckedChange={(checked) => onDoneChange?.(checked === true)}
              />
            )}
          </div>
        ) : null}
        <div className="flex min-w-0 items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span
              data-slot="board-card-title"
              className={cn(
                "line-clamp-2 text-sm leading-5 font-medium break-words",
                done && "text-muted-foreground",
              )}
            >
              {/* The strike sits on an inline box so line-clamp never clips it. */}
              <span className={cn(done && "line-through")}>{titleText}</span>
            </span>
            {context != null ? (
              <span
                data-slot="board-card-context"
                className="min-w-0 truncate text-xs text-muted-foreground"
              >
                {context}
              </span>
            ) : null}
          </div>
          {actions != null ? (
            <div
              data-slot="board-card-actions"
              className="relative z-10 -me-1 -mt-1.5 shrink-0 self-start opacity-0 transition-opacity group-hover/board-card:opacity-100 focus-within:opacity-100 has-data-popup-open:opacity-100 pointer-coarse:opacity-100"
            >
              {actions}
            </div>
          ) : null}
        </div>
        {hasFooter ? (
          <div
            data-slot="board-card-footer"
            className="flex min-w-0 flex-wrap items-center gap-1.5"
          >
            {assignee ? (
              <HoverCard>
                <HoverCardTrigger
                  render={<span className="inline-flex rounded-full" />}
                >
                  <Avatar data-slot="board-card-assignee" size="sm">
                    {assignee.image ? (
                      <AvatarImage src={assignee.image} alt={assignee.name} />
                    ) : null}
                    <AvatarFallback>
                      <span aria-hidden="true">{initials(assignee.name)}</span>
                      <span className="sr-only">{assignee.name}</span>
                    </AvatarFallback>
                  </Avatar>
                </HoverCardTrigger>
                <HoverCardContent align="start" className="w-60 p-2">
                  <PersonCard person={assignee} />
                </HoverCardContent>
              </HoverCard>
            ) : null}
            {dueLabel && dueLabel.label ? (
              <Badge
                data-slot="board-card-due"
                variant={
                  done ? "outline" : dueVariant(due as DateInput, dateOptions)
                }
                className="tabular-nums"
              >
                {dueLabel.label}
              </Badge>
            ) : null}
            {priority ? (
              <Badge
                data-slot="board-card-priority"
                data-priority={priority}
                variant={PRIORITY_VARIANT[priority]}
              >
                {priorityLabel ??
                  priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
