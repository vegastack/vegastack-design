"use client";

/**
 * `preview/library-01.tsx` — the docs live preview for the `library-01` registry block.
 *
 * Imports the REAL block source (a cross-package relative import, not a copy): a block is not
 * `shadcn add`-ed into `apps/docs/components/ui/*` the way a component is. Its own
 * `@/components/ui/*` imports still resolve to the docs app's copy-in, like every other preview.
 */

import type { ReactNode } from "react";
import { Library } from "../../../../packages/ui/registry/blocks/library-01/components/library";
import { Wrapper } from "./wrapper";

export function library01Demo(): ReactNode {
  return (
    <Wrapper className="block h-160 p-2">
      <Library />
    </Wrapper>
  );
}
