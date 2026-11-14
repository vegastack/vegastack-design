import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { ChatPlanCard, PlanLine, type PlanData } from "./chat-plan-card";

const PLAN: PlanData = {
  id: "p1",
  version: 2,
  state: "waiting",
  title: "Compare makers",
  goal: "A comparison Simran can edit.",
  steps: Array.from({ length: 10 }, (_, i) => ({
    n: i + 1,
    text: `Step text ${i + 1}`,
    ...(i === 1 ? { detail: "Read-only research.", subagents: 4 } : {}),
  })),
  willChange: ["a new Google Doc", "1 email"],
  wont: ["create tasks"],
  needsOk: [{ step: 4, words: "sharing outside the chat" }],
  changedFrom: {
    version: 1,
    added: [3],
    removed: ["Post in #sales"],
    edited: [2],
  },
};
const props = () => ({
  onApprove: vi.fn(),
  onKeepPlanning: vi.fn(),
  onReject: vi.fn(),
});

test("waiting: meta, eight steps then Show more, the three quiet rows and no pills", async () => {
  const screen = await render(<ChatPlanCard data={PLAN} {...props()} />);
  await expect.element(screen.getByText("Plan · v2")).toBeInTheDocument();
  expect(
    screen.container.querySelectorAll('[data-slot="plan-step"]'),
  ).toHaveLength(8);
  await userEvent.click(screen.getByRole("button", { name: "Show 2 more" }));
  expect(
    screen.container.querySelectorAll('[data-slot="plan-step"]'),
  ).toHaveLength(10);
  const facts = screen.container.querySelector(
    '[data-slot="plan-facts"]',
  )!.textContent;
  expect(facts).toContain("Will changea new Google Doc and 1 email");
  expect(facts).toContain("Needs your OKstep 4 (sharing outside the chat)");
});

test("won't items written as sentences read as sentences, never joined with 'and'", async () => {
  const screen = await render(
    <ChatPlanCard
      data={{
        ...PLAN,
        wont: [
          "Touch the published page.",
          "Changing the owner",
          "Leave production. 🔒",
          "Keep the owner. 👍🏽",
          "Ship it! 🇮🇳 Keep it. 1️⃣",
          "Keep it. 1️⃣",
        ],
      }}
      {...props()}
    />,
  );
  const facts = screen.container.querySelector<HTMLElement>(
    '[data-slot="plan-facts"]',
  )!.textContent;
  expect(facts).toContain(
    "Won'tTouch the published page. Changing the owner. Leave production. 🔒 Keep the owner. 👍🏽 Ship it! 🇮🇳",
  );
  expect(screen.container.innerHTML).not.toMatch(
    /bg-(success|warning|destructive)/,
  );
});

test("Changed marks new and edited steps and lists what was removed", async () => {
  const screen = await render(<ChatPlanCard data={PLAN} {...props()} />);
  expect(screen.container.querySelector('[data-change="new"]')).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Changed" }));
  expect(
    screen.container.querySelector('[data-change="new"]')!.textContent,
  ).toContain("Step text 3");
  expect(
    screen.container.querySelector('[data-change="edited"]')!.textContent,
  ).toContain("Step text 2");
  await expect
    .element(screen.getByText("Removed since v1: Post in #sales"))
    .toBeInTheDocument();
});

test("one decision per version: Approve holds every action until the plan's state changes", async () => {
  const p = props();
  const screen = await render(<ChatPlanCard data={PLAN} {...p} />);
  await userEvent.click(
    screen.getByRole("button", { name: "Approve, ask before changes" }),
  );
  expect(p.onApprove).toHaveBeenCalledWith("ask_before_changes");
  await expect
    .element(screen.getByRole("button", { name: "Approve and run" }))
    .toBeDisabled();
  expect(p.onApprove).toHaveBeenCalledOnce();
  screen.rerender(<ChatPlanCard data={{ ...PLAN, version: 3 }} {...p} />);
  await expect
    .element(screen.getByRole("button", { name: "Approve and run" }))
    .toBeEnabled();
});

test("with nothing that needs an OK there is one Approve, which accepts without allowing", async () => {
  const p = props();
  const screen = await render(
    <ChatPlanCard data={{ ...PLAN, needsOk: [] }} {...p} />,
  );
  expect(screen.getByText("Approve and run").query()).toBeNull();
  expect(screen.getByText("Approve, ask before changes").query()).toBeNull();
  await userEvent.click(
    screen.getByRole("button", { name: "Approve", exact: true }),
  );
  expect(p.onApprove).toHaveBeenCalledWith("ask_before_changes");
});

test("without handlers a waiting plan is read-only for a reader who can't decide", async () => {
  const screen = await render(<ChatPlanCard data={PLAN} />);
  await expect
    .element(screen.getByText(/Waiting for approval/))
    .toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Approve|Keep planning/ }).query(),
  ).toBeNull();
});

test("changes asked for and expired plans settle into a line with no actions", async () => {
  const screen = await render(
    <>
      <ChatPlanCard
        data={{ ...PLAN, state: "changes_requested" }}
        {...props()}
      />
      <ChatPlanCard data={{ ...PLAN, state: "expired" }} {...props()} />
    </>,
  );
  const lines = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="plan-line"]',
  );
  expect(lines).toHaveLength(2);
  expect(
    screen.container.querySelector('[data-slot="status-glyph"]'),
  ).toBeNull();
  expect(
    screen.getByRole("button", { name: /Approve|Keep planning/ }).query(),
  ).toBeNull();
  expect(screen.getByRole("button", { name: "Show" }).elements()).toHaveLength(
    2,
  );
});

test("Reject carries a note, from inside Keep planning", async () => {
  const p = props();
  const screen = await render(<ChatPlanCard data={PLAN} {...p} />);
  await userEvent.click(screen.getByRole("button", { name: "Keep planning" }));
  await userEvent.click(screen.getByRole("menuitem", { name: /Reject/ }));
  await userEvent.fill(screen.getByRole("textbox"), "Too broad");
  await userEvent.click(screen.getByRole("button", { name: "Reject plan" }));
  await vi.waitFor(() => expect(p.onReject).toHaveBeenCalledWith("Too broad"));
});

test("settled plans are one line; approved carries the primary ✓ and Show opens the plan", async () => {
  const screen = await render(
    <>
      <ChatPlanCard
        data={{
          ...PLAN,
          state: "approved",
          answer: { by: "you", at: "", mode: "run" },
        }}
        {...props()}
      />
      <PlanLine data={{ ...PLAN, state: "rejected" }} />
      <PlanLine data={{ ...PLAN, state: "changes_requested" }} />
      <PlanLine data={{ ...PLAN, state: "expired" }} />
    </>,
  );
  const lines = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="plan-line"]',
  );
  expect(lines[0]!.textContent).toContain("Plan approved by you · 10 steps");
  expect(
    lines[0]!
      .querySelector('[data-slot="status-glyph"]')!
      .getAttribute("class"),
  ).toContain("text-primary");
  expect(lines[1]!.textContent).toBe("You didn't approve this plan");
  // Nothing replaced these two: they say what happened.
  expect(lines[2]!.textContent).toBe(`Changes asked for · v${PLAN.version}`);
  expect(lines[3]!.textContent).toBe(`Plan expired · v${PLAN.version}`);
  await userEvent.click(screen.getByRole("button", { name: "Show" }));
  await expect
    .element(screen.getByText("A comparison Simran can edit."))
    .toBeInTheDocument();
});

test("no a11y violations — waiting, changed, approved line", async () => {
  const screen = await render(
    <div>
      <ChatPlanCard data={PLAN} {...props()} />
      <ChatPlanCard
        data={{ ...PLAN, id: "p2", state: "approved" }}
        {...props()}
      />
    </div>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Changed" }));
  await expectNoA11yViolations(screen.container);
});
