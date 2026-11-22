"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
// Copied INTO apps/docs via `shadcn add @vegastack/meeting-icon` (dogfoods the registry) → auto-scanned.
import {
  MeetingIcon,
  RECORDING_ACTIONS,
  RecordingActionIcon,
  type RecordingAction,
} from "@/components/ui/meeting-icon";

const ROWS = [
  { title: "Site visit notes", status: "processed", speakerCount: 1 },
  { title: "Weekly sync", status: "processed", speakerCount: 4 },
  { title: "Client review", status: "transcribing", speakerCount: null },
] as const;

export function meetingIcon(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch">
      <ul className="flex w-full max-w-72 flex-col gap-1">
        {ROWS.map((row) => (
          <li
            key={row.title}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <MeetingIcon status={row.status} speakerCount={row.speakerCount} />
            <span className="truncate text-foreground">{row.title}</span>
          </li>
        ))}
      </ul>
    </Wrapper>
  );
}

const ACTIONS = Object.keys(RECORDING_ACTIONS) as RecordingAction[];

export function meetingIconRecordingActions(): ReactNode {
  return (
    <Wrapper>
      {ACTIONS.map((action) => (
        <Button key={action} variant="outline" size="sm">
          <RecordingActionIcon action={action} />
          {RECORDING_ACTIONS[action].label}
        </Button>
      ))}
    </Wrapper>
  );
}
