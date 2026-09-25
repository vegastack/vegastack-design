import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { BoardCard } from "./board-card";

const NOW = new Date("2026-09-25T12:00:00Z");
const dateOptions = { now: NOW, timeZone: "UTC" };

test("renders the title, context, due, priority and assignee", async () => {
  const screen = await render(
    <BoardCard
      title="Write the launch brief"
      context="Website redesign · Acme"
      due="2026-09-30T12:00:00Z"
      dateOptions={dateOptions}
      priority="high"
      assignee={{ name: "Priya Shah" }}
    />,
  );
  await expect
    .element(screen.getByText("Write the launch brief"))
    .toBeInTheDocument();
  await expect
    .element(screen.getByText("Website redesign · Acme"))
    .toBeInTheDocument();
  const priority = screen.container.querySelector<HTMLElement>(
    '[data-slot="board-card-priority"]',
  )!;
  expect(priority.textContent).toBe("High");
  expect(priority.dataset.variant).toBe("warning");
  const assignee = screen.container.querySelector(
    '[data-slot="board-card-assignee"]',
  )!;
  expect(assignee.textContent).toContain("PS");
  expect(assignee.textContent).toContain("Priya Shah");
  await expectNoA11yViolations(screen.container);
});

test("the due chip is destructive when overdue and warning when due today", async () => {
  const screen = await render(
    <>
      <BoardCard
        title="Late"
        due="2026-09-23T12:00:00Z"
        dateOptions={dateOptions}
      />
      <BoardCard
        title="Today"
        due="2026-09-25T18:00:00Z"
        dateOptions={dateOptions}
      />
      <BoardCard
        title="Later"
        due="2026-10-20T12:00:00Z"
        dateOptions={dateOptions}
      />
    </>,
  );
  const chips = Array.from(
    screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="board-card-due"]',
    ),
  );
  expect(chips.map((chip) => chip.dataset.variant)).toEqual([
    "destructive",
    "warning",
    "outline",
  ]);
  expect(chips[0]!.textContent).toContain("Overdue");
  expect(chips[1]!.textContent).toBe("Due today");
});

test("urgent is destructive; medium and low are quiet", async () => {
  const screen = await render(
    <>
      <BoardCard title="A" priority="urgent" />
      <BoardCard title="B" priority="low" priorityLabel="Low priority" />
    </>,
  );
  const chips = Array.from(
    screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="board-card-priority"]',
    ),
  );
  expect(chips[0]!.dataset.variant).toBe("destructive");
  expect(chips[1]!.dataset.variant).toBe("outline");
  expect(chips[1]!.textContent).toBe("Low priority");
});

test("the round tick toggles done and strikes the title", async () => {
  function Toggle() {
    const [done, setDone] = React.useState(false);
    return <BoardCard title="Ship it" done={done} onDoneChange={setDone} />;
  }
  const screen = await render(<Toggle />);
  const tick = screen.getByRole("checkbox", { name: "Mark done" });
  await expect.element(tick).toHaveAttribute("data-shape", "circle");
  (tick.element() as HTMLElement).click();
  await expect.element(tick).toBeChecked();
  const root = screen.container.querySelector(
    '[data-slot="board-card-content"]',
  )!;
  expect(root.hasAttribute("data-done")).toBe(true);
  await expectNoA11yViolations(screen.container);
});

test("the ⋯ slot reveals on hover, focus and touch", async () => {
  const screen = await render(
    <BoardCard
      title="Follow up"
      actions={<button type="button">More</button>}
    />,
  );
  const actions = screen.container.querySelector<HTMLElement>(
    '[data-slot="board-card-actions"]',
  )!;
  expect(actions.className).toContain("opacity-0");
  expect(actions.className).toContain("group-hover/board-card:opacity-100");
  expect(actions.className).toContain("focus-within:opacity-100");
  expect(actions.className).toContain("pointer-coarse:opacity-100");
});

test("surface draws 12px padding, a border and a hover tint; surface={false} draws none", async () => {
  const screen = await render(
    <>
      <BoardCard title="On its own" />
      <BoardCard title="On a board" surface={false} />
    </>,
  );
  const [own, bare] = Array.from(
    screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="board-card-content"]',
    ),
  );
  expect(own!.className).toContain("p-3");
  expect(own!.className).toContain("border-border");
  expect(own!.className).toContain("hover:bg-accent/50");
  expect(bare!.className).not.toContain("border-border");
});

test("href makes the title a stretched link with no focus ring", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <BoardCard title="Open me" href="/tasks/1" onClick={onClick} />,
  );
  const link = screen.getByRole("link", { name: "Open me" });
  await expect.element(link).toHaveAttribute("href", "/tasks/1");
  expect(link.element().className).toContain("after:inset-0");
  expect(link.element().className).not.toMatch(/ring-/);
  await expectNoA11yViolations(screen.container);
});
