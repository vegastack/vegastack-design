"use client";

import type { ReactNode } from "react";
import { Database, ListFilter, Zap } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/tool-call-chip` (dogfoods the registry) → auto-scanned.
import { ToolCallChip } from "@/components/ui/tool-call-chip";
import { Spinner } from "@/components/ui/spinner";

export function toolCallChip(): ReactNode {
  // Agent-transcript chips: action label (ink) + result meta (muted).
  return (
    <Wrapper className="flex-col items-start gap-2">
      <ToolCallChip label="Attributes searched" meta="2 results">
        <ListFilter aria-hidden />
      </ToolCallChip>
      <ToolCallChip label="SQL query executed" meta="3 rows in 495ms">
        <Database aria-hidden />
      </ToolCallChip>
      <ToolCallChip label="Running workflow…">
        <Spinner size="inherit" label="" />
      </ToolCallChip>
      {/* Interactive: render as a button to expand the call's detail. */}
      <ToolCallChip
        label="Created workflow"
        meta="9 blocks"
        render={
          <button
            type="button"
            aria-label="Created workflow, 9 blocks — view detail"
          />
        }
      >
        <Zap aria-hidden />
      </ToolCallChip>
    </Wrapper>
  );
}
