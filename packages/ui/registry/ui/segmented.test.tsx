import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Segmented, SegmentedItem } from "./segmented";

function Basic({
  onValueChange,
  size,
  defaultValue = "monthly",
}: {
  onValueChange?: (value: string) => void;
  size?: "default" | "lg";
  defaultValue?: string;
} = {}) {
  return (
    <Segmented
      aria-label="Billing cycle"
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      size={size}
    >
      <SegmentedItem value="monthly">Monthly</SegmentedItem>
      <SegmentedItem value="annual">Annual</SegmentedItem>
      <SegmentedItem value="lifetime">Lifetime</SegmentedItem>
    </Segmented>
  );
}

test("renders all segments; the default value is pressed", async () => {
  const screen = await render(<Basic />);
  const monthly = screen.getByRole("button", { name: "Monthly" });
  await expect.element(monthly).toHaveAttribute("aria-pressed", "true");
  await expect
    .element(screen.getByRole("button", { name: "Annual" }))
    .toHaveAttribute("aria-pressed", "false");
});

test("selects the first enabled segment when no value is supplied", async () => {
  const screen = await render(
    <Segmented aria-label="View">
      <SegmentedItem value="disabled" disabled>
        Disabled
      </SegmentedItem>
      <SegmentedItem value="grid">Grid</SegmentedItem>
      <SegmentedItem value="list">List</SegmentedItem>
    </Segmented>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Grid" }))
    .toHaveAttribute("aria-pressed", "true");
});

test("selecting another segment moves the selection and fires onValueChange with a string", async () => {
  const onValueChange = vi.fn();
  const screen = await render(<Basic onValueChange={onValueChange} />);
  await userEvent.click(screen.getByRole("button", { name: "Annual" }));
  expect(onValueChange).toHaveBeenCalledWith("annual");
  await expect
    .element(screen.getByRole("button", { name: "Annual" }))
    .toHaveAttribute("aria-pressed", "true");
  await expect
    .element(screen.getByRole("button", { name: "Monthly" }))
    .toHaveAttribute("aria-pressed", "false");
  await expectNoA11yViolations(screen.container);
});

test("clicking the active segment never empties the selection (radio semantics)", async () => {
  const onValueChange = vi.fn();
  const screen = await render(<Basic onValueChange={onValueChange} />);
  const monthly = screen.getByRole("button", { name: "Monthly" });
  await userEvent.click(monthly);
  // Base UI may emit an empty group value internally; the public callback must not.
  for (const call of onValueChange.mock.calls)
    expect(typeof call[0]).toBe("string");
  await expect.element(monthly).toHaveAttribute("aria-pressed", "true");
});

test("controlled value renders the given selection", async () => {
  const screen = await render(
    <Segmented aria-label="View" value="board">
      <SegmentedItem value="table">Table</SegmentedItem>
      <SegmentedItem value="board">Board</SegmentedItem>
    </Segmented>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Board" }))
    .toHaveAttribute("aria-pressed", "true");
});

test("size flows from the track to items via context and is exposed as data-size", async () => {
  const screen = await render(<Basic size="lg" />);
  const item = screen.getByRole("button", { name: "Monthly" });
  await expect.element(item).toHaveAttribute("data-size", "lg");
  const track = screen.getByRole("group", { name: "Billing cycle" });
  await expect.element(track).toHaveAttribute("data-size", "lg");
  expect(track.element().className).toContain("rounded-md");
  expect(item.element().className).toContain("rounded-sm");
});

test("forwards refs to track and item roots", async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const itemRef = React.createRef<HTMLButtonElement>();
  await render(
    <Segmented ref={rootRef} aria-label="View">
      <SegmentedItem ref={itemRef} value="grid">
        Grid
      </SegmentedItem>
    </Segmented>,
  );
  expect(rootRef.current?.dataset.slot).toBe("segmented");
  expect(itemRef.current?.dataset.slot).toBe("segmented-item");
});

test("arrow keys move focus between segments (primitive keyboard contract)", async () => {
  const screen = await render(<Basic />);
  const monthly = screen.getByRole("button", { name: "Monthly" });
  (monthly.element() as HTMLElement).focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect
    .element(screen.getByRole("button", { name: "Annual" }))
    .toHaveFocus();
});

test("disabled item is skipped for interaction", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <Segmented
      aria-label="Scope"
      defaultValue="all"
      onValueChange={onValueChange}
    >
      <SegmentedItem value="all">All</SegmentedItem>
      <SegmentedItem value="mine" disabled>
        Mine
      </SegmentedItem>
    </Segmented>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Mine" }), {
    force: true,
  });
  expect(onValueChange).not.toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);
});

test("has no accessibility violations", async () => {
  const screen = await render(<Basic />);
  await expectNoA11yViolations(screen.container);
});
