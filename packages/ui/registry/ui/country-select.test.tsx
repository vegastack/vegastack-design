import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import { CountrySelect, getCountryByCode, COUNTRIES } from "./country-select";

test("renders the trigger with a placeholder", async () => {
  const screen = await render(<CountrySelect placeholder="Pick a country" />);
  await expect.element(screen.getByText("Pick a country")).toBeInTheDocument();
});

test("shows the selected country name + flag", async () => {
  const screen = await render(<CountrySelect value="US" />);
  await expect.element(screen.getByText("United States")).toBeInTheDocument();
});

test("uses the supplied countries array when resolving the selected label", async () => {
  const countries = [{ code: "ZZ", name: "Zedland", flag: "🇿🇿" }];
  const screen = await render(
    <CountrySelect value="zz" countries={countries} />,
  );
  await expect.element(screen.getByText("Zedland")).toBeInTheDocument();
  expect(screen.container.textContent).not.toContain("Select country");
});

// DEVIATION: the trigger's accessible role changed from an implicit `<button>` ("button") to an
// explicit `role="combobox"` — Base UI's own ARIA pattern for a Select-style combobox trigger
// (input rendered inside the popup). This is the SAME role RegionSelect's trigger already used
// even before this refactor, so it's a consistency fix, not a regression.
test("opens and filters the list, selecting fires onValueChange with the ISO code", async () => {
  const onValueChange = vi.fn();
  const screen = await render(<CountrySelect onValueChange={onValueChange} />);
  await screen.getByRole("combobox").click();
  const input = screen.getByPlaceholder("Search countries…");
  await userEvent.fill(input.element() as HTMLInputElement, "Canada");
  await screen.getByText("Canada").click();
  expect(onValueChange).toHaveBeenCalledWith("CA");
});

// DEVIATION: see the role note above — `getByRole("button")` no longer matches the trigger.
test("disabled trigger does not open", async () => {
  const screen = await render(<CountrySelect disabled />);
  const btn = screen.getByRole("combobox");
  await expect.element(btn).toBeDisabled();
});

test("getCountryByCode is case-insensitive", () => {
  expect(getCountryByCode("us")?.name).toBe("United States");
  expect(getCountryByCode("GB")?.name).toBe("United Kingdom");
  expect(getCountryByCode(undefined)).toBeUndefined();
  expect(COUNTRIES.length).toBeGreaterThan(80);
});

test("ships the full ISO 3166-1 dataset (198 countries, unique codes)", () => {
  expect(COUNTRIES.length).toBe(198);
  // No duplicate ISO codes (would break React keys + Base UI Combobox filtering).
  const codes = new Set(COUNTRIES.map((c) => c.code));
  expect(codes.size).toBe(198);
  // Every entry has a 2-letter code, a non-empty name, and a flag emoji.
  for (const c of COUNTRIES) {
    expect(c.code).toMatch(/^[A-Z]{2}$/);
    expect(c.name.length).toBeGreaterThan(0);
    expect(c.flag.length).toBeGreaterThan(0);
  }
});

test("resolves countries that were previously missing from the compact list", () => {
  // These were absent from the prior 103-country dataset — a real billing/address regression.
  expect(getCountryByCode("RU")?.name).toBe("Russia");
  expect(getCountryByCode("SA")?.name).toBe("Saudi Arabia"); // already present, sanity
  expect(getCountryByCode("YE")?.name).toBe("Yemen");
  expect(getCountryByCode("UZ")?.name).toBe("Uzbekistan");
  expect(getCountryByCode("mc")?.name).toBe("Monaco"); // case-insensitive
  expect(getCountryByCode("VA")?.name).toBe("Vatican City");
  expect(getCountryByCode("VE")?.name).toBe("Venezuela");
});

test("derives a flag emoji from the ISO code for every country", () => {
  // Flags are the regional-indicator pair of the alpha-2 code: 2 codepoints in U+1F1E6..U+1F1FF.
  for (const c of COUNTRIES) {
    const cps = [...c.flag];
    expect(cps).toHaveLength(2);
    for (const cp of cps) {
      const point = cp.codePointAt(0)!;
      expect(point).toBeGreaterThanOrEqual(0x1f1e6);
      expect(point).toBeLessThanOrEqual(0x1f1ff);
    }
  }
});

test("no a11y violations — disabled", async () => {
  const screen = await render(<CountrySelect value="FR" disabled />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations (closed)", async () => {
  const screen = await render(<CountrySelect value="FR" />);
  await expectNoA11yViolations(screen.container);
});

// DEVIATION: see the role note above `getByRole("button")` -> `getByRole("combobox")`.
test("no a11y violations (open)", async () => {
  const screen = await render(<CountrySelect />);
  await screen.getByRole("combobox").click();
  // No suppression: no separator/status/loading rows are rendered inside the listbox here, so it
  // owns only valid group/option children and `aria-required-children` passes for real.
  await expectNoA11yViolations(document.body);
});

test("forwards ref to the trigger button (data-slot=country-select)", async () => {
  const ref = React.createRef<HTMLButtonElement>();
  await render(<CountrySelect ref={ref} />);
  expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  expect(ref.current?.dataset.slot).toBe("country-select");
});
