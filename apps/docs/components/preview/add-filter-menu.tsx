"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { CircleDot, Flag, UserRound } from "lucide-react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import { AddFilterMenu, AiFilterInput } from "@/components/ui/add-filter-menu";

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
            className="h-8 justify-start px-2 font-normal"
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

export function aiFilterInput(): ReactNode {
  const [value, setValue] = React.useState("IP65 black downlights");
  return (
    <Wrapper>
      <div className="w-80 rounded-lg border border-border bg-popover p-2 pt-2">
        <AiFilterInput
          aria-label="Describe what you want"
          value={value}
          onValueChange={setValue}
          pending
        />
      </div>
    </Wrapper>
  );
}
