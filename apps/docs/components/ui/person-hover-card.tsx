// @vegastack person-hover-card@0.114.0 sha256-UwyLnhT2u98btDcpbk3lC51dHyDQpLxfGJESFT8h0h8=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { Button } from "@/components/ui/button";
import {
  PersonAvatar as BasePersonAvatar,
  PersonName,
  AgentShapeLayer,
  agentShapeTarget,
  agentShapeStyle,
  personAccessibleName,
  type Person as BasePerson,
} from "@/components/ui/person-avatar";
import { PersonBadge } from "@/components/ui/searchable-select";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

/* ------------------------------------------------------------------------------------------------
 * PersonHoverCard — a person behind an avatar: hover or focus (tap on touch) opens a card with a
 * 32px avatar (`PersonAvatar`: the photo, else initials on the person's hue) with the name and a
 * muted email stacked beside it (`MembersStack` stacks several and lists them). A person without
 * an account (a free-text participant) shows initials and just the name. A team (`kind: "team"`)
 * stacks and lists the same way, drawn as its rounded-square team tile; an agent
 * (`kind: "agent"`) as its hexagon, named "Claude Code for Manoj".
 * `PersonHoverCardProvider` lets the host draw a richer card for some of them (an agent's).
 * ----------------------------------------------------------------------------------------------*/

/** A person — re-exported from `person-avatar`, their home, for existing imports. */
export type Person = BasePerson;

/** `PersonAvatar` — re-exported from `person-avatar`, its home, for existing imports. @example <PersonAvatar person={{ name: "Asha Rao", hue: "blue" }} /> */
export const PersonAvatar = BasePersonAvatar;

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
          <PersonName
            person={person}
            className="text-sm font-medium wrap-anywhere"
          />
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

/**
 * What a `PersonHoverCardProvider` hands every `PersonHoverCard` below it: `card` returns the body
 * for a person the host knows more about — an agent's `AgentCard`, say — or `null` for the
 * standard `PersonCard`. `close` shuts the card (call it before navigating away). Return an element
 * (cheap to make): it renders only while the card is open.
 */
export interface PersonHoverCardResolver {
  card: (person: Person, close: () => void) => React.ReactNode | null;
}

const PersonHoverCardContext =
  React.createContext<PersonHoverCardResolver | null>(null);

/**
 * `PersonHoverCardProvider` — lets the host draw the card behind some people's names and avatars
 * (an agent's state and Open agent) in every `PersonHoverCard` below it — the comments' authors
 * and the activity feed's actors among them. Wrap the app (or one surface) once.
 *
 * @example
 * <PersonHoverCardProvider value={{ card: (p) => (p.kind === "agent" ? <AgentCard agent={p} /> : null) }}>…</PersonHoverCardProvider>
 */
export function PersonHoverCardProvider({
  value,
  children,
}: {
  value: PersonHoverCardResolver;
  children: React.ReactNode;
}) {
  return (
    <PersonHoverCardContext.Provider value={value}>
      {children}
    </PersonHoverCardContext.Provider>
  );
}

/** Props for `PersonHoverCard`. */
export interface PersonHoverCardProps {
  /** The person. */
  person: Person;
  /**
   * The trigger — a `PersonAvatar` (`trigger="avatar"`) or the person's name (`trigger="name"`).
   */
  children: React.ReactNode;
  /**
   * `avatar` — the children sit in a round ghost button named by the person. `name` — the
   * children are inline text (a comment's author, an activity's actor) in a plain text button.
   * @default "avatar"
   */
  trigger?: "avatar" | "name";
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
  trigger = "avatar",
  className,
}: PersonHoverCardProps) {
  const [open, setOpen] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  // Focus opens the card; Enter then steps into it, so a host's link in it is reachable by keyboard.
  const press = (event: React.MouseEvent) => {
    const action =
      event.detail === 0 && open
        ? contentRef.current?.querySelector<HTMLElement>("a[href],button")
        : null;
    if (action) action.focus();
    else setOpen((o) => !o);
  };
  const resolver = React.useContext(PersonHoverCardContext);
  // Kept while the card closes, so its exit animation keeps the host's body and width.
  const custom = resolver?.card(person, () => setOpen(false)) ?? null;
  return (
    <HoverCard open={open} onOpenChange={setOpen}>
      <HoverCardTrigger
        render={
          trigger === "name" ? (
            <button
              type="button"
              data-slot="person-hover-card-name"
              className={cn(
                // A name in a sentence (a button computes `inline` as `inline-block`): a target in
                // a block of text, sized by its line (WCAG 2.2 §2.5.8's inline exception). Where
                // a flex row blockifies it, the host pads it to 24px.
                "inline min-w-0 cursor-default rounded-inline text-start font-medium text-foreground",
                className,
              )}
              onClick={press}
            />
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={personAccessibleName(person)}
              // An agent's hover fill and focus tint follow its hexagon, never a circle.
              style={person.kind === "agent" ? agentShapeStyle : undefined}
              className={cn(
                person.kind === "team"
                  ? "rounded-tile"
                  : person.kind === "agent" && agentShapeTarget,
                className,
              )}
              onClick={press}
            />
          )
        }
      >
        {trigger === "avatar" && person.kind === "agent" ? (
          <AgentShapeLayer />
        ) : null}
        {children}
      </HoverCardTrigger>
      <HoverCardContent
        ref={contentRef}
        align="start"
        className={custom ? "w-72 p-2.5" : "w-60 p-2"}
      >
        {custom ?? <PersonCard person={person} />}
      </HoverCardContent>
    </HoverCard>
  );
}
