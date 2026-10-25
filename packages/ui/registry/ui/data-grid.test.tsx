import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Button } from "./button";
import { ContextMenuItem } from "./context-menu";
import { DataGrid, gridCellKey, type DataGridColumn } from "./data-grid";
import { DropdownMenuItem } from "./dropdown-menu";

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
  // Both overflow columns leave the header; neither is LOST — `merge` is now the
  // default posture (B5-04), so Amount stacks into the primary cell alongside Stage.
  await expect
    .poll(() => document.querySelectorAll('[role="columnheader"]').length)
    .toBe(1);
  const merged = document.querySelector('[data-slot="data-grid-merged"]');
  expect(merged?.textContent).toContain("Open");
  expect(merged?.textContent).toContain("300");
  // Nothing was dropped, so there is nothing to report.
  expect(
    document.querySelector('[data-slot="data-grid-hidden-hint"]'),
  ).toBeNull();
});

test("grouping flattens into the one body: a group row per value, then its rows", async () => {
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
  // One body for every group (the row virtualiser's list), not a tbody per section.
  expect(document.querySelectorAll("tbody")).toHaveLength(1);
  const groupRows = document.querySelectorAll(
    '[data-slot="data-grid-group-row"]',
  );
  expect(groupRows).toHaveLength(2);
  expect(
    Array.from(document.querySelectorAll("tbody > tr")).map((row) =>
      row.getAttribute("data-slot") === "data-grid-group-row"
        ? `group:${row.getAttribute("data-group")}`
        : row.textContent,
    ),
  ).toEqual([
    "group:Open",
    "AcmeOpen",
    "InitechOpen",
    "group:Won",
    "GlobexWon",
  ]);
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
  // Native `.click()`: Base UI renders a checkbox as a `<span role="checkbox">`, and this lane
  // compiles no Tailwind, so the element has no box for Playwright's visibility check. The handler
  // is the same one a real pointer reaches, and the RENDERED target is proven on compiled CSS by
  // `test/geometry.browser.test.tsx`.
  (
    screen
      .getByRole("checkbox", { name: "Select row 1" })
      .element() as HTMLElement
  ).click();
  expect([...onSelectionChange.mock.calls.at(-1)![0]]).toEqual(["d1"]);
  (
    screen
      .getByRole("checkbox", { name: "Select all rows" })
      .element() as HTMLElement
  ).click();
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

test("an editable column keeps its render as the display; a custom editor gets the row", async () => {
  const seen = vi.fn();
  const screen = await render(
    <DataGrid
      aria-label="Deals"
      columns={[
        { key: "name", header: "Name", minWidth: 10 },
        {
          key: "stage",
          header: "Stage",
          minWidth: 10,
          render: (row) => <span data-testid="stage-tag">{row.stage} tag</span>,
          editable: {
            type: "custom",
            render: ({ row, cancel }) => {
              seen(row.id);
              return (
                <button type="button" onClick={cancel}>
                  Editing {row.name}
                </button>
              );
            },
          },
        },
      ]}
      data={DEALS}
      getRowId={(d) => d.id}
      onCellCommit={() => {}}
    />,
  );
  expect(screen.getByTestId("stage-tag").first().element().textContent).toBe(
    "Open tag",
  );
  const firstCell = document.querySelector(
    '[data-slot="data-grid-cell"]',
  ) as HTMLElement;
  firstCell.focus();
  await userEvent.keyboard("{ArrowRight}");
  await userEvent.keyboard("{Enter}");
  await expect.element(screen.getByText("Editing Acme")).toBeVisible();
  expect(seen).toHaveBeenLastCalledWith("d1");
});

test("a pending commit on a rendered editable column shows the pending value", async () => {
  await render(
    <DataGrid
      aria-label="Deals"
      columns={[
        { key: "name", header: "Name", minWidth: 10 },
        {
          key: "stage",
          header: "Stage",
          minWidth: 10,
          render: (row) => <span>{row.stage} tag</span>,
          editable: { type: "text" },
        },
      ]}
      data={DEALS}
      getRowId={(d) => d.id}
      onCellCommit={() => new Promise<void>(() => {})}
    />,
  );
  const firstCell = document.querySelector(
    '[data-slot="data-grid-cell"]',
  ) as HTMLElement;
  firstCell.focus();
  await userEvent.keyboard("{ArrowRight}");
  await userEvent.keyboard("{Enter}");
  const input = document.querySelector(
    '[data-slot="data-grid-cell"] input',
  ) as HTMLInputElement;
  await userEvent.fill(input, "Won");
  await userEvent.keyboard("{Enter}");
  const stage = () =>
    document.querySelector('[data-grid-row="d1"][data-grid-key="stage"]')!
      .textContent;
  await expect.poll(stage).toContain("Won");
  expect(stage()).not.toContain("Open tag");
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
  // F2 opens with the caret at the end (never a select-all); replace the draft explicitly.
  const field = document.querySelector<HTMLInputElement>(
    '[data-slot="data-grid-cell"] input',
  )!;
  expect(field.selectionStart).toBe(4);
  field.select();
  await userEvent.keyboard("Acme Corp{Enter}");
  expect(onCellCommit).toHaveBeenCalledWith(
    expect.objectContaining({ id: "d1" }),
    "name",
    "Acme Corp",
  );
});

test("ArrowDown past the last row and the scroll sentinel request a page once", async () => {
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
  // The scroll sentinel and the keyboard share one guard: one request for the page.
  expect(onLoadMore).toHaveBeenCalledTimes(1);
  const live = document.querySelector('[role="status"]')!;
  await expect.poll(() => live.textContent).toContain("Loading more rows…");
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
    '[data-slot="grid-viewport"] { max-height: 240px; overflow: auto; display: block; }';
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
  await expect.element(screen.getByText("Nothing here")).toBeInTheDocument();
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

test("columnOrder applies a host-owned order coherently: headers, cells, picker; unknown keys drop, missing keys append", async () => {
  await render(
    <DataGrid
      aria-label="Ordered"
      columns={columns()}
      data={DEALS}
      getRowId={(d) => d.id}
      columnOrder={["nope", "amount", "ghost"]}
    />,
  );
  // Unknown keys are ignored; declared-but-unlisted columns append in
  // declaration order after the listed ones.
  const headers = () =>
    Array.from(document.querySelectorAll('[role="columnheader"]')).map(
      (th) => th.textContent,
    );
  expect(headers()).toEqual(["Amount", "Name", "Stage"]);
  const firstRowCells = Array.from(
    document.querySelectorAll('[data-slot="data-grid-row"]'),
  )[0]!.querySelectorAll('[data-slot="data-grid-cell"]');
  // Amount leads the row too, not just the header.
  expect(firstRowCells[0]!.textContent).toBe(
    String((DEALS[0] as { amount: number }).amount),
  );
  // The picker lists the REORDERED set.
  await userEvent.click(
    document.querySelector(
      '[data-slot="data-grid-toolbar"] button',
    ) as HTMLElement,
  );
  await expect
    .poll(() =>
      Array.from(document.querySelectorAll('[role="menuitemcheckbox"]')).map(
        (item) => item.textContent,
      ),
    )
    .toEqual(["Amount", "Name", "Stage"]);
});

/* ---------------------------------------------------------------------------------------------
 * Honest narrow rendering (B5-04) and the opt-out column picker (B5-09).
 * ------------------------------------------------------------------------------------------- */

test("a dropped column is COUNTED and reported in the toolbar", async () => {
  // Data is never silently lost when a viewport narrows. `mobile: "hidden"` is
  // the only posture that actually removes a value, so it has to say so.
  await render(
    <div style={{ width: "300px" }}>
      <DataGrid
        aria-label="Deals"
        columns={[
          { key: "name", header: "Name", minWidth: 10, mobile: "visible" },
          { key: "stage", header: "Stage", minWidth: 10_000, mobile: "hidden" },
          {
            key: "amount",
            header: "Amount",
            minWidth: 10_000,
            mobile: "hidden",
          },
        ]}
        data={DEALS}
        getRowId={(d) => d.id}
      />
    </div>,
  );
  await expect
    .poll(
      () =>
        document.querySelector('[data-slot="data-grid-hidden-hint"]')
          ?.textContent,
    )
    .toBe("2 columns hidden");
  expect(document.querySelector('[data-slot="data-grid-merged"]')).toBeNull();
});

test("merged values carry their header as an sr-only prefix and wrap on their own rule", async () => {
  await render(
    <div style={{ width: "300px" }}>
      <DataGrid
        aria-label="Deals"
        columns={[
          {
            key: "name",
            header: "Name",
            minWidth: 10,
            mono: true,
            mobile: "visible",
          },
          { key: "stage", header: "Stage", minWidth: 10_000 },
          { key: "amount", header: "Amount", minWidth: 10_000, mono: true },
        ]}
        data={DEALS}
        getRowId={(d) => d.id}
      />
    </div>,
  );
  await expect
    .poll(() => document.querySelector('[data-slot="data-grid-merged"]'))
    .not.toBeNull();
  const merged = document.querySelector('[data-slot="data-grid-merged"]')!;
  // Read with its header, as DataList's stack always was.
  expect(merged.textContent).toBe("Stage: OpenAmount: 300");
  const [stage, amount] = Array.from(merged.children) as HTMLElement[];
  // `truncate` could not lower a table column's min-content width; the shared rule wraps.
  expect(stage!.className).not.toContain("truncate");
  expect(stage!.className).toContain("whitespace-normal");
  expect(stage!.className).toContain("wrap-anywhere");
  // Each value wears its OWN column's face, not the mono primary's.
  expect(stage!.className).toContain("font-sans");
  expect(amount!.className).toContain("font-mono");
});

test("a sorted column that left the header row is stated beside the grid", async () => {
  await render(
    <div style={{ width: "300px" }}>
      <DataGrid
        aria-label="Deals"
        columns={[
          { key: "name", header: "Name", minWidth: 10, mobile: "visible" },
          { key: "stage", header: "Stage", minWidth: 10_000, sortable: true },
          {
            key: "amount",
            header: "Amount",
            minWidth: 10_000,
            mobile: "hidden",
            sortable: true,
          },
        ]}
        data={DEALS}
        getRowId={(d) => d.id}
        sort={[
          { key: "stage", direction: "desc" },
          { key: "amount", direction: "asc" },
        ]}
      />
    </div>,
  );
  await expect
    .poll(
      () =>
        document.querySelector('[data-slot="data-grid-sort-hint"]')
          ?.textContent,
    )
    .toBe("Sorted by Stage, descending, then Amount, ascending");
  const hint = document.querySelector('[data-slot="data-grid-sort-hint"]')!;
  const grid = document.querySelector('[role="grid"]')!;
  expect(grid.getAttribute("aria-describedby")?.split(" ")).toContain(hint.id);
  // The merged value keeps the direction as a styling hook.
  expect(
    document
      .querySelector('[data-slot="data-grid-merged"] [data-sorted]')
      ?.getAttribute("data-sorted"),
  ).toBe("desc");
});

test("no sort line while every sorted column keeps its header", async () => {
  await render(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={DEALS}
      getRowId={(d) => d.id}
      sort={[{ key: "amount", direction: "asc" }]}
    />,
  );
  await expect
    .poll(() => document.querySelectorAll('[role="columnheader"]').length)
    .toBe(3);
  expect(
    document.querySelector('[data-slot="data-grid-sort-hint"]'),
  ).toBeNull();
});

test("the hidden-columns hint is singular for one column", async () => {
  await render(
    <div style={{ width: "300px" }}>
      <DataGrid
        aria-label="Deals"
        columns={[
          { key: "name", header: "Name", minWidth: 10, mobile: "visible" },
          { key: "stage", header: "Stage", minWidth: 10_000, mobile: "hidden" },
        ]}
        data={DEALS}
        getRowId={(d) => d.id}
      />
    </div>,
  );
  await expect
    .poll(
      () =>
        document.querySelector('[data-slot="data-grid-hidden-hint"]')
          ?.textContent,
    )
    .toBe("1 column hidden");
});

test("columnPicker={false} removes the Columns control and its toolbar row", async () => {
  const screen = await render(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={DEALS}
      getRowId={(d) => d.id}
      columnPicker={false}
    />,
  );
  expect(
    screen.container.querySelector('[data-slot="data-grid-toolbar"]'),
  ).toBeNull();
  expect(
    [...screen.container.querySelectorAll("button")].some(
      (button) => button.textContent === "Columns",
    ),
  ).toBe(false);
});

test("columnPicker={false} still renders a host toolbar", async () => {
  const screen = await render(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={DEALS}
      getRowId={(d) => d.id}
      columnPicker={false}
      toolbar={<span>Host controls</span>}
    />,
  );
  expect(
    screen.container.querySelector('[data-slot="data-grid-toolbar"]'),
  ).not.toBeNull();
  expect(screen.container.textContent).toContain("Host controls");
});

test("mono and end-aligned columns keep their cells on one line", async () => {
  await render(
    <DataGrid
      aria-label="Deals"
      columns={[
        { key: "name", header: "Name", minWidth: 10 },
        { key: "amount", header: "Amount", align: "end", minWidth: 10 },
        { key: "stage", header: "Ref", mono: true, minWidth: 10 },
      ]}
      data={DEALS}
      getRowId={(d) => d.id}
    />,
  );
  const cells = [
    ...document.querySelectorAll('[data-slot="data-grid-cell"]'),
  ] as HTMLElement[];
  expect(cells[0]!.className).not.toMatch(/(^|\s)whitespace-nowrap(\s|$)/);
  expect(cells[1]!.className).toContain("whitespace-nowrap");
  expect(cells[2]!.className).toContain("font-mono");
});

test("the roving cell's focus ring is pulled inside the scroll viewport", async () => {
  // SP-03: the viewport clips its own overflow, so an outward outline is cut off.
  await render(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={DEALS}
      getRowId={(d) => d.id}
    />,
  );
  const cell = document.querySelector(
    '[data-slot="data-grid-cell"]',
  ) as HTMLElement;
  expect(cell.className).toContain("focus-visible:-outline-offset-2");
});

test("the load-more tail is the shared LoadMore and loads on scroll (DS-30)", async () => {
  const onLoadMore = vi.fn();
  const screen = await render(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={DEALS}
      getRowId={(d) => d.id}
      loadMore={{ hasMore: true, onLoadMore }}
    />,
  );
  const footer = screen.container.querySelector('[data-slot="load-more"]');
  expect(footer).not.toBeNull();
  // Inside the grid's scroll viewport, after the table.
  expect(footer!.closest('[data-slot="grid-viewport"]')).not.toBeNull();
  expect(footer!.querySelector("button")).toBeNull();
  await expect.poll(() => onLoadMore.mock.calls.length).toBe(1);
  expect(
    screen.container.querySelector("table")?.getAttribute("aria-rowcount"),
  ).toBe("-1");

  await screen.rerender(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={DEALS}
      getRowId={(d) => d.id}
      loadMore={{ hasMore: false, onLoadMore }}
    />,
  );
  // No end caption was asked for: the list simply stops.
  expect(screen.container.querySelector('[data-slot="load-more"]')).toBeNull();

  await screen.rerender(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={DEALS}
      getRowId={(d) => d.id}
      loadMore={{ hasMore: false, onLoadMore, endLabel: "End of list" }}
    />,
  );
  expect(
    screen.container.querySelector('[data-slot="load-more"]')?.textContent,
  ).toBe("End of list");
  await expectNoA11yViolations(screen.container);
});

test("a failed load keeps the rows and offers Try again (DS-30)", async () => {
  const onLoadMore = vi.fn();
  const screen = await render(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={DEALS}
      getRowId={(d) => d.id}
      loadMore={{
        hasMore: true,
        onLoadMore,
        error: "Couldn't load more deals.",
      }}
    />,
  );
  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Couldn't load more deals.");
  await screen.getByRole("button", { name: "Try again" }).click();
  expect(onLoadMore).toHaveBeenCalledOnce();
  expect(
    screen.container.querySelectorAll('[data-slot="data-grid-row"]').length,
  ).toBeGreaterThan(0);
  await expectNoA11yViolations(screen.container);
});

test("DS-01: a mono column's header is sans; its body cells are mono", async () => {
  const screen = await render(
    <DataGrid
      aria-label="Deals"
      columns={columns({ mono: true })}
      data={DEALS}
      getRowId={(d) => d.id}
    />,
  );
  const header = [...document.querySelectorAll('[role="columnheader"]')].find(
    (el) => el.textContent?.includes("Amount"),
  )!;
  expect(header.className).not.toContain("font-mono");
  expect(header.className).toContain("tabular-nums");
  const cell = screen.getByRole("gridcell", { name: "300" }).element();
  expect(cell.className).toContain("font-mono");
});

test("DS-68: a timestamp in a grid cell is not a tab stop", async () => {
  const { RelativeTime } = await import("./relative-time");
  const NOW = Date.UTC(2026, 8, 24, 12);
  await render(
    <DataGrid
      aria-label="Deals"
      columns={columns({
        render: (d: Deal) => (
          <RelativeTime date={NOW - d.amount * 60_000} now={NOW} />
        ),
      })}
      data={DEALS}
      getRowId={(d) => d.id}
    />,
  );
  const times = document.querySelectorAll("time");
  expect(times.length).toBe(3);
  for (const time of times) expect(time.getAttribute("tabindex")).toBeNull();
});

test("a group row shows its count as the shared muted count (DS-34)", async () => {
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
  const counts = [
    ...screen.container.querySelectorAll('[data-slot="section-row-count"]'),
  ].map((n) => n.textContent);
  expect(counts.sort()).toEqual(["1", "2"]);
  expect(screen.container.textContent).not.toContain("(2)");
  await expect
    .element(screen.getByRole("button", { name: "Open, 2 rows" }))
    .toBeInTheDocument();
});

test("virtualized keyboard edges mount and focus targets, retaining one tab stop after sort/filter", async () => {
  const many: Deal[] = Array.from({ length: 200 }, (_, index) => ({
    id: `v${index}`,
    name: `Row ${index}`,
    stage: "Open",
    amount: index,
  }));
  const style = document.createElement("style");
  style.textContent =
    '[data-slot="grid-viewport"] { max-height: 240px; overflow: auto; display: block; }';
  document.head.append(style);
  const grid = (data: Deal[]) => (
    <DataGrid
      aria-label="Virtual navigation"
      columns={columns()}
      data={data}
      getRowId={(row) => row.id}
      virtualize
      maxHeight="240px"
    />
  );
  try {
    const screen = await render(grid(many));
    screen.container
      .querySelector<HTMLElement>('[data-slot="data-grid-cell"][tabindex="0"]')!
      .focus();
    await userEvent.keyboard("{Control>}{End}{/Control}");
    await expect
      .poll(() =>
        document.activeElement
          ?.closest('[data-slot="data-grid-row"]')
          ?.getAttribute("aria-rowindex"),
      )
      .toBe("201");
    await userEvent.keyboard("{Control>}{Home}{/Control}");
    await expect
      .poll(() =>
        document.activeElement
          ?.closest('[data-slot="data-grid-row"]')
          ?.getAttribute("aria-rowindex"),
      )
      .toBe("2");
    // Sorting from the header moves the one tab stop to that header (the header row roves too).
    await screen.getByRole("button", { name: /Amount/ }).click();
    const stops = () =>
      screen.container.querySelectorAll('[role="grid"] [tabindex="0"]').length;
    expect(stops()).toBe(1);
    await screen.rerender(grid(many.slice(0, 3)));
    await expect.poll(stops).toBe(1);
  } finally {
    style.remove();
  }
});

test("Tab back into a grid returns to the cell that was active, after its row scrolled out of the window", async () => {
  const many: Deal[] = Array.from({ length: 200 }, (_, index) => ({
    id: `v${index}`,
    name: `Row ${index}`,
    stage: "Open",
    amount: index,
  }));
  const style = document.createElement("style");
  style.textContent =
    '[data-slot="grid-viewport"] { max-height: 240px; overflow: auto; display: block; }';
  document.head.append(style);
  try {
    const screen = await render(
      <>
        <DataGrid
          aria-label="Return"
          columns={columns()}
          data={many}
          getRowId={(row) => row.id}
          virtualize
          maxHeight="240px"
        />
        <button type="button">After</button>
      </>,
    );
    const cell = () =>
      document.activeElement?.closest<HTMLElement>("[data-grid-row]");
    screen.container
      .querySelector<HTMLElement>('[data-slot="data-grid-cell"][tabindex="0"]')!
      .focus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowRight}");
    await expect.poll(() => cell()?.dataset.gridRow).toBe("v2");
    const key = cell()!.dataset.gridKey;
    await userEvent.keyboard("{Tab}");
    await expect
      .element(screen.getByRole("button", { name: "After" }))
      .toHaveFocus();
    const viewport = screen.container.querySelector<HTMLElement>(
      '[data-slot="grid-viewport"]',
    )!;
    viewport.scrollTop = viewport.scrollHeight / 2;
    await expect
      .poll(() => screen.container.querySelector('[data-grid-row="v2"]'))
      .toBeNull();
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    await expect.poll(() => cell()?.dataset.gridRow).toBe("v2");
    expect(cell()?.dataset.gridKey).toBe(key);
  } finally {
    style.remove();
  }
});

// ── R2: the grid core at spreadsheet scale ─────────────────────────────────────────────────────

interface Wide {
  id: string;
  [key: string]: string;
}

function wideColumns(
  count: number,
  extra: Partial<DataGridColumn<Wide>> = {},
): DataGridColumn<Wide>[] {
  return Array.from({ length: count }, (_, index) => ({
    key: `c${index}`,
    header: `Col ${index}`,
    width: index === 0 ? 240 : 120,
    frozen: index === 0,
    ...extra,
  }));
}

function wideRows(rows: number, columns: number): Wide[] {
  return Array.from({ length: rows }, (_, r) => {
    const row: Wide = { id: `r${r}` };
    for (let c = 0; c < columns; c += 1) row[`c${c}`] = `R${r}C${c}`;
    return row;
  });
}

/** The grid's one viewport, given a real size (the harness has no compiled CSS). */
function sizeViewport(height = 300, width = 600): () => void {
  const style = document.createElement("style");
  style.textContent = `[data-slot="grid-viewport"] { max-height: ${height}px; max-width: ${width}px; overflow: auto; display: block; position: relative; }
  [data-slot="grid-viewport"] thead { position: sticky; top: 0; }
  .sticky { position: sticky; }
  .table-fixed { table-layout: fixed; }
  tr.h-8 { height: 32px; } tr.h-10 { height: 40px; } tr.h-20 { height: 80px; }
  thead tr { height: 40px; }`;
  document.head.append(style);
  return () => style.remove();
}

const activeCell = () => document.activeElement as HTMLElement | null;
const activeRowIndex = () =>
  activeCell()?.closest("tr")?.getAttribute("aria-rowindex") ?? null;
const activeColIndex = () =>
  activeCell()?.closest("td, th")?.getAttribute("aria-colindex") ?? null;

test("fixed layout: colgroup widths, frozen columns sticky at their offsets, primary cells are row headers", async () => {
  const cleanup = sizeViewport();
  try {
    const screen = await render(
      <DataGrid
        aria-label="Requests"
        columns={[
          { key: "c0", header: "Name", width: 240, frozen: true },
          { key: "c1", header: "Ref", width: 100, frozen: true },
          { key: "c2", header: "Qty", width: 120, numeric: true, align: "end" },
        ]}
        data={wideRows(3, 3)}
        getRowId={(row) => row.id}
        selectable
        columnPicker={false}
      />,
    );
    const table = screen.getByRole("grid").element() as HTMLTableElement;
    expect(table.getAttribute("data-layout")).toBe("fixed");
    expect(table.style.width).toBe("500px");
    const cols = Array.from(table.querySelectorAll("col")).map(
      (col) => col.style.width,
    );
    expect(cols).toEqual(["40px", "240px", "100px", "0px", "120px", "0px"]);
    const first = table.querySelector<HTMLElement>(
      '[data-grid-row="r0"][data-grid-key="c0"]',
    )!;
    const second = table.querySelector<HTMLElement>(
      '[data-grid-row="r0"][data-grid-key="c1"]',
    )!;
    expect(first.getAttribute("role")).toBe("rowheader");
    expect(second.getAttribute("role")).toBe("gridcell");
    expect(first.style.insetInlineStart).toBe("40px");
    expect(second.style.insetInlineStart).toBe("280px");
    expect(first.className).toContain("sticky");
    // Only the last frozen column carries the scroll-edge shadow.
    expect(second.className).toContain("in-data-scrolled-x:shadow-");
    expect(first.className).not.toContain("in-data-scrolled-x:shadow-");
    // The whole grid is one scroll box: the table is not wrapped in Table's own container.
    expect(table.closest('[data-slot="table-container"]')).toBeNull();
    expect(table.parentElement?.getAttribute("data-slot")).toBe(
      "grid-viewport",
    );
    await expectNoA11yViolations(screen.container);
  } finally {
    cleanup();
  }
});

test("the frozen edge's scroll cue is one attribute on the viewport, set when the scroll leaves 0", async () => {
  const cleanup = sizeViewport(300, 300);
  try {
    const screen = await render(
      <DataGrid
        aria-label="Requests"
        columns={wideColumns(12)}
        data={wideRows(5, 12)}
        getRowId={(row) => row.id}
        columnPicker={false}
      />,
    );
    const viewport = screen.container.querySelector<HTMLElement>(
      '[data-slot="grid-viewport"]',
    )!;
    expect(viewport.hasAttribute("data-scrolled-x")).toBe(false);
    viewport.scrollLeft = 200;
    await expect
      .poll(() => viewport.hasAttribute("data-scrolled-x"))
      .toBe(true);
    const frozen = viewport.querySelector<HTMLElement>(
      '[data-grid-row="r0"][data-grid-key="c0"]',
    )!;
    expect(frozen.getBoundingClientRect().left).toBe(
      viewport.getBoundingClientRect().left,
    );
    viewport.scrollLeft = 0;
    await expect
      .poll(() => viewport.hasAttribute("data-scrolled-x"))
      .toBe(false);
  } finally {
    cleanup();
  }
});

test("sortMode manual: the header only signals; the rows keep the host's order", async () => {
  const onSortChange = vi.fn();
  const screen = await render(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={DEALS}
      getRowId={(d) => d.id}
      sortMode="manual"
      onSortChange={onSortChange}
    />,
  );
  await screen.getByRole("button", { name: "Sort by Name" }).click();
  expect(onSortChange).toHaveBeenCalledWith([
    { key: "name", direction: "asc" },
  ]);
  await screen.getByRole("button", { name: "Sort by Amount" }).click();
  expect(bodyCellTexts(0)).toEqual(["Acme", "Globex", "Initech"]);
  expect(bodyCellTexts(2)).toEqual(["300", "100", "200"]);
});

test("the header row roves: ArrowUp from the body reaches it; Enter sorts; ArrowDown returns", async () => {
  const onSortChange = vi.fn();
  const screen = await render(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={DEALS}
      getRowId={(d) => d.id}
      sortMode="manual"
      onSortChange={onSortChange}
    />,
  );
  (
    screen.container.querySelector(
      '[data-slot="data-grid-cell"][tabindex="0"]',
    ) as HTMLElement
  ).focus();
  await userEvent.keyboard("{ArrowRight}{ArrowUp}");
  expect(activeCell()?.getAttribute("role")).toBe("columnheader");
  expect(activeCell()?.textContent).toContain("Stage");
  // The sort buttons are not tab stops of their own: the grid is one stop.
  expect(
    screen.container.querySelectorAll('[role="grid"] [tabindex="0"]'),
  ).toHaveLength(1);
  await userEvent.keyboard("{Enter}");
  expect(onSortChange).toHaveBeenCalledWith([
    { key: "stage", direction: "asc" },
  ]);
  await userEvent.keyboard("{ArrowDown}");
  expect(activeRowIndex()).toBe("2");
  expect(activeColIndex()).toBe("2");
});

test("a header menu opens from Enter or Shift+F10 on the focused header and is axe-clean", async () => {
  const onPick = vi.fn();
  const screen = await render(
    <DataGrid
      aria-label="Deals"
      columns={columns({
        headerMenu: (
          <>
            <DropdownMenuItem onClick={onPick}>Hide field</DropdownMenuItem>
            <DropdownMenuItem>Sort descending</DropdownMenuItem>
          </>
        ),
      })}
      data={DEALS}
      getRowId={(d) => d.id}
    />,
  );
  const header = screen.container.querySelector<HTMLElement>(
    '[data-grid-row][data-grid-key="amount"][role="columnheader"]',
  )!;
  header.focus();
  await userEvent.keyboard("{Enter}");
  await expect
    .element(screen.getByRole("menuitem", { name: "Hide field" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body);
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => document.querySelector('[role="menu"]')).toBeNull();
  header.focus();
  await userEvent.keyboard("{Shift>}{F10}{/Shift}");
  await screen.getByRole("menuitem", { name: "Hide field" }).click();
  expect(onPick).toHaveBeenCalledTimes(1);
  // The chevron is a mouse affordance, not another tab stop.
  expect(
    screen.container
      .querySelector('[data-slot="data-grid-head-menu"]')
      ?.getAttribute("tabindex"),
  ).toBe("-1");
});

test("resize: the header's separator, Alt+arrows on the focused header, and the new width at once", async () => {
  const onColumnResize = vi.fn();
  const screen = await render(
    <DataGrid
      aria-label="Requests"
      columns={[
        { key: "c0", header: "Name", width: 240 },
        { key: "c1", header: "Qty", width: 120 },
      ]}
      data={wideRows(2, 2)}
      getRowId={(row) => row.id}
      onColumnResize={onColumnResize}
      columnPicker={false}
    />,
  );
  const handles = screen.container.querySelectorAll('[role="separator"]');
  expect(handles).toHaveLength(2);
  expect(handles[1]!.getAttribute("aria-label")).toBe("Resize Qty");
  expect(handles[1]!.getAttribute("aria-valuenow")).toBe("120");
  const qty = screen.container.querySelector<HTMLElement>(
    'th[data-grid-key="c1"]',
  )!;
  qty.focus();
  await userEvent.keyboard("{Alt>}{ArrowRight}{/Alt}");
  expect(onColumnResize).toHaveBeenLastCalledWith("c1", 128);
  await userEvent.keyboard("{Alt>}{Shift>}{ArrowRight}{/Shift}{/Alt}");
  expect(onColumnResize).toHaveBeenLastCalledWith("c1", 160);
  const cols = screen.container.querySelectorAll("col");
  expect((cols[2] as HTMLElement).style.width).toBe("160px");
  // Alt+arrow resized; it did not move focus.
  expect(activeCell()).toBe(qty);
  await expectNoA11yViolations(screen.container);
});

test("focus is kept by row id and column key: a refetch that moves the row keeps the tab stop on it", async () => {
  const screen = await render(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={DEALS}
      getRowId={(d) => d.id}
      sortMode="manual"
    />,
  );
  const cell = screen.container.querySelector<HTMLElement>(
    '[data-grid-row="d3"][data-grid-key="stage"]',
  )!;
  cell.focus();
  await screen.rerender(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={[
        DEALS[2]!,
        { id: "d4", name: "Umbrella", stage: "Won", amount: 50 },
        DEALS[0]!,
        DEALS[1]!,
      ]}
      getRowId={(d) => d.id}
      sortMode="manual"
    />,
  );
  const stop = screen.container.querySelector<HTMLElement>(
    '[role="grid"] [tabindex="0"]',
  )!;
  expect(stop.dataset.gridRow).toBe("d3");
  expect(stop.dataset.gridKey).toBe("stage");
  expect(stop.closest("tr")?.getAttribute("aria-rowindex")).toBe("2");
});

test("Tab back into a grid returns to its active header column after it scrolled out; a host's focus stays put", async () => {
  const cleanup = sizeViewport(300, 600);
  try {
    const screen = await render(
      <>
        <DataGrid
          aria-label="Wide return"
          columns={wideColumns(60)}
          data={wideRows(200, 60)}
          getRowId={(row) => row.id}
          virtualize
          virtualizeColumns
          rowHeight="short"
          maxHeight="300px"
          columnPicker={false}
        />
        <button
          type="button"
          // A focus trap that wraps Tab back to the grid a few frames later (a dialog's guard).
          onKeyDown={(event) => {
            if (event.key !== "Tab" || event.shiftKey) return;
            event.preventDefault();
            window.setTimeout(
              () =>
                document
                  .querySelector<HTMLElement>('[role="grid"] [tabindex="0"]')
                  ?.focus(),
              50,
            );
          }}
        >
          After
        </button>
      </>,
    );
    const grid = screen.getByRole("grid").element() as HTMLElement;
    const viewport = grid.parentElement!;
    const at = () => {
      const cell =
        document.activeElement?.closest<HTMLElement>("[data-grid-row]");
      return cell ? `${cell.dataset.gridRow}:${cell.dataset.gridKey}` : null;
    };
    // A header column, then Tab out, scroll it away sideways and Shift+Tab back.
    (
      grid.querySelector(
        '[data-slot="data-grid-cell"][tabindex="0"]',
      ) as HTMLElement
    ).focus();
    await userEvent.keyboard("{ArrowUp}{ArrowRight}");
    await expect.poll(at).toMatch(/:c1$/);
    const header = at();
    await userEvent.keyboard("{Tab}");
    viewport.scrollLeft = 4000;
    await expect
      .poll(() => grid.querySelector('[data-grid-key="c1"]'))
      .toBeNull();
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    await expect.poll(at).toBe(header);
    // Wrapped back by a trap a few frames after the key: still the active column.
    await userEvent.keyboard("{Tab}");
    viewport.scrollLeft = 4000;
    await expect
      .poll(() => grid.querySelector('[data-grid-key="c1"]'))
      .toBeNull();
    await userEvent.keyboard("{Tab}");
    await expect.poll(at).toBe(header);
    // A host focusing another cell just after a Tab (a panel closing after its save) keeps it.
    await userEvent.click(screen.getByRole("button", { name: "After" }));
    viewport.scrollLeft = 4000;
    await expect
      .poll(() => grid.querySelector('[data-grid-key="c1"]'))
      .toBeNull();
    const other = [
      ...grid.querySelectorAll<HTMLElement>(
        'tbody [data-slot="data-grid-cell"]',
      ),
    ].find((node) => node.tabIndex === -1)!;
    const otherAt = `${other.dataset.gridRow}:${other.dataset.gridKey}`;
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", bubbles: true }),
    );
    other.focus();
    await new Promise((resolve) => window.setTimeout(resolve, 100));
    expect(at()).toBe(otherAt);
    // A host focusing the stand-in tab stop itself (after a press elsewhere) keeps focus there.
    await userEvent.click(screen.getByRole("button", { name: "After" }));
    viewport.scrollLeft = 4000;
    await expect
      .poll(() => grid.querySelector('[data-grid-key="c1"]'))
      .toBeNull();
    const standIn = grid.querySelector<HTMLElement>('[tabindex="0"]')!;
    const chosen = `${standIn.closest<HTMLElement>("[data-grid-row]")!.dataset.gridRow}:${standIn.closest<HTMLElement>("[data-grid-row]")!.dataset.gridKey}`;
    standIn.focus();
    await new Promise((resolve) => window.setTimeout(resolve, 100));
    expect(at()).toBe(chosen);
  } finally {
    cleanup();
  }
});

test("column virtualisation: 150 columns render a window, aria-colcount is the true total, End reaches the last", async () => {
  const cleanup = sizeViewport(300, 600);
  try {
    const screen = await render(
      <DataGrid
        aria-label="Wide"
        columns={wideColumns(150)}
        data={wideRows(30, 150)}
        getRowId={(row) => row.id}
        virtualize
        virtualizeColumns
        rowHeight="short"
        maxHeight="300px"
        columnPicker={false}
      />,
    );
    const grid = screen.getByRole("grid").element() as HTMLElement;
    expect(grid.getAttribute("aria-colcount")).toBe("150");
    await expect
      .poll(() => grid.querySelectorAll('thead [role="columnheader"]').length)
      .toBeLessThan(15);
    const firstRow = grid.querySelector('tbody tr[data-slot="data-grid-row"]')!;
    // Every row renders the frozen cells, two spacers and the window — never 150 cells.
    expect(firstRow.querySelectorAll("td").length).toBeLessThan(20);
    (
      grid.querySelector(
        '[data-slot="data-grid-cell"][tabindex="0"]',
      ) as HTMLElement
    ).focus();
    await userEvent.keyboard("{End}");
    await expect.poll(activeColIndex).toBe("150");
    expect(activeCell()?.textContent).toBe("R0C149");
    await userEvent.keyboard("{Home}");
    await expect.poll(activeColIndex).toBe("1");
    // A tab stop survives the window moving on: exactly one, always.
    const viewport = grid.parentElement!;
    viewport.scrollLeft = 6000;
    await expect
      .poll(() => grid.querySelectorAll('[tabindex="0"]').length)
      .toBe(1);
  } finally {
    cleanup();
  }
});

test("virtualised rows: PageDown moves a screen, Ctrl+ArrowDown reaches the data edge, rows are counted truly", async () => {
  const cleanup = sizeViewport(320, 800);
  try {
    const screen = await render(
      <DataGrid
        aria-label="Many"
        columns={wideColumns(3)}
        data={wideRows(500, 3)}
        getRowId={(row) => row.id}
        virtualize
        rowHeight="short"
        maxHeight="320px"
        ariaRowCount={50_001}
        columnPicker={false}
      />,
    );
    const grid = screen.getByRole("grid").element() as HTMLElement;
    expect(grid.getAttribute("aria-rowcount")).toBe("50001");
    expect(
      grid.querySelectorAll('[data-slot="data-grid-row"]').length,
    ).toBeLessThan(40);
    // Fixed heights: every row is exactly the preset.
    const row = grid.querySelector<HTMLElement>('[data-slot="data-grid-row"]')!;
    expect(row.className).toContain("h-8");
    (
      grid.querySelector(
        '[data-slot="data-grid-cell"][tabindex="0"]',
      ) as HTMLElement
    ).focus();
    await userEvent.keyboard("{PageDown}");
    const afterPage = Number(activeRowIndex());
    expect(afterPage).toBeGreaterThan(4);
    await userEvent.keyboard("{Control>}{ArrowDown}{/Control}");
    await expect.poll(activeRowIndex).toBe("501");
    await userEvent.keyboard("{Control>}{ArrowUp}{/Control}");
    await expect.poll(activeRowIndex).toBe("2");
  } finally {
    cleanup();
  }
});

test("host sections flatten into the row virtualiser: group rows, each group's own load-more, collapse", async () => {
  const cleanup = sizeViewport(300, 800);
  const rows = wideRows(300, 2);
  const onMoreB = vi.fn();
  function Harness({ collapsed }: { collapsed?: boolean }) {
    return (
      <DataGrid
        aria-label="Grouped"
        columns={wideColumns(2)}
        data={rows}
        getRowId={(row) => row.id}
        sortMode="manual"
        sections={[
          {
            id: "a",
            label: "Open",
            count: 100,
            rowIds: rows.slice(0, 100).map((r) => r.id),
          },
          {
            id: "b",
            label: "Won",
            count: 900,
            rowIds: rows.slice(100, 300).map((r) => r.id),
            loadMore: { hasMore: true, onLoadMore: onMoreB },
          },
        ]}
        groupState={collapsed ? { a: "collapsed" } : undefined}
        virtualize
        rowHeight="short"
        maxHeight="300px"
        columnPicker={false}
      />
    );
  }
  try {
    const screen = await render(<Harness />);
    const grid = screen.getByRole("grid").element() as HTMLElement;
    // Grouping no longer turns virtualisation off: a window of rows, not 300.
    expect(
      grid.querySelectorAll('[data-slot="data-grid-row"]').length,
    ).toBeLessThan(40);
    expect(grid.getAttribute("aria-rowcount")).toBe("-1");
    await expect
      .element(screen.getByRole("button", { name: /Open.*100 rows/s }))
      .toBeInTheDocument();
    // Scrolling to the end of group b mounts its load-more row, which requests b's next page.
    const viewport = grid.parentElement!;
    viewport.scrollTop = viewport.scrollHeight;
    await expect
      .poll(() => grid.querySelector('[data-slot="data-grid-group-more"]'))
      .not.toBeNull();
    await expect.poll(() => onMoreB.mock.calls.length).toBeGreaterThan(0);
    await screen.rerender(<Harness collapsed />);
    viewport.scrollTop = 0;
    await expect
      .poll(() =>
        grid
          .querySelector('[data-slot="data-grid-row"]')
          ?.getAttribute("aria-rowindex"),
      )
      .toBe("4");
    // Group rows are on the roving path: ArrowUp from the first row lands on its group header.
    // With nothing focused yet, the first item — the collapsed group's header — holds the tab stop.
    expect(
      grid.querySelector('[tabindex="0"]')?.getAttribute("data-slot"),
    ).toBe("section-toggle");
    (
      grid.querySelector(
        '[data-grid-row="r100"][data-grid-key="c0"]',
      ) as HTMLElement
    ).focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(activeCell()?.getAttribute("data-slot")).toBe("section-toggle");
    expect(activeCell()?.textContent).toContain("Won");
    await expectNoA11yViolations(screen.container);
  } finally {
    cleanup();
  }
});

test("summary row: a sticky footer of host values; the footer is the last row on the roving path", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <DataGrid
      aria-label="Requests"
      columns={[
        { key: "c0", header: "Name", width: 240 },
        {
          key: "c1",
          header: "Qty",
          width: 120,
          summaryOptions: [
            { value: "sum", label: "Sum" },
            { value: "avg", label: "Average" },
          ],
        },
      ]}
      data={wideRows(2, 2)}
      getRowId={(row) => row.id}
      columnPicker={false}
      summaryRow={{
        label: "2 rows",
        value: { c1: "sum" },
        onValueChange,
        results: { c1: "830" },
      }}
    />,
  );
  const grid = screen.getByRole("grid").element() as HTMLElement;
  const foot = grid.querySelector("tfoot")!;
  expect(foot.className).toContain("sticky");
  expect(foot.textContent).toContain("2 rows");
  await expect
    .poll(
      () =>
        screen.getByRole("combobox", { name: "Sum of Qty" }).element()
          .textContent,
    )
    .toContain("Sum830");
  // The row count counts the summary row.
  expect(grid.getAttribute("aria-rowcount")).toBe("4");
  (
    grid.querySelector(
      '[data-slot="data-grid-cell"][tabindex="0"]',
    ) as HTMLElement
  ).focus();
  await userEvent.keyboard("{ArrowRight}{ArrowDown}{ArrowDown}");
  // The footer CELL roves; the picker opens from it, so the arrows keep moving between rows.
  expect(activeCell()?.dataset.gridRow).toBe("\uE000footer");
  expect(activeCell()?.dataset.gridKey).toBe("c1");
  await userEvent.keyboard("{ArrowUp}");
  expect(activeCell()?.dataset.gridRow).toBe("r1");
  await userEvent.keyboard("{ArrowDown}{Enter}");
  await screen.getByRole("option", { name: "Average" }).click();
  expect(onValueChange).toHaveBeenCalledWith("c1", "avg");
  await expect.poll(() => activeCell()?.dataset.gridKey).toBe("c1");
  await expectNoA11yViolations(screen.container);
});

test("type-to-edit replaces the value; Enter commits and moves down, Tab commits and moves right", async () => {
  const onCellCommit = vi.fn();
  const screen = await render(
    <DataGrid
      aria-label="Deals"
      columns={[
        { key: "name", header: "Name", editable: { type: "text" } },
        { key: "stage", header: "Stage", editable: { type: "text" } },
      ]}
      data={DEALS}
      getRowId={(d) => d.id}
      sortMode="manual"
      onCellCommit={onCellCommit}
    />,
  );
  (
    screen.container.querySelector(
      '[data-grid-row="d1"][data-grid-key="name"]',
    ) as HTMLElement
  ).focus();
  await userEvent.keyboard("Z");
  const field = screen.getByRole("textbox");
  await expect.element(field).toHaveValue("Z");
  expect(document.activeElement?.tagName).toBe("INPUT");
  await userEvent.keyboard("ed");
  await expect.element(field).toHaveValue("Zed");
  await userEvent.keyboard("{Enter}");
  expect(onCellCommit).toHaveBeenLastCalledWith(DEALS[0], "name", "Zed");
  await expect.poll(() => activeCell()?.dataset.gridRow).toBe("d2");
  expect(activeCell()?.dataset.gridKey).toBe("name");
  await userEvent.keyboard("{F2}{Tab}");
  await expect.poll(() => activeCell()?.dataset.gridKey).toBe("stage");
  expect(activeCell()?.dataset.gridRow).toBe("d2");
});

test("IME: a composing keystroke never moves, commits or opens an editor", async () => {
  const screen = await render(
    <DataGrid
      aria-label="Deals"
      columns={columns({ editable: { type: "text" } })}
      data={DEALS}
      getRowId={(d) => d.id}
    />,
  );
  const cell = screen.container.querySelector<HTMLElement>(
    '[data-slot="data-grid-cell"][tabindex="0"]',
  )!;
  cell.focus();
  for (const key of ["ArrowDown", "Enter", "a"])
    cell.dispatchEvent(
      new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
        isComposing: true,
      }),
    );
  expect(activeCell()).toBe(cell);
  expect(screen.container.querySelector("input")).toBeNull();
});

test("a cell menu opens on Shift+F10 at the focused cell and returns focus when it closes", async () => {
  const screen = await render(
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={DEALS}
      getRowId={(d) => d.id}
      cellMenu={(rowId, key) =>
        key === "stage" ? (
          <ContextMenuItem>{`Copy ${rowId}`}</ContextMenuItem>
        ) : null
      }
    />,
  );
  const cell = screen.container.querySelector<HTMLElement>(
    '[data-grid-row="d2"][data-grid-key="stage"]',
  )!;
  cell.focus();
  await userEvent.keyboard("{Shift>}{F10}{/Shift}");
  await expect
    .element(screen.getByRole("menuitem", { name: "Copy d2" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body);
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => document.querySelector('[role="menu"]')).toBeNull();
  await expect.poll(activeCell).toBe(cell);
});

test("paged mode: no row windowing, a CursorPager under the grid, true row indexes from the offset", async () => {
  const onNext = vi.fn();
  const screen = await render(
    <DataGrid
      aria-label="Paged"
      columns={columns()}
      data={DEALS}
      getRowId={(d) => d.id}
      virtualize
      maxHeight="200px"
      ariaRowIndexOffset={100}
      ariaRowCount={1001}
      pagedMode={{
        label: "Rows 101–103",
        hasPrevious: true,
        hasNext: true,
        onPrevious: () => {},
        onNext,
      }}
    />,
  );
  expect(
    screen.container.querySelector('[data-slot="data-grid-virtual-pad"]'),
  ).toBeNull();
  expect(
    screen.container
      .querySelector('[data-slot="data-grid-row"]')
      ?.getAttribute("aria-rowindex"),
  ).toBe("102");
  await screen.getByRole("button", { name: "Next" }).click();
  expect(onNext).toHaveBeenCalledTimes(1);
  await expectNoA11yViolations(screen.container);
});

test("headerTrailing renders after the last column; reorder makes scrolling headers draggable", async () => {
  const onColumnReorder = vi.fn();
  const screen = await render(
    <DataGrid
      aria-label="Requests"
      columns={wideColumns(4)}
      data={wideRows(2, 4)}
      getRowId={(row) => row.id}
      headerTrailing={(focus) => (
        <Button
          {...focus}
          size="icon-sm"
          variant="ghost"
          aria-label="Add field"
        >
          +
        </Button>
      )}
      onColumnReorder={onColumnReorder}
      columnPicker={false}
    />,
  );
  const headRow = screen.container.querySelector("thead tr")!;
  expect(headRow.lastElementChild?.getAttribute("data-slot")).toBe(
    "data-grid-head-trailing",
  );
  const add = screen
    .getByRole("button", { name: "Add field" })
    .element() as HTMLElement;
  // The trailing control joins the header row's roving focus: not a second tab stop.
  expect(add.getAttribute("tabindex")).toBe("-1");
  (headRow.querySelector('[data-grid-key="c3"]') as HTMLElement).focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(activeCell()).toBe(add);
  expect(
    screen.container.querySelectorAll('[role="grid"] [tabindex="0"]'),
  ).toHaveLength(1);
  await userEvent.keyboard("{ArrowDown}");
  expect(activeCell()?.dataset.gridKey).toBe("c3");
  // Frozen headers stay put; the scrolling ones are drag items.
  expect(
    headRow
      .querySelector('[data-grid-key="c0"]')
      ?.hasAttribute("data-drag-item"),
  ).toBe(false);
  expect(
    headRow
      .querySelector('[data-grid-key="c2"]')
      ?.getAttribute("data-drag-item"),
  ).toBe("c2");
  await expectNoA11yViolations(screen.container);
});

test("a refetch that moves the focused row out of the window brings focus back to it", async () => {
  const cleanup = sizeViewport(300, 800);
  const rows = wideRows(400, 2);
  const grid = (data: Wide[]) => (
    <DataGrid
      aria-label="Refetch"
      columns={wideColumns(2)}
      data={data}
      getRowId={(row) => row.id}
      sortMode="manual"
      virtualize
      rowHeight="short"
      maxHeight="300px"
      columnPicker={false}
    />
  );
  try {
    const screen = await render(grid(rows));
    (
      screen.container.querySelector(
        '[data-grid-row="r2"][data-grid-key="c1"]',
      ) as HTMLElement
    ).focus();
    // r2 moves to the end: its cell unmounts; focus follows the row, not the node.
    await screen.rerender(
      grid([...rows.filter((r) => r.id !== "r2"), rows[2]!]),
    );
    await expect.poll(() => activeCell()?.dataset.gridRow).toBe("r2");
    expect(activeCell()?.dataset.gridKey).toBe("c1");
    expect(activeRowIndex()).toBe("401");
  } finally {
    cleanup();
  }
});

test("double-click on a resize handle fits the column to its content, shrinking it too", async () => {
  const onColumnResize = vi.fn();
  const screen = await render(
    <DataGrid
      aria-label="Fit"
      columns={[
        { key: "c0", header: "Name", width: 240 },
        { key: "c1", header: "Q", width: 400 },
      ]}
      data={[{ id: "r0", c0: "Acme", c1: "7" }]}
      getRowId={(row) => row.id}
      onColumnResize={onColumnResize}
      columnPicker={false}
    />,
  );
  const handle = screen.container.querySelectorAll('[role="separator"]')[1]!;
  handle.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
  expect(onColumnResize).toHaveBeenCalledTimes(1);
  const [key, width] = onColumnResize.mock.calls[0]!;
  expect(key).toBe("c1");
  expect(width).toBeLessThan(120);
});

test("a refetch that empties the grid hands focus to the header that is left", async () => {
  const grid = (data: Deal[]) => (
    <DataGrid
      aria-label="Deals"
      columns={columns()}
      data={data}
      getRowId={(d) => d.id}
    />
  );
  const screen = await render(grid(DEALS));
  (
    screen.container.querySelector(
      '[data-grid-row="d2"][data-grid-key="stage"]',
    ) as HTMLElement
  ).focus();
  await screen.rerender(grid([]));
  await expect
    .poll(() => activeCell()?.getAttribute("role"))
    .toBe("columnheader");
  expect(activeCell()?.dataset.gridKey).toBe("stage");
});

// ── R3: cells mode — ranges, clipboard, fill, batch commit ─────────────────────────────────────

function cellsGrid(
  props: Partial<React.ComponentProps<typeof DataGrid<Deal>>> = {},
) {
  return (
    <DataGrid<Deal>
      aria-label="Deals"
      columns={[
        { key: "name", header: "Name", editable: { type: "text" } },
        { key: "stage", header: "Stage", editable: { type: "text" } },
        {
          key: "amount",
          header: "Amount",
          align: "end",
          parse: (cell) => cell.number ?? Number(cell.text.replace(/,/g, "")),
        },
      ]}
      data={DEALS}
      getRowId={(d) => d.id}
      sortMode="manual"
      selectionMode="cells"
      {...props}
    />
  );
}

const statusText = (root: HTMLElement) =>
  [...root.querySelectorAll('[role="status"]')]
    .map((node) => node.textContent)
    .join(" | ");
const cellAt = (rowId: string, key: string) =>
  document.querySelector<HTMLElement>(
    `[data-grid-row="${rowId}"][data-grid-key="${key}"]`,
  )!;
const inRange = () =>
  [...document.querySelectorAll<HTMLElement>("[data-in-range]")].map(
    (cell) => `${cell.dataset.gridRow}:${cell.dataset.gridKey}`,
  );

function clipboardEvent(
  type: "copy" | "cut" | "paste",
  data: Record<string, string> = {},
) {
  const transfer = new DataTransfer();
  for (const [mime, value] of Object.entries(data))
    transfer.setData(mime, value);
  return new ClipboardEvent(type, {
    clipboardData: transfer,
    bubbles: true,
    cancelable: true,
  });
}

test("cells mode: Shift+arrows and Shift+click extend a range by id; a plain move collapses it", async () => {
  const screen = await render(cellsGrid());
  cellAt("d1", "name").focus();
  await userEvent.keyboard("{Shift>}{ArrowDown}{ArrowRight}{/Shift}");
  expect(inRange()).toEqual(["d1:name", "d1:stage", "d2:name", "d2:stage"]);
  expect(cellAt("d2", "stage").getAttribute("aria-selected")).toBe("true");
  expect(cellAt("d3", "name").getAttribute("aria-selected")).toBe("false");
  await expect
    .poll(() => statusText(screen.container))
    .toContain("2 by 2 cells selected");
  await userEvent.keyboard("{ArrowDown}");
  expect(inRange()).toEqual(["d3:stage"]);
  await userEvent.click(cellAt("d1", "name"));
  await userEvent.click(cellAt("d3", "amount"), { modifiers: ["Shift"] });
  expect(inRange()).toHaveLength(9);
  await expectNoA11yViolations(screen.container);
});

test("cells mode: Shift+Space a row, Ctrl+Space a column, ⌘/Ctrl+A all, Escape back to one cell", async () => {
  await render(cellsGrid());
  cellAt("d2", "stage").focus();
  await userEvent.keyboard("{Shift>} {/Shift}");
  expect(inRange()).toEqual(["d2:name", "d2:stage", "d2:amount"]);
  await userEvent.keyboard("{Control>} {/Control}");
  expect(inRange()).toEqual(["d1:stage", "d2:stage", "d3:stage"]);
  await userEvent.keyboard("{Control>}a{/Control}");
  expect(inRange()).toHaveLength(9);
  await userEvent.keyboard("{Escape}");
  expect(inRange()).toEqual(["d2:stage"]);
});

test("copy writes the range as TSV and HTML; only the loaded rows", async () => {
  await render(cellsGrid());
  cellAt("d1", "name").focus();
  await userEvent.keyboard("{Shift>}{ArrowDown}{ArrowRight}{/Shift}");
  const event = clipboardEvent("copy");
  cellAt("d2", "stage").dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  expect(event.clipboardData!.getData("text/plain")).toBe(
    "Acme\tOpen\nGlobex\tWon",
  );
  expect(event.clipboardData!.getData("text/html")).toContain(
    "<td>Globex</td>",
  );
});

test("paste: one batch to onCellsCommit, typed through parse, read-only cells skipped and counted", async () => {
  const onCellsCommit = vi.fn(async (changes: unknown[]) =>
    changes.map(() => ({
      status: "ok" as const,
      value: null,
      version: 1,
      changeId: "c",
    })),
  );
  const screen = await render(
    cellsGrid({
      onCellsCommit,
      columns: [
        { key: "name", header: "Name", editable: { type: "text" } },
        { key: "stage", header: "Stage" },
        {
          key: "amount",
          header: "Amount",
          parse: (cell) => cell.number ?? Number(cell.text),
        },
      ],
    }),
  );
  cellAt("d1", "name").focus();
  cellAt("d1", "name").dispatchEvent(
    clipboardEvent("paste", { "text/plain": "Zed\tWon\t12\nYak\tLost\t7" }),
  );
  await expect.poll(() => onCellsCommit.mock.calls.length).toBe(1);
  expect(onCellsCommit.mock.calls[0]![0]).toEqual([
    { rowId: "d1", key: "name", value: "Zed", previous: "Acme" },
    { rowId: "d1", key: "amount", value: 12, previous: 300 },
    { rowId: "d2", key: "name", value: "Yak", previous: "Globex" },
    { rowId: "d2", key: "amount", value: 7, previous: 100 },
  ]);
  // The pasted block becomes the range; the result is announced.
  expect(inRange()).toHaveLength(6);
  await expect
    .poll(() => statusText(screen.container))
    .toContain("Pasted 4 cells · 2 skipped");
});

test("paste: one value fills the range; rows past the last loaded row go to onPasteOverflow", async () => {
  const onCellsCommit = vi.fn(async (changes: unknown[]) =>
    changes.map(() => ({ status: "invalid" as const, reason: "x" })),
  );
  const onPasteOverflow = vi.fn();
  await render(cellsGrid({ onCellsCommit, onPasteOverflow }));
  cellAt("d1", "stage").focus();
  await userEvent.keyboard("{Shift>}{ArrowDown}{ArrowDown}{/Shift}");
  cellAt("d3", "stage").dispatchEvent(
    clipboardEvent("paste", { "text/plain": "Won" }),
  );
  await expect.poll(() => onCellsCommit.mock.calls.length).toBe(1);
  expect(onCellsCommit.mock.calls[0]![0]).toHaveLength(3);
  cellAt("d3", "stage").focus();
  await userEvent.keyboard("{Escape}");
  cellAt("d3", "stage").dispatchEvent(
    clipboardEvent("paste", { "text/plain": "a\nb\nc" }),
  );
  await expect.poll(() => onPasteOverflow.mock.calls.length).toBe(1);
  expect(onPasteOverflow.mock.calls[0]![0]).toEqual({
    matrix: [[{ text: "b" }], [{ text: "c" }]],
    keys: ["stage"],
    afterRowId: "d3",
  });
});

test("a paste into an open editor is the editor's; Delete clears the range in one batch", async () => {
  const onCellsCommit = vi.fn(async (changes: unknown[]) =>
    changes.map(() => ({
      status: "ok" as const,
      value: null,
      version: 1,
      changeId: "c",
    })),
  );
  await render(cellsGrid({ onCellsCommit }));
  cellAt("d1", "name").focus();
  await userEvent.keyboard("{F2}");
  const field = document.querySelector("input")!;
  field.dispatchEvent(clipboardEvent("paste", { "text/plain": "x\ty" }));
  expect(onCellsCommit).not.toHaveBeenCalled();
  await userEvent.keyboard("{Escape}");
  await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}{Delete}");
  await expect.poll(() => onCellsCommit.mock.calls.length).toBe(1);
  expect(onCellsCommit.mock.calls[0]![0]).toEqual([
    { rowId: "d1", key: "name", value: null, previous: "Acme" },
    { rowId: "d1", key: "stage", value: null, previous: "Open" },
  ]);
});

test("⌘/Ctrl+D fills down through the range; undo and redo keys reach the host", async () => {
  const onFill = vi.fn();
  const onUndo = vi.fn();
  const onRedo = vi.fn();
  await render(cellsGrid({ onFill, onUndo, onRedo }));
  cellAt("d1", "stage").focus();
  await userEvent.keyboard(
    "{Shift>}{ArrowDown}{ArrowDown}{/Shift}{Control>}d{/Control}",
  );
  expect(onFill).toHaveBeenCalledWith({
    source: { rowIds: ["d1"], keys: ["stage"] },
    target: { rowIds: ["d2", "d3"], keys: ["stage"] },
    series: false,
  });
  await userEvent.keyboard(
    "{Control>}z{/Control}{Control>}{Shift>}z{/Shift}{/Control}{Control>}y{/Control}",
  );
  expect(onUndo).toHaveBeenCalledTimes(1);
  expect(onRedo).toHaveBeenCalledTimes(2);
  // The range's bottom-right cell carries the fill handle.
  expect(
    cellAt("d3", "stage").querySelector('[data-slot="data-grid-fill-handle"]'),
  ).not.toBeNull();
});

test("the fill handle drags down and reports the rows it covered; Alt continues a series", async () => {
  const onFill = vi.fn();
  await render(cellsGrid({ onFill }));
  await userEvent.click(cellAt("d1", "amount"));
  const handle = cellAt("d1", "amount").querySelector<HTMLElement>(
    '[data-slot="data-grid-fill-handle"]',
  )!;
  handle.dispatchEvent(
    new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 3 }),
  );
  const target = cellAt("d3", "amount").getBoundingClientRect();
  window.dispatchEvent(
    new PointerEvent("pointermove", {
      pointerId: 3,
      clientX: target.left + 4,
      clientY: target.top + 4,
    }),
  );
  await expect
    .poll(() => cellAt("d2", "amount").hasAttribute("data-fill-target"))
    .toBe(true);
  window.dispatchEvent(
    new PointerEvent("pointerup", { pointerId: 3, altKey: true }),
  );
  expect(onFill).toHaveBeenCalledWith({
    source: { rowIds: ["d1"], keys: ["amount"] },
    target: { rowIds: ["d2", "d3"], keys: ["amount"] },
    series: true,
  });
});

test("a remote change pulses its cell, shows its author, and is announced only when focused", async () => {
  const at = Date.now();
  const screen = await render(cellsGrid());
  cellAt("d2", "stage").focus();
  await screen.rerender(
    cellsGrid({
      remoteChanges: new Map([
        [
          gridCellKey("d2", "stage"),
          {
            by: <span>AR</span>,
            at,
            announcement: "Asha changed Stage to Won",
          },
        ],
        [
          gridCellKey("d1", "name"),
          { by: <span>BK</span>, at, announcement: "Ben changed Name" },
        ],
      ]),
    }),
  );
  expect(cellAt("d2", "stage").querySelector(".motion-flash")).not.toBeNull();
  expect(
    cellAt("d2", "stage").querySelector('[data-slot="data-grid-remote"]')
      ?.textContent,
  ).toBe("AR");
  await expect
    .poll(() => statusText(screen.container))
    .toContain("Asha changed Stage to Won");
  expect(statusText(screen.container)).not.toContain("Ben changed");
  // The cue is brief.
  await expect
    .poll(
      () =>
        cellAt("d2", "stage").querySelector('[data-slot="data-grid-remote"]'),
      {
        timeout: 3000,
      },
    )
    .toBeNull();
});

test("IME: a composing Shift+Arrow never extends the range", async () => {
  await render(cellsGrid());
  const cell = cellAt("d1", "name");
  cell.focus();
  cell.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "ArrowDown",
      shiftKey: true,
      bubbles: true,
      isComposing: true,
    }),
  );
  expect(inRange()).toEqual([]);
});

test("cells mode: after an edit's Enter moves down, Delete clears the new cell, not the old one", async () => {
  const onCellsCommit = vi.fn(async (changes: unknown[]) =>
    changes.map(() => ({
      status: "ok" as const,
      value: null,
      version: 1,
      changeId: "c",
    })),
  );
  await render(cellsGrid({ onCellsCommit, onCellCommit: () => {} }));
  await userEvent.click(cellAt("d1", "name"));
  await userEvent.keyboard("{F2}x{Enter}");
  await expect.poll(() => activeCell()?.dataset.gridRow).toBe("d2");
  await userEvent.keyboard("{Delete}");
  await expect.poll(() => onCellsCommit.mock.calls.length).toBe(1);
  expect(onCellsCommit.mock.calls[0]![0]).toEqual([
    { rowId: "d2", key: "name", value: null, previous: "Globex" },
  ]);
});

test("cells mode: a fill leaves read-only columns out; a failed batch is announced, not thrown", async () => {
  const onFill = vi.fn();
  const onCellsCommit = vi.fn(async () => {
    throw new Error("offline");
  });
  const screen = await render(
    cellsGrid({
      onFill,
      onCellsCommit,
      columns: [
        { key: "name", header: "Name", editable: { type: "text" } },
        { key: "stage", header: "Stage" },
      ],
    }),
  );
  cellAt("d1", "name").focus();
  await userEvent.keyboard(
    "{Shift>}{ArrowRight}{ArrowDown}{/Shift}{Control>}d{/Control}",
  );
  expect(onFill).toHaveBeenCalledWith({
    source: { rowIds: ["d1"], keys: ["name", "stage"] },
    target: { rowIds: ["d2"], keys: ["name"] },
    series: false,
  });
  await userEvent.keyboard("{Delete}");
  await expect
    .poll(() => statusText(screen.container))
    .toContain("Couldn't save — nothing changed");
});

test("cells mode: a cancelled fill drag reports nothing, even on a later release", async () => {
  const onFill = vi.fn();
  await render(cellsGrid({ onFill }));
  await userEvent.click(cellAt("d1", "amount"));
  const handle = cellAt("d1", "amount").querySelector<HTMLElement>(
    '[data-slot="data-grid-fill-handle"]',
  )!;
  handle.dispatchEvent(
    new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 7 }),
  );
  const target = cellAt("d3", "amount").getBoundingClientRect();
  window.dispatchEvent(
    new PointerEvent("pointermove", {
      pointerId: 7,
      clientX: target.left + 4,
      clientY: target.top + 4,
    }),
  );
  window.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 7 }));
  window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 7 }));
  expect(onFill).not.toHaveBeenCalled();
  expect(cellAt("d2", "amount").hasAttribute("data-fill-target")).toBe(false);
});

test("cells mode: a parse column is writable to assistive technology; a fill drag leaves the range alone", async () => {
  const onFill = vi.fn();
  await render(cellsGrid({ onFill }));
  expect(cellAt("d1", "amount").hasAttribute("aria-readonly")).toBe(false);
  await userEvent.click(cellAt("d1", "amount"));
  const handle = cellAt("d1", "amount").querySelector<HTMLElement>(
    '[data-slot="data-grid-fill-handle"]',
  )!;
  handle.dispatchEvent(
    new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 9 }),
  );
  cellAt("d3", "amount").dispatchEvent(
    new PointerEvent("pointerover", {
      bubbles: true,
      buttons: 1,
      pointerId: 9,
    }),
  );
  window.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 9 }));
  expect(inRange()).toEqual(["d1:amount"]);
});

test("a custom editor gets the typed seed, and commit with a move steps the grid on", async () => {
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
          editable: {
            type: "custom",
            render: ({ value, seed, commit }) => (
              <input
                aria-label="Stage"
                autoFocus
                defaultValue={seed ?? value}
                onKeyDown={(event) => {
                  if (event.key === "Enter")
                    commit(event.currentTarget.value, "down");
                  if (event.key === "Tab") {
                    event.preventDefault();
                    commit(
                      event.currentTarget.value,
                      event.shiftKey ? "left" : "right",
                    );
                  }
                }}
              />
            ),
          },
        },
        { key: "amount", header: "Amount", minWidth: 10 },
      ]}
      data={DEALS}
      getRowId={(d) => d.id}
      onCellCommit={onCellCommit}
    />,
  );
  const focused = () => {
    const cell = (
      document.activeElement as HTMLElement | null
    )?.closest<HTMLElement>("[data-grid-row]");
    return `${cell?.dataset.gridRow}:${cell?.dataset.gridKey}`;
  };
  (
    document.querySelector('[data-slot="data-grid-cell"]') as HTMLElement
  ).focus();
  await userEvent.keyboard("{ArrowRight}");
  // Type-to-edit: the key that opened the editor is its seed, not lost.
  await userEvent.keyboard("W");
  const input = document.querySelector(
    'input[aria-label="Stage"]',
  ) as HTMLInputElement;
  expect(input.value).toBe("W");
  await userEvent.keyboard("on{Enter}");
  expect(onCellCommit).toHaveBeenLastCalledWith(DEALS[0], "stage", "Won");
  await expect.poll(focused).toBe("d2:stage");

  await userEvent.keyboard("{Enter}");
  await userEvent.keyboard("{Tab}");
  await expect.poll(focused).toBe("d2:amount");
  // An unchanged commit only closes and moves.
  expect(onCellCommit).toHaveBeenCalledTimes(1);
});
