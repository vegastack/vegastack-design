"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/timeline` (dogfoods the registry) → auto-scanned.
import { Timeline, type TimelineRow } from "@/components/ui/timeline";
import {
  HEALTH_LABEL,
  HealthIndicator,
  type Health,
} from "@/components/ui/health-indicator";

const TODAY = "2026-11-21";

function row(
  base: Omit<TimelineRow, "leading" | "leadingLabel">,
  health: Health,
): TimelineRow {
  return {
    ...base,
    leading: <HealthIndicator health={health} labelHidden />,
    leadingLabel: HEALTH_LABEL[health],
  };
}

const ROWS: TimelineRow[] = [
  row(
    {
      id: "i1",
      label: "Self-serve onboarding",
      sublabel: "INI-1 · Priya",
      start: "2026-10-01",
      end: "2027-01-31",
      status: "active",
      markers: [
        { id: "m1", date: "2026-10-12", label: "Discovery", state: "done" },
        { id: "m2", date: "2026-11-15", label: "Pricing page", state: "late" },
        { id: "m3", date: "2026-12-04", label: "Beta", state: "open" },
      ],
    },
    "at_risk",
  ),
  row(
    {
      id: "i2",
      label: "Warehouse move to the Leeds site with the new racking plan",
      sublabel: "INI-2 · Tom",
      start: "2026-11-02",
      end: "2027-03-15",
      status: "active",
      markers: [
        {
          id: "m4",
          date: "2027-01-10",
          label: "Racking signed off",
          state: "open",
        },
      ],
    },
    "on_track",
  ),
  row(
    {
      id: "i3",
      label: "Spring catalogue",
      sublabel: "INI-3",
      start: "2027-01-15",
      end: "2027-04-30",
      status: "planned",
    },
    "none",
  ),
  row(
    {
      id: "i4",
      label: "Dealer portal",
      sublabel: "INI-4",
      start: "2026-08-01",
      end: "2026-12-20",
      status: "paused",
    },
    "off_track",
  ),
  row(
    {
      id: "i5",
      label: "ERP clean-up",
      sublabel: "INI-5",
      start: "2026-07-01",
      end: "2026-10-31",
      status: "completed",
      markers: [
        { id: "m5", date: "2026-09-30", label: "Cut-over", state: "done" },
      ],
    },
    "on_track",
  ),
  row(
    { id: "i6", label: "Brand refresh", sublabel: "INI-6", status: "planned" },
    "none",
  ),
];

function Frame({
  children,
  width = "w-full",
}: {
  children: ReactNode;
  width?: string;
}) {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className={width}>{children}</div>
    </Wrapper>
  );
}

export function timeline(): ReactNode {
  return (
    <Frame>
      <Timeline
        rows={ROWS}
        today={TODAY}
        onOpen={() => {}}
        className="[--timeline-bg:var(--card)]"
      />
    </Frame>
  );
}

export function timelineQuarter(): ReactNode {
  return (
    <Frame>
      <Timeline
        rows={ROWS}
        today={TODAY}
        defaultZoom="quarter"
        onOpen={() => {}}
        className="[--timeline-bg:var(--card)]"
      />
    </Frame>
  );
}

export function timelineNarrow(): ReactNode {
  return (
    <Frame width="w-full max-w-80">
      <Timeline rows={ROWS} today={TODAY} onOpen={() => {}} />
    </Frame>
  );
}

export function timelineOne(): ReactNode {
  return (
    <Frame>
      <Timeline
        rows={ROWS.slice(0, 1)}
        today={TODAY}
        onOpen={() => {}}
        className="[--timeline-bg:var(--card)]"
      />
    </Frame>
  );
}

function PagedDemo() {
  const [rows, setRows] = React.useState(() => many(0, 12));
  const [loading, setLoading] = React.useState(false);
  return (
    <Timeline
      rows={rows}
      today={TODAY}
      onOpen={() => {}}
      className="[--timeline-bg:var(--card)]"
      loadMore={{
        hasMore: rows.length < 60,
        loading,
        onLoadMore: () => {
          setLoading(true);
          return new Promise<void>((resolve) =>
            setTimeout(() => {
              setRows((prev) => [...prev, ...many(prev.length, 12)]);
              setLoading(false);
              resolve();
            }, 600),
          );
        },
      }}
    />
  );
}

function many(from: number, count: number): TimelineRow[] {
  return Array.from({ length: count }, (_, k) => {
    const n = from + k;
    const month = n % 12;
    const start = `2026-${String(month + 1).padStart(2, "0")}-01`;
    const end = `2027-${String(((month + 3) % 12) + 1).padStart(2, "0")}-15`;
    return {
      id: `p${n}`,
      label: `Initiative ${n + 1}`,
      sublabel: `INI-${n + 10}`,
      start,
      end,
      status: (["active", "planned", "paused", "completed"] as const)[n % 4]!,
    };
  });
}

export function timelinePaged(): ReactNode {
  return (
    <Frame>
      <div className="max-h-96 overflow-y-auto relative">
        <PagedDemo />
      </div>
    </Frame>
  );
}

export function timelineEmpty(): ReactNode {
  return (
    <Frame>
      <Timeline
        rows={[]}
        empty={
          <p className="py-6 text-center text-sm text-muted-foreground">
            No initiatives in this space yet
          </p>
        }
      />
    </Frame>
  );
}
