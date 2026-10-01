"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import {
  PeopleInput,
  type PeopleInputOption,
} from "@/components/ui/people-input";

const DIRECTORY: PeopleInputOption[] = [
  { id: "u1", name: "Asha Rao", email: "asha@acme.com", hue: "blue" },
  {
    id: "u2",
    name: "Dev Menon",
    email: "dev@acme.com",
    hue: "green",
    image: "/preview/avatar-2.svg",
  },
  { id: "u3", name: "Lena Ortiz", email: "lena@acme.com", hue: "purple" },
  {
    id: "u4",
    name: "Ravi Kumar",
    email: "ravi@acme.com",
    hue: "red",
    badge: "Inactive",
  },
  { id: "t1", name: "Sales", email: "8 members", kind: "team", hue: "green" },
  {
    id: "t2",
    name: "Field engineers",
    email: "6 members",
    kind: "team",
    hue: "cyan",
  },
];

/** A stand-in for the app's directory search: a short delay, then a case-insensitive match. */
function search(query: string, { signal }: { signal: AbortSignal }) {
  return new Promise<PeopleInputOption[]>((resolve, reject) => {
    const timer = setTimeout(() => {
      const q = query.trim().toLowerCase();
      resolve(
        DIRECTORY.filter(
          (o) =>
            o.name.toLowerCase().includes(q) ||
            (o.email ?? "").toLowerCase().includes(q),
        ),
      );
    }, 250);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}

/** Type to search; pick people and teams; Backspace in the empty field removes the last chip. */
export function peopleInput(): ReactNode {
  const [value, setValue] = React.useState<PeopleInputOption[]>([]);
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto w-full max-w-sm">
        <PeopleInput value={value} onValueChange={setValue} search={search} />
      </div>
    </Wrapper>
  );
}

/** Chosen people and a team as chips; the team chip carries the team icon. */
export function peopleInputChips(): ReactNode {
  const [value, setValue] = React.useState<PeopleInputOption[]>([
    DIRECTORY[0]!,
    DIRECTORY[4]!,
  ]);
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto w-full max-w-sm">
        <PeopleInput value={value} onValueChange={setValue} search={search} />
      </div>
    </Wrapper>
  );
}

/** Disabled while an invite sends; a search that finds nobody says so. */
export function peopleInputStates(): ReactNode {
  const [value, setValue] = React.useState<PeopleInputOption[]>([
    DIRECTORY[2]!,
  ]);
  const [other, setOther] = React.useState<PeopleInputOption[]>([]);
  return (
    <Wrapper className="flex-col items-stretch">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        <PeopleInput
          value={value}
          onValueChange={setValue}
          search={search}
          disabled
        />
        <PeopleInput
          value={other}
          onValueChange={setOther}
          search={() => Promise.resolve([])}
          placeholder="Add reviewers…"
          aria-label="Add reviewers"
          emptyText="No one matches — try an email"
        />
      </div>
    </Wrapper>
  );
}
