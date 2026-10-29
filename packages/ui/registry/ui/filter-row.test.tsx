import * as React from "react";
import { render } from "vitest-browser-react";
// Real layout: the toolbar and its tools measure and size themselves from the compiled classes.
import geometryCss from "../../test/geometry.css?inline";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { FilterRow, type FilterRowChip } from "./filter-row";
import { FilterChip } from "./filter-bar";
import { ListToolbar } from "./list-toolbar";

const sheet = document.createElement("style");
sheet.textContent = geometryCss;
document.head.append(sheet);

test("fixed order: + Filter, facets, chips, then Clear; AI chips carry ✦", async () => {
  const onClear = vi.fn();
  const chips: FilterRowChip[] = [
    { id: "status", label: "Status", value: "Open", onRemove: () => {} },
    {
      id: "priority",
      label: "Priority",
      value: "High",
      source: "ai",
      onRemove: () => {},
    },
  ];
  const screen = await render(
    <FilterRow
      addFilter={<button type="button">Add</button>}
      facets={<FilterChip unset label="Due" editor={<div>pick</div>} />}
      chips={chips}
      onClear={onClear}
    />,
  );
  const order = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-slot="filter-row-add"], [data-slot="filter-chip"], [data-slot="filter-row-clear"]',
    ),
  ).map(
    (node) =>
      node.getAttribute("data-slot") +
      (node.getAttribute("data-state") === "unset" ? ":unset" : ""),
  );
  expect(order).toEqual([
    "filter-row-add",
    "filter-chip:unset",
    "filter-chip",
    "filter-chip",
    "filter-row-clear",
  ]);
  await expect
    .element(screen.getByLabelText("Added by AI"))
    .toBeInTheDocument();
  await screen.getByRole("button", { name: "Clear", exact: true }).click();
  expect(onClear).toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);
});

test("the AI note: count, Undo, unmatched words", async () => {
  const onUndo = vi.fn();
  const screen = await render(
    <FilterRow
      chips={[]}
      aiNote={{ count: 2, unmatched: ["warehouse"], onUndo }}
    />,
  );
  await expect.element(screen.getByText("2 filters added by AI")).toBeVisible();
  await expect
    .element(screen.getByText("Couldn't match “warehouse”"))
    .toBeVisible();
  await screen.getByRole("button", { name: "Undo" }).click();
  expect(onUndo).toHaveBeenCalled();
});

test("tells the toolbar's Filter tool how many are applied", async () => {
  const screen = await render(
    <ListToolbar
      filterRow={
        <FilterRow
          chips={[
            { id: "a", label: "A", value: "1", onRemove: () => {} },
            { id: "b", label: "B", value: "2", onRemove: () => {} },
          ]}
        />
      }
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Filter, 2 active" }))
    .toBeInTheDocument();
});
