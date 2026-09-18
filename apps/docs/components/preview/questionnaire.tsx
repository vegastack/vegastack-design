"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { QuestionnaireItemStatus } from "@shadcn/react/questionnaire";
// The headless engine behind the styled parts — mounted directly by the Unstyled fixture only.
import { Questionnaire as QuestionnairePrimitive } from "@shadcn/react/questionnaire";
import { z } from "zod";
import { Wrapper } from "./wrapper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
// Copied INTO apps/docs via `shadcn add @vegastack/questionnaire` → auto-scanned.
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire";

/**
 * Upstream's examples all end in a `toast`. These fixtures are also the geometry lane's mount
 * targets, so the result lands in a polite status line instead: same proof, no portal, no timer.
 */
function useAnswerLine() {
  const [answer, setAnswer] = useState<string | null>(null);
  const line = (
    <p role="status" className="min-h-[1lh] text-sm text-muted-foreground">
      {answer ?? "No answer submitted yet."}
    </p>
  );
  return [line, setAnswer] as const;
}

const read = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  return new FormData(event.currentTarget);
};

/* ---------------------------------------------------------------------------
 * Usage
 * -------------------------------------------------------------------------*/

const USAGE_ITEMS = [
  { name: "direction", required: true },
  { name: "detail" },
] as const;

export function questionnaire(): ReactNode {
  const [line, setAnswer] = useAnswerLine();

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-4">
        <Questionnaire
          items={USAGE_ITEMS}
          onSubmit={(event) => {
            const data = read(event);
            setAnswer(
              `Direction: ${data.get("direction") ?? "None"} · Detail: ${data.get("detail") ?? "None"}`,
            );
          }}
        >
          <QuestionnaireProgress />

          <QuestionnaireItem name="direction" required>
            <QuestionnaireTitle>
              What should we prototype next?
            </QuestionnaireTitle>
            <QuestionnaireDescription>
              Choose a direction or write your own.
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="delegation">
                <span className="font-medium">Delegation</span>
                <QuestionnaireChoiceDescription>
                  Show how work moves to a specialist.
                </QuestionnaireChoiceDescription>
              </QuestionnaireChoice>
              <QuestionnaireChoice value="questions">
                <span className="font-medium">Question prompts</span>
                <QuestionnaireChoiceDescription>
                  Show choices while the interface waits.
                </QuestionnaireChoiceDescription>
              </QuestionnaireChoice>
              <QuestionnaireChoice value="both">
                Both together
              </QuestionnaireChoice>
              <QuestionnaireInput
                aria-label="Another answer"
                placeholder="Type another answer…"
              />
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireItem name="detail">
            <QuestionnaireTitle>
              How much detail should it include?
            </QuestionnaireTitle>
            <QuestionnaireDescription>
              Skip this if you are not sure yet.
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="focused">Focused</QuestionnaireChoice>
              <QuestionnaireChoice value="complete">
                Complete flow
              </QuestionnaireChoice>
            </QuestionnaireChoices>
          </QuestionnaireItem>

          <QuestionnaireActions>
            <QuestionnairePrevious />
            <QuestionnaireSkip />
            <QuestionnaireNext />
            <QuestionnaireSubmit />
          </QuestionnaireActions>
        </Questionnaire>
        {line}
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Composition
 * -------------------------------------------------------------------------*/

export function questionnaireComposition(): ReactNode {
  const [line, setAnswer] = useAnswerLine();
  const items = [{ name: "shape", required: true }] as const;

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-4">
        <Questionnaire
          items={items}
          onSubmit={(event) =>
            setAnswer(`Shape: ${read(event).get("shape") ?? "None"}`)
          }
        >
          <QuestionnaireProgress />
          <QuestionnaireItem
            name="shape"
            required
            className="rounded-lg border border-dashed border-border p-3"
          >
            <QuestionnaireTitle>
              Which part owns which decision?
            </QuestionnaireTitle>
            <QuestionnaireDescription>
              Questionnaire owns the ordered items, the active item, answers,
              validation, progress and navigation.
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="questionnaire">
                <span className="font-medium">The Questionnaire</span>
                <QuestionnaireChoiceDescription>
                  Items, active item, answers, validation, progress, navigation.
                </QuestionnaireChoiceDescription>
              </QuestionnaireChoice>
              <QuestionnaireChoice value="host">
                <span className="font-medium">The page, card or dialog</span>
                <QuestionnaireChoiceDescription>
                  Close and cancellation, persistence, transport, branching.
                </QuestionnaireChoiceDescription>
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>
          <QuestionnaireActions>
            <QuestionnaireSubmit>Confirm</QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>
        {line}
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Server Rendering
 * -------------------------------------------------------------------------*/

const SERVER_ITEMS = [
  {
    choices: [{ value: "a" }, { value: "b" }],
    name: "runtime",
    required: true,
  },
  { name: "region", required: true },
  { name: "notes" },
] as const;

export function questionnaireServerRendering(): ReactNode {
  const [line, setAnswer] = useAnswerLine();

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-4">
        {/* `items` is the whole point: with the collection declared up front, progress, the
            navigation actions and the answer shortcuts are correct in the FIRST paint, before
            any client JavaScript has measured the DOM. */}
        <Questionnaire
          items={SERVER_ITEMS}
          shortcuts="numbers"
          onSubmit={(event) => {
            const data = read(event);
            setAnswer(
              `Runtime: ${data.get("runtime") ?? "None"} · Region: ${data.get("region") ?? "None"}`,
            );
          }}
        >
          <QuestionnaireProgress />
          <QuestionnaireItem name="runtime" required>
            <QuestionnaireTitle>Where should this run?</QuestionnaireTitle>
            <QuestionnaireDescription>
              Progress already reads “Question 1 of 3” on the server.
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="a">
                Local workspace
              </QuestionnaireChoice>
              <QuestionnaireChoice value="b">
                Cloud workspace
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>
          <QuestionnaireItem name="region" required>
            <QuestionnaireTitle>Which region?</QuestionnaireTitle>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="eu">Europe</QuestionnaireChoice>
              <QuestionnaireChoice value="us">
                North America
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>
          <QuestionnaireItem name="notes">
            <QuestionnaireTitle>Anything else?</QuestionnaireTitle>
            <QuestionnaireInput
              aria-label="Deployment notes"
              placeholder="Optional…"
            />
          </QuestionnaireItem>
          <QuestionnaireActions>
            <QuestionnairePrevious />
            <QuestionnaireSkip />
            <QuestionnaireNext>Next</QuestionnaireNext>
            <QuestionnaireSubmit>Save</QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>
        {line}
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Multiple Selection
 * -------------------------------------------------------------------------*/

export function questionnaireMultiple(): ReactNode {
  const [line, setAnswer] = useAnswerLine();
  const items = [
    {
      choices: [
        { value: "source" },
        { value: "tests" },
        { value: "docs" },
        { value: "history" },
      ],
      name: "context",
      required: true,
    },
  ] as const;

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-4">
        <Questionnaire
          items={items}
          shortcuts="letters"
          onSubmit={(event) =>
            setAnswer(
              `Context: ${read(event).getAll("context").join(", ") || "None"}`,
            )
          }
        >
          <QuestionnaireItem name="context" multiple required>
            <QuestionnaireTitle>
              What context should the agent inspect?
            </QuestionnaireTitle>
            <QuestionnaireDescription>
              Select every source that may affect the implementation.
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="source">
                Relevant source files
              </QuestionnaireChoice>
              <QuestionnaireChoice value="tests">
                Existing tests
              </QuestionnaireChoice>
              <QuestionnaireChoice value="docs">
                Architecture documentation
              </QuestionnaireChoice>
              <QuestionnaireChoice value="history">
                Recent commit history
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>
          <QuestionnaireActions>
            <QuestionnaireSubmit>Share context</QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>
        {line}
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Freeform Answer
 * -------------------------------------------------------------------------*/

export function questionnaireFreeform(): ReactNode {
  const [line, setAnswer] = useAnswerLine();
  const items = [
    {
      choices: [
        { value: "incremental" },
        { value: "module" },
        { value: "rewrite" },
      ],
      name: "approach",
      required: true,
    },
  ] as const;

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-4">
        <Questionnaire
          items={items}
          shortcuts="letters"
          onSubmit={(event) =>
            setAnswer(`Approach: ${read(event).get("approach") ?? "None"}`)
          }
        >
          <QuestionnaireItem name="approach" required>
            <QuestionnaireTitle>
              How should the agent approach this refactor?
            </QuestionnaireTitle>
            <QuestionnaireDescription>
              Choose a strategy or write a more specific instruction.
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="incremental">
                Make the smallest safe change
              </QuestionnaireChoice>
              <QuestionnaireChoice value="module">
                Refactor one module at a time
              </QuestionnaireChoice>
              <QuestionnaireChoice value="rewrite">
                Replace the implementation completely
              </QuestionnaireChoice>
              {/* The freeform field is one more choice in the same group, so picking it clears
                  the fixed answers and vice versa. It always needs its own accessible name. */}
              <QuestionnaireInput
                aria-label="Another refactoring approach"
                placeholder="Describe another approach…"
              />
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>
          <QuestionnaireActions>
            <QuestionnaireSubmit>Use this approach</QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>
        {line}
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Explicit Skip
 * -------------------------------------------------------------------------*/

export function questionnaireSkip(): ReactNode {
  const [line, setAnswer] = useAnswerLine();
  const [constraintStatus, setConstraintStatus] =
    useState<QuestionnaireItemStatus>("unanswered");
  const items = [
    { name: "task", required: true },
    { name: "constraints" },
    { name: "review", required: true },
  ] as const;

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-4">
        <Questionnaire
          defaultItem="task"
          items={items}
          onSubmit={(event) => {
            const data = read(event);
            setAnswer(
              `Task: ${data.get("task") ?? "None"} · Constraints: ${
                constraintStatus === "skipped"
                  ? "Skipped"
                  : (data.get("constraints") ?? "None")
              } · Review: ${data.get("review") ?? "None"}`,
            );
          }}
        >
          <QuestionnaireProgress />

          <QuestionnaireItem name="task" required>
            <QuestionnaireTitle>
              What kind of change is this?
            </QuestionnaireTitle>
            <QuestionnaireDescription>
              Choose the category that best describes the work.
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="feature">
                New feature
              </QuestionnaireChoice>
              <QuestionnaireChoice value="fix">Bug fix</QuestionnaireChoice>
              <QuestionnaireChoice value="refactor">
                Refactor
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireItem
            name="constraints"
            onStatusChange={setConstraintStatus}
          >
            <QuestionnaireTitle>
              Are there any implementation constraints?
            </QuestionnaireTitle>
            <QuestionnaireDescription>
              Answer if needed, or intentionally skip this question — the status
              records that the reader decided, rather than just left it blank.
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="no-dependencies">
                Do not add dependencies
              </QuestionnaireChoice>
              <QuestionnaireChoice value="no-migrations">
                Do not change the database
              </QuestionnaireChoice>
              <QuestionnaireChoice value="preserve-api">
                Preserve the public API
              </QuestionnaireChoice>
              <QuestionnaireInput
                aria-label="Another implementation constraint"
                placeholder="Describe another constraint…"
              />
            </QuestionnaireChoices>
          </QuestionnaireItem>

          <QuestionnaireItem name="review" required>
            <QuestionnaireTitle>
              How should the work be reviewed?
            </QuestionnaireTitle>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="tests">
                Run the test suite
              </QuestionnaireChoice>
              <QuestionnaireChoice value="diff">
                Review the final diff
              </QuestionnaireChoice>
              <QuestionnaireChoice value="both">
                Tests and diff review
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireActions>
            <QuestionnairePrevious />
            <QuestionnaireSkip />
            <QuestionnaireNext>Next</QuestionnaireNext>
            <QuestionnaireSubmit>Submit brief</QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>
        {line}
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Shortcuts
 * -------------------------------------------------------------------------*/

type ShortcutMode = "letters" | "numbers" | undefined;

export function questionnaireShortcuts(): ReactNode {
  const [line, setAnswer] = useAnswerLine();
  const [shortcuts, setShortcuts] = useState<ShortcutMode>("letters");
  const items = [
    {
      choices: [{ value: "inspect" }, { value: "tests" }, { value: "patch" }],
      name: "action",
      required: true,
    },
  ] as const;

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-4">
        <NativeSelect
          aria-label="Shortcut style"
          className="self-end"
          value={shortcuts ?? "none"}
          onChange={(event) => {
            const value = event.target.value;
            setShortcuts(
              value === "letters" || value === "numbers" ? value : undefined,
            );
          }}
        >
          <NativeSelectOption value="none">No shortcuts</NativeSelectOption>
          <NativeSelectOption value="letters">Letters</NativeSelectOption>
          <NativeSelectOption value="numbers">Numbers</NativeSelectOption>
        </NativeSelect>

        <Questionnaire
          items={items}
          shortcuts={shortcuts}
          onSubmit={(event) =>
            setAnswer(`Action: ${read(event).get("action") ?? "None"}`)
          }
        >
          <QuestionnaireItem name="action" required>
            <QuestionnaireTitle>
              What should the agent do next?
            </QuestionnaireTitle>
            <QuestionnaireDescription>
              Use the displayed shortcut or navigate with the keyboard.
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="inspect">
                Inspect the implementation
              </QuestionnaireChoice>
              <QuestionnaireChoice value="tests">
                Run the relevant tests
              </QuestionnaireChoice>
              <QuestionnaireChoice value="patch">
                Prepare the patch
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>
          <QuestionnaireActions>
            <QuestionnaireSubmit>Confirm action</QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>
        {line}
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Custom Validation
 * -------------------------------------------------------------------------*/

const validationSchema = z
  .object({
    detail: z.enum(["summary", "complete"]),
    audience: z.enum(["team", "public"]),
  })
  .superRefine((answers, context) => {
    if (answers.audience === "public" && answers.detail === "summary") {
      context.addIssue({
        code: "custom",
        message:
          "Public answers need enough context. Choose a complete answer.",
        path: ["detail"],
      });
    }
  });

type ValidationName = "detail" | "audience";

function ValidationProgress() {
  return (
    <QuestionnaireProgress
      className="min-w-0"
      render={(props, state) => (
        <div {...props}>
          {state.current} / {state.total}
        </div>
      )}
    />
  );
}

export function questionnaireValidation(): ReactNode {
  const [line, setAnswer] = useAnswerLine();
  const [item, setItem] = useState("detail");
  const [errors, setErrors] = useState<Partial<Record<ValidationName, string>>>(
    {},
  );
  const items = [
    { name: "detail", required: true },
    { name: "audience", required: true },
  ] as const;

  function clearError(name: ValidationName) {
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-4">
        <Questionnaire
          item={item}
          items={items}
          onItemChange={setItem}
          onSubmit={(event) => {
            const result = validationSchema.safeParse(
              Object.fromEntries(read(event)),
            );
            if (result.success) {
              setErrors({});
              setAnswer(
                `Detail: ${result.data.detail} · Audience: ${result.data.audience}`,
              );
              return;
            }
            const next: Partial<Record<ValidationName, string>> = {};
            for (const issue of result.error.issues) {
              const name = issue.path[0];
              if ((name === "detail" || name === "audience") && !next[name]) {
                next[name] = issue.message;
              }
            }
            setErrors(next);
            const first = result.error.issues[0]?.path[0];
            if (first === "detail" || first === "audience") setItem(first);
          }}
        >
          <Card className="w-full">
            <QuestionnaireItem
              invalid={Boolean(errors.detail)}
              name="detail"
              required
            >
              <CardHeader>
                <QuestionnaireTitle>
                  How much detail should the answer include?
                </QuestionnaireTitle>
                <QuestionnaireDescription>
                  Choose the response depth.
                </QuestionnaireDescription>
                <CardAction>
                  <ValidationProgress />
                </CardAction>
              </CardHeader>
              <CardContent>
                <QuestionnaireChoices>
                  <QuestionnaireChoice
                    value="summary"
                    onChange={() => clearError("detail")}
                  >
                    Concise summary
                  </QuestionnaireChoice>
                  <QuestionnaireChoice
                    value="complete"
                    onChange={() => clearError("detail")}
                  >
                    Complete answer
                  </QuestionnaireChoice>
                </QuestionnaireChoices>
                <QuestionnaireError>{errors.detail}</QuestionnaireError>
              </CardContent>
            </QuestionnaireItem>

            <QuestionnaireItem
              invalid={Boolean(errors.audience)}
              name="audience"
              required
            >
              <CardHeader>
                <QuestionnaireTitle>
                  Who will read the answer?
                </QuestionnaireTitle>
                <QuestionnaireDescription>
                  Public answers require complete context.
                </QuestionnaireDescription>
                <CardAction>
                  <ValidationProgress />
                </CardAction>
              </CardHeader>
              <CardContent>
                <QuestionnaireChoices>
                  <QuestionnaireChoice
                    value="team"
                    onChange={() => clearError("audience")}
                  >
                    My team
                  </QuestionnaireChoice>
                  <QuestionnaireChoice
                    value="public"
                    onChange={() => clearError("audience")}
                  >
                    Public audience
                  </QuestionnaireChoice>
                </QuestionnaireChoices>
                <QuestionnaireError>{errors.audience}</QuestionnaireError>
              </CardContent>
            </QuestionnaireItem>

            <CardFooter>
              <QuestionnaireActions>
                <QuestionnairePrevious />
                <QuestionnaireNext>Next</QuestionnaireNext>
                <QuestionnaireSubmit>Validate answers</QuestionnaireSubmit>
              </QuestionnaireActions>
            </CardFooter>
          </Card>
        </Questionnaire>
        {line}
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Controlled
 * -------------------------------------------------------------------------*/

const CONTROLLED_LABELS: Record<string, string> = {
  scope: "Change scope",
  checks: "Verification",
  output: "Final output",
};

export function questionnaireControlled(): ReactNode {
  const [line, setAnswer] = useAnswerLine();
  const [item, setItem] = useState("scope");
  const items = [
    { name: "scope", required: true },
    { name: "checks", required: true },
    { name: "output", required: true },
  ] as const;

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-4">
        <p className="text-sm text-muted-foreground" role="status">
          Current checkpoint: {CONTROLLED_LABELS[item]}
        </p>

        <Questionnaire
          item={item}
          items={items}
          onItemChange={setItem}
          onSubmit={(event) => {
            const data = read(event);
            setAnswer(
              `Scope: ${data.get("scope") ?? "None"} · Verification: ${data.get("checks") ?? "None"} · Output: ${data.get("output") ?? "None"}`,
            );
          }}
        >
          <QuestionnaireProgress />

          <QuestionnaireItem name="scope" required>
            <QuestionnaireTitle>What may the agent change?</QuestionnaireTitle>
            <QuestionnaireDescription>
              The host stores the active checkpoint while Questionnaire
              navigates.
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="component">
                Only the target component
              </QuestionnaireChoice>
              <QuestionnaireChoice value="tests">
                Component and related tests
              </QuestionnaireChoice>
              <QuestionnaireChoice value="feature">
                The complete feature area
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireItem name="checks" required>
            <QuestionnaireTitle>
              Which verification level should it use?
            </QuestionnaireTitle>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="targeted">
                Targeted tests
              </QuestionnaireChoice>
              <QuestionnaireChoice value="package">
                Package tests and typecheck
              </QuestionnaireChoice>
              <QuestionnaireChoice value="full">
                Full workspace verification
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireItem name="output" required>
            <QuestionnaireTitle>
              What should the agent return when finished?
            </QuestionnaireTitle>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="summary">
                Concise summary
              </QuestionnaireChoice>
              <QuestionnaireChoice value="diff">
                Summary with changed files
              </QuestionnaireChoice>
              <QuestionnaireChoice value="handoff">
                Detailed implementation handoff
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireActions>
            <QuestionnairePrevious />
            <QuestionnaireNext>Next</QuestionnaireNext>
            <QuestionnaireSubmit>Save workflow</QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>
        {line}
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Resume
 * -------------------------------------------------------------------------*/

export function questionnaireResume(): ReactNode {
  const [line, setAnswer] = useAnswerLine();
  const items = [
    { name: "change", required: true },
    { name: "verification", required: true },
    { name: "notes" },
  ] as const;

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-4">
        {/* `defaultItem` restores the saved position, `defaultChecked` / `defaultValue` restore
            the saved answers, and a native `type="reset"` returns to exactly that state. */}
        <Questionnaire
          defaultItem="verification"
          items={items}
          onReset={() => setAnswer("Saved answers restored.")}
          onSubmit={(event) => {
            const data = read(event);
            setAnswer(
              `Migration: ${data.get("change") ?? "None"} · Verification: ${data.getAll("verification").join(", ") || "None"} · Notes: ${data.get("notes") || "None"}`,
            );
          }}
        >
          <QuestionnaireProgress />

          <QuestionnaireItem name="change" required>
            <QuestionnaireTitle>
              What kind of migration is this?
            </QuestionnaireTitle>
            <QuestionnaireDescription>
              This answer was saved during the previous session.
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="incremental" defaultChecked>
                Incremental migration
              </QuestionnaireChoice>
              <QuestionnaireChoice value="cutover">
                Single cutover
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireItem name="verification" multiple required>
            <QuestionnaireTitle>
              How should the migration be verified?
            </QuestionnaireTitle>
            <QuestionnaireDescription>
              These checks were selected during the previous session.
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="tests" defaultChecked>
                Run migration tests
              </QuestionnaireChoice>
              <QuestionnaireChoice value="typecheck" defaultChecked>
                Run the typecheck
              </QuestionnaireChoice>
              <QuestionnaireChoice value="manual">
                Perform a manual smoke test
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireItem name="notes">
            <QuestionnaireTitle>
              Anything else the agent should remember?
            </QuestionnaireTitle>
            <QuestionnaireDescription>
              This note was saved with the draft.
            </QuestionnaireDescription>
            <QuestionnaireInput
              aria-label="Saved migration note"
              defaultValue="Keep the existing public API stable."
            />
          </QuestionnaireItem>

          <QuestionnaireActions>
            <Button type="reset" variant="outline">
              Reset changes
            </Button>
            <QuestionnairePrevious />
            <QuestionnaireNext>Next</QuestionnaireNext>
            <QuestionnaireSubmit>Update draft</QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>
        {line}
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Conditional Items
 * -------------------------------------------------------------------------*/

export function questionnaireConditional(): ReactNode {
  const [line, setAnswer] = useAnswerLine();
  const [runtime, setRuntime] = useState("local");
  const items = useMemo(
    () => [
      { name: "runtime", required: true },
      { disabled: runtime !== "cloud", name: "environment", required: true },
      { name: "approval", required: true },
    ],
    [runtime],
  );

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-4">
        <Questionnaire
          defaultItem="runtime"
          items={items}
          onSubmit={(event) => {
            const data = read(event);
            setAnswer(
              `Runtime: ${data.get("runtime") ?? "None"} · Environment: ${data.get("environment") ?? "Not applicable"} · Approval: ${data.get("approval") ?? "None"}`,
            );
          }}
        >
          <QuestionnaireProgress />

          <QuestionnaireItem name="runtime" required>
            <QuestionnaireTitle>Where should the agent run?</QuestionnaireTitle>
            <QuestionnaireDescription>
              Cloud runs add an environment question to this flow.
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice
                checked={runtime === "local"}
                value="local"
                onChange={() => setRuntime("local")}
              >
                Local workspace
              </QuestionnaireChoice>
              <QuestionnaireChoice
                checked={runtime === "cloud"}
                value="cloud"
                onChange={() => setRuntime("cloud")}
              >
                Cloud workspace
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireItem
            disabled={runtime !== "cloud"}
            name="environment"
            required
          >
            <QuestionnaireTitle>
              Which cloud environment should it use?
            </QuestionnaireTitle>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="preview">Preview</QuestionnaireChoice>
              <QuestionnaireChoice value="staging">Staging</QuestionnaireChoice>
              <QuestionnaireChoice value="isolated">
                Isolated sandbox
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireItem name="approval" required>
            <QuestionnaireTitle>
              When should the agent request approval?
            </QuestionnaireTitle>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="writes">
                Before writing files
              </QuestionnaireChoice>
              <QuestionnaireChoice value="commands">
                Before running commands
              </QuestionnaireChoice>
              <QuestionnaireChoice value="sensitive">
                Only for sensitive actions
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireActions>
            <QuestionnairePrevious />
            <QuestionnaireNext>Next</QuestionnaireNext>
            <QuestionnaireSubmit>Save execution plan</QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>
        {line}
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Navigation State
 * -------------------------------------------------------------------------*/

type NavItemName = "permission" | "verification";

export function questionnaireNavigationState(): ReactNode {
  const [line, setAnswer] = useAnswerLine();
  const [item, setItem] = useState<NavItemName>("permission");
  const [statuses, setStatuses] = useState<
    Record<NavItemName, QuestionnaireItemStatus>
  >({ permission: "unanswered", verification: "unanswered" });
  const unanswered = statuses[item] === "unanswered";
  const items = [
    { name: "permission", required: true },
    { name: "verification", required: true },
  ] as const;

  const setStatus = (name: NavItemName, status: QuestionnaireItemStatus) =>
    setStatuses((current) => ({ ...current, [name]: status }));

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-4">
        <Questionnaire
          item={item}
          items={items}
          onItemChange={(next) => setItem(next as NavItemName)}
          onSubmit={(event) => {
            const data = read(event);
            setAnswer(
              `Permission: ${data.get("permission") ?? "None"} · Verification: ${data.get("verification") ?? "None"}`,
            );
          }}
        >
          <QuestionnaireProgress />

          <QuestionnaireItem
            name="permission"
            required
            onStatusChange={(status) => setStatus("permission", status)}
          >
            <QuestionnaireTitle>What may the agent modify?</QuestionnaireTitle>
            <QuestionnaireDescription>
              Next is intentionally disabled until an answer is selected.
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="files">
                Project files
              </QuestionnaireChoice>
              <QuestionnaireChoice value="tests">
                Project files and tests
              </QuestionnaireChoice>
              <QuestionnaireChoice value="config">
                Files, tests, and configuration
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireItem
            name="verification"
            required
            onStatusChange={(status) => setStatus("verification", status)}
          >
            <QuestionnaireTitle>
              What must pass before completion?
            </QuestionnaireTitle>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="tests">Tests</QuestionnaireChoice>
              <QuestionnaireChoice value="types">
                Tests and types
              </QuestionnaireChoice>
              <QuestionnaireChoice value="all">
                Tests, types, and visual QA
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireActions>
            <QuestionnairePrevious />
            <QuestionnaireNext
              className="data-[status=unanswered]:opacity-50"
              disabled={unanswered}
              variant="secondary"
            >
              Next
            </QuestionnaireNext>
            <QuestionnaireSubmit disabled={unanswered}>
              Save permissions
            </QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>
        {line}
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Custom Progress
 * -------------------------------------------------------------------------*/

export function questionnaireProgress(): ReactNode {
  const [line, setAnswer] = useAnswerLine();
  const items = [
    { name: "scope", required: true },
    { name: "strategy", required: true },
    { name: "tests", required: true },
    { name: "delivery", required: true },
  ] as const;

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-4">
        <Questionnaire
          defaultItem="scope"
          items={items}
          onSubmit={(event) => {
            const data = read(event);
            setAnswer(
              `Scope: ${data.get("scope") ?? "None"} · Commits: ${data.get("strategy") ?? "None"} · Tests: ${data.get("tests") ?? "None"} · Delivery: ${data.get("delivery") ?? "None"}`,
            );
          }}
        >
          <QuestionnaireProgress
            className="w-full"
            render={(props, state) => (
              <div {...props}>
                <div className="mb-2 flex gap-1.5" aria-hidden="true">
                  {Array.from({ length: state.total }, (_, index) => (
                    <span
                      key={index}
                      className={
                        index < state.current
                          ? "h-1.5 flex-1 rounded-full bg-primary"
                          : "h-1.5 flex-1 rounded-full bg-muted"
                      }
                    />
                  ))}
                </div>
                <span>
                  Checkpoint {state.current} of {state.total}
                </span>
              </div>
            )}
          />

          <QuestionnaireItem name="scope" required>
            <QuestionnaireTitle>How large is the change?</QuestionnaireTitle>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="small">
                Small patch
              </QuestionnaireChoice>
              <QuestionnaireChoice value="medium">
                Feature-sized change
              </QuestionnaireChoice>
              <QuestionnaireChoice value="large">
                Cross-package change
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireItem name="strategy" required>
            <QuestionnaireTitle>
              How should commits be organized?
            </QuestionnaireTitle>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="single">
                Single commit
              </QuestionnaireChoice>
              <QuestionnaireChoice value="logical">
                Logical commits
              </QuestionnaireChoice>
              <QuestionnaireChoice value="squash">
                Squash before review
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireItem name="tests" required>
            <QuestionnaireTitle>Which tests should run?</QuestionnaireTitle>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="targeted">
                Targeted tests
              </QuestionnaireChoice>
              <QuestionnaireChoice value="package">
                Package suite
              </QuestionnaireChoice>
              <QuestionnaireChoice value="workspace">
                Full workspace
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireItem name="delivery" required>
            <QuestionnaireTitle>
              How should the work be delivered?
            </QuestionnaireTitle>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="patch">
                Patch only
              </QuestionnaireChoice>
              <QuestionnaireChoice value="commit">
                Committed locally
              </QuestionnaireChoice>
              <QuestionnaireChoice value="branch">
                Push a review branch
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireActions>
            <QuestionnairePrevious />
            <QuestionnaireNext>Next</QuestionnaireNext>
            <QuestionnaireSubmit>Finish plan</QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>
        {line}
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Animated Items
 * -------------------------------------------------------------------------*/

// `motion-enter-up` is the system's fade-and-rise arrival; base.css collapses it under
// `prefers-reduced-motion`, so no per-element `motion-reduce:` restatement is needed.
const ANIMATED_ITEM = "data-active:motion-enter-up";

export function questionnaireAnimated(): ReactNode {
  const [line, setAnswer] = useAnswerLine();
  const items = [
    { name: "task", required: true },
    { name: "review", required: true },
    { name: "delivery", required: true },
  ] as const;

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-4">
        <Questionnaire
          defaultItem="task"
          items={items}
          onSubmit={(event) => {
            const data = read(event);
            setAnswer(
              `Task: ${data.get("task") ?? "None"} · Review: ${data.get("review") ?? "None"} · Delivery: ${data.get("delivery") ?? "None"}`,
            );
          }}
        >
          <QuestionnaireProgress />

          <QuestionnaireItem className={ANIMATED_ITEM} name="task" required>
            <QuestionnaireTitle>What should the agent do?</QuestionnaireTitle>
            <QuestionnaireDescription>
              Choose the task for this run.
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="implement">
                Implement the requested change
              </QuestionnaireChoice>
              <QuestionnaireChoice value="debug">
                Debug the current behavior
              </QuestionnaireChoice>
              <QuestionnaireChoice value="review">
                Review the implementation
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireItem className={ANIMATED_ITEM} name="review" required>
            <QuestionnaireTitle>
              How should the work be reviewed?
            </QuestionnaireTitle>
            <QuestionnaireDescription>
              Select the verification depth.
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="targeted">
                Targeted checks
              </QuestionnaireChoice>
              <QuestionnaireChoice value="complete">
                Complete test suite
              </QuestionnaireChoice>
              <QuestionnaireChoice value="manual">
                Tests and manual QA
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireItem className={ANIMATED_ITEM} name="delivery" required>
            <QuestionnaireTitle>
              How should the result be delivered?
            </QuestionnaireTitle>
            <QuestionnaireDescription>
              Choose the final handoff format.
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="summary">
                Concise summary
              </QuestionnaireChoice>
              <QuestionnaireChoice value="diff">
                Summary and changed files
              </QuestionnaireChoice>
              <QuestionnaireChoice value="handoff">
                Detailed review handoff
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireActions>
            <QuestionnairePrevious />
            <QuestionnaireNext>Next</QuestionnaireNext>
            <QuestionnaireSubmit>Save workflow</QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>
        {line}
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Card
 * -------------------------------------------------------------------------*/

export function questionnaireCard(): ReactNode {
  const [line, setAnswer] = useAnswerLine();
  const items = [
    {
      choices: [{ value: "fix" }, { value: "refactor" }, { value: "docs" }],
      name: "task",
      required: true,
    },
    {
      choices: [{ value: "summary" }, { value: "files" }, { value: "review" }],
      name: "output",
      required: true,
    },
  ] as const;

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-4">
        <Questionnaire
          defaultItem="task"
          items={items}
          shortcuts="numbers"
          onSubmit={(event) => {
            const data = read(event);
            setAnswer(
              `Task: ${data.get("task") ?? "None"} · Handoff: ${data.get("output") ?? "None"}`,
            );
          }}
        >
          <Card>
            {/* The Card slots own the chrome; the question keeps its own semantics, so the
                title still renders the fieldset's legend and the item is named by it. */}
            <QuestionnaireItem
              aria-labelledby="questionnaire-card-task"
              name="task"
              required
            >
              <CardHeader>
                <QuestionnaireTitle
                  id="questionnaire-card-task"
                  render={<CardTitle />}
                >
                  What should the agent work on?
                </QuestionnaireTitle>
                <QuestionnaireDescription render={<CardDescription />}>
                  Choose the task that should be handled next.
                </QuestionnaireDescription>
                <CardAction>
                  <QuestionnaireProgress />
                </CardAction>
              </CardHeader>
              <CardContent>
                <QuestionnaireChoices>
                  <QuestionnaireChoice value="fix">
                    Fix the failing tests
                  </QuestionnaireChoice>
                  <QuestionnaireChoice value="refactor">
                    Refactor the data layer
                  </QuestionnaireChoice>
                  <QuestionnaireChoice value="docs">
                    Update the integration guide
                  </QuestionnaireChoice>
                </QuestionnaireChoices>
                <QuestionnaireError />
              </CardContent>
            </QuestionnaireItem>

            <QuestionnaireItem
              aria-labelledby="questionnaire-card-output"
              name="output"
              required
            >
              <CardHeader>
                <QuestionnaireTitle
                  id="questionnaire-card-output"
                  render={<CardTitle />}
                >
                  What should the final handoff include?
                </QuestionnaireTitle>
                <QuestionnaireDescription render={<CardDescription />}>
                  Pick the level of detail needed for review.
                </QuestionnaireDescription>
                <CardAction>
                  <QuestionnaireProgress />
                </CardAction>
              </CardHeader>
              <CardContent>
                <QuestionnaireChoices>
                  <QuestionnaireChoice value="summary">
                    Summary only
                  </QuestionnaireChoice>
                  <QuestionnaireChoice value="files">
                    Summary and changed files
                  </QuestionnaireChoice>
                  <QuestionnaireChoice value="review">
                    Full review handoff
                  </QuestionnaireChoice>
                </QuestionnaireChoices>
                <QuestionnaireError />
              </CardContent>
            </QuestionnaireItem>

            <CardFooter>
              <QuestionnaireActions className="w-full">
                <QuestionnairePrevious />
                <QuestionnaireNext>Next</QuestionnaireNext>
                <QuestionnaireSubmit>Create task</QuestionnaireSubmit>
              </QuestionnaireActions>
            </CardFooter>
          </Card>
        </Questionnaire>
        {line}
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Dialog
 * -------------------------------------------------------------------------*/

export function questionnaireDialog(): ReactNode {
  const [line, setAnswer] = useAnswerLine();
  const [open, setOpen] = useState(false);
  const items = [
    { name: "scope", required: true },
    { name: "tests", required: true },
  ] as const;

  return (
    <Wrapper className="flex-col">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" />}>
          Open clarification
        </DialogTrigger>
        <DialogContent>
          {/* Cancellation and dismissal stay host-owned: DialogClose is not a Questionnaire part. */}
          <Questionnaire
            defaultItem="scope"
            items={items}
            onSubmit={(event) => {
              const data = read(event);
              setOpen(false);
              setAnswer(
                `Scope: ${data.get("scope") ?? "None"} · Verification: ${data.get("tests") ?? "None"}`,
              );
            }}
          >
            <QuestionnaireItem name="scope" required>
              <DialogHeader>
                <QuestionnaireProgress />
                <QuestionnaireTitle render={<DialogTitle />}>
                  Which files are in scope?
                </QuestionnaireTitle>
                <QuestionnaireDescription render={<DialogDescription />}>
                  Choose how broadly the agent can update the workspace.
                </QuestionnaireDescription>
              </DialogHeader>
              <QuestionnaireChoices>
                <QuestionnaireChoice value="component">
                  Component only
                </QuestionnaireChoice>
                <QuestionnaireChoice value="feature">
                  Complete feature directory
                </QuestionnaireChoice>
                <QuestionnaireChoice value="workspace">
                  Any related workspace file
                </QuestionnaireChoice>
              </QuestionnaireChoices>
              <QuestionnaireError />
            </QuestionnaireItem>

            <QuestionnaireItem name="tests" required>
              <DialogHeader>
                <QuestionnaireProgress />
                <QuestionnaireTitle render={<DialogTitle />}>
                  How much verification is needed?
                </QuestionnaireTitle>
                <QuestionnaireDescription render={<DialogDescription />}>
                  Choose the checks the agent should run before handoff.
                </QuestionnaireDescription>
              </DialogHeader>
              <QuestionnaireChoices>
                <QuestionnaireChoice value="targeted">
                  Targeted tests
                </QuestionnaireChoice>
                <QuestionnaireChoice value="package">
                  Package tests
                </QuestionnaireChoice>
                <QuestionnaireChoice value="full">
                  Full workspace verification
                </QuestionnaireChoice>
              </QuestionnaireChoices>
              <QuestionnaireError />
            </QuestionnaireItem>

            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                Cancel
              </DialogClose>
              <QuestionnaireActions>
                <QuestionnairePrevious />
                <QuestionnaireNext>Next</QuestionnaireNext>
                <QuestionnaireSubmit>Send answer</QuestionnaireSubmit>
              </QuestionnaireActions>
            </DialogFooter>
          </Questionnaire>
        </DialogContent>
      </Dialog>
      {line}
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Accessibility
 * -------------------------------------------------------------------------*/

export function questionnaireAccessibility(): ReactNode {
  const [line, setAnswer] = useAnswerLine();
  const [invalid, setInvalid] = useState(false);
  const items = [{ name: "depth", required: true }, { name: "note" }] as const;

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-4">
        <Questionnaire
          defaultItem="depth"
          items={items}
          onSubmit={(event) =>
            setAnswer(`Depth: ${read(event).get("depth") ?? "None"}`)
          }
        >
          <QuestionnaireProgress />

          <QuestionnaireItem invalid={invalid} name="depth" required>
            <QuestionnaireTitle>
              How deep should the review go?
            </QuestionnaireTitle>
            <QuestionnaireDescription>
              The item is a fieldset and this title is its legend, so a screen
              reader announces the question before every choice.
            </QuestionnaireDescription>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="skim">Skim</QuestionnaireChoice>
              <QuestionnaireChoice value="line">
                Line by line
              </QuestionnaireChoice>
              <QuestionnaireChoice value="adversarial" disabled>
                <span className="font-medium">Adversarial</span>
                <QuestionnaireChoiceDescription>
                  Unavailable on this plan — a disabled choice stays hoverable,
                  so a Tooltip can explain why.
                </QuestionnaireChoiceDescription>
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>

          <QuestionnaireItem name="note">
            <QuestionnaireTitle>Anything to flag?</QuestionnaireTitle>
            <QuestionnaireInput
              aria-label="Review note"
              placeholder="Optional…"
            />
          </QuestionnaireItem>

          <QuestionnaireActions>
            <QuestionnairePrevious />
            <QuestionnaireSkip />
            <QuestionnaireNext>Next</QuestionnaireNext>
            <QuestionnaireSubmit>Save</QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>

        <Button
          size="sm"
          variant="outline"
          className="self-start"
          aria-pressed={invalid}
          onClick={() => setInvalid((value) => !value)}
        >
          {invalid ? "Clear the error" : "Mark the question invalid"}
        </Button>
        {line}
      </div>
    </Wrapper>
  );
}

/* ---------------------------------------------------------------------------
 * Unstyled
 * -------------------------------------------------------------------------*/

export function questionnaireUnstyled(): ReactNode {
  const [line, setAnswer] = useAnswerLine();
  const items = [{ name: "plan", required: true }] as const;

  return (
    <Wrapper className="justify-stretch">
      <div className="flex w-full max-w-md flex-col gap-4">
        <QuestionnairePrimitive.Root
          className="flex w-full flex-col gap-3"
          items={items}
          onSubmit={(event) =>
            setAnswer(`Plan: ${read(event).get("plan") ?? "None"}`)
          }
        >
          <QuestionnairePrimitive.Progress className="text-xs text-muted-foreground" />
          <QuestionnairePrimitive.Item
            className="flex flex-col gap-2"
            name="plan"
            required
          >
            <QuestionnairePrimitive.Title className="text-sm font-medium">
              Which plan fits?
            </QuestionnairePrimitive.Title>
            <QuestionnairePrimitive.Choices className="flex flex-col gap-1">
              {["Starter", "Team", "Enterprise"].map((label) => (
                <QuestionnairePrimitive.Choice
                  key={label}
                  className="relative flex min-h-11 items-center gap-2 text-sm has-[>input:checked]:font-medium"
                  value={label.toLowerCase()}
                >
                  {/* The real control: one input stretched over the row, exactly the shape the
                      styled recipe uses. Every class here is this example's own. */}
                  <QuestionnairePrimitive.ChoiceInput className="absolute inset-0 z-10 size-full cursor-pointer opacity-0" />
                  <span
                    aria-hidden="true"
                    className="size-3 rounded-full border border-border bg-transparent"
                  />
                  <QuestionnairePrimitive.ChoiceLabel className="has-[+*]:min-w-0">
                    {label}
                  </QuestionnairePrimitive.ChoiceLabel>
                </QuestionnairePrimitive.Choice>
              ))}
            </QuestionnairePrimitive.Choices>
            <QuestionnairePrimitive.Error className="text-sm text-destructive" />
          </QuestionnairePrimitive.Item>
          <QuestionnairePrimitive.Submit className="min-h-11 self-start text-sm underline underline-offset-4">
            Choose this plan
          </QuestionnairePrimitive.Submit>
        </QuestionnairePrimitive.Root>
        {line}
      </div>
    </Wrapper>
  );
}
