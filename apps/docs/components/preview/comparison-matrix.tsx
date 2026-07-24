"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/comparison-matrix` (dogfoods the registry) → auto-scanned.
import {
  ComparisonGroup,
  ComparisonMatrix,
  ComparisonRow,
} from "@/components/ui/comparison-matrix";
import { Button } from "@/components/ui/button";

export function comparisonMatrix(): ReactNode {
  return (
    <Wrapper className="items-stretch">
      <ComparisonMatrix
        plans={["Free", "Plus", "Pro"]}
        highlightedIndex={2}
        planActions={[
          <Button key="free" size="xs" variant="outline">
            Start free
          </Button>,
          <Button key="plus" size="xs" variant="outline">
            Continue
          </Button>,
          <Button key="pro" size="xs">
            Continue
          </Button>,
        ]}
      >
        <ComparisonGroup>Enrichment</ComparisonGroup>
        <ComparisonRow
          feature="Company data"
          availability={[true, true, true]}
        />
        <ComparisonRow
          feature="Contact enrichment"
          availability={[false, true, true]}
        />
        <ComparisonRow
          feature="Call intelligence"
          availability={[false, false, true]}
        />
        <ComparisonGroup>Workspace</ComparisonGroup>
        <ComparisonRow
          feature="Seats"
          availability={["3", "10", "Unlimited"]}
        />
        <ComparisonRow
          feature="Permission controls"
          availability={[false, true, true]}
        />
      </ComparisonMatrix>
    </Wrapper>
  );
}
