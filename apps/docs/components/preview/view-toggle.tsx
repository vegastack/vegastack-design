"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { ViewToggle, type ListView } from "@/components/ui/view-toggle";

export function viewToggle(): ReactNode {
  const [view, setView] = React.useState<"grid" | "list">("grid");
  return (
    <Wrapper>
      <ViewToggle value={view} onValueChange={setView} />
    </Wrapper>
  );
}

export function viewToggleBoard(): ReactNode {
  const [view, setView] = React.useState<ListView>("list");
  return (
    <Wrapper>
      <ViewToggle
        value={view}
        onValueChange={setView}
        views={["list", "grid", "board"]}
      />
    </Wrapper>
  );
}
