"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/chat-chip` (dogfoods the registry) → auto-scanned.
import { ChatChip } from "@/components/ui/chat-chip";
import { TextSpinner } from "@/components/ui/text-spinner";
import { StatusGlyph } from "@/components/ui/status-glyph";

export function chatChip(): ReactNode {
  return (
    <Wrapper className="flex-col flex-nowrap items-start gap-2 bg-background">
      <ChatChip
        icon={<TextSpinner label="" />}
        label="3 Subagents running"
        meta="1m 20s"
        onClick={() => {}}
      />
      <ChatChip
        label="7 background commands done, 3 running"
        onClick={() => {}}
      />
      <ChatChip
        tone="attention"
        icon={<StatusGlyph status="needs-you" size={14} label={null} />}
        label="11 commands done, 1 failed"
        href="#chat-chip"
      />
      <ChatChip label="4 files" />
    </Wrapper>
  );
}

export function chatChipTones(): ReactNode {
  return (
    <Wrapper className="gap-2 bg-background">
      <ChatChip label="4 files" />
      <ChatChip tone="attention" label="2 of 3 Subagents done, 1 failed" />
    </Wrapper>
  );
}
