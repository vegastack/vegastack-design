import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { ChatTaskList, type TaskListData } from "./chat-task-list";

const WORKING: TaskListData = {
  id: "t1",
  state: "working",
  startedAt: new Date(Date.now() - 80_000).toISOString(),
  items: [
    {
      id: "a",
      text: "Find Indian makers similar to Regent",
      status: "completed",
    },
    {
      id: "b",
      text: "Research them with 4 Subagents",
      status: "in_progress",
      running: 3,
    },
    { id: "c", text: "Check sources", status: "pending" },
    {
      id: "d",
      text: "Write the findings into a Google Doc",
      status: "pending",
    },
    {
      id: "e",
      text: "Create 11 prospect tasks",
      status: "skipped",
      reason: "you weren't asked",
    },
  ],
};

const header = (root: ParentNode) =>
  root.querySelector<HTMLElement>('[data-slot="chat-task-list-header"]')!;

test("working: a count and a time, never a spinner; ✓ ◐ ◌ ⊘ rows; open", async () => {
  const onOpenItem = vi.fn();
  const onWhy = vi.fn();
  const screen = await render(
    <ChatTaskList data={WORKING} onOpenItem={onOpenItem} onWhy={onWhy} />,
  );
  expect(header(screen.container).textContent).toMatch(/1 of 5.*1:20/);
  expect(header(screen.container).getAttribute("aria-expanded")).toBe("true");
  expect(
    screen.container.querySelector('[data-slot="text-spinner"]'),
  ).toBeNull();
  const glyphs = [
    ...screen.container.querySelectorAll('[data-slot="status-glyph"]'),
  ].map((g) => g.getAttribute("data-status"));
  expect(glyphs).toEqual(["done", "running", "pending", "pending", "skipped"]);
  const done = screen.container.querySelector('[data-status="done"]')!;
  expect(done.getAttribute("class")).toContain("text-primary");
  const skipped = screen.container.querySelector(
    '[data-slot="chat-task-list-item"][data-status="skipped"]',
  )!;
  expect(skipped.textContent).toContain("Skipped: you weren't asked");
  expect(skipped.innerHTML).not.toMatch(/line-through/);
  await userEvent.click(screen.getByRole("button", { name: "3 running ›" }));
  expect(onOpenItem).toHaveBeenCalledWith("b");
  await userEvent.click(screen.getByRole("button", { name: "see why ›" }));
  expect(onWhy).toHaveBeenCalledWith("e");
  await expectNoA11yViolations(screen.container);
});

test("settled headers say how it ended and the list folds", async () => {
  const stopped = await render(
    <ChatTaskList
      data={{
        ...WORKING,
        state: "stopped",
        reason: "Google refused the update",
        items: WORKING.items.map((item, i) => ({
          ...item,
          status: i < 3 ? "completed" : "pending",
        })),
      }}
    />,
  );
  expect(header(stopped.container).textContent).toContain(
    "Stopped at 3 of 5 · Google refused the update",
  );
  expect(header(stopped.container).getAttribute("aria-expanded")).toBe("false");
  await stopped.unmount();

  const done = await render(
    <ChatTaskList
      data={{
        id: "t2",
        state: "done",
        elapsedMs: 41_000,
        items: [
          { id: "a", text: "Draft the email", status: "completed" },
          {
            id: "b",
            text: "Post in Slack",
            status: "skipped",
            reason: "not asked",
          },
          {
            id: "c",
            text: "Create tasks",
            status: "skipped",
            reason: "not asked",
          },
          {
            id: "d",
            text: "Share the doc",
            status: "failed",
            reason: "needs an admin",
          },
        ],
      }}
    />,
  );
  expect(header(done.container).textContent).toMatch(
    /Done · 1 step · 3 skipped.*0:41/,
  );
  await userEvent.click(header(done.container));
  expect(header(done.container).getAttribute("aria-expanded")).toBe("true");
  await expectNoA11yViolations(done.container);
});

test("a running list folds once when it settles, and stays as the person leaves it after", async () => {
  const screen = await render(<ChatTaskList data={WORKING} />);
  expect(header(screen.container).getAttribute("aria-expanded")).toBe("true");
  await screen.rerender(<ChatTaskList data={{ ...WORKING, state: "done" }} />);
  expect(header(screen.container).getAttribute("aria-expanded")).toBe("false");
  await userEvent.click(header(screen.container));
  await screen.rerender(
    <ChatTaskList data={{ ...WORKING, state: "done", elapsedMs: 9_000 }} />,
  );
  expect(header(screen.container).getAttribute("aria-expanded")).toBe("true");
});
