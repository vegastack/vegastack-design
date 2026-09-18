import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { Button } from "./button";
import { DirectionProvider } from "./direction";

const slot = (root: Element, name: string) =>
  root.querySelector(`[data-slot="${name}"]`) as HTMLElement | null;

/**
 * Index a collection and prove the element is there. The package runs with
 * `noUncheckedIndexedAccess`, so `list[i]` is `T | undefined`; this narrows it by ASSERTING the
 * element exists rather than by asserting it away, so a missing element fails the test it is in.
 */
function at<T extends Element>(list: ArrayLike<T>, index: number): T {
  const element = list[index];
  expect(element, `element at index ${index} must be present`).toBeDefined();
  return element as T;
}

const invoices = [
  { invoice: "INV001", paymentStatus: "Paid", totalAmount: "$250.00" },
  { invoice: "INV002", paymentStatus: "Pending", totalAmount: "$150.00" },
  { invoice: "INV003", paymentStatus: "Unpaid", totalAmount: "$350.00" },
];

function Subject({ children }: { children?: React.ReactNode }) {
  return (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((row) => (
          <TableRow key={row.invoice}>
            <TableCell className="font-medium">{row.invoice}</TableCell>
            <TableCell>{row.paymentStatus}</TableCell>
            <TableCell className="text-right">{row.totalAmount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      {children}
    </Table>
  );
}

test("renders real table markup, and every exported part carries its data-slot (Usage)", async () => {
  const screen = await render(
    <Subject>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell className="text-right">$750.00</TableCell>
        </TableRow>
      </TableFooter>
    </Subject>,
  );
  const expected: [string, string][] = [
    ["table-container", "DIV"],
    ["table", "TABLE"],
    ["table-caption", "CAPTION"],
    ["table-header", "THEAD"],
    ["table-body", "TBODY"],
    ["table-footer", "TFOOT"],
    ["table-row", "TR"],
    ["table-head", "TH"],
    ["table-cell", "TD"],
  ];
  for (const [name, tag] of expected) {
    const element = slot(screen.container, name);
    expect(element, name).not.toBeNull();
    expect(element!.tagName, name).toBe(tag);
  }
});

test("Table wraps itself in its own overflow container (Usage)", async () => {
  const screen = await render(<Subject />);
  const container = slot(screen.container, "table-container")!;
  const table = slot(screen.container, "table")!;
  // The container is the component's own element, not something the call site supplied.
  expect(container).toBe(screen.container.firstElementChild);
  expect(table.parentElement).toBe(container);
  expect(container.className).toContain("overflow-x-auto");
  expect(container.className).toContain("relative");
  expect(container.className).toContain("w-full");
});

test("the browser exposes the grid semantics with no ARIA at all (Composition)", async () => {
  const screen = await render(<Subject />);
  const table = slot(screen.container, "table") as HTMLTableElement;
  expect(table.rows).toHaveLength(4); // one header row + three body rows
  expect(at(table.tHead!.rows, 0).cells).toHaveLength(3);
  expect(table.caption!.textContent).toBe("A list of your recent invoices.");
  expect(at(table.tBodies, 0).rows).toHaveLength(3);
});

test("TableCaption is the table's accessible name (Composition)", async () => {
  const screen = await render(<Subject />);
  await expect
    .element(
      screen.getByRole("table", { name: "A list of your recent invoices." }),
    )
    .toBeInTheDocument();
});

test("TableFooter renders a tfoot and tints itself as a summary (Footer)", async () => {
  const screen = await render(
    <Subject>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell className="text-right">$750.00</TableCell>
        </TableRow>
      </TableFooter>
    </Subject>,
  );
  const footer = slot(screen.container, "table-footer")!;
  expect(footer.tagName).toBe("TFOOT");
  expect(footer.className).toContain("bg-muted/50");
  expect(footer.className).toContain("font-medium");
  expect(footer.className).toContain("border-t");
  const table = slot(screen.container, "table") as HTMLTableElement;
  expect(table.tFoot).toBe(footer);
  expect(at(at(table.tFoot!.rows, 0).cells, 0).colSpan).toBe(2);
});

test("a per-row action button stays reachable and named (Actions)", async () => {
  const opened: string[] = [];
  const screen = await render(
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {["Wireless Mouse", "USB-C Hub"].map((product) => (
          <TableRow key={product}>
            <TableCell className="font-medium">{product}</TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => opened.push(product)}
              >
                <span className="sr-only">{`Open menu for ${product}`}</span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>,
  );
  await screen.getByRole("button", { name: "Open menu for USB-C Hub" }).click();
  expect(opened).toEqual(["USB-C Hub"]);
});

test("a sortable head announces its direction through aria-sort (Data Table)", async () => {
  function Sortable() {
    const [desc, setDesc] = React.useState(false);
    const rows = desc ? [...invoices].reverse() : invoices;
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead aria-sort={desc ? "descending" : "ascending"}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDesc((value) => !value)}
              >
                Invoice
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.invoice}>
              <TableCell>{row.invoice}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
  const screen = await render(<Sortable />);
  const head = slot(screen.container, "table-head")!;
  expect(head.getAttribute("aria-sort")).toBe("ascending");
  const first = () =>
    screen.container.querySelector('[data-slot="table-cell"]')!.textContent;
  expect(first()).toBe("INV001");
  await screen.getByRole("button", { name: "Invoice" }).click();
  await expect.poll(() => head.getAttribute("aria-sort")).toBe("descending");
  expect(first()).toBe("INV003");
});

test("a selected row is marked by data attribute, not by colour alone (Data Table)", async () => {
  const screen = await render(
    <Table>
      <TableBody>
        <TableRow data-state="selected">
          <TableCell>INV001</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>INV002</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  const rows = screen.container.querySelectorAll('[data-slot="table-row"]');
  const selected = at(rows, 0);
  expect(selected.getAttribute("data-state")).toBe("selected");
  expect(at(rows, 1).getAttribute("data-state")).toBeNull();
  // COL-8 resolves as shadcn: the selected fill is `bg-muted`, not a pressed rung.
  expect(selected.className).toContain("data-[state=selected]:bg-muted");
  expect(selected.className).toContain("hover:bg-muted/50");
});

test("RTL: the head and the cells align on the logical axis (RTL)", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <Table>
          <TableCaption>قائمة بفواتيرك الأخيرة.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>الفاتورة</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>INV001</TableCell>
              <TableCell>مدفوع</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </DirectionProvider>,
  );
  const head = slot(screen.container, "table-head")!;
  // `text-start`, not `text-left`: the header follows the reading direction.
  expect(head.className).toContain("text-start");
  expect(getComputedStyle(head).direction).toBe("rtl");
  // `textAlign` is not asserted here: this lane compiles no Tailwind, so `text-start` resolves to
  // nothing and a bare `<th>` still reports the user agent's `center`. What is real at this level
  // is that the class is the logical one and the subtree's direction is rtl.
  // The checkbox padding rule is logical too, so it does not need an RTL override.
  expect(head.className).toContain("[&:has([role=checkbox])]:pe-0");
});

test("LAY-6/COL-6/COL-8 resolve as shadcn: cells do not wrap and the head keeps upstream's chrome", async () => {
  const screen = await render(<Subject />);
  const head = slot(screen.container, "table-head")!;
  const cell = slot(screen.container, "table-cell")!;
  const row = slot(screen.container, "table-row")!;
  expect(head.className).toContain("h-10");
  expect(head.className).toContain("font-medium");
  expect(head.className).toContain("text-foreground");
  expect(head.className).toContain("whitespace-nowrap");
  expect(cell.className).toContain("whitespace-nowrap");
  expect(row.className).toContain("hover:bg-muted/50");
  expect(row.className).toContain("data-[state=selected]:bg-muted");
  // No wrap variable, and no scroll-region chrome of our own: the container is upstream's.
  expect(screen.container.innerHTML).not.toContain("--table-cell-min-width");
  expect(
    screen.container.querySelector("[data-slot='table-scroll-region']"),
  ).toBeNull();
});

test("DOC-1/DOC-2: no styling hunk — no focus glow and no focus suppressor anywhere", async () => {
  const screen = await render(
    <Subject>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
        </TableRow>
      </TableFooter>
    </Subject>,
  );
  for (const element of screen.container.querySelectorAll<HTMLElement>("*")) {
    const classes =
      typeof element.className === "string" ? element.className : "";
    expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d/);
    expect(classes).not.toContain("focus-visible:ring-");
    expect(classes).not.toContain("outline-none");
    expect(classes).not.toContain("outline-hidden");
  }
});

test("no a11y violations — rest", async () => {
  const screen = await render(<Subject />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — with a footer", async () => {
  const screen = await render(
    <Subject>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell className="text-right">$750.00</TableCell>
        </TableRow>
      </TableFooter>
    </Subject>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — row actions", async () => {
  const screen = await render(
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Wireless Mouse</TableCell>
          <TableCell className="text-right">
            <Button variant="ghost" size="icon">
              <span className="sr-only">Open menu</span>
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — sorted and selected", async () => {
  const screen = await render(
    <Table>
      <TableCaption>Invoices</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead aria-sort="ascending">
            <Button variant="ghost" size="sm">
              Invoice
            </Button>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow data-state="selected">
          <TableCell>INV001</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — RTL", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <Table>
          <TableCaption>قائمة بفواتيرك الأخيرة.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>الفاتورة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>INV001</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </DirectionProvider>,
  );
  await expectNoA11yViolations(screen.container);
});

test("keyboard: every control inside a table stays in the document tab order", async () => {
  const screen = await render(
    <Table>
      <TableBody>
        <TableRow>
          <TableCell>
            <Button variant="ghost" size="sm">
              First
            </Button>
          </TableCell>
          <TableCell>
            <Button variant="ghost" size="sm">
              Second
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  await userEvent.tab();
  expect(document.activeElement?.textContent).toBe("First");
  await userEvent.tab();
  expect(document.activeElement?.textContent).toBe("Second");
});
