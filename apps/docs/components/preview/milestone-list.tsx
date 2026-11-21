"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/milestone-list` (dogfoods the registry) → auto-scanned.
import {
  MilestoneList,
  type MilestoneListItem,
} from "@/components/ui/milestone-list";

const MILESTONES: MilestoneListItem[] = [
  {
    id: "m1",
    name: "Discovery interviews",
    state: "done",
    date: "2026-10-12",
    tasks: { done: 6, total: 6 },
  },
  {
    id: "m2",
    name: "Pricing page and checkout",
    state: "late",
    date: "2026-11-15",
    weight: 3,
    tasks: { done: 3, total: 5 },
    warning: "A linked task is due after this milestone",
  },
  {
    id: "m3",
    name: "Beta with ten design partners, onboarding calls and a weekly feedback review",
    state: "open",
    date: "2026-12-04",
    tasks: { done: 0, total: 4 },
  },
  {
    id: "m4",
    name: "General availability",
    state: "open",
    date: "2027-01-31",
    weight: 2,
    warning: "After the target date",
  },
];

function Frame({ children }: { children: ReactNode }) {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className="w-full max-w-[45rem]">{children}</div>
    </Wrapper>
  );
}

export function milestoneList(): ReactNode {
  return (
    <Frame>
      <MilestoneList items={MILESTONES} />
    </Frame>
  );
}

function EditableDemo() {
  const [items, setItems] = React.useState(MILESTONES);
  return (
    <MilestoneList
      items={items}
      onMove={(id, { before }) =>
        setItems((prev) => {
          const moved = prev.find((item) => item.id === id)!;
          const rest = prev.filter((item) => item.id !== id);
          const at = before
            ? rest.findIndex((item) => item.id === before)
            : rest.length;
          rest.splice(at, 0, moved);
          return rest;
        })
      }
      onDoneChange={(id, done) =>
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, state: done ? "done" : "open" } : item,
          ),
        )
      }
      getActions={(item) => [
        { label: "Rename", onSelect: () => {} },
        { label: "Set date", onSelect: () => {} },
        { label: "Weight", onSelect: () => {} },
        { type: "separator" },
        {
          label: "Remove",
          destructive: true,
          onSelect: () =>
            setItems((prev) => prev.filter((m) => m.id !== item.id)),
        },
      ]}
      onAdd={() =>
        setItems((prev) => [
          ...prev,
          { id: `m${prev.length + 10}`, name: "New milestone", state: "open" },
        ])
      }
    />
  );
}

export function milestoneListEditable(): ReactNode {
  return (
    <Frame>
      <EditableDemo />
    </Frame>
  );
}

export function milestoneListEmpty(): ReactNode {
  return (
    <Frame>
      <MilestoneList
        items={[]}
        onAdd={() => {}}
        emptyState={
          <p className="px-2 py-1 text-sm text-muted-foreground">
            Add milestones to mark the big steps
          </p>
        }
      />
    </Frame>
  );
}

export function milestoneListNarrow(): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className="w-full max-w-80">
        <MilestoneList items={MILESTONES} />
      </div>
    </Wrapper>
  );
}
