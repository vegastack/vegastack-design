import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  TaskList,
  TaskListProgress,
  type TaskListItem,
  type TaskListItemStatus,
} from "./task-list";
import "../../test/geometry.css";

const slot = (root: ParentNode, name: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`);
const rows = (root: ParentNode) =>
  [...root.querySelectorAll<HTMLElement>('[data-slot="task-list-item"]')].map(
    (row) => slot(row, "task-list-item-text")!.textContent,
  );

function list(count: number, live: number): TaskListItem[] {
  return Array.from({ length: count }, (_, index) => {
    const status: TaskListItemStatus =
      index < live ? "completed" : index === live ? "in_progress" : "pending";
    return {
      id: String(index),
      text: `Item ${index + 1}`,
      doing: `Doing item ${index + 1}`,
      status,
    };
  });
}

test("five or fewer rows never fold", async () => {
  const screen = await render(<TaskList items={list(5, 3)} />);
  expect(rows(screen.container)).toEqual([
    "Item 1",
    "Item 2",
    "Item 3",
    "Item 4",
    "Item 5",
  ]);
  expect(slot(screen.container, "task-list-done-fold")).toBeNull();
  expect(slot(screen.container, "task-list-more-fold")).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("a long list shows the live item and the next two between the folds", async () => {
  const screen = await render(<TaskList items={list(9, 6)} />);
  expect(rows(screen.container)).toEqual(["Item 7", "Item 8", "Item 9"]);
  expect(slot(screen.container, "task-list-done-fold")!.textContent).toBe(
    "6 done",
  );
  expect(slot(screen.container, "task-list-more-fold")).toBeNull();
  const twelve = await render(<TaskList items={list(12, 4)} />);
  expect(rows(twelve.container)).toEqual(["Item 5", "Item 6", "Item 7"]);
  expect(slot(twelve.container, "task-list-more-fold")!.textContent).toBe(
    "+5 more",
  );
  await expectNoA11yViolations(twelve.container);
});

test("opening a fold shows every row, and Show less folds them back", async () => {
  const onExpandedChange = vi.fn();
  const screen = await render(
    <TaskList items={list(12, 4)} onExpandedChange={onExpandedChange} />,
  );
  await page.getByRole("button", { name: "+5 more" }).click();
  expect(rows(screen.container)).toHaveLength(12);
  expect(onExpandedChange).toHaveBeenLastCalledWith(true);
  await page.getByRole("button", { name: "Show less" }).click();
  expect(rows(screen.container)).toHaveLength(3);
});

test("skipped, unfinished and waiting rows never fold", async () => {
  const items = list(12, 6).map((item, index) =>
    index === 1
      ? { ...item, status: "skipped" as const }
      : index === 10
        ? { ...item, waiting: true }
        : item,
  );
  const screen = await render(
    <TaskList items={items} state="stopped" reason="ran out of steps" />,
  );
  expect(rows(screen.container)).toEqual([
    "Item 2",
    "Item 7 · didn't finish",
    "Item 8 · not done",
    "Item 9 · not done",
    "Item 11",
  ]);
  const root = slot(screen.container, "task-list")!;
  expect(root.dataset.state).toBe("stopped");
  expect(slot(root, "task-list-summary")!.textContent).toBe(
    "Stopped at 5 of 12 · ran out of steps",
  );
  expect(root.textContent).toContain("Waiting for you");
  await expectNoA11yViolations(screen.container);
});

test("each item is read with its state first", async () => {
  const screen = await render(<TaskList items={list(3, 1)} />);
  const items = screen.container.querySelectorAll("li");
  expect(items[0]!.textContent).toContain("Done:");
  expect(items[1]!.textContent).toContain("In progress:");
  expect(items[2]!.textContent).toContain("To do:");
  await expect
    .element(page.getByRole("list", { name: "Task list" }))
    .toBeInTheDocument();
});

test("the header names the live item while open, and its step when closed", async () => {
  const screen = await render(<TaskList items={list(9, 2)} />);
  const summary = () =>
    slot(screen.container, "task-list-summary")!.textContent;
  expect(summary()).toBe("Doing item 3…");
  await page.getByRole("button", { name: /Doing item 3/ }).click();
  expect(summary()).toBe("Step 3 of 9 · Item 3");
});

test("a finished list closes itself a second after it ends", async () => {
  const screen = await render(<TaskList items={list(3, 2)} />);
  const root = slot(screen.container, "task-list")!;
  expect(slot(root, "task-list-content")).not.toBeNull();
  await screen.rerender(
    <TaskList items={list(3, 3)} state="done" ms={31000} />,
  );
  expect(slot(root, "task-list-summary")!.textContent).toBe(
    "Done · 3 of 3 steps",
  );
  await vi.waitFor(
    () =>
      expect(
        root
          .querySelector('[data-slot="task-list-trigger"]')!
          .getAttribute("aria-expanded"),
      ).toBe("false"),
    { timeout: 2500 },
  );
});

test("announces a change of live item, never the first paint, at most once per 3s", async () => {
  const screen = await render(<TaskList items={list(4, 0)} />);
  const region = () => slot(screen.container, "announcer")!.textContent;
  expect(region()).toBe("");
  await screen.rerender(<TaskList items={list(4, 1)} />);
  await vi.waitFor(() => expect(region()).toBe("Step 2 of 4: Item 2"));
  await screen.rerender(<TaskList items={list(4, 2)} />);
  // Held back: the last announcement was under 3s ago.
  await new Promise((resolve) => setTimeout(resolve, 300));
  expect(region()).toBe("Step 2 of 4: Item 2");
  await vi.waitFor(() => expect(region()).toBe("Step 3 of 4: Item 3"), {
    timeout: 4000,
  });
});

test("sub-progress is a button only when it opens something", async () => {
  const onOpen = vi.fn();
  const items = list(3, 1).map((item, index) =>
    index === 1
      ? { ...item, progress: "3 of 4 subagents done", onOpenProgress: onOpen }
      : index === 2
        ? { ...item, progress: "Not started" }
        : item,
  );
  await render(<TaskList items={items} />);
  await page.getByRole("button", { name: "3 of 4 subagents done" }).click();
  expect(onOpen).toHaveBeenCalledOnce();
  await expect
    .element(page.getByRole("button", { name: "Not started" }))
    .not.toBeInTheDocument();
});

test("the progress bar names the step and forwards its click", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <TaskListProgress
      step={3}
      total={9}
      text="Create the PDF"
      onClick={onClick}
    />,
  );
  await page
    .getByRole("button", { name: "Step 3 of 9 · Create the PDF" })
    .click();
  expect(onClick).toHaveBeenCalledOnce();
  expect(
    slot(screen.container, "task-list-progress-track")!.style.width,
  ).toMatch(/^22\.2/);
  await expectNoA11yViolations(screen.container);
});

test("a fold hands focus to Show less, and Show less hands it back to a fold", async () => {
  await render(<TaskList items={list(12, 4)} />);
  await page.getByRole("button", { name: "+5 more" }).click();
  await expect
    .element(page.getByRole("button", { name: "Show less" }))
    .toHaveFocus();
  await page.getByRole("button", { name: "Show less" }).click();
  await expect
    .element(page.getByRole("button", { name: "4 done" }))
    .toHaveFocus();
});

test("opening a fold animates nothing; a live tick does", async () => {
  const screen = await render(<TaskList items={list(9, 6)} />);
  await page.getByRole("button", { name: "6 done" }).click();
  expect(screen.container.querySelector(".motion-enter-up")).toBeNull();
  await screen.rerender(<TaskList items={list(9, 7)} />);
  await vi.waitFor(() =>
    expect(screen.container.querySelector(".motion-pop-in")).not.toBeNull(),
  );
});

test("a waiting row anchors the window like a live one", async () => {
  const items = list(12, 4).map((item, index) =>
    index === 4 ? { ...item, status: "pending" as const, waiting: true } : item,
  );
  const screen = await render(<TaskList items={items} />);
  expect(rows(screen.container)).toEqual(["Item 5", "Item 6", "Item 7"]);
});

test("the end is announced once, and the caller's ref still sees the root", async () => {
  const ref = { current: null as HTMLDivElement | null };
  const screen = await render(<TaskList ref={ref} items={list(3, 2)} />);
  expect(ref.current?.dataset.slot).toBe("task-list");
  const region = () => slot(screen.container, "announcer")!;
  await screen.rerender(<TaskList ref={ref} items={list(3, 2)} state="done" />);
  await vi.waitFor(() =>
    expect(region().textContent).toBe("Done · 3 of 3 steps"),
  );
  const spoken = region().firstElementChild;
  await screen.rerender(<TaskList ref={ref} items={list(3, 3)} state="done" />);
  await new Promise((resolve) => setTimeout(resolve, 300));
  // Same node: the identical message was not spoken again.
  expect(region().firstElementChild).toBe(spoken);
});

test("a row holding focus stays in view when the window moves on", async () => {
  const withProgress = (live: number) =>
    list(12, live).map((item, index) =>
      index === 4
        ? {
            ...item,
            progress: "3 of 4 subagents done",
            onOpenProgress: () => {},
          }
        : item,
    );
  const screen = await render(<TaskList items={withProgress(4)} />);
  const button = page.getByRole("button", { name: "3 of 4 subagents done" });
  ((await button.element()) as HTMLElement).focus();
  await screen.rerender(<TaskList items={withProgress(5)} />);
  expect(rows(screen.container)).toContain("Item 5");
  await expect.element(button).toHaveFocus();
});
