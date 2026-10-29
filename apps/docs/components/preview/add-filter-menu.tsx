"use client";

import type { ReactNode } from "react";
import { CircleDot, Flag, UserRound } from "lucide-react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import { AddFilterMenu } from "@/components/ui/add-filter-menu";

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
        onAdvanced={() => {}}
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
