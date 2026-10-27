import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Button } from "./button";
import { FieldTypePicker } from "./field-type-picker";

const TYPES = [
  { id: "text", label: "Text", icon: <span>T</span> },
  {
    id: "number",
    label: "Number",
    icon: <span>#</span>,
    keywords: ["integer", "currency"],
  },
  {
    id: "relation",
    label: "Link to table",
    icon: <span>↗</span>,
    group: "Relations",
  },
  {
    id: "formula",
    label: "Formula",
    icon: <span>ƒ</span>,
    group: "Advanced",
    disabledReason: "Coming soon",
  },
];

test("lists the types in their groups and picks one", async () => {
  const onSelect = vi.fn();
  const screen = await render(
    <FieldTypePicker types={TYPES} onSelect={onSelect} value="text" />,
  );
  await expect.element(screen.getByText("Relations")).toBeVisible();
  await userEvent.click(screen.getByRole("option", { name: /Link to table/ }));
  expect(onSelect).toHaveBeenCalledWith("relation");
  await expectNoA11yViolations(screen.container);
});

test("search matches keywords; a type with a reason can't be chosen", async () => {
  const onSelect = vi.fn();
  const screen = await render(
    <FieldTypePicker types={TYPES} onSelect={onSelect} />,
  );
  await userEvent.type(screen.getByRole("combobox"), "currency");
  await expect
    .element(screen.getByRole("option", { name: /Number/ }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("option", { name: /^Text/ }))
    .not.toBeInTheDocument();
  await userEvent.clear(screen.getByRole("combobox"));
  const formula = screen.getByRole("option", { name: /Formula/ });
  await expect
    .poll(() => formula.element().textContent)
    .toContain("Coming soon");
  await userEvent.click(formula, { force: true });
  expect(onSelect).not.toHaveBeenCalled();
});

test("the current type is read as current; a type with next opens its step and Back returns", async () => {
  const onSelect = vi.fn();
  const screen = await render(
    <FieldTypePicker
      types={[
        ...TYPES,
        { id: "link", label: "Link to", icon: <span>↗</span>, next: true },
      ]}
      value="number"
      onSelect={onSelect}
      renderStep={(type, { back, setTitle }) => (
        <div>
          <input type="hidden" name="kind" />
          <button type="button" disabled>
            Unavailable
          </button>
          <Button disabled>Also unavailable</Button>
          <button type="button" style={{ visibility: "hidden" }}>
            Invisible
          </button>
          <p>Step for {type.id}</p>
          <button type="button" onClick={() => setTitle("Which table?")}>
            Retitle
          </button>
          <button type="button" onClick={back}>
            Leave
          </button>
        </div>
      )}
    />,
  );
  await expect
    .element(screen.getByRole("option", { name: /Number.*current/ }))
    .toBeVisible();
  await userEvent.click(
    screen.getByRole("option", { name: "Link to", exact: true }),
  );
  expect(onSelect).not.toHaveBeenCalled();
  await expect.element(screen.getByText("Step for link")).toBeVisible();
  // Focus moved into the step's first control.
  await expect.poll(() => document.activeElement?.textContent).toBe("Retitle");
  await userEvent.click(screen.getByRole("button", { name: "Retitle" }));
  await expect
    .poll(
      () =>
        document.querySelector('[data-slot="field-type-picker-step-header"]')
          ?.textContent,
    )
    .toContain("Which table?");
  await userEvent.click(screen.getByRole("button", { name: "Back" }));
  await expect
    .poll(() => document.activeElement?.getAttribute("role"))
    .toBe("combobox");
  await expect
    .element(screen.getByRole("option", { name: "Link to", exact: true }))
    .toBeVisible();
});

test("a step with nothing focusable sends focus to Back", async () => {
  const screen = await render(
    <FieldTypePicker
      types={[
        { id: "link", label: "Link to", icon: <span>↗</span>, next: true },
      ]}
      onSelect={() => {}}
      renderStep={() => <Button disabled>Nothing yet</Button>}
    />,
  );
  await userEvent.click(
    screen.getByRole("option", { name: "Link to", exact: true }),
  );
  await expect
    .poll(() => document.activeElement?.getAttribute("aria-label"))
    .toBe("Back");
});
