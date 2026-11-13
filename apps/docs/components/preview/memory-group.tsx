"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/memory-group` (dogfoods the registry) → auto-scanned.
import { MemoryGroup } from "@/components/ui/memory-group";

const noop = () => {};

export function memoryGroup(): ReactNode {
  return (
    <Wrapper className="flex-col flex-nowrap items-stretch gap-3 bg-background">
      <MemoryGroup
        data={{
          notebook: "Personal memory",
          items: [
            {
              id: "m1",
              text: "Prefers Inter for slides",
              undoable: true,
              editable: true,
            },
            {
              id: "m2",
              text: "Writes to Simran by email, not Slack",
              undoable: true,
              editable: true,
            },
            {
              id: "m3",
              text: "Working on: Indian prospects (13 Nov)",
              undoable: false,
              editable: true,
            },
          ],
        }}
        onUndo={noop}
        onEdit={noop}
      />
    </Wrapper>
  );
}

export function memoryGroupStates(): ReactNode {
  return (
    <Wrapper className="flex-col flex-nowrap items-stretch gap-3 bg-background">
      <MemoryGroup
        defaultOpen={false}
        data={{
          notebook: "Sales team",
          items: [
            {
              id: "m4",
              text: "Quotes go out on Fridays",
              undoable: false,
              editable: false,
            },
          ],
        }}
        onUndo={noop}
        onEdit={noop}
      />
    </Wrapper>
  );
}
