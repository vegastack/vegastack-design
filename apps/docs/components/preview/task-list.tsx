"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
// Copied INTO apps/docs via `shadcn add @vegastack/task-list` (dogfoods the registry) → auto-scanned.
import {
  TaskList,
  TaskListProgress,
  type TaskListItem,
  type TaskListItemStatus,
} from "@/components/ui/task-list";

const noop = () => {};

const STEPS: { text: string; doing: string; ms: number }[] = [
  { text: "Find my open tasks", doing: "Finding your open tasks", ms: 4000 },
  { text: "Group them by space", doing: "Grouping them by space", ms: 2000 },
  { text: "Create the PDF", doing: "Creating the PDF", ms: 9000 },
  { text: "Reply with the file", doing: "Replying with the file", ms: 1000 },
  {
    text: "Save a copy to the Library",
    doing: "Saving a copy to the Library",
    ms: 2000,
  },
  { text: "Tag the owners", doing: "Tagging the owners", ms: 3000 },
  { text: "Post a summary in #ops", doing: "Posting a summary", ms: 2000 },
  {
    text: "Set a follow-up for Friday",
    doing: "Setting a follow-up",
    ms: 1000,
  },
  { text: "Close the old tracker", doing: "Closing the old tracker", ms: 2000 },
  {
    text: "Email the vendor list",
    doing: "Emailing the vendor list",
    ms: 3000,
  },
  { text: "Archive last quarter", doing: "Archiving last quarter", ms: 2000 },
  { text: "Check the totals", doing: "Checking the totals", ms: 1000 },
];

/** `count` items with item `live` (0-based) in progress; earlier ones done, later ones to do. */
function list(count: number, live: number): TaskListItem[] {
  return STEPS.slice(0, count).map((step, index) => {
    const status: TaskListItemStatus =
      index < live ? "completed" : index === live ? "in_progress" : "pending";
    return {
      id: String(index),
      text: step.text,
      doing: step.doing,
      status,
      ms: status === "completed" ? step.ms : undefined,
    };
  });
}

function Column({
  children,
  narrow = false,
}: {
  children: ReactNode;
  narrow?: boolean;
}): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch justify-start gap-6">
      <div
        className={
          narrow
            ? "flex w-full max-w-90 flex-col gap-6"
            : "flex w-full max-w-180 flex-col gap-6"
        }
      >
        {children}
      </div>
    </Wrapper>
  );
}

const startedAt = Date.now() - 18000;

export function taskList(): ReactNode {
  function Demo(): ReactNode {
    // Runs once on Run and stops at the end: nothing on the page moves by itself.
    const [live, setLive] = useState(2);
    const [running, setRunning] = useState(false);
    const [runStart, setRunStart] = useState<number | undefined>(undefined);
    useEffect(() => {
      if (!running) return;
      const timer = setInterval(() => setLive((step) => step + 1), 2000);
      return () => clearInterval(timer);
    }, [running]);
    const done = live >= 9;
    useEffect(() => {
      if (done) setRunning(false);
    }, [done]);
    return (
      <div className="flex w-full flex-col items-start gap-3">
        <TaskList
          items={list(9, live)}
          state={done ? "done" : "working"}
          startedAt={running ? runStart : undefined}
          ms={done ? 18000 : undefined}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={running}
          onClick={() => {
            setLive(0);
            setRunStart(Date.now());
            setRunning(true);
          }}
        >
          {done ? "Run again" : "Run"}
        </Button>
      </div>
    );
  }
  return (
    <Column>
      <Demo />
    </Column>
  );
}

export function taskListSizes(): ReactNode {
  return (
    <Column>
      <TaskList items={list(3, 1)} startedAt={startedAt} />
      <TaskList items={list(5, 2)} startedAt={startedAt} />
      <TaskList items={list(9, 6)} startedAt={startedAt} />
      <TaskList items={list(12, 4)} startedAt={startedAt} />
    </Column>
  );
}

export function taskListStates(): ReactNode {
  const stopped = list(9, 4);
  const waiting = list(4, 3).map((item, index) =>
    index === 3
      ? {
          ...item,
          text: "Post the summary",
          waiting: true,
          waitingAction: (
            <Button size="xs" variant="outline" onClick={noop}>
              Answer
            </Button>
          ),
        }
      : item,
  );
  const skipped = list(6, 4).map((item, index) =>
    index === 2 ? { ...item, status: "skipped" as const, ms: undefined } : item,
  );
  return (
    <Column>
      <TaskList
        items={list(4, 4)}
        state="done"
        ms={31000}
        defaultOpen={false}
      />
      <TaskList
        items={stopped}
        state="stopped"
        reason="ran out of steps"
        ms={42000}
      />
      <TaskList items={waiting} startedAt={startedAt} />
      <TaskList
        items={skipped}
        startedAt={startedAt}
        note="Dropped the PDF step: nothing to put in it."
      />
    </Column>
  );
}

export function taskListSubagents(): ReactNode {
  const items = list(6, 2).map((item, index) =>
    index === 2
      ? {
          ...item,
          text: "Triage the tickets",
          doing: "Triaging the tickets",
          progress: "3 of 4 subagents done",
          onOpenProgress: noop,
        }
      : item,
  );
  return (
    <Column>
      <TaskList items={items} startedAt={startedAt} />
    </Column>
  );
}

export function taskListProgress(): ReactNode {
  return (
    <Column>
      <TaskListProgress
        step={3}
        total={9}
        text="Create the PDF"
        onClick={noop}
      />
      <TaskListProgress
        step={4}
        total={9}
        text="Post the summary"
        waiting
        onClick={noop}
      />
    </Column>
  );
}

export function taskListNarrow(): ReactNode {
  return (
    <Column narrow>
      <TaskList items={list(9, 6)} startedAt={startedAt} />
      <TaskList items={list(9, 4)} state="stopped" reason="ran out of steps" />
      <TaskListProgress
        step={7}
        total={9}
        text="Post a summary in #ops"
        onClick={noop}
      />
    </Column>
  );
}
