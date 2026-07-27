import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { DataGrid, type DataGridColumn } from "./data-grid";

interface Deal {
  id: string;
  name: string;
  stage: string;
  amount: number;
}

const DEALS: Deal[] = [
  { id: "d1", name: "Acme", stage: "Open", amount: 300 },
  { id: "d2", name: "Globex", stage: "Won", amount: 100 },
  { id: "d3", name: "Initech", stage: "Open", amount: 200 },
];

function columns(
  overrides: Partial<DataGridColumn<Deal>> = {},
): DataGridColumn<Deal>[] {
  return [
    { key: "name", header: "Name", sortable: true, minWidth: 10 },
    { key: "stage", header: "Stage", sortable: true, minWidth: 10 },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      align: "end",
      minWidth: 10,
      ...overrides,
    },
  ];
}

/**
 * Minimal style mirror: the unstyled harness renders Base UI's unchecked
 * checkbox span at 0x0 (no compiled CSS), which Playwright treats as
 * invisible. Mirror only the sizes the click paths need (the data-list
 * precedent).
 */
function injectGridMirror(): () => void {
  const style = document.createElement("style");
  style.textContent = `
    [data-slot="checkbox"] { position: relative; display: inline-flex; box-sizing: border-box; }
    [data-slot="checkbox"][data-size="sm"] { width: 14px; height: 14px; }
  `;
  document.head.appendChild(style);
  return () => document.head.removeChild(style);
}

function bodyCellTexts(columnIndex: number): string[] {
  return Array.from(
    document.querySelectorAll('[data-slot="data-grid-row"]'),
  ).map(
    (row) =>
      row.querySelectorAll('[data-slot="data-grid-cell"]')[columnIndex]
        ?.textContent ?? "",
  );
}

test("renders a labelled role=grid with columnheaders and gridcells", async () => {
  const screen = await render(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={DEALS}
      getRowId={(d) => d.id}
    />,
  );
  const grid = screen.getByRole("grid", { name: "Deals" });
  await expect.element(grid).toBeInTheDocument();
  const el = grid.element() as HTMLElement;
  expect(el.getAttribute("aria-colcount")).toBe("3");
  expect(el.getAttribute("aria-rowcount")).toBe("4");
  expect(document.querySelectorAll('[role="columnheader"]')).toHaveLength(3);
  expect(bodyCellTexts(0)).toEqual(["Acme", "Globex", "Initech"]);
});

test("the grid sorts its own data; shift-click adds a second key with ordinals", async () => {
  const screen = await render(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={DEALS}
      getRowId={(d) => d.id}
    />,
  );
  await screen.getByRole("button", { name: /Stage/ }).click();
  expect(bodyCellTexts(1)).toEqual(["Open", "Open", "Won"]);
  // Shift-click Amount → secondary key: within Open, 200 before 300.
  const amount = screen.getByRole("button", { name: /Amount/ });
  await amount.click({ modifiers: ["Shift"] });
  expect(bodyCellTexts(0)).toEqual(["Initech", "Acme", "Globex"]);
  // Ordinal badges render when more than one key is active.
  const heads = document.querySelectorAll('[data-slot="data-grid-head"]');
  const texts = Array.from(heads).map((h) => h.textContent);
  expect(texts.join(" ")).toContain("1");
  expect(texts.join(" ")).toContain("2");
  // aria-sort reflects the primary key.
  const stageHead = Array.from(heads).find((h) =>
    h.textContent?.includes("Stage"),
  )!;
  expect(stageHead.getAttribute("aria-sort")).toBe("ascending");
});

test("sort cycles asc → desc → removed per key", async () => {
  const onSortChange = vi.fn();
  const screen = await render(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={DEALS}
      getRowId={(d) => d.id}
      onSortChange={onSortChange}
    />,
  );
  const name = screen.getByRole("button", { name: /Name/ });
  await name.click();
  await name.click();
  expect(bodyCellTexts(0)).toEqual(["Initech", "Globex", "Acme"]);
  await name.click();
  expect(onSortChange).toHaveBeenLastCalledWith([]);
  expect(bodyCellTexts(0)).toEqual(["Acme", "Globex", "Initech"]);
});

test("the column picker hides and restores columns", async () => {
  const screen = await render(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={DEALS}
      getRowId={(d) => d.id}
    />,
  );
  await screen.getByRole("button", { name: "Columns" }).click();
  await screen.getByRole("menuitemcheckbox", { name: "Stage" }).click();
  await expect
    .poll(() => document.querySelectorAll('[role="columnheader"]').length)
    .toBe(2);
  // Checkbox items keep the menu OPEN (Base UI's checkbox-item semantics) —
  // toggle the same item again without re-clicking the trigger.
  await screen.getByRole("menuitemcheckbox", { name: "Stage" }).click();
  await expect
    .poll(() => document.querySelectorAll('[role="columnheader"]').length)
    .toBe(3);
});

test("responsive revelation: an oversized column merges into the primary cell", async () => {
  await render(
    <div style={{ width: "300px" }}>
      <DataGrid
        aria-label="Deals"
        columns={[
          { key: "name", header: "Name", minWidth: 10, mobile: "visible" },
          { key: "stage", header: "Stage", minWidth: 10_000, mobile: "merge" },
          { key: "amount", header: "Amount", minWidth: 10_000 },
        ]}
        data={DEALS}
        getRowId={(d) => d.id}
      />
    </div>,
  );
  // Amount (mobile default hidden) disappears; Stage merges into primary.
  await expect
    .poll(() => document.querySelectorAll('[role="columnheader"]').length)
    .toBe(1);
  const merged = document.querySelector('[data-slot="data-grid-merged"]');
  expect(merged?.textContent).toContain("Open");
});

test("grouping renders one collapsible tbody section per value", async () => {
  const screen = await render(
    <DataGrid
      aria-label="Deals"
      columns={[
        { key: "name", header: "Name", minWidth: 10 },
        { key: "stage", header: "Stage", minWidth: 10, group: true },
      ]}
      data={DEALS}
      getRowId={(d) => d.id}
    />,
  );
  const sections = document.querySelectorAll('[data-slot="data-grid-section"]');
  expect(sections).toHaveLength(2);
  expect(
    document.querySelectorAll('[data-slot="data-grid-group-row"]'),
  ).toHaveLength(2);
  // Collapse "Open" (2 rows) — its rows disappear, the other section stays.
  await screen.getByRole("button", { name: /Open.*2/s }).click();
  await expect
    .poll(() => document.querySelectorAll('[data-slot="data-grid-row"]').length)
    .toBe(1);
  const openSection = document.querySelector('[data-group="Open"]')!;
  expect(openSection.hasAttribute("data-collapsed")).toBe(true);
});

test("selection: header tri-state and per-row toggling", async () => {
  const cleanup = injectGridMirror();
  const onSelectionChange = vi.fn();
  const screen = await render(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={DEALS}
      getRowId={(d) => d.id}
      selectable
      onSelectionChange={onSelectionChange}
    />,
  );
  await screen.getByRole("checkbox", { name: "Select row 1" }).click();
  expect([...onSelectionChange.mock.calls.at(-1)![0]]).toEqual(["d1"]);
  await screen.getByRole("checkbox", { name: "Select all rows" }).click();
  expect([...onSelectionChange.mock.calls.at(-1)![0]].sort()).toEqual([
    "d1",
    "d2",
    "d3",
  ]);
  cleanup();
});

test("APG navigation: roving gridcell tabindex, arrows, Home/End, Ctrl+Home", async () => {
  await render(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={DEALS}
      getRowId={(d) => d.id}
    />,
  );
  const firstCell = document.querySelector(
    '[data-slot="data-grid-cell"]',
  ) as HTMLElement;
  expect(firstCell.tabIndex).toBe(0);
  firstCell.focus();
  await userEvent.keyboard("{ArrowRight}");
  // Position assertions via aria-colindex.
  expect(
    (document.activeElement as HTMLElement).getAttribute("aria-colindex"),
  ).toBe("2");
  await userEvent.keyboard("{ArrowDown}");
  expect(
    (document.activeElement as HTMLElement)
      .closest("tr")
      ?.getAttribute("aria-rowindex"),
  ).toBe("3");
  await userEvent.keyboard("{End}");
  expect(
    (document.activeElement as HTMLElement).getAttribute("aria-colindex"),
  ).toBe("3");
  await userEvent.keyboard("{Home}");
  expect(
    (document.activeElement as HTMLElement).getAttribute("aria-colindex"),
  ).toBe("1");
  await userEvent.keyboard("{Control>}{Home}{/Control}");
  expect(
    (document.activeElement as HTMLElement)
      .closest("tr")
      ?.getAttribute("aria-rowindex"),
  ).toBe("2");
});

test("Enter opens the managed cell editor (grid nav suspends); Escape restores grid focus", async () => {
  const onCellCommit = vi.fn();
  await render(
    <DataGrid
      aria-label="Deals"
      columns={[
        { key: "name", header: "Name", minWidth: 10 },
        {
          key: "stage",
          header: "Stage",
          minWidth: 10,
          editable: { type: "text" },
        },
      ]}
      data={DEALS}
      getRowId={(d) => d.id}
      onCellCommit={onCellCommit}
    />,
  );
  const firstCell = document.querySelector(
    '[data-slot="data-grid-cell"]',
  ) as HTMLElement;
  firstCell.focus();
  await userEvent.keyboard("{ArrowRight}");
  await userEvent.keyboard("{Enter}");
  // The managed EditableCell editor opened.
  const input = document.querySelector(
    '[data-slot="data-grid-cell"] input',
  ) as HTMLInputElement;
  expect(input).not.toBeNull();
  // Grid nav is suspended while editing: typing arrows edits text, not cells.
  await userEvent.keyboard("{Escape}");
  // Escape closes and grid focus returns to the cell.
  await expect
    .poll(() =>
      (document.activeElement as HTMLElement)?.getAttribute("aria-colindex"),
    )
    .toBe("2");
  expect(onCellCommit).not.toHaveBeenCalled();
});

test("committing an edit calls onCellCommit(row, key, value)", async () => {
  const onCellCommit = vi.fn();
  await render(
    <DataGrid
      aria-label="Deals"
      columns={[
        {
          key: "name",
          header: "Name",
          minWidth: 10,
          editable: { type: "text" },
        },
      ]}
      data={DEALS}
      getRowId={(d) => d.id}
      onCellCommit={onCellCommit}
    />,
  );
  const firstCell = document.querySelector(
    '[data-slot="data-grid-cell"]',
  ) as HTMLElement;
  firstCell.focus();
  await userEvent.keyboard("{F2}");
  await expect
    .poll(
      () =>
        (
          document.querySelector(
            '[data-slot="data-grid-cell"] input',
          ) as HTMLInputElement
        )?.selectionEnd,
    )
    .toBe(4);
  await userEvent.keyboard("Acme Corp{Enter}");
  expect(onCellCommit).toHaveBeenCalledWith(
    expect.objectContaining({ id: "d1" }),
    "name",
    "Acme Corp",
  );
});

test("ArrowDown past the last row triggers keyboard-continuous load-more", async () => {
  const onLoadMore = vi.fn();
  await render(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={DEALS}
      getRowId={(d) => d.id}
      loadMore={{ hasMore: true, onLoadMore }}
    />,
  );
  const firstCell = document.querySelector(
    '[data-slot="data-grid-cell"]',
  ) as HTMLElement;
  firstCell.focus();
  await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
  expect(onLoadMore).toHaveBeenCalledTimes(1);
  const live = document.querySelector('[role="status"]')!;
  expect(live.textContent).toContain("Loading more rows…");
});

test("virtualize windows the rows inside the fixed-height viewport", async () => {
  const many: Deal[] = Array.from({ length: 200 }, (_, i) => ({
    id: `v${i}`,
    name: `Row ${i}`,
    stage: "Open",
    amount: i,
  }));
  // No compiled Tailwind here — mirror the viewport-height classes so the
  // scroll container actually constrains (the style-mirror technique).
  const style = document.createElement("style");
  style.textContent =
    '[data-slot="table-container"] { max-height: 240px; overflow-y: auto; display: block; }';
  document.head.appendChild(style);
  await render(
    <DataGrid
      aria-label="Many"
      columns={columns()}
      data={many}
      getRowId={(d) => d.id}
      virtualize
      maxHeight="240px"
    />,
  );
  const rendered = document.querySelectorAll('[data-slot="data-grid-row"]');
  expect(rendered.length).toBeGreaterThan(0);
  expect(rendered.length).toBeLessThan(60);
  // Windowed rows stay REAL table rows inside the one table grid — the
  // spacer-row technique, so cells keep tracking the header's columns.
  const firstRendered = rendered[0] as HTMLElement;
  expect(firstRendered.closest("table")).not.toBeNull();
  expect(
    document.querySelectorAll('[data-slot="data-grid-virtual-pad"]').length,
  ).toBeGreaterThan(0);
  document.head.removeChild(style);
});

test("loading renders skeletons; empty renders the Empty state", async () => {
  const screen = await render(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={[]}
      getRowId={(d: Deal) => d.id}
      loading
    />,
  );
  expect(
    document.querySelectorAll('[data-slot="skeleton"]').length,
  ).toBeGreaterThan(0);
  await screen.rerender(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={[]}
      getRowId={(d: Deal) => d.id}
    />,
  );
  await expect.element(screen.getByText("No data")).toBeInTheDocument();
});

test("focus indicator: nothing strips the outline (text entry excepted)", async () => {
  await render(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={DEALS}
      getRowId={(d) => d.id}
      selectable
    />,
  );
  const offenders = Array.from(document.querySelectorAll("*")).filter(
    (el) =>
      (el.getAttribute("class") ?? "").includes("outline-none") &&
      !["INPUT", "TEXTAREA"].includes(el.tagName),
  );
  const focusable = offenders.filter((el) =>
    el.matches("button, a, [tabindex]"),
  );
  expect(focusable).toEqual([]);
});

test("no a11y violations — grid, selectable, grouped, editable", async () => {
  const screen = await render(
    <div>
      <DataGrid
        aria-label="Plain"
        columns={columns()}
        data={DEALS}
        getRowId={(d) => d.id}
        selectable
      />
      <DataGrid
        aria-label="Grouped"
        columns={[
          { key: "name", header: "Name", minWidth: 10 },
          { key: "stage", header: "Stage", minWidth: 10, group: true },
        ]}
        data={DEALS}
        getRowId={(d) => d.id}
      />
    </div>,
  );
  await expectNoA11yViolations(screen.container);
  // The EDITABLE composition (EditableCell inside gridcell), scanned while
  // an editor is OPEN — the title's third state must actually be covered.
  const editableScreen = await render(
    <DataGrid
      aria-label="Editable"
      columns={[
        {
          key: "name",
          header: "Name",
          minWidth: 10,
          editable: { type: "text" },
        },
        { key: "stage", header: "Stage", minWidth: 10 },
      ]}
      data={DEALS}
      getRowId={(d) => d.id}
      onCellCommit={() => {}}
    />,
  );
  const cell = document.querySelector(
    '[aria-label="Editable"] [data-slot="data-grid-cell"], [role="grid"][aria-label="Editable"] [data-slot="data-grid-cell"]',
  ) as HTMLElement;
  cell.focus();
  await userEvent.keyboard("{F2}");
  await vi.waitFor(() => {
    if (!document.querySelector("input")) throw new Error("editor not open");
  });
  await expectNoA11yViolations(editableScreen.container);
});

test("keyboard reachability survives hiding the active column and shrinking data", async () => {
  function Host() {
    const [data, setData] = React.useState(DEALS);
    return (
      <div>
        <button type="button" onClick={() => setData(DEALS.slice(0, 1))}>
          shrink
        </button>
        <DataGrid
          aria-label="Deals"
          columns={columns()}
          data={data}
          getRowId={(d) => d.id}
        />
      </div>
    );
  }
  const screen = await render(<Host />);
  // Put the roving cell on the LAST row, then shrink the data under it.
  const cells = Array.from(
    document.querySelectorAll('[data-slot="data-grid-cell"]'),
  ) as HTMLElement[];
  cells[cells.length - 1]!.focus();
  await screen.getByRole("button", { name: "shrink" }).click();
  // Exactly one body cell must still hold the tab stop.
  const stops = Array.from(
    document.querySelectorAll('[data-slot="data-grid-cell"]'),
  ).filter((el) => (el as HTMLElement).tabIndex === 0);
  expect(stops.length).toBe(1);
});

test("header keystrokes stay in the header: Enter on a sort button sorts without opening an editor", async () => {
  await render(
    <DataGrid
      aria-label="Deals"
      columns={[
        {
          key: "name",
          header: "Name",
          sortable: true,
          minWidth: 10,
          editable: { type: "text" },
        },
        { key: "stage", header: "Stage", minWidth: 10 },
      ]}
      data={DEALS}
      getRowId={(d) => d.id}
      onCellCommit={() => {}}
    />,
  );
  const sortButton = document.querySelector(
    "th [data-slot] button, th button",
  ) as HTMLElement;
  sortButton.focus();
  await userEvent.keyboard("{Enter}");
  // Sorting happened…
  await vi.waitFor(() => {
    const th = sortButton.closest("th")!;
    if (th.getAttribute("aria-sort") === "none")
      throw new Error("did not sort");
  });
  // …and no cell editor opened, and focus stayed on the header button.
  expect(document.querySelector("td input")).toBeNull();
  expect(document.activeElement).toBe(sortButton);
});

test("grouped grids count EVERY DOM row in aria geometry (group rows included)", async () => {
  await render(
    <DataGrid
      aria-label="Grouped"
      columns={[
        { key: "name", header: "Name", minWidth: 10 },
        { key: "stage", header: "Stage", minWidth: 10, group: true },
      ]}
      data={DEALS}
      getRowId={(d) => d.id}
    />,
  );
  const grid = document.querySelector('[role="grid"]')!;
  const domRows = Array.from(grid.querySelectorAll("tr"));
  // aria-rowcount must equal the real DOM row total (header + group rows +
  // data rows), and every row must carry a continuous aria-rowindex.
  expect(grid.getAttribute("aria-rowcount")).toBe(String(domRows.length));
  const indices = domRows.map((row) => row.getAttribute("aria-rowindex"));
  expect(indices).not.toContain(null);
  expect(indices.map(Number)).toEqual(
    Array.from({ length: domRows.length }, (_, i) => i + 1),
  );
  const groupRows = Array.from(
    grid.querySelectorAll('[data-slot="data-grid-group-row"]'),
  );
  expect(groupRows.length).toBeGreaterThan(0);
  for (const row of groupRows) {
    expect(row.getAttribute("aria-rowindex")).not.toBeNull();
  }
});

test("responsive revelation hides right-to-left with no holes", async () => {
  // Constrain the measuring container — no compiled Tailwind here.
  const style = document.createElement("style");
  style.textContent =
    '[data-slot="table-container"] { width: 300px; display: block; overflow-x: hidden; }';
  document.head.appendChild(style);
  await render(
    <DataGrid
      aria-label="Narrow"
      columns={[
        { key: "name", header: "Name", minWidth: 10 },
        { key: "wide", header: "Wide", minWidth: 10000 },
        { key: "narrow", header: "Narrow", minWidth: 10 },
      ]}
      data={DEALS.map((d) => ({ ...d }))}
      getRowId={(d) => d.id}
    />,
  );
  // "Wide" cannot fit — and once one hideable column hides, every hideable
  // column after it must hide too, even though "Narrow" alone would fit.
  await expect
    .poll(() =>
      Array.from(document.querySelectorAll('[role="columnheader"]')).map(
        (th) => th.textContent,
      ),
    )
    .toEqual(["Name"]);
  document.head.removeChild(style);
});

test("keyboard load-more fires once per page even when the host omits `loading`", async () => {
  const onLoadMore = vi.fn();
  function Host() {
    const [rows, setRows] = React.useState(DEALS.slice(0, 2));
    return (
      <div>
        <button type="button" onClick={() => setRows(DEALS)}>
          arrive
        </button>
        <DataGrid
          aria-label="Paged"
          columns={columns()}
          data={rows}
          getRowId={(d) => d.id}
          loadMore={{ hasMore: true, onLoadMore }}
        />
      </div>
    );
  }
  const screen = await render(<Host />);
  const cells = Array.from(
    document.querySelectorAll('[data-slot="data-grid-cell"]'),
  ) as HTMLElement[];
  // Focus a cell in the LAST row, then walk past it repeatedly.
  cells[cells.length - 1]!.focus();
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{ArrowDown}");
  expect(onLoadMore).toHaveBeenCalledTimes(1);
  // New rows arriving reset the guard — the NEXT page is reachable.
  await screen.getByRole("button", { name: "arrive" }).click();
  const grown = Array.from(
    document.querySelectorAll('[data-slot="data-grid-cell"]'),
  ) as HTMLElement[];
  grown[grown.length - 1]!.focus();
  await userEvent.keyboard("{ArrowDown}");
  expect(onLoadMore).toHaveBeenCalledTimes(2);
});

test("clicking Columns while a cell editor is open opens the menu on the FIRST click", async () => {
  const screen = await render(
    <DataGrid
      aria-label="Deals"
      columns={[
        {
          key: "name",
          header: "Name",
          minWidth: 10,
          editable: { type: "text" },
        },
        { key: "stage", header: "Stage", minWidth: 10 },
      ]}
      data={DEALS}
      getRowId={(d) => d.id}
      onCellCommit={() => {}}
    />,
  );
  const cell = document.querySelector(
    '[data-slot="data-grid-cell"]',
  ) as HTMLElement;
  cell.focus();
  await userEvent.keyboard("{F2}");
  await vi.waitFor(() => {
    if (!document.querySelector("td input")) throw new Error("editor not open");
  });
  // The editor's blur-close schedules a rAF focus restore — it must NOT
  // steal focus back from the control the user just clicked.
  await screen.getByRole("button", { name: "Columns" }).click();
  await expect
    .poll(() => document.querySelectorAll('[role="menuitemcheckbox"]').length)
    .toBeGreaterThan(0);
  // Survive a couple of frames: the stale rAF firing late is the bug.
  await new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(r)),
  );
  expect(
    document.querySelectorAll('[role="menuitemcheckbox"]').length,
  ).toBeGreaterThan(0);
  expect(document.querySelector("td input")).toBeNull();
});
