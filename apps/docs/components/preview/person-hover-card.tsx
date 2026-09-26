"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { PersonAvatar, type Person } from "@/components/ui/person-avatar";
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

/** A photo replaces everything; else initials on the person's hue; else the muted fallback. */
export function personHoverCardAvatar(): ReactNode {
  return (
    <Wrapper>
      <div className="flex items-center gap-3">
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
      </div>
    </Wrapper>
  );
}
