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
  ListToolbarAction,
  ListToolbarButton,
  ListToolbarMenu,
  type ListToolbarLayoutValue,
} from "./list-toolbar";
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

function Harness({
  width = 1120,
  onAction = () => {},
}: {
  width?: number;
  onAction?: () => void;
}) {
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
            <TabsList size="sm" overflow="menu" aria-label="Scope">
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
        action={
          <ListToolbarAction
            icon={<Plus />}
            label="New task"
            onClick={onAction}
          />
        }
      />
    </div>
  );
}

test("one row: tabs left; search, the icon tools and the main button right, every tool named", async () => {
  const onAction = vi.fn();
  const screen = await render(<Harness onAction={onAction} />);
  await expect
    .element(screen.getByRole("toolbar", { name: "List controls" }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("tab", { name: "My tasks" }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("searchbox", { name: "Search tasks" }))
    .toBeVisible();
  for (const name of ["Filter", "Sort", "Display", "More"])
    await expect
      .element(screen.getByRole("button", { name, exact: true }))
      .toBeVisible();
  await expect
    .element(screen.getByRole("button", { name: "List" }))
    .toBeVisible();
  await screen.getByRole("button", { name: "New task" }).click();
  expect(onAction).toHaveBeenCalled();
  // One row, 32px tall, at every width it fits.
  const row = document.querySelector<HTMLElement>(
    '[data-slot="list-toolbar-row"]',
  )!;
  expect(row.getBoundingClientRect().height).toBe(32);
  await expectNoA11yViolations(screen.container);
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

test("narrow: tabs fold to a dropdown, Layout and Sort move into Display, the action goes icon-only", async () => {
  const screen = await render(<Harness width={358} />);
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
  // The main button keeps its name as an icon.
  await expect
    .element(screen.getByRole("button", { name: "New task" }))
    .toBeVisible();
  expect(
    screen
      .getByRole("button", { name: "New task" })
      .element()
      .hasAttribute("data-labelled"),
  ).toBe(false);
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

test("an open icon search takes the tabs' room; the tools stay in view", async () => {
  const screen = await render(<Harness width={300} />);
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
  await expect
    .element(screen.getByRole("button", { name: "New task" }))
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
});

test("a restored query at a narrow width opens the search in the tabs' room", async () => {
  await render(
    <div style={{ width: 300 }}>
      <ListToolbar
        tabs={
          <Tabs defaultValue="a">
            <TabsList size="sm" overflow="menu" aria-label="Scope">
              <TabsTrigger value="a">My tasks</TabsTrigger>
              <TabsTrigger value="b">Shared with me</TabsTrigger>
            </TabsList>
          </Tabs>
        }
        search={{
          value: "invoice",
          onValueChange: () => {},
          placeholder: "Search tasks",
        }}
        filter={{}}
        display={
          <DisplayMenu
            toggles={[
              {
                id: "a",
                label: "Show closed",
                checked: false,
                onCheckedChange: () => {},
              },
            ]}
          />
        }
        more={
          <ListToolbarMenu
            items={[{ id: "x", label: "Export", onSelect: () => {} }]}
          />
        }
        action={<ListToolbarAction icon={<Plus />} label="New task" />}
      />
    </div>,
  );
  await expect
    .poll(
      () =>
        document.querySelector<HTMLElement>('[data-slot="list-toolbar-tabs"]')
          ?.hidden ||
        getComputedStyle(
          document.querySelector('[data-slot="list-toolbar-tabs"]')!,
        ).display === "none",
    )
    .toBe(true);
  const row = document.querySelector<HTMLElement>(
    '[data-slot="list-toolbar-row"]',
  )!;
  expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth + 1);
});
