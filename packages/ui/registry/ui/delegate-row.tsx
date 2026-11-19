// @vegastack delegate-row@0.123.0 sha256-T0ferkJ6O+MhIRKDZHv3Exwv0J2Jyz1mimYozZoOyQs=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { Ellipsis } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TruncatedText } from "@/components/ui/truncated-text";

/* ------------------------------------------------------------------------------------------------
 * DelegateRow — one person covering for another: their avatar and name over a muted line of what
 * they cover and when, an optional note, a trailing state and a ⋯ with Edit and End. It keeps
 * `MemberList`'s 36px row anatomy, so a delegates list beside a members list reads the same; the
 * "Add delegate" row is `MemberListAdd`, not a row of this component. An upcoming delegation's
 * dates are muted, an ended one mutes and has no actions, and a row with no handlers is read-only.
 * ----------------------------------------------------------------------------------------------*/

/** Where a delegation stands. */
export type DelegateState = "active" | "upcoming" | "ended";

/** Props accepted by `DelegateRow`. */
export interface DelegateRowProps {
  /** What is covered, worded by the caller: "Everything", "Approvals · Expenses, Travel". */
  area: string;
  /** Who covers. */
  person: { name: string; avatar: React.ReactNode };
  /** From when, formatted: "2 Dec". @default undefined */
  from?: string;
  /** Until when, formatted: "30 Dec". @default undefined */
  until?: string;
  /** A note, up to 200 characters: two lines, the rest in a tooltip. @default undefined */
  note?: string;
  /** Where it stands. */
  state: DelegateState;
  /** Edit it. @default undefined */
  onEdit?: () => void;
  /** End it now. @default undefined */
  onEnd?: () => void;
  /** Classes for the root. @default undefined */
  className?: string;
}

const STATE_WORDS: Record<DelegateState, string> = {
  active: "Active",
  upcoming: "Upcoming",
  ended: "Ended",
};

/** "2 Dec – 30 Dec", "From 2 Dec", "Until 30 Dec". */
function when(from?: string, until?: string) {
  if (from && until) return `${from} – ${until}`;
  if (from) return `From ${from}`;
  if (until) return `Until ${until}`;
  return null;
}

/**
 * `DelegateRow` — one delegate: avatar, name over what they cover and when, a note, the state and
 * a ⋯ with Edit and End.
 *
 * @example
 * <DelegateRow
 *   area="Approvals · Expenses, Travel"
 *   person={{ name: "Rohan Mehta", avatar: <PersonAvatar person={rohan} size="sm" /> }}
 *   from="2 Dec"
 *   until="30 Dec"
 *   note="I'm on leave; Rohan approves anything under ₹50,000."
 *   state="upcoming"
 *   onEdit={edit}
 *   onEnd={end}
 * />
 */
export function DelegateRow({
  area,
  person,
  from,
  until,
  note,
  state,
  onEdit,
  onEnd,
  className,
}: DelegateRowProps) {
  const ended = state === "ended";
  const dates = when(from, until);
  const actions = !ended && (onEdit || onEnd);
  return (
    <div
      data-slot="delegate-row"
      data-state={state}
      className={cn("flex min-w-0 flex-col py-0.5", className)}
    >
      <div className="flex min-h-9 min-w-0 items-center gap-2">
        <span
          data-slot="delegate-row-avatar"
          className={cn("inline-flex shrink-0", ended && "opacity-60")}
        >
          {person.avatar}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span
            className={cn(
              "truncate text-sm",
              ended ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {person.name}
          </span>
          <span
            data-slot="delegate-row-area"
            className="text-xs wrap-anywhere text-muted-foreground"
          >
            {[area, dates].filter(Boolean).join(" · ")}
          </span>
        </span>
        <span
          data-slot="delegate-row-state"
          className={cn(
            "shrink-0 px-2 text-sm",
            state === "active" ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {STATE_WORDS[state]}
        </span>
        {actions ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  data-slot="delegate-row-more"
                  aria-label={`More for ${person.name}'s delegation`}
                  className="text-muted-foreground"
                />
              }
            >
              <Ellipsis aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit ? (
                <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
              ) : null}
              {onEdit && onEnd ? <DropdownMenuSeparator /> : null}
              {onEnd ? (
                <DropdownMenuItem variant="destructive" onClick={onEnd}>
                  {state === "upcoming" ? "Cancel" : "End now"}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // Keeps the ⋯ column on a row without actions, so every state lines up.
          <span
            aria-hidden
            data-slot="delegate-row-more-spacer"
            className="size-7 shrink-0"
          />
        )}
      </div>
      {note ? (
        <TruncatedText
          lines={2}
          data-slot="delegate-row-note"
          className="ms-10 min-w-0 text-xs text-muted-foreground"
        >
          {note}
        </TruncatedText>
      ) : null}
    </div>
  );
}
