import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { DataList } from "./data-list";
import {
  DataListPager,
  pagerWindow,
  type DataListPagerProps,
} from "./data-list-pager";

function Pager(props: Partial<DataListPagerProps>) {
  return (
    <DataListPager
      page={1}
      pageSize={15}
      total={40}
      onPageChange={vi.fn()}
      onPageSizeChange={vi.fn()}
      {...props}
    />
  );
}

const range = (container: HTMLElement) =>
  container.querySelector('[data-slot="data-list-pager-range"]')?.textContent;

/** Drive the open listbox to `name` by keyboard, then commit it (see select.test.tsx). */
async function chooseOption(
  screen: Awaited<ReturnType<typeof render>>,
  name: string,
  max: number,
) {
  const option = screen.getByRole("option", { name });
  for (let press = 0; press < max; press += 1) {
    if (option.query()?.hasAttribute("data-highlighted")) break;
    await userEvent.keyboard("{ArrowDown}");
  }
  await expect.element(option).toHaveAttribute("data-highlighted", "");
  await userEvent.keyboard("{Enter}");
}

/* ------------------------------------------------------------------ rendering */

test("renders the range summary, the rows-per-page chooser and the page controls", async () => {
  const screen = await render(<Pager />);
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="data-list-pager"]',
  );
  expect(root).not.toBeNull();
  expect(range(screen.container)).toBe("1–15 of 40");
  await expect
    .element(screen.getByRole("combobox", { name: "Rows per page" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("navigation", { name: "pagination" }))
    .toHaveAttribute("data-slot", "data-list-pager-nav");
  for (const page of [1, 2, 3])
    await expect
      .element(screen.getByRole("button", { name: `Go to page ${page}` }))
      .toBeInTheDocument();
});

test("the range summary uses tabular numerals and follows the page", async () => {
  const screen = await render(<Pager page={3} />);
  expect(range(screen.container)).toBe("31–40 of 40");
  expect(
    screen.container
      .querySelector('[data-slot="data-list-pager-range"]')!
      .classList.contains("tabular-nums"),
  ).toBe(true);
});

test("an empty list reads 0 of 0 and offers no page controls", async () => {
  const screen = await render(<Pager total={0} />);
  expect(range(screen.container)).toBe("0 of 0");
  expect(
    screen.getByRole("navigation", { name: "pagination" }).query(),
  ).toBeNull();
});

test("an out-of-range page is clamped for display", async () => {
  const screen = await render(<Pager page={99} />);
  expect(range(screen.container)).toBe("31–40 of 40");
  await expect
    .element(screen.getByRole("button", { name: "Go to page 3" }))
    .toHaveAttribute("aria-current", "page");
});

test("className and native div props reach the root", async () => {
  const screen = await render(
    <Pager className="custom-pager" id="pager" aria-label="Paging" />,
  );
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="data-list-pager"]',
  )!;
  expect(root.classList.contains("custom-pager")).toBe(true);
  expect(root.id).toBe("pager");
});

/* ------------------------------------------------------------------ paging */

test("next, previous and a page number request the right page", async () => {
  const onPageChange = vi.fn();
  const screen = await render(<Pager page={2} onPageChange={onPageChange} />);
  await userEvent.click(
    screen.getByRole("button", { name: "Go to next page" }),
  );
  expect(onPageChange).toHaveBeenLastCalledWith(3);
  await userEvent.click(
    screen.getByRole("button", { name: "Go to previous page" }),
  );
  expect(onPageChange).toHaveBeenLastCalledWith(1);
  await userEvent.click(screen.getByRole("button", { name: "Go to page 3" }));
  expect(onPageChange).toHaveBeenLastCalledWith(3);
  expect(onPageChange).toHaveBeenCalledTimes(3);
});

test("the current page is marked and activating it requests nothing", async () => {
  const onPageChange = vi.fn();
  const screen = await render(<Pager page={2} onPageChange={onPageChange} />);
  const current = screen.getByRole("button", { name: "Go to page 2" });
  await expect.element(current).toHaveAttribute("aria-current", "page");
  await userEvent.click(current);
  expect(onPageChange).not.toHaveBeenCalled();
});

test("previous stays focusable but inert on the first page (aria-disabled, pointer events alive)", async () => {
  const onPageChange = vi.fn();
  const first = await render(<Pager page={1} onPageChange={onPageChange} />);
  const previous = first.getByRole("button", { name: "Go to previous page" });
  await expect.element(previous).toHaveAttribute("aria-disabled", "true");
  const el = previous.element() as HTMLElement;
  // The control itself keeps pointer events (Button's own `[&_svg]:pointer-events-none` only
  // reaches the icon), so a disabled end still shows its cursor and hover, and simply does nothing.
  expect(el.classList.contains("pointer-events-none")).toBe(false);
  el.focus();
  expect(document.activeElement).toBe(el);
  el.click();
  expect(onPageChange).not.toHaveBeenCalled();
  await expect
    .element(first.getByRole("button", { name: "Go to next page" }))
    .not.toHaveAttribute("aria-disabled");
});

test("next is inert on the last page", async () => {
  const onPageChange = vi.fn();
  const last = await render(<Pager page={3} onPageChange={onPageChange} />);
  const next = last.getByRole("button", { name: "Go to next page" });
  await expect.element(next).toHaveAttribute("aria-disabled", "true");
  (next.element() as HTMLElement).click();
  expect(onPageChange).not.toHaveBeenCalled();
});

test("Enter on a focused page control requests that page", async () => {
  const onPageChange = vi.fn();
  const screen = await render(<Pager onPageChange={onPageChange} />);
  (
    screen
      .getByRole("button", { name: "Go to page 2" })
      .element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{Enter}");
  expect(onPageChange).toHaveBeenLastCalledWith(2);
});

test("the page controls are hidden when everything fits on one page; the chooser stays", async () => {
  const screen = await render(<Pager total={10} />);
  expect(
    screen.getByRole("navigation", { name: "pagination" }).query(),
  ).toBeNull();
  expect(range(screen.container)).toBe("1–10 of 10");
  await expect
    .element(screen.getByRole("combobox", { name: "Rows per page" }))
    .toBeVisible();
});

test("a long run of pages collapses into a window with ellipses", async () => {
  const screen = await render(<Pager page={5} total={150} />);
  const labels = Array.from(
    screen.container.querySelectorAll('[data-slot="pagination-link"]'),
  )
    .map((a) => a.getAttribute("aria-label"))
    .filter((label) => label?.startsWith("Go to page"));
  expect(labels).toEqual([
    "Go to page 1",
    "Go to page 4",
    "Go to page 5",
    "Go to page 6",
    "Go to page 10",
  ]);
  expect(
    screen.container.querySelectorAll('[data-slot="pagination-ellipsis"]'),
  ).toHaveLength(2);
});

test("pagerWindow keeps first, last and the neighbours of the current page", () => {
  expect(pagerWindow(1, 1)).toEqual([1]);
  expect(pagerWindow(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  expect(pagerWindow(1, 10)).toEqual([1, 2, "ellipsis", 10]);
  expect(pagerWindow(5, 10)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
  expect(pagerWindow(10, 10)).toEqual([1, "ellipsis", 9, 10]);
  expect(pagerWindow(3, 10)).toEqual([1, 2, 3, 4, "ellipsis", 10]);
});

/* ------------------------------------------------------------------ page size */

test("choosing a page size reports it (default sizes 15 / 30 / 50)", async () => {
  const onPageSizeChange = vi.fn();
  const screen = await render(<Pager onPageSizeChange={onPageSizeChange} />);
  const trigger = screen.getByRole("combobox", { name: "Rows per page" });
  await userEvent.click(trigger);
  expect(
    Array.from(document.querySelectorAll('[role="option"]')).map(
      (option) => option.textContent,
    ),
  ).toEqual(["15", "30", "50"]);
  await chooseOption(screen, "50", 3);
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  expect(onPageSizeChange).toHaveBeenCalledWith(50);
});

test("custom pageSizes are offered, and a current size missing from them is added", async () => {
  const screen = await render(<Pager pageSize={20} pageSizes={[10, 25]} />);
  await userEvent.click(
    screen.getByRole("combobox", { name: "Rows per page" }),
  );
  expect(
    Array.from(document.querySelectorAll('[role="option"]')).map(
      (option) => option.textContent,
    ),
  ).toEqual(["10", "20", "25"]);
});

test("the chooser's accessible name is its visible label, and it can be renamed", async () => {
  const screen = await render(<Pager pageSizeLabel="Items per page" />);
  const trigger = screen.getByRole("combobox", { name: "Items per page" });
  await expect.element(trigger).toBeInTheDocument();
  const labelledBy = (trigger.element() as HTMLElement).getAttribute(
    "aria-labelledby",
  )!;
  expect(document.getElementById(labelledBy)?.textContent).toBe(
    "Items per page",
  );
  await expect
    .poll(
      () =>
        screen.container.querySelector('[data-slot="select-value"]')
          ?.textContent,
    )
    .toBe("15");
});

/* ------------------------------------------------------------------ announcements */

test("a page change announces the new range politely; the initial range is not announced", async () => {
  const screen = await render(<Pager page={1} />);
  const region = () =>
    screen.container.querySelector<HTMLElement>('[role="status"]');
  expect(region()).not.toBeNull();
  expect(region()!.textContent).toBe("");
  await screen.rerender(<Pager page={2} />);
  await expect.poll(() => region()!.textContent).toBe("Showing 16–30 of 40");
});

/* ------------------------------------------------------------------ composition */

test("slots into DataList's footer", async () => {
  const rows = Array.from({ length: 40 }, (_, index) => ({
    id: String(index + 1),
    name: `Row ${index + 1}`,
  }));
  function Host() {
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(15);
    return (
      <DataList
        aria-label="Rows"
        columns={[{ key: "name", header: "Name" }]}
        data={rows.slice((page - 1) * pageSize, page * pageSize)}
        getRowId={(row) => row.id}
        footer={
          <DataListPager
            page={page}
            pageSize={pageSize}
            total={rows.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        }
      />
    );
  }
  const screen = await render(<Host />);
  const footer = screen.container.querySelector(
    '[data-slot="data-list-footer"]',
  );
  expect(footer?.querySelector('[data-slot="data-list-pager"]')).not.toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Go to page 3" }));
  await expect
    .element(screen.getByRole("cell", { name: "Row 31" }))
    .toBeInTheDocument();
  expect(range(screen.container)).toBe("31–40 of 40");
  await expectNoA11yViolations(screen.container);
});

/* ------------------------------------------------------------------ axe */

test("no a11y violations — middle page", async () => {
  const screen = await render(<Pager page={2} />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — first page (previous aria-disabled)", async () => {
  const screen = await render(<Pager page={1} total={150} />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — single page (controls hidden)", async () => {
  const screen = await render(<Pager total={10} />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — empty", async () => {
  const screen = await render(<Pager total={0} />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — chooser open", async () => {
  const screen = await render(<Pager />);
  await userEvent.click(
    screen.getByRole("combobox", { name: "Rows per page" }),
  );
  await expect.element(screen.getByRole("listbox")).toBeInTheDocument();
  await expectNoA11yViolations(document.body);
});
