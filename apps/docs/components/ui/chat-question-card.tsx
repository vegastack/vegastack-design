// @vegastack chat-question-card@0.87.2 sha256-aINWQnqkw6WTtT+kjiUtc5up0EJzrb037EA7swcky/A=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { ArrowRight, Check, ChevronLeft, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChatGroup } from "@/components/ui/chat-card";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { Textarea } from "@/components/ui/textarea";

/* ------------------------------------------------------------------------------------------------
 * QuestionCard — the agent asking the person to choose, drawn whole: a pager "‹ 1 of 4 ›" and a
 * close (skip) on top, the question as the title, full-width option rows with a muted description
 * and no radios, an "Other" row that opens a text field, and one pill "Next →" that becomes
 * "Submit". Number keys pick, Enter moves on. Answered or skipped, it settles into a line.
 * ----------------------------------------------------------------------------------------------*/

/** One question the agent asks. */
export type QuestionItem = {
  /** The question's id; the key of its answer. */
  id: string;
  /** The question, as the card's title. */
  prompt: string;
  /** The choices, each with an optional muted description. */
  options: { id: string; label: string; description?: string }[];
  /** Adds an "Other" row with a text field. */
  allowOther: boolean;
  /** Several options can be picked; the answer is their ids joined by ", ". */
  multi?: boolean;
};

/** Questions as the chat contract carries them (the `data-question` part). */
export type QuestionData = {
  /** The interaction the answers go to. */
  interactionId: string;
  /** One or more questions, asked in order. */
  questions: QuestionItem[];
  /** Where they stand. */
  state: "open" | "answered" | "skipped";
  /** Each question's answer: an option id (ids joined by ", " for `multi`) or the person's own words. */
  answers?: Record<string, string>;
  /** How many questions were skipped. */
  skipped?: number;
};

const OTHER = "\u0000other";
const SETTLE = "animate-in fade-in-0 duration-state ease-enter";

/** What a question's answer reads as: option labels, or the person's own words. */
/**
 * An answer in words, and whether the person typed it: an option's id reads as its label ("You
 * chose …"); anything else is what they wrote under Other ("You answered: …").
 */
function answerWords(
  question: QuestionItem,
  answer: string | undefined,
): { words: string; typed: boolean } {
  if (!answer) return { words: "", typed: false };
  const byId = new Map(question.options.map((o) => [o.id, o.label]));
  if (byId.has(answer)) return { words: byId.get(answer)!, typed: false };
  if (!question.multi) return { words: answer, typed: true };
  // Several picks and words under Other, joined by ", ": each pick reads as its label.
  const parts = answer.split(", ");
  return {
    words: parts.map((part) => byId.get(part) ?? part).join(", "),
    typed: parts.some((part) => !byId.has(part)),
  };
}

/** Props accepted by `QuestionCard`. */
export interface QuestionCardProps extends Omit<
  React.ComponentProps<"div">,
  "children" | "onSubmit"
> {
  /** The questions, as the chat contract carries them. */
  data: QuestionData;
  /**
   * Sends every answer, keyed by question id. The card holds until its answered state arrives; a
   * returned promise that rejects lets the person try again.
   */
  onSubmit: (answers: Record<string, string>) => void | Promise<void>;
  /** Skips the questions (the close button). Held like a submit; a rejected promise lets go. */
  onSkip: () => void | Promise<void>;
}

type Draft = { picked: string[]; other: string };

/**
 * The agent's questions, drawn whole (G133): a pager and a close on top, the question as the title,
 * full-width options with muted descriptions and no radios — the picked one takes the selected
 * fill and a primary ✓ — an "Other" row with a text field, and a pill "Next →" that becomes
 * "Submit" on the last question. Keys 1–9 pick, arrows move between options, Enter picks and moves on; the × skips. A
 * new `interactionId` starts clean.
 *
 * @example
 * <QuestionCard data={questions} onSubmit={(answers) => answer(questions.interactionId, answers)} onSkip={skip} />
 */
function QuestionCard(props: QuestionCardProps) {
  if (props.data.state !== "open") {
    const {
      data,
      onSubmit: _submit,
      onSkip: _skip,
      className,
      ...rest
    } = props;
    return (
      <QuestionLine data={data} className={cn(SETTLE, className)} {...rest} />
    );
  }
  // A new interaction starts clean: no drafts, page or pending state carry over.
  return <QuestionForm key={props.data.interactionId} {...props} />;
}

/** True for the Enter that confirms an input method's candidate rather than the field. */
const composing = (event: React.KeyboardEvent) =>
  event.nativeEvent.isComposing || event.keyCode === 229;

function QuestionForm({
  data,
  onSubmit,
  onSkip,
  className,
  ...props
}: QuestionCardProps) {
  const total = data.questions.length;
  const [page, setPage] = React.useState(0);
  const [drafts, setDrafts] = React.useState<Record<string, Draft>>({});
  const [pending, setPending] = React.useState(false);
  const optionsRef = React.useRef<HTMLDivElement | null>(null);
  const otherRef = React.useRef<HTMLTextAreaElement | null>(null);
  const moved = React.useRef(false);

  const index = Math.min(page, total - 1);
  const question = data.questions[index]!;

  // After the person moves to another question, focus follows: its picked option, else its first.
  React.useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    const options = optionsRef.current;
    (
      options?.querySelector<HTMLElement>(
        '[data-slot="question-option"][data-selected]',
      ) ?? options?.querySelector<HTMLElement>('[data-slot="question-option"]')
    )?.focus();
  }, [index]);

  /** A question's picks, keeping only options the question still offers. */
  const draftOf = (q: QuestionItem, over?: Record<string, Draft>): Draft => {
    const d = over?.[q.id] ?? drafts[q.id] ?? { picked: [], other: "" };
    const offered = new Set(q.options.map((o) => o.id));
    if (q.allowOther) offered.add(OTHER);
    return { ...d, picked: d.picked.filter((id) => offered.has(id)) };
  };
  const answerOf = (
    q: QuestionItem,
    over?: Record<string, Draft>,
  ): string | null => {
    const d = draftOf(q, over);
    if (d.picked.includes(OTHER)) {
      const words = d.other.trim();
      const rest = d.picked.filter((id) => id !== OTHER);
      if (!words) return null;
      return q.multi ? [...rest, words].join(", ") : words;
    }
    return d.picked.length ? d.picked.join(", ") : null;
  };
  const draft = draftOf(question);
  const otherOn = draft.picked.includes(OTHER);
  const answered = answerOf(question) !== null;
  const last = index >= total - 1;
  const choices = [
    ...question.options.map((option) => option.id),
    ...(question.allowOther ? [OTHER] : []),
  ];

  const go = (next: number) => {
    moved.current = true;
    setPage(next);
  };
  const setDraft = (next: Draft) =>
    setDrafts((all) => ({ ...all, [question.id]: next }));
  /** Picks (or, for several, toggles) one choice; returns the picks after it. */
  const pick = (id: string, focusOther = true): Draft => {
    const picked = question.multi
      ? draft.picked.includes(id)
        ? draft.picked.filter((p) => p !== id)
        : [...draft.picked, id]
      : [id];
    const next = { ...draft, picked };
    setDraft(next);
    if (focusOther && id === OTHER && picked.includes(OTHER))
      requestAnimationFrame(() => otherRef.current?.focus());
    return next;
  };
  /**
   * One decision per interaction — Submit or Skip — held until the answered or skipped state
   * replaces the card. A send that throws or rejects lets the person try again.
   */
  const deciding = React.useRef(false);
  const decide = (send: () => void | Promise<void>) => {
    if (deciding.current) return;
    deciding.current = true;
    setPending(true);
    void Promise.resolve()
      .then(send)
      .catch(() => {
        deciding.current = false;
        setPending(false);
      });
  };
  const submit = (over?: Record<string, Draft>) => {
    if (pending) return;
    const answers: Record<string, string> = {};
    for (const q of data.questions) {
      const a = answerOf(q, over);
      if (a === null) {
        go(data.questions.indexOf(q));
        return;
      }
      answers[q.id] = a;
    }
    decide(() => onSubmit(answers));
  };
  /** Moves on, or submits on the last question; `over` carries a pick made in the same keystroke. */
  const advance = (over?: Record<string, Draft>) => {
    if (pending || answerOf(question, over) === null) return;
    if (last) submit(over);
    else go(index + 1);
  };
  // The rows are already mounted (only their selection changes), so focus moves at once.
  const focusChoice = (id: string) =>
    optionsRef.current
      ?.querySelector<HTMLElement>(
        `[data-choice-index="${choices.indexOf(id)}"]`,
      )
      ?.focus();

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey || pending) return;
    const target = event.target as HTMLElement;
    if (target.tagName === "TEXTAREA") {
      // Enter in Other moves on; Shift+Enter is a new line.
      if (event.key === "Enter" && !event.shiftKey && !composing(event)) {
        event.preventDefault();
        advance();
      }
      return;
    }
    if (/^[1-9]$/.test(event.key)) {
      const id = choices[Number(event.key) - 1];
      if (id === undefined) return;
      event.preventDefault();
      pick(id);
      if (id !== OTHER) focusChoice(id);
    }
  };

  /** Keys on an option row: arrows rove (and pick, for one answer), Enter picks and moves on. */
  const onOptionKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
    id: string,
  ) => {
    if (pending) return;
    const at = choices.indexOf(id);
    const arrows: Record<string, number> = {
      ArrowDown: 1,
      ArrowRight: 1,
      ArrowUp: -1,
      ArrowLeft: -1,
    };
    const step = arrows[event.key];
    if (step !== undefined) {
      event.preventDefault();
      // Right and Left follow the reading direction.
      const rtl =
        (event.key === "ArrowRight" || event.key === "ArrowLeft") &&
        getComputedStyle(event.currentTarget).direction === "rtl";
      const delta = rtl ? -step : step;
      const next = choices[(at + delta + choices.length) % choices.length]!;
      // A single-answer group selects as focus moves (the radio pattern), Other included.
      if (!question.multi) pick(next, false);
      focusChoice(next);
      return;
    }
    if (event.key === "Enter" && !composing(event)) {
      if (question.multi) {
        // Space and click toggle; Enter moves on with what is picked.
        event.preventDefault();
        advance();
        return;
      }
      if (id === OTHER) return;
      event.preventDefault();
      advance({ [question.id]: pick(id) });
    }
  };

  // One tab stop for a single-answer group: the picked option, else the first.
  const tabStop = question.multi
    ? null
    : (choices.find((id) => draft.picked.includes(id)) ?? choices[0]);
  const titleId = `question-${data.interactionId}-${question.id}`;
  const title = (
    <h3
      id={titleId}
      data-slot="question-title"
      className="min-w-0 flex-1 text-base font-semibold text-foreground"
    >
      {question.prompt}
    </h3>
  );
  return (
    <div
      data-slot="chat-question-card"
      data-state={data.state}
      aria-busy={pending || undefined}
      onKeyDown={onKeyDown}
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-chat-card border border-chat-hairline bg-chat-card p-4 text-sm max-sm:p-3",
        className,
      )}
      {...props}
    >
      <div
        data-slot="question-header"
        className="flex min-w-0 items-start gap-2"
      >
        {total > 1 ? (
          <div
            data-slot="question-pager"
            className="flex items-center gap-0.5 text-muted-foreground"
          >
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Previous question"
              disabled={index === 0 || pending}
              onClick={() => go(index - 1)}
            >
              <ChevronLeft strokeWidth={1.5} className="rtl:rotate-180" />
            </Button>
            <span className="px-1 text-xs tabular-nums">
              {index + 1} of {total}
            </span>
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Next question"
              disabled={last || !answered || pending}
              onClick={() => go(index + 1)}
            >
              <ChevronRight strokeWidth={1.5} className="rtl:rotate-180" />
            </Button>
          </div>
        ) : (
          // One question: its title shares the row with Skip, so no empty band sits above it.
          title
        )}
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={total > 1 ? "Skip these questions" : "Skip this question"}
          disabled={pending}
          className="-my-1 ms-auto shrink-0 rounded-full text-muted-foreground"
          onClick={() => decide(onSkip)}
        >
          <X strokeWidth={1.5} />
        </Button>
      </div>
      {total > 1 ? title : null}
      <div
        ref={optionsRef}
        role={question.multi ? "group" : "radiogroup"}
        aria-labelledby={titleId}
        data-slot="question-options"
        className="-mx-2 flex min-w-0 flex-col"
      >
        {question.options.map((option, i) => (
          <OptionRow
            key={option.id}
            index={i}
            last={!question.allowOther && i === question.options.length - 1}
            label={option.label}
            description={option.description}
            shortcut={i < 9 ? String(i + 1) : undefined}
            multi={question.multi}
            selected={draft.picked.includes(option.id)}
            tabbable={tabStop === null || tabStop === option.id}
            disabled={pending}
            onPick={() => pick(option.id)}
            onKeyDown={(event) => onOptionKeyDown(event, option.id)}
          />
        ))}
        {question.allowOther ? (
          <div className="flex min-w-0 flex-col">
            <OptionRow
              index={question.options.length}
              last
              label="Other"
              muted
              shortcut={
                question.options.length < 9
                  ? String(question.options.length + 1)
                  : undefined
              }
              multi={question.multi}
              selected={otherOn}
              tabbable={tabStop === null || tabStop === OTHER}
              disabled={pending}
              onPick={() => pick(OTHER)}
              onKeyDown={(event) => onOptionKeyDown(event, OTHER)}
            />
            {otherOn ? (
              <div className="px-2 pb-2">
                <Textarea
                  ref={otherRef}
                  aria-label="Your answer"
                  placeholder="Type your answer"
                  value={draft.other}
                  disabled={pending}
                  onChange={(event) =>
                    setDraft({ ...draft, other: event.currentTarget.value })
                  }
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div data-slot="question-footer" className="flex justify-end">
        <Button
          className="rounded-full px-4"
          disabled={!answered || pending}
          onClick={() => advance()}
        >
          {last ? (
            "Submit"
          ) : (
            <>
              Next
              <ArrowRight
                aria-hidden="true"
                data-icon="inline-end"
                strokeWidth={1.5}
                className="rtl:rotate-180"
              />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function OptionRow({
  index,
  label,
  description,
  shortcut,
  selected,
  multi,
  muted = false,
  last = false,
  tabbable,
  disabled,
  onPick,
  onKeyDown,
}: {
  index: number;
  label: string;
  description?: string;
  shortcut?: string;
  selected: boolean;
  multi?: boolean;
  muted?: boolean;
  /** The last row draws no hairline under it, whatever follows it in the DOM (the Other field). */
  last?: boolean;
  tabbable: boolean;
  disabled: boolean;
  onPick: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
}) {
  return (
    <Button
      variant="ghost"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      aria-keyshortcuts={shortcut}
      tabIndex={tabbable ? 0 : -1}
      disabled={disabled}
      data-slot="question-option"
      data-choice-index={index}
      data-selected={selected ? "" : undefined}
      onClick={onPick}
      onKeyDown={onKeyDown}
      className={cn(
        // A hairline between options, as in the reference card; the Button's own border-0 would
        // otherwise defeat the list's divide-y.
        "h-auto min-h-11 w-full min-w-0 justify-start gap-3 rounded-none border-0 border-b border-chat-hairline px-2 py-3 text-start font-normal whitespace-normal",
        selected && "bg-state-selected",
        last && "border-b-0",
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "min-w-0 text-sm",
            muted && !selected
              ? "text-muted-foreground"
              : "font-medium text-foreground",
          )}
        >
          {label}
        </span>
        {description ? (
          <span className="min-w-0 text-xs text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      <span className="flex w-4 shrink-0 items-center justify-center self-center">
        {selected ? (
          <Check
            aria-hidden="true"
            data-icon-tone=""
            strokeWidth={1.5}
            className="size-4 text-primary"
          />
        ) : shortcut ? (
          <span
            aria-hidden="true"
            className="text-xs text-muted-foreground tabular-nums"
          >
            {shortcut}
          </span>
        ) : null}
      </span>
    </Button>
  );
}

/** Props accepted by `QuestionLine`. */
export interface QuestionLineProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  /** The answered or skipped questions. */
  data: QuestionData;
}

/**
 * Answered or skipped questions as quiet lines: "✓ You chose sm@vegastack.com" for one question
 * (an answer typed under Other reads "✓ You answered: …"), a
 * fold "Answered 2 questions" for several, "You skipped 2 questions." when skipped.
 *
 * @example
 * <QuestionLine data={answeredQuestions} />
 */
function QuestionLine({ data, className, ...props }: QuestionLineProps) {
  const total = data.questions.length;
  if (data.state === "skipped") {
    const n = data.skipped ?? total;
    return (
      <div
        data-slot="question-line"
        data-state="skipped"
        className={cn(
          "-mx-2 flex min-h-7 min-w-0 items-center px-2 text-sm text-muted-foreground",
          className,
        )}
        {...props}
      >
        You skipped {n === 1 ? "the question" : `${n} questions`}.
      </div>
    );
  }
  const rows = data.questions.map((question) => ({
    question,
    ...answerWords(question, data.answers?.[question.id]),
  }));
  const line = (
    { words, typed }: { words: string; typed: boolean },
    prompt?: string,
  ) => (
    <div className="-mx-2 flex min-h-7 min-w-0 items-center gap-2 px-2 text-sm text-muted-foreground">
      <StatusGlyph status="done" label={null} />
      <span className="min-w-0 truncate">
        {words ? (
          <>
            {typed ? "You answered: " : "You chose "}
            <span className="text-foreground">{words}</span>
          </>
        ) : (
          "You didn't answer"
        )}
        {prompt ? <span> · {prompt}</span> : null}
      </span>
    </div>
  );
  if (total === 1)
    return (
      <div
        data-slot="question-line"
        data-state="answered"
        className={cn("min-w-0", className)}
        {...props}
      >
        {line(rows[0]!)}
      </div>
    );
  return (
    <div
      data-slot="question-line"
      data-state="answered"
      className={cn("min-w-0", className)}
      {...props}
    >
      <ChatGroup summary={`Answered ${total} questions`}>
        {rows.map((row) => (
          <React.Fragment key={row.question.id}>
            {line(row, row.question.prompt)}
          </React.Fragment>
        ))}
      </ChatGroup>
    </div>
  );
}

export { QuestionCard, QuestionLine };
