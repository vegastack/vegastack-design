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

/** Key numbers in one grid, secondary ones in another: each balanced, never a ragged last row. */
export function kpiCardGrid(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-3">
      <KpiGrid className="w-full">
        <KpiCard
          label="Runs"
          value="1,284"
          delta={{ text: "↑ 12%", direction: "up", tone: "positive" }}
          spark={TREND}
        />
        <KpiCard
          label="Success"
          value="97.8%"
          tone="success"
          delta={{ text: "No change", direction: "flat", tone: "neutral" }}
          spark={[97, 98, 97, 98, 98, 97, 98]}
        />
        <KpiCard
          label="Provider cost"
          value="$41.20"
          series={2}
          delta={{ text: "↓ 8%", direction: "down", tone: "positive" }}
          spark={[52, 49, 47, 46, 44, 43, 41]}
        />
        <KpiCard label="Median run" value="4.2 s" />
      </KpiGrid>
      <KpiGrid className="w-full">
        <KpiCard label="Slowest runs (p95)" value="12 s" />
        <KpiCard label="Waiting on you" value="3" />
        <KpiCard label="Helpful" value={null} empty="Needs 5 ratings" />
      </KpiGrid>
    </Wrapper>
  );
}

/** Tone by threshold: the value and the spark take the status family; words still carry it. */
export function kpiCardTones(): ReactNode {
  return (
    <Wrapper className="items-start gap-3">
      <KpiCard
        className="w-48"
        label="Success"
        value="98%"
        tone="success"
        spark={[96, 97, 98, 98]}
      />
      <KpiCard
        className="w-48"
        label="Success"
        value="84%"
        tone="warning"
        spark={[92, 90, 87, 84]}
      />
      <KpiCard
        className="w-48"
        label="Success"
        value="61%"
        tone="danger"
        spark={[80, 72, 66, 61]}
      />
    </Wrapper>
  );
}

/** Edge cases: a long label, a big value, no value, and a narrow container. */
export function kpiCardEdges(): ReactNode {
  return (
    <Wrapper className="items-start gap-3">
      <KpiCard
        className="w-40"
        label="Median time to decide on an approval request"
        value="1 h 12 min"
      />
      <KpiCard
        className="w-40"
        label="Tokens"
        value="1,284,903,112"
        series={3}
      />
      <KpiCard
        className="w-40"
        label="Helpful"
        value={null}
        empty="Needs 5 ratings"
      />
      <div className="w-36">
        <KpiGrid>
          <KpiCard label="Runs" value="12" />
          <KpiCard label="Waiting" value="0" />
        </KpiGrid>
      </div>
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

/** Loading and empty: the skeleton holds the tile's height; a missing value is a muted dash. */
export function kpiCardStates(): ReactNode {
  return (
    <Wrapper className="items-start gap-3">
      <KpiCard className="w-56" label="Runs" value="1,284" loading />
      <KpiCard className="w-56" label="Runs" value={null} empty="No runs yet" />
    </Wrapper>
  );
}
