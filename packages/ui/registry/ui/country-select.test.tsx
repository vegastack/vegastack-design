import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import { CountrySelect } from "./country-select";

/* The dataset assertions (COUNTRIES, getCountryByCode, flags) moved to
   registry/lib/geo-data.test.ts with the data itself (audit B8-02 / D27). */

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

// DEVIATION: the trigger's accessible role is `combobox`, not `button` — Base UI's own ARIA
// pattern for a Select-style combobox trigger (the input lives inside the popup).
test("opens and filters the list, selecting fires onValueChange with the ISO code", async () => {
  const onValueChange = vi.fn();
  const screen = await render(<CountrySelect onValueChange={onValueChange} />);
  (screen.getByRole("combobox").element() as HTMLButtonElement).click();
  const input = screen.getByPlaceholder("Search countries…");
  await expect.element(input).toBeInTheDocument();
  await userEvent.fill(input.element() as HTMLInputElement, "Canada");
  await screen.getByText("Canada").click();
  expect(onValueChange).toHaveBeenCalledWith("CA");
});

test("disabled trigger does not open", async () => {
  const screen = await render(<CountrySelect disabled />);
  await expect.element(screen.getByRole("combobox")).toBeDisabled();
});

test("no clear control unless `clearable` is set", async () => {
  const screen = await render(<CountrySelect value="FR" />);
  expect(
    screen.container.querySelector('[data-slot="country-select-clear"]'),
  ).toBeNull();
});

test("the clear control reports an empty code", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <CountrySelect value="FR" clearable onValueChange={onValueChange} />,
  );
  await screen.getByRole("button", { name: "Clear country" }).click();
  expect(onValueChange).toHaveBeenCalledWith("");
});

test("no a11y violations — disabled", async () => {
  const screen = await render(<CountrySelect value="FR" disabled />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations (closed)", async () => {
  const screen = await render(<CountrySelect value="FR" />);
  await expectNoA11yViolations(screen.container);
});

// The clear control is a SIBLING of the trigger, never a child: a nested interactive control
// would fail axe's `nested-interactive` rule.
test("no a11y violations — clearable with a value", async () => {
  const screen = await render(<CountrySelect value="FR" clearable />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations (open)", async () => {
  const screen = await render(<CountrySelect />);
  (screen.getByRole("combobox").element() as HTMLButtonElement).click();
  await expect
    .element(screen.getByPlaceholder("Search countries…"))
    .toBeInTheDocument();
  // No suppression: no separator/status/loading rows are rendered inside the listbox here, so it
  // owns only valid group/option children and `aria-required-children` passes for real.
  await expectNoA11yViolations(document.body);
});

test("forwards ref to the trigger button (data-slot=country-select-trigger)", async () => {
  const ref = React.createRef<HTMLButtonElement>();
  await render(<CountrySelect ref={ref} />);
  expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  expect(ref.current?.dataset.slot).toBe("country-select-trigger");
});
