import * as React from "react";
import { render } from "vitest-browser-react";
// Real layout: the toolbar and its tools measure and size themselves from the compiled classes.
import geometryCss from "../../test/geometry.css?inline";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { SortMenu, sortSummary, type SortMenuValue } from "./sort-menu";

const sheet = document.createElement("style");
sheet.textContent = geometryCss;
document.head.append(sheet);

const FIELDS = [
  { key: "due", label: "Due date", type: "date" as const },
  { key: "title", label: "Title", type: "text" as const },
  { key: "qty", label: "Quantity", type: "number" as const },
];

function Harness({ onChange }: { onChange?: (v: SortMenuValue) => void }) {
  const [value, setValue] = React.useState<SortMenuValue>({
    key: "due",
    direction: "asc",
  });
  return (
    <SortMenu
      fields={FIELDS}
      value={value}
      defaultValue={{ key: "due", direction: "asc" }}
      onValueChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

test("two groups: the fields, then directions in the field's own words", async () => {
  const onChange = vi.fn();
  const screen = await render(<Harness onChange={onChange} />);
  await expect
    .element(screen.getByRole("radiogroup", { name: "Sort by" }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("radio", { name: "Oldest first" }))
    .toBeChecked();
  await screen.getByRole("radio", { name: "Title" }).click();
  expect(onChange).toHaveBeenLastCalledWith({ key: "title", direction: "asc" });
  await expect
    .element(screen.getByRole("radio", { name: "Z → A" }))
    .toBeVisible();
  await expectNoA11yViolations(screen.container);
});

test("Reset shows only away from the default, and restores it", async () => {
  const onChange = vi.fn();
  const screen = await render(<Harness onChange={onChange} />);
  expect(document.querySelector('[data-slot="sort-menu-reset"]')).toBeNull();
  await screen.getByRole("radio", { name: "Newest first" }).click();
  await screen.getByRole("button", { name: "Reset" }).click();
  expect(onChange).toHaveBeenLastCalledWith({ key: "due", direction: "asc" });
});

test("no handles, selects or Add sort; rows are 32px", async () => {
  await render(<Harness />);
  expect(
    document.querySelector('[data-slot="sortable-list-handle"]'),
  ).toBeNull();
  expect(document.querySelector('[role="combobox"]')).toBeNull();
  const option = document.querySelector<HTMLElement>(
    '[data-slot="sort-menu-option"]',
  )!;
  expect(option.getBoundingClientRect().height).toBe(32);
});

test("sortSummary words the order", () => {
  expect(sortSummary(FIELDS, { key: "due", direction: "asc" })).toBe(
    "Due date, oldest first",
  );
  expect(sortSummary(FIELDS, { key: "qty", direction: "desc" })).toBe(
    "Quantity, high → low",
  );
});
