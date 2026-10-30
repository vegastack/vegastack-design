"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { CircleDot, Flag, UserRound } from "lucide-react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import { AddFilterMenu } from "@/components/ui/add-filter-menu";
import {
  FilterBuilder,
  type FilterField,
  type FilterNode,
} from "@/components/ui/filter-bar-managed";

const FIELDS = [
  { key: "status", label: "Status", icon: <CircleDot /> },
  {
    key: "priority",
    label: "Priority",
    icon: <Flag />,
    editor: (done: () => void) => (
      <div className="flex flex-col">
        {["High", "Medium", "Low"].map((value) => (
          <Button
            key={value}
            variant="ghost"
            className="h-7 justify-start rounded-md px-1.5 font-normal"
            onClick={done}
          >
            {value}
          </Button>
        ))}
      </div>
    ),
  },
  {
    key: "assignee",
    label: "Assignee",
    icon: <UserRound />,
    keywords: ["owner"],
  },
];

type AdvancedGroup = Extract<FilterNode<string>, { type: "group" }>;
const ADVANCED_FIELDS: FilterField<string>[] = [
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
];

/** "Advanced filter": the condition builder, drilled into inside + Filter's popover. */
function AdvancedFilter() {
  const [tree, setTree] = React.useState<AdvancedGroup>({
    type: "group",
    op: "and",
    children: [
      { type: "condition", field: "stage", operator: "is", value: "Qualified" },
    ],
  });
  return (
    <FilterBuilder<string>
      vocabulary={ADVANCED_FIELDS}
      value={tree}
      onValueChange={setTree}
    />
  );
}

export function addFilterMenu(): ReactNode {
  return (
    <Wrapper>
      <AddFilterMenu fields={FIELDS} onPick={() => {}} />
    </Wrapper>
  );
}

export function addFilterMenuAi(): ReactNode {
  return (
    <Wrapper>
      <AddFilterMenu
        fields={FIELDS}
        onPick={() => {}}
        advanced={<AdvancedFilter />}
        ai={{
          onSubmit: async (text) => {
            await new Promise((resolve) => setTimeout(resolve, 800));
            if (text.toLowerCase().includes("fail"))
              throw new Error("unavailable");
            return { added: 0, unmatched: [text] };
          },
        }}
      />
    </Wrapper>
  );
}
