"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/agent-question-form` (dogfoods the registry) → auto-scanned.
import {
  AgentQuestionAnswers,
  AgentQuestionForm,
  type AgentQuestionFormAnswer,
  type AgentQuestionFormQuestion,
} from "@/components/ui/agent-question-form";

const one: AgentQuestionFormQuestion[] = [
  {
    header: "Colour",
    question: "Which colour temperature should the IP65 range use?",
    options: [
      {
        label: "4000 K",
        description: "Neutral white, the current default for outdoor fittings.",
      },
      {
        label: "3000 K",
        description: "Warmer; needs new samples before the quote goes out.",
      },
      {
        label: "Both",
        description: "Quote both and let the client choose on site.",
      },
    ],
  },
];

const layoutA = `┌──────────────┬───────────────────────────┐
│ Sidebar      │ Task list                 │
│ ▸ Inbox      │ ☐ Order 3000 K samples    │
│ ▸ Projects   │ ☐ Update the datasheet    │
└──────────────┴───────────────────────────┘`;

const layoutB = `┌──────────────────────────────────────────┐
│ Tabs: Inbox · Projects · Tasks            │
├──────────────────────────────────────────┤
│ ☐ Order 3000 K samples                    │
│ ☐ Update the datasheet                    │
└──────────────────────────────────────────┘`;

const batch: AgentQuestionFormQuestion[] = [
  {
    header: "Layout",
    question: "How should the task page be laid out?",
    options: [
      {
        label: "Sidebar",
        description: "Navigation on the left, tasks on the right.",
        preview: layoutA,
      },
      {
        label: "Tabs",
        description: "Navigation as tabs above one full-width list.",
        preview: layoutB,
      },
    ],
  },
  {
    header: "Notify",
    question: "Who should hear about a new task?",
    multiSelect: true,
    options: [
      { label: "Assignee", description: "The person the task is for." },
      { label: "Followers", description: "Everyone following the project." },
      { label: "Channel", description: "A post in the project's channel." },
    ],
  },
  {
    header: "Due date",
    question: "When should tasks be due by default?",
    options: [
      { label: "No date", description: "Leave it to the person." },
      { label: "In a week", description: "Seven days after it is created." },
    ],
  },
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function Column({ children }: { children: ReactNode }): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className="w-full max-w-3xl">{children}</div>
    </Wrapper>
  );
}

function Sent({
  questions,
  answers,
}: {
  questions: AgentQuestionFormQuestion[];
  answers: AgentQuestionFormAnswer[];
}): ReactNode {
  return <AgentQuestionAnswers questions={questions} answers={answers} />;
}

export function agentQuestionForm(): ReactNode {
  function Demo(): ReactNode {
    const [answers, setAnswers] = useState<AgentQuestionFormAnswer[] | null>(
      null,
    );
    return answers ? (
      <Sent questions={batch} answers={answers} />
    ) : (
      <AgentQuestionForm
        questions={batch}
        onSubmit={async (sent) => {
          await wait(600);
          setAnswers(sent);
          return null;
        }}
      />
    );
  }
  return (
    <Column>
      <Demo />
    </Column>
  );
}

export function agentQuestionFormCompact(): ReactNode {
  return (
    <Column>
      <AgentQuestionForm
        questions={one}
        onSubmit={async () => {
          await wait(600);
          return null;
        }}
      />
    </Column>
  );
}

export function agentQuestionFormNarrow(): ReactNode {
  return (
    <Wrapper className="items-stretch justify-start">
      <div className="w-full max-w-sm">
        <AgentQuestionForm
          questions={batch}
          onSubmit={async () => {
            await wait(600);
            return "The agent stopped before your answers arrived. Ask it again.";
          }}
        />
      </div>
    </Wrapper>
  );
}

export function agentQuestionAnswers(): ReactNode {
  return (
    <Column>
      <AgentQuestionAnswers
        questions={batch}
        answers={[
          { selected: ["Sidebar"] },
          {
            selected: ["Assignee", "Channel"],
            notes: "Only the channel for tasks due this week.",
          },
          { selected: [], other: "Two working days, skipping weekends." },
        ]}
      />
    </Column>
  );
}
