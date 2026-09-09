import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import { RegionSelect } from "./region-select";

/* The dataset assertions (REGIONS, getRegions, the 45/1187 counts) moved to
   registry/lib/geo-data.test.ts with the data itself (audit B8-02 / D27). */

test("renders a combobox trigger with the placeholder for a country with states", async () => {
  const screen = await render(
    <RegionSelect country="US" placeholder="Pick a state" />,
  );
  const trigger = screen.getByRole("combobox", { name: /pick a state/i });
  await expect.element(trigger).toBeInTheDocument();
  await expect.element(trigger).toHaveAttribute("data-placeholder");
});

test("shows the selected state name in the trigger", async () => {
  const screen = await render(<RegionSelect country="US" value="CA" />);
  await expect
    .element(screen.getByRole("combobox", { name: /california/i }))
    .toBeInTheDocument();
});

test("opens the popover and lists states, then filters as you type", async () => {
  const screen = await render(<RegionSelect country="US" />);
  await screen.getByRole("combobox").click();

  await expect.element(screen.getByText("California")).toBeInTheDocument();
  await expect.element(screen.getByText("Texas")).toBeInTheDocument();

  await screen.getByPlaceholder("Search states…").fill("Calif");
  await expect.element(screen.getByText("California")).toBeInTheDocument();
  // Non-matching items are removed from the DOM (Base UI only renders query-filtered items).
  await expect.poll(() => document.body.textContent).not.toContain("Texas");
});

test("shows the empty state when nothing matches the query", async () => {
  const screen = await render(<RegionSelect country="US" />);
  await screen.getByRole("combobox").click();
  await screen.getByPlaceholder("Search states…").fill("zzzznope");
  await expect.element(screen.getByText("No state found.")).toBeInTheDocument();
});

// AUDIT B8-02 — the acceptance test for the single selection path. The old build computed the
// value inside each item's `onClick` and left the Combobox root's `onValueChange` unwired, so a
// pointer click and keyboard Enter (which the ROOT handles) reached the value by two different
// routes. Both modalities are asserted against ONE expectation here: if the two ever diverge
// again, exactly one of these two assertions fails.
test("pointer click and keyboard Enter select through the same code path", async () => {
  const onPointer = vi.fn();
  const onKeyboard = vi.fn();
  // Two live instances rather than a render/unmount pair: unmounting mid-test tears down the
  // shared container and every later render in the file lands in a detached node.
  const screen = await render(
    <>
      <RegionSelect
        country="US"
        aria-label="Pointer state"
        onValueChange={onPointer}
      />
      <RegionSelect
        country="US"
        aria-label="Keyboard state"
        onValueChange={onKeyboard}
      />
    </>,
  );

  await screen.getByRole("combobox", { name: "Pointer state" }).click();
  await screen.getByPlaceholder("Search states…").fill("Texas");
  await screen.getByRole("option", { name: "Texas" }).click();

  await screen.getByRole("combobox", { name: "Keyboard state" }).click();
  await screen.getByPlaceholder("Search states…").fill("Texas");
  await userEvent.keyboard("{Enter}");

  expect(onPointer).toHaveBeenCalledWith("TX");
  expect(onKeyboard).toHaveBeenCalledWith("TX");
  expect(onKeyboard.mock.calls).toEqual(onPointer.mock.calls);
});

// AUDIT B8-02 — the explicit replacement for the old click-again-to-clear toggle.
test("the clear control resets the value, and re-picking the selected state keeps it", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <RegionSelect country="US" value="CA" onValueChange={onValueChange} />,
  );
  await screen.getByRole("button", { name: "Clear state" }).click();
  expect(onValueChange).toHaveBeenCalledWith("");

  onValueChange.mockClear();
  await screen.getByRole("combobox").click();
  await screen.getByRole("option", { name: "California" }).click();
  // No toggle-to-clear: selecting what is already selected is a no-op or a re-select, never "".
  expect(onValueChange).not.toHaveBeenCalledWith("");
});

test("clearable can be turned off", async () => {
  const screen = await render(
    <RegionSelect country="US" value="CA" clearable={false} />,
  );
  expect(
    screen.container.querySelector('[data-slot="region-select-clear"]'),
  ).toBeNull();
});

test("falls back to a text input for a country with no states data", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <RegionSelect
      country="SG"
      placeholder="Enter region"
      onValueChange={onValueChange}
    />,
  );
  // No combobox trigger — a plain text input instead.
  expect(document.querySelector('[role="combobox"]')).toBeNull();
  const input = screen.getByPlaceholder("Enter region");
  await expect.element(input).toBeInTheDocument();

  await input.fill("Central");
  expect(onValueChange).toHaveBeenLastCalledWith("Central");
});

test("disabled disables the trigger", async () => {
  const screen = await render(<RegionSelect country="US" disabled />);
  await expect.element(screen.getByRole("combobox")).toBeDisabled();
});

test("className applies to the focusable combobox and containerClassName applies to the wrapper", async () => {
  const screen = await render(
    <RegionSelect
      country="US"
      className="trigger-probe"
      containerClassName="container-probe"
    />,
  );
  const root = screen.container.querySelector('[data-slot="region-select"]');
  expect(root).toHaveClass("container-probe");
  await expect
    .element(screen.getByRole("combobox"))
    .toHaveClass("trigger-probe");
});

test("className applies to the fallback input for countries without state data", async () => {
  const screen = await render(
    <RegionSelect
      country="SG"
      placeholder="Enter region"
      className="input-probe"
      containerClassName="container-probe"
    />,
  );
  const root = screen.container.querySelector('[data-slot="region-select"]');
  expect(root).toHaveClass("container-probe");
  await expect
    .element(screen.getByPlaceholder("Enter region"))
    .toHaveClass("input-probe");
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <RegionSelect country="US" disabled aria-label="State" />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations (closed, with a clearable value)", async () => {
  const screen = await render(
    <RegionSelect country="US" value="CA" aria-label="State" />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations (open)", async () => {
  const screen = await render(<RegionSelect country="US" />);
  await screen.getByRole("combobox").click();
  await expect.element(screen.getByText("California")).toBeInTheDocument();
  // Combobox portals to <body>; audit the whole document. No suppression needed.
  await expectNoA11yViolations(document.body);
});

test("forwards ref to the root element (combobox path)", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(<RegionSelect ref={ref} country="US" />);
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("region-select");
});
