import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
// Real layout: the toolbar and its tools measure and size themselves from the compiled classes.
import geometryCss from "../../test/geometry.css?inline";
import { expect, test, vi } from "vitest";
import { Plus, Redo2, Undo2 } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  ListToolbar,
  ListToolbarButton,
  ListToolbarMenu,
  type ListToolbarLayoutValue,
} from "./list-toolbar";
import { AddFilterMenu } from "./add-filter-menu";
import { DisplayMenu } from "./display-menu";
import { FilterRow } from "./filter-row";
import { SortMenu } from "./sort-menu";
import { Tabs, TabsList, TabsTrigger } from "./tabs";

const sheet = document.createElement("style");
sheet.textContent = geometryCss;
document.head.append(sheet);

const SORT_FIELDS = [
  { key: "due", label: "Due date", type: "date" as const },
  { key: "title", label: "Title" },
];

function Harness({ width = 1120 }: { width?: number }) {
  const [query, setQuery] = React.useState("");
  const [layout, setLayout] = React.useState<ListToolbarLayoutValue>("list");
  const [sort, setSort] = React.useState({
    key: "due",
    direction: "asc" as "asc" | "desc",
  });
  const [closed, setClosed] = React.useState(false);
  return (
    <div style={{ width }}>
      <ListToolbar
        tabs={
          <Tabs defaultValue="mine">
            <TabsList overflow="menu" aria-label="Scope">
              <TabsTrigger value="mine">My tasks</TabsTrigger>
              <TabsTrigger value="created">Created by me</TabsTrigger>
              <TabsTrigger value="team">My team</TabsTrigger>
              <TabsTrigger value="shared">Shared with me</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        }
        search={{
          value: query,
          onValueChange: setQuery,
          placeholder: "Search tasks",
        }}
        filterRow={<FilterRow chips={[]} />}
        sort={{
          content: (
            <SortMenu
              fields={SORT_FIELDS}
              value={sort}
              defaultValue={{ key: "due", direction: "asc" }}
              onValueChange={(next) => setSort(next)}
            />
          ),
          isDefault: sort.key === "due" && sort.direction === "asc",
          summary: "Due date",
        }}
        layout={{
          value: layout,
          options: ["list", "board"],
          onValueChange: setLayout,
        }}
        display={
          <DisplayMenu
            toggles={[
              {
                id: "closed",
                label: "Show closed",
                checked: closed,
                onCheckedChange: setClosed,
              },
            ]}
            isDefault={!closed}
            onReset={() => setClosed(false)}
          />
        }
        more={
          <ListToolbarMenu
            items={[
              { id: "reset", label: "Reset to default", onSelect: () => {} },
            ]}
          />
        }
      />
    </div>
  );
}

test("tabs in their own row above; the search left and the icon tools right, every tool named", async () => {
  const screen = await render(<Harness />);
  await expect
    .element(screen.getByRole("toolbar", { name: "List controls" }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("tab", { name: "My tasks" }))
    .toBeVisible();
  const search = screen
    .getByRole("searchbox", { name: "Search tasks" })
    .element();
  for (const name of ["Filter", "Sort", "Display", "More"])
    await expect
      .element(screen.getByRole("button", { name, exact: true }))
      .toBeVisible();
  const row = document.querySelector<HTMLElement>(
    '[data-slot="list-toolbar-row"]',
  )!;
  const tabs = document.querySelector<HTMLElement>(
    '[data-slot="list-toolbar-tabs"]',
  )!;
  // The tabs are not in the toolbar row; they sit above it.
  expect(row.contains(tabs)).toBe(false);
  expect(tabs.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    row.getBoundingClientRect().top,
  );
  // The search starts the row; the tools end it.
  const rowBox = row.getBoundingClientRect();
  expect(
    search.closest('[data-slot="list-toolbar-search"]')!.getBoundingClientRect()
      .left,
  ).toBe(rowBox.left);
  const more = document.querySelector<HTMLElement>(
    '[data-slot="list-toolbar-more"]',
  )!;
  expect(Math.round(more.getBoundingClientRect().right)).toBe(
    Math.round(rowBox.right),
  );
  // One row, 32px tall.
  expect(rowBox.height).toBe(32);
  await expectNoA11yViolations(screen.container);
});

test("Layout is one button that shows, and switches to, the other layout", async () => {
  const screen = await render(<Harness />);
  const layout = screen.getByRole("button", { name: "Board view" });
  await expect.element(layout).toBeVisible();
  await layout.click();
  await expect
    .element(screen.getByRole("button", { name: "List view" }))
    .toBeVisible();
  expect(
    document.querySelectorAll('[data-slot="list-toolbar-layout"]').length,
  ).toBe(1);
});

test("the cluster is tight: 4px between icon tools, all 32px", async () => {
  await render(<Harness />);
  const cluster = document.querySelector<HTMLElement>(
    '[data-slot="list-toolbar-cluster"]',
  )!;
  expect(getComputedStyle(cluster).columnGap).toBe("4px");
  const filter = document.querySelector<HTMLElement>(
    '[data-slot="list-toolbar-filter"]',
  )!;
  expect(filter.getBoundingClientRect().width).toBe(32);
});

test("the filter row's chips and + Filter are the toolbar's tool height", async () => {
  await render(
    <div style={{ width: 900 }}>
      <ListToolbar
        filter={{ defaultOpen: true }}
        filterRow={
          <FilterRow
            addFilter={<AddFilterMenu fields={[{ key: "a", label: "A" }]} />}
            chips={[
              { id: "s", label: "Status", value: "Open", onRemove: () => {} },
            ]}
            onClear={() => {}}
          />
        }
      />
    </div>,
  );
  for (const slot of [
    "list-toolbar-filter",
    "filter-chip",
    "add-filter-menu-trigger",
    "filter-row-clear",
  ])
    expect(
      document.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!
        .offsetHeight,
    ).toBe(32);
});

test("Filter toggles the filter row and says its state", async () => {
  const screen = await render(<Harness />);
  const filter = screen.getByRole("button", { name: "Filter", exact: true });
  await expect.element(filter).toHaveAttribute("aria-expanded", "false");
  await filter.click();
  await expect.element(filter).toHaveAttribute("aria-expanded", "true");
  const rowId = (filter.element() as HTMLElement).getAttribute(
    "aria-controls",
  )!;
  expect(document.getElementById(rowId)?.hidden).toBe(false);
});

test("Sort shows a dot once the order is not the default, and its name says so", async () => {
  const screen = await render(<Harness />);
  await screen.getByRole("button", { name: "Sort", exact: true }).click();
  await screen.getByRole("radio", { name: "Title" }).click();
  await expect
    .poll(() =>
      document
        .querySelector('[data-slot="list-toolbar-sort"]')
        ?.getAttribute("aria-label"),
    )
    .toBe("Sort, changed");
  expect(
    document.querySelector(
      '[data-slot="list-toolbar-sort"] [data-slot="list-toolbar-dot"]',
    ),
  ).not.toBeNull();
});

test("narrow: tabs fold to a dropdown in their row, Layout and Sort move into Display", async () => {
  const screen = await render(<Harness width={290} />);
  await expect
    .poll(() =>
      document
        .querySelector('[data-slot="tabs-fold"]')
        ?.hasAttribute("data-folded"),
    )
    .toBe(true);
  // The toolbar measures and collapses: no Sort or Layout in the row.
  await expect
    .poll(() => document.querySelector('[data-slot="list-toolbar-sort"]'))
    .toBeNull();
  expect(
    document.querySelector('[data-slot="list-toolbar-layout"]'),
  ).toBeNull();
  // The row never wraps.
  const row = document.querySelector<HTMLElement>(
    '[data-slot="list-toolbar-row"]',
  )!;
  expect(row.getBoundingClientRect().height).toBe(32);
  // The folded tab menu switches tabs.
  await screen.getByRole("button", { name: /Scope/ }).click();
  await screen.getByRole("menuitemradio", { name: "All" }).click();
  await expect
    .poll(
      () =>
        document.querySelector('[role="tab"][aria-selected="true"]')
          ?.textContent,
    )
    .toBe("All");
});

test("the edit group folds into ⋯ last", async () => {
  const undo = vi.fn();
  const screen = await render(
    <div style={{ width: 160 }}>
      <ListToolbar
        search={{
          value: "",
          onValueChange: () => {},
          placeholder: "Search rows",
        }}
        filter={{}}
        edit={[
          { id: "undo", label: "Undo", icon: <Undo2 />, onSelect: undo },
          {
            id: "redo",
            label: "Redo",
            icon: <Redo2 />,
            onSelect: () => {},
            disabled: true,
          },
        ]}
        display={
          <DisplayMenu
            toggles={[
              {
                id: "a",
                label: "Show empty groups",
                checked: false,
                onCheckedChange: () => {},
              },
            ]}
          />
        }
      />
    </div>,
  );
  await expect
    .poll(() => document.querySelector('[data-slot="list-toolbar-edit"]'))
    .toBeNull();
  await screen.getByRole("button", { name: "More" }).click();
  await screen.getByRole("menuitem", { name: "Undo" }).click();
  expect(undo).toHaveBeenCalled();
});

test("ListToolbarMenu renders nothing without items; ListToolbarButton names its count", async () => {
  const screen = await render(
    <div>
      <ListToolbarMenu items={["separator"]} />
      <ListToolbarButton icon={<Plus />} label="Filter" count={2} />
    </div>,
  );
  expect(document.querySelector('[data-slot="list-toolbar-more"]')).toBeNull();
  await expect
    .element(screen.getByRole("button", { name: "Filter, 2 active" }))
    .toBeVisible();
});

test("/ focuses the search and F opens the filter row", async () => {
  const screen = await render(<Harness />);
  (document.activeElement as HTMLElement | null)?.blur();
  await userEvent.keyboard("/");
  expect(document.activeElement).toBe(
    screen.getByRole("searchbox", { name: "Search tasks" }).element(),
  );
  (document.activeElement as HTMLElement).blur();
  await userEvent.keyboard("f");
  await expect
    .element(screen.getByRole("button", { name: "Filter", exact: true }))
    .toHaveAttribute("aria-expanded", "true");
});

test("an open icon search takes the row's free room; the tools stay in view", async () => {
  const screen = await render(<Harness width={180} />);
  await expect
    .poll(() =>
      document.querySelector('[data-slot="list-toolbar-search-toggle"]'),
    )
    .not.toBeNull();
  await screen.getByRole("button", { name: "Search tasks" }).click();
  await userEvent.keyboard("abc");
  await expect
    .element(screen.getByRole("button", { name: "Filter", exact: true }))
    .toBeVisible();
  const field = screen
    .getByRole("searchbox", { name: "Search tasks" })
    .element();
  const filter = document.querySelector<HTMLElement>(
    '[data-slot="list-toolbar-filter"]',
  )!;
  expect(field.getBoundingClientRect().right).toBeLessThanOrEqual(
    filter.getBoundingClientRect().left,
  );
  const row = document.querySelector<HTMLElement>(
    '[data-slot="list-toolbar-row"]',
  )!;
  expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth + 1);
});

function SuggestionHarness({
  onSelect,
}: {
  onSelect: (value: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  return (
    <div style={{ width: 900 }}>
      <ListToolbar
        search={{
          value: query,
          onValueChange: setQuery,
          placeholder: "Search tasks",
          suggestion: { label: "Refine with words", onSelect },
        }}
      />
      <output data-testid="query">{query}</output>
    </div>
  );
}

test("search suggestion: shows for a phrase, Enter still searches, ↓ Enter picks it", async () => {
  const onSelect = vi.fn();
  const screen = await render(<SuggestionHarness onSelect={onSelect} />);
  const field = screen.getByRole("combobox", { name: "Search tasks" });
  await userEvent.click(field);
  await userEvent.keyboard("two words");
  expect(document.querySelector('[role="listbox"]')).toBeNull();
  await userEvent.keyboard(" and more");
  await expect
    .element(screen.getByRole("option", { name: "Refine with words" }))
    .toBeVisible();
  await expect.element(field).toHaveAttribute("aria-expanded", "true");
  // Enter with the row not reached: a plain search, nothing picked.
  await userEvent.keyboard("{Enter}");
  expect(onSelect).not.toHaveBeenCalled();
  await userEvent.keyboard("{ArrowDown}");
  await expect.element(field).toHaveAttribute("aria-activedescendant");
  await userEvent.keyboard("{Enter}");
  expect(onSelect).toHaveBeenCalledWith("two words and more");
  // Picked: the row hides until the query changes.
  expect(document.querySelector('[role="listbox"]')).toBeNull();
});

test("search suggestion: Escape hides it, a second Escape clears the field", async () => {
  const onSelect = vi.fn();
  const screen = await render(<SuggestionHarness onSelect={onSelect} />);
  const field = screen.getByRole("combobox", { name: "Search tasks" });
  await userEvent.click(field);
  await userEvent.keyboard("open tasks due today");
  await expect.element(screen.getByRole("option")).toBeVisible();
  await expectNoA11yViolations(document.body);
  await userEvent.keyboard("{Escape}");
  expect(document.querySelector('[role="listbox"]')).toBeNull();
  await expect
    .element(screen.getByTestId("query"))
    .toHaveTextContent("open tasks due today");
  await userEvent.keyboard("{Escape}");
  await expect.element(screen.getByTestId("query")).toHaveTextContent("");
  expect(onSelect).not.toHaveBeenCalled();
});

test("search suggestion: a dismissal ends with the next edit, even back to the same phrase", async () => {
  const screen = await render(<SuggestionHarness onSelect={() => {}} />);
  await userEvent.click(screen.getByRole("combobox", { name: "Search tasks" }));
  await userEvent.keyboard("show open tasks");
  await expect.element(screen.getByRole("option")).toBeVisible();
  await userEvent.keyboard("{Escape}");
  expect(document.querySelector('[role="listbox"]')).toBeNull();
  await userEvent.keyboard(" today");
  await userEvent.keyboard("{Backspace>6/}");
  await expect
    .element(screen.getByTestId("query"))
    .toHaveTextContent("show open tasks");
  await expect.element(screen.getByRole("option")).toBeVisible();
});

test("search suggestion: leaving the field forgets the reached row", async () => {
  const onSelect = vi.fn();
  const screen = await render(<SuggestionHarness onSelect={onSelect} />);
  const field = screen.getByRole("combobox", { name: "Search tasks" });
  await userEvent.click(field);
  await userEvent.keyboard("show me open things{ArrowDown}");
  await expect.element(field).toHaveAttribute("aria-activedescendant");
  await userEvent.keyboard("{Tab}");
  await userEvent.click(field);
  await userEvent.keyboard("{Enter}");
  expect(onSelect).not.toHaveBeenCalled();
});
