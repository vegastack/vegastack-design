"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/chat-menu` (dogfoods the registry) → auto-scanned.
import {
  ChatMenu,
  ChatMenuItem,
  ChatMenuSeparator,
  ChatMenuSub,
} from "@/components/ui/chat-menu";

const MODELS = [
  { id: "sonnet", label: "Sonnet 5.5" },
  { id: "opus", label: "Opus 5.5" },
  { id: "haiku", label: "Haiku 5.5" },
];
const EFFORTS = ["Low", "Medium", "High", "Max"];

function ChatMenuDemo() {
  const [model, setModel] = useState("sonnet");
  const [effort, setEffort] = useState("Medium");
  const current = MODELS.find((m) => m.id === model)!.label;
  return (
    <Wrapper className="bg-background">
      <ChatMenu trigger={`${current} · ${effort}`} align="end">
        {MODELS.map((m, index) => (
          <ChatMenuItem
            key={m.id}
            selected={m.id === model}
            shortcut={String(index + 1)}
            onSelect={() => setModel(m.id)}
          >
            {m.label}
          </ChatMenuItem>
        ))}
        <ChatMenuSeparator />
        <ChatMenuSub label="Effort" value={effort}>
          {EFFORTS.map((level, index) => (
            <ChatMenuItem
              key={level}
              selected={level === effort}
              hint={
                level === "Medium"
                  ? "Recommended"
                  : level === "Max"
                    ? "Uses more of your limit"
                    : undefined
              }
              shortcut={String(index + 1)}
              onSelect={() => setEffort(level)}
            >
              {level}
            </ChatMenuItem>
          ))}
        </ChatMenuSub>
        <ChatMenuSub label="More models">
          <ChatMenuItem muted disabled hint="Off · ask an admin">
            Gemini 3 Pro
          </ChatMenuItem>
        </ChatMenuSub>
      </ChatMenu>
    </Wrapper>
  );
}

export function chatMenu(): ReactNode {
  return <ChatMenuDemo />;
}

export function chatMenuUnavailable(): ReactNode {
  return (
    <Wrapper className="bg-background">
      <ChatMenu trigger="Haiku 5.5">
        <ChatMenuItem selected shortcut="1">
          Haiku 5.5
        </ChatMenuItem>
        <ChatMenuItem shortcut="2" muted disabled hint="Off · ask an admin">
          Opus 5.5
        </ChatMenuItem>
      </ChatMenu>
    </Wrapper>
  );
}
