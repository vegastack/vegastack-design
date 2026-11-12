"use client";

import { useState, type ReactNode } from "react";
import { ListChecks, SquareCheck, X } from "lucide-react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/chat-composer` (dogfoods the registry) → auto-scanned.
import { Button } from "@/components/ui/button";
import {
  ChatComposer,
  ChatComposerNotice,
  type ChatComposerStatus,
} from "@/components/ui/chat-composer";
import {
  SplitChip,
  SplitChipButton,
  SplitChipSeparator,
  splitChipIconActionClassName,
} from "@/components/ui/record-chip";
import type { TextEditMentions } from "@/components/ui/text-edit";
import { ComposerChip } from "@/components/ui/composer-chip";
import { ContextRing } from "@/components/ui/context-ring";

const mentions: TextEditMentions = {
  kinds: [
    { id: "agent", noun: "Agent", plural: "Agents", order: 0 },
    { id: "user", noun: "Person", plural: "People", order: 1 },
  ],
  sections: ["people", "agents"],
  search: async (query) =>
    [
      { kind: "agent", id: "boq", label: "BOQ processor" },
      { kind: "agent", id: "assistant", label: "Assistant" },
      { kind: "user", id: "asha", label: "Asha Rao" },
    ].filter((option) =>
      option.label.toLowerCase().includes(query.toLowerCase()),
    ),
};

function ContextChip(): ReactNode {
  return (
    <SplitChip>
      <SplitChipButton>
        <SquareCheck aria-hidden />
        <span className="min-w-0 truncate">SR-12 Fix the IES upload</span>
      </SplitChipButton>
      <SplitChipSeparator />
      <button
        type="button"
        aria-label="Remove page from chat"
        className={splitChipIconActionClassName}
      >
        <X aria-hidden />
      </button>
    </SplitChip>
  );
}

function Column({ children }: { children: ReactNode }): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className="w-full max-w-sm">{children}</div>
    </Wrapper>
  );
}

export function chatComposer(): ReactNode {
  function Demo(): ReactNode {
    const [status, setStatus] = useState<ChatComposerStatus>("idle");
    return (
      <ChatComposer
        placeholder="Ask anything, or @ an agent…"
        status={status}
        chips={<ContextChip />}
        mentions={mentions}
        onAttach={() => {}}
        hint="Only you can see this chat · AI can make mistakes. Verify important info."
        onSubmit={() => {
          setStatus("streaming");
        }}
        onStop={() => setStatus("idle")}
      />
    );
  }
  return (
    <Column>
      <Demo />
    </Column>
  );
}

export function chatComposerStreaming(): ReactNode {
  return (
    <Column>
      <ChatComposer
        placeholder="Ask a follow-up…"
        status="streaming"
        onStop={() => {}}
        onAttach={() => {}}
      />
    </Column>
  );
}

export function chatComposerHeld(): ReactNode {
  return (
    <Column>
      <ChatComposer
        defaultValue="Compare these two datasheets"
        submitDisabled
        submitDisabledReason="datasheet.pdf is still uploading"
        onAttach={() => {}}
      />
    </Column>
  );
}

export function chatComposerError(): ReactNode {
  return (
    <Column>
      <ChatComposer
        defaultValue="Plan my day"
        error="Couldn't send. Try again."
        onAttach={() => {}}
      />
    </Column>
  );
}

export function chatComposerDisabled(): ReactNode {
  return (
    <Column>
      <ChatComposer
        placeholder="Ask a follow-up…"
        disabled
        hint="BOQ processor is paused."
        onAttach={() => {}}
      />
    </Column>
  );
}

export function chatComposerNotice(): ReactNode {
  // A notice attached to the top of the box: a usage limit with its action and ✕, and a paused
  // agent's warning without either.
  function Demo(): ReactNode {
    const [shown, setShown] = useState(true);
    return (
      <ChatComposer
        placeholder="Ask a follow-up…"
        onAttach={() => {}}
        mentions={mentions}
        hint="Only you can see this chat · AI can make mistakes. Verify important info."
        notice={
          shown ? (
            <ChatComposerNotice
              action={
                <Button size="xs" variant="secondary">
                  Details
                </Button>
              }
              onDismiss={() => setShown(false)}
            >
              You've used 90% of this month's agent budget.
            </ChatComposerNotice>
          ) : null
        }
        onSubmit={() => {}}
      />
    );
  }
  return (
    <Wrapper className="flex-col items-stretch justify-start gap-6">
      <div className="w-full max-w-md">
        <Demo />
      </div>
      <div className="w-full max-w-md">
        <ChatComposer
          placeholder="Ask a follow-up…"
          onAttach={() => {}}
          notice={
            <ChatComposerNotice tone="warning">
              BOQ processor is paused. Your message sends when it's turned on.
            </ChatComposerNotice>
          }
        />
      </div>
    </Wrapper>
  );
}

export function chatComposerToolbar(): ReactNode {
  function Demo(): ReactNode {
    const [plan, setPlan] = useState(true);
    return (
      <ChatComposer
        placeholder={
          plan ? "Describe the job. I'll plan it first." : "Ask a follow-up…"
        }
        onAttach={() => {}}
        onSubmit={() => {}}
        toolbarStart={
          <>
            <ComposerChip
              icon={<ListChecks />}
              pressed={plan}
              onPressedChange={setPlan}
              tooltip="Plan first: it reads and proposes, and changes nothing until you accept"
            >
              Plan
            </ComposerChip>
            <ComposerChip menu aria-label="Model: Haiku 5.5">
              Haiku 5.5
            </ComposerChip>
          </>
        }
        toolbarEnd={
          <ContextRing
            used={81_000}
            window={100_000}
            parts={[
              { label: "Instructions & tools", tokens: 14_000 },
              { label: "Conversation", tokens: 52_000 },
              { label: "Tool results", tokens: 15_000 },
            ]}
            onSummarize={() => {}}
          />
        }
      />
    );
  }
  return (
    <Column>
      <Demo />
    </Column>
  );
}
