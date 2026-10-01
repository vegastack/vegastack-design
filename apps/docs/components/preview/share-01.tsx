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

/** The public link on: the URL with copy and reset, the expiry, and Stop sharing. */
export function share01PublicLink(): ReactNode {
  return (
    <Wrapper>
      <ShareDemo triggerLabel="Share (public link on)" publicLinkOn />
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
