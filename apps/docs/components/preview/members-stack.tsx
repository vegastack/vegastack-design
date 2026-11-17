"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  MembersStack,
  type MembersStackPerson,
} from "@/components/ui/members-stack";
import { Wrapper } from "./wrapper";

const PEOPLE: MembersStackPerson[] = [
  { name: "Manoj Kumar", email: "manoj@acme.com", hue: "blue", you: true },
  { name: "Asha Rao", email: "asha@acme.com", hue: "green", active: true },
  {
    name: "Dev Menon",
    email: "dev@acme.com",
    image: "/preview/avatar-2.svg",
  },
  { name: "Lena Ortiz", email: "lena@acme.com", hue: "purple" },
  { name: "Yuki Tan", email: "yuki@acme.com", hue: "orange" },
];

/** Five loaded of 23: three faces (Asha, active now, first; you never first), then "+20". */
export function membersStack(): ReactNode {
  return (
    <Wrapper>
      <MembersStack
        people={PEOPLE}
        total={23}
        footer={
          <Button variant="ghost" size="sm" className="w-full justify-start">
            Manage members
          </Button>
        }
      />
    </Wrapper>
  );
}

/** Every combination, top to bottom: only you, one other, three, many, 140, a space, a team. */
export function membersStackCases(): ReactNode {
  const rows: { label: string; node: ReactNode }[] = [
    { label: "Only you", node: <MembersStack audience="only-you" /> },
    {
      label: "You and one other",
      node: <MembersStack people={PEOPLE.slice(0, 2)} />,
    },
    { label: "Three", node: <MembersStack people={PEOPLE.slice(0, 3)} /> },
    { label: "Four or more", node: <MembersStack people={PEOPLE} /> },
    {
      label: "Past 99",
      node: <MembersStack people={PEOPLE} total={140} />,
    },
    {
      label: "A whole space",
      node: (
        <MembersStack
          audience="everyone"
          group={{ name: "General", kind: "workspace", hue: "blue" }}
        />
      ),
    },
    {
      label: "A team",
      node: (
        <MembersStack
          audience="team"
          total={8}
          group={{ name: "Sales", kind: "team", hue: "green" }}
        />
      ),
    },
  ];
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="mx-auto grid grid-cols-[auto_auto] items-center gap-x-6 gap-y-2 text-sm">
        {rows.map(({ label, node }) => (
          <div key={label} className="contents">
            <span className="text-muted-foreground">{label}</span>
            <span className="flex">{node}</span>
          </div>
        ))}
      </div>
    </Wrapper>
  );
}

/** A list row's Members cell: the stack, then the count 8px on. */
export function membersStackRow(): ReactNode {
  return (
    <Wrapper className="flex-col items-start">
      <MembersStack people={PEOPLE} total={23} count />
      <MembersStack people={PEOPLE.slice(0, 1)} count />
    </Wrapper>
  );
}
