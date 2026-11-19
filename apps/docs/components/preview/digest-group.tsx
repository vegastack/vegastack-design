"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/digest-group` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import { DigestGroup } from "@/components/ui/digest-group";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { RequestStatusChip } from "@/components/ui/request-status-chip";

const TASKS = Array.from({ length: 87 }, (_, index) => ({
  id: String(index),
  title: [
    "Confirm 3000 K samples with Acme",
    "Update the Bay 3 datasheet",
    "Chase the driver supplier for dates",
    "Send the revised quote to Priya",
  ][index % 4]!,
  meta: `${index + 2} days overdue · Bay ${(index % 5) + 1}`,
}));

function Row({ task }: { task: (typeof TASKS)[number] }): ReactNode {
  return (
    <Item size="sm">
      <ItemContent>
        <ItemTitle>{task.title}</ItemTitle>
        <ItemDescription>{task.meta}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button size="sm" variant="outline">
          Snooze
        </Button>
      </ItemActions>
    </Item>
  );
}

function Column({
  children,
  width = "max-w-xl",
}: {
  children: ReactNode;
  width?: string;
}): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className={`flex w-full flex-col gap-6 ${width}`}>{children}</div>
    </Wrapper>
  );
}

function Overdue(): ReactNode {
  const [shown, setShown] = useState(5);
  const [loading, setLoading] = useState(false);
  return (
    <DigestGroup
      title="Overdue"
      count={TASKS.length}
      urgent
      groupAction={{ label: "Update all…", onClick: () => undefined }}
      footer={{
        hasMore: shown < TASKS.length,
        remaining: TASKS.length - shown,
        loading,
        onLoadMore: () => {
          setLoading(true);
          setTimeout(() => {
            setShown((n) => Math.min(TASKS.length, n + 10));
            setLoading(false);
          }, 600);
        },
      }}
    >
      {TASKS.slice(0, shown).map((task) => (
        <Row key={task.id} task={task} />
      ))}
    </DigestGroup>
  );
}

export function digestGroup(): ReactNode {
  return (
    <Column>
      <Overdue />
      <DigestGroup
        title="Waiting on others"
        count={2}
        headerExtra={
          <>
            <RequestStatusChip state="awaiting_approval" size="sm" />
            <span>Blocked by the Acme approval</span>
          </>
        }
      >
        {TASKS.slice(0, 2).map((task) => (
          <Row key={task.id} task={task} />
        ))}
      </DigestGroup>
    </Column>
  );
}

export function digestGroupNarrow(): ReactNode {
  return (
    <Column width="max-w-[390px]">
      <Overdue />
    </Column>
  );
}
