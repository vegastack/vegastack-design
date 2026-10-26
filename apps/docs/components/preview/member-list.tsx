"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/member-list` (dogfoods the registry) → auto-scanned.
import {
  MemberList,
  MemberListAdd,
  type MemberListMember,
} from "@/components/ui/member-list";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  PeoplePicker,
  type PeoplePickerOption,
} from "@/components/ui/people-picker";

const ROLES = [
  {
    value: "full",
    label: "Full access",
    description: "Edit, share and delete",
  },
  { value: "edit", label: "Can edit", description: "Edit and comment" },
  { value: "view", label: "Can view", description: "View and comment" },
];

const MEMBERS: MemberListMember[] = [
  {
    id: "u1",
    person: { name: "Manoj Kumar", hue: "blue" },
    description: "Owner",
    role: "full",
    locked: true,
    lockedReason: "Set by role: Owner",
    you: true,
  },
  {
    id: "t1",
    person: { name: "Product team", kind: "team", hue: "cyan" },
    description: "2 people",
    role: "full",
  },
  { id: "u2", person: { name: "Sanjay Desai", hue: "green" }, role: "edit" },
  { id: "u3", person: { name: "Priya Shah", hue: "orange" }, role: "view" },
];

const DIRECTORY: PeoplePickerOption[] = [
  { id: "u5", name: "Lena Ortiz", email: "lena@acme.com", hue: "pink" },
  { id: "u6", name: "Omar Haddad", email: "omar@acme.com", hue: "red" },
  { id: "t2", name: "Sales", email: "8 members", kind: "team", hue: "green" },
];

const search = async (query: string) => ({
  items: DIRECTORY.filter((person) =>
    person.name.toLowerCase().includes(query.trim().toLowerCase()),
  ),
});

/** The add row, then 36px rows: avatar · name and a note · role chip · ⋯ with Remove. */
export function memberList(): ReactNode {
  const [members, setMembers] = React.useState(MEMBERS);
  const [chosen, setChosen] = React.useState<PeoplePickerOption[]>([]);
  const [role, setRole] = React.useState("edit");
  return (
    <Wrapper className="block">
      <MemberList
        className="mx-auto w-full max-w-lg"
        add={
          <MemberListAdd
            picker={
              <PeoplePicker
                multiple
                value={chosen}
                onValueChange={setChosen}
                search={search}
                placeholder="Add people or teams…"
                aria-label="Add people or teams"
              />
            }
            roles={ROLES}
            role={role}
            onRoleChange={setRole}
            disabled={chosen.length === 0}
            onAdd={() => {
              setMembers((current) => [
                ...current,
                ...chosen.map((person) => ({
                  id: person.id,
                  person,
                  description:
                    person.kind === "team" ? person.email : undefined,
                  role,
                })),
              ]);
              setChosen([]);
            }}
          />
        }
        members={members}
        roles={ROLES}
        onRoleChange={(id, next) =>
          setMembers((current) =>
            current.map((member) =>
              member.id === id ? { ...member, role: next } : member,
            ),
          )
        }
        onRemove={(id) =>
          setMembers((current) => current.filter((member) => member.id !== id))
        }
      />
    </Wrapper>
  );
}

/** A viewer who cannot manage: roles as text, no menus. Without `roles`, a role is plain text. */
export function memberListReadOnly(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-6">
      <MemberList
        className="mx-auto w-full max-w-lg"
        members={MEMBERS}
        roles={ROLES}
        canManage={false}
      />
      <MemberList
        className="mx-auto w-full max-w-lg"
        labels={{ list: "Team members" }}
        members={[
          { id: "u2", person: { name: "Sanjay Desai" }, role: "Lead" },
          { id: "u3", person: { name: "Priya Shah" }, role: "Member" },
        ]}
      />
    </Wrapper>
  );
}

/** More than eight rows scroll inside the list; `menuItems` adds to a row's ⋯ menu. */
export function memberListScrolling(): ReactNode {
  const many: MemberListMember[] = Array.from({ length: 14 }, (_, i) => ({
    id: `p${i}`,
    person: { name: `Invitee ${i + 1}` },
    description: i % 3 === 0 ? "Invited" : undefined,
    role: "view",
  }));
  return (
    <Wrapper className="block">
      <MemberList
        className="mx-auto w-full max-w-lg"
        members={many}
        roles={ROLES}
        onRemove={() => {}}
        menuItems={(member) =>
          member.description === "Invited" ? (
            <DropdownMenuItem>Resend invite</DropdownMenuItem>
          ) : null
        }
      />
    </Wrapper>
  );
}
