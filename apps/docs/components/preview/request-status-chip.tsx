"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/request-status-chip` (dogfoods the registry) → auto-scanned.
import {
  REQUEST_STATE_LABEL,
  RequestStatusChip,
  type RequestState,
} from "@/components/ui/request-status-chip";

const STATES = Object.keys(REQUEST_STATE_LABEL) as RequestState[];

export function requestStatusChip(): ReactNode {
  return (
    <Wrapper>
      {STATES.map((state) => (
        <RequestStatusChip key={state} state={state} />
      ))}
    </Wrapper>
  );
}

export function requestStatusChipLabels(): ReactNode {
  return (
    <Wrapper>
      <RequestStatusChip state="in_progress" label="Awaiting receipt" />
      <RequestStatusChip state="open" label="New" />
      <RequestStatusChip state="completed" label="Paid" />
    </Wrapper>
  );
}

export function requestStatusChipSizes(): ReactNode {
  return (
    <Wrapper>
      <RequestStatusChip state="awaiting_approval" size="sm" />
      <RequestStatusChip state="awaiting_approval" />
    </Wrapper>
  );
}
