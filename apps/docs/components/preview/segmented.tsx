"use client";

import type { ReactNode } from "react";
import * as React from "react";
import { Wrapper } from "./wrapper";
import { Columns3, LayoutGrid, List, Table2 } from "lucide-react";
// Copied INTO apps/docs via `shadcn add @vegastack/segmented` (dogfoods the registry) → auto-scanned.
import { Segmented, SegmentedItem } from "@/components/ui/segmented";

export function segmented(): ReactNode {
  // The canonical formula: muted track (rounded-lg, 2px padding) + raised active chip
  // (rounded-md + the one hairline). Radio semantics — one segment is always selected.
  return (
    <Wrapper className="flex-col items-center gap-6">
      <Segmented defaultValue="monthly" aria-label="Billing cycle">
        <SegmentedItem value="monthly">Monthly</SegmentedItem>
        <SegmentedItem value="annual">Annual</SegmentedItem>
      </Segmented>

      {/* Icon + label segments at the lg (form-row) scale. */}
      <Segmented defaultValue="table" size="lg" aria-label="View mode">
        <SegmentedItem value="table">
          <Table2 />
          Table
        </SegmentedItem>
        <SegmentedItem value="board">
          <Columns3 />
          Board
        </SegmentedItem>
        <SegmentedItem value="list" disabled>
          <List />
          List
        </SegmentedItem>
      </Segmented>

      {/* Icon-only segments (label via aria-label). */}
      <Segmented defaultValue="grid" aria-label="Density">
        <SegmentedItem value="grid" aria-label="Grid view">
          <LayoutGrid />
        </SegmentedItem>
        <SegmentedItem value="list" aria-label="List view">
          <List />
        </SegmentedItem>
      </Segmented>
    </Wrapper>
  );
}

export function segmentedControlled(): ReactNode {
  return <SegmentedControlledExample />;
}

function SegmentedControlledExample() {
  const [scope, setScope] = React.useState("all");
  return (
    <Wrapper className="flex-col items-center gap-3">
      <Segmented
        value={scope}
        onValueChange={setScope}
        aria-label="Filter scope"
      >
        <SegmentedItem value="all">All</SegmentedItem>
        <SegmentedItem value="mine">Mine</SegmentedItem>
        <SegmentedItem value="archived">Archived</SegmentedItem>
      </Segmented>
      <p className="text-sm text-muted-foreground">
        Scope: <span className="font-medium text-foreground">{scope}</span> —
        clicking the active segment is a no-op (always-one-selected).
      </p>
    </Wrapper>
  );
}
