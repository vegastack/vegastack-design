/**
 * `task-inline.test.tsx` — a task in running text (one box, the title that opens it, avatar, due
 * chip, ↗) and the popover that makes one from a checklist line.
 */

import "../../test/geometry.css"; // compiled Tailwind + @vegastack token theme
import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { MakeTaskPopover, TaskInline } from "./task-inline";

test("one box, a title that opens the task, the assignee's avatar, a due chip and ↗", async () => {
  const onToggle = vi.fn();
  const onOpen = vi.fn();
  const screen = await render(
    <p>
      <TaskInline
        title="Order glass"
        assignee={{ name: "Asha Rao", hue: "blue" }}
        due="Fri 31 Oct"
        onToggle={onToggle}
        onOpen={onOpen}
        href="/tasks/t1"
      />
    </p>,
  );
  const boxes = screen.container.querySelectorAll('[role="checkbox"]');
  expect(boxes).toHaveLength(1);
  expect(
    screen.container
      .querySelector('[data-slot="checkbox"]')
      ?.getAttribute("data-shape"),
  ).toBe("circle");
  await screen.getByRole("checkbox", { name: "Mark task done" }).click();
  expect(onToggle).toHaveBeenCalledWith(true);
  await screen.getByRole("button", { name: "Order glass" }).click();
  expect(onOpen).toHaveBeenCalledOnce();
  await expect
    .element(screen.getByRole("img", { name: "Assigned to Asha Rao" }))
    .toBeInTheDocument();
  expect(
    screen.container.querySelector('[data-slot="task-inline-due"]')
      ?.textContent,
  ).toBe("Due Fri 31 Oct");
  await expect
    .element(screen.getByRole("link", { name: "Open task page" }))
    .toHaveAttribute("href", "/tasks/t1");
  await expectNoA11yViolations(screen.container);
});

test("the title opens on Enter, and a press on it never reaches what is around it", async () => {
  const onOpen = vi.fn();
  const outer = vi.fn();
  const screen = await render(
    <div onMouseDown={outer}>
      <TaskInline title="Order glass" onOpen={onOpen} />
    </div>,
  );
  const title = screen.getByRole("button", { name: "Order glass" });
  await title.click();
  expect(outer).not.toHaveBeenCalled();
  (title.element() as HTMLElement).focus();
  await userEvent.keyboard("{Enter}");
  expect(onOpen).toHaveBeenCalledTimes(2);
});

test("done mutes the title, struck strikes it with its status, overdue inks the due chip; read-only box", async () => {
  const screen = await render(
    <div>
      <TaskInline title="Done one" done due="Mon" />
      <TaskInline title="Closed one" struck status="Canceled" />
      <TaskInline title="Late one" due="Yesterday" overdue />
      <TaskInline title="No box" checkbox={false} />
    </div>,
  );
  const roots = [
    ...screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="task-inline"]',
    ),
  ];
  expect(roots[0]!.hasAttribute("data-done")).toBe(true);
  expect(
    roots[0]!.querySelector('[data-slot="task-inline-title"]')?.className,
  ).toContain("text-muted-foreground");
  expect(
    roots[1]!.querySelector('[data-slot="task-inline-title"]')?.className,
  ).toContain("line-through");
  expect(
    roots[1]!.querySelector('[data-slot="task-inline-status"]')?.textContent,
  ).toBe("Canceled");
  expect(
    roots[2]!
      .querySelector('[data-slot="task-inline-due"]')
      ?.hasAttribute("data-overdue"),
  ).toBe(true);
  expect(roots[3]!.querySelector('[role="checkbox"]')).toBeNull();
  // Without onToggle the box reports its state and cannot change.
  const box = roots[0]!.querySelector<HTMLElement>('[role="checkbox"]')!;
  expect(box.getAttribute("aria-checked")).toBe("true");
  expect(box.hasAttribute("data-disabled")).toBe(true);
  // Without onOpen the title is text, not a button.
  expect(roots[0]!.querySelector('[role="button"]')).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("MakeTaskPopover: the line's text is the title; Enter creates and closes", async () => {
  const onCreate = vi.fn();
  function Harness() {
    const [open, setOpen] = React.useState(true);
    const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
    return (
      <>
        <p ref={setAnchor}>Order glass</p>
        <MakeTaskPopover
          open={open}
          onOpenChange={setOpen}
          anchor={anchor}
          lines={[{ key: "b1", text: "  Order glass " }]}
          onCreate={onCreate}
          assignee={<button type="button">Assignee</button>}
        />
      </>
    );
  }
  const screen = await render(<Harness />);
  const title = await vi.waitFor(() => {
    const found = document.querySelector<HTMLInputElement>(
      '[data-slot="make-task-popover-title"]',
    );
    expect(found).not.toBeNull();
    return found!;
  });
  expect(title.value).toBe("Order glass");
  expect(
    document.querySelector('[data-slot="make-task-popover-fields"]')
      ?.textContent,
  ).toBe("Assignee");
  await expectNoA11yViolations(document.body);
  title.focus();
  await userEvent.keyboard(" today{Enter}");
  expect(onCreate).toHaveBeenCalledWith([
    { key: "b1", title: "Order glass today" },
  ]);
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="make-task-popover"]'),
    ).toBeNull(),
  );
  expect(screen.container.textContent).toContain("Order glass");
});

test("MakeTaskPopover with several lines: a keep box per line, Create counts the kept ones, a rejection keeps it open", async () => {
  let fail = true;
  const onCreate = vi.fn(async () => {
    if (fail) throw new Error("nope");
  });
  function Harness() {
    const [open, setOpen] = React.useState(true);
    return (
      <MakeTaskPopover
        open={open}
        onOpenChange={setOpen}
        anchor={null}
        lines={[
          { key: "a", text: "Measure" },
          { key: "b", text: "Order" },
          { key: "c", text: "Book" },
        ]}
        onCreate={onCreate}
      />
    );
  }
  await render(<Harness />);
  const create = () =>
    [...document.querySelectorAll<HTMLButtonElement>("button")].find((each) =>
      each.textContent?.startsWith("Create"),
    )!;
  await vi.waitFor(() => expect(create().textContent).toBe("Create 3 tasks"));
  const keep = document.querySelector<HTMLElement>(
    '[aria-label="Make a task of line 2"]',
  )!;
  await userEvent.click(keep);
  await vi.waitFor(() => expect(create().textContent).toBe("Create 2 tasks"));
  await userEvent.click(create());
  await vi.waitFor(() => expect(onCreate).toHaveBeenCalledOnce());
  expect(onCreate).toHaveBeenCalledWith([
    { key: "a", title: "Measure" },
    { key: "c", title: "Book" },
  ]);
  // Rejected: still open, Create can be tried again.
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="make-task-popover"]'),
    ).not.toBeNull(),
  );
  fail = false;
  await userEvent.click(create());
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="make-task-popover"]'),
    ).toBeNull(),
  );
});

test("MakeTaskPopover keeps the titles being edited when the host re-renders with equal lines", async () => {
  function Harness() {
    const [, setTick] = React.useState(0);
    return (
      <>
        <MakeTaskPopover
          open
          onOpenChange={() => {}}
          anchor={null}
          // A new array each render, as a host's picker change makes.
          lines={[{ key: "b1", text: "Order glass" }]}
          onCreate={() => {}}
          assignee={
            <button type="button" onClick={() => setTick((n) => n + 1)}>
              Pick
            </button>
          }
        />
      </>
    );
  }
  await render(<Harness />);
  const title = await vi.waitFor(() => {
    const found = document.querySelector<HTMLInputElement>(
      '[data-slot="make-task-popover-title"]',
    );
    expect(found).not.toBeNull();
    return found!;
  });
  title.focus();
  await userEvent.keyboard(" now");
  await userEvent.click(
    [...document.querySelectorAll("button")].find(
      (each) => each.textContent === "Pick",
    )!,
  );
  expect(
    document.querySelector<HTMLInputElement>(
      '[data-slot="make-task-popover-title"]',
    )!.value,
  ).toBe("Order glass now");
});

test("↗ is a tab stop even with no box and no title button, and shows once focused", async () => {
  const screen = await render(
    <p>
      <TaskInline title="Order glass" checkbox={false} href="/tasks/t1" />
    </p>,
  );
  const link = screen.getByRole("link", { name: "Open task page" }).element();
  expect(link.getBoundingClientRect().width).toBeLessThanOrEqual(1);
  await userEvent.tab();
  expect(document.activeElement).toBe(link);
  await vi.waitFor(() => expect(link.getBoundingClientRect().width).toBe(24));
});

test("MakeTaskPopover with 50 lines fits the window: the lines scroll, the heading and actions stay in view, titles stop at titleMaxLength", async () => {
  const lines = Array.from({ length: 50 }, (_, index) => ({
    key: `l${index}`,
    text: `Line ${index + 1}`,
  }));
  await render(
    <MakeTaskPopover
      open
      onOpenChange={() => {}}
      anchor={null}
      lines={lines}
      onCreate={() => {}}
      titleMaxLength={12}
    />,
  );
  const popup = await vi.waitFor(() => {
    const el = document.querySelector<HTMLElement>(
      '[data-slot="make-task-popover"]',
    );
    expect(el).not.toBeNull();
    return el!;
  });
  const list = popup.querySelector<HTMLElement>(
    '[data-slot="make-task-popover-lines"]',
  )!;
  await vi.waitFor(() => {
    expect(popup.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      window.innerHeight,
    );
    expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
  });
  const actions = popup.querySelector<HTMLElement>(
    '[data-slot="make-task-popover-actions"]',
  )!;
  const heading = popup.querySelector<HTMLElement>(
    '[data-slot="popover-title"]',
  );
  expect(actions.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    window.innerHeight,
  );
  expect(actions.getBoundingClientRect().height).toBeGreaterThan(0);
  if (heading)
    expect(heading.getBoundingClientRect().top).toBeGreaterThanOrEqual(0);
  const first = popup.querySelector<HTMLInputElement>(
    '[aria-label="Title of task 1"]',
  )!;
  expect(first.maxLength).toBe(12);
  await userEvent.clear(first);
  await userEvent.type(first, "abcdefghijklmnopq");
  expect(first.value).toBe("abcdefghijkl");
  await expectNoA11yViolations(popup);
});
