// @vegastack board-card@0.25.11 sha256-M5cFiZXAsBNPPHPqO7H6iy1YaGdXlflREX25hxbf86g=

"use client";

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "@vegastack/design";
import {
  dayDelta,
  formatDueLabel,
  type DateInput,
  type DateTimeOptions,
} from "@/lib/date-time";
import { CalendarDays, Flag, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { PersonAvatar, type Person } from "@/components/ui/person-avatar";
import { PersonCard } from "@/components/ui/person-hover-card";

/* ---
`BoardCard` is the content of one card on a `Board` lane (a task, a deal, a ticket): a round
completion tick (or the host's status circle), a two-line title, a muted context line, and a bottom
row of assignee, due date and priority. Every band — the eyebrow, the tick or status, the context,
the chips and the footnote — starts at the card's own edge; the title follows the tick or status and
a wrapped title hangs under its own first line (two lines, then an ellipsis). Each band keeps its
height whether or not its neighbours exist, so cards on a lane share one rhythm. On a `Board` only
the first band leaves room for the board's ⋯ menu; the bands under it, an avatar at the footnote's
end included, run to the card's end padding. It is the default card of `DataList`'s board view and is also usable on its
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
   * The person's colour behind their initials.
   * @default undefined
   */
  hue?: Person["hue"];
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
   * The title's weight. A card led by a `status` control reads quieter at normal weight.
   * @default "normal" with `status`, otherwise "medium"
   */
  titleWeight?: "normal" | "medium";
  /**
   * A small muted line above the title — the parent a sub-item belongs to ("↳ Launch plan").
   * @default undefined
   */
  eyebrow?: React.ReactNode;
  /**
   * The top-end slot beside the title — usually the assignee's avatar. On a `Board` it sits
   * just before the board's ⋯ menu.
   * @default undefined
   */
  aside?: React.ReactNode;
  /**
   * The card's bottom row of pills, in place of the default assignee, due and priority row —
   * usually `BoardCardChip`s.
   * @default undefined
   */
  chips?: React.ReactNode;
  /**
   * A muted destructive line under the chips — what holds the card up ("Blocked by 2").
   * @default undefined
   */
  alert?: React.ReactNode;
  /**
   * A muted last line — when the card was created or last changed ("Created 9 Oct").
   * @default undefined
   */
  footnote?: React.ReactNode;
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
   * use. It sits at the card's edge before the title (a wrapped title hangs under its own first
   * line); `done` still strikes the title.
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
   * Make the footer fields editable in place. Called once per field — `assignee`, `due`,
   * `priority` — with the field's face (the avatar or chip, or a quiet icon when unset); return
   * the face wrapped in the host's editor, its trigger an `InlineEditTrigger layout="chip"`, so the
   * whole field opens the editor. Unset fields show on hover and keyboard focus only. Omit it, or
   * return the face as-is, where the viewer may not edit.
   * @default undefined
   */
  renderField?: (
    field: BoardCardField,
    face: React.ReactNode,
    empty: boolean,
  ) => React.ReactNode;
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

/** A `BoardCard` footer field `renderField` can make editable. */
export type BoardCardField = "assignee" | "due" | "priority";

const PRIORITY_VARIANT: Record<
  BoardCardPriority,
  "destructive" | "warning" | "outline"
> = {
  urgent: "destructive",
  high: "warning",
  medium: "outline",
  low: "outline",
};

/**
 * One editable footer field: the host's editor around the face, lifted above the card's link.
 * An unset field is a muted icon that shows on card hover, on keyboard focus and while open.
 */
function editableField(
  renderField: NonNullable<BoardCardProps["renderField"]>,
  field: BoardCardField,
  face: React.ReactNode,
  empty: boolean,
) {
  return (
    <span
      data-slot="board-card-field"
      data-field={field}
      data-empty={empty ? "" : undefined}
      className={cn(
        "relative z-10 inline-flex min-w-0",
        empty &&
          "text-muted-foreground opacity-0 transition-opacity group-hover/board-card:opacity-100 focus-within:opacity-100 has-data-popup-open:opacity-100 has-aria-expanded:opacity-100 pointer-coarse:opacity-100 [&_svg]:size-3.5",
      )}
    >
      {renderField(field, face, empty)}
    </span>
  );
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
  titleWeight,
  eyebrow,
  aside,
  chips,
  alert,
  footnote,
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
  renderField,
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
  const hasDefaultRow = Boolean(
    renderField != null || (dueLabel && dueLabel.label) || priority || assignee,
  );
  const hasFooter =
    chips != null || alert != null || footnote != null || hasDefaultRow;
  const weight = titleWeight ?? (status != null ? "normal" : "medium");

  const dueBadge =
    dueLabel && dueLabel.label ? (
      <Badge
        data-slot="board-card-due"
        variant={done ? "outline" : dueVariant(due as DateInput, dateOptions)}
      >
        {dueLabel.label}
      </Badge>
    ) : null;
  const priorityBadge = priority ? (
    <Badge
      data-slot="board-card-priority"
      data-priority={priority}
      variant={PRIORITY_VARIANT[priority]}
    >
      {priorityLabel ?? priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  ) : null;

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
          "rounded-lg border border-border bg-card p-3 shadow-xs transition-colors hover:bg-accent/50 has-[[data-slot=board-card-link]:focus-visible]:bg-accent/50",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {/* On a `Board` the card's first band leaves room for the board's ⋯ menu (on the
              card's end padding, in line with an avatar below it); the bands under it run to
              that padding. */}
          {eyebrow != null ? (
            <span
              data-slot="board-card-eyebrow"
              className="block h-5 min-w-0 truncate text-xs leading-5 text-muted-foreground in-data-board-card-menu:pe-7"
            >
              {eyebrow}
            </span>
          ) : null}
          {/* The tick or status leads the title; a wrapped title hangs under its own first
              line, never under the status. */}
          <div
            className={cn(
              "flex min-w-0 items-start gap-2",
              eyebrow == null && "in-data-board-card-menu:pe-7",
            )}
          >
            {hasLead ? (
              <div
                data-slot="board-card-lead"
                className={cn(
                  "relative z-10 flex h-5 shrink-0 items-center",
                  // A status trigger is an `icon-xs` button: its icon, not its hit area, meets
                  // the card's edge, and the title keeps the tick's gap from it.
                  status != null && "-ms-1 -me-1",
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
                    onCheckedChange={(checked) =>
                      onDoneChange?.(checked === true)
                    }
                  />
                )}
              </div>
            ) : null}
            <span
              data-slot="board-card-title"
              data-weight={weight}
              className={cn(
                "line-clamp-2 min-w-0 flex-1 text-sm leading-5 break-words",
                weight === "medium" ? "font-medium" : "font-normal",
                done && "text-muted-foreground",
              )}
            >
              {/* The strike sits on an inline box so line-clamp never clips it. */}
              <span className={cn(done && "line-through")}>{titleText}</span>
            </span>
          </div>
          {context != null ? (
            <span
              data-slot="board-card-context"
              className="min-w-0 truncate text-xs text-muted-foreground"
            >
              {context}
            </span>
          ) : null}
        </div>
        {aside != null ? (
          <div
            data-slot="board-card-aside"
            className="relative z-10 flex shrink-0 items-center self-start"
          >
            {aside}
          </div>
        ) : null}
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
        <div className="flex min-w-0 flex-col gap-2">
          {chips != null ? (
            <div
              data-slot="board-card-footer"
              className="flex min-w-0 flex-wrap items-center gap-1"
            >
              {chips}
            </div>
          ) : hasDefaultRow ? (
            <div
              data-slot="board-card-footer"
              className="flex min-w-0 flex-wrap items-center gap-1.5"
            >
              {renderField ? (
                <>
                  {editableField(
                    renderField,
                    "assignee",
                    assignee ? (
                      <>
                        <PersonAvatar person={assignee} />
                        <span className="sr-only">{assignee.name}</span>
                      </>
                    ) : (
                      <UserRound aria-hidden />
                    ),
                    !assignee,
                  )}
                  {editableField(
                    renderField,
                    "due",
                    dueBadge ?? <CalendarDays aria-hidden />,
                    !dueBadge,
                  )}
                  {editableField(
                    renderField,
                    "priority",
                    priorityBadge ?? <Flag aria-hidden />,
                    !priorityBadge,
                  )}
                </>
              ) : (
                <>
                  {assignee ? (
                    <HoverCard>
                      <HoverCardTrigger
                        render={
                          <span
                            data-slot="board-card-assignee"
                            className="inline-flex rounded-full"
                          />
                        }
                      >
                        <PersonAvatar person={assignee} />
                        <span className="sr-only">{assignee.name}</span>
                      </HoverCardTrigger>
                      <HoverCardContent align="start" className="w-60 p-2">
                        <PersonCard person={assignee} />
                      </HoverCardContent>
                    </HoverCard>
                  ) : null}
                  {dueBadge}
                  {priorityBadge}
                </>
              )}
            </div>
          ) : null}
          {alert != null ? (
            <span
              data-slot="board-card-alert"
              className="min-w-0 truncate text-xs text-destructive-text"
            >
              {alert}
            </span>
          ) : null}
          {footnote != null ? (
            <span
              data-slot="board-card-footnote"
              className="block h-6 min-w-0 truncate text-xs leading-6 text-muted-foreground"
            >
              {footnote}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Props accepted by `BoardCardChip`. */
export type BoardCardChipProps = useRender.ComponentProps<"span">;

/**
 * `BoardCardChip` — one small pill in a `BoardCard`'s `chips` row: a thin border, no fill, an
 * icon and a short label. Render it as the trigger of a host menu (`render={<button />}`, or a
 * `DropdownMenuTrigger`'s `render`) to make the field editable from the card.
 *
 * @example
 * <BoardCard
 *   title={task.title}
 *   chips={
 *     <>
 *       <BoardCardChip><Flag />High</BoardCardChip>
 *       <DropdownMenuTrigger render={<BoardCardChip render={<button type="button" />} />}>
 *         <Tag />Design
 *       </DropdownMenuTrigger>
 *     </>
 *   }
 * />
 */
export function BoardCardChip({
  className,
  render,
  ...props
}: BoardCardChipProps) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(
          "inline-flex h-6 max-w-full min-w-0 shrink-0 items-center gap-1 rounded-full border border-border bg-transparent px-2 text-xs whitespace-nowrap text-muted-foreground [&>svg]:pointer-events-none [&>svg]:size-3 [&>svg]:shrink-0 [a,button]:relative [a,button]:z-10",
          className,
        ),
      },
      props,
    ),
    render,
    state: { slot: "board-card-chip" },
  });
}
