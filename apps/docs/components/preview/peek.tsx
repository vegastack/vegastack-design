"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { MoreHorizontal, Star } from "lucide-react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  Peek,
  PeekAction,
  PeekActions,
  PeekBody,
  PeekClose,
  PeekHeader,
  PeekNav,
  PeekOpen,
  PeekPath,
  PeekTitle,
} from "@/components/ui/peek";

const TASKS = [
  {
    id: 41,
    title: "Draft the rollout plan",
    status: "In progress",
    owner: "Asha",
  },
  {
    id: 42,
    title: "Fix the login page on Safari",
    status: "To do",
    owner: "Ravi",
  },
  {
    id: 43,
    title: "Review the pricing page copy",
    status: "In review",
    owner: "Mei",
  },
  {
    id: 44,
    title: "Book the venue for the offsite",
    status: "Done",
    owner: "Tom",
  },
  { id: 45, title: "Write the release notes", status: "To do", owner: "Asha" },
  {
    id: 46,
    title: "Clean up the onboarding emails",
    status: "In progress",
    owner: "Ravi",
  },
];

/** A task list in a page area, with a peek over its right side. */
function TaskListWithPeek({
  layout = "auto",
  initial = null,
}: {
  layout?: "auto" | "side" | "sheet";
  initial?: number | null;
}) {
  const [index, setIndex] = React.useState<number | null>(initial);
  const [width, setWidth] = React.useState(480);
  const task = index === null ? null : TASKS[index];
  return (
    <div
      className={cn(
        "relative h-[30rem] w-full overflow-hidden rounded-card border bg-background text-start",
        // The side peek needs a page area: a wide frame that scrolls sideways in a narrow preview.
        layout === "side" && "min-w-[48rem]",
      )}
    >
      <ul
        className={cn(
          "flex h-full flex-col overflow-y-auto p-2",
          // The rows the side peek leaves in view.
          layout === "side" && "w-[38%]",
        )}
      >
        {TASKS.map((t, i) => (
          <li key={t.id}>
            <Button
              variant="ghost"
              className="h-10 w-full justify-start gap-3 rounded-item"
              aria-current={i === index ? "true" : undefined}
              onClick={() => setIndex(i)}
            >
              <span className="text-muted-foreground tabular-nums">
                #{t.id}
              </span>
              <span className="min-w-0 truncate">{t.title}</span>
              <span className="ms-auto text-muted-foreground">{t.status}</span>
            </Button>
          </li>
        ))}
      </ul>
      <Peek
        open={task !== null}
        onOpenChange={(open) => !open && setIndex(null)}
        width={width}
        onWidthChange={setWidth}
        layout={layout}
        label="Task"
      >
        {task ? (
          <>
            <PeekHeader>
              <PeekNav
                onPrevious={index! > 0 ? () => setIndex(index! - 1) : undefined}
                onNext={
                  index! < TASKS.length - 1
                    ? () => setIndex(index! + 1)
                    : undefined
                }
              />
              <PeekPath>
                <span className="truncate">Tasks › Website › #{task.id}</span>
              </PeekPath>
              <PeekActions>
                <PeekOpen href={`#task-${task.id}`} />
                <PeekAction label="Favourite">
                  <Star />
                </PeekAction>
                <PeekAction label="More">
                  <MoreHorizontal />
                </PeekAction>
                <PeekClose />
              </PeekActions>
            </PeekHeader>
            <PeekBody>
              <PeekTitle>{task.title}</PeekTitle>
              <p className="text-sm text-muted-foreground">
                {task.status} · {task.owner}
              </p>
              <p className="text-sm">
                The record's own content: its fields, its description, its
                latest comments with a reply box. ↑ ↓ walk the list in its
                current order; ⤢ opens the full page.
              </p>
            </PeekBody>
          </>
        ) : null}
      </Peek>
    </div>
  );
}

export function peek(): ReactNode {
  return (
    <Wrapper className="block overflow-x-auto p-3">
      <TaskListWithPeek layout="side" initial={1} />
    </Wrapper>
  );
}

export function peekClosed(): ReactNode {
  return (
    <Wrapper className="block overflow-x-auto p-3">
      <TaskListWithPeek layout="side" />
    </Wrapper>
  );
}

export function peekSheet(): ReactNode {
  return (
    <Wrapper className="p-3">
      <div className="w-full max-w-sm">
        <TaskListWithPeek layout="sheet" />
      </div>
    </Wrapper>
  );
}
