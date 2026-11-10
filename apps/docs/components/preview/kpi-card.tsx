"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";

const TREND = [12, 15, 14, 18, 17, 21, 24, 22, 27, 31, 29, 34];

export function kpiCard(): ReactNode {
  return (
    <Wrapper className="items-start">
      <KpiCard
        className="w-56"
        label="Runs"
        value="1,284"
        hint="Every agent run that started in the last 7 days."
        delta={{
          text: "↑ 12% vs last week",
          direction: "up",
          tone: "positive",
        }}
        spark={TREND}
      />
    </Wrapper>
  );
}

/** Seven tiles in the grid: 2 columns on a phone, 3 from sm, 4 from lg, 7 from xl. */
export function kpiCardGrid(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <KpiGrid className="w-full">
        <KpiCard
          label="Runs"
          value="1,284"
          delta={{ text: "↑ 12%", direction: "up", tone: "positive" }}
          spark={TREND}
        />
        <KpiCard
          label="Success rate"
          value="97.8%"
          delta={{ text: "No change", direction: "flat", tone: "neutral" }}
          spark={[97, 98, 97, 98, 98, 97, 98]}
        />
        <KpiCard
          label="Failures"
          value="28"
          delta={{ text: "↑ 9", direction: "up", tone: "negative" }}
          spark={[2, 3, 1, 4, 6, 5, 7]}
        />
        <KpiCard
          label="p95 latency"
          value="4.2 s"
          delta={{ text: "↓ 0.6 s", direction: "down", tone: "positive" }}
          spark={[6, 5.8, 5.1, 4.9, 4.6, 4.4, 4.2]}
        />
        <KpiCard
          label="Cost"
          value="$41.20"
          delta={{ text: "↓ 8%", direction: "down", tone: "positive" }}
          spark={[52, 49, 47, 46, 44, 43, 41]}
        />
        <KpiCard label="Approvals waiting" value="3" />
        <KpiCard label="Tokens" value={null} />
      </KpiGrid>
    </Wrapper>
  );
}

/** The whole tile is a link to the list behind the number; the hint stays its own button. */
export function kpiCardLinked(): ReactNode {
  return (
    <Wrapper className="items-start gap-3">
      <KpiCard
        className="w-56"
        label="Failures"
        value="28"
        hint="Runs that ended in an error."
        delta={{ text: "↑ 9 vs last week", direction: "up", tone: "negative" }}
        spark={[2, 3, 1, 4, 6, 5, 7]}
        linkRender={<a href="#runs-failed" />}
      />
      <KpiCard
        className="w-56"
        label="Approvals waiting"
        value="3"
        linkRender={<a href="#approvals" />}
      />
    </Wrapper>
  );
}

/** Loading and empty: the skeleton holds the tile's height; a missing value reads "No data". */
export function kpiCardStates(): ReactNode {
  return (
    <Wrapper className="items-start gap-3">
      <KpiCard className="w-56" label="Runs" value="1,284" loading />
      <KpiCard className="w-56" label="Tokens" value={null} />
    </Wrapper>
  );
}
