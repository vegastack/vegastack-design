"use client";

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wrapper } from "./wrapper";
import {
  PersonAvatar,
  PersonName,
  type Person,
  type PersonAvatarSize,
} from "@/components/ui/person-avatar";
import { AgentStateBadge, AgentStateRing } from "@/components/ui/agent-panel";
import {
  AvatarStack,
  PersonCard,
  PersonHoverCard,
} from "@/components/ui/person-hover-card";

const PEOPLE: Person[] = [
  { name: "Asha Rao", email: "asha@acme.com", hue: "blue" },
  {
    name: "Dev Menon",
    email: "dev@acme.com",
    hue: "green",
    image: "/preview/avatar-2.svg",
  },
  { name: "Lena Ortiz", email: "lena@acme.com", hue: "purple" },
  { name: "Northwind FM leads" },
  { name: "Yuki Tan", email: "yuki@acme.com", hue: "orange" },
  { name: "Omar Haddad", email: "omar@acme.com", hue: "cyan" },
  { name: "Ines Costa" },
];

export function personHoverCard(): ReactNode {
  return (
    <Wrapper>
      <AvatarStack people={PEOPLE} label="Participants" />
    </Wrapper>
  );
}

export function personHoverCardSingle(): ReactNode {
  const person = PEOPLE[0]!;
  return (
    <Wrapper>
      <PersonHoverCard person={person}>
        <PersonAvatar person={person} />
      </PersonHoverCard>
    </Wrapper>
  );
}

export function personHoverCardCard(): ReactNode {
  return (
    <Wrapper>
      <div className="flex flex-col gap-4">
        <PersonCard person={PEOPLE[0]!} />
        <PersonCard person={PEOPLE[3]!} />
        <PersonCard person={PEOPLE[1]!} layout="row" />
      </div>
    </Wrapper>
  );
}

export function personHoverCardInactive(): ReactNode {
  const person: Person = {
    name: "Ravi Kumar",
    email: "ravi@acme.com",
    hue: "red",
    badge: "Inactive",
  };
  return (
    <Wrapper>
      <div className="flex items-center gap-4">
        <PersonHoverCard person={person}>
          <PersonAvatar person={person} />
        </PersonHoverCard>
        <PersonCard person={person} />
      </div>
    </Wrapper>
  );
}

/**
 * A photo replaces everything; else initials on the person's hue; else the muted fallback. A photo
 * that fails to load falls back to the initials. The second row is the three sizes with a photo.
 */
export function personHoverCardAvatar(): ReactNode {
  return (
    <Wrapper className="flex-col">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <PersonAvatar
          size="lg"
          person={{
            name: "Ada Lovelace",
            hue: "pink",
            image: "/preview/avatar-1.svg",
          }}
        />
        <PersonAvatar size="lg" person={{ name: "Asha Rao", hue: "blue" }} />
        <PersonAvatar size="lg" person={{ name: "Lena", hue: "magenta" }} />
        <PersonAvatar size="lg" person={{ name: "", email: "ops@acme.com" }} />
        <PersonAvatar size="lg" person={{ name: "Northwind FM leads" }} />
        <PersonAvatar
          size="lg"
          person={{ name: "Grace Hopper", hue: "green", image: "/missing.png" }}
        />
      </div>
      <div className="flex items-center gap-3">
        {(["sm", "default", "lg"] as const).map((size) => (
          <PersonAvatar
            key={size}
            size={size}
            person={{ name: "Dev Menon", image: "/preview/avatar-2.svg" }}
          />
        ))}
      </div>
    </Wrapper>
  );
}

/** A team stacks and lists with the people, drawn as its rounded-square team tile. */
export function personHoverCardTeam(): ReactNode {
  const shared: Person[] = [
    { name: "Manoj Kumar", email: "manoj@acme.com", hue: "blue" },
    { name: "Priya Shah", email: "priya@acme.com", hue: "green" },
    { name: "Sales", email: "8 members", kind: "team", hue: "green" },
    { name: "Field engineers", email: "6 members", kind: "team", hue: "cyan" },
  ];
  return (
    <Wrapper>
      <AvatarStack people={shared} label="Shared with" />
      <PersonAvatar size="lg" person={shared[2]!} />
      <PersonCard person={shared[3]!} />
    </Wrapper>
  );
}

/** Five of fourteen members loaded: `total` keeps "+N" honest; `footer` ends the list with an action. */
export function personHoverCardTotal(): ReactNode {
  return (
    <Wrapper>
      <AvatarStack
        people={PEOPLE.slice(0, 5)}
        total={14}
        max={3}
        label="Members"
        footer={
          <Button variant="ghost" size="sm" className="w-full justify-start">
            Manage access
          </Button>
        }
      />
    </Wrapper>
  );
}

/** `trigger="name"`: the person's name, inline in a sentence, opens their card. */
export function personHoverCardName(): ReactNode {
  const person = PEOPLE[0]!;
  return (
    <Wrapper>
      <p className="text-sm text-muted-foreground">
        <PersonHoverCard person={person} trigger="name">
          {person.name}
        </PersonHoverCard>{" "}
        assigned the task to{" "}
        <PersonHoverCard person={PEOPLE[2]!} trigger="name">
          {PEOPLE[2]!.name}
        </PersonHoverCard>
      </p>
    </Wrapper>
  );
}

const SIZES: readonly PersonAvatarSize[] = [
  "2xs",
  "xs",
  "sm",
  "default",
  "lg",
  "xl",
];

/* Sample marks for the docs only: abstract shapes, not any real provider's logo. */
const ORBIT = { src: "/preview/agent-mark-orbit.svg" };
const KNOT = { src: "/preview/agent-mark-knot.svg", tile: "light" } as const;
const TILE = { src: "/preview/agent-mark-tile.svg", fit: "fill" } as const;

const AGENTS: Person[] = [
  { name: "Review agent", kind: "agent", for: "Manoj" },
  { name: "Orbit", kind: "agent", for: "Asha", mark: ORBIT },
  { name: "Knot", kind: "agent", for: "Dev", mark: KNOT },
  { name: "Atlas", kind: "agent", for: "Lena", mark: TILE },
  { name: "Assistant", kind: "agent", hue: "blue", mark: <Sparkles /> },
];

/**
 * Every size step, people beside agents: a photo, initials on a hue, a team, an agent's icon, an
 * inset mark and a full-bleed mark. Initials, icons and marks scale with the step.
 */
export function personHoverCardSizes(): ReactNode {
  const rows: { label: string; person: Person }[] = [
    {
      label: "Photo",
      person: { name: "Dev Menon", image: "/preview/avatar-2.svg" },
    },
    { label: "Initials", person: { name: "Asha Rao", hue: "blue" } },
    {
      label: "Team",
      person: { name: "Sales", kind: "team", hue: "green" },
    },
    { label: "Agent", person: AGENTS[0]! },
    { label: "Inset mark", person: AGENTS[1]! },
    { label: "Full-bleed mark", person: AGENTS[3]! },
  ];
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="mx-auto grid grid-cols-[repeat(6,auto)] items-center gap-x-3 gap-y-3 text-xs text-muted-foreground sm:grid-cols-[auto_repeat(6,minmax(0,1fr))] sm:gap-x-4">
        <span className="max-sm:hidden" />
        {SIZES.map((size) => (
          <span key={size} className="text-center">
            {size}
          </span>
        ))}
        {rows.map(({ label, person }) => (
          <div key={label} className="contents">
            <span className="whitespace-nowrap max-sm:hidden">{label}</span>
            {SIZES.map((size) => (
              <span key={size} className="flex justify-center">
                <PersonAvatar person={person} size={size} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </Wrapper>
  );
}

/**
 * An agent is a soft hexagon. With no mark it shows the bot (or, with `agentFallback="initials"`,
 * its initials) on its hue; a mark is an image or a node, inset on a neutral tile, on a light tile
 * for a dark-ink logo, or full-bleed. A mark that fails to load falls back to the bot.
 */
export function personHoverCardAgents(): ReactNode {
  return (
    <Wrapper className="flex-col">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <PersonAvatar size="lg" person={AGENTS[0]!} />
        <PersonAvatar
          size="lg"
          person={{ name: "Build bot", kind: "agent", hue: "cyan" }}
          agentFallback="initials"
        />
        <PersonAvatar size="lg" person={AGENTS[1]!} />
        <PersonAvatar size="lg" person={AGENTS[2]!} />
        <PersonAvatar size="lg" person={AGENTS[3]!} />
        <PersonAvatar size="lg" person={AGENTS[4]!} />
        <PersonAvatar
          size="lg"
          person={{
            name: "Broken mark",
            kind: "agent",
            mark: { src: "/missing-mark.png" },
          }}
        />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <PersonAvatar size="lg" person={{ name: "Asha Rao", hue: "blue" }} />
        <PersonAvatar
          size="lg"
          person={{ name: "Ada Lovelace", image: "/preview/avatar-1.svg" }}
        />
        <PersonHoverCard person={AGENTS[1]!}>
          <PersonAvatar person={AGENTS[1]!} />
        </PersonHoverCard>
        <PersonAvatar size="lg" person={AGENTS[0]!} />
        <PersonAvatar
          size="lg"
          person={{ name: "Sales", kind: "team", hue: "green" }}
        />
        <PersonAvatar
          size="lg"
          person={{ name: "Acme Lighting", kind: "workspace", hue: "orange" }}
        />
      </div>
    </Wrapper>
  );
}

/** People and agents in one stack: each hexagon gets a halo in its own shape, so overlaps stay clean. */
export function personHoverCardMixed(): ReactNode {
  const collaborators: Person[] = [
    { name: "Manoj Kumar", email: "manoj@acme.com", hue: "blue" },
    AGENTS[1]!,
    {
      name: "Priya Shah",
      email: "priya@acme.com",
      image: "/preview/avatar-3.svg",
    },
    AGENTS[0]!,
    AGENTS[3]!,
    { name: "Lena Ortiz", email: "lena@acme.com", hue: "purple" },
    AGENTS[2]!,
  ];
  return (
    <Wrapper>
      <AvatarStack people={collaborators} max={6} label="Collaborators" />
    </Wrapper>
  );
}

/**
 * `indicator` puts a presence dot or a state icon at the corner, sized to the step; an
 * `AgentStateRing` follows the hexagon. In a dense row, `AgentStateBadge iconOnly` keeps the state
 * as an icon with its word in a tooltip, and a long state word truncates.
 */
export function personHoverCardIndicators(): ReactNode {
  const dot = <span className="size-full rounded-full bg-success" />;
  return (
    <Wrapper className="flex-col">
      <div className="flex flex-wrap items-center justify-center gap-4">
        {SIZES.map((size) => (
          <span key={size} className="flex items-center gap-2">
            <PersonAvatar
              size={size}
              person={{ name: "Asha Rao", hue: "blue" }}
              indicator={dot}
            />
            <PersonAvatar size={size} person={AGENTS[1]!} indicator={dot} />
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <AgentStateRing state="question">
          <PersonAvatar size="default" person={AGENTS[0]!} />
        </AgentStateRing>
        <AgentStateRing state="failed">
          <PersonAvatar size="default" person={AGENTS[1]!} />
        </AgentStateRing>
        <AgentStateRing state="question">
          <PersonAvatar
            size="default"
            person={{ name: "Asha Rao", hue: "blue" }}
          />
        </AgentStateRing>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-1 text-xs">
        <div className="flex h-5 min-w-0 items-center gap-1.5">
          <PersonAvatar size="2xs" person={AGENTS[1]!} />
          <PersonName
            person={AGENTS[1]!}
            agentLabel={false}
            className="min-w-0 truncate"
          />
          <AgentStateBadge state="working" iconOnly />
        </div>
        <div className="flex h-5 min-w-0 items-center gap-1.5">
          <PersonAvatar size="2xs" person={AGENTS[0]!} />
          <PersonName
            person={AGENTS[0]!}
            agentLabel={false}
            className="min-w-0 truncate"
          />
          <AgentStateBadge state="question" iconOnly />
        </div>
        {[240, 170, 120].map((width) => (
          <div
            key={width}
            className="flex h-6 min-w-0 items-center gap-1.5"
            style={{ width }}
          >
            <PersonAvatar size="xs" person={AGENTS[3]!} />
            <span className="min-w-0 truncate">Atlas reviewer</span>
            <AgentStateBadge
              state="approval"
              stateLabels={{ approval: "Waiting for your approval" }}
            />
          </div>
        ))}
      </div>
    </Wrapper>
  );
}

/* A sample mark with a dark-theme variant and a small glyph for the row steps (abstract, no brand). */
const ORBIT_THEMED = {
  src: "/preview/agent-mark-orbit.svg",
  srcDark: "/preview/agent-mark-orbit-dark.svg",
  small: { src: "/preview/agent-mark-orbit-small.svg" },
};

/**
 * A mark with a dark-theme variant (`srcDark`) and a small glyph (`small`) for the 16 and 20px
 * steps; `small: false` draws the bot there instead, for a mark that turns to mush when small.
 */
export function personHoverCardMarks(): ReactNode {
  const rows: { label: string; person: Person }[] = [
    {
      label: "Theme variant + small glyph",
      person: { name: "Orbit", kind: "agent", mark: ORBIT_THEMED },
    },
    {
      label: "Bot at the row steps",
      person: {
        name: "Knot",
        kind: "agent",
        mark: { ...KNOT, small: false },
      },
    },
  ];
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="mx-auto grid grid-cols-[repeat(6,auto)] items-center gap-x-3 gap-y-3 text-xs text-muted-foreground sm:grid-cols-[auto_repeat(6,minmax(0,1fr))] sm:gap-x-4">
        <span className="max-sm:hidden" />
        {SIZES.map((size) => (
          <span key={size} className="text-center">
            {size}
          </span>
        ))}
        {rows.map(({ label, person }) => (
          <div key={label} className="contents">
            <span className="whitespace-nowrap max-sm:hidden">{label}</span>
            {SIZES.map((size) => (
              <span key={size} className="flex justify-center">
                <PersonAvatar person={person} size={size} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </Wrapper>
  );
}

/**
 * `actingFor`: the member an agent works for rides on its hexagon as a small circle at the
 * bottom-end corner — the agent leads. From `sm` up; the row steps leave it out. In a picker the
 * name reads compact, "Orbit · Asha", with the "Agent" label.
 */
export function personHoverCardActingFor(): ReactNode {
  const asha = { name: "Asha Rao", hue: "blue" as const };
  const dev = { name: "Dev Menon", image: "/preview/avatar-2.svg" };
  return (
    <Wrapper className="flex-col">
      <div className="flex flex-wrap items-end justify-center gap-4">
        {(["sm", "default", "lg", "xl"] as const).map((size) => (
          <PersonAvatar
            key={size}
            size={size}
            person={AGENTS[1]!}
            actingFor={asha}
          />
        ))}
        <PersonAvatar size="lg" person={AGENTS[0]!} actingFor={dev} />
      </div>
      <div className="flex flex-col items-start gap-1 text-sm">
        <span className="flex items-center gap-2">
          <PersonAvatar size="default" person={AGENTS[1]!} actingFor={asha} />
          <PersonName person={AGENTS[1]!} />
        </span>
        <span className="flex items-center gap-2">
          <PersonAvatar size="sm" person={AGENTS[1]!} />
          <PersonName person={AGENTS[1]!} variant="compact" agentLabel />
        </span>
      </div>
    </Wrapper>
  );
}
