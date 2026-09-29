"use client";

/**
 * `preview/page-editor-01.tsx` — the docs live preview for the `page-editor-01` registry block.
 *
 * Imports the REAL block source (a cross-package relative import, not a copy); its own
 * `@/components/ui/*` imports resolve to the docs app's copy-in, like every other preview here.
 */

import type { ReactNode } from "react";
import PageEditor01Page from "../../../../packages/ui/registry/blocks/page-editor-01/page";
import { Wrapper } from "./wrapper";

export function pageEditor01Demo(): ReactNode {
  // `contain: paint` keeps the history sheet inside the preview frame.
  return (
    <Wrapper
      className="block h-160 overflow-auto p-4"
      style={{ contain: "paint" }}
    >
      <PageEditor01Page />
    </Wrapper>
  );
}
