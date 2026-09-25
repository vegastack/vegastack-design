"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import {
  AvatarStack,
  PersonAvatar,
  PersonCard,
  PersonHoverCard,
} from "@/components/ui/person-hover-card";

const PEOPLE = [
  { name: "Asha Rao", email: "asha@acme.com" },
  { name: "Dev Menon", email: "dev@acme.com" },
  { name: "Lena Ortiz", email: "lena@acme.com" },
  { name: "Northwind FM leads" },
  { name: "Yuki Tan", email: "yuki@acme.com" },
  { name: "Omar Haddad", email: "omar@acme.com" },
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
