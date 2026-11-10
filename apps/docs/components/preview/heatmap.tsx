"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Heatmap } from "@/components/ui/heatmap";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));

// Deterministic sample: a working-hours hump on weekdays, quiet nights and weekends.
const RUNS = DAYS.map((_, d) =>
  HOURS.map((_, h) => {
    const weekday = d < 5;
    const work = h >= 8 && h <= 18;
    const base = weekday
      ? work
        ? 6 + ((h * 7 + d * 3) % 11)
        : (h + d) % 3 === 0
          ? 1
          : 0
      : (h * d) % 5 === 0
        ? 2
        : 0;
    return base;
  }),
);

function runsLabel(r: number, c: number, v: number) {
  return `${DAYS[r]} ${HOURS[c]}:00 — ${v === 0 ? "no runs" : v === 1 ? "1 run" : `${v} runs`}`;
}

export function heatmap(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <Heatmap
        className="w-full"
        label="Runs by weekday and hour"
        rows={DAYS}
        columns={HOURS}
        values={RUNS}
        cellLabel={runsLabel}
        legend={{ low: "Fewer", high: "More" }}
      />
    </Wrapper>
  );
}

const AGENTS = ["Triage", "Follow-ups", "Inbox", "Reports"];
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FAILURES = [
  [0, 1, 0, 0, 3, 0, 0],
  [2, 0, 0, 1, 0, 0, 0],
  [0, 0, 5, 2, 1, 0, 0],
  [0, 0, 0, 0, 0, 1, 0],
];

/** Any two dimensions: agents down the side, days across the top. */
export function heatmapAgents(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <Heatmap
        className="w-full max-w-md"
        label="Failed runs by agent and day"
        rows={AGENTS}
        columns={WEEK}
        values={FAILURES}
        cellLabel={(r, c, v) =>
          `${AGENTS[r]}, ${WEEK[c]} — ${v === 0 ? "no failures" : v === 1 ? "1 failure" : `${v} failures`}`
        }
      />
    </Wrapper>
  );
}

/** Every value is zero: `empty` stands in for the grid. */
export function heatmapEmpty(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <Heatmap
        label="Runs by weekday and hour"
        rows={DAYS}
        columns={HOURS}
        values={DAYS.map(() => HOURS.map(() => 0))}
        cellLabel={runsLabel}
        empty={
          <p className="text-sm text-muted-foreground">
            No runs in the last 7 days.
          </p>
        }
      />
    </Wrapper>
  );
}
