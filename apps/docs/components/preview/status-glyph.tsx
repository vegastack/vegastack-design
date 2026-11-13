"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/status-glyph` (dogfoods the registry) → auto-scanned.
import { StatusGlyph, type ChatStatus } from "@/components/ui/status-glyph";

const STATES: { status: ChatStatus; words: string }[] = [
  { status: "done", words: "Found 12 makers" },
  { status: "running", words: "Comparing prices" },
  { status: "pending", words: "Write the summary" },
  { status: "skipped", words: "Email the list · not allowed" },
  { status: "failed", words: "Open the sheet · it was moved" },
  { status: "needs-you", words: "Approve sending" },
];

export function statusGlyph(): ReactNode {
  return (
    <Wrapper className="flex-col items-start gap-1">
      {STATES.map(({ status, words }) => (
        <p key={status} className="flex items-center gap-2 text-sm">
          <StatusGlyph status={status} />
          {words}
        </p>
      ))}
    </Wrapper>
  );
}

export function statusGlyphSizes(): ReactNode {
  return (
    <Wrapper className="gap-6">
      <span className="flex items-center gap-2 text-sm">
        <StatusGlyph status="done" /> 16 · a row
      </span>
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <StatusGlyph status="done" size={14} /> 14 · a meta line
      </span>
    </Wrapper>
  );
}
