"use client";

import { type ReactNode, useState } from "react";
import { Wrapper } from "./wrapper";
import { BoardCard } from "@/components/ui/board-card";
import {
  RowActionsMenu,
  type RowAction,
} from "@/components/ui/data-table-parts";

const DAY = 86_400_000;
const at = (days: number) => new Date(Date.now() + days * DAY);

const actions: RowAction[] = [
  { label: "Open", onSelect: () => {} },
  { label: "Copy link", onSelect: () => {} },
  { type: "separator" },
  { label: "Cancel task", destructive: true, onSelect: () => {} },
];

export function boardCard(): ReactNode {
  const [done, setDone] = useState(false);
  return (
    <Wrapper className="block max-w-xs">
      <BoardCard
        title="Send the revised lighting schedule to the contractor"
        context="Harbour Tower · Acme Build"
        done={done}
        onDoneChange={setDone}
        due={at(2)}
        priority="high"
        assignee={{ name: "Priya Shah" }}
        actions={
          <RowActionsMenu
            label="Send the revised lighting schedule"
            actions={actions}
          />
        }
      />
    </Wrapper>
  );
}

/** The due chip: destructive when overdue, warning when due today, quiet otherwise. */
export function boardCardDue(): ReactNode {
  return (
    <Wrapper className="grid max-w-xs gap-3">
      <BoardCard title="Overdue" context="Website · Northwind" due={at(-2)} />
      <BoardCard title="Due today" context="Website · Northwind" due={at(0)} />
      <BoardCard title="Due later" context="Website · Northwind" due={at(9)} />
    </Wrapper>
  );
}

/** The priority chip: Urgent and High are coloured, Medium and Low are quiet. */
export function boardCardPriority(): ReactNode {
  return (
    <Wrapper className="grid max-w-xs gap-3">
      <BoardCard title="Fix the checkout outage" priority="urgent" />
      <BoardCard title="Draft the Q4 plan" priority="high" />
      <BoardCard title="Tidy the style guide" priority="medium" />
      <BoardCard title="Rename the old folders" priority="low" />
    </Wrapper>
  );
}

/** Done: the tick is filled and the title struck through; the due chip goes quiet. */
export function boardCardDone(): ReactNode {
  const [done, setDone] = useState(true);
  return (
    <Wrapper className="block max-w-xs">
      <BoardCard
        title="Book the site visit"
        context="Harbour Tower · Acme Build"
        done={done}
        onDoneChange={setDone}
        due={at(-1)}
        assignee={{ name: "Alex Lee" }}
      />
    </Wrapper>
  );
}

/** Minimal: a title alone, and a standalone card that is a link. */
export function boardCardMinimal(): ReactNode {
  return (
    <Wrapper className="grid max-w-xs gap-3">
      <BoardCard title="Just a title" />
      <BoardCard
        title="A card that opens its record"
        context="Linked with href"
        href="#task"
      />
    </Wrapper>
  );
}
