// @vegastack members-stack@0.111.0 sha256-MTaQb/BIG9ELoY4WvnJ30Jp0NavtouNY/TKCs/PHKwE=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PERSON_AVATAR_STACK_ITEM,
  PERSON_AVATAR_STACK_RING,
  PersonAvatar,
  personAccessibleName,
  type Person,
} from "@/components/ui/person-avatar";
import { PersonCard } from "@/components/ui/person-hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------------------------------------
 * MembersStack — who has access to (or is in) a place, drawn one way everywhere: the page bar's
 * members slot, a space or record header, the Share button and a list row's Members cell.
 *
 * - 24px faces overlapped by 6px, each with a 2px ring in the colour of the surface beneath.
 * - At most three faces, then a "+N" pill of the same 24px height (11px semibold tabular figures,
 *   muted fill), overlapped the same way and never larger than a face. "+N" caps at "99+".
 * - Order: people active now first (a green dot on the face), then the order given (most recent
 *   editors first, then by name). You are never the first face unless you are alone.
 * - The combinations: only you → a lock and "Only you"; a whole space or workspace → its tile and
 *   "Everyone in <name>"; a team → its tile and "<name> · <count>"; nobody → nothing.
 * - Hover names them (up to ten, then "and N more"); a click opens the one members popover, which
 *   lists everyone and ends in the host's `footer` (Manage access, Manage members).
 * ----------------------------------------------------------------------------------------------*/

/** The most faces a stack shows before "+N" (M2). */
const MAX_FACES = 3;
/** The most names the hover tooltip lists before "and N more" (M5). */
const MAX_NAMES = 10;
/**
 * The "+N" pill's type: 11px semibold tabular figures, one step under the ramp's 12px floor so
 * the pill stays the faces' height (operator, UI ground rules M2, 18-11-2026; TYP-18's second
 * exception, held to this file by design-lint).
 */
const MEMBERS_COUNT_TEXT = "text-[0.6875rem]";

/** A person in a `MembersStack`. */
export interface MembersStackPerson extends Person {
  /** On the page now: drawn first, with a green dot. @default false */
  active?: boolean;
  /** The viewer: never the first face unless alone. @default false */
  you?: boolean;
}

/**
 * Who the stack stands for. `people` — the faces; `only-you` — a lock and "Only you";
 * `everyone` — the `group`'s tile and "Everyone in <group>"; `team` — the `group`'s tile and
 * "<group> · <total>".
 */
export type MembersStackAudience = "people" | "only-you" | "everyone" | "team";

/** Props for `MembersStack`. */
export interface MembersStackProps {
  /** The people, most relevant first (recent editors, then by name). @default [] */
  people?: readonly MembersStackPerson[];
  /**
   * How many people there are, when `people` is only the first of them (a space with 23 members,
   * 3 loaded). "+N" and the count count from it.
   * @default people.length
   */
  total?: number;
  /** Who the stack stands for. @default "people" */
  audience?: MembersStackAudience;
  /** The space, workspace or team for `everyone` and `team`, drawn as its tile. @default undefined */
  group?: Person;
  /** The stack's accessible name and the popover list's title. @default "Members" */
  label?: string;
  /**
   * The count after the faces, 8px on (a list row's Members cell): `true` reads "N members", a
   * function writes it.
   * @default false
   */
  count?: boolean | ((total: number) => string);
  /** The end of the members popover: "Manage access", "Manage members". @default undefined */
  footer?: React.ReactNode;
  /** Classes for the stack. @default undefined */
  className?: string;
}

/** "+N" for the people the faces leave out, capped at "99+". */
export function membersOverflowLabel(hidden: number): string {
  return hidden > 99 ? "99+" : `+${hidden}`;
}

/** Active people first, then the order given; the viewer is never first unless alone (M4). */
export function orderMembers<T extends MembersStackPerson>(
  people: readonly T[],
): T[] {
  const ordered = [
    ...people.filter((p) => p.active),
    ...people.filter((p) => !p.active),
  ];
  if (ordered.length > 1 && ordered[0]!.you) {
    const [you, next, ...rest] = ordered;
    return [next!, you!, ...rest];
  }
  return ordered;
}

/** The hover text: up to ten names, then "and N more". */
function namesLine(people: readonly Person[], total: number): string {
  const names = people.slice(0, MAX_NAMES).map(personAccessibleName);
  const more = total - names.length;
  return more > 0 ? `${names.join(", ")} and ${more} more` : names.join(", ");
}

function defaultCount(total: number): string {
  return `${total} ${total === 1 ? "member" : "members"}`;
}

/**
 * `MembersStack` — the one members stack (UI ground rules M1–M5).
 *
 * @example
 * <MembersStack people={members} total={23} footer={<Button variant="ghost" size="sm">Manage members</Button>} />
 * @example
 * <MembersStack audience="only-you" />
 * @example
 * <MembersStack audience="everyone" group={{ name: "General", kind: "workspace", hue: "blue" }} />
 * @example
 * <MembersStack people={members} total={23} count />
 */
export function MembersStack({
  people = [],
  total,
  audience = "people",
  group,
  label = "Members",
  count = false,
  footer,
  className,
}: MembersStackProps) {
  const all = Math.max(total ?? people.length, people.length);
  const ordered = orderMembers(people);

  if (audience === "only-you")
    return (
      <span
        data-slot="members-stack"
        data-audience="only-you"
        className={cn(
          "inline-flex h-7 shrink-0 items-center gap-1.5 px-1.5 text-sm text-muted-foreground",
          className,
        )}
      >
        <Lock aria-hidden className="size-4" />
        Only you
      </span>
    );

  const grouped =
    (audience === "everyone" || audience === "team") && group != null;
  if (!grouped && ordered.length === 0) return null;

  const shown = ordered.slice(0, MAX_FACES);
  const hidden = all - shown.length;
  const groupText = grouped
    ? audience === "everyone"
      ? `Everyone in ${group.name}`
      : `${group.name} · ${all}`
    : null;
  const countText =
    !grouped && count !== false
      ? typeof count === "function"
        ? count(all)
        : defaultCount(all)
      : null;
  // The visible words lead the name, so speech input can target it (WCAG 2.5.3).
  const accessible = grouped
    ? `${label}: ${groupText}`
    : countText != null
      ? `${label}: ${countText}, ${namesLine(ordered, all)}`
      : `${label}: ${namesLine(ordered, all)}`;

  const faces = grouped ? (
    <PersonAvatar person={group} size="sm" />
  ) : (
    // `avatar-group`: the slot `PersonAvatar` reads to give an agent's hexagon its surface halo
    // and to centre overlapped initials, as in any avatar stack.
    <span
      aria-hidden
      data-slot="avatar-group"
      data-members-stack-faces=""
      className="flex items-center -space-x-1.5"
    >
      {shown.map((person, i) => (
        <span
          key={`${person.id ?? person.name}-${i}`}
          className={cn(
            "inline-flex",
            PERSON_AVATAR_STACK_ITEM,
            person.kind === "team" || person.kind === "workspace"
              ? "rounded-tile"
              : "rounded-full",
          )}
        >
          <PersonAvatar
            person={person}
            size="sm"
            className={PERSON_AVATAR_STACK_RING}
            indicator={
              person.active ? (
                <span
                  data-slot="members-stack-active"
                  className="size-full rounded-full bg-success"
                />
              ) : undefined
            }
          />
        </span>
      ))}
      {hidden > 0 ? (
        <span
          data-slot="members-stack-overflow"
          className={cn(
            "relative inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-muted px-1.5 font-semibold text-muted-foreground tabular-nums",
            MEMBERS_COUNT_TEXT,
            PERSON_AVATAR_STACK_RING,
          )}
        >
          {membersOverflowLabel(hidden)}
        </span>
      ) : null}
    </span>
  );

  return (
    <Popover>
      <PopoverTrigger
        render={
          <MembersStackTrigger
            tooltip={groupText ?? namesLine(ordered, all)}
            aria-label={accessible}
            data-audience={audience}
            className={className}
          />
        }
      >
        {faces}
        {groupText != null ? (
          <span className="min-w-0 truncate text-sm text-muted-foreground">
            {groupText}
          </span>
        ) : null}
        {countText != null ? (
          <span
            data-slot="members-stack-count"
            className="min-w-0 truncate text-sm text-muted-foreground tabular-nums"
          >
            {countText}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        aria-label={label}
        data-slot="members-stack-popover"
        className="w-64 p-2"
        // The popover is portalled but its events bubble through React: a stack in a list row
        // must not open the row from inside its list.
        onClick={(event) => event.stopPropagation()}
      >
        {ordered.length > 0 ? (
          <ul
            aria-label={label}
            className="flex max-h-80 flex-col gap-2 overflow-y-auto"
          >
            {ordered.map((person, i) => (
              <li key={`${person.id ?? person.name}-${i}`}>
                <PersonCard person={person} layout="row" />
              </li>
            ))}
          </ul>
        ) : groupText != null ? (
          <p className="px-1 text-sm text-muted-foreground">{groupText}</p>
        ) : null}
        {all > ordered.length && ordered.length > 0 ? (
          <p className="px-1 pt-2 text-xs text-muted-foreground">
            and {all - ordered.length} more
          </p>
        ) : null}
        {footer != null ? (
          <div
            data-slot="members-stack-footer"
            className="-mx-2 -mb-2 mt-2 border-t border-border p-1"
          >
            {footer}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

/** The stack's one button: a ghost button the page bar's height, with the names on hover. */
function MembersStackTrigger({
  tooltip,
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button> & { tooltip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            {...props}
            // After the injected props: the trigger's own slot is the stack's public marker.
            data-slot="members-stack"
            className={cn(
              "h-7 max-w-full shrink-0 gap-2 px-1 active:not-aria-[haspopup]:translate-y-0",
              className,
            )}
            // A stack in a list row opens its popover without opening the row.
            onClick={(event) => {
              event.stopPropagation();
              onClick?.(event);
            }}
          />
        }
      />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
