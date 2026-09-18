"use client";

/**
 * `preview/login-05.tsx` — the docs live preview for the `login-05` registry block.
 *
 * Imports the REAL block source (a cross-package relative import, not a copy): a block is not
 * `shadcn add`-ed into `apps/docs/components/ui/*` the way a component is — there is nothing to
 * add, this demonstrates the pre-install block itself. Its own `@/components/ui/*` imports still
 * resolve to the docs app's copy-in, exactly like every other preview here.
 */

import type { ReactNode } from "react";
import Login05Page from "../../../../packages/ui/registry/blocks/login-05/page";
import { Wrapper } from "./wrapper";

export function login05Demo(): ReactNode {
  return (
    <Wrapper className="block h-136 overflow-hidden p-0">
      <Login05Page />
    </Wrapper>
  );
}
