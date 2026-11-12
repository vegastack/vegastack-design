"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/memory-note` (dogfoods the registry) → auto-scanned.
import {
  MEMORY_NOTE_TONES,
  MemoryNote,
  type MemoryNoteState,
  type MemoryNoteTone,
} from "@/components/ui/memory-note";

const noop = () => {};
const handlers = {
  onUndo: noop,
  onEdit: noop,
  onWhy: noop,
  onKeep: noop,
  onDismiss: noop,
  onOpen: noop,
  onRetry: noop,
};

const LINES: Record<
  MemoryNoteTone,
  { notebook: string; line: string; before?: string; source?: string }
> = {
  remembered: {
    notebook: "Personal memory",
    line: "you write to customers informally, first names",
  },
  updated: {
    notebook: "Sales memory",
    line: "quotes go out in INR",
    before: "quotes go out in USD",
  },
  suggested: {
    notebook: "Sales memory",
    line: "Asha signs off every discount over 10%",
    source: "from an email",
  },
  forgot: {
    notebook: "Personal memory",
    line: "you're out on Fridays",
  },
  would: {
    notebook: "Workspace memory",
    line: "the Pune office closes at 6 pm",
  },
  queued: {
    notebook: "Agent memory",
    line: "check stock before quoting lead times",
  },
  failed: {
    notebook: "Personal memory",
    line: "send the weekly report on Mondays",
  },
};

function Column({
  children,
  narrow = false,
}: {
  children: ReactNode;
  narrow?: boolean;
}): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch justify-start gap-2">
      <div
        className={
          narrow
            ? "flex w-full max-w-90 flex-col gap-2"
            : "flex w-full flex-col gap-2"
        }
      >
        {children}
      </div>
    </Wrapper>
  );
}

export function memoryNote(): ReactNode {
  function Demo(): ReactNode {
    const [state, setState] = useState<MemoryNoteState>("idle");
    const settle = (next: MemoryNoteState) => () => {
      setState("busy");
      setTimeout(() => setState(next), 800);
    };
    return (
      <MemoryNote
        tone="remembered"
        {...LINES.remembered}
        state={state}
        onUndo={settle("undone")}
        onEdit={settle("edited")}
        onWhy={noop}
      />
    );
  }
  return (
    <Column>
      <Demo />
    </Column>
  );
}

export function memoryNoteTones(): ReactNode {
  return (
    <Column>
      {MEMORY_NOTE_TONES.map((tone) => (
        <MemoryNote key={tone} tone={tone} {...LINES[tone]} {...handlers} />
      ))}
    </Column>
  );
}

export function memoryNoteStates(): ReactNode {
  return (
    <Column>
      <MemoryNote
        tone="suggested"
        {...LINES.suggested}
        {...handlers}
        state="busy"
      />
      <MemoryNote
        tone="remembered"
        {...LINES.remembered}
        {...handlers}
        state="undone"
      />
      <MemoryNote
        tone="suggested"
        {...LINES.suggested}
        {...handlers}
        state="kept"
        outcome="Kept by Priya"
      />
      <MemoryNote
        tone="suggested"
        {...LINES.suggested}
        {...handlers}
        state="dismissed"
      />
      <MemoryNote
        tone="updated"
        {...LINES.updated}
        {...handlers}
        state="edited"
      />
      <MemoryNote
        tone="suggested"
        {...LINES.suggested}
        note="Suggested for Sales: waiting for a reviewer"
      />
    </Column>
  );
}

export function memoryNoteCompact(): ReactNode {
  return (
    <Column>
      <MemoryNote compact tone="suggested" {...LINES.suggested} {...handlers} />
      <MemoryNote
        compact
        tone="remembered"
        {...LINES.remembered}
        {...handlers}
      />
      <MemoryNote compact tone="forgot" {...LINES.forgot} {...handlers} />
    </Column>
  );
}

export function memoryNoteNarrow(): ReactNode {
  return (
    <Column narrow>
      {MEMORY_NOTE_TONES.map((tone) => (
        <MemoryNote key={tone} tone={tone} {...LINES[tone]} {...handlers} />
      ))}
      <MemoryNote
        tone="suggested"
        {...LINES.suggested}
        {...handlers}
        state="kept"
      />
    </Column>
  );
}
