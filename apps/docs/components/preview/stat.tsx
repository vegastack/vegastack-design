"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import { Item, ItemContent } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
// Copied INTO apps/docs via `shadcn add @vegastack/stat` (dogfoods the registry) → auto-scanned.
import {
  Stat,
  StatDelta,
  StatEmpty,
  StatLabel,
  StatValue,
} from "@/components/ui/stat";

export function stat(): ReactNode {
  // Record-highlights voice: 12/500 muted labels over 14/500 values, honest empties.
  return (
    <Wrapper className="items-start gap-8">
      <Stat>
        <StatLabel>Estimated ARR</StatLabel>
        <StatValue>$1M–$10M</StatValue>
      </Stat>
      <Stat>
        <StatLabel>Employee range</StatLabel>
        <StatValue>11–50</StatValue>
      </Stat>
      <Stat>
        <StatLabel>Connection strength</StatLabel>
        <StatEmpty>No connection</StatEmpty>
      </Stat>
    </Wrapper>
  );
}

export function statTiles(): ReactNode {
  // Dashboard-tile voice: lg values on the type-scale cap + delta lines.
  return (
    <Wrapper className="items-start gap-10">
      <Stat size="lg">
        <StatLabel>Active companies</StatLabel>
        <StatValue>1,284</StatValue>
        <StatDelta intent="up">↑ 12% this month</StatDelta>
      </Stat>
      <Stat size="lg">
        <StatLabel>Churned</StatLabel>
        <StatValue>17</StatValue>
        <StatDelta intent="down">↓ 3 vs last month</StatDelta>
      </Stat>
      <Stat size="lg">
        <StatLabel>Open deals</StatLabel>
        <StatValue>62</StatValue>
        <StatDelta>No change</StatDelta>
      </Stat>
    </Wrapper>
  );
}

const LINKED_TILES = [
  { label: "Overdue tasks", value: 3, href: "#tasks-overdue" },
  { label: "Due this week", value: 12, href: "#tasks-this-week" },
  { label: "Meetings to review", value: 0, href: "#meetings-review" },
  { label: "Products missing photos", value: 1284, href: "#products-photos" },
];

/**
 * Linked stat tiles (DS-59): each count is a whole-tile link to the list it counts. The name reads
 * label first — "Overdue tasks 3" — because it follows DOM order. Loading keeps each tile's box.
 */
export function statLinkedTiles(): ReactNode {
  return <StatLinkedTilesDemo />;
}

function StatLinkedTilesDemo(): ReactNode {
  const [loading, setLoading] = useState(false);
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <div className="@container w-full">
        <div className="grid grid-cols-2 gap-3 @3xl:grid-cols-4">
          {LINKED_TILES.map((tile) => (
            <Item
              key={tile.label}
              variant="outline"
              render={<a href={tile.href} />}
            >
              <ItemContent>
                <Stat size="lg">
                  <StatLabel>{tile.label}</StatLabel>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <StatValue>{tile.value.toLocaleString("en-US")}</StatValue>
                  )}
                </Stat>
              </ItemContent>
            </Item>
          ))}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        aria-pressed={loading}
        onClick={() => setLoading((value) => !value)}
      >
        Show loading
      </Button>
    </Wrapper>
  );
}
