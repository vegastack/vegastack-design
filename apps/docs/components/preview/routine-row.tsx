"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/routine-row` (dogfoods the registry) → auto-scanned.
import { RoutineRow } from "@/components/ui/routine-row";

function List({
  children,
  width = "max-w-2xl",
}: {
  children: ReactNode;
  width?: string;
}): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className={`flex w-full flex-col gap-px ${width}`}>{children}</div>
    </Wrapper>
  );
}

const noop = () => undefined;

function Rows(): ReactNode {
  return (
    <>
      <RoutineRow
        name="Monday supplier check"
        href="#"
        schedule="Mondays at 9:00"
        nextRuns={["Mon 24 Nov", "Mon 1 Dec", "Mon 8 Dec"]}
        owner="Anu"
        destination="#ops"
        lastRun={{ status: "done", cost: "₹1.20", at: "Mon 17 Nov" }}
        state="active"
        onRunNow={noop}
        onSkipNext={noop}
        onPause={noop}
      />
      <RoutineRow
        name="Daily digest of overdue tasks for the whole lighting design team"
        href="#"
        schedule="Weekdays at 8:30"
        nextRuns={["Tomorrow 8:30"]}
        owner="Tasks agent"
        destination="Email to Anu"
        lastRun={{ status: "failed", at: "Today 8:30" }}
        state="active"
        onRunNow={noop}
        onPause={noop}
      />
      <RoutineRow
        name="Friday client update"
        href="#"
        schedule="Fridays at 17:00"
        nextRuns={["Fri 21 Nov"]}
        owner="Anu"
        lastRun={{ status: "no_reply", at: "Fri 14 Nov" }}
        state="paused"
        onRunNow={noop}
        onResume={noop}
      />
    </>
  );
}

export function routineRow(): ReactNode {
  return (
    <List>
      <Rows />
    </List>
  );
}

export function routineRowNarrow(): ReactNode {
  return (
    <List width="max-w-[390px]">
      <Rows />
    </List>
  );
}
