"use client";

/**
 * `preview/share-01.tsx` — the docs live previews for the `share-01` registry block.
 *
 * Imports the REAL block source (a cross-package relative import, not a copy); its own
 * `@/components/ui/*` imports resolve to the docs app's copy-in, like every other preview here.
 */

import type { ReactNode } from "react";
import Share01Page from "../../../../packages/ui/registry/blocks/share-01/page";
import { ShareDemo } from "../../../../packages/ui/registry/blocks/share-01/components/share-demo";
import { Wrapper } from "./wrapper";

/** The default dialog: people with access and why, general access, the public link off. */
export function share01Demo(): ReactNode {
  return (
    <Wrapper className="block p-0">
      <Share01Page />
    </Wrapper>
  );
}

/** Invite mode: chips chosen, one level for the batch, Notify and a message. */
export function share01Invite(): ReactNode {
  return (
    <Wrapper>
      <ShareDemo
        triggerLabel="Share (invite)"
        invitees={[
          { id: "u5", name: "Lena Ortiz", email: "lena@acme.com", hue: "pink" },
          {
            id: "t2",
            name: "Sales",
            email: "8 members",
            kind: "team",
            hue: "green",
          },
        ]}
      />
    </Wrapper>
  );
}

/** The Publish tab with the item published: the URL, Copy public link, reset, expiry, Stop publishing. */
export function share01PublicLink(): ReactNode {
  return (
    <Wrapper>
      <ShareDemo
        triggerLabel="Share (published)"
        publicLinkOn
        defaultTab="publish"
      />
    </Wrapper>
  );
}

/** An item in a space the viewer cannot see: the row is a statement from `spaceHint`. */
export function share01HiddenSpace(): ReactNode {
  return (
    <Wrapper>
      <ShareDemo
        triggerLabel="Share (someone's My space)"
        hiddenSpace={{ kind: "personal", ownerName: "Priya" }}
      />
    </Wrapper>
  );
}

/** An item in the viewer's own My space: no space level, "Only you and the people above". */
export function share01MySpace(): ReactNode {
  return (
    <Wrapper>
      <ShareDemo triggerLabel="Share (My space)" personal />
    </Wrapper>
  );
}

/** A viewer who cannot change access: no invite row, levels as text, the link to copy. */
export function share01ReadOnly(): ReactNode {
  return (
    <Wrapper>
      <ShareDemo triggerLabel="Share (viewer)" readOnly publicLinkOn />
    </Wrapper>
  );
}

/** General access's level as text for a manager, who can still change the mode. */
export function share01GeneralLevelReadOnly(): ReactNode {
  return (
    <Wrapper>
      <ShareDemo
        triggerLabel="Share (fixed space level)"
        generalLevelReadOnly
      />
    </Wrapper>
  );
}
