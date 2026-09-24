"use client";

/**
 * `preview/status-pages-01.tsx` — the docs live preview for the `status-pages-01` registry block.
 *
 * Imports the REAL block source (a cross-package relative import, not a copy): a block is not
 * `shadcn add`-ed into `apps/docs/components/ui/*` the way a component is — there is nothing to
 * add, this demonstrates the pre-install block itself. Its own `@/components/ui/*` imports still
 * resolve to the docs app's copy-in, exactly like every other preview here.
 */

import { useState, type ReactNode } from "react";
import { ErrorPage } from "../../../../packages/ui/registry/blocks/status-pages-01/components/error-page";
import { ForbiddenPage } from "../../../../packages/ui/registry/blocks/status-pages-01/components/forbidden-page";
import { NotFoundPage } from "../../../../packages/ui/registry/blocks/status-pages-01/components/not-found-page";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Wrapper } from "./wrapper";

type Status = "404" | "403" | "error";

function StatusPagesDemo(): ReactNode {
  const [status, setStatus] = useState<Status>("404");
  return (
    <div className="flex w-full flex-col gap-4">
      <ToggleGroup
        variant="outline"
        size="sm"
        aria-label="Page"
        value={[status]}
        onValueChange={(value) => {
          const next = value[0] as Status | undefined;
          if (next) setStatus(next);
        }}
      >
        <ToggleGroupItem value="404">Not found</ToggleGroupItem>
        <ToggleGroupItem value="403">Forbidden</ToggleGroupItem>
        <ToggleGroupItem value="error">Error</ToggleGroupItem>
      </ToggleGroup>
      {status === "404" ? <NotFoundPage /> : null}
      {status === "403" ? <ForbiddenPage /> : null}
      {status === "error" ? (
        <ErrorPage digest="3f9a1c07" onRetry={() => {}} />
      ) : null}
    </div>
  );
}

export function statusPages01Demo(): ReactNode {
  return (
    <Wrapper className="block p-4">
      <StatusPagesDemo />
    </Wrapper>
  );
}
