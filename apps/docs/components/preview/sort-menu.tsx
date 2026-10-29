"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { SortMenu, type SortMenuValue } from "@/components/ui/sort-menu";

const FIELDS = [
  { key: "due", label: "Due date", type: "date" as const },
  { key: "priority", label: "Priority", type: "enum" as const },
  { key: "updated", label: "Last updated", type: "date" as const },
  { key: "name", label: "Name", type: "text" as const },
  { key: "size", label: "Size", type: "number" as const },
];

export function sortMenu(): ReactNode {
  const [value, setValue] = React.useState<SortMenuValue>({
    key: "due",
    direction: "asc",
  });
  return (
    <Wrapper>
      <div className="w-72 rounded-lg border border-border bg-popover p-2">
        <SortMenu
          fields={FIELDS}
          value={value}
          defaultValue={{ key: "due", direction: "asc" }}
          onValueChange={setValue}
        />
      </div>
    </Wrapper>
  );
}
