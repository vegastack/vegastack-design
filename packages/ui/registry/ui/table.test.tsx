import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "./table";

test("renders headers, rows, and cells", async () => {
  const screen = await render(
    <Table>
      <TableCaption>Team roster</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Ada</TableCell>
          <TableCell>Engineer</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Grace</TableCell>
          <TableCell>Designer</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  await expect.element(screen.getByText("Name")).toBeInTheDocument();
  await expect.element(screen.getByText("Role")).toBeInTheDocument();
  await expect.element(screen.getByText("Ada")).toBeInTheDocument();
  await expect.element(screen.getByText("Engineer")).toBeInTheDocument();
  await expect.element(screen.getByText("Grace")).toBeInTheDocument();
  await expect.element(screen.getByText("Team roster")).toBeInTheDocument();
});

test("wraps the table in an overflow container and sets data-slots", async () => {
  const screen = await render(
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Col</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Value</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
        </TableRow>
      </TableFooter>
    </Table>,
  );
  const { container } = screen;
  expect(
    container.querySelector('[data-slot="table-container"]'),
  ).not.toBeNull();
  expect(container.querySelector('[data-slot="table"]')).not.toBeNull();
  expect(container.querySelector('[data-slot="table-header"]')).not.toBeNull();
  expect(container.querySelector('[data-slot="table-body"]')).not.toBeNull();
  expect(container.querySelector('[data-slot="table-footer"]')).not.toBeNull();
  expect(container.querySelector('[data-slot="table-row"]')).not.toBeNull();
  expect(container.querySelector('[data-slot="table-head"]')).not.toBeNull();
  expect(container.querySelector('[data-slot="table-cell"]')).not.toBeNull();
});

test("a selected row carries data-selected", async () => {
  const screen = await render(
    <Table>
      <TableBody>
        <TableRow data-selected="">
          <TableCell>Selected</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  const cell = screen.getByText("Selected");
  await expect.element(cell).toBeInTheDocument();
  expect(
    screen.container
      .querySelector('[data-slot="table-row"]')
      ?.hasAttribute("data-selected"),
  ).toBe(true);
});

test("forwards ref to the underlying table element", async () => {
  const ref = React.createRef<HTMLTableElement>();
  await render(
    <Table ref={ref}>
      <TableBody>
        <TableRow>
          <TableCell>Ref</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  expect(ref.current).toBeInstanceOf(HTMLTableElement);
  expect(ref.current?.dataset.slot).toBe("table");
});

test("no a11y violations", async () => {
  const screen = await render(
    <Table>
      <TableCaption>Recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Invoice</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>INV001</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell>$250.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>INV002</TableCell>
          <TableCell>Pending</TableCell>
          <TableCell>$150.00</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell />
          <TableCell>$400.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — selected row", async () => {
  const screen = await render(
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow data-selected="">
          <TableCell>Selected</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  await expectNoA11yViolations(screen.container);
});

test("grid + headerTone=ink + density=compact flow to head and cells via group data flags", async () => {
  const screen = await render(
    <Table grid headerTone="ink" density="compact">
      <TableHeader>
        <TableRow>
          <TableHead>Company</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Globex</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  const table = document.querySelector('[data-slot="table"]') as HTMLElement;
  expect(table.dataset.grid).toBe("");
  expect(table.dataset.headerTone).toBe("ink");
  expect(table.dataset.density).toBe("compact");
  const head = document.querySelector(
    '[data-slot="table-head"]',
  ) as HTMLElement;
  expect(head.className).toContain(
    "group-data-[header-tone=ink]/table:text-label",
  );
  const cell = document.querySelector(
    '[data-slot="table-cell"]',
  ) as HTMLElement;
  expect(cell.className).toContain("group-data-[density=compact]/table:py-1");
  expect(cell.className).toContain("group-data-[grid]/table:border-e");
});

test("containerProps reach the scroll container", async () => {
  const containerRef = React.createRef<HTMLDivElement>();
  await render(
    <Table
      containerProps={{
        ref: containerRef,
        className: "overscroll-contain",
        id: "table-viewport",
      }}
    >
      <TableBody>
        <TableRow>
          <TableCell>Value</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  const container = document.querySelector(
    '[data-slot="table-container"]',
  ) as HTMLElement;
  expect(container).not.toBeNull();
  // Base classes survive, the consumer class merges, and the ref is the
  // container itself — the attachment point for sticky headers/virtualizers.
  expect(container.className).toContain("overflow-x-auto");
  expect(container.className).toContain("overscroll-contain");
  expect(container.id).toBe("table-viewport");
  expect(containerRef.current).toBe(container);
});

/* ---------------------------------------------------------------------------------------------
 * Cells must never clip their overflow.
 *
 * `data-list.test.tsx` proves the sm checkbox keeps an effective >=24x24 hit area (WCAG 2.5.8)
 * inside a real TableHead/TableCell. That fix depends on the checkbox's `before:-inset-1.5`
 * pseudo-element being able to paint OUTSIDE the cell's border box — which holds only because
 * these cells set no `overflow-hidden`.
 *
 * That dependency was documented in prose and completely unguarded: the style mirror over there
 * sets no `overflow`, and its `elementFromPoint` probe samples inside the cell's own padding, so
 * adding `overflow-hidden` here — the obvious move for truncating long CRM text — would silently
 * break a WCAG fix with every existing test still green.
 *
 * This is the guard. Truncate with `min-w-0` on the cell and `truncate` on an inner span instead.
 * ------------------------------------------------------------------------------------------- */
test("head and body cells never clip overflow — the checkbox hit-area expansion depends on it", async () => {
  const screen = await render(
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Ada</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );

  for (const slot of ["table-head", "table-cell"]) {
    const el = document.querySelector(`[data-slot="${slot}"]`) as HTMLElement;
    expect(el).not.toBeNull();
    // Class-level assertion: this harness compiles no Tailwind, so the utility name is the
    // only honest signal. Catches `overflow-hidden`, `overflow-clip`, and the axis variants.
    expect(el.className).not.toMatch(
      /(^|\s)overflow-(hidden|clip|x-hidden|y-hidden)(\s|$)/,
    );
  }
  expect(screen).toBeDefined();
});

/* ---------------------------------------------------------------------------------------------
 * The scroll region (B5-01 / TD-4) and the wrapping default (D18).
 * ------------------------------------------------------------------------------------------- */

const WIDE_ROW = (
  <TableRow>
    {Array.from({ length: 12 }, (_, index) => (
      <TableCell key={index} style={{ minWidth: "200px" }}>
        Column {index}
      </TableCell>
    ))}
  </TableRow>
);

test("the scroll container adds NO tab stop when the table fits", async () => {
  await render(
    <div style={{ width: "800px" }}>
      <Table aria-label="Narrow">
        <TableBody>
          <TableRow>
            <TableCell>Ada</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>,
  );
  const narrow = document.querySelector(
    '[data-slot="table-container"]',
  ) as HTMLElement;
  expect(narrow.hasAttribute("tabindex")).toBe(false);
  expect(narrow.dataset.scrollable).toBeUndefined();
});

test("a scrollable table container is keyboard-reachable, named, and inset-ringed", async () => {
  await render(
    <div style={{ width: "300px" }}>
      <Table aria-label="Wide ledger">
        <TableBody>{WIDE_ROW}</TableBody>
      </Table>
    </div>,
  );
  const wide = document.querySelector(
    '[data-slot="table-container"]',
  ) as HTMLElement;
  // Scrollable → reachable by keyboard (axe `scrollable-region-focusable`), named,
  // and with the outline pulled inside so the viewport cannot clip it.
  await expect.poll(() => wide.getAttribute("tabindex")).toBe("0");
  expect(wide.dataset.scrollable).toBe("");
  expect(wide.getAttribute("role")).toBe("region");
  expect(wide.getAttribute("aria-label")).toBe("Wide ledger");
  expect(wide.className).toContain("focus-visible:-outline-offset-2");
});

test("scrollLabel overrides the table's own aria-label for the region", async () => {
  await render(
    <Table aria-label="Deals" scrollLabel="Deals table, scrollable">
      <TableBody>
        <TableRow>
          <TableCell>Ada</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  const container = document.querySelector(
    '[data-slot="table-container"]',
  ) as HTMLElement;
  expect(container.getAttribute("aria-label")).toBe("Deals table, scrollable");
});

test("an unnamed viewport is NOT published as a landmark", async () => {
  // An unnamed `role="region"` is worse than none: a page with several tables
  // would publish several indistinguishable landmarks (the B5-08 class of bug).
  await render(
    <Table>
      <TableBody>
        <TableRow>
          <TableCell>Ada</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  const container = document.querySelector(
    '[data-slot="table-container"]',
  ) as HTMLElement;
  expect(container.getAttribute("role")).toBeNull();
});

test("body cells wrap by default and keep a minimum column width", async () => {
  await render(
    <Table>
      <TableBody>
        <TableRow>
          <TableCell>A very long value indeed</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  const cell = document.querySelector(
    '[data-slot="table-cell"]',
  ) as HTMLElement;
  // D18: wrap by default, with a floor so one long value cannot squeeze its
  // siblings to a single character.
  expect(cell.className).toContain("wrap-anywhere");
  expect(cell.className).not.toMatch(/(^|\s)whitespace-nowrap(\s|$)/);
  expect(cell.className).toContain("min-w-(--table-cell-min-width)");
  const table = document.querySelector('[data-slot="table"]') as HTMLElement;
  expect(table.className).toContain("[--table-cell-min-width:");
});

test("a caller opts one column back out of wrapping", async () => {
  await render(
    <Table>
      <TableBody>
        <TableRow>
          <TableCell className="whitespace-nowrap">2026-09-07T00:00Z</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  const cell = document.querySelector(
    '[data-slot="table-cell"]',
  ) as HTMLElement;
  expect(cell.className).toContain("whitespace-nowrap");
});

test("header rows do not take the row hover tint", async () => {
  // Hovering a header should do nothing — it is not a row you can act on
  // (B5-10). `TableRow` carries the hover recipe for every row it renders.
  await render(
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
        </TableRow>
      </TableHeader>
    </Table>,
  );
  const header = document.querySelector(
    '[data-slot="table-header"]',
  ) as HTMLElement;
  expect(header.className).toContain("[&_tr]:hover:bg-transparent");
  expect(header.className).toContain("[&_tr]:active:bg-transparent");
});

test("a scrollable region has no accessibility violations", async () => {
  const screen = await render(
    <div style={{ width: "300px" }}>
      <Table aria-label="Wide ledger">
        <TableBody>{WIDE_ROW}</TableBody>
      </Table>
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});
