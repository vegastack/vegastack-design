"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/chat-question-card` (dogfoods the registry) → auto-scanned.
import {
  QuestionCard,
  type QuestionData,
} from "@/components/ui/chat-question-card";

const noop = () => {};
const COLUMN = "flex-col flex-nowrap items-stretch gap-3 bg-background";

const QUESTIONS: QuestionData = {
  interactionId: "q1",
  state: "open",
  questions: [
    {
      id: "cards",
      prompt: "How do plan and request cards work on the phone?",
      allowOther: true,
      options: [
        {
          id: "inline-sheet",
          label: "Inline, tap opens a sheet (Recommended)",
          description:
            "A compact card in the thread; tapping it opens a bottom sheet to read and answer.",
        },
        {
          id: "sheet",
          label: "Always a sheet",
          description: "The sheet slides up by itself when the agent asks.",
        },
        {
          id: "inline",
          label: "Inline only",
          description: "Answer right in the thread, no sheet.",
        },
      ],
    },
    {
      id: "address",
      prompt: "Which address is Simran's?",
      allowOther: true,
      options: [
        {
          id: "sm",
          label: "sm@vegastack.com",
          description: "Google directory",
        },
        {
          id: "sm-t1",
          label: "sm+t1@vegastack.com",
          description: "Test seat in VegaStack",
        },
      ],
    },
    {
      id: "haptics",
      prompt: "When should the phone buzz?",
      allowOther: false,
      multi: true,
      options: [
        { id: "send", label: "When you send" },
        { id: "done", label: "When the answer is finished" },
        { id: "needs", label: "When the agent needs you" },
      ],
    },
    {
      id: "tone",
      prompt: "How formal should the email be?",
      allowOther: true,
      options: [
        { id: "warm", label: "Warm" },
        { id: "formal", label: "Formal" },
      ],
    },
  ],
};

export function chatQuestionCard(): ReactNode {
  return (
    <Wrapper className={COLUMN}>
      <QuestionCard data={QUESTIONS} onSubmit={noop} onSkip={noop} />
    </Wrapper>
  );
}

export function chatQuestionCardOne(): ReactNode {
  // One question: its title shares Skip's row, and a long one wraps beside it.
  return (
    <Wrapper className={COLUMN}>
      <QuestionCard
        data={{
          ...QUESTIONS,
          interactionId: "q-one",
          questions: [
            {
              ...QUESTIONS.questions[1]!,
              prompt:
                "Which address should get the comparison, Simran's work address or the shared sales inbox she reads every morning?",
            },
          ],
        }}
        onSubmit={noop}
        onSkip={noop}
      />
    </Wrapper>
  );
}

export function chatQuestionCardLines(): ReactNode {
  return (
    <Wrapper className={COLUMN}>
      <QuestionCard
        data={{
          ...QUESTIONS,
          questions: [QUESTIONS.questions[1]!],
          state: "answered",
          answers: { address: "sm" },
        }}
        onSubmit={noop}
        onSkip={noop}
      />
      <QuestionCard
        data={{
          ...QUESTIONS,
          state: "answered",
          answers: {
            cards: "inline-sheet",
            address: "sm",
            haptics: "send, needs",
            tone: "Friendly but short",
          },
        }}
        onSubmit={noop}
        onSkip={noop}
      />
      <QuestionCard
        data={{ ...QUESTIONS, state: "skipped", skipped: 2 }}
        onSubmit={noop}
        onSkip={noop}
      />
    </Wrapper>
  );
}
