// @vegastack person-hover-card@0.23.33 sha256-cLFYqTn+3Qe3TA0OGG8C1uSfoCYnGo5RIigcD+yPp60=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PersonBadge } from "@/components/ui/searchable-select";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/* ------------------------------------------------------------------------------------------------
 * PersonHoverCard — a person behind an avatar: hover or focus (tap on touch) opens a card with a
 * 32px avatar with the name and a muted email stacked beside it. AvatarStack stacks up to `max` of them (the Avatar
 * group recipe) with the rest behind a "+N" that opens the same rows in a list. A person without
 * an account (a free-text participant) shows initials and just the name.
 * ----------------------------------------------------------------------------------------------*/

/** A person shown by `PersonCard`, `PersonHoverCard` and `AvatarStack`. */
export interface Person {
  /** The name shown, and the avatar's initials. */
  name: string;
  /** The muted line under the name; omit for someone without an account. @default undefined */
  email?: string | null;
  /** The avatar image. @default undefined */
  image?: string | null;
  /** A status after the name, such as "Inactive" — a string is a small muted outline badge. @default undefined */
  badge?: React.ReactNode;
}

/** The two initials of a name ("Northwind FM leads" → "NF"). */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Props for `PersonAvatar`. */
export interface PersonAvatarProps {
  /** The person. */
  person: Person;
  /** Avatar size. @default "sm" */
  size?: "sm" | "default" | "lg";
  /** Classes for the avatar. @default undefined */
  className?: string;
}

/** `PersonAvatar` — a person's avatar: the image, else their initials. @example <PersonAvatar person={{ name: "Asha Rao" }} /> */
export function PersonAvatar({
  person,
  size = "sm",
  className,
}: PersonAvatarProps) {
  return (
    <Avatar size={size} className={className}>
      {person.image ? <AvatarImage src={person.image} alt="" /> : null}
      <AvatarFallback>{initials(person.name)}</AvatarFallback>
    </Avatar>
  );
}

/** Props for `PersonCard`. */
export interface PersonCardProps extends React.ComponentPropsWithRef<"div"> {
  /** The person. */
  person: Person;
  /**
   * `card` — the hover card's body: a 32px avatar with the name and email stacked beside it.
   * `row` — one line of a list: a smaller avatar beside them.
   * @default "card"
   */
  layout?: "card" | "row";
}

/** `PersonCard` — a person's avatar, name and muted email. @example <PersonCard person={{ name: "Asha Rao", email: "asha@acme.com" }} /> */
export function PersonCard({
  person,
  layout = "card",
  className,
  ...props
}: PersonCardProps) {
  return (
    <div
      data-slot="person-card"
      data-layout={layout}
      className={cn(
        "flex min-w-0 items-center",
        layout === "card" ? "gap-2.5" : "gap-2",
        className,
      )}
      {...props}
    >
      <PersonAvatar
        person={person}
        size={layout === "card" ? "default" : "sm"}
      />
      <div className="flex min-w-0 flex-col">
        <span className="flex min-w-0 flex-wrap items-center gap-x-1.5">
          <span className="text-sm font-medium wrap-anywhere">
            {person.name}
          </span>
          <PersonBadge badge={person.badge} />
        </span>
        {person.email ? (
          <span className="text-xs wrap-anywhere text-muted-foreground">
            {person.email}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Props for `PersonHoverCard`. */
export interface PersonHoverCardProps {
  /** The person. */
  person: Person;
  /** The trigger — usually a `PersonAvatar`. It is wrapped in a round ghost button named by the person. */
  children: React.ReactNode;
  /** Classes for the trigger button. @default undefined */
  className?: string;
}

/**
 * `PersonHoverCard` — hover or focus the trigger (tap it on touch) for the person's card.
 *
 * @example
 * <PersonHoverCard person={p}><PersonAvatar person={p} /></PersonHoverCard>
 */
export function PersonHoverCard({
  person,
  children,
  className,
}: PersonHoverCardProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <HoverCard open={open} onOpenChange={setOpen}>
      <HoverCardTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={person.name}
            className={cn("rounded-full", className)}
            onClick={() => setOpen((o) => !o)}
          />
        }
      >
        {children}
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-60 p-2">
        <PersonCard person={person} />
      </HoverCardContent>
    </HoverCard>
  );
}

/** Props for `AvatarStack`. */
export interface AvatarStackProps {
  /** The people, in order. */
  people: readonly Person[];
  /**
   * How many avatars show before the rest go behind "+N".
   * @default 5
   */
  max?: number;
  /** The group's accessible name. @default "People" */
  label?: string;
  /** Classes for the group. @default undefined */
  className?: string;
}

/**
 * `AvatarStack` — truly stacked 24px avatars (overlapping, a ring in the background colour) with
 * "+N" past `max`. Hovering an avatar previews that person (`PersonCard`); the stack itself is one
 * button — click, tap or Enter — that lists everyone as `PersonCard` rows. One control for the
 * whole stack keeps a full 24px target without spreading the avatars apart.
 *
 * @example
 * <AvatarStack people={participants} label="Participants" />
 */
export function AvatarStack({
  people,
  max = 5,
  label = "People",
  className,
}: AvatarStackProps) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            data-slot="avatar-stack"
            aria-label={`${label}: ${people.map((p) => p.name).join(", ")}`}
            className={cn(
              "h-auto rounded-full p-0.5 active:not-aria-[haspopup]:translate-y-0",
              className,
            )}
          />
        }
      >
        <AvatarGroup aria-hidden>
          {shown.map((p, i) => (
            <HoverCard key={`${p.name}-${i}`}>
              <HoverCardTrigger
                render={<span className="inline-flex rounded-full" />}
              >
                <PersonAvatar person={p} className="ring-2 ring-background" />
              </HoverCardTrigger>
              <HoverCardContent align="start" className="w-60 p-2">
                <PersonCard person={p} />
              </HoverCardContent>
            </HoverCard>
          ))}
          {rest > 0 ? <AvatarGroupCount>+{rest}</AvatarGroupCount> : null}
        </AvatarGroup>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-2">
        <ul aria-label={label} className="flex flex-col gap-2">
          {people.map((p, i) => (
            <li key={`${p.name}-${i}`}>
              <PersonCard person={p} />
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
