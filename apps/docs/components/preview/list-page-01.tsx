"use client";

/**
 * `preview/list-page-01.tsx` — the docs live preview for the `list-page-01` registry block.
 *
 * Imports the REAL block source (a cross-package relative import, not a copy): a block is not
 * `shadcn add`-ed into `apps/docs/components/ui/*` the way a component is — there is nothing to
 * add, this demonstrates the pre-install block itself. Its own `@/components/ui/*` imports still
 * resolve to the docs app's copy-in, exactly like every other preview here.
 */

import type { ReactNode } from "react";
import ListPage01Page from "../../../../packages/ui/registry/blocks/list-page-01/page";
import { Wrapper } from "./wrapper";

export function listPage01Demo(): ReactNode {
  return (
    <Wrapper className="block h-160 overflow-auto p-0">
      <ListPage01Page />
    </Wrapper>
  );
}
