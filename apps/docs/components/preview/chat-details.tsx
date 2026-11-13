"use client";

import { useState, type ReactNode } from "react";
import {
  Bot,
  FileSpreadsheet,
  FileText,
  Hash,
  Mail,
  Square,
  SquareTerminal,
} from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/chat-details` (dogfoods the registry).
import {
  ChatDetails,
  ChatDetailsBack,
  ChatDetailsRow,
  ChatDetailsSection,
} from "@/components/ui/chat-details";
import { Button } from "@/components/ui/button";
import { WorkLog } from "@/components/ui/chat-work-log";

const STEPS = [
  {
    type: "dynamic-tool",
    toolName: "web_search",
    toolCallId: "c1",
    state: "output-available" as const,
    output: {},
    resultProviderMetadata: {
      vegastack: {
        verb: "Searched the web",
        subject: "“Hublit LED downlights”",
        meta: "9 results",
        durationMs: 1900,
      },
    },
  },
  {
    type: "dynamic-tool",
    toolName: "web_open",
    toolCallId: "c2",
    state: "output-available" as const,
    output: {},
    resultProviderMetadata: {
      vegastack: { verb: "Opened", subject: "hublit.com", durationMs: 2400 },
    },
  },
  {
    type: "dynamic-tool",
    toolName: "web_open",
    toolCallId: "c3",
    state: "input-available" as const,
    callProviderMetadata: {
      vegastack: { verb: "Opening", subject: "halonix.co.in" },
    },
  },
];

function Panel() {
  const [subagent, setSubagent] = useState<string | null>(null);
  return (
    <div className="h-120 w-80 overflow-hidden rounded-lg border border-chat-hairline bg-background">
      {subagent ? (
        <ChatDetails>
          <ChatDetailsBack
            label="Chat details"
            title={subagent}
            meta="3 steps · 0:41"
            onBack={() => setSubagent(null)}
          />
          <WorkLog parts={STEPS} />
        </ChatDetails>
      ) : (
        <ChatDetails>
          <ChatDetailsSection title="Context" count="39% used">
            <ChatDetailsRow title="385k of 1M tokens" meta="Sonnet 5.5" />
          </ChatDetailsSection>
          <ChatDetailsSection title="Outputs" count={2}>
            <ChatDetailsRow
              icon={<FileText />}
              title="Indian makers — comparison.docx"
              meta="2m ago"
              onOpen={() => {}}
            />
            <ChatDetailsRow
              icon={<FileSpreadsheet />}
              title="Prospects.xlsx"
              meta="5m ago"
              onOpen={() => {}}
            />
          </ChatDetailsSection>
          <ChatDetailsSection
            title="Subagents and background work"
            count="1 running"
          >
            {[
              "Hublit and Halonix",
              "Bhagwati and Instapower",
              "Wipro Lighting",
              "Surya Roshni",
              "Havells",
              "Syska",
              "Philips India",
            ].map((title, index) => (
              <ChatDetailsRow
                key={title}
                icon={index === 6 ? <SquareTerminal /> : <Bot />}
                title={title}
                meta={index === 0 ? "running · 0:41" : "done · 0:52"}
                onOpen={() => setSubagent(title)}
                aside={
                  index === 0 ? (
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label={`Stop ${title}`}
                    >
                      <Square />
                    </Button>
                  ) : undefined
                }
              />
            ))}
          </ChatDetailsSection>
          <ChatDetailsSection title="Connectors" count="1 to reconnect">
            <ChatDetailsRow icon={<Mail />} title="Gmail" meta="used 2 times" />
            <ChatDetailsRow
              icon={<Hash />}
              title="Slack"
              meta="reconnect"
              onOpen={() => {}}
            />
          </ChatDetailsSection>
        </ChatDetails>
      )}
    </div>
  );
}

export function chatDetails(): ReactNode {
  return (
    <Wrapper className="bg-muted/40">
      <Panel />
    </Wrapper>
  );
}
