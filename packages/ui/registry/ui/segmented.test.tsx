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
  size?: "md" | "lg";
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
  // The track's drawn `after:` hairline went with the surface ladder (COL-9 = shadcn): upstream's
  // track is a plain `bg-muted` well with no boundary of its own.
  expect(track.element().className).toContain("bg-muted");
  expect(item.element().className).toContain("rounded-sm");
});

test("the SELECTED chip keeps a hover and a pressed step (B6-02, active-same-as-hover)", async () => {
  const screen = await render(<Basic />);
  const selected = screen.getByRole("button", { name: "Monthly" });
  await expect.element(selected).toHaveAttribute("aria-pressed", "true");
  const className = selected.element().className;
  // COL-9 and INT-6 are decided as **shadcn**, so the alpha ink-tint ladder the selected chip
  // climbed is gone and the selected chip is upstream's raised pill: its own surface, its own
  // hairline, and a shadow. The claim that survives is that SELECTED is visibly a different
  // surface from unselected, which is what the recipe has to deliver.
  expect(className).toContain("data-pressed:bg-background");
  expect(className).toContain("data-pressed:border-input");
  expect(className).toContain("data-pressed:shadow-sm");
  expect(className).toContain("hover:text-foreground");
});

test("Segmented, Tabs and Toggle share ONE selected-chip recipe (B6-02)", async () => {
  const screen = await render(<Basic />);
  const chipLocator = screen.getByRole("button", { name: "Monthly" });
  await expect.element(chipLocator).toBeInTheDocument();
  const chip = chipLocator.element();
  // The recipe is a single exported literal; asserting the chip actually carries it is what stops
  // a fifth "selected look" being hand-written into any one of the four consumers again.
  for (const rule of "data-pressed:border-input data-pressed:bg-background data-pressed:text-foreground data-pressed:shadow-sm dark:data-pressed:bg-input/30".split(
    " ",
  )) {
    expect(chip.className).toContain(rule);
  }
  const track = screen.getByRole("group", { name: "Billing cycle" }).element();
  expect(track.className).toContain("bg-muted");
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
