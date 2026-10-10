"use client";

/**
 * `preview/share-dialog.tsx` — the docs live previews for the `share-dialog` component.
 *
 * The default preview is the `share-01` block's demo (a cross-package relative import of the real
 * block source), which wires the dialog to sample state; the rest compose `ShareDialog` directly.
 */

import type { ReactNode } from "react";
import { ShareDemo } from "../../../../packages/ui/registry/blocks/share-01/components/share-demo";
import { Button } from "@/components/ui/button";
import { InfoHint } from "@/components/ui/info-hint";
import {
  ShareDialog,
  type ShareEntry,
  type ShareGeneralAccess,
} from "@/components/ui/share-dialog";
import { Wrapper } from "./wrapper";

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
    id: "u4",
    person: { name: "Anand Iyer", email: "anand@acme.com", hue: "purple" },
    level: "view",
  },
];

const GENERAL: ShareGeneralAccess = {
  space: { name: "Sales", hue: "green", access: "private" },
  mode: "space",
  level: "edit",
};

/** The dialog wired to sample state: invite, change levels, space access and publish. */
export function shareDialog(): ReactNode {
  return (
    <Wrapper>
      <ShareDemo />
    </Wrapper>
  );
}

/** `canPublish={false}`: a manager who may change access but not publish sees the link to copy. */
export function shareDialogCanPublish(): ReactNode {
  return (
    <Wrapper>
      <ShareDialog
        trigger={<Button variant="outline">Share (cannot publish)</Button>}
        defaultTab="publish"
        levels={LEVELS}
        people={PEOPLE}
        canPublish={false}
        search={() => Promise.resolve([])}
        generalAccess={GENERAL}
        publicLink={{ url: "https://app.acme.com/s/k3J9xQ2", expires: "7d" }}
        linkUrl="https://app.acme.com/tasks/REG-142"
      />
    </Wrapper>
  );
}

/** `hints`: an `InfoHint` beside the People, Space access and Publish labels. */
export function shareDialogHints(): ReactNode {
  return (
    <Wrapper>
      <ShareDialog
        trigger={<Button variant="outline">Share (with hints)</Button>}
        levels={LEVELS}
        people={PEOPLE}
        search={() => Promise.resolve([])}
        generalAccess={GENERAL}
        linkUrl="https://app.acme.com/tasks/REG-142"
        hints={{
          people: (
            <InfoHint label="About access">
              People get access when they are invited, or by their role on the
              item.
            </InfoHint>
          ),
          general: (
            <InfoHint label="About space access">
              Members of the item&apos;s space can open it unless only invited
              people can.
            </InfoHint>
          ),
          publish: (
            <InfoHint label="About publishing">
              Anyone with the public link can view the item without signing in.
            </InfoHint>
          ),
        }}
      />
    </Wrapper>
  );
}
