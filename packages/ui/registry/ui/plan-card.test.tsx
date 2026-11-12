import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/stacking.css";
import { PlanCard, type PlanCardState, type PlanSpec } from "./plan-card";

const plan: PlanSpec = {
  agent: { id: "a1", name: "Ops assistant", avatar: null },
  version: 2,
  title: "Clean up overdue tasks in Ops",
  goal: "Every task due before today is in Backlog with a note.",
  steps: [
    {
      id: "s1",
      text: "Find tasks in Ops due before today",
      effect: "read",
      touches: "12 tasks",
    },
    {
      id: "s2",
      text: "Move them to Backlog",
      effect: "change",
      touches: "12 tasks",
      detail: "One status change per task.",
    },
    {
      id: "s3",
      text: "Add a note “Moved by Ops assistant”",
      effect: "change",
      change: "changed",
    },
    { id: "s4", text: "Email the owners", effect: "send", change: "removed" },
    {
      id: "s5",
      text: "Post a summary in #ops",
      effect: "send",
      touches: "#ops",
      change: "new",
    },
  ],
  assumptions: ["Overdue means due date before today."],
  outOfScope: ["Touch other spaces", "Email anyone"],
  willAsk: "1 post to #ops",
  risk: "medium",
  riskReason: "changes 12 items, posts to a channel",
  revisionNote: "Dropped the email step as you asked.",
};

const slot = (c: HTMLElement, name: string) =>
  c.querySelector<HTMLElement>(`[data-slot="plan-card-${name}"]`);

const handlers = () => ({
  onAccept: vi.fn(),
  onAcceptAndAllow: vi.fn(),
  onRequestChanges: vi.fn(),
  onReject: vi.fn(),
});

test("pending: header, goal, steps with effects and the diff, notes, risk and four answers", async () => {
  const h = handlers();
  const screen = await render(<PlanCard plan={plan} {...h} />);
  await expect
    .element(
      screen.getByRole("region", { name: "Clean up overdue tasks in Ops" }),
    )
    .toHaveAttribute("data-state", "pending");
  expect(slot(screen.container, "eyebrow")!.textContent).toBe(
    "Plan · v2·Ops assistant",
  );
  const steps = [
    ...screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="plan-card-step"]',
    ),
  ];
  expect(steps.map((s) => s.dataset.effect)).toEqual([
    "read",
    "change",
    "change",
    "send",
    "send",
  ]);
  expect(steps[2]!.textContent).toContain("Changed: ");
  expect(steps[3]!.querySelector(".line-through")).not.toBeNull();
  expect(steps[4]!.textContent).toContain("New: ");
  expect(slot(screen.container, "risk")!.dataset.risk).toBe("medium");
  expect(slot(screen.container, "will-ask")!.textContent).toBe(
    "You'll be asked about: 1 post to #ops",
  );
  expect(slot(screen.container, "out-of-scope")!.textContent).toBe(
    "Won't do: Touch other spaces · Email anyone",
  );
  expect(slot(screen.container, "revision")).not.toBeNull();
  const answers = [
    ...slot(screen.container, "actions")!.querySelectorAll("button"),
  ];
  expect(answers.map((b) => b.textContent)).toEqual([
    "Accept",
    "Accept and allow these in this chat",
    "Request changes…",
    "Reject",
  ]);
  // Accept is the one primary answer.
  expect(answers[0]!.dataset.variant).toBe("default");
  expect(answers.slice(1).every((b) => b.dataset.variant !== "default")).toBe(
    true,
  );
  await expectNoA11yViolations(screen.container);
  await screen.getByRole("button", { name: "Accept", exact: true }).click();
  expect(h.onAccept).toHaveBeenCalledTimes(1);
});

test("Accept and allow is offered only with its handler", async () => {
  const screen = await render(
    <PlanCard plan={plan} onAccept={vi.fn()} onReject={vi.fn()} />,
  );
  expect(
    screen.container.querySelector('[data-answer="accept-allow"]'),
  ).toBeNull();
});

test("busy: the pressed answer spins and the rest are disabled", async () => {
  const h = handlers();
  function Host() {
    const [busy, setBusy] = React.useState(false);
    return (
      <PlanCard
        plan={plan}
        busy={busy}
        {...h}
        onAcceptAndAllow={() => setBusy(true)}
      />
    );
  }
  const screen = await render(<Host />);
  await screen
    .getByRole("button", { name: "Accept and allow these in this chat" })
    .click();
  const allow = screen.container.querySelector<HTMLElement>(
    '[data-answer="accept-allow"]',
  )!;
  expect(allow.getAttribute("aria-busy")).toBe("true");
  const accept = screen.container.querySelector<HTMLButtonElement>(
    '[data-answer="accept"]',
  )!;
  expect(
    accept.disabled || accept.getAttribute("aria-disabled") === "true",
  ).toBe(true);
});

test("request changes: an overall note and a step note go back together; cancel returns focus", async () => {
  const h = handlers();
  const screen = await render(<PlanCard plan={plan} {...h} />);
  await screen.getByRole("button", { name: "Comment on step 5" }).click();
  const stepNote = screen.getByRole("textbox", { name: "A note on step 5" });
  await expect.element(stepNote).toHaveFocus();
  await userEvent.keyboard("Post in #general instead");
  await screen
    .getByRole("textbox", { name: "What should change?" })
    .fill("Only the Ops space.");
  await expectNoA11yViolations(screen.container);
  await screen.getByRole("button", { name: "Send changes" }).click();
  expect(h.onRequestChanges).toHaveBeenCalledWith({
    note: "Only the Ops space.",
    steps: [{ index: 4, id: "s5", note: "Post in #general instead" }],
  });
});

test("request changes waits for a note, and cancel returns focus to it", async () => {
  const again = await render(<PlanCard plan={plan} {...handlers()} />);
  await again.getByRole("button", { name: "Request changes…" }).click();
  await expect
    .element(again.getByRole("button", { name: "Send changes" }))
    .toBeDisabled();
  await again.getByRole("button", { name: "Cancel" }).click();
  await expect
    .element(again.getByRole("button", { name: "Request changes…" }))
    .toHaveFocus();
});

test("long plans show six steps, then + N more steps in place, with each detail", async () => {
  const long: PlanSpec = {
    ...plan,
    steps: Array.from({ length: 9 }, (_, i) => ({
      text: `Step ${i + 1}`,
      effect: "read" as const,
      detail: i === 7 ? "The eighth step's detail." : undefined,
    })),
  };
  const screen = await render(<PlanCard plan={long} onAccept={vi.fn()} />);
  const count = () =>
    screen.container.querySelectorAll('[data-slot="plan-card-step"]').length;
  expect(count()).toBe(6);
  const fold = screen.getByRole("button", { name: "+ 3 more steps" });
  await expect.element(fold).toHaveAttribute("aria-expanded", "false");
  await fold.click();
  expect(count()).toBe(9);
  expect(slot(screen.container, "step-detail")!.textContent).toBe(
    "The eighth step's detail.",
  );
  await screen.getByRole("button", { name: "Less" }).click();
  expect(count()).toBe(6);
});

const SETTLED: [PlanCardState, string][] = [
  ["accepted", "Plan accepted by Priya · 4 steps"],
  [
    "accepted_allowed",
    "Plan accepted by Priya · 4 steps · these actions are allowed in this chat",
  ],
  ["changes_requested", "Priya asked for changes"],
  ["rejected", "Plan rejected by Priya"],
  ["replaced", "Plan replaced by v3"],
  ["expired", "Plan expired: no answer in 7 days"],
];

test.each(SETTLED)(
  "settled %s: one line in place of the plan and the answers, the plan one click away",
  async (state, text) => {
    const screen = await render(
      <PlanCard
        plan={plan}
        state={state}
        answeredBy="Priya"
        replacedBy={3}
        {...handlers()}
      />,
    );
    expect(slot(screen.container, "status")!.textContent).toBe(text);
    expect(slot(screen.container, "actions")).toBeNull();
    expect(slot(screen.container, "steps")).toBeNull();
    await expectNoA11yViolations(screen.container);
    await screen.getByRole("button", { name: "Show plan" }).click();
    expect(slot(screen.container, "steps")).not.toBeNull();
  },
);

test("a settled answer is announced when it changes on screen, never on first paint", async () => {
  function Host() {
    const [state, setState] = React.useState<PlanCardState>("pending");
    return (
      <PlanCard
        plan={plan}
        state={state}
        answeredBy="you"
        onAccept={() => setState("accepted")}
      />
    );
  }
  const screen = await render(<Host />);
  const region = () => screen.container.querySelector('[role="status"]');
  expect(region()?.textContent ?? "").toBe("");
  await screen.getByRole("button", { name: "Accept" }).click();
  await expect
    .poll(() => region()?.textContent)
    .toBe("Plan accepted by you · 4 steps");
});

test("someone who can't answer sees the plan and who it waits for", async () => {
  const screen = await render(
    <PlanCard
      plan={plan}
      canAnswer={false}
      waitingFor="Manoj"
      {...handlers()}
    />,
  );
  expect(slot(screen.container, "status")!.textContent).toBe(
    "Waiting for Manoj's answer",
  );
  expect(slot(screen.container, "steps")).not.toBeNull();
  expect(
    screen.container.querySelector('[data-slot="plan-card-step-comment"]'),
  ).toBeNull();
  expect(slot(screen.container, "actions")).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("labels override every word", async () => {
  const screen = await render(
    <PlanCard
      plan={plan}
      onAccept={vi.fn()}
      labels={{ accept: "Go ahead", plan: "Proposal" }}
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Go ahead" }))
    .toBeVisible();
  expect(slot(screen.container, "eyebrow")!.textContent).toContain(
    "Proposal · v2",
  );
});

test("answering by keyboard hands focus to Show plan once the answers are gone", async () => {
  function Host() {
    const [state, setState] = React.useState<PlanCardState>("pending");
    return (
      <PlanCard
        plan={plan}
        state={state}
        onAccept={() => setState("accepted")}
      />
    );
  }
  const screen = await render(<Host />);
  screen.container
    .querySelector<HTMLButtonElement>('[data-answer="accept"]')!
    .focus();
  await userEvent.keyboard("{Enter}");
  await expect
    .element(screen.getByRole("button", { name: "Show plan" }))
    .toHaveFocus();
});

test("a new version clears the notes written against the old one", async () => {
  const onRequestChanges = vi.fn();
  function Host() {
    const [current, setCurrent] = React.useState(plan);
    return (
      <>
        <PlanCard plan={current} onRequestChanges={onRequestChanges} />
        <button
          type="button"
          onClick={() =>
            setCurrent({ ...plan, version: 3, steps: plan.steps.slice(1) })
          }
        >
          Revise
        </button>
      </>
    );
  }
  const screen = await render(<Host />);
  await screen.getByRole("button", { name: "Comment on step 1" }).click();
  await userEvent.keyboard("Wrong step later");
  await screen.getByRole("button", { name: "Revise" }).click();
  expect(
    screen.container.querySelector('[data-slot="plan-card-step-note"]'),
  ).toBeNull();
  expect(
    screen.container.querySelector('[data-slot="plan-card-changes"]'),
  ).toBeNull();
  await screen.getByRole("button", { name: "Comment on step 1" }).click();
  await expect
    .element(screen.getByRole("textbox", { name: "A note on step 1" }))
    .toHaveValue("");
  await expect
    .element(screen.getByRole("textbox", { name: "What should change?" }))
    .toHaveValue("");
});

test("an answer from elsewhere never moves focus", async () => {
  let settle: () => void = () => {};
  function Host() {
    const [state, setState] = React.useState<PlanCardState>("pending");
    settle = () => setState("expired");
    return <PlanCard plan={plan} state={state} onAccept={vi.fn()} />;
  }
  const screen = await render(<Host />);
  (document.activeElement as HTMLElement | null)?.blur();
  React.act(() => settle());
  await expect
    .element(screen.getByRole("button", { name: "Show plan" }))
    .toBeVisible();
  expect(document.activeElement).toBe(document.body);
});
