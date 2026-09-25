"use client";

/**
 * `preview/issue-detail-01.tsx` — the docs live preview for the `issue-detail-01` registry block.
 *
 * Imports the REAL block source (a cross-package relative import, not a copy); its own
 * `@/components/ui/*` imports resolve to the docs app's copy-in, like every other preview here.
 */

import type { ReactNode } from "react";
import IssueDetail01Page from "../../../../packages/ui/registry/blocks/issue-detail-01/page";
import { Wrapper } from "./wrapper";

export function issueDetail01Demo(): ReactNode {
  // `contain: paint` keeps the sticky rail and the Details sheet inside the preview frame.
  return (
    <Wrapper
      className="block h-160 overflow-auto p-0"
      style={{ contain: "paint" }}
    >
      <IssueDetail01Page />
    </Wrapper>
  );
}
