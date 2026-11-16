"use client";

/**
 * `preview/shell-01.tsx` — the docs live preview for the `shell-01` registry block. Imports the
 * real block source; `fill="parent"` keeps the shell inside the preview frame.
 */

import type { ReactNode } from "react";
import Shell01Page from "../../../../packages/ui/registry/blocks/shell-01/page";
import { Wrapper } from "./wrapper";

export function shell01Demo(): ReactNode {
  return (
    <Wrapper
      className="block h-160 overflow-hidden p-0"
      style={{ contain: "paint" }}
    >
      <Shell01Page fill="parent" />
    </Wrapper>
  );
}
