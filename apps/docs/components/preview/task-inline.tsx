"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/task-inline` (dogfoods the registry) → auto-scanned.
import { MakeTaskPopover, TaskInline } from "@/components/ui/task-inline";
import { Button } from "@/components/ui/button";

/**
 * TaskInline — a task in running text: one round box, the title (opens its peek), the assignee's
 * avatar, a due chip and ↗ on hover. Tick it, or click a title.
 */
export function taskInline(): ReactNode {
  const [done, setDone] = React.useState<Record<string, boolean>>({
    t2: true,
  });
  const [opened, setOpened] = React.useState<string | null>(null);
  const tasks = [
    {
      id: "t1",
      title: "Order glass for block B",
      assignee: { name: "Asha Rao", hue: "blue" as const },
      due: "Fri 31 Oct",
    },
    {
      id: "t2",
      title: "Book the crane",
      assignee: { name: "Ben Ito", hue: "green" as const },
      due: "Mon 27 Oct",
    },
    {
      id: "t3",
      title: "Confirm the delivery slot",
      assignee: { name: "Scribe", kind: "agent" as const },
      due: "Yesterday",
      overdue: true,
    },
    { id: "t4", title: "Old supplier quote", struck: true, status: "Canceled" },
  ];
  return (
    <Wrapper className="flex-col items-stretch gap-2">
      <ul className="grid gap-3 text-sm">
        {tasks.map((task) => (
          <li key={task.id}>
            <TaskInline
              title={task.title}
              done={done[task.id] ?? false}
              struck={task.struck}
              status={task.status}
              assignee={task.assignee}
              due={task.due}
              overdue={task.overdue}
              onToggle={(next) =>
                setDone((now) => ({ ...now, [task.id]: next }))
              }
              onOpen={() => setOpened(task.title)}
              href={`#task-${task.id}`}
            />
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {opened
          ? `Opened “${opened}” in its peek.`
          : "Click a title to open it."}
      </p>
    </Wrapper>
  );
}

/** Read-only: no `onToggle`, so the box shows the state; no `onOpen`, so the title is text. */
export function taskInlineReadOnly(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <p className="text-sm">
        The glazing team will start once{" "}
        <TaskInline
          title="Order glass for block B"
          done
          assignee={{ name: "Asha Rao", hue: "blue" }}
          due="Fri 31 Oct"
        />{" "}
        lands on site, then the frames go in.
      </p>
    </Wrapper>
  );
}

/**
 * MakeTaskPopover — make a task of a line in place: the line's text as the title, the host's own
 * pickers in the slots (plain buttons here), Create.
 */
export function makeTaskPopover(): ReactNode {
  const line = React.useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = React.useState(false);
  const [made, setMade] = React.useState<string[]>([]);
  return (
    <Wrapper className="flex-col items-stretch gap-3">
      <p ref={line} className="text-sm">
        ☐ Send the revised drawings to the client
      </p>
      <div>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Make task
        </Button>
      </div>
      <MakeTaskPopover
        open={open}
        onOpenChange={setOpen}
        anchor={line.current}
        lines={[{ key: "b1", text: "Send the revised drawings to the client" }]}
        assignee={
          <Button variant="outline" size="sm">
            Assignee: Me
          </Button>
        }
        due={
          <Button variant="outline" size="sm">
            No due date
          </Button>
        }
        space={
          <Button variant="outline" size="sm">
            General
          </Button>
        }
        onCreate={async (lines) => {
          await new Promise((resolve) => setTimeout(resolve, 400));
          setMade((now) => [...now, ...lines.map((each) => each.title)]);
        }}
      />
      {made.length ? (
        <p className="text-xs text-muted-foreground">Made: {made.join(", ")}</p>
      ) : null}
    </Wrapper>
  );
}

/** Several lines: each with a keep box and its own title; one assignee, due date and space. */
export function makeTaskPopoverSeveral(): ReactNode {
  const list = React.useRef<HTMLUListElement>(null);
  const [open, setOpen] = React.useState(false);
  return (
    <Wrapper className="flex-col items-stretch gap-3">
      <ul ref={list} className="grid gap-1 text-sm">
        <li>☐ Measure the east wall</li>
        <li>☐ Order the frames</li>
        <li>☐ Book the fitters</li>
      </ul>
      <div>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Make 3 tasks
        </Button>
      </div>
      <MakeTaskPopover
        open={open}
        onOpenChange={setOpen}
        anchor={list.current}
        lines={[
          { key: "a", text: "Measure the east wall" },
          { key: "b", text: "Order the frames" },
          { key: "c", text: "Book the fitters" },
        ]}
        onCreate={() => setOpen(false)}
      />
    </Wrapper>
  );
}
