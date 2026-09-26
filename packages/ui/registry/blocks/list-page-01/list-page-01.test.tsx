/**
 * `list-page-01.test.tsx` — the block's browser contract: one `h1`; the grid and the list show the
 * same records and the view switch never empties; Load more appends; each empty tier shows its
 * copy; axe-clean in each view and tier. Compiled contrast is in `test/contrast.browser.test.tsx`.
 */

import { render } from "vitest-browser-react";
import { beforeEach, expect, test } from "vitest";

import { expectNoA11yViolations } from "../../../test/a11y";
import { CustomerList } from "./components/customer-list";
import { CUSTOMERS } from "./components/sample-customers";
import ListPage01 from "./page";

// The list remembers its view for the session; start every test on the default view.
beforeEach(() => sessionStorage.clear());

const names = (selector: string) =>
  [...document.querySelectorAll(selector)].map(
    (el) =>
      el.querySelector('[data-slot="item-title"], .font-medium')?.textContent,
  );

test("grid and list show the same records, and the view switch never empties", async () => {
  const screen = await render(<ListPage01 />);
  expect(document.querySelectorAll("h1")).toHaveLength(1);
  await expect.element(screen.getByText("Skyline Hotels")).toBeInTheDocument();
  const listNames = names("tbody a");
  expect(listNames).toHaveLength(8);
  await expectNoA11yViolations(document.body, ["color-contrast"]);

  const grid = screen.getByRole("tab", { name: "Grid", exact: true });
  // The view switch ends the toolbar's first row, not the page header.
  expect(
    grid.element().closest('[data-slot="filter-bar-view"]'),
  ).not.toBeNull();
  await grid.click();
  const gridNames = names('a[data-slot="media-card-link"]');
  expect(new Set(gridNames)).toEqual(new Set(listNames));
  await grid.click();
  await expect.element(grid).toHaveAttribute("aria-selected", "true");
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("Load more appends the next page", async () => {
  const screen = await render(<ListPage01 />);
  await screen.getByRole("button", { name: "Load more" }).click();
  await expect.poll(() => document.querySelectorAll("tbody a").length).toBe(16);
});

test("each empty tier shows its copy", async () => {
  const screen = await render(<ListPage01 />);
  await screen.getByRole("searchbox", { name: "Search customers" }).fill("zzz");
  await expect.element(screen.getByText("No matches")).toBeInTheDocument();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
  await screen.getByRole("button", { name: "Clear filters" }).first().click();
  await expect.element(screen.getByText("Skyline Hotels")).toBeInTheDocument();
  await expect
    .element(screen.getByRole("searchbox", { name: "Search customers" }))
    .toHaveFocus();
  await screen.unmount();

  const empty = await render(<CustomerList customers={[]} />);
  await expect
    .element(empty.getByRole("heading", { name: "No customers yet" }))
    .toBeInTheDocument();
  await expect
    .element(empty.getByRole("link", { name: "New customer" }))
    .toHaveAttribute("href", "/customers/new");
  await empty.unmount();

  const failed = await render(
    <CustomerList
      customers={CUSTOMERS}
      error="Check your connection, then try again."
      onRetry={() => {}}
    />,
  );
  await expect
    .element(failed.getByRole("heading", { name: "Couldn’t load customers" }))
    .toBeInTheDocument();
  await expect
    .element(failed.getByRole("button", { name: "Try again" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});
