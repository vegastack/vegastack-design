import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { ActionBarButton } from "./action-bar";
import { useFileDrop } from "./use-file-drop";
import {
  DataList,
  rowActionsColumn,
  type DataListColumn,
  type SortState,
} from "./data-list";

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
  const button = screen.getByRole("button", { name: "Sort by Name" });
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
  // bottom, lifting the label ~2px vs sibling headers. The label stays the
  // first (and only in-flow) child in every alignment; in an END column the
  // glyph leads visually from an out-of-flow slot, so the label's end lines up
  // with the values (asserted with real geometry in test/geometry.browser.test.tsx).
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
  const glyph = button.lastElementChild as HTMLElement;
  expect(glyph.querySelector("svg")).not.toBeNull();
  expect(glyph.className).toContain("absolute");
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
  await expect.element(screen.getByText("Nothing here")).toBeInTheDocument();
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

test("one root in every configuration; no toolbar/footer regions when both slots are omitted", async () => {
  const screen = await render(
    <DataList columns={columns} data={data} getRowId={(r) => r.id} />,
  );
  // The root is DataList's single node in the host's container — its own status lines and
  // the sr-only loading status can never land there as stray grid/flex items.
  expect(screen.container.children).toHaveLength(1);
  expect(screen.container.firstElementChild?.getAttribute("data-slot")).toBe(
    "data-list-root",
  );
  expect(
    screen.container.querySelector('[data-slot="data-list-toolbar"]'),
  ).toBeNull();
  expect(
    screen.container.querySelector('[data-slot="data-list-footer"]'),
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
 * unmodified by this file) AND the surrounding cell's real padding (`h-8`/`py-2` +
 * `px-3` collapsed to `pr-0` on the checkbox side, per table.tsx) — so the measurement proves the
 * fix survives in the actual table layout, not just in isolation.
 *
 * Verdict: it survives unmodified. `table.tsx`'s cells have no `overflow-hidden` (confirmed by
 * reading the source) and the checkbox column's LEFT padding (`pl-3` = 12px) comfortably absorbs
 * the checkbox's 6px `before:-inset-1.5` expansion on every side, so no call-site fix to
 * data-list.tsx was needed.
 * ------------------------------------------------------------------------------------------- */

/*
 * A CSS MIRROR of the shipped Checkbox's own geometry, because this lane compiles no Tailwind.
 *
 * Batch 3 of the shadcn reset put Checkbox back on upstream's file: one size (16px, no `data-size`)
 * and an `::after` hit area at `-inset-x-3 -inset-y-2` (40x32) rather than the fork's 14px `sm`
 * tier with a `::before` at `-inset-1.5`. The mirror below tracks that; if the two ever disagree,
 * `test/geometry.browser.test.tsx` measures the REAL compiled control and fails there.
 */
function injectDataListCheckboxHitAreaMirror(): () => void {
  const style = document.createElement("style");
  style.textContent = `
    body { margin: 24px; }
    [data-slot="checkbox"] { position: relative; display: inline-flex; box-sizing: border-box; width: 16px; height: 16px; }
    [data-slot="checkbox"]::after { content: ""; position: absolute; inset: -8px -12px; }
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
    const hitArea = getComputedStyle(el, "::after");
    expect(parseFloat(hitArea.width)).toBeGreaterThanOrEqual(24);
    expect(parseFloat(hitArea.height)).toBeGreaterThanOrEqual(24);
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
    const hitArea = getComputedStyle(el, "::after");
    expect(parseFloat(hitArea.width)).toBeGreaterThanOrEqual(24);
    expect(parseFloat(hitArea.height)).toBeGreaterThanOrEqual(24);
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
    // 4px above the visual top edge — inside the 8px `after:-inset-y-2` expansion, outside the
    // 16px box.
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

test("cellClassName is called per body cell and merged after column className", async () => {
  const cols: DataListColumn<Row>[] = [
    {
      key: "name",
      header: "Name",
      className: "col-static",
      cellClassName: (row) => (row.id === "b" ? "cell-flagged" : undefined),
    },
    { key: "role", header: "Role" },
  ];
  await render(<DataList columns={cols} data={data} getRowId={(r) => r.id} />);
  const cells = Array.from(
    document.querySelectorAll('[data-slot="data-list-row"] td:first-child'),
  ) as HTMLElement[];
  expect(cells).toHaveLength(3);
  for (const cell of cells) expect(cell.className).toContain("col-static");
  expect(cells[0]!.className).not.toContain("cell-flagged");
  expect(cells[1]!.className).toContain("cell-flagged");
  expect(cells[2]!.className).not.toContain("cell-flagged");
});

test("render receives the per-cell context (rowId, columnKey, selected) as a third argument", async () => {
  const seen: Array<{ rowId: string; columnKey: string; selected: boolean }> =
    [];
  const cols: DataListColumn<Row>[] = [
    {
      key: "name",
      header: "Name",
      render: (row, _index, cell) => {
        seen.push(cell);
        return row.name;
      },
    },
  ];
  await render(
    <DataList
      columns={cols}
      data={data}
      getRowId={(r) => r.id}
      selectable
      selectedIds={new Set(["b"])}
    />,
  );
  // `render` runs once per row per render pass, and the width measurement adds a pass after
  // mount — so assert on the LAST pass rather than on a pass count.
  expect(seen.length % 3).toBe(0);
  const last = seen.slice(-3);
  expect(last[0]).toEqual({ rowId: "a", columnKey: "name", selected: false });
  expect(last[1]).toEqual({ rowId: "b", columnKey: "name", selected: true });
  expect(last[2]).toEqual({ rowId: "c", columnKey: "name", selected: false });
});

test("every remaining `<table>` prop type-checks and flows through to the table element", async () => {
  // Was "Table spreadsheet-voice props (grid, density, headerTone)". Batch 5 of the shadcn reset
  // put `Table` back on upstream's file, which takes no props of its own — no `grid`, no
  // `headerTone`, no `density`, no `scrollLabel`, no `containerProps`. What survives, and what this
  // test now pins, is that `DataListProps` really is upstream `Table`'s prop set: an ordinary
  // `<table>` attribute passed to `DataList` reaches the table element, and upstream's own
  // container is still there around it.
  await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      className="test-viewport-cap"
      summary="Releases"
    />,
  );
  const table = document.querySelector(
    '[data-slot="data-list"]',
  ) as HTMLElement;
  expect(table.tagName).toBe("TABLE");
  expect(table.className).toContain("test-viewport-cap");
  expect(table.getAttribute("summary")).toBe("Releases");
  const container = document.querySelector(
    '[data-slot="table-container"]',
  ) as HTMLElement;
  expect(container).not.toBeNull();
  expect(container.contains(table)).toBe(true);
});

/* ---------------------------------------------------------------------------------------------
 * Wrapping posture per column (D18) and the shared scroll region (B5-01).
 * ------------------------------------------------------------------------------------------- */

test("cells wrap by default; end-aligned and mono columns stay on one line", async () => {
  await render(
    <DataList
      columns={[
        { key: "name", header: "Name" },
        { key: "amount", header: "Amount", align: "end" },
        { key: "role", header: "Id", mono: true },
      ]}
      data={data}
      getRowId={(r) => r.id}
    />,
  );
  const [name, amount, id] = [
    ...document.querySelectorAll('[data-slot="table-cell"]'),
  ] as HTMLElement[];
  expect(name!.className).not.toMatch(/(^|\s)whitespace-nowrap(\s|$)/);
  expect(amount!.className).toContain("whitespace-nowrap");
  expect(id!.className).toContain("whitespace-nowrap");
  expect(id!.className).toContain("font-mono");
  expect(id!.className).toContain("tabular-nums");
});

test("an explicit column.nowrap overrides the inference in both directions", async () => {
  await render(
    <DataList
      columns={[
        { key: "name", header: "Name", nowrap: true },
        { key: "role", header: "Notes", align: "end", nowrap: false },
      ]}
      data={data}
      getRowId={(r) => r.id}
    />,
  );
  const [pinned, wrapped] = [
    ...document.querySelectorAll('[data-slot="table-cell"]'),
  ] as HTMLElement[];
  expect(pinned!.className).toContain("whitespace-nowrap");
  expect(wrapped!.className).not.toMatch(/(^|\s)whitespace-nowrap(\s|$)/);
});

test("the sortable header composes the system Button", async () => {
  // B5-02/B5-08 direction: no hand-rolled control in a header cell — the sort
  // affordance inherits the system's hover, pressed and focus treatment.
  await render(
    <DataList
      columns={[{ key: "name", header: "Name", sortable: true }]}
      data={data}
      getRowId={(r) => r.id}
    />,
  );
  const sort = document.querySelector(
    '[data-slot="data-table-sort"]',
  ) as HTMLElement;
  expect(sort).not.toBeNull();
  expect(sort.tagName).toBe("BUTTON");
});

test("a wide DataList overflows in upstream's container, which is NOT yet a tab stop", async () => {
  // FLAGGED FOR MK. Was "a wide DataList is keyboard-scrollable through the shared region".
  // Until Batch 5 of the shadcn reset, `Table` wrapped itself in `TableScrollRegion`, which
  // implemented A11Y-6 — a scroll viewport is a tab stop only when it can actually scroll, and a
  // named viewport is a `role="region"`. Upstream's `Table` wraps itself in a plain
  // `data-slot="table-container"` div instead: it scrolls, but no keyboard user can reach the
  // scroll. A11Y-6 is not one of the exceptions `implementation.md` § 5.2 assigns to `table`, and
  // § 5.2 says to apply an exception ONLY where it is assigned, so `table` ships upstream's
  // container verbatim and this test pins the gap rather than hiding it. `data-list` is an
  // extras.md KEEP that Batch 7 rebuilds on the reset primitives; that is where the tab stop
  // belongs now.
  // Since the responsive column posture landed, a default column MERGES instead of overflowing,
  // so the gap is pinned with columns that opt out of revelation (`mobile: "visible"`) — the one
  // posture that still lets a DataList scroll sideways.
  await render(
    <div style={{ width: "280px" }}>
      <DataList
        aria-label="People"
        columns={Array.from({ length: 10 }, (_, index) => ({
          key: `c${index}`,
          header: `Column ${index}`,
          mobile: "visible" as const,
        }))}
        data={data}
        getRowId={(r) => r.id}
      />
    </div>,
  );
  const container = document.querySelector(
    '[data-slot="table-container"]',
  ) as HTMLElement;
  // It really does overflow…
  await expect
    .poll(() => container.scrollWidth > container.clientWidth)
    .toBe(true);
  // …and it really is unreachable, which is the thing to fix in Batch 7.
  expect(container.getAttribute("tabindex")).toBeNull();
  expect(container.getAttribute("role")).toBeNull();
});

// ---- Fitting the width: responsive column revelation (shared with DataGrid) ----

interface Wide {
  id: string;
  name: string;
  role: string;
  email: string;
  team: string;
}

const wideData: Wide[] = [
  {
    id: "a",
    name: "Ada",
    role: "Engineer",
    email: "ada@vega.dev",
    team: "Core",
  },
  {
    id: "b",
    name: "Bea",
    role: "Designer",
    email: "bea@vega.dev",
    team: "Web",
  },
];

const headerTexts = () =>
  Array.from(document.querySelectorAll('[data-slot="data-list-head"]')).map(
    (th) => th.textContent,
  );

test("a narrow container merges overflow columns into the primary cell", async () => {
  // 300px fits Name (120) + Role (120); Email and Team default to `mobile: "merge"`.
  const screen = await render(
    <div style={{ width: "300px" }}>
      <DataList
        aria-label="People"
        columns={[
          { key: "name", header: "Name" },
          { key: "role", header: "Role" },
          { key: "email", header: "Email" },
          { key: "team", header: "Team" },
        ]}
        data={wideData}
        getRowId={(r) => r.id}
      />
    </div>,
  );
  await expect.poll(headerTexts).toEqual(["Name", "Role"]);
  const merged = screen.container.querySelectorAll(
    '[data-slot="data-list-merged"]',
  );
  expect(merged).toHaveLength(2);
  // Each merged value keeps its header as an sr-only prefix, so it is never read context-free.
  expect(merged[0]!.textContent).toBe("Email: ada@vega.devTeam: Core");
  // The merged stack lives in the FIRST cell of its row.
  expect(merged[0]!.closest("td")).toBe(
    merged[0]!.closest("tr")!.querySelector("td"),
  );
  // Nothing was dropped, so nothing is reported.
  expect(
    screen.container.querySelector('[data-slot="data-list-hidden-hint"]'),
  ).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("mergedRender: a folded value carries its own context, not a bare number", async () => {
  const screen = await render(
    <div style={{ width: "300px" }}>
      <DataList
        aria-label="Meetings"
        columns={[
          { key: "name", header: "Name" },
          { key: "role", header: "Role" },
          {
            key: "email",
            header: "To review",
            render: () => "4",
            mergedRender: () => "4 to review",
          },
        ]}
        data={wideData.slice(0, 1)}
        getRowId={(r) => r.id}
      />
    </div>,
  );
  await expect.poll(headerTexts).toEqual(["Name", "Role"]);
  const merged = screen.container.querySelector(
    '[data-slot="data-list-merged"]',
  )!;
  // The value's own words replace the sr-only header prefix.
  expect(merged.textContent).toBe("4 to review");
});

test('mergedLayout="line": folded values share one compact meta line', async () => {
  const screen = await render(
    <div style={{ width: "300px" }}>
      <DataList
        aria-label="Tasks"
        mergedLayout="line"
        columns={[
          { key: "name", header: "Name" },
          { key: "role", header: "Role" },
          { key: "email", header: "Due", mergedRender: () => "Today" },
          { key: "team", header: "Owner", mergedRender: () => "Arjun Mehta" },
        ]}
        data={wideData.slice(0, 1)}
        getRowId={(r) => r.id}
      />
    </div>,
  );
  await expect.poll(headerTexts).toEqual(["Name", "Role"]);
  const merged = screen.container.querySelector<HTMLElement>(
    '[data-slot="data-list-merged"]',
  )!;
  expect(merged.dataset.layout).toBe("line");
  expect(merged.textContent).toBe("Today·Arjun Mehta");
  expect(merged.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
});

test('mergedLayout="line" is one truncating line: empty values ("—") drop with their dot, avatars hide', async () => {
  const screen = await render(
    <div style={{ width: "300px" }}>
      <DataList
        aria-label="Files"
        mergedLayout="line"
        columns={[
          { key: "name", header: "Name" },
          { key: "role", header: "Role" },
          {
            key: "team",
            header: "By",
            mergedRender: () => (
              <>
                <span data-slot="avatar">KM</span>K Manoj Kumar
              </>
            ),
          },
          { key: "email", header: "Size", mergedRender: () => "—" },
          { key: "id", header: "When", mergedRender: () => "13h ago" },
        ]}
        data={wideData.slice(0, 1)}
        getRowId={(r) => r.id}
      />
    </div>,
  );
  await expect.poll(headerTexts).toEqual(["Name", "Role"]);
  const merged = screen.container.querySelector<HTMLElement>(
    '[data-slot="data-list-merged"]',
  )!;
  expect(merged.textContent).toBe("KMK Manoj Kumar·13h ago");
  expect(merged.className).toContain("flex-nowrap");
  expect(merged.className).toContain("[&_[data-slot=avatar]]:hidden");
  for (const value of merged.children)
    expect(value.className).toContain("truncate");
});

test("rowProps: data-* passthrough and a highlighted row", async () => {
  const screen = await render(
    <DataList
      aria-label="People"
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      rowProps={(row) => ({
        "data-row-id": row.id,
        "data-slot": "not-this",
        className: "custom-row",
        highlighted: row.id === "b",
      })}
    />,
  );
  const rows = [...screen.container.querySelectorAll<HTMLElement>("tbody tr")];
  expect(rows.map((r) => r.getAttribute("data-row-id"))).toEqual([
    "a",
    "b",
    "c",
  ]);
  // The list's own slot wins over a passed one.
  expect(rows.every((r) => r.dataset.slot === "data-list-row")).toBe(true);
  expect(rows.every((r) => r.classList.contains("custom-row"))).toBe(true);
  expect(rows.map((r) => r.hasAttribute("data-highlighted"))).toEqual([
    false,
    true,
    false,
  ]);
  expect(rows[1]!.classList.contains("bg-accent")).toBe(true);
  expect(rows[0]!.classList.contains("bg-accent")).toBe(false);
  await expectNoA11yViolations(screen.container);
});

test("a wide container shows every column and merges nothing", async () => {
  const screen = await render(
    <div style={{ width: "1200px" }}>
      <DataList
        columns={[
          { key: "name", header: "Name" },
          { key: "role", header: "Role" },
          { key: "email", header: "Email" },
          { key: "team", header: "Team" },
        ]}
        data={wideData}
        getRowId={(r) => r.id}
      />
    </div>,
  );
  await expect.poll(headerTexts).toEqual(["Name", "Role", "Email", "Team"]);
  expect(
    screen.container.querySelector('[data-slot="data-list-merged"]'),
  ).toBeNull();
});

test("the leading selection column is budgeted before the data columns", async () => {
  // 270px: Name (120) + Role (120) = 240 fits alone, but not beside the 40px selection column.
  await render(
    <div style={{ width: "270px" }}>
      <DataList
        columns={[
          { key: "name", header: "Name" },
          { key: "role", header: "Role" },
        ]}
        data={wideData}
        getRowId={(r) => r.id}
        selectable
      />
    </div>,
  );
  await expect.poll(headerTexts).toEqual(["Name"]);
});

test('`mobile: "hidden"` columns are dropped, counted, and describe the table', async () => {
  const screen = await render(
    <div style={{ width: "300px" }}>
      <DataList
        aria-label="People"
        columns={[
          { key: "name", header: "Name" },
          { key: "role", header: "Role", minWidth: 10_000, mobile: "hidden" },
          { key: "email", header: "Email", mobile: "hidden" },
        ]}
        data={wideData}
        getRowId={(r) => r.id}
      />
    </div>,
  );
  await expect.poll(headerTexts).toEqual(["Name"]);
  const hint = screen.container.querySelector<HTMLElement>(
    '[data-slot="data-list-hidden-hint"]',
  );
  expect(hint?.textContent).toBe("2 columns hidden");
  // Reported to assistive technology with the table, not only painted beside it.
  const table = screen.getByRole("table").element();
  expect(table.getAttribute("aria-describedby")?.split(" ")).toContain(
    hint!.id,
  );
  expect(
    screen.container.querySelector('[data-slot="data-list-merged"]'),
  ).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("the hidden-columns hint renders inside DataList's own root, not the host's container", async () => {
  // No toolbar, no footer: the bare configuration used to return a fragment, so the hint became
  // an extra child of the HOST's grid.
  const screen = await render(
    <div data-testid="host" style={{ display: "grid", width: "300px" }}>
      <DataList
        columns={[
          { key: "name", header: "Name" },
          { key: "role", header: "Role", minWidth: 10_000, mobile: "hidden" },
        ]}
        data={wideData}
        getRowId={(r) => r.id}
      />
    </div>,
  );
  await expect
    .poll(() =>
      screen.container.querySelector('[data-slot="data-list-hidden-hint"]'),
    )
    .not.toBeNull();
  const host = screen.getByTestId("host").element();
  expect(host.children).toHaveLength(1);
  const hint = screen.container.querySelector(
    '[data-slot="data-list-hidden-hint"]',
  )!;
  expect(hint.closest('[data-slot="data-list-root"]')).toBe(
    host.firstElementChild,
  );
});

test("merged values wrap and wear their own column's face, whatever the primary's posture", async () => {
  // A mono (and so nowrap) primary column used to pin every merged value to one line in the
  // mono face. Real-CSS containment is asserted in the geometry lane; this pins the contract.
  const screen = await render(
    <div style={{ width: "300px" }}>
      <DataList
        columns={[
          { key: "name", header: "Name", mono: true },
          { key: "role", header: "Role" },
          { key: "email", header: "Email" },
          { key: "team", header: "Team", mono: true },
        ]}
        data={wideData}
        getRowId={(r) => r.id}
      />
    </div>,
  );
  await expect.poll(headerTexts).toEqual(["Name", "Role"]);
  const [email, team] = Array.from(
    screen.container.querySelector('[data-slot="data-list-merged"]')!.children,
  ) as HTMLElement[];
  for (const value of [email!, team!]) {
    expect(value.className).toContain("whitespace-normal");
    expect(value.className).toContain("wrap-anywhere");
  }
  expect(email!.className).toContain("font-sans");
  expect(email!.className).not.toContain("font-mono");
  expect(team!.className).toContain("font-mono");
});

test("a sort on a merged column stays discoverable: a line the table is described by", async () => {
  const screen = await render(
    <div style={{ width: "300px" }}>
      <DataList
        aria-label="People"
        columns={[
          { key: "name", header: "Name", sortable: true },
          { key: "role", header: "Role", sortable: true },
          { key: "email", header: "Email", sortable: true },
        ]}
        data={wideData}
        getRowId={(r) => r.id}
        sort={{ key: "email", direction: "desc" }}
      />
    </div>,
  );
  await expect.poll(headerTexts).toEqual(["Name", "Role"]);
  const hint = screen.container.querySelector<HTMLElement>(
    '[data-slot="data-list-sort-hint"]',
  );
  expect(hint?.textContent).toBe("Sorted by Email, descending");
  expect(
    screen
      .getByRole("table")
      .element()
      .getAttribute("aria-describedby")
      ?.split(" "),
  ).toContain(hint!.id);
  // The merged value itself carries the direction as a styling hook.
  expect(
    screen.container
      .querySelector('[data-slot="data-list-merged"] [data-sorted]')
      ?.getAttribute("data-sorted"),
  ).toBe("desc");
  await expectNoA11yViolations(screen.container);
});

test("a sort on a hidden column is stated too; a sort on a visible column is not", async () => {
  function Host() {
    const [key, setKey] = React.useState("role");
    return (
      <div style={{ width: "300px" }}>
        <button type="button" onClick={() => setKey("name")}>
          sort by name
        </button>
        <DataList
          columns={[
            { key: "name", header: "Name", sortable: true },
            {
              key: "role",
              header: "Role",
              minWidth: 10_000,
              mobile: "hidden",
              sortable: true,
            },
          ]}
          data={wideData}
          getRowId={(r) => r.id}
          sort={{ key, direction: "asc" }}
        />
      </div>
    );
  }
  const screen = await render(<Host />);
  await expect
    .poll(
      () =>
        screen.container.querySelector('[data-slot="data-list-sort-hint"]')
          ?.textContent,
    )
    .toBe("Sorted by Role, ascending");
  (
    screen
      .getByRole("button", { name: "sort by name" })
      .element() as HTMLElement
  ).click();
  await expect
    .poll(() =>
      screen.container.querySelector('[data-slot="data-list-sort-hint"]'),
    )
    .toBeNull();
  // The header carries it again.
  expect(
    screen.container
      .querySelector('[data-slot="data-list-head"]')
      ?.getAttribute("aria-sort"),
  ).toBe("ascending");
});

test("a selected row takes the half-muted wash, not the badge-coloured accent", async () => {
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      selectable
      selectedIds={new Set(["a"])}
    />,
  );
  const row = screen.container.querySelector<HTMLElement>(
    '[data-slot="data-list-row"][data-selected]',
  )!;
  expect(row.className).toContain("bg-muted/50");
  expect(row.className).not.toContain("bg-accent");
});

test("the hidden-columns hint is singular for one column and keeps a host aria-describedby", async () => {
  const screen = await render(
    <div style={{ width: "300px" }}>
      <p id="host-note">Host note</p>
      <DataList
        aria-describedby="host-note"
        columns={[
          { key: "name", header: "Name" },
          { key: "role", header: "Role", minWidth: 10_000, mobile: "hidden" },
        ]}
        data={wideData}
        getRowId={(r) => r.id}
      />
    </div>,
  );
  await expect
    .poll(
      () =>
        screen.container.querySelector('[data-slot="data-list-hidden-hint"]')
          ?.textContent,
    )
    .toBe("1 column hidden");
  const describedBy = screen
    .getByRole("table")
    .element()
    .getAttribute("aria-describedby")!
    .split(" ");
  expect(describedBy[0]).toBe("host-note");
  expect(describedBy).toHaveLength(2);
});

test('`mobile: "visible"` never hides, however little room is left', async () => {
  await render(
    <div style={{ width: "300px" }}>
      <DataList
        columns={[
          { key: "name", header: "Name" },
          { key: "role", header: "Role", minWidth: 10_000, mobile: "visible" },
          { key: "email", header: "Email" },
        ]}
        data={wideData}
        getRowId={(r) => r.id}
      />
    </div>,
  );
  // Role stays although it can never fit; Email (after the budget is spent) merges.
  await expect.poll(headerTexts).toEqual(["Name", "Role"]);
});

test("hiding is right-to-left with no holes", async () => {
  await render(
    <div style={{ width: "300px" }}>
      <DataList
        columns={[
          { key: "name", header: "Name", minWidth: 10 },
          { key: "role", header: "Role", minWidth: 10_000 },
          { key: "team", header: "Team", minWidth: 10 },
        ]}
        data={wideData}
        getRowId={(r) => r.id}
      />
    </div>,
  );
  // Team alone would fit, but once Role overflows every later column overflows too.
  await expect.poll(headerTexts).toEqual(["Name"]);
});

test("a narrow DataList never overflows its table container", async () => {
  await render(
    <div style={{ width: "320px" }}>
      <DataList
        aria-label="People"
        columns={Array.from({ length: 10 }, (_, index) => ({
          key: `c${index}`,
          header: `Column ${index}`,
          render: () => `Value ${index}`,
        }))}
        data={wideData}
        getRowId={(r) => r.id}
      />
    </div>,
  );
  const container = document.querySelector<HTMLElement>(
    '[data-slot="table-container"]',
  )!;
  await expect.poll(() => headerTexts().length).toBe(2);
  expect(container.clientWidth).toBeGreaterThan(0);
  expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth);
});

test("revelation follows the container as it resizes", async () => {
  function Host() {
    const [width, setWidth] = React.useState(1200);
    return (
      <div>
        <button type="button" onClick={() => setWidth(300)}>
          narrow
        </button>
        <div style={{ width: `${width}px` }}>
          <DataList
            columns={[
              { key: "name", header: "Name" },
              { key: "role", header: "Role" },
              { key: "email", header: "Email" },
            ]}
            data={wideData}
            getRowId={(r) => r.id}
          />
        </div>
      </div>
    );
  }
  const screen = await render(<Host />);
  await expect.poll(headerTexts).toEqual(["Name", "Role", "Email"]);
  (
    screen.getByRole("button", { name: "narrow" }).element() as HTMLElement
  ).click();
  await expect.poll(headerTexts).toEqual(["Name", "Role"]);
  expect(
    document.querySelector('[data-slot="data-list-merged"]')?.textContent,
  ).toBe("Email: ada@vega.dev");
});

test("the server render shows every column (LAY-9's declared answer)", async () => {
  const { renderToString } = await import("react-dom/server");
  const html = renderToString(
    <DataList
      columns={[
        { key: "name", header: "Name" },
        { key: "role", header: "Role" },
        { key: "email", header: "Email", mobile: "hidden" },
      ]}
      data={wideData}
      getRowId={(r) => r.id}
    />,
  );
  const doc = new DOMParser().parseFromString(html, "text/html");
  expect(
    Array.from(doc.querySelectorAll('[data-slot="data-list-head"]')).map(
      (th) => th.textContent,
    ),
  ).toEqual(["Name", "Role", "Email"]);
  expect(doc.querySelector('[data-slot="data-list-merged"]')).toBeNull();
  expect(doc.querySelector('[data-slot="data-list-hidden-hint"]')).toBeNull();
});

test("a callback ref still receives the table, and the loading skeleton follows the revealed columns", async () => {
  let node: HTMLTableElement | null = null;
  await render(
    <div style={{ width: "300px" }}>
      <DataList
        ref={(el) => {
          node = el;
        }}
        loading
        columns={[
          { key: "name", header: "Name" },
          { key: "role", header: "Role" },
          { key: "email", header: "Email" },
        ]}
        data={wideData}
        getRowId={(r) => r.id}
      />
    </div>,
  );
  expect(node).toBeInstanceOf(HTMLTableElement);
  await expect.poll(headerTexts).toEqual(["Name", "Role"]);
  const skeletonRow = document.querySelector(
    '[data-slot="data-list-skeleton-row"]',
  )!;
  expect(skeletonRow.querySelectorAll("td")).toHaveLength(2);
});

test("loadMore renders the shared LoadMore footer above the footer slot (DS-31)", async () => {
  const onLoadMore = vi.fn();
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      loadMore={{ hasMore: true, onLoadMore }}
      footer={<p data-testid="host-footer">3 people</p>}
    />,
  );
  const loadMore = screen.container.querySelector('[data-slot="load-more"]');
  expect(loadMore).not.toBeNull();
  const footer = screen.container.querySelector(
    '[data-slot="data-list-footer"]',
  );
  // LoadMore sits between the table and the host footer.
  expect(
    loadMore!.compareDocumentPosition(footer!) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  await screen.getByRole("button", { name: "Load more" }).click();
  expect(onLoadMore).toHaveBeenCalledOnce();
  await expectNoA11yViolations(screen.container);
});

test("aria-rowcount is -1 while more rows exist, unset once complete (DS-31)", async () => {
  const props = {
    columns,
    data,
    getRowId: (r: Row) => r.id,
  };
  const screen = await render(
    <DataList {...props} loadMore={{ hasMore: true, onLoadMore: () => {} }} />,
  );
  await expect
    .element(screen.getByRole("table"))
    .toHaveAttribute("aria-rowcount", "-1");
  await screen.rerender(
    <DataList {...props} loadMore={{ hasMore: false, onLoadMore: () => {} }} />,
  );
  await expect
    .element(screen.getByRole("table"))
    .not.toHaveAttribute("aria-rowcount");
  expect(screen.container.querySelector('[data-slot="load-more"]')).toBeNull();
  await screen.rerender(<DataList {...props} />);
  await expect
    .element(screen.getByRole("table"))
    .not.toHaveAttribute("aria-rowcount");
});

test("loadMore loading, error and done states (DS-31)", async () => {
  const onLoadMore = vi.fn();
  const props = {
    columns,
    data,
    getRowId: (r: Row) => r.id,
  };
  const screen = await render(
    <DataList
      {...props}
      loadMore={{ hasMore: true, loading: true, onLoadMore }}
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Load more" }))
    .toHaveAttribute("aria-busy", "true");
  // A next-page fetch keeps the loaded rows; it is not the skeleton state.
  await expect.element(screen.getByText("Ada")).toBeInTheDocument();
  await expectNoA11yViolations(screen.container);

  await screen.rerender(
    <DataList
      {...props}
      loadMore={{
        hasMore: true,
        onLoadMore,
        error: "Couldn't load more people.",
      }}
    />,
  );
  await expect
    .element(screen.getByRole("alert"))
    .toHaveTextContent("Couldn't load more people.");
  await screen.getByRole("button", { name: "Try again" }).click();
  expect(onLoadMore).toHaveBeenCalledOnce();
  await expectNoA11yViolations(screen.container);

  await screen.rerender(
    <DataList
      {...props}
      loadMore={{ hasMore: false, onLoadMore, endLabel: "End of list" }}
    />,
  );
  expect(
    screen.container.querySelector('[data-slot="load-more"]')?.textContent,
  ).toBe("End of list");
  await expectNoA11yViolations(screen.container);
});

/* DS-01 — a mono column's header is a label in the sans face; only its body cells are mono */

test("DS-01: a mono column's header is sans; its body cell is mono", async () => {
  interface Sku {
    id: string;
    sku: string;
  }
  const screen = await render(
    <DataList<Sku>
      columns={[
        { key: "sku", header: "SKU", mono: true, sortable: true },
        { key: "id", header: "Id" },
      ]}
      data={[{ id: "a", sku: "A-1" }]}
      getRowId={(r) => r.id}
    />,
  );
  const header = [...screen.container.querySelectorAll("th")].find((el) =>
    el.textContent?.startsWith("SKU"),
  )!;
  expect(header.className).not.toContain("font-mono");
  expect(header.className).toContain("tabular-nums");
  const cell = screen.getByRole("cell", { name: "A-1" }).element();
  expect(cell.className).toContain("font-mono");
});

test("no a11y violations — mono column, loading and empty", async () => {
  interface Sku {
    id: string;
    sku: string;
  }
  const cols: DataListColumn<Sku>[] = [
    { key: "sku", header: "SKU", mono: true },
  ];
  const loading = await render(
    <DataList<Sku> columns={cols} data={[]} loading getRowId={(r) => r.id} />,
  );
  await expectNoA11yViolations(loading.container);
  await loading.unmount();
  const empty = await render(
    <DataList<Sku> columns={cols} data={[]} getRowId={(r) => r.id} />,
  );
  await expectNoA11yViolations(empty.container);
});

/* DS-68 — clipped text and timestamps in a list are not tab stops */

test("DS-68: Tab from a row link skips the timestamp to the next row's link", async () => {
  const { RelativeTime } = await import("./relative-time");
  interface Item {
    id: string;
    title: string;
    at: number;
  }
  const NOW = Date.UTC(2026, 8, 24, 12);
  const screen = await render(
    <DataList<Item>
      columns={[
        {
          key: "title",
          header: "Title",
          render: (r) => <a href={`#${r.id}`}>{r.title}</a>,
        },
        {
          key: "at",
          header: "Updated",
          render: (r) => <RelativeTime date={r.at} now={NOW} />,
        },
      ]}
      data={[
        { id: "1", title: "Row 1", at: NOW - 3_600_000 },
        { id: "2", title: "Row 2", at: NOW - 7_200_000 },
      ]}
      getRowId={(r) => r.id}
    />,
  );
  (
    screen.getByRole("link", { name: "Row 1" }).element() as HTMLElement
  ).focus();
  await userEvent.tab();
  await expect
    .element(screen.getByRole("link", { name: "Row 2" }))
    .toHaveFocus();
  for (const time of screen.container.querySelectorAll("time")) {
    expect(time.getAttribute("tabindex")).toBeNull();
  }
});

// ---- DS-34: sections ------------------------------------------------------------------------

interface Task {
  id: string;
  name: string;
  due: "overdue" | "today" | "later";
}

const tasks: Task[] = [
  { id: "t1", name: "Send quote", due: "today" },
  { id: "t2", name: "Call back", due: "overdue" },
  { id: "t3", name: "Order samples", due: "today" },
  { id: "t4", name: "Chase invoice", due: "overdue" },
];

const taskCols: DataListColumn<Task>[] = [{ key: "name", header: "Task" }];

const sectionList = [
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Today" },
  { id: "later", label: "Later" },
];

test("sections render in prop order under one header (DS-34)", async () => {
  const screen = await render(
    <DataList
      data={tasks}
      columns={taskCols}
      getRowId={(r) => r.id}
      sections={sectionList}
      getRowSection={(r) => r.due}
    />,
  );
  expect(screen.container.querySelectorAll("thead")).toHaveLength(1);
  const heads = screen.container.querySelectorAll('th[scope="rowgroup"]');
  expect([...heads].map((h) => h.textContent)).toEqual([
    expect.stringMatching(/^Overdue/),
    expect.stringMatching(/^Today/),
  ]);
  // An empty section is omitted.
  expect(screen.container.textContent).not.toContain("Later");
  const bodies = screen.container.querySelectorAll(
    'tbody[data-slot="data-list-section"]',
  );
  expect(bodies).toHaveLength(2);
  expect(bodies[0]!.textContent).toContain("Call back");
  expect(bodies[0]!.textContent).toContain("Chase invoice");
  expect(bodies[1]!.textContent).toContain("Send quote");
  await expectNoA11yViolations(screen.container);
});

test("collapsing a section hides its rows and flips aria-expanded (DS-34)", async () => {
  const onGroupStateChange = vi.fn();
  const screen = await render(
    <DataList
      data={tasks}
      columns={taskCols}
      getRowId={(r) => r.id}
      sections={sectionList}
      getRowSection={(r) => r.due}
      onGroupStateChange={onGroupStateChange}
    />,
  );
  const toggle = screen.getByRole("button", { name: /Overdue/ });
  await expect.element(toggle).toHaveAttribute("aria-expanded", "true");
  await toggle.click();
  await expect.element(toggle).toHaveAttribute("aria-expanded", "false");
  expect(screen.container.textContent).not.toContain("Call back");
  expect(screen.container.textContent).toContain("Send quote");
  expect(onGroupStateChange).toHaveBeenLastCalledWith({
    overdue: "collapsed",
  });
  await expectNoA11yViolations(screen.container);
});

test("a section shows its count, and a host count wins (DS-34)", async () => {
  const screen = await render(
    <DataList
      data={tasks}
      columns={taskCols}
      getRowId={(r) => r.id}
      sections={[
        { id: "overdue", label: "Overdue", count: 12 },
        { id: "today", label: "Today" },
      ]}
      getRowSection={(r) => r.due}
      defaultGroupState={{ today: "collapsed" }}
    />,
  );
  const counts = screen.container.querySelectorAll(
    '[data-slot="section-row-count"]',
  );
  expect([...counts].map((c) => c.textContent)).toEqual(["12", "2"]);
  await expect
    .element(screen.getByRole("button", { name: /Today/ }))
    .toHaveAttribute("aria-expanded", "false");
});

test("select-all covers loaded rows across sections, and loadMore appends into its section (DS-34)", async () => {
  const onSelectionChange = vi.fn();
  const props = {
    columns: taskCols,
    getRowId: (r: Task) => r.id,
    sections: sectionList,
    getRowSection: (r: Task) => r.due,
    selectable: true,
    onSelectionChange,
  };
  const screen = await render(
    <DataList
      {...props}
      data={tasks}
      loadMore={{ hasMore: true, onLoadMore: () => {} }}
    />,
  );
  (
    screen
      .getByRole("checkbox", { name: "Select all rows" })
      .element() as HTMLElement
  ).click();
  expect(onSelectionChange.mock.calls.at(-1)![0].size).toBe(4);
  await screen.rerender(
    <DataList
      {...props}
      data={[...tasks, { id: "t5", name: "Review drawings", due: "overdue" }]}
      loadMore={{ hasMore: false, onLoadMore: () => {} }}
    />,
  );
  const bodies = screen.container.querySelectorAll(
    'tbody[data-slot="data-list-section"]',
  );
  expect(bodies[0]!.textContent).toContain("Review drawings");
});

test("rowActionsColumn adds a named row menu that never activates the row (DS-32)", async () => {
  const onRowClick = vi.fn();
  const onEdit = vi.fn();
  const screen = await render(
    <DataList
      columns={[
        ...columns,
        rowActionsColumn<Row>({
          getRowLabel: (r) => r.name,
          actions: () => [{ label: "Edit", onSelect: onEdit }],
        }),
      ]}
      data={data}
      getRowId={(r) => r.id}
      onRowClick={onRowClick}
    />,
  );
  // The column header is named for assistive tech only.
  const header = [...screen.container.querySelectorAll("thead th")].at(-1)!;
  expect(header.textContent).toBe("Actions");
  expect(header.querySelector(".sr-only")).not.toBeNull();
  await screen.getByRole("button", { name: "Actions for Bea" }).click();
  await screen.getByRole("menuitem", { name: "Edit" }).click();
  expect(onEdit).toHaveBeenCalledOnce();
  expect(onRowClick).not.toHaveBeenCalled();
});

// ---- DS-33: rows as links --------------------------------------------------------------------

test("getRowHref makes the first cell a real link (DS-33)", async () => {
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      getRowHref={(r) => `/people/${r.id}`}
    />,
  );
  const link = screen.getByRole("link", { name: "Ada" });
  await expect.element(link).toHaveAttribute("href", "/people/a");
  expect(
    screen.container.querySelector('[data-slot="data-list-row-action"]'),
  ).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("a row click forwards to its link, modifiers kept; interactive cells don't navigate (DS-33)", async () => {
  const clicks: { href: string; meta: boolean }[] = [];
  const onButton = vi.fn();
  const screen = await render(
    <DataList
      columns={[
        ...columns,
        {
          key: "act",
          header: "Act",
          interactive: true,
          render: () => (
            <button type="button" onClick={onButton}>
              Ping
            </button>
          ),
        },
      ]}
      data={data}
      getRowId={(r) => r.id}
      getRowHref={(r) => `#person-${r.id}`}
    />,
  );
  for (const a of screen.container.querySelectorAll("a")) {
    a.addEventListener("click", (e) => {
      clicks.push({
        href: (e.currentTarget as HTMLAnchorElement).getAttribute("href")!,
        meta: (e as MouseEvent).metaKey,
      });
      e.preventDefault();
    });
  }
  const roleCell = screen.getByRole("cell", { name: "Designer" }).element();
  roleCell.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true, metaKey: true }),
  );
  expect(clicks).toEqual([{ href: "#person-b", meta: true }]);
  await screen.getByRole("button", { name: "Ping" }).first().click();
  expect(onButton).toHaveBeenCalledOnce();
  expect(clicks).toHaveLength(1);
});

test("getRowLabel names the selection checkbox (DS-33)", async () => {
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      selectable
      getRowLabel={(r) => r.name}
    />,
  );
  await expect
    .element(screen.getByRole("checkbox", { name: "Select Bea" }))
    .toBeInTheDocument();
});

test("rowLinkRender renders a router link (DS-33)", async () => {
  function RouterLink(props: React.ComponentProps<"a">) {
    return <a data-router="" {...props} />;
  }
  const screen = await render(
    <DataList
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      getRowHref={(r) => `/people/${r.id}`}
      rowLinkRender={<RouterLink href="" />}
    />,
  );
  // The row's href wins over the shared template's placeholder.
  const link = screen.getByRole("link", { name: "Cole" });
  await expect.element(link).toHaveAttribute("data-router", "");
  await expect.element(link).toHaveAttribute("href", "/people/c");
});

// ---- range selection, keyboard, the selection bar, drag into (plan 2026-09-30) ----------------

interface FileRow {
  id: string;
  name: string;
  kind: "folder" | "file";
}

const files: FileRow[] = [
  { id: "f1", name: "Clients", kind: "folder" },
  { id: "f2", name: "Projects", kind: "folder" },
  { id: "d1", name: "brief.pdf", kind: "file" },
  { id: "d2", name: "notes.md", kind: "file" },
  { id: "d3", name: "plan.xlsx", kind: "file" },
];
const fileColumns: DataListColumn<FileRow>[] = [
  { key: "name", header: "Name" },
  { key: "kind", header: "Kind" },
];

function Files(
  props: Partial<React.ComponentProps<typeof DataList<FileRow>>> & {
    initial?: string[];
  },
) {
  const { initial = [], ...rest } = props;
  const [selected, setSelected] = React.useState(() => new Set(initial));
  return (
    <DataList<FileRow>
      aria-label="Files"
      columns={fileColumns}
      data={files}
      getRowId={(r) => r.id}
      getRowLabel={(r) => r.name}
      getRowHref={(r) => `#${r.id}`}
      selectable
      selectedIds={selected}
      onSelectionChange={setSelected}
      {...rest}
    />
  );
}

const box = (name: string) =>
  document.querySelector<HTMLElement>(`[aria-label="Select ${name}"]`)!;
const isChecked = (name: string) =>
  box(name).getAttribute("aria-checked") === "true";
const checkedNames = () =>
  files.map((f) => f.name).filter((name) => isChecked(name));

/** Toggle a checkbox the way a pointer does, with or without Shift held. */
async function toggle(name: string, shiftKey = false) {
  box(name).dispatchEvent(
    new PointerEvent("pointerdown", { bubbles: true, shiftKey }),
  );
  box(name).click();
  await new Promise((r) => setTimeout(r, 0));
}

test("shift-toggle selects the range from the last toggled row, and clears it the same way", async () => {
  await render(<Files />);
  await toggle("Projects");
  await toggle("notes.md", true);
  await expect
    .poll(checkedNames)
    .toEqual(["Projects", "brief.pdf", "notes.md"]);
  // Upward from the new anchor, and a range whose end is checked clears it.
  await toggle("Clients", true);
  await expect
    .poll(checkedNames)
    .toEqual(["Clients", "Projects", "brief.pdf", "notes.md"]);
  await toggle("brief.pdf");
  await toggle("Clients", true);
  await expect.poll(checkedNames).toEqual(["notes.md"]);
  // Without Shift it is a single toggle.
  await toggle("plan.xlsx");
  await expect.poll(checkedNames).toEqual(["notes.md", "plan.xlsx"]);
});

test("⌘/Ctrl+A selects every row from inside the list, Escape clears, Space toggles a focused row", async () => {
  const screen = await render(
    <Files toolbar={<input aria-label="Search files" />} />,
  );
  // Never from a text field: the field keeps its own select-all.
  (
    screen
      .getByRole("textbox", { name: "Search files" })
      .element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{Control>}a{/Control}");
  expect(checkedNames()).toEqual([]);

  (
    screen.getByRole("link", { name: "notes.md" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard(" ");
  await expect.poll(checkedNames).toEqual(["notes.md"]);
  await userEvent.keyboard("{Control>}a{/Control}");
  await expect.poll(checkedNames).toEqual(files.map((f) => f.name));
  await userEvent.keyboard("{Meta>}a{/Meta}"); // idempotent, either modifier
  await expect.poll(checkedNames).toEqual(files.map((f) => f.name));
  await userEvent.keyboard("{Escape}");
  await expect.poll(checkedNames).toEqual([]);
});

test("the keyboard shortcuts are off without `selectable`", async () => {
  const onSelectionChange = vi.fn();
  const screen = await render(
    <DataList<FileRow>
      columns={fileColumns}
      data={files}
      getRowId={(r) => r.id}
      getRowHref={(r) => `#${r.id}`}
      onSelectionChange={onSelectionChange}
    />,
  );
  (
    screen.getByRole("link", { name: "Clients" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{Control>}a{/Control}");
  expect(onSelectionChange).not.toHaveBeenCalled();
});

test("selectionActions docks a bar with the count, the host's actions and Clear selection", async () => {
  const onTrash = vi.fn();
  const screen = await render(
    <Files
      initial={["d1", "d2"]}
      selectionActions={(ids, clear) => (
        <ActionBarButton
          onClick={() => {
            onTrash([...ids]);
            clear();
          }}
        >
          Move to Trash
        </ActionBarButton>
      )}
    />,
  );
  const bar = document.querySelector<HTMLElement>(
    '[data-slot="data-list-selection-bar"]',
  )!;
  expect(bar.getAttribute("data-active")).toBe("true");
  expect(
    bar.querySelector('[data-slot="action-bar-status"]')?.textContent,
  ).toBe("2 selected");
  // The bar stacks over a docked player, and the list keeps room under its last row for both.
  expect(bar.className).toContain("var(--dock-inset-bottom,0px)");
  const spacer = () =>
    document.querySelector('[data-slot="data-list-selection-spacer"]');
  expect(spacer()?.className).toContain("var(--dock-inset-bottom,0px)");
  await expectNoA11yViolations(document.body);

  await screen.getByRole("button", { name: "Move to Trash" }).click();
  expect(onTrash).toHaveBeenCalledWith(["d1", "d2"]);
  await expect.poll(() => bar.getAttribute("data-active")).toBe("false");
  expect(bar.hasAttribute("inert")).toBe(true);
  expect(spacer()).toBeNull();

  await toggle("Clients");
  await expect.poll(() => bar.getAttribute("data-active")).toBe("true");
  await screen.getByRole("button", { name: "Clear selection" }).click();
  await expect.poll(checkedNames).toEqual([]);
});

test("the selection bar passes secondaryActions and moreLabel through to ActionBar", async () => {
  const onArchive = vi.fn();
  const screen = await render(
    <Files
      initial={["d1"]}
      selectionActions={() => <ActionBarButton>Move</ActionBarButton>}
      selectionSecondaryActions={[{ label: "Archive", onClick: onArchive }]}
      selectionMoreLabel="More for selection"
    />,
  );
  const bar = document.querySelector<HTMLElement>(
    '[data-slot="data-list-selection-bar"]',
  )!;
  const more = bar.querySelector('[aria-label="More for selection"]');
  const archive = [...bar.querySelectorAll("button")].find(
    (b) => b.textContent === "Archive",
  );
  expect(more !== null || archive !== undefined).toBe(true);
  if (archive) {
    archive.click();
  } else {
    await screen.getByRole("button", { name: "More for selection" }).click();
    await screen.getByRole("menuitem", { name: "Archive" }).click();
  }
  expect(onArchive).toHaveBeenCalledTimes(1);
});

test("the grid view carries the same checkboxes, ranges and selected state", async () => {
  await render(<Files view="grid" onViewChange={() => {}} initial={["f2"]} />);
  const items = document.querySelectorAll('[data-slot="data-list-grid-item"]');
  expect(items).toHaveLength(files.length);
  expect(
    document.querySelector('[data-row-id="f2"]')?.hasAttribute("data-selected"),
  ).toBe(true);
  // Once anything is selected every card's checkbox shows, not only on hover.
  for (const select of document.querySelectorAll(
    '[data-slot="data-list-card-select"]',
  ))
    expect(select.className).toContain("opacity-100");
  await toggle("Projects");
  await toggle("notes.md", true);
  await expect
    .poll(checkedNames)
    .toEqual(["Projects", "brief.pdf", "notes.md"]);
  await expectNoA11yViolations(document.body);
});

test("no a11y violations — list with a selection", async () => {
  await render(<Files initial={["f1", "d3"]} />);
  await expectNoA11yViolations(document.body);
});

/** Drive a Pragmatic drag from `source` to the middle of `target`. */
async function dragTo(source: HTMLElement, target: HTMLElement) {
  const dt = new DataTransfer();
  const s = source.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const at = {
    bubbles: true,
    cancelable: true,
    dataTransfer: dt,
    clientX: t.left + t.width / 2,
    clientY: t.top + t.height / 2,
  };
  source.dispatchEvent(
    new DragEvent("dragstart", {
      ...at,
      clientX: s.left + s.width / 2,
      clientY: s.top + s.height / 2,
    }),
  );
  await new Promise((r) => setTimeout(r, 60));
  for (const type of ["dragenter", "dragover"] as const) {
    target.dispatchEvent(new DragEvent(type, at));
    await new Promise((r) => setTimeout(r, 60));
  }
  target.dispatchEvent(new DragEvent("drop", at));
  source.dispatchEvent(new DragEvent("dragend", at));
  await new Promise((r) => setTimeout(r, 60));
}

const rowOf = (id: string) =>
  document.querySelector<HTMLElement>(
    `[data-slot="data-list-row"][data-row-id="${id}"]`,
  )!;

test("onDropInto: rows drag onto folder rows; a selected row carries the selection; refusals take nothing", async () => {
  const onDropInto = vi.fn();
  await render(
    <Files
      initial={["d2", "d3"]}
      onDropInto={onDropInto}
      canDropOnRow={(r) => r.kind === "folder"}
      canDropInto={({ ids, targetId }) =>
        !(targetId === "f2" && ids.includes("d1"))
      }
    />,
  );
  expect(rowOf("d1").getAttribute("draggable")).toBe("true");
  // The row's own link must not start a URL drag of its own.
  expect(
    rowOf("d1")
      .querySelector('[data-slot="data-list-row-link"]')
      ?.getAttribute("draggable"),
  ).toBe("false");

  await dragTo(rowOf("d1"), rowOf("f1"));
  expect(onDropInto).toHaveBeenLastCalledWith({ ids: ["d1"], targetId: "f1" });

  onDropInto.mockClear();
  await dragTo(rowOf("d3"), rowOf("f1"));
  expect(onDropInto).toHaveBeenLastCalledWith({
    ids: ["d2", "d3"],
    targetId: "f1",
  });

  onDropInto.mockClear();
  await dragTo(rowOf("d1"), rowOf("f2")); // canDropInto refuses
  await dragTo(rowOf("d1"), rowOf("d2")); // not a folder
  await dragTo(rowOf("f1"), rowOf("f1")); // onto itself
  expect(onDropInto).not.toHaveBeenCalled();
});

test("canMoveItem locks a row: no drag source, left out of a dragged selection, still a link", async () => {
  const onDropInto = vi.fn();
  await render(
    <Files
      initial={["d2", "d3"]}
      onDropInto={onDropInto}
      canDropOnRow={(r) => r.kind === "folder"}
      canMoveItem={(r) => r.id !== "d2"}
    />,
  );
  expect(rowOf("d2").hasAttribute("draggable")).toBe(false);
  expect(rowOf("d2").hasAttribute("data-move-locked")).toBe(true);
  expect(rowOf("d3").getAttribute("draggable")).toBe("true");
  expect(rowOf("d3").hasAttribute("data-move-locked")).toBe(false);
  // The locked row still opens.
  expect(
    rowOf("d2")
      .querySelector('[data-slot="data-list-row-link"]')
      ?.getAttribute("href"),
  ).toBe("#d2");
  await dragTo(rowOf("d2"), rowOf("f1"));
  expect(onDropInto).not.toHaveBeenCalled();
  await dragTo(rowOf("d3"), rowOf("f1"));
  expect(onDropInto).toHaveBeenLastCalledWith({ ids: ["d3"], targetId: "f1" });
  await expectNoA11yViolations(document.body);
});

test("without onDropInto rows are not draggable", async () => {
  await render(<Files />);
  expect(rowOf("d1").hasAttribute("draggable")).toBe(false);
  expect(
    rowOf("d1")
      .querySelector('[data-slot="data-list-row-link"]')
      ?.hasAttribute("draggable"),
  ).toBe(false);
});

test("gridDensity dense sets the file-browser column ladder, loading skeleton included", async () => {
  type Tile = { id: string; name: string };
  const tiles: Tile[] = Array.from({ length: 6 }, (_, i) => ({
    id: `t${i}`,
    name: `Tile ${i}`,
  }));
  const variants: Record<
    string,
    Partial<React.ComponentProps<typeof DataList<Tile>>>
  > = {
    "lg dense": { gridSize: "lg", gridDensity: "dense" },
    "lg dense loading": { gridSize: "lg", gridDensity: "dense", loading: true },
    dense: { gridDensity: "dense" },
    lg: { gridSize: "lg" },
  };
  await render(
    <>
      {Object.entries(variants).map(([label, props]) => (
        <DataList<Tile>
          key={label}
          aria-label={label}
          columns={[{ key: "name", header: "Name" }]}
          data={tiles}
          getRowId={(r) => r.id}
          view="grid"
          {...props}
        />
      ))}
    </>,
  );
  const classesOf = (label: string) =>
    document
      .querySelector(
        `[data-slot="data-list-grid-root"][aria-label="${label}"]`,
      )!
      .querySelector<HTMLElement>(
        '[data-slot="data-list-grid"], [data-slot="data-list-grid-skeleton"]',
      )!
      .className.split(" ");
  const lgDense = classesOf("lg dense");
  expect(lgDense).toEqual(
    expect.arrayContaining([
      "grid-cols-1",
      "@xs/data-list:grid-cols-2",
      "@2xl/data-list:grid-cols-3",
      "@5xl/data-list:grid-cols-4",
      "@7xl/data-list:grid-cols-5",
    ]),
  );
  expect(lgDense).not.toContain("grid-cols-2");
  expect(classesOf("lg dense loading")).toEqual(
    expect.arrayContaining([
      "@xs/data-list:grid-cols-2",
      "@7xl/data-list:grid-cols-5",
    ]),
  );
  // The lg skeleton is the MediaCard lg shape: a 16:9 block and two text lines.
  const skeletonCard = document.querySelector(
    '[aria-label="lg dense loading"] [data-slot="data-list-grid-skeleton-card"]',
  )!;
  const blocks = skeletonCard.querySelectorAll('[data-slot="skeleton"]');
  expect(blocks).toHaveLength(3);
  expect(blocks[0]!.className).toContain("aspect-video");
  expect(classesOf("dense")).toEqual(
    expect.arrayContaining([
      "grid-cols-1",
      "@lg/data-list:grid-cols-2",
      "@3xl/data-list:grid-cols-3",
      "@6xl/data-list:grid-cols-4",
    ]),
  );
  // The default density keeps its ladder: at most three lg columns.
  const lg = classesOf("lg");
  expect(lg).toEqual(
    expect.arrayContaining([
      "grid-cols-1",
      "@xl/data-list:grid-cols-2",
      "@5xl/data-list:grid-cols-3",
    ]),
  );
  expect(lg.some((c) => c.endsWith("grid-cols-4"))).toBe(false);
});

/** Drive a desktop file drag (Pragmatic's external adapter) onto the middle of `target`. */
async function dropFiles(target: HTMLElement, files: File[]) {
  const dt = new DataTransfer();
  for (const file of files) dt.items.add(file);
  const t = target.getBoundingClientRect();
  const at = {
    bubbles: true,
    cancelable: true,
    dataTransfer: dt,
    clientX: t.left + t.width / 2,
    clientY: t.top + t.height / 2,
  };
  for (const type of ["dragenter", "dragover"] as const) {
    target.dispatchEvent(new DragEvent(type, at));
    await new Promise((r) => setTimeout(r, 60));
  }
  target.dispatchEvent(new DragEvent("drop", at));
  await new Promise((r) => setTimeout(r, 120));
}

test("onDropFilesOnRow: desktop files dropped on a folder row go to that row, not the outer file-drop surface", async () => {
  const onRow = vi.fn();
  const onOver = vi.fn();
  const onSurface = vi.fn();
  function Surface() {
    const drop = useFileDrop({ onFilesAccepted: onSurface });
    return (
      <div {...drop.dropProps}>
        <input {...drop.inputProps} />
        <DataList<FileRow>
          aria-label="Files"
          columns={fileColumns}
          data={files}
          getRowId={(r) => r.id}
          getRowLabel={(r) => r.name}
          canDropOnRow={(r) => r.kind === "folder"}
          onDropFilesOnRow={onRow}
          onFilesOverRow={onOver}
        />
      </div>
    );
  }
  await render(<Surface />);
  const report = new File(["q3"], "report.txt", { type: "text/plain" });
  await dropFiles(rowOf("f1"), [report]);
  await expect.poll(() => onRow.mock.calls.length).toBe(1);
  expect(onRow).toHaveBeenCalledWith("f1", [
    { file: expect.any(File), relativePath: "report.txt" },
  ]);
  expect(onOver.mock.calls).toEqual([["f1"], [null]]);
  expect(rowOf("f1").hasAttribute("data-drop-over")).toBe(false);
  expect(onSurface).not.toHaveBeenCalled();

  // A file row is no target: the surface takes that drop.
  await dropFiles(rowOf("d1"), [report]);
  await expect.poll(() => onSurface.mock.calls.length).toBe(1);
  expect(onRow).toHaveBeenCalledTimes(1);
});

test("a clickable grid card holding an interactive column is a labelled group, not a button", async () => {
  const onRowClick = vi.fn();
  const screen = await render(
    <DataList<Row>
      aria-label="People"
      view="grid"
      columns={[
        { key: "name", header: "Name" },
        {
          key: "role",
          header: "Role",
          interactive: true,
          render: (row) => <button type="button">Edit {row.name}</button>,
        },
      ]}
      data={data}
      getRowId={(r) => r.id}
      getRowLabel={(r) => r.name}
      onRowClick={onRowClick}
    />,
  );
  const card = await vi.waitUntil(() =>
    screen.container.querySelector<HTMLElement>(
      '[data-slot="data-list-grid-item"] [tabindex="0"]',
    ),
  );
  expect(card.getAttribute("role")).toBe("group");
  expect(card.getAttribute("aria-label")).toBe("Ada");
  expect(
    screen.container.querySelector(
      '[data-slot="data-list-grid"] [role="button"]',
    ),
  ).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("board view passes each section's icon and ⋯ actions, a header add button and boardTrailing to the Board", async () => {
  const onAdd = vi.fn();
  const onHide = vi.fn();
  const screen = await render(
    <DataList
      data={tasks}
      columns={taskCols}
      getRowId={(r) => r.id}
      view="board"
      boardHeight="auto"
      sections={sectionList.map((section) => ({
        ...section,
        icon: <svg aria-hidden="true" />,
        actions: [{ label: "Hide column", onSelect: () => onHide(section.id) }],
      }))}
      getRowSection={(r) => r.due}
      onMove={() => {}}
      onAddToSection={onAdd}
      addLabel="Add task"
      addPlacement="header"
      boardTrailing={<p>Hidden columns</p>}
    />,
  );
  const headers = screen.container.querySelectorAll(
    '[data-slot="board-column-header"]',
  );
  expect(headers.length).toBe(3);
  for (const header of headers) {
    expect(
      header.querySelector('[data-slot="board-column-icon"]'),
    ).not.toBeNull();
    expect(
      header.querySelector('[data-slot="board-column-menu"]'),
    ).not.toBeNull();
    expect(
      header.querySelector('button[aria-label="Add task"]'),
    ).not.toBeNull();
  }
  (
    headers[1]!.querySelector('button[aria-label="Add task"]') as HTMLElement
  ).click();
  expect(onAdd).toHaveBeenCalledWith("today");
  await expect.element(screen.getByText("Hidden columns")).toBeInTheDocument();
});

test("keyboardNavigation: J/K and arrows move the cursor, Enter opens, Escape clears", async () => {
  const onRowClick = vi.fn();
  const onCursorChange = vi.fn();
  const screen = await render(
    <DataList
      aria-label="People"
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      onRowClick={onRowClick}
      onCursorChange={onCursorChange}
      keyboardNavigation
    />,
  );
  const row = (id: string) =>
    document.querySelector(`[data-slot="data-list-row"][data-row-id="${id}"]`)!;
  await userEvent.keyboard("j");
  expect(row("a").hasAttribute("data-cursor")).toBe(true);
  await userEvent.keyboard("{ArrowDown}");
  expect(row("a").hasAttribute("data-cursor")).toBe(false);
  expect(row("b").hasAttribute("data-cursor")).toBe(true);
  await userEvent.keyboard("k");
  expect(row("a").hasAttribute("data-cursor")).toBe(true);
  await userEvent.keyboard("{Enter}");
  expect(onRowClick).toHaveBeenCalledWith(data[0], 0);
  await userEvent.keyboard("{Escape}");
  expect(document.querySelector("[data-cursor]")).toBeNull();
  expect(onCursorChange).toHaveBeenLastCalledWith(null);
  await expectNoA11yViolations(screen.container);
});

test("keyboardNavigation: the cursor follows the pointer and ignores keys typed in a field", async () => {
  const screen = await render(
    <>
      <input aria-label="Search" />
      <DataList
        aria-label="People"
        columns={columns}
        data={data}
        getRowId={(r) => r.id}
        keyboardNavigation
      />
    </>,
  );
  await userEvent.hover(screen.getByText("Cole"));
  const cole = document.querySelector('[data-row-id="c"]')!;
  expect(cole.hasAttribute("data-cursor")).toBe(true);
  await userEvent.keyboard("k");
  expect(
    document.querySelector('[data-row-id="b"]')!.hasAttribute("data-cursor"),
  ).toBe(true);
  await userEvent.click(screen.getByRole("textbox", { name: "Search" }));
  await userEvent.keyboard("j");
  expect(
    document.querySelector('[data-row-id="b"]')!.hasAttribute("data-cursor"),
  ).toBe(true);
});

test("cursorId paints a controlled cursor without keyboardNavigation", async () => {
  await render(
    <DataList
      aria-label="People"
      columns={columns}
      data={data}
      getRowId={(r) => r.id}
      cursorId="b"
      onCursorChange={() => {}}
    />,
  );
  expect(
    document.querySelector('[data-row-id="b"]')!.hasAttribute("data-cursor"),
  ).toBe(true);
  await userEvent.keyboard("j");
  expect(
    document.querySelector('[data-row-id="b"]')!.hasAttribute("data-cursor"),
  ).toBe(true);
});
