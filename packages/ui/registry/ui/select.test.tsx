import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

const FONTS = {
  sans: "Sans-serif",
  serif: "Serif",
  mono: "Monospace",
};

function Fixture({
  onValueChange,
  defaultValue,
}: {
  onValueChange?: (value: string | null) => void;
  defaultValue?: string;
}) {
  return (
    // `items` lets `SelectValue` render the selected item's label in the trigger
    // instead of its raw value.
    <Select
      items={FONTS}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
    >
      <SelectTrigger aria-label="Font">
        <SelectValue placeholder="Pick a font" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="sans">Sans-serif</SelectItem>
        <SelectItem value="serif">Serif</SelectItem>
        <SelectItem value="mono">Monospace</SelectItem>
      </SelectContent>
    </Select>
  );
}

test("renders the trigger with the placeholder and chevron", async () => {
  const screen = await render(<Fixture />);
  const trigger = screen.getByRole("combobox", { name: "Font" });
  await expect.element(trigger).toBeInTheDocument();
  await expect.element(trigger).toHaveAttribute("data-slot", "select-trigger");
  await expect.element(screen.getByText("Pick a font")).toBeInTheDocument();
});

test("default size attribute is reflected on the trigger", async () => {
  const screen = await render(<Fixture />);
  await expect
    .element(screen.getByRole("combobox", { name: "Font" }))
    .toHaveAttribute("data-size", "default");
});

test("opens the popup on trigger click and lists the options", async () => {
  const screen = await render(<Fixture />);
  await screen.getByRole("combobox", { name: "Font" }).click();
  await expect
    .element(screen.getByRole("option", { name: "Sans-serif" }))
    .toBeInTheDocument();
  // `exact` so "Serif" doesn't also match "Sans-serif".
  await expect
    .element(screen.getByRole("option", { name: "Serif", exact: true }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("option", { name: "Monospace" }))
    .toBeInTheDocument();
});

test("selecting an item updates the value and fires onValueChange", async () => {
  const onValueChange = vi.fn();
  const screen = await render(<Fixture onValueChange={onValueChange} />);
  await screen.getByRole("combobox", { name: "Font" }).click();
  await screen.getByRole("option", { name: "Serif", exact: true }).click();
  expect(onValueChange).toHaveBeenCalledWith("serif", expect.anything());
  // The trigger now reflects the selected label.
  await expect
    .element(screen.getByRole("combobox", { name: "Font" }))
    .toHaveTextContent("Serif");
});

test("renders an initial selection from defaultValue", async () => {
  const screen = await render(<Fixture defaultValue="mono" />);
  await expect
    .element(screen.getByRole("combobox", { name: "Font" }))
    .toHaveTextContent("Monospace");
});

test("a disabled item cannot be selected", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <Select onValueChange={onValueChange}>
      <SelectTrigger aria-label="Plan">
        <SelectValue placeholder="Choose a plan" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="free">Free</SelectItem>
        <SelectItem value="pro" disabled>
          Pro
        </SelectItem>
      </SelectContent>
    </Select>,
  );
  await screen.getByRole("combobox", { name: "Plan" }).click();
  const pro = screen.getByRole("option", { name: "Pro" });
  await expect.element(pro).toHaveAttribute("data-disabled");
  await expect.element(pro).toHaveAttribute("aria-disabled", "true");
  // The item has `pointer-events-none`; force the click to confirm it's inert.
  await pro.click({ force: true });
  expect(onValueChange).not.toHaveBeenCalled();
});

test("a disabled trigger does not open the popup", async () => {
  const screen = await render(
    <Select disabled>
      <SelectTrigger aria-label="Disabled">
        <SelectValue placeholder="Unavailable" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="a">A</SelectItem>
      </SelectContent>
    </Select>,
  );
  const trigger = screen.getByRole("combobox", { name: "Disabled" });
  await expect.element(trigger).toBeDisabled();
  await trigger.click({ force: true });
  expect(
    screen.container.ownerDocument.querySelector('[role="option"]'),
  ).toBeNull();
});

test("renders groups, labels, and separators", async () => {
  const screen = await render(
    <Select>
      <SelectTrigger aria-label="Timezone">
        <SelectValue placeholder="Select a timezone" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>North America</SelectLabel>
          <SelectItem value="est">Eastern</SelectItem>
          <SelectItem value="pst">Pacific</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Europe</SelectLabel>
          <SelectItem value="gmt">GMT</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>,
  );
  await screen.getByRole("combobox", { name: "Timezone" }).click();
  await expect.element(screen.getByText("North America")).toBeInTheDocument();
  await expect.element(screen.getByText("Europe")).toBeInTheDocument();
  const doc = screen.container.ownerDocument;
  expect(doc.querySelectorAll('[role="group"]').length).toBeGreaterThanOrEqual(
    2,
  );
  expect(doc.querySelector('[data-slot="select-separator"]')).not.toBeNull();
});

test("SelectContent renders a Base UI list and forwards list props", async () => {
  const screen = await render(
    <Select>
      <SelectTrigger aria-label="Fruit">
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        listProps={{ className: "custom-select-list" }}
      >
        <SelectItem value="apple">Apple</SelectItem>
      </SelectContent>
    </Select>,
  );
  await screen.getByRole("combobox", { name: "Fruit" }).click();
  await expect
    .element(screen.getByRole("option", { name: "Apple" }))
    .toBeInTheDocument();
  const list = screen.container.ownerDocument.querySelector(
    '[data-slot="select-list"]',
  );
  expect(list).not.toBeNull();
  expect(list).toHaveClass("custom-select-list");
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <Select disabled>
      <SelectTrigger aria-label="Disabled">
        <SelectValue placeholder="Unavailable" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="a">A</SelectItem>
      </SelectContent>
    </Select>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — invalid", async () => {
  const screen = await render(
    <Select>
      <SelectTrigger aria-label="Font" aria-invalid="true">
        <SelectValue placeholder="Pick a font" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="sans">Sans-serif</SelectItem>
      </SelectContent>
    </Select>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations with the popup open", async () => {
  const screen = await render(<Fixture />);
  await screen.getByRole("combobox", { name: "Font" }).click();
  // Wait for the listbox to be present in the portal before auditing.
  await expect
    .element(screen.getByRole("option", { name: "Sans-serif" }))
    .toBeInTheDocument();
  // Audit the whole document so the portalled popup is included.
  await expectNoA11yViolations(screen.container.ownerDocument.body);
});

test("SelectTrigger forwards ref to its host element", async () => {
  const ref = React.createRef<HTMLButtonElement>();
  await render(
    <Select>
      <SelectTrigger ref={ref} aria-label="Font">
        <SelectValue placeholder="Pick a font" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="sans">Sans-serif</SelectItem>
      </SelectContent>
    </Select>,
  );
  expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  expect(ref.current?.dataset.slot).toBe("select-trigger");
});
