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

test("containerClassName and containerProps reach the scroll container", async () => {
  const containerRef = React.createRef<HTMLDivElement>();
  await render(
    <Table
      containerClassName="test-viewport-cap"
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
  // Base classes survive, both class channels merge, and the ref is the
  // container itself — the attachment point for sticky headers/virtualizers.
  expect(container.className).toContain("overflow-x-auto");
  expect(container.className).toContain("test-viewport-cap");
  expect(container.className).toContain("overscroll-contain");
  expect(container.id).toBe("table-viewport");
  expect(containerRef.current).toBe(container);
});
