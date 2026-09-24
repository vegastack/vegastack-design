"use client";

/**
 * `preview/board-01.tsx` — the docs live preview for the `board-01` registry block.
 *
 * Imports the REAL block source (a cross-package relative import, not a copy): a block is not
 * `shadcn add`-ed into `apps/docs/components/ui/*` the way a component is — there is nothing to
 * add, this demonstrates the pre-install block itself. Its own `@/components/ui/*` imports still
 * resolve to the docs app's copy-in, exactly like every other preview here.
 */

import type { ReactNode } from "react";
import Board01Page from "../../../../packages/ui/registry/blocks/board-01/page";
import { Wrapper } from "./wrapper";

export function board01Demo(): ReactNode {
  // `contain: paint` makes the frame the fixed-positioning containing block, so the desktop rail
  // renders inside the preview instead of against the viewport (as app-shell's previews do).
  return (
    <Wrapper
      className="block h-136 overflow-hidden p-0"
      style={{ contain: "paint" }}
    >
      <Board01Page />
    </Wrapper>
  );
}
