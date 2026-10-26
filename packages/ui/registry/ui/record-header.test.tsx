import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { RecordHeader, RecordHeaderSkeleton } from "./record-header";

const slot = (root: HTMLElement, name: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`);

test("renders every slot in its place, the title as the level-1 heading", async () => {
  const screen = await render(
    <RecordHeader
      eyebrow={<span>Sales</span>}
      keyBadge="TASK-12"
      icon={<span>★</span>}
      title="Draft the pricing note"
      status={<span>In progress</span>}
      presence={<span>AK</span>}
      actions={<button type="button">Share</button>}
      meta={<span>Created 12 Oct</span>}
      chips={<span>High</span>}
    />,
  );
  await expect
    .element(
      screen.getByRole("heading", { level: 1, name: "Draft the pricing note" }),
    )
    .toBeVisible();
  for (const name of [
    "record-header-location",
    "record-header-key",
    "record-header-icon",
    "record-header-status",
    "record-header-actions",
    "record-header-meta",
    "record-header-chips",
  ]) {
    expect(slot(screen.container, name), name).not.toBeNull();
  }
  expect(slot(screen.container, "record-header-key")!.textContent).toBe(
    "TASK-12",
  );
  await expectNoA11yViolations(screen.container);
});

test("level 2 is an h2, and empty slots leave nothing behind", async () => {
  const screen = await render(<RecordHeader level={2} title="Row 4" />);
  await expect
    .element(screen.getByRole("heading", { level: 2, name: "Row 4" }))
    .toBeVisible();
  expect(slot(screen.container, "record-header-eyebrow")).toBeNull();
  expect(slot(screen.container, "record-header-meta")).toBeNull();
  expect(slot(screen.container, "record-header-chips")).toBeNull();
});

test("onRename makes the title editable in place and saves on Enter", async () => {
  const onRename = vi.fn();
  const screen = await render(
    <RecordHeader
      title="Old title"
      titleLabel="Task title"
      onRename={onRename}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: /Task title/ }));
  const field = screen.getByRole("textbox", { name: "Task title" });
  await userEvent.clear(field);
  await userEvent.type(field, "New title{Enter}");
  expect(onRename).toHaveBeenCalledWith("New title");
  await expectNoA11yViolations(screen.container);
});

test("an empty read-only title shows the placeholder", async () => {
  const screen = await render(<RecordHeader title="" placeholder="Untitled" />);
  await expect
    .element(screen.getByRole("heading", { name: "Untitled" }))
    .toBeVisible();
});

test("the skeleton is decorative and keeps the header's heights", async () => {
  const screen = await render(<RecordHeaderSkeleton level={2} />);
  const root = slot(screen.container, "record-header-skeleton")!;
  expect(root.getAttribute("aria-hidden")).toBe("true");
  expect(root.querySelector(".h-7")).not.toBeNull();
});
