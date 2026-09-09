import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Table, TableBody, TableHeader, TableRow } from "@/components/ui/table";
import {
  alignClass,
  columnCellClass,
  cycleSort,
  EmptyRow,
  isNowrapColumn,
  SelectAllHead,
  SelectionCell,
  SkeletonRows,
  SortableHead,
  SortHeaderButton,
  useControlledState,
  useRowSelection,
  type DataTableColumnLayout,
  type SortDirection,
} from "./data-table-parts";

const columns: DataTableColumnLayout[] = [
  { key: "name" },
  { key: "amount", align: "end" },
  { key: "id", mono: true },
];

/* ------------------------------------------------------------------ column rules */

test("alignClass maps the three alignments and defaults to start", () => {
  expect(alignClass(undefined)).toBe("text-start");
  expect(alignClass("start")).toBe("text-start");
  expect(alignClass("center")).toBe("text-center");
  expect(alignClass("end")).toBe("text-end");
});

test("cells WRAP by default; figures and mono values opt in to nowrap (D18)", () => {
  expect(isNowrapColumn({ key: "name" })).toBe(false);
  expect(isNowrapColumn({ key: "amount", align: "end" })).toBe(true);
  expect(isNowrapColumn({ key: "id", mono: true })).toBe(true);
  // An explicit value always wins over the inference, in BOTH directions.
  expect(isNowrapColumn({ key: "note", nowrap: true })).toBe(true);
  expect(isNowrapColumn({ key: "amount", align: "end", nowrap: false })).toBe(
    false,
  );
});

test("columnCellClass carries alignment, wrap posture and the mono face", () => {
  expect(columnCellClass({ key: "name" })).toBe("text-start");
  expect(columnCellClass({ key: "amount", align: "end" })).toContain(
    "whitespace-nowrap",
  );
  const mono = columnCellClass({ key: "id", mono: true });
  expect(mono).toContain("font-mono");
  expect(mono).toContain("tabular-nums");
  expect(mono).toContain("whitespace-nowrap");
});

/* ------------------------------------------------------------------ sort */

test("cycleSort runs asc → desc → cleared so a sort is always undoable", () => {
  const asc = cycleSort([], "name");
  expect(asc).toEqual([{ key: "name", direction: "asc" }]);
  const desc = cycleSort(asc, "name");
  expect(desc).toEqual([{ key: "name", direction: "desc" }]);
  expect(cycleSort(desc, "name")).toEqual([]);
});

test("cycleSort replaces by default and appends only when additive", () => {
  const first = cycleSort([], "name");
  expect(cycleSort(first, "amount")).toEqual([
    { key: "amount", direction: "asc" },
  ]);
  expect(cycleSort(first, "amount", { additive: true, maxKeys: 2 })).toEqual([
    { key: "name", direction: "asc" },
    { key: "amount", direction: "asc" },
  ]);
});

test("cycleSort caps at maxKeys by dropping the OLDEST key", () => {
  // Dropping the newest would make the click the user just made do nothing.
  const two = [
    { key: "a", direction: "asc" as SortDirection },
    { key: "b", direction: "asc" as SortDirection },
  ];
  expect(cycleSort(two, "c", { additive: true, maxKeys: 2 })).toEqual([
    { key: "b", direction: "asc" },
    { key: "c", direction: "asc" },
  ]);
});

test("SortHeaderButton composes the system Button and reports its direction", async () => {
  const onSort = vi.fn();
  const screen = await render(
    <SortHeaderButton direction="desc" order={2} onSort={onSort}>
      Amount
    </SortHeaderButton>,
  );
  const button = screen.getByRole("button", { name: /Amount/ });
  await expect.element(button).toBeInTheDocument();
  // It IS a Button, not a hand-rolled control — so it inherits the system's
  // hover/pressed steps and focus outline instead of restating them.
  expect((button.element() as HTMLElement).dataset.slot).toBe(
    "data-table-sort",
  );
  expect(button.element().querySelector('[data-slot="button"]')).toBeNull();
  expect(button.element().textContent).toContain("2");
  (button.element() as HTMLElement).click();
  expect(onSort).toHaveBeenCalledTimes(1);
});

test("SortableHead emits aria-sort on EVERY sortable column, including 'none'", async () => {
  const screen = await render(
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead
            column={{ key: "name", header: "Name", sortable: true }}
            onSort={() => {}}
          />
          <SortableHead
            column={{ key: "amount", header: "Amount", sortable: true }}
            direction="asc"
            onSort={() => {}}
          />
          <SortableHead column={{ key: "note", header: "Note" }} />
        </TableRow>
      </TableHeader>
    </Table>,
  );
  const [unsorted, sorted, plain] = [
    ...screen.container.querySelectorAll("th"),
  ] as HTMLElement[];
  // A table that only marks the ACTIVE column tells a screen-reader user which
  // column is sorted but never which ones they could sort.
  expect(unsorted!.getAttribute("aria-sort")).toBe("none");
  expect(sorted!.getAttribute("aria-sort")).toBe("ascending");
  expect(sorted!.dataset.sorted).toBe("asc");
  expect(plain!.getAttribute("aria-sort")).toBeNull();
  expect(plain!.querySelector("button")).toBeNull();
});

/* ------------------------------------------------------------------ selection */

function SelectionHarness({ ids }: { ids: string[] }) {
  const { selected, allSelected, indeterminate, toggleAll, toggleRow } =
    useRowSelection({ rowIds: ids });
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SelectAllHead
            checked={allSelected}
            indeterminate={indeterminate}
            onToggle={toggleAll}
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {ids.map((id, index) => (
          <TableRow key={id}>
            <SelectionCell
              checked={selected.has(id)}
              onToggle={() => toggleRow(id)}
              label={`Select row ${index + 1}`}
            />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

test("select-all toggles every row and clears back", async () => {
  const screen = await render(<SelectionHarness ids={["a", "b", "c"]} />);
  const all = screen.getByRole("checkbox", { name: "Select all rows" });
  (all.element() as HTMLElement).click();
  await expect
    .element(screen.getByRole("checkbox", { name: "Select row 2" }))
    .toHaveAttribute("aria-checked", "true");
  (all.element() as HTMLElement).click();
  await expect
    .element(screen.getByRole("checkbox", { name: "Select row 2" }))
    .toHaveAttribute("aria-checked", "false");
});

test("selection is preserved for rows OUTSIDE the current view", async () => {
  // With host-owned paging, `rowIds` is only ever a slice — selecting the visible
  // page must not wipe what the user selected on another one.
  const offView = new Set(["page2-row"]);
  let next: Set<string> | null = null;
  function Harness() {
    const { toggleAll } = useRowSelection({
      rowIds: ["a", "b"],
      selectedIds: offView,
      onSelectionChange: (value) => {
        next = value;
      },
    });
    return (
      <button type="button" onClick={toggleAll}>
        select all
      </button>
    );
  }
  const screen = await render(<Harness />);
  (screen.getByRole("button").element() as HTMLElement).click();
  expect([...(next as unknown as Set<string>)].sort()).toEqual([
    "a",
    "b",
    "page2-row",
  ]);
});

test("SelectionCell stops mouse propagation so selecting never activates the row", async () => {
  const onRowClick = vi.fn();
  const screen = await render(
    <Table>
      <TableBody>
        <TableRow onClick={onRowClick}>
          <SelectionCell
            checked={false}
            onToggle={() => {}}
            label="Select row 1"
          />
        </TableRow>
      </TableBody>
    </Table>,
  );
  (
    screen
      .getByRole("checkbox", { name: "Select row 1" })
      .element() as HTMLElement
  ).click();
  expect(onRowClick).not.toHaveBeenCalled();
});

/* ------------------------------------------------------------------ state */

function ControlledHarness({
  value,
  onChange,
}: {
  value: string | null | undefined;
  onChange: (next: string | null) => void;
}) {
  const [current, commit] = useControlledState<string | null>(
    value,
    "internal",
    onChange,
  );
  return (
    <button type="button" onClick={() => commit("next")}>
      {String(current)}
    </button>
  );
}

test("useControlledState defers to a controlled value, including null", async () => {
  const onChange = vi.fn();
  const screen = await render(
    <ControlledHarness value={null} onChange={onChange} />,
  );
  await expect.element(screen.getByRole("button")).toHaveTextContent("null");
  (screen.getByRole("button").element() as HTMLElement).click();
  // Controlled: the host is told, and the value does not move on its own.
  expect(onChange).toHaveBeenCalledWith("next");
  await expect.element(screen.getByRole("button")).toHaveTextContent("null");
});

test("useControlledState keeps its own value when uncontrolled", async () => {
  const onChange = vi.fn();
  const screen = await render(
    <ControlledHarness value={undefined} onChange={onChange} />,
  );
  await expect
    .element(screen.getByRole("button"))
    .toHaveTextContent("internal");
  (screen.getByRole("button").element() as HTMLElement).click();
  await expect.element(screen.getByRole("button")).toHaveTextContent("next");
  expect(onChange).toHaveBeenCalledWith("next");
});

/* ------------------------------------------------------------------ async states */

test("SkeletonRows draws the requested geometry and hides it from AT", async () => {
  const screen = await render(
    <Table>
      <TableBody>
        <SkeletonRows columns={columns} rows={3} selectable />
      </TableBody>
    </Table>,
  );
  const rows = screen.container.querySelectorAll(
    '[data-slot="data-table-skeleton-row"]',
  );
  expect(rows).toHaveLength(3);
  expect(rows[0]!.getAttribute("aria-hidden")).toBe("true");
  // 3 columns + the selection column.
  expect(rows[0]!.querySelectorAll("td")).toHaveLength(4);
});

test("SkeletonRows never renders zero rows", async () => {
  const screen = await render(
    <Table>
      <TableBody>
        <SkeletonRows columns={columns} rows={0} />
      </TableBody>
    </Table>,
  );
  expect(
    screen.container.querySelectorAll('[data-slot="data-table-skeleton-row"]'),
  ).toHaveLength(1);
});

test("EmptyRow spans the table and accepts a custom state", async () => {
  const screen = await render(
    <Table>
      <TableBody>
        <EmptyRow colSpan={4} />
      </TableBody>
    </Table>,
  );
  const cell = screen.container.querySelector("td") as HTMLTableCellElement;
  expect(cell.colSpan).toBe(4);
  expect(cell.textContent).toContain("No data");
  screen.unmount();

  const custom = await render(
    <Table>
      <TableBody>
        <EmptyRow colSpan={2}>
          <p>Nothing matches this filter</p>
        </EmptyRow>
      </TableBody>
    </Table>,
  );
  expect(custom.container.textContent).toContain("Nothing matches this filter");
});

/* ------------------------------------------------------------------ a11y */

test("the header parts have no accessibility violations", async () => {
  const screen = await render(<SelectionHarness ids={["a", "b"]} />);
  await expectNoA11yViolations(screen.container);
});

test("the loading and empty states have no accessibility violations", async () => {
  const loading = await render(
    <Table aria-label="Records">
      <TableBody>
        <SkeletonRows columns={columns} rows={2} selectable />
      </TableBody>
    </Table>,
  );
  await expectNoA11yViolations(loading.container);
  loading.unmount();

  const empty = await render(
    <Table aria-label="Records">
      <TableBody>
        <EmptyRow colSpan={3} />
      </TableBody>
    </Table>,
  );
  await expectNoA11yViolations(empty.container);
});
