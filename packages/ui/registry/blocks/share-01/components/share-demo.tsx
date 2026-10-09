// @vegastack share-01@0.25.7 sha256-FCEYC40l4Lze9ZFs+nYOu3tjn+LBSwXfNz4rjEqOD6A=

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import type { PeopleInputOption } from "@/components/ui/people-input";
import type { SpaceHint } from "@/components/ui/space-picker";
import {
  ShareDialog,
  type ShareDialogProps,
  type ShareEntry,
  type ShareGeneralAccess,
  type SharePublicLink,
} from "./share-dialog";

/* Sample state only — swap each array and callback for the app's own data and actions. */

const LEVELS = [
  {
    value: "full",
    label: "Full access",
    description: "Edit, share and delete",
  },
  { value: "edit", label: "Can edit", description: "Edit, comment and assign" },
  { value: "view", label: "Can view", description: "View and comment" },
];

const PEOPLE: ShareEntry[] = [
  {
    id: "u1",
    person: { name: "Manoj Kumar", email: "manoj@acme.com", hue: "blue" },
    reason: "Creator",
    level: "full",
    readOnly: true,
    you: true,
  },
  {
    id: "u2",
    person: { name: "Priya Shah", email: "priya@acme.com", hue: "green" },
    reason: "Assignee",
    level: "edit",
    readOnly: true,
  },
  {
    id: "u3",
    person: { name: "Rahul Verma", email: "rahul@acme.com", hue: "orange" },
    reason: "Manager of Priya",
    level: "edit",
    readOnly: true,
  },
  {
    id: "u4",
    person: { name: "Anand Iyer", email: "anand@acme.com", hue: "purple" },
    level: "view",
  },
  {
    id: "t1",
    person: {
      name: "Field engineers",
      email: "6 members",
      kind: "team",
      hue: "cyan",
    },
    level: "view",
  },
];

const DIRECTORY: PeopleInputOption[] = [
  { id: "u5", name: "Lena Ortiz", email: "lena@acme.com", hue: "pink" },
  { id: "u6", name: "Omar Haddad", email: "omar@acme.com", hue: "red" },
  { id: "u7", name: "Yuki Tan", email: "yuki@acme.com", hue: "lime" },
  { id: "t2", name: "Sales", email: "8 members", kind: "team", hue: "green" },
  {
    id: "t3",
    name: "Design review",
    email: "4 members",
    kind: "team",
    hue: "magenta",
  },
];

const GENERAL: ShareGeneralAccess = {
  space: { name: "Sales", hue: "green", access: "private" },
  mode: "space",
  level: "edit",
};

function searchDirectory(query: string): Promise<PeopleInputOption[]> {
  const q = query.trim().toLowerCase();
  return Promise.resolve(
    DIRECTORY.filter(
      (option) =>
        option.name.toLowerCase().includes(q) ||
        (option.email ?? "").toLowerCase().includes(q),
    ),
  );
}

/** Props for `ShareDemo`. */
export interface ShareDemoProps {
  /** Start with the public link on. @default false */
  publicLinkOn?: boolean;
  /** Show the dialog as a viewer who cannot change access. @default false */
  readOnly?: boolean;
  /** Start with these people chosen to invite (invite mode). @default undefined */
  invitees?: PeopleInputOption[];
  /** General access's level as text; the mode stays a select. @default false */
  generalLevelReadOnly?: boolean;
  /** Start open. @default false */
  defaultOpen?: boolean;
  /** The trigger's label. @default "Share" */
  triggerLabel?: string;
  /** The tab it opens on. @default "share" */
  defaultTab?: "share" | "publish";
  /** The item lives in the viewer's own My space. @default false */
  personal?: boolean;
  /** The item lives in a space the viewer cannot see, of this kind. @default undefined */
  hiddenSpace?: SpaceHint;
}

/**
 * `ShareDemo` — `ShareDialog` wired to sample state: levels change, rows are removed, the general
 * access and the public link toggle, and invites join the list.
 *
 * @example <ShareDemo />
 */
export function ShareDemo({
  publicLinkOn = false,
  readOnly = false,
  invitees,
  generalLevelReadOnly = false,
  defaultOpen = false,
  triggerLabel = "Share",
  defaultTab = "share",
  personal = false,
  hiddenSpace,
}: ShareDemoProps) {
  const [people, setPeople] = React.useState(PEOPLE);
  const [general, setGeneral] = React.useState<ShareGeneralAccess>(
    hiddenSpace
      ? { ...GENERAL, space: null, spaceHint: hiddenSpace }
      : personal
        ? { ...GENERAL, space: { name: "My space", access: "personal" } }
        : GENERAL,
  );
  const [link, setLink] = React.useState<SharePublicLink | null>(
    publicLinkOn
      ? { url: "https://app.acme.com/s/k3J9xQ2", expires: "7d" }
      : null,
  );
  const onInvite: ShareDialogProps["onInvite"] = ({ invitees, level }) =>
    setPeople((current) => [
      ...current,
      ...invitees
        .filter((invitee) => !current.some((entry) => entry.id === invitee.id))
        .map((invitee) => ({ id: invitee.id, person: invitee, level })),
    ]);
  return (
    <ShareDialog
      defaultOpen={defaultOpen}
      defaultTab={defaultTab}
      trigger={<Button variant="outline">{triggerLabel}</Button>}
      levels={LEVELS}
      people={people}
      canManage={!readOnly}
      search={searchDirectory}
      defaultInvitees={invitees}
      onInvite={onInvite}
      onLevelChange={(id, level) =>
        setPeople((current) =>
          current.map((entry) =>
            entry.id === id ? { ...entry, level } : entry,
          ),
        )
      }
      onRemove={(id) =>
        setPeople((current) => current.filter((entry) => entry.id !== id))
      }
      generalAccess={general}
      generalLevelReadOnly={generalLevelReadOnly}
      onGeneralAccessChange={(next) => setGeneral((g) => ({ ...g, ...next }))}
      publicLink={link}
      onCreatePublicLink={() =>
        setLink({ url: "https://app.acme.com/s/k3J9xQ2", expires: "never" })
      }
      onResetPublicLink={() =>
        setLink((current) =>
          current
            ? { ...current, url: "https://app.acme.com/s/Pw7mT4c" }
            : current,
        )
      }
      onPublicLinkExpiresChange={(expires) =>
        setLink((current) => (current ? { ...current, expires } : current))
      }
      onStopPublicLink={() => setLink(null)}
      linkUrl="https://app.acme.com/tasks/REG-142"
      footerNote="Admins can view this space."
    />
  );
}
