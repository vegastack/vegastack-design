"use client";

import { useState, type ReactNode } from "react";
import { Calendar, Ellipsis, Flag, UserRound } from "lucide-react";
import { Wrapper } from "./wrapper";
import { RecordPeek, RecordPeekBody } from "@/components/ui/record-peek";
import { RecordHeader } from "@/components/ui/record-header";
import { RecordAsideSection } from "@/components/ui/record-aside";
import { MetaLine, MetaLineItem } from "@/components/ui/meta-line";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item";
import { useRecordPeekRow } from "@/components/ui/use-record-peek-row";

const TASKS = [
  {
    id: "t1",
    ref: "TASK-12",
    title: "Draft the Q4 pricing note",
    status: "In progress",
  },
  {
    id: "t2",
    ref: "TASK-13",
    title: "Review the supplier contract",
    status: "To do",
  },
  { id: "t3", ref: "TASK-14", title: "Book the launch venue", status: "Done" },
  {
    id: "t4",
    ref: "TASK-15",
    title: "Collect photometry files for the new range",
    status: "To do",
  },
];

function TaskRow({
  task,
  peekId,
  onOpen,
}: {
  task: (typeof TASKS)[number];
  peekId: string | null;
  onOpen: (id: string, row: HTMLElement) => void;
}) {
  const peek = useRecordPeekRow<HTMLDivElement>(task.id, peekId);
  return (
    <Item
      size="sm"
      render={<button type="button" />}
      {...peek}
      data-row-id={task.id}
      className="data-peek-active:bg-accent"
      onClick={(event) => onOpen(task.id, event.currentTarget as HTMLElement)}
    >
      <ItemContent>
        <ItemTitle>{task.title}</ItemTitle>
      </ItemContent>
      <Badge variant="outline">{task.ref}</Badge>
    </Item>
  );
}

/**
 * A list beside a peek: click a row to open it; ↑/↓ or J/K walk the list while the peek is open,
 * "n of N" follows, Esc closes and returns focus to the row.
 */
export function recordPeek(): ReactNode {
  const [peekId, setPeekId] = useState<string | null>(null);
  const index = TASKS.findIndex((task) => task.id === peekId);
  const task = index >= 0 ? TASKS[index]! : null;
  return (
    <Wrapper className="block">
      <ItemGroup className="max-w-md">
        {TASKS.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            peekId={peekId}
            onOpen={(id) => setPeekId(id)}
          />
        ))}
      </ItemGroup>
      <RecordPeek
        open={task !== null}
        onOpenChange={(open) => !open && setPeekId(null)}
        label="Task"
        position={index >= 0 ? { index, total: TASKS.length } : undefined}
        onPrevious={
          index > 0 ? () => setPeekId(TASKS[index - 1]!.id) : undefined
        }
        onNext={
          index < TASKS.length - 1
            ? () => setPeekId(TASKS[index + 1]!.id)
            : undefined
        }
        fullHref="#"
        actions={
          <Button variant="ghost" size="icon-sm" aria-label="Task actions">
            <Ellipsis />
          </Button>
        }
        returnFocus={() =>
          peekId
            ? document.querySelector<HTMLElement>(`[data-row-id="${peekId}"]`)
            : null
        }
      >
        {task ? (
          <RecordPeekBody>
            <RecordHeader
              level={2}
              keyBadge={task.ref}
              title={task.title}
              status={<Badge variant="secondary">{task.status}</Badge>}
              meta={
                <MetaLine>
                  <MetaLineItem icon={<Calendar />}>Due 30 Oct</MetaLineItem>
                  <MetaLineItem icon={<UserRound />}>Asha Kumar</MetaLineItem>
                  <MetaLineItem icon={<Flag />}>High</MetaLineItem>
                </MetaLine>
              }
            />
            <RecordAsideSection headingLevel="h3" title="Description">
              <p className="text-sm text-muted-foreground">
                The peek keeps its body mounted while you walk the list; only
                the record changes.
              </p>
            </RecordAsideSection>
          </RecordPeekBody>
        ) : null}
      </RecordPeek>
    </Wrapper>
  );
}
