import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  SortableList,
  type SortableListItem,
  type SortableListProps,
} from "./sortable-list";

function Controlled({
  onMove,
  gate,
  disabled,
  initial = ["Alpha", "Beta", "Gamma"],
  locked = [],
  ...rest
}: {
  onMove?: (id: string, to: number) => void;
  gate?: () => Promise<void>;
  disabled?: boolean;
  initial?: string[];
  locked?: string[];
} & Partial<
  Pick<
    SortableListProps,
    | "lockedReason"
    | "renderActions"
    | "actionsLabel"
    | "layout"
    | "renderItem"
    | "getItemActions"
  >
>) {
  const [items, setItems] = React.useState<SortableListItem[]>(
    initial.map((label) => ({
      id: label.toLowerCase(),
      label,
      disabled: locked.includes(label),
    })),
  );
  return (
    <SortableList
      aria-label="Stages"
      items={items}
      disabled={disabled}
      renderItem={(item) => <span>{item.label}</span>}
      {...rest}
      onReorder={(move) => {
        onMove?.(move.id, move.to.index);
        if (gate) return gate();
        setItems((prev) => {
          const moved = prev.find((i) => i.id === move.id)!;
          const next = prev.filter((i) => i.id !== move.id);
          next.splice(move.to.index, 0, moved);
          return next;
        });
      }}
    />
  );
}

function rowLabels(): string[] {
  return Array.from(
    document.querySelectorAll('[data-slot="sortable-list-item"]'),
  ).map(
    (el) => el.querySelector("[data-slot=item-content]")?.textContent ?? "",
  );
}

test("getItemActions render above the Move items in the one row menu (DS-43)", async () => {
  const onRename = vi.fn();
  const screen = await render(
    <Controlled
      getItemActions={(item) => [
        { label: `Rename ${item.label}`, onSelect: onRename },
        { label: "Delete", destructive: true },
      ]}
    />,
  );
  await screen.getByRole("button", { name: "Actions for Beta" }).click();
  const items = [...document.querySelectorAll('[role="menuitem"]')].map((n) =>
    n.textContent?.trim(),
  );
  expect(items.slice(0, 2)).toEqual(["Rename Beta", "Delete"]);
  expect(items).toContain("Move up");
  await screen.getByRole("menuitem", { name: "Rename Beta" }).click();
  expect(onRename).toHaveBeenCalledOnce();
});

test("a row action that deletes its row keeps focus in the list (DS-43)", async () => {
  function Host() {
    const [items, setItems] = React.useState<SortableListItem[]>([
      { id: "a", label: "Alpha" },
      { id: "b", label: "Beta" },
      { id: "c", label: "Gamma", disabled: true },
      { id: "d", label: "Delta" },
    ]);
    return (
      <SortableList
        aria-label="Stages"
        items={items}
        renderItem={(item) => <span>{item.label}</span>}
        getItemActions={(item) => [
          {
            label: "Delete",
            onSelect: () =>
              setItems((prev) => prev.filter((i) => i.id !== item.id)),
          },
        ]}
        onReorder={() => {}}
      />
    );
  }
  const screen = await render(<Host />);
  await screen.getByRole("button", { name: "Actions for Beta" }).click();
  await screen.getByRole("menuitem", { name: "Delete" }).click();
  // Gamma is locked and has no handle: its menu trigger takes focus.
  await expect
    .element(screen.getByRole("button", { name: "Actions for Gamma" }))
    .toHaveFocus();
  await screen.getByRole("button", { name: "Actions for Gamma" }).click();
  await screen.getByRole("menuitem", { name: "Delete" }).click();
  await expect
    .element(screen.getByRole("button", { name: "Reorder Delta" }))
    .toHaveFocus();
});

test("renders a labelled list of items with handles and menus", async () => {
  const screen = await render(<Controlled />);
  const list = screen.getByRole("list", { name: "Stages" });
  await expect.element(list).toBeInTheDocument();
  expect(rowLabels()).toEqual(["Alpha", "Beta", "Gamma"]);
  await expect
    .element(screen.getByRole("button", { name: "Reorder Alpha" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Actions for Alpha" }))
    .toBeInTheDocument();
});

test("rows are native draggables via the engine", async () => {
  await render(<Controlled />);
  const row = document.querySelector(
    '[data-slot="sortable-list-item"]',
  ) as HTMLElement;
  expect(row.getAttribute("draggable")).toBe("true");
});

test("keyboard: Space on the handle lifts, ArrowDown commits a step, Escape ends", async () => {
  const onMove = vi.fn();
  const screen = await render(<Controlled onMove={onMove} />);
  const handle = screen
    .getByRole("button", { name: "Reorder Alpha" })
    .element() as HTMLElement;
  handle.focus();
  await userEvent.keyboard(" ");
  await userEvent.keyboard("{ArrowDown}");
  expect(onMove).toHaveBeenCalledWith("alpha", 1);
  expect(rowLabels()).toEqual(["Beta", "Alpha", "Gamma"]);
  const live = document.querySelector('[role="status"]')!;
  expect(live.textContent).toContain("Moved to position 2 of 3");
  await userEvent.keyboard("{Escape}");
  expect(live.textContent).toContain("Move mode off");
});

test("the menu equivalent is lossless: Move up / down / to top / to bottom", async () => {
  const screen = await render(<Controlled />);
  await screen.getByRole("button", { name: "Actions for Gamma" }).click();
  await screen.getByRole("menuitem", { name: "Move to top" }).click();
  await expect.poll(() => rowLabels()).toEqual(["Gamma", "Alpha", "Beta"]);
  await screen.getByRole("button", { name: "Actions for Gamma" }).click();
  await screen.getByRole("menuitem", { name: "Move down" }).click();
  await expect.poll(() => rowLabels()).toEqual(["Alpha", "Gamma", "Beta"]);
  await screen.getByRole("button", { name: "Actions for Gamma" }).click();
  await screen.getByRole("menuitem", { name: "Move to bottom" }).click();
  await expect.poll(() => rowLabels()).toEqual(["Alpha", "Beta", "Gamma"]);
});

test("edge menu items disable (no wrap): Move up on the first row", async () => {
  const screen = await render(<Controlled />);
  await screen.getByRole("button", { name: "Actions for Alpha" }).click();
  // .element() does not retry — wait for the menu to actually open first
  // (Firefox opens it a frame later than Chromium).
  const locator = screen.getByRole("menuitem", { name: "Move up" });
  await expect.element(locator).toBeInTheDocument();
  const moveUp = locator.element() as HTMLElement;
  expect(
    moveUp.getAttribute("aria-disabled") === "true" ||
      moveUp.hasAttribute("data-disabled"),
  ).toBe(true);
});

test("a rejected move shows pending then announces the snap-back", async () => {
  let reject!: (e?: unknown) => void;
  const gate = () =>
    new Promise<void>((_, rej) => {
      reject = rej;
    });
  const screen = await render(<Controlled gate={gate} />);
  const handle = screen
    .getByRole("button", { name: "Reorder Alpha" })
    .element() as HTMLElement;
  handle.focus();
  await userEvent.keyboard(" ");
  await userEvent.keyboard("{ArrowDown}");
  const row = document.querySelector('[data-drag-item="alpha"]') as HTMLElement;
  expect(row.hasAttribute("data-drag-pending")).toBe(true);
  reject(new Error("no"));
  await expect
    .poll(() =>
      (
        document.querySelector('[data-drag-item="alpha"]') as HTMLElement
      ).hasAttribute("data-drag-pending"),
    )
    .toBe(false);
  // Host never applied it → order unchanged (the visual snap-back).
  expect(rowLabels()).toEqual(["Alpha", "Beta", "Gamma"]);
  expect(document.querySelector('[role="status"]')!.textContent).toContain(
    "Move rejected",
  );
});

test("disabled renders rows without handles or menus", async () => {
  const screen = await render(<Controlled disabled />);
  expect(rowLabels()).toEqual(["Alpha", "Beta", "Gamma"]);
  expect(document.querySelector('[aria-label^="Reorder"]')).toBeNull();
  expect(document.querySelector('[aria-label^="Actions for"]')).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("ref forwards to the root", async () => {
  const ref = React.createRef<HTMLDivElement>();
  const [a] = ["Alpha"];
  await render(
    <SortableList
      ref={ref}
      aria-label="One"
      items={[{ id: "a", label: a }]}
      renderItem={(i) => i.label}
      onReorder={() => {}}
    />,
  );
  expect(ref.current?.dataset.slot).toBe("sortable-list");
});

test("focus indicator: nothing strips the outline", async () => {
  await render(<Controlled />);
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

test("no a11y violations — idle and move mode", async () => {
  const screen = await render(<Controlled />);
  await expectNoA11yViolations(screen.container);
  const handle = screen
    .getByRole("button", { name: "Reorder Beta" })
    .element() as HTMLElement;
  handle.focus();
  await userEvent.keyboard(" ");
  await expectNoA11yViolations(screen.container);
});

// ---- DS-43: locked rows, inline actions, the grid layout -------------------

function rowOf(label: string): HTMLElement {
  return Array.from(
    document.querySelectorAll<HTMLElement>('[data-slot="sortable-list-item"]'),
  ).find(
    (el) => el.querySelector("[data-slot=item-content]")?.textContent === label,
  )!;
}

test("a locked row keeps its spacer and menu, and Move items carry the reason", async () => {
  const screen = await render(
    <Controlled
      initial={["Unit", "Colour"]}
      locked={["Unit"]}
      lockedReason="Built-in values can't move"
    />,
  );
  const row = rowOf("Unit");
  // The handle's footprint stays, so locked and unlocked rows align.
  const spacer = row.querySelector<HTMLElement>(
    '[data-slot="sortable-list-handle-spacer"]',
  );
  expect(spacer).not.toBeNull();
  expect(spacer!.getAttribute("aria-hidden")).toBe("true");
  expect(row.querySelector('[data-slot="sortable-list-handle"]')).toBeNull();
  // The unlocked row keeps a real handle and no spacer.
  expect(
    rowOf("Colour").querySelector('[data-slot="sortable-list-handle-spacer"]'),
  ).toBeNull();
  await screen.getByRole("button", { name: "Actions for Unit" }).click();
  for (const name of [
    "Move up",
    "Move down",
    "Move to top",
    "Move to bottom",
  ]) {
    const item = screen.getByRole("menuitem", { name });
    await expect
      .element(item)
      .toHaveAccessibleDescription("Built-in values can't move");
    const el = item.element() as HTMLElement;
    expect(
      el.getAttribute("aria-disabled") === "true" ||
        el.hasAttribute("data-disabled"),
    ).toBe(true);
  }
});

test("a locked row without a reason has no description, and unlocked rows never carry one", async () => {
  const screen = await render(
    <Controlled
      initial={["Unit", "Colour", "Size"]}
      locked={["Unit"]}
      lockedReason="Built-in values can't move"
    />,
  );
  await screen.getByRole("button", { name: "Actions for Colour" }).click();
  const moveDown = screen.getByRole("menuitem", { name: "Move down" });
  await expect.element(moveDown).toBeInTheDocument();
  expect(
    (moveDown.element() as HTMLElement).hasAttribute("aria-describedby"),
  ).toBe(false);
});

test("a locked row cannot be lifted, and others move past it", async () => {
  const onMove = vi.fn();
  const screen = await render(
    <Controlled
      onMove={onMove}
      initial={["Unit", "Colour", "Size"]}
      locked={["Unit"]}
    />,
  );
  expect(document.querySelector('[aria-label="Reorder Unit"]')).toBeNull();
  const handle = screen
    .getByRole("button", { name: "Reorder Colour" })
    .element() as HTMLElement;
  handle.focus();
  await userEvent.keyboard(" ");
  await userEvent.keyboard("{ArrowUp}");
  expect(onMove).toHaveBeenCalledWith("colour", 0);
  expect(rowLabels()).toEqual(["Colour", "Unit", "Size"]);
});

test("renderActions adds an inline slot on every row, locked ones included", async () => {
  const screen = await render(
    <Controlled
      initial={["Unit", "Colour"]}
      locked={["Unit"]}
      renderActions={(item) => (
        <button type="button" aria-label={`Rename ${item.label}`}>
          ✎
        </button>
      )}
    />,
  );
  for (const label of ["Unit", "Colour"]) {
    const slot = rowOf(label).querySelector(
      '[data-slot="sortable-list-actions"]',
    );
    expect(slot).not.toBeNull();
    await expect
      .element(screen.getByRole("button", { name: `Rename ${label}` }))
      .toBeInTheDocument();
  }
});

test("actionsLabel names the row menu trigger", async () => {
  const screen = await render(
    <Controlled actionsLabel={(label) => `${label} options`} />,
  );
  await expect
    .element(screen.getByRole("button", { name: "Alpha options" }))
    .toBeInTheDocument();
});

/** Dispatch a Pragmatic dragstart on `row` at the centre of `from`. */
function startDragAt(row: HTMLElement, from: HTMLElement) {
  const rect = from.getBoundingClientRect();
  row.dispatchEvent(
    new DragEvent("dragstart", {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer(),
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    }),
  );
}

test("with an input in the row, drag starts only from the handle", async () => {
  await render(
    <Controlled
      renderItem={(item) => (
        <input
          aria-label={`Name for ${item.label}`}
          defaultValue={item.label}
        />
      )}
    />,
  );
  const row = document.querySelector<HTMLElement>('[data-drag-item="alpha"]')!;
  const input = row.querySelector("input")!;
  startDragAt(row, input);
  await new Promise((r) => setTimeout(r, 60));
  expect(row.hasAttribute("data-dragging")).toBe(false);
  row.dispatchEvent(new DragEvent("dragend", { bubbles: true }));
  const handle = row.querySelector<HTMLElement>(
    '[data-slot="sortable-list-handle"]',
  )!;
  startDragAt(row, handle);
  await expect.poll(() => row.hasAttribute("data-dragging")).toBe(true);
  row.dispatchEvent(new DragEvent("dragend", { bubbles: true }));
});

/* The harness compiles no Tailwind, so the grid's `grid-cols-[repeat(auto-fill,…)]` is mirrored
   1:1 as a fixed three-column track list (testing.md § Style-mirror): the hook measures the column
   count from where the rows actually wrap, which is what this proves. */
function GridMirror() {
  return (
    <style>{`
      [data-slot="sortable-list"][data-layout="grid"] [data-slot="item-group"] {
        display: grid; grid-template-columns: repeat(3, 120px); gap: 8px;
      }
      [data-slot="sortable-list"][data-layout="grid"] [data-slot="sortable-list-item"] {
        position: relative; height: 80px;
      }
    `}</style>
  );
}

const SIX = ["One", "Two", "Three", "Four", "Five", "Six"];

test("grid: the layout is exposed and the handle overlays the tile", async () => {
  await render(
    <>
      <GridMirror />
      <Controlled layout="grid" initial={SIX} />
    </>,
  );
  const root = document.querySelector('[data-slot="sortable-list"]')!;
  expect(root.getAttribute("data-layout")).toBe("grid");
  const group = root.querySelector('[data-slot="item-group"]')!;
  expect(group.className).toContain(
    "grid-cols-[repeat(auto-fill,minmax(--spacing(28),1fr))]",
  );
  const handle = rowOf("One").querySelector(
    '[data-slot="sortable-list-handle"]',
  )!;
  expect(handle.className).toContain("absolute");
  expect(handle.className).toContain("start-1");
});

test("grid: ←/→ step one tile, ↑/↓ move by a measured row", async () => {
  const onMove = vi.fn();
  const screen = await render(
    <>
      <GridMirror />
      <Controlled layout="grid" initial={SIX} onMove={onMove} />
    </>,
  );
  const handle = screen
    .getByRole("button", { name: "Reorder Two" })
    .element() as HTMLElement;
  handle.focus();
  await userEvent.keyboard(" ");
  await userEvent.keyboard("{ArrowRight}");
  expect(onMove).toHaveBeenLastCalledWith("two", 2);
  await userEvent.keyboard("{ArrowDown}");
  expect(onMove).toHaveBeenLastCalledWith("two", 5);
  expect(rowLabels()).toEqual(["One", "Three", "Four", "Five", "Six", "Two"]);
  await userEvent.keyboard("{ArrowUp}");
  expect(onMove).toHaveBeenLastCalledWith("two", 2);
});

test("grid: a pointer drop on a tile's right edge lands after it, across the wrap", async () => {
  const onMove = vi.fn();
  await render(
    <>
      <GridMirror />
      <Controlled layout="grid" initial={SIX} onMove={onMove} />
    </>,
  );
  const row = rowOf("Five");
  const handle = row.querySelector<HTMLElement>(
    '[data-slot="sortable-list-handle"]',
  )!;
  // "Three" ends the first row; its right edge is the seam before "Four" on the next row.
  const target = rowOf("Three");
  const rect = target.getBoundingClientRect();
  const at = {
    bubbles: true,
    cancelable: true,
    clientX: rect.right - 4,
    clientY: rect.top + rect.height / 2,
  };
  startDragAt(row, handle);
  await new Promise((r) => setTimeout(r, 60));
  for (const type of ["dragenter", "dragover"] as const) {
    target.dispatchEvent(new DragEvent(type, at));
    await new Promise((r) => setTimeout(r, 60));
  }
  expect(target.getAttribute("data-drop-edge")).toBe("right");
  target.dispatchEvent(new DragEvent("drop", at));
  row.dispatchEvent(new DragEvent("dragend", at));
  await expect.poll(() => onMove.mock.calls.length).toBe(1);
  expect(onMove).toHaveBeenCalledWith("five", 3);
  expect(rowLabels()).toEqual(["One", "Two", "Three", "Five", "Four", "Six"]);
});

test("no a11y violations — grid and locked", async () => {
  const grid = await render(
    <>
      <GridMirror />
      <Controlled layout="grid" initial={SIX} />
    </>,
  );
  await expectNoA11yViolations(grid.container);
  await grid.unmount();
  const locked = await render(
    <Controlled
      initial={["Unit", "Colour"]}
      locked={["Unit"]}
      lockedReason="Built-in values can't move"
      renderActions={(item) => (
        <button type="button" aria-label={`Rename ${item.label}`}>
          ✎
        </button>
      )}
    />,
  );
  await expectNoA11yViolations(locked.container);
  await locked.getByRole("button", { name: "Actions for Unit" }).click();
  await expect
    .element(locked.getByRole("menuitem", { name: "Move down" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body);
});
