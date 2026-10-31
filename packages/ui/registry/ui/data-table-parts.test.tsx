import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Table, TableBody, TableHeader, TableRow } from "@/components/ui/table";
import {
  ColumnResizeHandle,
  columnResizeKeyWidth,
  GridSummaryCell,
  RowActionsMenu,
  SectionRow,
  alignClass,
  columnCellClass,
  cycleSort,
  DEFAULT_COLUMN_MIN_WIDTH,
  EmptyRow,
  headerCellClass,
  isNowrapColumn,
  revealColumns,
  SELECTION_COLUMN_WIDTH,
  SelectAllHead,
  SelectionCell,
  SkeletonRows,
  SortableHead,
  SortHeaderButton,
  mergedValueClass,
  offscreenSortSummary,
  SELECTED_ROW_CLASS,
  useContainerWidth,
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

test("SectionRow is a rowgroup header with a disclosure and a muted count (DS-34)", async () => {
  const onExpandedChange = vi.fn();
  const screen = await render(
    <Table aria-label="Tasks">
      <TableBody>
        <SectionRow
          id="overdue"
          label="Overdue"
          count={3}
          colSpan={2}
          expanded
          onExpandedChange={onExpandedChange}
        />
      </TableBody>
    </Table>,
  );
  const th = document.querySelector('th[scope="rowgroup"]')!;
  expect(th.getAttribute("colspan")).toBe("2");
  const toggle = screen.getByRole("button", { name: "Overdue, 3 rows" });
  await expect.element(toggle).toHaveAttribute("aria-expanded", "true");
  expect(
    screen.container.querySelector('[data-slot="section-row-count"]')!
      .className,
  ).toContain("tabular-nums");
  await toggle.click();
  expect(onExpandedChange).toHaveBeenCalledWith(false);
  await expectNoA11yViolations(screen.container);
});

test('SectionRow shows a count above 99 as "99+" and says the number', async () => {
  const screen = await render(
    <Table aria-label="Tasks">
      <TableBody>
        <SectionRow
          id="later"
          label="Later"
          count={250}
          colSpan={2}
          expanded
          onExpandedChange={() => {}}
        />
      </TableBody>
    </Table>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Later, 250 rows" }))
    .toBeInTheDocument();
  expect(
    screen.container.querySelector('[data-slot="section-row-count"]')!
      .textContent,
  ).toBe("99+");
});

// ---- DS-32: row actions --------------------------------------------------------------------

test("RowActionsMenu names its trigger from the row and runs an action (DS-32)", async () => {
  const onEdit = vi.fn();
  const screen = await render(
    <RowActionsMenu
      label="Aria"
      actions={[
        { label: "Edit", onSelect: onEdit },
        { label: "Delete", destructive: true, onSelect: () => {} },
      ]}
    />,
  );
  await screen.getByRole("button", { name: "Actions for Aria" }).click();
  await expect
    .element(screen.getByRole("menuitem", { name: "Delete" }))
    .toHaveAttribute("data-variant", "destructive");
  await screen.getByRole("menuitem", { name: "Edit" }).click();
  expect(onEdit).toHaveBeenCalledOnce();
});

test("a disabled action stays reachable by arrow keys and does nothing (DS-32)", async () => {
  const onDelete = vi.fn();
  const screen = await render(
    <RowActionsMenu
      label="Aria"
      actions={[
        { label: "Edit", onSelect: () => {} },
        {
          label: "Delete",
          destructive: true,
          disabled: true,
          disabledReason: "In use by 3 products",
          onSelect: onDelete,
        },
      ]}
    />,
  );
  await screen.getByRole("button", { name: "Actions for Aria" }).click();
  // One key per settled focus: a second key sent while the first still moves focus into the
  // popup is dropped (macOS Chromium measured it).
  await userEvent.keyboard("{ArrowDown}");
  await expect
    .element(screen.getByRole("menuitem", { name: "Edit" }))
    .toHaveFocus();
  await userEvent.keyboard("{ArrowDown}");
  const item = screen.getByRole("menuitem", { name: /Delete/ });
  await expect.element(item).toHaveFocus();
  await expect.element(item).toHaveAttribute("aria-disabled", "true");
  expect(item.element().textContent).toContain("In use by 3 products");
  await expect
    .element(item)
    .toHaveAccessibleDescription("In use by 3 products");
  await userEvent.keyboard("{Enter}");
  expect(onDelete).not.toHaveBeenCalled();
  await expectNoA11yViolations(document.body);
});

test("a link action renders as a link with its href (DS-32)", async () => {
  const screen = await render(
    <RowActionsMenu
      label="Aria"
      actions={[{ label: "Open", render: <a href="/products/aria" /> }]}
      actionsLabel={(l) => `More for ${l}`}
    />,
  );
  await screen.getByRole("button", { name: "More for Aria" }).click();
  const open = document.querySelector('[data-slot="dropdown-menu-item"]')!;
  expect(open.tagName).toBe("A");
  expect(open.getAttribute("href")).toBe("/products/aria");
});

test("a single icon action is an icon button with a tooltip, not a menu (DS-32)", async () => {
  const onDelete = vi.fn();
  const screen = await render(
    <RowActionsMenu
      label="Aria"
      actions={[
        {
          label: "Delete",
          icon: <svg data-testid="icon" aria-hidden="true" />,
          onSelect: onDelete,
        },
      ]}
    />,
  );
  const button = screen.getByRole("button", { name: "Delete Aria" });
  await button.click();
  expect(onDelete).toHaveBeenCalledOnce();
  expect(document.querySelector('[role="menu"]')).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("a disabled single icon action is described by its reason (DS-32)", async () => {
  const screen = await render(
    <RowActionsMenu
      label="Aria"
      actions={[
        {
          label: "Delete",
          icon: <svg aria-hidden="true" />,
          disabled: true,
          disabledReason: "In use by 3 products",
          onSelect: () => {},
        },
      ]}
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Delete Aria" }))
    .toHaveAccessibleDescription("In use by 3 products");
});

test("alignClass maps the three alignments and defaults to start", () => {
  expect(alignClass(undefined)).toBe("text-start");
  expect(alignClass("start")).toBe("text-start");
  expect(alignClass("center")).toBe("text-center");
  expect(alignClass("end")).toBe("text-end");
});

test("fit columns stay on one line; the fill column wraps unless it is a figure or a code", () => {
  // A FIT column (every column but the primary) is content-sized and never wraps by default.
  expect(isNowrapColumn({ key: "role" })).toBe(true);
  // The FILL column (the primary) wraps, except the two shapes unreadable when broken.
  expect(isNowrapColumn({ key: "name" }, true)).toBe(false);
  expect(isNowrapColumn({ key: "amount", align: "end" }, true)).toBe(true);
  expect(isNowrapColumn({ key: "id", mono: true }, true)).toBe(true);
  // An explicit value always wins over the inference, in BOTH directions.
  expect(isNowrapColumn({ key: "note", nowrap: false })).toBe(false);
  expect(isNowrapColumn({ key: "note", nowrap: true }, true)).toBe(true);
});

/**
 * What the squeeze's descendant release skips: controls and fixed-size content, and everything
 * inside them (a wrapped label spilled a Button's fixed height — review round 3). It is keyed on
 * the variant helpers' CLASS OUTPUT too, because `<a className={buttonVariants()}>` carries no
 * slot and no role and spilled its `h-7` box (review round 4). DataList's own row-action wrapper,
 * the sort header, a link-variant button and EditableCell's display HOLD wrapping text, so they
 * stay released.
 */
const NOT_TEXT =
  "[data-slot=data-list-row-action],[data-slot=data-table-sort],[class~='hover:underline']";
const STRAIN_KEEP =
  `:is(button:not(${NOT_TEXT}),input,select,textarea,` +
  "[role=button]:not([data-slot=editable-cell-display],[class~='hover:underline'])," +
  "[role=checkbox],[role=combobox],[role=radio],[role=slider],[role=spinbutton],[role=switch],[role=tab]," +
  `[class~='group/button']:not(${NOT_TEXT}),[class~='group/toggle'],` +
  "[class~='group/navigation-menu-trigger'],[class~='group/tabs-list'],[class~='group/stepper-node']," +
  "[data-slot=avatar],[data-slot=kbd])";
// The squeeze (fill cell) also keeps DataList's merged `line` whole: it truncates, never wraps.
const SQUEEZE_KEEP = STRAIN_KEEP.replace(
  /\)$/u,
  ",[data-slot=data-list-merged][data-layout=line])",
);

test("columnCellClass carries alignment, the fill/fit posture and the mono face", () => {
  // The wrap posture is spelled out in BOTH directions since Batch 5 of the shadcn reset: upstream's
  // `TableCell` is `whitespace-nowrap` by default (LAY-6 resolves as **shadcn**), so a wrapping
  // column has to say `whitespace-normal` or `cn`'s merge leaves upstream's class standing.
  // The FILL cell takes the leftover width, wraps anywhere, and is the only cell the squeeze
  // releases.
  expect(columnCellClass({ key: "name" }, { fill: true })).toBe(
    "text-start whitespace-normal wrap-anywhere in-data-squeezed:whitespace-normal in-data-squeezed:wrap-anywhere " +
      `in-data-squeezed:**:not-[${SQUEEZE_KEEP},${SQUEEZE_KEEP}_*]:whitespace-normal ` +
      `in-data-squeezed:**:not-[${SQUEEZE_KEEP},${SQUEEZE_KEEP}_*]:wrap-anywhere ` +
      // A released `truncate` keeps its one line: clamped, never wrapped over its neighbours (RS-04).
      `in-data-squeezed:**:not-[${SQUEEZE_KEEP},${SQUEEZE_KEEP}_*]:not-[:is([data-slot=tag],[data-slot=chip],[class~='group/badge'])_*]:[&[class~='truncate']]:line-clamp-1 ` +
      // Fixed-size content that states no posture of its own is put back on one line: the cell's
      // wrap posture INHERITS into it (a Kbd broke `⌘K` in two inside its 20px box).
      "in-data-squeezed:**:[&:is([data-slot=avatar],[data-slot=kbd],[class~='group/stepper-node'])]:whitespace-nowrap " +
      "in-data-squeezed:**:[&:is([data-slot=avatar],[data-slot=kbd],[class~='group/stepper-node'])]:shrink-0 " +
      "in-data-squeezed:**:[&[class~='group/badge']]:h-auto " +
      "in-data-squeezed:**:[&[class~='group/button'][class~='hover:underline']]:h-auto " +
      "in-data-squeezed:**:[&[class~='group/button'][class~='hover:underline']]:min-h-6 " +
      "last:has-[[role=checkbox],[role=switch],[role=radio]]:pe-3",
  );
  // A FIT cell is content-sized and on one line, and the squeeze never reaches it: releasing
  // every cell broke short values mid-word the moment one long value overflowed.
  const fit = columnCellClass({ key: "role" });
  expect(fit.startsWith("text-start w-0 whitespace-nowrap ")).toBe(true);
  expect(fit).toContain("in-data-strained:w-auto");
  expect(fit).not.toContain("in-data-squeezed");
  // Only the last rung (`data-strained`: nothing left to merge, still overflowing) releases it,
  // with the squeeze's keep list less the merged line (only a fill cell holds one).
  expect(fit).toContain(
    `in-data-strained:**:not-[${STRAIN_KEEP},${STRAIN_KEEP}_*]:wrap-anywhere`,
  );
  expect(fit).toContain(
    `in-data-strained:**:not-[${STRAIN_KEEP},${STRAIN_KEEP}_*]:not-[:is([data-slot=tag],[data-slot=chip],[class~='group/badge'])_*]:[&[class~='truncate']]:line-clamp-1`,
  );
  // A fit column that opts out wraps between words only, and shares the leftover width.
  const prose = columnCellClass({ key: "note", nowrap: false });
  expect(prose).toContain("whitespace-normal");
  expect(prose).not.toMatch(/(^|\s)wrap-anywhere/);
  expect(prose).not.toMatch(/(^|\s)w-0/);
  expect(columnCellClass({ key: "amount", align: "end" })).toContain(
    "whitespace-nowrap",
  );
  const mono = columnCellClass({ key: "id", mono: true });
  expect(mono).toContain("font-mono");
  expect(mono).toContain("tabular-nums");
  expect(mono).toContain("whitespace-nowrap");
});

test("a header never breaks: one line, no squeeze release, fill or fit", () => {
  for (const fill of [true, false]) {
    const head = headerCellClass({ key: "products" }, { fill });
    expect(head).toContain("whitespace-nowrap");
    expect(head).not.toContain("wrap-anywhere");
    expect(head).not.toContain("in-data-squeezed");
    // On the last rung it may wrap between words, still never inside one.
    expect(head).toContain("in-data-strained:whitespace-normal");
  }
  expect(headerCellClass({ key: "unit" })).toContain("w-0");
  expect(headerCellClass({ key: "name" }, { fill: true })).not.toContain("w-0");
});

test("mergedValueClass wraps whatever the column's own posture, in the column's own face", () => {
  // A merged value sits inside the PRIMARY cell. Without its own rule it inherited that cell's
  // `whitespace-nowrap` (mono / end-aligned primary) and pinned the table wider than its container.
  for (const column of [
    { key: "a" },
    { key: "b", mono: true },
    { key: "c", align: "end" as const },
    { key: "d", nowrap: true },
  ]) {
    const merged = mergedValueClass(column);
    expect(merged).toContain("whitespace-normal");
    expect(merged).toContain("wrap-anywhere");
    expect(merged).not.toContain("nowrap");
  }
  expect(mergedValueClass({ key: "b", mono: true })).toContain("font-mono");
  expect(mergedValueClass({ key: "a" })).toContain("font-sans");
});

/** Every registry source, as text, for the variant-helper census below. */
const REGISTRY_SOURCES = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>("./*.tsx", {
      query: "?raw",
      import: "default",
      eager: true,
      // The repo's ambient `ImportMeta.glob` (declared in animated-icons.test.tsx) is narrower
      // than Vite's own signature; the assertion re-widens it without loosening the call.
    } as { eager: true }),
  ).filter(([file]) => !file.endsWith(".test.tsx")),
);

/**
 * Exported variant helpers whose fixed box holds only an icon — never a label, so wrapping cannot
 * spill them. Each entry names why; anything else with a fixed height must be kept by the squeeze.
 */
const ICON_ONLY_HELPERS: Record<string, string> = {
  statusIconVariants: "sizes a status glyph; it renders no text",
  priorityIconVariants: "sizes a priority flag; it renders no text",
};
/** Exported recipes for page chrome that never renders inside a data cell. */
const PAGE_CHROME_HELPERS: Record<string, string> = {
  tabsTriggerVariants:
    "styles the route-tab links of a page-level <nav> (API-25); inside a table a tab is a TabsTrigger, which [role=tab] already keeps",
};

test("the squeeze keeps every exported variant helper with a fixed box, by its class output", () => {
  // The census: every `cva` helper a registry file EXPORTS whose class output fixes a height or a
  // size (`h-N`, `size-N`, under any variant). A consumer can put that output on any element — the
  // docs prescribe `<a className={buttonVariants()}>` — so the squeeze must recognise the output
  // itself, not a slot or a role that element may not carry (review round 4).
  const kept = columnCellClass({ key: "x" }, { fill: true });
  const census: string[] = [];
  const missing: string[] = [];
  for (const [file, source] of Object.entries(REGISTRY_SOURCES)) {
    for (const match of source.matchAll(/const\s+(\w+)\s*=\s*cva\(/g)) {
      const name = match[1]!;
      const exported = new RegExp(
        `export\\s+const\\s+${name}\\b|export\\s*\\{[^}]*\\b${name}\\b`,
      ).test(source);
      if (!exported) continue;
      let depth = 0;
      let end = match.index! + match[0].length - 1;
      for (let i = end; i < source.length; i++) {
        if (source[i] === "(") depth++;
        else if (source[i] === ")" && --depth === 0) {
          end = i;
          break;
        }
      }
      const body = source.slice(match.index, end);
      // A class token whose utility fixes the element's OWN height — under any variant, except one
      // that targets descendants (`[&_svg]:size-4` sizes an icon, not the box).
      const fixed = body
        .split(/[\s"`]+/)
        .some(
          (token) =>
            /(?:^|:)(?:h|size)-(?:\d|\[)/.test(token) && !/\[&|\*:/.test(token),
        );
      if (!fixed) continue;
      census.push(name);
      if (ICON_ONLY_HELPERS[name] || PAGE_CHROME_HELPERS[name]) continue;
      const hook = /group\/[\w-]+/.exec(body)?.[0];
      // Released-and-grown (the badge) or kept whole: either way the helper's own hook is named.
      if (!hook || !kept.includes(`[class~='${hook}']`))
        missing.push(`${file} ${name} (${hook ?? "no group/ hook"})`);
    }
  }
  expect(missing).toEqual([]);
  // The census itself is live: if the scan stopped matching, this test would pass vacuously.
  expect(census).toEqual(
    expect.arrayContaining([
      "badgeVariants",
      "buttonVariants",
      "navigationMenuTriggerStyle",
      "statusIconVariants",
      "stepperNodeVariants",
      "tabsListVariants",
      "tabsTriggerVariants",
      "toggleVariants",
    ]),
  );
});

test("offscreenSortSummary states a sort only once its column has left the header row", () => {
  const cols = [
    { key: "name", header: "Name" },
    { key: "stage", header: "Stage" },
    { key: "amount", header: <b>Amount</b> },
  ];
  const visible = [{ key: "name" }];
  expect(offscreenSortSummary([], cols, visible)).toBeNull();
  expect(
    offscreenSortSummary([{ key: "name", direction: "asc" }], cols, visible),
  ).toBeNull();
  expect(
    offscreenSortSummary([{ key: "stage", direction: "desc" }], cols, visible),
  ).toBe("Sorted by Stage, descending");
  // A non-string header falls back to the key; a multi-key order is stated whole.
  expect(
    offscreenSortSummary(
      [
        { key: "name", direction: "asc" },
        { key: "amount", direction: "asc" },
      ],
      cols,
      visible,
    ),
  ).toBe("Sorted by Name, ascending, then amount, ascending");
});

test("SELECTED_ROW_CLASS is the selected step with the state layer on it (COL-24)", () => {
  expect(SELECTED_ROW_CLASS).toBe("bg-state-selected state-layer");
});

/* ------------------------------------------------------------------ sort */

/* ------------------------------------------------------ responsive revelation */

const keys = (list: DataTableColumnLayout[]) => list.map((c) => c.key);

test("revealColumns: an unmeasured container (the server answer) shows every column", () => {
  const cols: DataTableColumnLayout[] = [
    { key: "a" },
    { key: "b", mobile: "hidden" },
  ];
  const result = revealColumns(cols, null);
  expect(keys(result.visibleColumns)).toEqual(["a", "b"]);
  expect(result.mergedColumns).toEqual([]);
  expect(result.hiddenColumns).toEqual([]);
});

test("revealColumns: trailing visible columns are reserved before earlier merge columns fit", () => {
  // The Tasks list at 390: title 240 + due 96 would fit alone, but Status 112 and the ⋯ 48 must
  // stay, so due folds rather than leaving the row squeezed.
  const result = revealColumns(
    [
      { key: "title", minWidth: 240 },
      { key: "due", minWidth: 96 },
      { key: "status", minWidth: 112, mobile: "visible" },
      { key: "actions", minWidth: 48, mobile: "visible" },
    ],
    390,
  );
  expect(keys(result.visibleColumns)).toEqual(["title", "status", "actions"]);
  expect(keys(result.mergedColumns)).toEqual(["due"]);
});

test("revealColumns: defaults are minWidth 120 and mobile merge", () => {
  expect(DEFAULT_COLUMN_MIN_WIDTH).toBe(120);
  const result = revealColumns([{ key: "a" }, { key: "b" }, { key: "c" }], 250);
  expect(keys(result.visibleColumns)).toEqual(["a", "b"]);
  expect(keys(result.mergedColumns)).toEqual(["c"]);
  expect(result.hiddenColumns).toEqual([]);
});

test("revealColumns: primary and visible always stay, hidden is counted, no holes", () => {
  const result = revealColumns(
    [
      { key: "primary", minWidth: 10_000 },
      { key: "wide", minWidth: 10_000, mobile: "hidden" },
      { key: "narrow", minWidth: 1 },
      { key: "pinned", minWidth: 10_000, mobile: "visible" },
    ],
    300,
  );
  expect(keys(result.visibleColumns)).toEqual(["primary", "pinned"]);
  expect(keys(result.hiddenColumns)).toEqual(["wide"]);
  expect(keys(result.mergedColumns)).toEqual(["narrow"]);
});

test("revealColumns: the reserved width is spent before the data columns", () => {
  const cols: DataTableColumnLayout[] = [{ key: "a" }, { key: "b" }];
  expect(keys(revealColumns(cols, 250).visibleColumns)).toEqual(["a", "b"]);
  expect(
    keys(revealColumns(cols, 250, SELECTION_COLUMN_WIDTH).visibleColumns),
  ).toEqual(["a"]);
});

test("useContainerWidth measures the element it is attached to and follows resizes", async () => {
  let seen: number | null = null;
  function Probe({ width }: { width: number }) {
    const [measureRef, measured] = useContainerWidth();
    seen = measured;
    return <div ref={measureRef} style={{ width: `${width}px` }} />;
  }
  const screen = await render(<Probe width={321} />);
  await expect.poll(() => seen).toBe(321);
  await screen.rerender(<Probe width={222} />);
  await expect.poll(() => seen).toBe(222);
});

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
  // It IS a Button, not a hand-rolled control — so its hover wash and focus
  // outline are upstream's rather than restated here.
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

test("sort indicators: the active arrow always shows, an inactive one waits for hover or focus", async () => {
  const screen = await render(
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead
            column={{ key: "name", header: "Name", sortable: true }}
            direction="asc"
            onSort={() => {}}
          />
          <SortableHead
            column={{ key: "amount", header: "Amount", sortable: true }}
            direction="desc"
            onSort={() => {}}
          />
          <SortableHead
            column={{ key: "role", header: "Role", sortable: true }}
            onSort={() => {}}
          />
          <SortableHead column={{ key: "note", header: "Note" }} />
        </TableRow>
      </TableHeader>
    </Table>,
  );
  const glyph = (name: string) =>
    screen
      .getByRole("button", { name: `Sort by ${name}` })
      .element()
      .querySelector<HTMLElement>('[data-slot="data-table-sort-glyph"]')!;
  // Unit tests run without the stylesheet, so the contract is the class list (the geometry lane
  // measures the rendered result). Active, either direction: foreground and fully opaque.
  for (const name of ["Name", "Amount"]) {
    expect(glyph(name).className).toContain("text-foreground");
    expect(glyph(name).className).not.toContain("opacity-0");
  }
  // Inactive: rendered (space reserved) but transparent; revealed muted by a fine-pointer
  // hover on the header or keyboard focus on the button — never by a coarse pointer.
  const inactive = glyph("Role");
  expect(inactive.className).toMatch(/(^|\s)opacity-0(\s|$)/);
  expect(inactive.querySelector("svg")).not.toBeNull();
  expect(inactive.className).toContain("text-muted-foreground");
  expect(inactive.className).toContain(
    "pointer-fine:group-hover/sort-head:opacity-100",
  );
  expect(inactive.className).toContain("group-focus-visible/sort:opacity-100");
  expect(inactive.className).not.toMatch(/(^|\s)group-hover/);
  // Unsortable: no button, no glyph.
  const note = [...screen.container.querySelectorAll("th")][3]!;
  expect(note.querySelector('[data-slot="data-table-sort-glyph"]')).toBeNull();
  expect(note.className).not.toContain("group/sort-head");
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

test("SkeletonRows sizes each bar from its column's budget and alignment", async () => {
  const screen = await render(
    <Table>
      <TableBody>
        <SkeletonRows
          columns={[
            { key: "name", minWidth: 200 },
            { key: "count", minWidth: 80, align: "end" },
            { key: "menu", minWidth: 48, align: "end" },
            { key: "wide", minWidth: 10000 },
          ]}
          rows={1}
        />
      </TableBody>
    </Table>,
  );
  const bars = [
    ...screen.container.querySelectorAll<HTMLElement>('[data-slot="skeleton"]'),
  ];
  expect(bars.map((bar) => bar.style.width)).toEqual([
    "calc(var(--spacing) * 35)",
    "calc(var(--spacing) * 14)",
    "",
    // Capped at 10rem, so an oversized budget never widens a narrow table.
    "calc(var(--spacing) * 40)",
  ]);
  expect(bars[0]!.className).not.toContain("ms-auto");
  expect(bars[1]!.className).toContain("ms-auto");
  // The ⋯ column's placeholder is an icon-sized square at the row's end.
  expect(bars[2]!.className).toMatch(/\bsize-6\b/);
  expect(bars[2]!.className).not.toMatch(/\bh-4\b/);
  expect(bars[2]!.className).toContain("ms-auto");
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
  expect(cell.textContent).toContain("Nothing here");
  await screen.unmount();

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
  await loading.unmount();

  const empty = await render(
    <Table aria-label="Records">
      <TableBody>
        <EmptyRow colSpan={3} />
      </TableBody>
    </Table>,
  );
  await expectNoA11yViolations(empty.container);
});

test("ColumnResizeHandle: a named vertical separator that steps 8px, 32px with Shift, and clamps", async () => {
  const onResize = vi.fn();
  const onResizeEnd = vi.fn();
  function Harness() {
    const [width, setWidth] = React.useState(160);
    return (
      <div style={{ position: "relative", width: "200px", height: "40px" }}>
        Qty
        <ColumnResizeHandle
          label="Qty"
          width={width}
          min={64}
          max={200}
          onResize={(next) => {
            onResize(next);
            setWidth(next);
          }}
          onResizeEnd={onResizeEnd}
        />
      </div>
    );
  }
  const screen = await render(<Harness />);
  const handle = screen.getByRole("separator", { name: "Resize Qty" });
  const el = handle.element() as HTMLElement;
  expect(el.getAttribute("aria-orientation")).toBe("vertical");
  expect(el.getAttribute("aria-valuenow")).toBe("160");
  expect(el.getAttribute("aria-valuemin")).toBe("64");
  expect(el.getAttribute("aria-valuemax")).toBe("200");
  el.focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(onResize).toHaveBeenLastCalledWith(168);
  expect(onResizeEnd).toHaveBeenLastCalledWith(168);
  await userEvent.keyboard("{Shift>}{ArrowLeft}{/Shift}");
  expect(onResize).toHaveBeenLastCalledWith(136);
  await userEvent.keyboard("{End}");
  expect(el.getAttribute("aria-valuenow")).toBe("200");
  await userEvent.keyboard("{Home}");
  expect(el.getAttribute("aria-valuenow")).toBe("64");
  // The hit area is 24px wide, whatever the visible line is.
  expect(el.getBoundingClientRect().width).toBeGreaterThanOrEqual(24);
  await expectNoA11yViolations(screen.container);
});

test("ColumnResizeHandle: dragging resizes live and commits once on release; double-click fits", async () => {
  const onResize = vi.fn();
  const onResizeEnd = vi.fn();
  const onAutoFit = vi.fn();
  const screen = await render(
    <div style={{ position: "relative", width: "200px", height: "40px" }}>
      <ColumnResizeHandle
        label="Qty"
        width={160}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
        onAutoFit={onAutoFit}
      />
    </div>,
  );
  const el = screen.getByRole("separator").element() as HTMLElement;
  const rect = el.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  el.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      clientX: x,
      clientY: y,
      pointerId: 1,
    }),
  );
  el.dispatchEvent(
    new PointerEvent("pointermove", {
      bubbles: true,
      clientX: x + 20,
      clientY: y,
      pointerId: 1,
    }),
  );
  el.dispatchEvent(
    new PointerEvent("pointermove", {
      bubbles: true,
      clientX: x + 30,
      clientY: y,
      pointerId: 1,
    }),
  );
  el.dispatchEvent(
    new PointerEvent("pointerup", {
      bubbles: true,
      clientX: x + 30,
      clientY: y,
      pointerId: 1,
    }),
  );
  expect(onResize.mock.calls.map((call) => call[0])).toEqual([180, 190]);
  expect(onResizeEnd).toHaveBeenCalledTimes(1);
  expect(onResizeEnd).toHaveBeenCalledWith(190);
  el.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
  expect(onAutoFit).toHaveBeenCalledTimes(1);
});

test("columnResizeKeyWidth: arrows step, Shift quadruples, Home/End jump, RTL mirrors, others are null", () => {
  expect(columnResizeKeyWidth("ArrowRight", false, 100)).toBe(108);
  expect(columnResizeKeyWidth("ArrowLeft", true, 100)).toBe(68);
  expect(columnResizeKeyWidth("ArrowLeft", true, 80)).toBe(64);
  expect(columnResizeKeyWidth("Home", false, 300, { min: 90 })).toBe(90);
  expect(columnResizeKeyWidth("End", false, 300, { max: 500 })).toBe(500);
  expect(columnResizeKeyWidth("ArrowLeft", false, 100, { rtl: true })).toBe(
    108,
  );
  expect(columnResizeKeyWidth("Enter", false, 100)).toBeNull();
});

test("GridSummaryCell: the trigger names the function and column, a change reports it, the result shows", async () => {
  const onValueChange = vi.fn();
  function Harness({
    value,
    loading,
  }: {
    value: string | null;
    loading?: boolean;
  }) {
    return (
      <Table>
        <tfoot>
          <TableRow>
            <GridSummaryCell
              // As a roving grid renders it: the cell takes focus, so the picker mounts lazily.
              tabIndex={-1}
              columnLabel="Qty"
              options={[
                { value: "sum", label: "Sum" },
                { value: "avg", label: "Average" },
              ]}
              value={value}
              onValueChange={onValueChange}
              result="830"
              loading={loading}
            />
          </TableRow>
        </tfoot>
      </Table>
    );
  }
  const screen = await render(<Harness value={null} />);
  // Unsummarised in a grid, the picker mounts on first hover or focus (a wide footer stays light).
  expect(screen.container.querySelector('[role="combobox"]')).toBeNull();
  (
    screen.container.querySelector(
      '[data-slot="grid-summary-cell"]',
    ) as HTMLElement
  ).dispatchEvent(
    new PointerEvent("pointerover", { pointerType: "mouse", bubbles: true }),
  );
  const empty = screen.getByRole("combobox", { name: "Summarize Qty" });
  await expect.element(empty).toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
  await empty.click();
  await screen.getByRole("option", { name: "Sum" }).click();
  expect(onValueChange).toHaveBeenCalledWith("sum");

  await screen.rerender(<Harness value="sum" />);
  const chosen = screen.getByRole("combobox", { name: "Sum of Qty" });
  await expect.poll(() => chosen.element().textContent).toContain("Sum830");
  await expectNoA11yViolations(screen.container);
  await chosen.click();
  await screen.getByRole("option", { name: "None" }).click();
  expect(onValueChange).toHaveBeenLastCalledWith(null);

  await screen.rerender(<Harness value="sum" loading />);
  expect(
    screen.container.querySelector('[data-slot="grid-summary-loading"]'),
  ).not.toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("GridSummaryCell standalone keeps its picker mounted, so Tab reaches it", async () => {
  const screen = await render(
    <Table>
      <tfoot>
        <TableRow>
          <GridSummaryCell
            columnLabel="Qty"
            options={[{ value: "sum", label: "Sum" }]}
            value={null}
            onValueChange={() => {}}
          />
        </TableRow>
      </tfoot>
    </Table>,
  );
  await expect
    .element(screen.getByRole("combobox", { name: "Summarize Qty" }))
    .toBeInTheDocument();
});
