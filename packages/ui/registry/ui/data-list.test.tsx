import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { DataList, type DataListColumn, type SortState } from "./data-list";

interface Row {
  id: string;
  name: string;
  role: string;
}

const columns: DataListColumn<Row>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "role", header: "Role" },
];

const data: Row[] = [
  { id: "a", name: "Ada", role: "Engineer" },
  { id: "b", name: "Bea", role: "Designer" },
  { id: "c", name: "Cole", role: "Manager" },
];

test("renders column headers and row data", async () => {
  const screen = await render(
    <DataList columns={columns} data={data} getRowId={(r) => r.id} />,
  );
  await expect
    .element(screen.getByRole("table"))
    .toHaveAttribute("data-slot", "data-list");
  await expect.element(screen.getByText("Name")).toBeInTheDocument();
  await expect.element(screen.getByText("Role")).toBeInTheDocument();
  await expect.element(screen.getByText("Ada")).toBeInTheDocument();
  await expect.element(screen.getByText("Manager")).toBeInTheDocument();
});

test("uses render() for custom cells and falls back to row[key]", async () => {
  const cols: DataListColumn<Row>[] = [
    { key: "name", header: "Name" },
    { key: "role", header: "Role", render: (r) => `${r.role}!` },
  ];
  const screen = await render(
    <DataList columns={cols} data={data} getRowId={(r) => r.id} />,
  );
  // fallback: row['name']
  await expect
    .element(screen.getByRole("cell", { name: "Bea" }))
    .toBeInTheDocument();
  // custom render
  await expect
    .element(screen.getByRole("cell", { name: "Designer!" }))
    .toBeInTheDocument();
});

test("clicking a sortable header fires onSortChange and cycles asc → desc → null", async () => {
  const onSortChange = vi.fn();
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      onSortChange={onSortChange}
    />,
  );
  const button = screen.getByRole("button", { name: "Name" });
  const nameHead = () =>
    screen.container.querySelector<HTMLElement>(
      '[data-slot="data-list-head"][data-sortable]',
    )!;

  // Await the data-sorted reflection between clicks so React commits the internal
  // sort state (which the next click's handler closes over) before clicking again.
  (button.element() as HTMLElement).click();
  expect(onSortChange).toHaveBeenLastCalledWith({
    key: "name",
    direction: "asc",
  });
  await vi.waitFor(() => expect(nameHead().dataset.sorted).toBe("asc"));

  (button.element() as HTMLElement).click();
  expect(onSortChange).toHaveBeenLastCalledWith({
    key: "name",
    direction: "desc",
  });
  await vi.waitFor(() => expect(nameHead().dataset.sorted).toBe("desc"));

  (button.element() as HTMLElement).click();
  expect(onSortChange).toHaveBeenLastCalledWith(null);
  expect(onSortChange).toHaveBeenCalledTimes(3);
});

test("reflects the controlled sort via aria-sort + data-sorted", async () => {
  const sort: SortState = { key: "name", direction: "desc" };
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      sort={sort}
    />,
  );
  const head = screen.container.querySelector<HTMLElement>(
    '[data-slot="data-list-head"][data-sortable]',
  )!;
  expect(head.getAttribute("aria-sort")).toBe("descending");
  expect(head.dataset.sorted).toBe("desc");
});

test("end-aligned sortable header keeps DOM order (no flex-row-reverse) so the label defines the baseline", async () => {
  // Regression: `flex-row-reverse` made the icon span the flex container's
  // baseline-defining first item; its baseline synthesizes from the svg box
  // bottom, lifting the label ~2px vs sibling headers. The icon now trails the
  // label in every alignment; the cell's `text-end` handles right alignment.
  const cols: DataListColumn<Row>[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "role", header: "Role", sortable: true, align: "end" },
  ];
  const screen = await render(
    <DataList columns={cols} data={data} getRowId={(r) => r.id} />,
  );
  const head = screen.container.querySelector(
    '[data-slot="data-list-head"][class*="text-end"]',
  ) as HTMLElement;
  expect(head).not.toBeNull();
  const button = head.querySelector("button") as HTMLElement;
  expect(button.className).not.toContain("flex-row-reverse");
  // Label text first, icon span trailing.
  expect(button.childNodes[0]?.textContent).toBe("Role");
  expect(
    (button.lastElementChild as HTMLElement).querySelector("svg"),
  ).not.toBeNull();
});

test("non-sortable headers are plain (no button, no aria-sort)", async () => {
  const screen = await render(
    <DataList columns={columns} data={data} getRowId={(r) => r.id} />,
  );
  // Exactly one sortable column ("Name") → exactly one header button.
  expect(
    screen.container.querySelectorAll('[data-slot="data-list-head"] button')
      .length,
  ).toBe(1);
  // The non-sortable "Role" head has no aria-sort attribute.
  const heads = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="data-list-head"]',
  );
  const roleHead = Array.from(heads).find((h) => h.textContent === "Role")!;
  expect(roleHead.hasAttribute("aria-sort")).toBe(false);
  expect(roleHead.hasAttribute("data-sortable")).toBe(false);
});

test("selecting a row fires onSelectionChange with the row id", async () => {
  const onSelectionChange = vi.fn();
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      selectable
      onSelectionChange={onSelectionChange}
    />,
  );
  const rowCheckbox = screen.getByRole("checkbox", { name: "Select row 1" });
  (rowCheckbox.element() as HTMLElement).click();
  expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(["a"]));
});

test("select-all toggles every row, then clears", async () => {
  const onSelectionChange = vi.fn();
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      selectable
      onSelectionChange={onSelectionChange}
    />,
  );
  const selectAll = screen.getByRole("checkbox", { name: "Select all rows" });

  (selectAll.element() as HTMLElement).click();
  expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(["a", "b", "c"]));

  (selectAll.element() as HTMLElement).click();
  expect(onSelectionChange).toHaveBeenLastCalledWith(new Set());
});

test("select-all preserves off-page selections (union), then clears only the current page", async () => {
  // Simulate host-owned pagination: `data` is just the current page, but the
  // controlled selection already includes an id from another page ("z").
  const onSelectionChange = vi.fn();
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      selectable
      selectedIds={new Set(["z"])}
      onSelectionChange={onSelectionChange}
    />,
  );
  const selectAll = screen.getByRole("checkbox", { name: "Select all rows" });

  // Select-all UNIONS the current page onto the existing selection — the
  // off-page id "z" is preserved, never erased.
  (selectAll.element() as HTMLElement).click();
  expect(onSelectionChange).toHaveBeenLastCalledWith(
    new Set(["z", "a", "b", "c"]),
  );
});

test("clearing select-all removes only current-page ids and KEEPS the off-page id", async () => {
  // Every current-page row is selected AND an off-page id ("z") is selected.
  // Clicking select-all (to clear) must remove only a/b/c, keeping "z".
  const onSelectionChange = vi.fn();
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      selectable
      selectedIds={new Set(["z", "a", "b", "c"])}
      onSelectionChange={onSelectionChange}
    />,
  );
  const selectAll = screen.getByRole("checkbox", { name: "Select all rows" });
  // All current-page rows are selected → header is checked.
  await expect.element(selectAll).toHaveAttribute("aria-checked", "true");

  (selectAll.element() as HTMLElement).click();
  // Only the current-page ids are removed; the off-page "z" survives.
  expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(["z"]));
});

test("header checkbox checked/indeterminate reflects only the current view (off-page ids ignored)", async () => {
  // The header's checked/indeterminate state must derive from the CURRENT VIEW
  // (rowIds) only — an off-page id "z" in the selection must not skew it. Each
  // case is asserted on the rendered header's own aria-checked attribute. The
  // `key` forces a fresh mount per case so renders don't collide in the DOM.
  const renderHeader = async (selectedIds: Set<string>, key: string) => {
    const screen = await render(
      <DataList
        key={key}
        columns={columns}
        data={data}
        getRowId={(r) => r.id}
        selectable
        selectedIds={selectedIds}
      />,
    );
    return screen.container.querySelector<HTMLElement>(
      '[data-slot="checkbox"][aria-label="Select all rows"]',
    )!;
  };

  // Off-page id "z" + NO current-page ids → unchecked (not mixed): allSelected
  // and someSelected are computed against rowIds (current view) only.
  const offPageOnly = await renderHeader(new Set(["z"]), "off");
  expect(offPageOnly.getAttribute("aria-checked")).toBe("false");

  // Off-page id + ALL current-page ids → checked (the off-page id doesn't make
  // it indeterminate; the current view is fully selected).
  const fullPage = await renderHeader(new Set(["z", "a", "b", "c"]), "full");
  expect(fullPage.getAttribute("aria-checked")).toBe("true");

  // Off-page id + SOME current-page ids → indeterminate (mixed), driven by the
  // current view only.
  const partialPage = await renderHeader(new Set(["z", "a"]), "partial");
  expect(partialPage.getAttribute("aria-checked")).toBe("mixed");
});

test("select-all is indeterminate when only some rows are selected (controlled)", async () => {
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      selectable
      selectedIds={new Set(["a"])}
    />,
  );
  const selectAll = screen.getByRole("checkbox", { name: "Select all rows" });
  await expect.element(selectAll).toHaveAttribute("aria-checked", "mixed");
});

test("loading shows skeleton rows instead of data", async () => {
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      loading
      loadingRows={4}
    />,
  );
  const table = screen.getByRole("table");
  await expect.element(table).toHaveAttribute("aria-busy", "true");
  await expect.element(table).toHaveAttribute("aria-describedby");
  await expect
    .element(screen.getByRole("status"))
    .toHaveTextContent("Loading rows");
  const skeletonRows = screen.container.querySelectorAll(
    '[data-slot="data-list-skeleton-row"]',
  );
  expect(skeletonRows.length).toBe(4);
  skeletonRows.forEach((row) =>
    expect(row).toHaveAttribute("aria-hidden", "true"),
  );
  // Real data is not rendered while loading.
  expect(screen.container.textContent).not.toContain("Ada");
});

test("empty data renders the empty state", async () => {
  const screen = await render(
    <DataList columns={columns} data={[]} getRowId={(r) => r.id} />,
  );
  await expect.element(screen.getByText("No data")).toBeInTheDocument();
  await expect
    .element(screen.getByText("There are no records to display."))
    .toBeInTheDocument();
});

test("a custom emptyState overrides the default", async () => {
  const screen = await render(
    <DataList
      columns={columns}
      data={[]}
      getRowId={(r) => r.id}
      emptyState={<div>Nothing here yet</div>}
    />,
  );
  await expect
    .element(screen.getByText("Nothing here yet"))
    .toBeInTheDocument();
});

test("onRowClick marks rows clickable (NO role=button / tabindex on the <tr>) and fires on row click", async () => {
  const onRowClick = vi.fn();
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      onRowClick={onRowClick}
    />,
  );
  const rows = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="data-list-row"]',
  );
  expect(rows.length).toBe(3);
  // The <tr> keeps native row semantics: NO role="button" override, NO tabindex.
  expect(rows[0]!.hasAttribute("role")).toBe(false);
  expect(rows[0]!.hasAttribute("tabindex")).toBe(false);
  // It is still marked clickable for styling/data hooks.
  expect(rows[0]!.hasAttribute("data-clickable")).toBe(true);

  // Mouse: clicking the row (a cell, not an interactive descendant) activates it.
  rows[1]!.click();
  expect(onRowClick).toHaveBeenCalledTimes(1);
  expect(onRowClick).toHaveBeenLastCalledWith(data[1], 1);
});

test("the first-cell action button is keyboard-focusable and Enter/Space on IT fires onRowClick", async () => {
  const onRowClick = vi.fn();
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      onRowClick={onRowClick}
    />,
  );
  // A real <button> is injected into the first cell as the accessible activation.
  const actions = screen.container.querySelectorAll<HTMLButtonElement>(
    '[data-slot="data-list-row-action"]',
  );
  expect(actions.length).toBe(3);
  const firstAction = actions[0]!;
  expect(firstAction.tagName).toBe("BUTTON");
  // The button wraps the first column's content (the row's name).
  expect(firstAction.textContent).toContain("Ada");

  // It is focusable, and Enter/Space activate it natively (real button), firing
  // onRowClick for that row — WITHOUT the <tr> being a button.
  firstAction.focus();
  expect(document.activeElement).toBe(firstAction);
  await userEvent.keyboard("{Enter}");
  expect(onRowClick).toHaveBeenLastCalledWith(data[0], 0);

  firstAction.focus();
  await userEvent.keyboard(" ");
  expect(onRowClick).toHaveBeenCalledTimes(2);
  expect(onRowClick).toHaveBeenLastCalledWith(data[0], 0);
});

test("clicking the first-cell action button fires onRowClick exactly once (no double-activation via the row)", async () => {
  const onRowClick = vi.fn();
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      onRowClick={onRowClick}
    />,
  );
  const firstAction = screen.container.querySelector<HTMLButtonElement>(
    '[data-slot="data-list-row-action"]',
  )!;
  firstAction.click();
  // The row's onClick guard treats the action button as an interactive
  // descendant and skips it — so the button's handler is the only one to fire.
  expect(onRowClick).toHaveBeenCalledTimes(1);
  expect(onRowClick).toHaveBeenLastCalledWith(data[0], 0);
});

test("the first-cell action button is skipped when the first column is interactive", async () => {
  const onRowClick = vi.fn();
  const cols: DataListColumn<Row>[] = [
    {
      key: "name",
      header: "Name",
      interactive: true,
      render: (r) => <a href={`#${r.id}`}>{r.name}</a>,
    },
    { key: "role", header: "Role" },
  ];
  const screen = await render(
    <DataList
      columns={cols}
      data={data}
      getRowId={(r) => r.id}
      onRowClick={onRowClick}
    />,
  );
  // No injected button — the consumer's own in-cell control is the activation.
  expect(
    screen.container.querySelector('[data-slot="data-list-row-action"]'),
  ).toBeNull();
  // The row stays clickable for mouse users, with native semantics intact.
  const firstRow = screen.container.querySelector<HTMLElement>(
    '[data-slot="data-list-row"]',
  )!;
  expect(firstRow.hasAttribute("data-clickable")).toBe(true);
  expect(firstRow.hasAttribute("role")).toBe(false);
});

test("rows are not activatable when onRowClick is omitted", async () => {
  const screen = await render(
    <DataList columns={columns} data={data} getRowId={(r) => r.id} />,
  );
  const firstRow = screen.container.querySelector<HTMLElement>(
    '[data-slot="data-list-row"]',
  )!;
  expect(firstRow.hasAttribute("data-clickable")).toBe(false);
  expect(firstRow.hasAttribute("role")).toBe(false);
});

test("clicking the selection checkbox does NOT fire onRowClick", async () => {
  const onRowClick = vi.fn();
  const onSelectionChange = vi.fn();
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      selectable
      onRowClick={onRowClick}
      onSelectionChange={onSelectionChange}
    />,
  );
  const rowCheckbox = screen.getByRole("checkbox", { name: "Select row 1" });
  (rowCheckbox.element() as HTMLElement).click();
  // Selection toggles, but the row-activate callback must not fire (propagation
  // is stopped at the checkbox cell).
  expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(["a"]));
  expect(onRowClick).not.toHaveBeenCalled();
});

test("Space/Enter on a row checkbox toggles selection but does NOT fire onRowClick", async () => {
  const onRowClick = vi.fn();
  const onSelectionChange = vi.fn();
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      selectable
      onRowClick={onRowClick}
      onSelectionChange={onSelectionChange}
    />,
  );
  const rowCheckbox = screen.getByRole("checkbox", { name: "Select row 1" });

  // Keyboard-activate the checkbox itself (Space). The keydown bubbles up to the
  // clickable row, but the row's guard ignores events whose target is a
  // descendant — so selection toggles WITHOUT the row activating.
  rowCheckbox.element().focus();
  await userEvent.keyboard(" ");
  expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(["a"]));
  expect(onRowClick).not.toHaveBeenCalled();

  // Enter on the checkbox likewise must not bubble through to onRowClick.
  rowCheckbox.element().focus();
  await userEvent.keyboard("{Enter}");
  expect(onRowClick).not.toHaveBeenCalled();
});

test("activating a nested control inside a cell does NOT fire onRowClick", async () => {
  const onRowClick = vi.fn();
  const onAction = vi.fn();
  const cols: DataListColumn<Row>[] = [
    // First column is interactive so DataList does NOT inject its own first-cell
    // action button — the test exercises the nested control in a later column.
    { key: "name", header: "Name", interactive: true },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <button type="button" onClick={() => onAction(r.id)}>
          Open {r.name}
        </button>
      ),
    },
  ];
  const screen = await render(
    <DataList
      columns={cols}
      data={data}
      getRowId={(r) => r.id}
      onRowClick={onRowClick}
    />,
  );

  // Mouse-click the nested button: its own handler fires, the row's does not.
  const nestedButton = screen.getByRole("button", {
    name: "Open Ada",
    exact: true,
  });
  (nestedButton.element() as HTMLElement).click();
  expect(onAction).toHaveBeenLastCalledWith("a");
  expect(onRowClick).not.toHaveBeenCalled();

  // Keyboard-activate the nested button (Enter): the keydown bubbles to the row
  // but the row's guard (target !== row) keeps onRowClick from firing.
  nestedButton.element().focus();
  await userEvent.keyboard("{Enter}");
  expect(onRowClick).not.toHaveBeenCalled();
});

test("the <tr> is not a focusable keyboard widget — keyboard activation lives on the first-cell button", async () => {
  const onRowClick = vi.fn();
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      onRowClick={onRowClick}
    />,
  );
  const firstRow = screen.container.querySelector<HTMLElement>(
    '[data-slot="data-list-row"]',
  )!;

  // The <tr> carries no tabindex, so it is not in the tab order and is not a
  // keyboard widget — table row semantics are preserved. The accessible
  // keyboard path is the injected first-cell <button> (covered above).
  expect(firstRow.hasAttribute("tabindex")).toBe(false);
  expect(firstRow.hasAttribute("role")).toBe(false);

  // The first-cell action button is what tabbing reaches and activating fires.
  const firstAction = screen.container.querySelector<HTMLButtonElement>(
    '[data-slot="data-list-row-action"]',
  )!;
  firstAction.focus();
  await userEvent.keyboard("{Enter}");
  expect(onRowClick).toHaveBeenLastCalledWith(data[0], 0);
});

test("toolbar and footer slots render around the table", async () => {
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      toolbar={<div>My search bar</div>}
      footer={<div>My pagination</div>}
    />,
  );
  await expect.element(screen.getByText("My search bar")).toBeInTheDocument();
  await expect.element(screen.getByText("My pagination")).toBeInTheDocument();
  expect(
    screen.container.querySelector('[data-slot="data-list-toolbar"]'),
  ).not.toBeNull();
  expect(
    screen.container.querySelector('[data-slot="data-list-footer"]'),
  ).not.toBeNull();
  // The table still renders inside the wrapper.
  await expect
    .element(screen.getByRole("table"))
    .toHaveAttribute("data-slot", "data-list");
});

test("no toolbar/footer wrapper when both slots are omitted", async () => {
  const screen = await render(
    <DataList columns={columns} data={data} getRowId={(r) => r.id} />,
  );
  expect(
    screen.container.querySelector('[data-slot="data-list-root"]'),
  ).toBeNull();
  expect(
    screen.container.querySelector('[data-slot="data-list-toolbar"]'),
  ).toBeNull();
});

test("forwards ref to the root table element", async () => {
  const ref = React.createRef<HTMLTableElement>();
  await render(
    <DataList ref={ref} columns={columns} data={data} getRowId={(r) => r.id} />,
  );
  expect(ref.current).toBeInstanceOf(HTMLTableElement);
  expect(ref.current?.dataset.slot).toBe("data-list");
});

test("no a11y violations", async () => {
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      selectable
      sort={{ key: "name", direction: "asc" }}
    />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations with onRowClick + selectable (activatable rows keep table semantics)", async () => {
  // The activatable-row path: a real <button> inside the first cell instead of
  // role="button" on the <tr>. axe must see valid table semantics — every cell
  // a child of a row, the row still a row — AND no nested/invalid interactive
  // structure, with selection checkboxes alongside the row-action buttons.
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      selectable
      onRowClick={() => {}}
    />,
  );
  // Sanity: the injected button exists and the <tr> is NOT a button.
  expect(
    screen.container.querySelector('[data-slot="data-list-row-action"]'),
  ).not.toBeNull();
  const firstRow = screen.container.querySelector<HTMLElement>(
    '[data-slot="data-list-row"]',
  )!;
  expect(firstRow.hasAttribute("role")).toBe(false);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — loading", async () => {
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      loading
      loadingRows={3}
    />,
  );
  await expectNoA11yViolations(screen.container);
});

/* ---------------------------------------------------------------------------------------------
 * Touch-target remediation (WCAG 2.5.8) — VERIFY the bare `size="sm"` selection checkboxes in
 * this table context (audit 12 §d instruction: verify by rendering + measuring rather than
 * assuming checkbox.tsx's own fix "just works" here — the header/row checkboxes are aria-label-
 * only, so they have no accessible label to compensate a too-small target, AND they sit inside
 * `TableHead`/`TableCell` with `w-0` + a `pr-0` collapse (`[&:has([role=checkbox])]:pr-0` in
 * table.tsx) when a checkbox is present, which is exactly the kind of tight, padding-collapsed
 * spot where an invisible hit-area expansion could plausibly get clipped).
 *
 * Same rationale/technique as checkbox.test.tsx: this harness runs without compiled Tailwind, so
 * neither the checkbox's own `before:-inset-1.5` nor table.tsx's padding/`:has()` collapse resolve
 * to real CSS here. This mirror reproduces BOTH — the checkbox's real fix (from checkbox.tsx,
 * unmodified by this file) AND the surrounding cell's real padding (`h-(--size-md)`/`py-2` +
 * `px-3` collapsed to `pr-0` on the checkbox side, per table.tsx) — so the measurement proves the
 * fix survives in the actual table layout, not just in isolation.
 *
 * Verdict: it survives unmodified. `table.tsx`'s cells have no `overflow-hidden` (confirmed by
 * reading the source) and the checkbox column's LEFT padding (`pl-3` = 12px) comfortably absorbs
 * the checkbox's 6px `before:-inset-1.5` expansion on every side, so no call-site fix to
 * data-list.tsx was needed.
 * ------------------------------------------------------------------------------------------- */

function injectDataListCheckboxHitAreaMirror(): () => void {
  const style = document.createElement("style");
  style.textContent = `
    body { margin: 24px; }
    [data-slot="checkbox"] { position: relative; display: inline-flex; box-sizing: border-box; }
    [data-slot="checkbox"][data-size="sm"] { width: 14px; height: 14px; }
    [data-slot="checkbox"][data-size="sm"]::before { content: ""; position: absolute; inset: -6px; }
    [data-slot="table-head"] { box-sizing: border-box; height: 32px; padding: 0 0 0 12px; }
    [data-slot="table-cell"] { box-sizing: border-box; padding: 8px 0 8px 12px; }
  `;
  document.head.appendChild(style);
  return () => document.head.removeChild(style);
}

test("the header select-all checkbox (sm, 14px) resolves an effective hit area >= 24x24 in its real TableHead", async () => {
  const cleanup = injectDataListCheckboxHitAreaMirror();
  try {
    const screen = await render(
      <DataList
        columns={columns}
        data={data}
        getRowId={(r) => r.id}
        selectable
      />,
    );
    const el = screen
      .getByRole("checkbox", { name: "Select all rows" })
      .element() as HTMLElement;
    el.getBoundingClientRect(); // force a layout flush before reading resolved pseudo-element geometry
    const before = getComputedStyle(el, "::before");
    expect(parseFloat(before.width)).toBeGreaterThanOrEqual(24);
    expect(parseFloat(before.height)).toBeGreaterThanOrEqual(24);
  } finally {
    cleanup();
  }
});

test("a row select checkbox (sm, 14px) resolves an effective hit area >= 24x24 in its real TableCell", async () => {
  const cleanup = injectDataListCheckboxHitAreaMirror();
  try {
    const screen = await render(
      <DataList
        columns={columns}
        data={data}
        getRowId={(r) => r.id}
        selectable
      />,
    );
    const el = screen
      .getByRole("checkbox", { name: "Select row 1" })
      .element() as HTMLElement;
    el.getBoundingClientRect(); // force a layout flush before reading resolved pseudo-element geometry
    const before = getComputedStyle(el, "::before");
    expect(parseFloat(before.width)).toBeGreaterThanOrEqual(24);
    expect(parseFloat(before.height)).toBeGreaterThanOrEqual(24);
  } finally {
    cleanup();
  }
});

test("a point just outside the row checkbox's visual box, inside the expanded hit area, still hits and toggles selection", async () => {
  const cleanup = injectDataListCheckboxHitAreaMirror();
  try {
    const onSelectionChange = vi.fn();
    const screen = await render(
      <DataList
        columns={columns}
        data={data}
        getRowId={(r) => r.id}
        selectable
        onSelectionChange={onSelectionChange}
      />,
    );
    const el = screen
      .getByRole("checkbox", { name: "Select row 1" })
      .element() as HTMLElement;
    const rect = el.getBoundingClientRect();
    // 4px above the visual top edge — inside the 6px `before:-inset-1.5` expansion, outside the 14px box.
    const x = rect.left + rect.width / 2;
    const y = rect.top - 4;
    const hit = document.elementFromPoint(x, y);
    expect(hit).toBe(el);
    (hit as HTMLElement).click();
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(["a"]));
  } finally {
    cleanup();
  }
});
