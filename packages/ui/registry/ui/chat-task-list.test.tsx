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
  expect(done.getAttribute("class")).toContain("text-check");
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

const long = (count: number, live: number): TaskListData => ({
  id: "long",
  state: "working",
  items: Array.from({ length: count }, (_, i) => ({
    id: String(i),
    text: `Task ${i + 1}`,
    status: i < live ? "completed" : i === live ? "in_progress" : "pending",
  })),
});
const texts = (root: ParentNode) =>
  [
    ...root.querySelectorAll<HTMLElement>('[data-slot="chat-task-list-item"]'),
  ].map((li) => li.textContent);

test("a long list folds what's done and what's far off, each opening in place", async () => {
  const screen = await render(<ChatTaskList data={long(20, 4)} />);
  expect(texts(screen.container)).toEqual(
    Array.from({ length: 12 }, (_, i) => `Task ${i + 5}`),
  );
  const done = screen.getByRole("button", { name: "4 done" });
  const more = screen.getByRole("button", { name: "+4 more" });
  await expect.element(done).toHaveAttribute("aria-expanded", "false");
  await userEvent.click(more);
  await expect.element(more).toHaveAttribute("aria-expanded", "true");
  expect(texts(screen.container)).toHaveLength(16);
  await userEvent.click(done);
  expect(texts(screen.container)).toHaveLength(20);
  await expectNoA11yViolations(screen.container);
});

test("a group counts its members and shows them nested; a failed task never folds", async () => {
  const data: TaskListData = {
    id: "g",
    state: "working",
    items: [
      {
        id: "g",
        text: "Read the transcript",
        status: "completed",
        members: [
          { text: "Read part 1", status: "completed" },
          { text: "Read part 2", status: "skipped", reason: "empty" },
        ],
      },
      {
        id: "f",
        text: "Open the sheet",
        status: "failed",
        reason: "no access",
      },
      ...long(5, 0).items,
    ],
  };
  const screen = await render(<ChatTaskList data={data} />);
  expect(header(screen.container).textContent).toContain("1 of 8");
  const fold = screen.getByRole("button", { name: "1 done · 1 skipped" });
  expect(texts(screen.container)[0]).toContain("Open the sheet");
  await userEvent.click(fold);
  const members = screen.container.querySelectorAll(
    '[data-slot="chat-task-list-member"]',
  );
  expect(members).toHaveLength(2);
  expect(members[1]!.textContent).toContain("Skipped: empty");
  await expectNoA11yViolations(screen.container);
});

test("a focused fold row stays while anything is in it, then hands focus to the header", async () => {
  const screen = await render(<ChatTaskList data={long(20, 4)} />);
  const more = screen.getByRole("button", { name: "+4 more" });
  ((await more.element()) as HTMLElement).focus();
  await screen.rerender(<ChatTaskList data={long(20, 7)} />);
  await expect
    .element(screen.getByRole("button", { name: "+1 more" }))
    .toHaveFocus();
  await screen.rerender(
    <ChatTaskList data={{ ...long(20, 20), state: "done" }} />,
  );
  await vi.waitFor(() =>
    expect(document.activeElement).toBe(header(screen.container)),
  );
});

test("settling never folds a list the reader is inside; a control that goes hands focus to the header", async () => {
  const screen = await render(
    <ChatTaskList data={WORKING} onOpenItem={() => {}} />,
  );
  const running = screen.getByRole("button", { name: "3 running ›" });
  ((await running.element()) as HTMLElement).focus();
  await screen.rerender(
    <ChatTaskList data={{ ...WORKING, state: "done" }} onOpenItem={() => {}} />,
  );
  expect(header(screen.container).getAttribute("aria-expanded")).toBe("true");
  await expect.element(running).toHaveFocus();
  await screen.rerender(
    <ChatTaskList
      data={{
        ...WORKING,
        items: WORKING.items.map((item) =>
          item.id === "b" ? { ...item, status: "completed" } : item,
        ),
      }}
      onOpenItem={() => {}}
    />,
  );
  await vi.waitFor(() =>
    expect(document.activeElement).toBe(header(screen.container)),
  );
});

test("one update that settles the list and removes the focused control keeps it open, focus on the header", async () => {
  const screen = await render(
    <ChatTaskList data={WORKING} onOpenItem={() => {}} />,
  );
  const running = screen.getByRole("button", { name: "3 running ›" });
  ((await running.element()) as HTMLElement).focus();
  await screen.rerender(
    <ChatTaskList
      data={{
        ...WORKING,
        state: "done",
        items: WORKING.items.map((item) =>
          item.id === "b" ? { ...item, status: "completed" } : item,
        ),
      }}
      onOpenItem={() => {}}
    />,
  );
  await vi.waitFor(() =>
    expect(document.activeElement).toBe(header(screen.container)),
  );
  expect(header(screen.container).getAttribute("aria-expanded")).toBe("true");
});
