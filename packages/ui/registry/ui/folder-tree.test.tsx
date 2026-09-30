import "../../test/geometry.css";
import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  FolderTree,
  FolderTreeRowAction,
  type FolderTreeNode,
  type FolderTreeProps,
} from "./folder-tree";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from "./breadcrumb";
import { BreadcrumbDropTarget } from "./breadcrumb-cascade";
import { DataList, type DataListColumn } from "./data-list";

const ROOTS: Record<string, FolderTreeNode[]> = {
  shared: [
    { id: "docs", label: "Docs", kind: "folder" },
    { id: "brand", label: "Brand", kind: "folder" },
    { id: "roadmap", label: "Roadmap", kind: "page", href: "#roadmap" },
  ],
  private: [{ id: "notes", label: "Notes", kind: "page", href: "#notes" }],
};

const CHILDREN: Record<string, FolderTreeNode[]> = {
  docs: [
    { id: "specs", label: "Specs", kind: "folder" },
    {
      id: "plan",
      label: "plan.pdf",
      kind: "file",
      contentType: "application/pdf",
      href: "#plan",
    },
  ],
  specs: [{ id: "api", label: "API", kind: "page", href: "#api" }],
  brand: [],
};

function Tree({
  initialExpanded = [],
  loadChildren = (id: string) => Promise.resolve(CHILDREN[id] ?? []),
  ...props
}: Partial<FolderTreeProps> & { initialExpanded?: string[] }) {
  const [expanded, setExpanded] = React.useState(initialExpanded);
  return (
    <div style={{ width: 280 }}>
      <FolderTree
        aria-label="Library"
        sections={[
          { id: "shared", label: "Shared" },
          { id: "private", label: "Private" },
        ]}
        rootItems={ROOTS}
        loadChildren={loadChildren}
        expanded={expanded}
        onExpandedChange={setExpanded}
        {...props}
      />
    </div>
  );
}

const row = (label: string) =>
  [...document.querySelectorAll<HTMLElement>("[data-folder-tree-key]")].find(
    (el) => el.textContent?.trim() === label,
  )!;
const focused = () =>
  (document.activeElement as HTMLElement | null)?.textContent?.trim();

test("a nav of lists with one tab stop, a link per row and a named disclosure per folder", async () => {
  const screen = await render(
    <Tree
      activeId="roadmap"
      renderRowActions={(node) => (
        <FolderTreeRowAction aria-label={`More for ${node.label}`}>
          …
        </FolderTreeRowAction>
      )}
    />,
  );
  await expect
    .element(screen.getByRole("navigation", { name: "Library" }))
    .toBeVisible();
  const tabbable = [
    ...document.querySelectorAll<HTMLElement>("[data-folder-tree-key]"),
  ].filter((el) => el.tabIndex === 0);
  expect(tabbable.map((el) => el.textContent?.trim())).toEqual(["Roadmap"]);
  expect(
    screen
      .getByRole("link", { name: "Roadmap" })
      .element()
      .getAttribute("aria-current"),
  ).toBe("page");
  const toggle = screen.getByRole("button", { name: "Docs folder" }).element();
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(toggle.tabIndex).toBe(-1);
  // Only the active row's action is a tab stop.
  const actions = [
    ...document.querySelectorAll<HTMLElement>("[data-row-action]"),
  ].filter((el) => el.tabIndex === 0);
  expect(actions.map((el) => el.getAttribute("aria-label"))).toEqual([
    "More for Roadmap",
  ]);
  // 28px rows.
  expect(
    Math.round(
      row("Roadmap")
        .closest<HTMLElement>("[data-slot=folder-tree-row]")!
        .getBoundingClientRect().height,
    ),
  ).toBe(28);
  await expectNoA11yViolations(screen.container);
});

test("→ on a closed folder loads its children behind a loading row, then shows them", async () => {
  let resolve!: (nodes: FolderTreeNode[]) => void;
  const loadChildren = vi.fn(
    () => new Promise<FolderTreeNode[]>((r) => (resolve = r)),
  );
  await render(<Tree loadChildren={loadChildren} />);
  row("Docs").focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(loadChildren).toHaveBeenCalledWith("docs");
  await expect
    .poll(() => document.querySelector('[data-status="loading"]'))
    .not.toBeNull();
  await expectNoA11yViolations(document.body);
  resolve(CHILDREN.docs!);
  await expect.poll(() => row("Specs")).toBeTruthy();
  expect(document.querySelector('[data-status="loading"]')).toBeNull();
});

test("the keyboard map: ↑↓ move, → enters, ← climbs and closes, Home/End, typeahead", async () => {
  await render(<Tree initialExpanded={["docs"]} />);
  await expect.poll(() => row("Specs")).toBeTruthy();
  row("Shared").focus();
  await userEvent.keyboard("{ArrowDown}");
  expect(focused()).toBe("Docs");
  await userEvent.keyboard("{ArrowRight}"); // open already → first child
  expect(focused()).toBe("Specs");
  await userEvent.keyboard("{ArrowDown}");
  expect(focused()).toBe("plan.pdf");
  await userEvent.keyboard("{ArrowLeft}"); // a leaf climbs to its folder
  expect(focused()).toBe("Docs");
  await userEvent.keyboard("{ArrowLeft}"); // an open folder closes
  await expect.poll(() => row("Specs")).toBeUndefined();
  expect(focused()).toBe("Docs");
  await userEvent.keyboard("{ArrowLeft}"); // a closed root climbs to its section
  expect(focused()).toBe("Shared");
  await userEvent.keyboard("{End}");
  expect(focused()).toBe("Notes");
  await userEvent.keyboard("{Home}");
  expect(focused()).toBe("Shared");
  await userEvent.keyboard("r");
  expect(focused()).toBe("Roadmap");
  // Only the focused row is the tab stop.
  expect(row("Roadmap").tabIndex).toBe(0);
  expect(row("Shared").tabIndex).toBe(-1);
});

test("Enter opens a row: a link follows its href, a row without one calls onOpen", async () => {
  const onOpen = vi.fn();
  await render(
    <Tree
      onOpen={onOpen}
      rootItems={{
        shared: [{ id: "x", label: "Loose page", kind: "page" }],
        private: [],
      }}
    />,
  );
  row("Loose page").focus();
  await userEvent.keyboard("{Enter}");
  expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: "x" }));
  await expect
    .poll(() => document.querySelector('[data-status="empty"]'))
    .not.toBeNull();
});

test("a failed load shows the error row, and Retry loads again", async () => {
  let fail = true;
  const loadChildren = vi.fn((id: string) =>
    fail
      ? Promise.reject(new Error("offline"))
      : Promise.resolve(CHILDREN[id]!),
  );
  const screen = await render(
    <Tree loadChildren={loadChildren} initialExpanded={["docs"]} />,
  );
  await expect.element(screen.getByText("Couldn't load")).toBeVisible();
  await expectNoA11yViolations(screen.container);
  fail = false;
  await screen.getByRole("button", { name: "Retry" }).click();
  await expect.poll(() => row("Specs")).toBeTruthy();
  expect(loadChildren).toHaveBeenCalledTimes(2);
});

test("an opened empty folder says so", async () => {
  const screen = await render(<Tree initialExpanded={["brand"]} />);
  await expect.element(screen.getByText("Empty").first()).toBeVisible();
});

test("past maxChildren a folder ends with Show all", async () => {
  const many = Array.from({ length: 5 }, (_, i) => ({
    id: `f${i}`,
    label: `File ${i}`,
    kind: "page" as const,
    href: `#f${i}`,
  }));
  const onShowAll = vi.fn();
  const screen = await render(
    <Tree
      initialExpanded={["docs"]}
      loadChildren={() => Promise.resolve(many)}
      maxChildren={3}
      onShowAll={onShowAll}
    />,
  );
  await expect.poll(() => row("File 2")).toBeTruthy();
  expect(row("File 3")).toBeUndefined();
  await screen.getByRole("button", { name: "Show all · 2 more" }).click();
  expect(onShowAll).toHaveBeenCalledWith("docs");
});

/** Drive a Pragmatic drag from `source` to the vertical `ratio` point of `target`. */
async function drag(source: HTMLElement, target: HTMLElement, ratio = 0.5) {
  const dt = new DataTransfer();
  const s = source.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const at = {
    bubbles: true,
    cancelable: true,
    dataTransfer: dt,
    clientX: t.left + t.width / 2,
    clientY: t.top + t.height * ratio,
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

const rowBox = (label: string) =>
  row(label).closest<HTMLElement>("[data-slot=folder-tree-row]")!;

test("a drag into the middle of a folder moves the item there; its edges and a descendant refuse", async () => {
  const onMove = vi.fn();
  await render(<Tree initialExpanded={["docs"]} onMove={onMove} />);
  await expect.poll(() => row("Specs")).toBeTruthy();

  await drag(rowBox("Roadmap"), rowBox("Brand"));
  expect(onMove).toHaveBeenCalledWith({
    ids: ["roadmap"],
    targetId: "brand",
    targetSection: "shared",
  });

  onMove.mockClear();
  await drag(rowBox("Roadmap"), rowBox("Brand"), 0.1); // the top quarter
  expect(onMove).not.toHaveBeenCalled();

  await drag(rowBox("Docs"), rowBox("Specs")); // into its own descendant
  expect(onMove).not.toHaveBeenCalled();

  await drag(
    rowBox("Notes"),
    document.querySelector<HTMLElement>(
      "[data-slot=folder-tree-section-heading]",
    )!,
  );
  expect(onMove).toHaveBeenCalledWith({
    ids: ["notes"],
    targetId: null,
    targetSection: "shared",
  });
});

test("picker mode lists folders only and selects one", async () => {
  const onSelectedChange = vi.fn();
  const screen = await render(
    <Tree
      mode="picker"
      initialExpanded={["docs"]}
      selected="brand"
      onSelectedChange={onSelectedChange}
      onMove={vi.fn()}
      renderRowActions={() => (
        <FolderTreeRowAction aria-label="More">…</FolderTreeRowAction>
      )}
    />,
  );
  await expect.poll(() => row("Specs")).toBeTruthy();
  expect(row("Roadmap")).toBeUndefined();
  expect(row("plan.pdf")).toBeUndefined();
  expect(document.querySelector("[data-row-action]")).toBeNull();
  expect(rowBox("Docs").getAttribute("draggable")).toBeNull();
  expect(
    screen
      .getByRole("button", { name: "Brand" })
      .element()
      .getAttribute("aria-pressed"),
  ).toBe("true");
  await screen.getByRole("button", { name: "Specs" }).click();
  expect(onSelectedChange).toHaveBeenCalledWith("specs");
  await expectNoA11yViolations(screen.container);
});

test("a section heading closes and opens its list", async () => {
  const screen = await render(<Tree />);
  const heading = screen.getByRole("button", { name: "Private" });
  expect(heading.element().getAttribute("aria-expanded")).toBe("true");
  await heading.click();
  expect(heading.element().getAttribute("aria-expanded")).toBe("false");
  expect(row("Notes")).toBeUndefined();
});

type FileRow = { id: string; name: string };
const FILES: FileRow[] = [
  { id: "file-1", name: "brief.pdf" },
  { id: "file-2", name: "notes.md" },
];
const FILE_COLUMNS: DataListColumn<FileRow>[] = [
  { key: "name", header: "Name" },
];

/** A tree, a list and a crumb sharing one drag scope — the Library's sidebar, canvas and trail. */
function Library({
  scope = "x",
  onMove = () => {},
  canDropInto,
  onCrumbDrop = () => {},
}: {
  scope?: string;
  onMove?: FolderTreeProps["onMove"];
  canDropInto?: FolderTreeProps["canDropInto"];
  onCrumbDrop?: (move: { ids: string[]; targetId: string }) => void;
}) {
  return (
    <>
      <Tree dragScope="x" onMove={onMove} canDropInto={canDropInto} />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbDropTarget
              href="#root"
              targetId="root"
              dragScope="x"
              onDropInto={onCrumbDrop}
            >
              Library
            </BreadcrumbDropTarget>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <DataList<FileRow>
        aria-label="Files"
        columns={FILE_COLUMNS}
        data={FILES}
        getRowId={(r) => r.id}
        getRowLabel={(r) => r.name}
        dragScope={scope}
        onDropInto={() => {}}
      />
    </>
  );
}

const listRow = (id: string) =>
  document.querySelector<HTMLElement>(`[data-row-id="${id}"]`)!;

test("with a dragScope, a DataList row drops onto a tree folder and a section heading", async () => {
  const onMove = vi.fn();
  const canDropInto = vi.fn(() => true);
  await render(<Library onMove={onMove} canDropInto={canDropInto} />);
  await expect.poll(() => rowBox("Brand")).toBeTruthy();

  await drag(listRow("file-1"), rowBox("Brand"));
  expect(canDropInto).toHaveBeenCalledWith({
    ids: ["file-1"],
    targetId: "brand",
    targetSection: "shared",
  });
  expect(onMove).toHaveBeenCalledWith({
    ids: ["file-1"],
    targetId: "brand",
    targetSection: "shared",
  });
  await expect
    .poll(
      () =>
        document.querySelector("[data-slot=folder-tree] [role=status]")
          ?.textContent,
    )
    .toBe("Moved 1 item to Brand");

  onMove.mockClear();
  await drag(
    listRow("file-2"),
    [
      ...document.querySelectorAll<HTMLElement>(
        "[data-slot=folder-tree-section-heading]",
      ),
    ][1]!,
  );
  expect(onMove).toHaveBeenCalledWith({
    ids: ["file-2"],
    targetId: null,
    targetSection: "private",
  });
});

test("canDropInto refuses a list row, and a drag from another scope never reaches the tree", async () => {
  const onMove = vi.fn();
  await render(<Library onMove={onMove} canDropInto={() => false} />);
  await expect.poll(() => rowBox("Brand")).toBeTruthy();
  await drag(listRow("file-1"), rowBox("Brand"));
  expect(onMove).not.toHaveBeenCalled();
  // The host's rule applies to the tree's own rows too.
  await drag(rowBox("Roadmap"), rowBox("Brand"));
  expect(onMove).not.toHaveBeenCalled();
});

test("without a shared scope a list row is ignored", async () => {
  const onMove = vi.fn();
  await render(<Library scope="elsewhere" onMove={onMove} />);
  await expect.poll(() => rowBox("Brand")).toBeTruthy();
  await drag(listRow("file-1"), rowBox("Brand"));
  expect(onMove).not.toHaveBeenCalled();
});

test("a tree row dragged onto a BreadcrumbDropTarget in the scope carries its own id", async () => {
  const onCrumbDrop = vi.fn();
  const onMove = vi.fn();
  await render(<Library onMove={onMove} onCrumbDrop={onCrumbDrop} />);
  await expect.poll(() => rowBox("Roadmap")).toBeTruthy();
  await drag(
    rowBox("Roadmap"),
    document.querySelector<HTMLElement>("[data-drop-target]")!,
  );
  expect(onCrumbDrop).toHaveBeenCalledWith({
    ids: ["roadmap"],
    targetId: "root",
  });
  expect(onMove).not.toHaveBeenCalled();
});

test("a section heading with an href is a link, active on its own page, with a chevron that opens and closes it", async () => {
  const screen = await render(
    <Tree
      activeId="shared"
      sections={[
        { id: "shared", label: "Shared", href: "#shared" },
        { id: "private", label: "Private", href: "#private" },
      ]}
    />,
  );
  const shared = screen.getByRole("link", { name: "Shared" });
  await expect.element(shared).toHaveAttribute("href", "#shared");
  await expect.element(shared).toHaveAttribute("aria-current", "page");
  expect(shared.element().tabIndex).toBe(0); // the active heading is the tab stop
  expect(
    shared
      .element()
      .closest("[data-slot=folder-tree-section-heading]")!
      .hasAttribute("data-active"),
  ).toBe(true);
  const priv = screen.getByRole("link", { name: "Private" });
  expect(priv.element().getAttribute("aria-current")).toBeNull();
  await expectNoA11yViolations(screen.container);

  const toggle = screen.getByRole("button", { name: "Private section" });
  expect(toggle.element().getAttribute("aria-expanded")).toBe("true");
  expect(toggle.element().tabIndex).toBe(-1);
  await toggle.click();
  expect(toggle.element().getAttribute("aria-expanded")).toBe("false");
  expect(row("Notes")).toBeUndefined();

  // The keyboard still opens and closes it from the link.
  priv.element().focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect.poll(() => row("Notes")).toBeTruthy();
  await userEvent.keyboard("{ArrowLeft}");
  await expect.poll(() => row("Notes")).toBeUndefined();
});
