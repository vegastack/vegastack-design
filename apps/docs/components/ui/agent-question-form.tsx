// @vegastack agent-question-form@0.59.0 sha256-ACbX78HWHlMqnVoi7yPa9TOvtFL3qudZGg1+LqjaQi4=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { CheckIcon, PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire";
import { Textarea } from "@/components/ui/textarea";

/* ------------------------------------------------------------------------------------------------
 * AgentQuestionForm — an agent asks a person one to five questions at once and waits for the
 * answers. Each question offers two to four options, the first one recommended, each with its
 * description in view; the person may always answer in their own words and add a note.
 *
 * One single-choice question with no previews is COMPACT: the options are cards and picking one
 * sends it. Anything else is the FULL form, one question at a time over `Questionnaire`: header
 * chips as steps, radio or checkbox choices with number-key shortcuts, an option's `preview` in a
 * monospace panel (below the choices in a narrow container, beside them from 42rem), Back and Next,
 * and a review step that lists every answer before "Submit answers".
 * ----------------------------------------------------------------------------------------------*/

/** One option an agent offers. */
export type AgentQuestionFormOption = {
  /** What the person picks, and what the answer reports: "Use 4000 K". */
  label: string;
  /** One sentence on what picking it means. Always shown, never a tooltip. @default undefined */
  description?: string;
  /**
   * Monospace text shown while the option is focused, hovered or chosen: an ASCII layout, a code
   * snippet, a draft. Kept whole, scrolled sideways when wide. @default undefined
   */
  preview?: string;
};

/** One question in the batch. */
export type AgentQuestionFormQuestion = {
  /** A short chip naming the question: "Colour". */
  header: string;
  /** The question itself. */
  question: string;
  /** Checkboxes instead of radios: any number of options may be chosen. @default false */
  multiSelect?: boolean;
  /** Two to four options; the first is the recommended one. */
  options: AgentQuestionFormOption[];
};

/** The answer to one question, in the question's order. */
export type AgentQuestionFormAnswer = {
  /** The chosen options' labels, in the options' order. Empty when only own words were given. */
  selected: string[];
  /** The person's own words, trimmed; absent when not given. */
  other?: string;
  /** The person's note, trimmed; absent when not given. */
  notes?: string;
};

/** The words `AgentQuestionForm` shows. */
export type AgentQuestionFormLabels = Record<
  | "recommended"
  | "other"
  | "otherPlaceholder"
  | "addNote"
  | "notesPlaceholder"
  | "back"
  | "next"
  | "review"
  | "reviewTitle"
  | "submit"
  | "send"
  | "chooseAny"
  | "steps"
  | "preview"
  | "noPreview"
  | "notes"
  | "noAnswer",
  string
>;

const DEFAULT_LABELS: AgentQuestionFormLabels = {
  recommended: "Recommended",
  other: "Other",
  otherPlaceholder: "Type your own answer…",
  addNote: "Add a note",
  notesPlaceholder: "Anything else the agent should know…",
  back: "Back",
  next: "Next",
  review: "Review",
  reviewTitle: "Review your answers",
  submit: "Submit answers",
  send: "Send",
  chooseAny: "Choose any",
  steps: "Questions",
  preview: "Preview",
  noPreview: "No preview for this option.",
  notes: "Note",
  noAnswer: "No answer",
};

const DEFAULT_LIMITS = { other: 4000, notes: 1000 };

/** Props accepted by `AgentQuestionForm`. */
export interface AgentQuestionFormProps {
  /** One to five questions, asked together and answered together. */
  questions: AgentQuestionFormQuestion[];
  /**
   * Sends the answers, one per question in order. Resolve with an error to show (the form stays
   * editable), or `null` once sent (the form then stays disabled). A rejection shows its message.
   */
  onSubmit: (answers: AgentQuestionFormAnswer[]) => Promise<string | null>;
  /** Character limits for the person's own words and notes. @default { other: 4000, notes: 1000 } */
  limits?: { other?: number; notes?: number };
  /** Nothing can be changed or sent: answered elsewhere, or the question expired. @default false */
  disabled?: boolean;
  /** The words, each with an English default. @default {} */
  labels?: Partial<AgentQuestionFormLabels>;
  /** Classes on the root. @default undefined */
  className?: string;
}

/** Props accepted by `AgentQuestionAnswers`. */
export interface AgentQuestionAnswersProps {
  /** The questions that were asked. */
  questions: AgentQuestionFormQuestion[];
  /** The answers, one per question in order. */
  answers: AgentQuestionFormAnswer[];
  /** The words: `other`, `notes` and `noAnswer`. @default {} */
  labels?: Partial<
    Pick<AgentQuestionFormLabels, "other" | "notes" | "noAnswer">
  >;
  /** Classes on the list. @default undefined */
  className?: string;
}

type Draft = {
  selected: number[];
  otherOn: boolean;
  other: string;
  notesOn: boolean;
  notes: string;
};

const emptyDraft = (): Draft => ({
  selected: [],
  otherOn: false,
  other: "",
  notesOn: false,
  notes: "",
});

const OTHER = "other";
const REVIEW = "review";
const itemName = (index: number) => `question-${index}`;

function isAnswered(draft: Draft | undefined): boolean {
  if (!draft) return false;
  return (
    draft.selected.length > 0 ||
    (draft.otherOn && draft.other.trim().length > 0)
  );
}

function toAnswer(
  question: AgentQuestionFormQuestion,
  draft: Draft,
): AgentQuestionFormAnswer {
  const answer: AgentQuestionFormAnswer = {
    selected: question.options
      .filter((_, index) => draft.selected.includes(index))
      .map((option) => option.label),
  };
  const other = draft.otherOn ? draft.other.trim() : "";
  if (other) answer.other = other;
  const notes = draft.notesOn ? draft.notes.trim() : "";
  if (notes) answer.notes = notes;
  return answer;
}

/** The submit lifecycle both modes share: busy while sending, an error to show, sent for good. */
function useSubmission(onSubmit: AgentQuestionFormProps["onSubmit"]): {
  status: "idle" | "submitting" | "sent";
  error: string | null;
  submit: (answers: AgentQuestionFormAnswer[]) => Promise<void>;
} {
  const [status, setStatus] = React.useState<"idle" | "submitting" | "sent">(
    "idle",
  );
  const [error, setError] = React.useState<string | null>(null);
  const busy = React.useRef(false);

  const submit = React.useCallback(
    async (answers: AgentQuestionFormAnswer[]) => {
      if (busy.current) return;
      busy.current = true;
      setStatus("submitting");
      setError(null);
      try {
        const failure = await onSubmit(answers);
        if (failure) {
          setError(failure);
          setStatus("idle");
        } else {
          setStatus("sent");
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : String(caught));
        setStatus("idle");
      } finally {
        busy.current = false;
      }
    },
    [onSubmit],
  );

  return { status, error, submit };
}

function FormError({ children }: { children: string | null }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      data-slot="agent-question-form-error"
      className="text-sm text-pretty wrap-anywhere text-destructive-text"
    >
      {children}
    </p>
  );
}

function OptionHeading({
  label,
  recommended,
}: {
  label: string;
  recommended: string | null;
}) {
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
      <span className="min-w-0 font-medium wrap-anywhere">{label}</span>
      {recommended ? (
        <Badge variant="secondary" data-slot="agent-question-form-recommended">
          {recommended}
        </Badge>
      ) : null}
    </span>
  );
}

/** A character count, shown once the text passes 80% of its limit. */
function Counter({
  id,
  length,
  max,
}: {
  id: string;
  length: number;
  max: number;
}) {
  if (length < max * 0.8) return null;
  return (
    <span
      id={id}
      data-slot="agent-question-form-counter"
      className={cn(
        "justify-self-end text-xs text-muted-foreground tabular-nums",
        length >= max && "text-destructive-text",
      )}
    >
      {length}/{max}
    </span>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Compact: one single-choice question, no previews. Picking an option sends it.
 * ----------------------------------------------------------------------------------------------*/

function CompactForm({
  question,
  onSubmit,
  limit,
  disabled,
  labels,
  className,
}: {
  question: AgentQuestionFormQuestion;
  onSubmit: AgentQuestionFormProps["onSubmit"];
  limit: number;
  disabled: boolean;
  labels: AgentQuestionFormLabels;
  className?: string;
}) {
  const { status, error, submit } = useSubmission(onSubmit);
  const [picked, setPicked] = React.useState<number | "other" | null>(null);
  const [otherOpen, setOtherOpen] = React.useState(false);
  const [other, setOther] = React.useState("");
  const otherRef = React.useRef<HTMLTextAreaElement>(null);
  const id = React.useId();
  const locked = disabled || status !== "idle";

  const pick = (index: number) => {
    setPicked(index);
    void submit([{ selected: [question.options[index]!.label] }]);
  };
  const sendOther = () => {
    const text = other.trim();
    if (!text) return;
    setPicked("other");
    void submit([{ selected: [], other: text }]);
  };

  return (
    <div
      data-slot="agent-question-form"
      data-mode="compact"
      data-state={status}
      className={cn("flex w-full min-w-0 flex-col gap-3", className)}
    >
      <div className="flex min-w-0 flex-col items-start gap-1.5">
        <Badge variant="outline" data-slot="agent-question-form-header">
          {question.header}
        </Badge>
        <p
          id={`${id}-question`}
          data-slot="agent-question-form-question"
          className="text-sm font-medium text-pretty wrap-anywhere"
        >
          {question.question}
        </p>
      </div>
      <div
        role="group"
        aria-labelledby={`${id}-question`}
        data-slot="agent-question-form-options"
        className="grid min-w-0 gap-2"
      >
        {question.options.map((option, index) => {
          const chosen = picked === index;
          return (
            <Button
              key={index}
              variant="outline"
              data-slot="agent-question-form-option"
              data-selected={chosen && status !== "idle" ? "" : undefined}
              loading={chosen && status === "submitting"}
              disabled={locked}
              onClick={() => pick(index)}
              className="h-auto min-h-11 w-full items-start justify-start gap-2 px-3 py-2 text-start whitespace-normal data-selected:border-primary/40 data-selected:bg-state-selected"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <OptionHeading
                  label={option.label}
                  recommended={index === 0 ? labels.recommended : null}
                />
                {option.description ? (
                  <span
                    data-slot="agent-question-form-option-description"
                    className="font-normal text-pretty wrap-anywhere text-muted-foreground"
                  >
                    {option.description}
                  </span>
                ) : null}
              </span>
              {chosen && status === "sent" ? (
                <CheckIcon aria-hidden className="mt-0.5 text-foreground" />
              ) : null}
            </Button>
          );
        })}
        <Button
          variant="outline"
          data-slot="agent-question-form-other"
          data-selected={
            picked === "other" && status !== "idle" ? "" : undefined
          }
          aria-expanded={otherOpen}
          aria-controls={`${id}-other`}
          disabled={locked}
          onClick={() => {
            const open = !otherOpen;
            setOtherOpen(open);
            if (open) requestAnimationFrame(() => otherRef.current?.focus());
          }}
          className="h-auto min-h-11 w-full justify-start px-3 py-2 text-start whitespace-normal data-selected:border-primary/40 data-selected:bg-state-selected"
        >
          {labels.other}
        </Button>
        {otherOpen ? (
          <div
            id={`${id}-other`}
            data-slot="agent-question-form-other-entry"
            className="grid min-w-0 gap-1.5"
          >
            <Textarea
              ref={otherRef}
              aria-label={labels.other}
              aria-describedby={`${id}-other-count`}
              placeholder={labels.otherPlaceholder}
              maxLength={limit}
              rows={2}
              value={other}
              disabled={locked}
              onChange={(event) => setOther(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  sendOther();
                }
              }}
            />
            <div className="flex min-w-0 items-center justify-end gap-2">
              <Counter
                id={`${id}-other-count`}
                length={other.length}
                max={limit}
              />
              <Button
                size="sm"
                data-slot="agent-question-form-send"
                loading={picked === "other" && status === "submitting"}
                disabled={locked || other.trim().length === 0}
                onClick={sendOther}
              >
                {labels.send}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
      <FormError>{error}</FormError>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Full: one question at a time, then a review step.
 * ----------------------------------------------------------------------------------------------*/

function PreviewPanel({
  option,
  labels,
}: {
  option: AgentQuestionFormOption | undefined;
  labels: AgentQuestionFormLabels;
}) {
  const id = React.useId();
  return (
    <figure
      data-slot="agent-question-form-preview"
      className="flex min-w-0 flex-col gap-1.5"
    >
      <figcaption
        id={id}
        className="flex min-w-0 gap-1 text-xs text-muted-foreground"
      >
        <span className="shrink-0">{labels.preview}</span>
        {option ? (
          <>
            <span aria-hidden>·</span>
            <span className="min-w-0 truncate">{option.label}</span>
          </>
        ) : null}
      </figcaption>
      {option?.preview ? (
        <pre
          tabIndex={0}
          aria-labelledby={id}
          data-slot="agent-question-form-preview-text"
          className="max-h-80 min-w-0 overflow-auto rounded-lg border border-border bg-muted p-3 font-mono text-xs leading-relaxed whitespace-pre text-foreground"
        >
          {option.preview}
        </pre>
      ) : (
        <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
          {labels.noPreview}
        </p>
      )}
    </figure>
  );
}

function QuestionStep({
  question,
  index,
  draft,
  update,
  locked,
  limits,
  labels,
}: {
  question: AgentQuestionFormQuestion;
  index: number;
  draft: Draft;
  update: (index: number, change: (draft: Draft) => Draft) => void;
  locked: boolean;
  limits: { other: number; notes: number };
  labels: AgentQuestionFormLabels;
}) {
  const id = React.useId();
  const otherRef = React.useRef<HTMLTextAreaElement>(null);
  const [hovered, setHovered] = React.useState<number | null>(null);
  const [focused, setFocused] = React.useState<number | null>(null);
  const multiple = !!question.multiSelect;
  const hasPreview = question.options.some((option) => option.preview);
  const lastSelected = draft.selected[draft.selected.length - 1];
  const shown = hovered ?? focused ?? lastSelected ?? 0;

  const focusOther = () =>
    requestAnimationFrame(() => otherRef.current?.focus());

  const choices = (
    <QuestionnaireChoices>
      {question.options.map((option, optionIndex) => (
        <QuestionnaireChoice
          key={optionIndex}
          value={String(optionIndex)}
          checked={draft.selected.includes(optionIndex)}
          disabled={locked}
          onChange={(event) => {
            const checked = event.target.checked;
            update(index, (current) =>
              multiple
                ? {
                    ...current,
                    selected: checked
                      ? [...current.selected, optionIndex]
                      : current.selected.filter((n) => n !== optionIndex),
                  }
                : checked
                  ? { ...current, selected: [optionIndex], otherOn: false }
                  : current,
            );
          }}
          onFocus={() => setFocused(optionIndex)}
          onBlur={() => setFocused(null)}
          onPointerEnter={() => setHovered(optionIndex)}
          onPointerLeave={() => setHovered(null)}
        >
          <OptionHeading
            label={option.label}
            recommended={optionIndex === 0 ? labels.recommended : null}
          />
          {option.description ? (
            <QuestionnaireChoiceDescription className="text-pretty wrap-anywhere">
              {option.description}
            </QuestionnaireChoiceDescription>
          ) : null}
        </QuestionnaireChoice>
      ))}
      <QuestionnaireChoice
        value={OTHER}
        checked={draft.otherOn}
        disabled={locked}
        data-other=""
        onChange={(event) => {
          const checked = event.target.checked;
          update(index, (current) =>
            multiple
              ? { ...current, otherOn: checked }
              : checked
                ? { ...current, selected: [], otherOn: true }
                : current,
          );
          if (checked) focusOther();
        }}
      >
        <span className="font-medium">{labels.other}</span>
      </QuestionnaireChoice>
      {draft.otherOn ? (
        <div
          data-slot="agent-question-form-other-entry"
          className="grid min-w-0 gap-1"
        >
          <Textarea
            ref={otherRef}
            aria-label={labels.other}
            aria-describedby={`${id}-other-count`}
            placeholder={labels.otherPlaceholder}
            maxLength={limits.other}
            rows={2}
            value={draft.other}
            disabled={locked}
            onChange={(event) => {
              const value = event.target.value;
              update(index, (current) => ({ ...current, other: value }));
            }}
          />
          <Counter
            id={`${id}-other-count`}
            length={draft.other.length}
            max={limits.other}
          />
        </div>
      ) : null}
    </QuestionnaireChoices>
  );

  return (
    <QuestionnaireItem
      name={itemName(index)}
      multiple={multiple}
      data-question={index}
    >
      <QuestionnaireTitle className="wrap-anywhere [&:not(:has(~[data-slot=questionnaire-description]))]:mb-0">
        {question.question}
      </QuestionnaireTitle>
      {multiple ? (
        <QuestionnaireDescription>{labels.chooseAny}</QuestionnaireDescription>
      ) : null}
      {hasPreview ? (
        <div
          data-slot="agent-question-form-body"
          className="grid min-w-0 gap-3 @2xl/agent-question-form:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
        >
          {choices}
          <PreviewPanel option={question.options[shown]} labels={labels} />
        </div>
      ) : (
        choices
      )}
      <div
        data-slot="agent-question-form-notes"
        className="flex min-w-0 flex-col items-start gap-1.5"
      >
        <Button
          variant="ghost"
          size="xs"
          aria-expanded={draft.notesOn}
          aria-controls={draft.notesOn ? `${id}-notes` : undefined}
          disabled={locked}
          onClick={() =>
            update(index, (current) => ({
              ...current,
              notesOn: !current.notesOn,
            }))
          }
        >
          <PlusIcon
            data-icon="inline-start"
            aria-hidden
            className={cn("transition-transform", draft.notesOn && "rotate-45")}
          />
          {labels.addNote}
        </Button>
        {draft.notesOn ? (
          <div id={`${id}-notes`} className="grid w-full min-w-0 gap-1">
            <Textarea
              aria-label={labels.addNote}
              aria-describedby={`${id}-notes-count`}
              placeholder={labels.notesPlaceholder}
              maxLength={limits.notes}
              rows={2}
              value={draft.notes}
              disabled={locked}
              onChange={(event) => {
                const value = event.target.value;
                update(index, (current) => ({ ...current, notes: value }));
              }}
            />
            <Counter
              id={`${id}-notes-count`}
              length={draft.notes.length}
              max={limits.notes}
            />
          </div>
        ) : null}
      </div>
    </QuestionnaireItem>
  );
}

function FullForm({
  questions,
  onSubmit,
  limits,
  disabled,
  labels,
  className,
}: {
  questions: AgentQuestionFormQuestion[];
  onSubmit: AgentQuestionFormProps["onSubmit"];
  limits: { other: number; notes: number };
  disabled: boolean;
  labels: AgentQuestionFormLabels;
  className?: string;
}) {
  const { status, error, submit } = useSubmission(onSubmit);
  const [drafts, setDrafts] = React.useState<Draft[]>(() =>
    questions.map(emptyDraft),
  );
  const [step, setStep] = React.useState(0);
  const locked = disabled || status !== "idle";
  const reviewStep = questions.length;
  const answered = questions.map((_, index) => isAnswered(drafts[index]));
  const firstUnanswered = answered.indexOf(false);
  const allAnswered = firstUnanswered === -1;

  const items = React.useMemo(
    () => [
      ...questions.map((question, index) => ({
        name: itemName(index),
        choices: [
          ...question.options.map((_, optionIndex) => ({
            value: String(optionIndex),
          })),
          { value: OTHER },
        ],
      })),
      { name: REVIEW },
    ],
    [questions],
  );

  const update = React.useCallback(
    (index: number, change: (draft: Draft) => Draft) =>
      setDrafts((current) =>
        current.map((draft, n) =>
          n === index ? change(draft ?? emptyDraft()) : draft,
        ),
      ),
    [],
  );

  /** Every move goes through here: forward needs this question answered, review needs them all. */
  const goTo = (target: number) => {
    if (target === step || target < 0 || target > reviewStep) return;
    if (target > step && !answered[step]) return;
    if (target === reviewStep && !allAnswered) {
      setStep(firstUnanswered);
      return;
    }
    setStep(target);
  };

  const answers = questions.map((question, index) =>
    toAnswer(question, drafts[index] ?? emptyDraft()),
  );

  return (
    <Questionnaire
      items={items}
      item={step === reviewStep ? REVIEW : itemName(step)}
      onItemChange={(name) =>
        goTo(name === REVIEW ? reviewStep : Number(name.split("-")[1]))
      }
      shortcuts="numbers"
      onSubmit={(event) => event.preventDefault()}
      data-slot="agent-question-form"
      data-mode="full"
      data-state={status}
      className={cn("@container/agent-question-form gap-3", className)}
    >
      <nav aria-label={labels.steps} data-slot="agent-question-form-steps">
        <ol className="flex min-w-0 flex-wrap gap-1.5">
          {questions.map((question, index) => (
            <li key={index} className="min-w-0">
              <Button
                size="xs"
                variant={index === step ? "secondary" : "ghost"}
                aria-current={index === step ? "step" : undefined}
                data-answered={answered[index] ? "" : undefined}
                data-slot="agent-question-form-step-chip"
                disabled={locked}
                onClick={() => setStep(index)}
                className="max-w-full"
              >
                {answered[index] ? (
                  <CheckIcon data-icon="inline-start" aria-hidden />
                ) : null}
                <span className="min-w-0 truncate">{question.header}</span>
              </Button>
            </li>
          ))}
          <li className="min-w-0">
            <Button
              size="xs"
              variant={step === reviewStep ? "secondary" : "ghost"}
              aria-current={step === reviewStep ? "step" : undefined}
              data-slot="agent-question-form-step-chip"
              disabled={locked || !allAnswered}
              onClick={() => setStep(reviewStep)}
            >
              {labels.review}
            </Button>
          </li>
        </ol>
      </nav>
      {questions.map((question, index) => (
        <QuestionStep
          key={index}
          question={question}
          index={index}
          draft={drafts[index] ?? emptyDraft()}
          update={update}
          locked={locked}
          limits={limits}
          labels={labels}
        />
      ))}
      <QuestionnaireItem name={REVIEW} data-review="">
        <QuestionnaireTitle className="[&:not(:has(~[data-slot=questionnaire-description]))]:mb-0">
          {labels.reviewTitle}
        </QuestionnaireTitle>
        <AgentQuestionAnswers
          questions={questions}
          answers={answers}
          labels={labels}
        />
      </QuestionnaireItem>
      <FormError>{error}</FormError>
      <QuestionnaireActions>
        <QuestionnairePrevious disabled={locked}>
          {labels.back}
        </QuestionnairePrevious>
        <QuestionnaireNext disabled={locked || !answered[step]}>
          {step === reviewStep - 1 ? labels.review : labels.next}
        </QuestionnaireNext>
        {step === reviewStep ? (
          <Button
            data-slot="agent-question-form-submit"
            loading={status === "submitting"}
            disabled={locked || !allAnswered}
            onClick={() => void submit(answers)}
            className="col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0"
          >
            {labels.submit}
          </Button>
        ) : null}
      </QuestionnaireActions>
    </Questionnaire>
  );
}

/**
 * `AgentQuestionForm` — an agent's batch of one to five questions, answered together and sent
 * once. One single-choice question with no previews is compact (picking an option sends it);
 * anything else steps through each question and ends on a review.
 *
 * @example
 * ```tsx
 * <AgentQuestionForm
 *   questions={[
 *     {
 *       header: "Colour",
 *       question: "Which colour temperature for the IP65 range?",
 *       options: [
 *         { label: "4000 K", description: "Neutral white, the current default." },
 *         { label: "3000 K", description: "Warmer; needs new samples." },
 *       ],
 *     },
 *   ]}
 *   onSubmit={async (answers) => (await send(answers)) ? null : "Couldn't send."}
 * />
 * ```
 */
function AgentQuestionForm({
  questions,
  onSubmit,
  limits,
  disabled = false,
  labels,
  className,
}: AgentQuestionFormProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const bounds = {
    other: limits?.other ?? DEFAULT_LIMITS.other,
    notes: limits?.notes ?? DEFAULT_LIMITS.notes,
  };
  const only = questions[0];
  const compact =
    questions.length === 1 &&
    only !== undefined &&
    !only.multiSelect &&
    !only.options.some((option) => option.preview);

  if (compact) {
    return (
      <CompactForm
        question={only}
        onSubmit={onSubmit}
        limit={bounds.other}
        disabled={disabled}
        labels={words}
        className={className}
      />
    );
  }
  return (
    <FullForm
      questions={questions}
      onSubmit={onSubmit}
      limits={bounds}
      disabled={disabled}
      labels={words}
      className={className}
    />
  );
}

/**
 * `AgentQuestionAnswers` — what a person answered, read-only: each question's header, the chosen
 * options, their own words and their note, all in full.
 *
 * @example
 * ```tsx
 * <AgentQuestionAnswers questions={questions} answers={answers} />
 * ```
 */
function AgentQuestionAnswers({
  questions,
  answers,
  labels,
  className,
}: AgentQuestionAnswersProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  return (
    <dl
      data-slot="agent-question-answers"
      className={cn("grid min-w-0 gap-3 text-sm", className)}
    >
      {questions.map((question, index) => {
        const answer = answers[index];
        const chosen = answer?.selected.join(", ") ?? "";
        const empty = !chosen && !answer?.other;
        return (
          <div
            key={index}
            data-slot="agent-question-answer"
            className="grid min-w-0 gap-0.5"
          >
            <dt className="text-xs font-medium wrap-anywhere text-muted-foreground">
              {question.header}
            </dt>
            {chosen ? (
              <dd className="wrap-anywhere whitespace-pre-wrap">{chosen}</dd>
            ) : null}
            {answer?.other ? (
              <dd className="wrap-anywhere whitespace-pre-wrap">
                <span className="text-muted-foreground">{words.other}: </span>
                {answer.other}
              </dd>
            ) : null}
            {empty ? (
              <dd className="text-muted-foreground">{words.noAnswer}</dd>
            ) : null}
            {answer?.notes ? (
              <dd className="wrap-anywhere whitespace-pre-wrap">
                <span className="text-muted-foreground">{words.notes}: </span>
                {answer.notes}
              </dd>
            ) : null}
          </div>
        );
      })}
    </dl>
  );
}

export { AgentQuestionAnswers, AgentQuestionForm };
