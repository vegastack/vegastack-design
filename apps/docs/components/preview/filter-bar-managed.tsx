"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/filter-bar-managed` (dogfoods the registry) → auto-scanned.
import {
  FilterBuilder,
  type FilterField,
  type FilterNode,
} from "@/components/ui/filter-bar-managed";

type Group = Extract<FilterNode<string>, { type: "group" }>;

const VOCABULARY: FilterField<string>[] = [
  {
    key: "stage",
    label: "Stage",
    type: "text",
    operators: [
      { value: "is", label: "is" },
      { value: "is-not", label: "is not" },
    ],
  },
  {
    key: "owner",
    label: "Owner",
    type: "text",
    operators: [
      { value: "is", label: "is" },
      { value: "is-empty", label: "is empty", requiresValue: false },
    ],
  },
  {
    key: "amount",
    label: "Amount",
    type: "text",
    operators: [
      { value: "gt", label: "greater than" },
      { value: "lt", label: "less than" },
    ],
  },
];

const SEED: Group = {
  type: "group",
  op: "and",
  children: [
    { type: "condition", field: "stage", operator: "is", value: "Qualified" },
    {
      type: "group",
      op: "or",
      children: [
        { type: "condition", field: "amount", operator: "gt", value: "10000" },
        { type: "condition", field: "owner", operator: "is-empty" },
      ],
    },
  ],
};

export function filterBarManaged(): ReactNode {
  const [tree, setTree] = useState<Group>(SEED);
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-xl">
        <FilterBuilder<string>
          vocabulary={VOCABULARY}
          value={tree}
          onValueChange={setTree}
        />
      </div>
    </Wrapper>
  );
}

export function filterBarManagedSummary(): ReactNode {
  const [tree, setTree] = useState<Group>(SEED);
  return (
    <Wrapper className="block">
      <div className="mx-auto w-full max-w-xl">
        <FilterBuilder<string>
          vocabulary={VOCABULARY}
          value={tree}
          onValueChange={setTree}
          readOnly
        />
      </div>
    </Wrapper>
  );
}

export function filterBarManagedCaps(): ReactNode {
  const [tree, setTree] = useState<Group>({
    type: "group",
    op: "and",
    children: [
      { type: "condition", field: "stage", operator: "is", value: "Won" },
      { type: "condition", field: "owner", operator: "is-empty" },
      { type: "condition", field: "amount", operator: "gt", value: "500" },
    ],
  });
  return (
    <Wrapper className="block">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-1.5">
        <FilterBuilder<string>
          vocabulary={VOCABULARY}
          value={tree}
          onValueChange={setTree}
          maxConditions={3}
          maxDepth={1}
        />
        <p className="text-sm text-muted-foreground">
          Both caps reached: the add affordances disable with a readable reason.
        </p>
      </div>
    </Wrapper>
  );
}
