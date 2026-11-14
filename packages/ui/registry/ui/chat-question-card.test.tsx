import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { QuestionCard, type QuestionData } from "./chat-question-card";

const DATA: QuestionData = {
  interactionId: "q1",
  state: "open",
  questions: [
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
        { id: "t1", label: "sm+t1@vegastack.com", description: "Test seat" },
      ],
    },
    {
      id: "tone",
      prompt: "How formal?",
      allowOther: true,
      options: [
        { id: "warm", label: "Warm" },
        { id: "formal", label: "Formal" },
      ],
    },
  ],
};

test("keyboard: 1–9 pick and take focus, arrows rove, Enter picks and moves on, then submits", async () => {
  const onSubmit = vi.fn();
  const screen = await render(
    <QuestionCard data={DATA} onSubmit={onSubmit} onSkip={() => {}} />,
  );
  await expect.element(screen.getByText("1 of 2")).toBeInTheDocument();
  // One tab stop in a single-answer group.
  const options = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="question-option"]',
  );
  expect([...options].map((o) => o.tabIndex)).toEqual([0, -1, -1]);
  options[0]!.focus();
  await userEvent.keyboard("2");
  await expect
    .element(screen.getByRole("radio", { name: /sm\+t1/ }))
    .toHaveAttribute("aria-checked", "true");
  await vi.waitFor(() =>
    expect(document.activeElement?.textContent).toContain("sm+t1"),
  );
  await userEvent.keyboard("{Enter}");
  await expect.element(screen.getByText("How formal?")).toBeInTheDocument();
  await vi.waitFor(() =>
    expect(document.activeElement?.textContent).toContain("Warm"),
  );
  await userEvent.keyboard("{ArrowDown}");
  await expect
    .element(screen.getByRole("radio", { name: "Formal" }))
    .toHaveAttribute("aria-checked", "true");
  await userEvent.keyboard("{Enter}");
  expect(onSubmit).toHaveBeenCalledWith({ address: "t1", tone: "formal" });
  expect(onSubmit).toHaveBeenCalledOnce();
  await expect
    .element(screen.getByRole("button", { name: "Submit" }))
    .toBeDisabled();
});

test("Enter on the close skips rather than submitting", async () => {
  const onSubmit = vi.fn();
  const onSkip = vi.fn();
  const screen = await render(
    <QuestionCard
      data={{ ...DATA, questions: [DATA.questions[0]!] }}
      onSubmit={onSubmit}
      onSkip={onSkip}
    />,
  );
  await userEvent.click(
    screen.getByRole("radio", { name: /Google directory/ }),
  );
  screen.getByRole("button", { name: "Skip this question" }).element().focus();
  await userEvent.keyboard("{Enter}");
  expect(onSkip).toHaveBeenCalledOnce();
  expect(onSubmit).not.toHaveBeenCalled();
});

test("a new interaction starts clean", async () => {
  const screen = await render(
    <QuestionCard data={DATA} onSubmit={() => {}} onSkip={() => {}} />,
  );
  await userEvent.click(
    screen.getByRole("radio", { name: /Google directory/ }),
  );
  screen.rerender(
    <QuestionCard
      data={{ ...DATA, interactionId: "q2" }}
      onSubmit={() => {}}
      onSkip={() => {}}
    />,
  );
  await expect
    .element(screen.getByRole("radio", { name: /Google directory/ }))
    .toHaveAttribute("aria-checked", "false");
});

test("Other opens a text field whose words are the answer", async () => {
  const onSubmit = vi.fn();
  const screen = await render(
    <QuestionCard
      data={{ ...DATA, questions: [DATA.questions[1]!] }}
      onSubmit={onSubmit}
      onSkip={() => {}}
    />,
  );
  await userEvent.click(screen.getByRole("radio", { name: "Other" }));
  await userEvent.fill(
    screen.getByRole("textbox", { name: "Your answer" }),
    "Friendly but short",
  );
  await userEvent.keyboard("{Enter}");
  expect(onSubmit).toHaveBeenCalledWith({ tone: "Friendly but short" });
});

test("the picked option takes a primary ✓, never a radio circle; close skips", async () => {
  const onSkip = vi.fn();
  const screen = await render(
    <QuestionCard data={DATA} onSubmit={() => {}} onSkip={onSkip} />,
  );
  await userEvent.click(
    screen.getByRole("radio", { name: /Google directory/ }),
  );
  const picked = screen.container.querySelector(
    '[data-slot="question-option"][data-selected]',
  )!;
  expect(picked.querySelector("svg")!.getAttribute("class")).toContain(
    "text-primary",
  );
  expect(screen.container.querySelector('input[type="radio"]')).toBeNull();
  await userEvent.click(
    screen.getByRole("button", { name: "Skip these questions" }),
  );
  expect(onSkip).toHaveBeenCalledOnce();
});

test("answered and skipped settle into lines", async () => {
  const screen = await render(
    <>
      <QuestionCard
        data={{
          ...DATA,
          questions: [DATA.questions[0]!],
          state: "answered",
          answers: { address: "sm" },
        }}
        onSubmit={() => {}}
        onSkip={() => {}}
      />
      <QuestionCard
        data={{ ...DATA, state: "skipped" }}
        onSubmit={() => {}}
        onSkip={() => {}}
      />
      <QuestionCard
        data={{
          ...DATA,
          questions: [DATA.questions[0]!],
          state: "answered",
          answers: { address: "ana@example.com, the finance one" },
        }}
        onSubmit={() => {}}
        onSkip={() => {}}
      />
    </>,
  );
  const lines = screen.container.querySelectorAll(
    '[data-slot="question-line"]',
  );
  expect(lines[0]!.textContent).toBe("You chose sm@vegastack.com");
  expect(lines[1]!.textContent).toBe("You skipped 2 questions.");
  // Typed under Other: what they wrote, never "You chose".
  expect(lines[2]!.textContent).toBe(
    "You answered: ana@example.com, the finance one",
  );
});

test("no a11y violations — open, picked with Other, answered", async () => {
  const screen = await render(
    <div>
      <QuestionCard data={DATA} onSubmit={() => {}} onSkip={() => {}} />
      <QuestionCard
        data={{
          ...DATA,
          state: "answered",
          answers: { address: "sm", tone: "warm" },
        }}
        onSubmit={() => {}}
        onSkip={() => {}}
      />
    </div>,
  );
  await userEvent.click(screen.getByRole("radio", { name: "Other" }));
  await expectNoA11yViolations(screen.container);
});

const MULTI: QuestionData = {
  interactionId: "q-multi",
  state: "open",
  questions: [
    {
      id: "buzz",
      prompt: "When should the phone buzz?",
      allowOther: false,
      multi: true,
      options: [
        { id: "send", label: "When you send" },
        { id: "done", label: "When it's done" },
      ],
    },
  ],
};

test("several answers: number keys toggle, Enter submits what is picked", async () => {
  const onSubmit = vi.fn();
  const screen = await render(
    <QuestionCard data={MULTI} onSubmit={onSubmit} onSkip={() => {}} />,
  );
  screen.container
    .querySelector<HTMLElement>('[data-slot="question-option"]')!
    .focus();
  await userEvent.keyboard("1");
  await userEvent.keyboard("2");
  await vi.waitFor(() =>
    expect(document.activeElement?.textContent).toContain("When it's done"),
  );
  await userEvent.keyboard("{Enter}");
  expect(onSubmit).toHaveBeenCalledWith({ buzz: "send, done" });
});

test("arrows reach Other and select it, keeping focus on the row", async () => {
  const screen = await render(
    <QuestionCard
      data={{ ...DATA, questions: [DATA.questions[1]!] }}
      onSubmit={() => {}}
      onSkip={() => {}}
    />,
  );
  screen.getByRole("radio", { name: "Warm" }).element().focus();
  await userEvent.keyboard("{ArrowRight}{ArrowRight}");
  await expect
    .element(screen.getByRole("radio", { name: "Other" }))
    .toHaveAttribute("aria-checked", "true");
  await expect
    .element(screen.getByRole("radio", { name: "Warm" }))
    .toHaveAttribute("aria-checked", "false");
  await vi.waitFor(() =>
    expect(document.activeElement?.getAttribute("role")).toBe("radio"),
  );
});

test("Skip and Submit are one decision; a send that throws lets the person try again", async () => {
  const onSkip = vi.fn(() => new Promise<void>(() => {}));
  const onSubmit = vi.fn(() => {
    throw new Error("offline");
  });
  const one = { ...DATA, questions: [DATA.questions[0]!] };
  const screen = await render(
    <QuestionCard data={one} onSubmit={onSubmit} onSkip={() => {}} />,
  );
  await userEvent.click(
    screen.getByRole("radio", { name: /Google directory/ }),
  );
  await userEvent.click(screen.getByRole("button", { name: "Submit" }));
  expect(onSubmit).toHaveBeenCalledOnce();
  await expect
    .element(screen.getByRole("button", { name: "Submit" }))
    .toBeEnabled();
  screen.rerender(
    <QuestionCard data={one} onSubmit={onSubmit} onSkip={onSkip} />,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Skip this question" }),
  );
  await expect
    .element(screen.getByRole("button", { name: "Submit" }))
    .toBeDisabled();
  await expect
    .element(screen.getByRole("button", { name: "Skip this question" }))
    .toBeDisabled();
  expect(onSkip).toHaveBeenCalledOnce();
});

test("a hairline sits between options and never under the last one, with Other open or closed", async () => {
  const screen = await render(
    <QuestionCard data={DATA} onSubmit={() => {}} onSkip={() => {}} />,
  );
  const lines = () =>
    screen
      .getByRole("radio")
      .elements()
      .map((row) => !row.className.split(" ").includes("border-b-0"));
  expect(lines()).toEqual([true, true, false]);
  await userEvent.click(screen.getByRole("radio", { name: "Other" }));
  expect(lines()).toEqual([true, true, false]);
});
