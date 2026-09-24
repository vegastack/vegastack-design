"use client";

/**
 * `preview/login-01.tsx` — the docs live preview for the `login-01` registry block.
 *
 * Imports the REAL block source (a cross-package relative import, not a copy): a block is not
 * `shadcn add`-ed into `apps/docs/components/ui/*` the way a component is — there is nothing to
 * add, this demonstrates the pre-install block itself. Its own `@/components/ui/*` imports still
 * resolve to the docs app's copy-in, exactly like every other preview here.
 *
 * The page root fills the small viewport (`min-h-svh`); inside this fixed-height frame `*:min-h-full`
 * makes it fill the frame instead, so the card is centred in what the reader sees rather than in a
 * viewport-tall box the frame clips.
 */

import type { ReactNode } from "react";
import Login01Page from "../../../../packages/ui/registry/blocks/login-01/page";
import { Wrapper } from "./wrapper";

export function login01Demo(): ReactNode {
  return (
    <Wrapper className="block h-136 overflow-hidden p-0 *:min-h-full">
      <Login01Page />
    </Wrapper>
  );
}
