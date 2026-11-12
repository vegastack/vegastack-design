/**
 * AgentQuestionForm — ours: a compact pick-and-send form for one single-choice question, and a
 * stepped `Questionnaire` for the rest. `../../test/geometry.css` compiles the real token theme so
 * axe's colour-contrast rule is live and the narrow-container measurement is real.
 */
import "../../test/geometry.css";
import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  AgentQuestionAnswers,
  AgentQuestionForm,
  type AgentQuestionFormAnswer,
  type AgentQuestionFormQuestion,
} from "./agent-question-form";

const slot = (root: Element, name: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`);
const slots = (root: Element, name: string) => [
  ...root.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`),
];
/** The active step's fieldset; inactive steps are `hidden` + `inert`. */
const activeItem = (root: Element) =>
  root.querySelector<HTMLElement>(
    '[data-slot="questionnaire-item"]:not([hidden])',
  )!;
const inputs = (root: Element) => [
  ...activeItem(root).querySelectorAll<HTMLInputElement>(
    '[data-slot="questionnaire-choice-input"]',
  ),
];
const next = (root: Element) =>
  root.querySelector<HTMLButtonElement>('[data-slot="questionnaire-next"]')!;

/**
 * Freeze transitions so axe reads settled colours: a Button that just became enabled is still
 * fading out of its disabled opacity, and contrast measured mid-fade is a false failure.
 */
function freezeTransitions() {
  const style = document.createElement("style");
  style.textContent = "*, *::before, *::after { transition: none !important; }";
  document.head.append(style);
  return () => style.remove();
}

const one: AgentQuestionFormQuestion[] = [
  {
    header: "Colour",
    question: "Which colour temperature?",
    options: [
      { label: "4000 K", description: "Neutral white, the current default." },
      { label: "3000 K", description: "Warmer; needs new samples." },
    ],
  },
];

const batch: AgentQuestionFormQuestion[] = [
  {
    header: "Layout",
    question: "How should the page be laid out?",
    options: [
      {
        label: "Sidebar",
        description: "Navigation on the left.",
        preview:
          "┌────┬────────────────────────────────────────────────────────────────────────────────────────────┐",
      },
      {
        label: "Tabs",
        description: "Navigation as tabs.",
        preview: "[ Inbox | Projects ]",
      },
    ],
  },
  {
    header: "Notify",
    question: "Who should hear about it?",
    multiSelect: true,
    options: [
      { label: "Assignee", description: "The person it is for." },
      { label: "Followers", description: "Everyone following." },
      { label: "Channel", description: "The project's channel." },
    ],
  },
];

test("one single-choice question without previews is compact, with descriptions in view", async () => {
  const onSubmit = vi.fn(async () => null);
  const screen = await render(
    <AgentQuestionForm questions={one} onSubmit={onSubmit} />,
  );
  const root = slot(screen.container, "agent-question-form")!;
  expect(root.dataset.mode).toBe("compact");
  const options = slots(screen.container, "agent-question-form-option");
  expect(options).toHaveLength(2);
  expect(options[0]!.textContent).toContain(
    "Neutral white, the current default.",
  );
  // Only the first option is recommended.
  expect(
    slot(options[0]!, "agent-question-form-recommended")?.textContent,
  ).toBe("Recommended");
  expect(slot(options[1]!, "agent-question-form-recommended")).toBeNull();
  await expectNoA11yViolations(screen.container);

  // Picking an option sends it at once, then the form stays disabled.
  await userEvent.click(options[1]!);
  expect(onSubmit).toHaveBeenCalledWith([{ selected: ["3000 K"] }]);
  await expect.poll(() => root.dataset.state).toBe("sent");
  expect(options[0]!.hasAttribute("data-disabled")).toBe(true);
});

test("recommended={false} marks no option, compact or full", async () => {
  const compact = await render(
    <AgentQuestionForm
      questions={one}
      recommended={false}
      onSubmit={async () => null}
    />,
  );
  expect(slots(compact.container, "agent-question-form-option")).toHaveLength(
    2,
  );
  expect(
    slots(compact.container, "agent-question-form-recommended"),
  ).toHaveLength(0);
  await compact.unmount();

  const full = await render(
    <AgentQuestionForm
      questions={batch}
      recommended={false}
      onSubmit={async () => null}
    />,
  );
  expect(slot(full.container, "agent-question-form")!.dataset.mode).toBe(
    "full",
  );
  expect(slots(full.container, "agent-question-form-recommended")).toHaveLength(
    0,
  );
  await expectNoA11yViolations(full.container);
});

test("compact Other reveals a box and sends the person's own words", async () => {
  const onSubmit = vi.fn(async () => null);
  const screen = await render(
    <AgentQuestionForm questions={one} onSubmit={onSubmit} />,
  );
  const other = slot(screen.container, "agent-question-form-other")!;
  expect(other.getAttribute("aria-expanded")).toBe("false");
  await userEvent.click(other);
  expect(other.getAttribute("aria-expanded")).toBe("true");
  const send = slot(screen.container, "agent-question-form-send")!;
  expect(send.hasAttribute("data-disabled")).toBe(true);
  await userEvent.fill(
    screen.container.querySelector("textarea")!,
    "  5000 K, it is a warehouse  ",
  );
  const thaw = freezeTransitions();
  await expectNoA11yViolations(screen.container);
  thaw();
  await userEvent.click(send);
  expect(onSubmit).toHaveBeenCalledWith([
    { selected: [], other: "5000 K, it is a warehouse" },
  ]);
});

test("an error from onSubmit shows as an alert and the form stays editable", async () => {
  const onSubmit = vi.fn(async () => "Couldn't send. Try again.");
  const screen = await render(
    <AgentQuestionForm questions={one} onSubmit={onSubmit} />,
  );
  await userEvent.click(
    slots(screen.container, "agent-question-form-option")[0]!,
  );
  await expect
    .poll(() => slot(screen.container, "agent-question-form-error"))
    .not.toBeNull();
  const alert = slot(screen.container, "agent-question-form-error")!;
  expect(alert.getAttribute("role")).toBe("alert");
  expect(alert.textContent).toBe("Couldn't send. Try again.");
  const root = slot(screen.container, "agent-question-form")!;
  expect(root.dataset.state).toBe("idle");
  expect(
    slots(screen.container, "agent-question-form-option")[1]!.hasAttribute(
      "data-disabled",
    ),
  ).toBe(false);
  await expectNoA11yViolations(screen.container);
});

test("a batch is the full form: steps, Next only once answered, focus follows the step", async () => {
  const screen = await render(
    <AgentQuestionForm questions={batch} onSubmit={async () => null} />,
  );
  const root = slot(screen.container, "agent-question-form")!;
  expect(root.dataset.mode).toBe("full");
  expect(root.tagName).toBe("FORM");
  const chips = slots(screen.container, "agent-question-form-step-chip");
  expect(chips.map((chip) => chip.textContent)).toEqual([
    "Layout",
    "Notify",
    "Review",
  ]);
  expect(chips[0]!.getAttribute("aria-current")).toBe("step");
  // Every option shows its description; the first is recommended.
  expect(activeItem(screen.container).textContent).toContain(
    "Navigation on the left.",
  );
  expect(
    slots(activeItem(screen.container), "agent-question-form-recommended"),
  ).toHaveLength(1);
  expect(next(screen.container).disabled).toBe(true);
  await expectNoA11yViolations(screen.container);

  await userEvent.click(inputs(screen.container)[1]!);
  expect(next(screen.container).disabled).toBe(false);
  expect(chips[0]!.hasAttribute("data-answered")).toBe(true);
  await userEvent.click(next(screen.container));
  await expect
    .poll(() => activeItem(screen.container).textContent)
    .toContain("Who should hear about it?");
  expect(document.activeElement).toBe(activeItem(screen.container));
  expect(chips[1]!.getAttribute("aria-current")).toBe("step");
});

test("single-select: Other and the options exclude each other", async () => {
  const screen = await render(
    <AgentQuestionForm questions={batch} onSubmit={async () => null} />,
  );
  const [sidebar, , other] = inputs(screen.container);
  expect(inputs(screen.container)[0]!.type).toBe("radio");
  await userEvent.click(sidebar!);
  expect(sidebar!.checked).toBe(true);

  await userEvent.click(other!);
  expect(other!.checked).toBe(true);
  expect(sidebar!.checked).toBe(false);
  const box = activeItem(screen.container).querySelector("textarea")!;
  // Other with nothing typed is not an answer yet.
  expect(next(screen.container).disabled).toBe(true);
  await userEvent.fill(box, "A split view");
  expect(next(screen.container).disabled).toBe(false);

  await userEvent.click(sidebar!);
  expect(sidebar!.checked).toBe(true);
  expect(other!.checked).toBe(false);
  expect(activeItem(screen.container).querySelector("textarea")).toBeNull();
});

test("multi-select, notes and the review: the payload has one answer per question", async () => {
  const onSubmit = vi.fn<
    (answers: AgentQuestionFormAnswer[]) => Promise<string | null>
  >(async () => null);
  const screen = await render(
    <AgentQuestionForm questions={batch} onSubmit={onSubmit} />,
  );
  // Question 1: a number key picks the second option.
  inputs(screen.container)[0]!.focus();
  await userEvent.keyboard("2");
  expect(inputs(screen.container)[1]!.checked).toBe(true);
  await userEvent.click(next(screen.container));
  await expect
    .poll(() => activeItem(screen.container).textContent)
    .toContain("Choose any");

  // Question 2: checkboxes; Other combines with options; a note.
  const boxes = inputs(screen.container);
  expect(boxes[0]!.type).toBe("checkbox");
  await userEvent.click(boxes[0]!);
  await userEvent.click(boxes[2]!);
  await userEvent.click(boxes[3]!);
  expect(boxes[0]!.checked && boxes[2]!.checked && boxes[3]!.checked).toBe(
    true,
  );
  await userEvent.fill(
    activeItem(screen.container).querySelector("textarea")!,
    "the client",
  );
  const noteToggle = slot(
    activeItem(screen.container),
    "agent-question-form-notes",
  )!.querySelector("button")!;
  await userEvent.click(noteToggle);
  expect(noteToggle.getAttribute("aria-expanded")).toBe("true");
  const textareas = activeItem(screen.container).querySelectorAll("textarea");
  await userEvent.fill(textareas[1]!, "Only this week");
  expect(next(screen.container).textContent).toBe("Review");
  await userEvent.click(next(screen.container));

  // Review lists every answer, then Submit answers sends them.
  await expect
    .poll(() => activeItem(screen.container).textContent)
    .toContain("Review your answers");
  const review = slot(activeItem(screen.container), "agent-question-answers")!;
  expect(review.textContent).toContain("Tabs");
  expect(review.textContent).toContain("Assignee, Channel");
  expect(review.textContent).toContain("Only this week");
  await expectNoA11yViolations(screen.container);
  const submit = slot(screen.container, "agent-question-form-submit")!;
  expect(submit.textContent).toBe("Submit answers");
  await userEvent.click(submit);
  expect(onSubmit).toHaveBeenCalledWith([
    { selected: ["Tabs"] },
    {
      selected: ["Assignee", "Channel"],
      other: "the client",
      notes: "Only this week",
    },
  ]);
  await expect
    .poll(() => slot(screen.container, "agent-question-form")!.dataset.state)
    .toBe("sent");
});

test("full form: an error keeps it editable; disabled locks everything", async () => {
  const screen = await render(
    <AgentQuestionForm
      questions={[batch[1]!]}
      onSubmit={async () => "The agent stopped."}
    />,
  );
  await userEvent.click(inputs(screen.container)[0]!);
  await userEvent.click(next(screen.container));
  await userEvent.click(slot(screen.container, "agent-question-form-submit")!);
  await expect
    .poll(
      () => slot(screen.container, "agent-question-form-error")?.textContent,
    )
    .toBe("The agent stopped.");
  expect(
    slot(screen.container, "agent-question-form-error")!.getAttribute("role"),
  ).toBe("alert");
  expect(
    slot(screen.container, "agent-question-form-submit")!.hasAttribute(
      "data-disabled",
    ),
  ).toBe(false);

  const locked = await render(
    <AgentQuestionForm
      questions={batch}
      onSubmit={async () => null}
      disabled
    />,
  );
  expect(inputs(locked.container).every((input) => input.disabled)).toBe(true);
});

test("the preview shows the focused option in a box that scrolls inside a narrow container", async () => {
  const screen = await render(
    <div style={{ width: 380 }}>
      <AgentQuestionForm questions={batch} onSubmit={async () => null} />
    </div>,
  );
  const preview = () =>
    slot(screen.container, "agent-question-form-preview-text")!;
  // No initial assertion: a pointer left over from an earlier test may already hover an option.
  await userEvent.click(inputs(screen.container)[1]!);
  expect(preview().textContent).toBe("[ Inbox | Projects ]");
  await userEvent.hover(inputs(screen.container)[0]!);
  expect(preview().textContent).toContain("┌────┬");
  // The wide line scrolls inside the box; nothing pushes past the 380px column.
  const root = slot(screen.container, "agent-question-form")!;
  expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  expect(preview().scrollWidth).toBeGreaterThan(preview().clientWidth);
  // Below the choices when narrow.
  const choices = slot(activeItem(screen.container), "questionnaire-choices")!;
  expect(preview().getBoundingClientRect().top).toBeGreaterThan(
    choices.getBoundingClientRect().bottom - 1,
  );
  await expectNoA11yViolations(screen.container);
});

test("the preview sits beside the choices in a wide container", async () => {
  const screen = await render(
    <div style={{ width: 760 }}>
      <AgentQuestionForm questions={batch} onSubmit={async () => null} />
    </div>,
  );
  const preview = slot(screen.container, "agent-question-form-preview")!;
  const choices = slot(activeItem(screen.container), "questionnaire-choices")!;
  expect(preview.getBoundingClientRect().left).toBeGreaterThanOrEqual(
    choices.getBoundingClientRect().right,
  );
});

test("AgentQuestionAnswers lists each header with its answer, own words and note in full", async () => {
  const long = "a".repeat(300);
  const screen = await render(
    <div style={{ width: 300 }}>
      <AgentQuestionAnswers
        questions={batch}
        answers={[
          { selected: [], other: long },
          { selected: ["Assignee", "Channel"], notes: "Only this week" },
        ]}
      />
    </div>,
  );
  const list = slot(screen.container, "agent-question-answers")!;
  expect(list.tagName).toBe("DL");
  const rows = slots(screen.container, "agent-question-answer");
  expect(rows[0]!.querySelector("dt")!.textContent).toBe("Layout");
  expect(rows[0]!.textContent).toContain(long);
  expect(rows[1]!.textContent).toContain("Assignee, Channel");
  expect(rows[1]!.textContent).toContain("Note: Only this week");
  expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
  await expectNoA11yViolations(screen.container);
});
