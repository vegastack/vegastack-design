"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { UserCheck, UserMinus } from "lucide-react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import { PermissionMenu } from "@/components/ui/permission-menu";
import {
  PeoplePicker,
  PeoplePickerContent,
  type PeoplePickerOption,
  type PeoplePickerSearch,
} from "@/components/ui/people-picker";

const DIRECTORY: PeoplePickerOption[] = [
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
    active: false,
  },
  { id: "t1", name: "Sales", kind: "team", memberCount: 8, hue: "green" },
  {
    id: "t2",
    name: "Field engineers",
    kind: "team",
    memberCount: 6,
    hue: "cyan",
  },
];

const PEOPLE = DIRECTORY.filter((o) => o.kind !== "team");

/** A stand-in for the app's directory search: a short delay, then a case-insensitive match. */
function searchIn(list: PeoplePickerOption[]): PeoplePickerSearch {
  return (query, { signal }) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const q = query.trim().toLowerCase();
        resolve({
          items: list.filter(
            (o) =>
              o.name.toLowerCase().includes(q) ||
              (o.email ?? "").toLowerCase().includes(q),
          ),
        });
      }, 400);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(signal.reason);
      });
    });
}

const LEVELS = [
  { value: "edit", label: "Can edit" },
  { value: "view", label: "Can view" },
];

/** One person, with "Assign to me" and "Unassign" in the footer; the viewer reads "(you)". */
export function peoplePicker(): ReactNode {
  const [value, setValue] = React.useState<PeoplePickerOption | null>(null);
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto w-full max-w-xs">
        <PeoplePicker
          aria-label="Assignee"
          placeholder="Unassigned"
          value={value}
          onValueChange={setValue}
          search={searchIn(PEOPLE)}
          viewerId="u2"
          actions={[
            {
              label: "Assign to me",
              icon: <UserCheck aria-hidden />,
              disabled: value?.id === "u2",
              onSelect: () => setValue(PEOPLE[1]!),
            },
            {
              label: "Unassign",
              icon: <UserMinus aria-hidden />,
              disabled: !value,
              onSelect: () => setValue(null),
            },
          ]}
        />
      </div>
    </Wrapper>
  );
}

/** Several people and teams beside the batch's level and Add — one height for all three. */
export function peoplePickerMultiple(): ReactNode {
  const [value, setValue] = React.useState<PeoplePickerOption[]>([]);
  const [level, setLevel] = React.useState("edit");
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto flex w-full max-w-md items-start gap-2">
        <div className="min-w-0 flex-1">
          <PeoplePicker
            multiple
            aria-label="Add people or teams"
            placeholder="Add people or teams…"
            value={value}
            onValueChange={setValue}
            search={searchIn(DIRECTORY)}
          />
        </div>
        <PermissionMenu
          variant="outline"
          value={level}
          options={LEVELS}
          onValueChange={setLevel}
          aria-label="Access"
        />
        <Button disabled={value.length === 0}>Add</Button>
      </div>
    </Wrapper>
  );
}

/** The three trigger sizes, each as tall as a Button of the same size. */
export function peoplePickerSizes(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <div className="mx-auto flex w-full max-w-md flex-col gap-3">
        {(["sm", "default", "lg"] as const).map((size) => (
          <div key={size} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <PeoplePicker
                size={size}
                aria-label={`Owner (${size})`}
                value={PEOPLE[0]!}
                onValueChange={() => {}}
                options={PEOPLE}
              />
            </div>
            <Button size={size} variant="outline">
              Save
            </Button>
          </div>
        ))}
      </div>
    </Wrapper>
  );
}

/** The popover body on its own, for a trigger the host owns (a record pill). */
export function peoplePickerContent(): ReactNode {
  const [chosen, setChosen] = React.useState<string[]>(["u1"]);
  return (
    <Wrapper>
      <div className="w-72 rounded-lg border border-border bg-popover">
        <PeoplePickerContent
          options={DIRECTORY}
          includeInactive
          selected={chosen}
          viewerId="u2"
          onSelect={(o) => setChosen([o.id])}
        />
      </div>
    </Wrapper>
  );
}
