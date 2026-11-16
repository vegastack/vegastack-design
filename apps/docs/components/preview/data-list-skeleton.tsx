import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/data-list-skeleton` (dogfoods the registry).
import { DataListSkeleton } from "@/components/ui/data-list-skeleton";

const columns = [
  { key: "name" },
  { key: "updated", minWidth: 120 },
  { key: "owner", minWidth: 140 },
  { key: "size", minWidth: 80, align: "end" as const },
];

export function dataListSkeleton(): ReactNode {
  return (
    <Wrapper className="items-start justify-start bg-background">
      <DataListSkeleton
        className="w-full"
        columns={columns}
        rows={5}
        selectable
        toolbar={{ tools: 3 }}
      />
    </Wrapper>
  );
}

export function dataListSkeletonGrid(): ReactNode {
  return (
    <Wrapper className="items-start justify-start bg-background">
      <DataListSkeleton
        className="w-full"
        view="grid"
        rows={6}
        toolbar={{ tools: 3 }}
      />
    </Wrapper>
  );
}
