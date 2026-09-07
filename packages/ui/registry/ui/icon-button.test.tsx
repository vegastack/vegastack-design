import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { Plus } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import { IconButton } from "./icon-button";

test("renders an accessibly-named button from aria-label", async () => {
  const screen = await render(
    <IconButton aria-label="Add item">
      <Plus />
    </IconButton>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Add item" }))
    .toBeInTheDocument();
});

test("fires onClick", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <IconButton aria-label="Add item" onClick={onClick}>
      <Plus />
    </IconButton>,
  );
  await screen.getByRole("button", { name: "Add item" }).click();
  expect(onClick).toHaveBeenCalledOnce();
});

test("uses the shared size vocabulary and tags the slot", async () => {
  const screen = await render(
    <IconButton aria-label="Add item" size="sm">
      <Plus />
    </IconButton>,
  );
  const btn = screen.getByRole("button", { name: "Add item" });
  await expect.element(btn).toHaveAttribute("data-size", "sm");
  await expect.element(btn).toHaveAttribute("data-slot", "icon-button");
});

test("defaults to the md square and is actually square", async () => {
  const screen = await render(
    <IconButton aria-label="Add item">
      <Plus />
    </IconButton>,
  );
  const btn = screen.getByRole("button", { name: "Add item" });
  await expect.element(btn).toHaveAttribute("data-size", "md");
  const box = (btn.element() as HTMLElement).getBoundingClientRect();
  expect(Math.abs(box.width - box.height)).toBeLessThan(0.5);
});

test("passes variant + tone through to Button", async () => {
  const screen = await render(
    <IconButton aria-label="Delete" variant="soft" tone="destructive">
      <Plus />
    </IconButton>,
  );
  const btn = screen.getByRole("button", { name: "Delete" });
  await expect.element(btn).toHaveAttribute("data-variant", "soft");
  await expect.element(btn).toHaveAttribute("data-tone", "destructive");
});

test('shape="round" makes the control circular and marks data-shape', async () => {
  const screen = await render(
    <IconButton aria-label="Add item" shape="round">
      <Plus />
    </IconButton>,
  );
  const btn = screen.getByRole("button", { name: "Add item" });
  await expect.element(btn).toHaveAttribute("data-shape", "round");
  const el = btn.element() as HTMLElement;
  const radius = Number.parseFloat(getComputedStyle(el).borderTopLeftRadius);
  expect(radius).toBeGreaterThanOrEqual(el.getBoundingClientRect().height / 2);
});

test("no a11y violations", async () => {
  const screen = await render(
    <IconButton aria-label="Add item">
      <Plus />
    </IconButton>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <IconButton aria-label="Add item" disabled>
      <Plus />
    </IconButton>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — loading", async () => {
  const screen = await render(
    <IconButton aria-label="Add item" loading>
      <Plus />
    </IconButton>,
  );
  await expectNoA11yViolations(screen.container);
});

test("forwards ref to the underlying button element", async () => {
  // Delegating wrapper: {...props} (carrying ref) is spread onto Button, which
  // forwards onto its <button> host. No code change needed (Pattern D).
  const ref = React.createRef<HTMLButtonElement>();
  await render(
    <IconButton ref={ref} aria-label="Add item">
      <Plus />
    </IconButton>,
  );
  expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  expect(ref.current?.dataset.slot).toBe("icon-button");
});

test("loading stacks the spinner over the hidden icon and keeps the square", async () => {
  const idle = await render(
    <IconButton aria-label="Add item">
      <Plus />
    </IconButton>,
  );
  const idleBox = (
    idle.getByRole("button", { name: "Add item" }).element() as HTMLElement
  ).getBoundingClientRect();

  const screen = await render(
    <IconButton aria-label="Add item" loading>
      <Plus />
    </IconButton>,
  );
  // The accessible name survives — it comes from aria-label, not the icon.
  const btn = screen.getByRole("button", { name: "Add item" });
  await expect.element(btn).toHaveAttribute("aria-busy", "true");
  const el = btn.element() as HTMLElement;
  const box = el.getBoundingClientRect();
  expect(Math.abs(box.width - idleBox.width)).toBeLessThan(0.5);
  expect(Math.abs(box.height - idleBox.height)).toBeLessThan(0.5);
});
