import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  RegionSelect,
  getRegionsByCountry,
  hasRegions,
} from "./region-select";
import { REGIONS_BY_COUNTRY } from "./region-select-data";

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

  // Popover + Command portal to <body>; query there.
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

test("selecting a state fires onValueChange with its code", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <RegionSelect country="US" onValueChange={onValueChange} />,
  );
  await screen.getByRole("combobox").click();
  await screen.getByText("California").click();
  expect(onValueChange).toHaveBeenCalledWith("CA");
});

test("selecting the already-selected state clears it", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <RegionSelect country="US" value="CA" onValueChange={onValueChange} />,
  );
  await screen.getByRole("combobox", { name: /california/i }).click();
  // Target the listbox option (the trigger also shows "California" as its label).
  await screen.getByRole("option", { name: "California" }).click();
  expect(onValueChange).toHaveBeenCalledWith("");
});

test("keyboard: typing then Enter selects the highlighted state", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <RegionSelect country="US" onValueChange={onValueChange} />,
  );
  await screen.getByRole("combobox").click();
  const input = screen.getByPlaceholder("Search states…");
  await input.fill("Texas");
  await userEvent.keyboard("{Enter}");
  expect(onValueChange).toHaveBeenCalledWith("TX");
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

test("dataset helpers resolve states case-insensitively", () => {
  expect(hasRegions("us")).toBe(true);
  expect(hasRegions("SG")).toBe(false);
  expect(getRegionsByCountry("ca")).toBe(REGIONS_BY_COUNTRY.CA);
  expect(getRegionsByCountry("ZZ")).toEqual([]);
});

test("ships the full platform subdivision dataset (45 countries, 1187 subdivisions)", () => {
  expect(Object.keys(REGIONS_BY_COUNTRY)).toHaveLength(45);
  const total = Object.values(REGIONS_BY_COUNTRY).reduce(
    (n, s) => n + s.length,
    0,
  );
  expect(total).toBe(1187);
  // Each block is keyed by an alpha-2 country code and has unique subdivision codes.
  for (const [country, states] of Object.entries(REGIONS_BY_COUNTRY)) {
    expect(country).toMatch(/^[A-Z]{2}$/);
    expect(states.length).toBeGreaterThan(0);
    const codes = new Set(states.map((s) => s.code));
    expect(codes.size).toBe(states.length); // no duplicate codes within a country
    for (const s of states) {
      expect(s.code.length).toBeGreaterThan(0);
      expect(s.name.length).toBeGreaterThan(0);
    }
  }
});

test("resolves subdivisions for countries the compact dataset lacked", () => {
  // Russia, Turkey, Ukraine, Nigeria, etc. were absent from the prior 9-country list.
  expect(hasRegions("RU")).toBe(true);
  expect(getRegionsByCountry("RU").find((s) => s.code === "MOW")?.name).toBe(
    "Moscow",
  );
  expect(hasRegions("TR")).toBe(true);
  expect(getRegionsByCountry("TR").find((s) => s.code === "34")?.name).toBe(
    "İstanbul",
  );
  expect(hasRegions("NG")).toBe(true);
  expect(getRegionsByCountry("ng").find((s) => s.code === "LA")?.name).toBe(
    "Lagos",
  );
  expect(hasRegions("JP")).toBe(true);
  expect(getRegionsByCountry("JP").find((s) => s.code === "13")?.name).toBe(
    "Tokyo",
  );
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <RegionSelect country="US" disabled aria-label="State" />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations (closed)", async () => {
  const screen = await render(<RegionSelect country="US" aria-label="State" />);
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
