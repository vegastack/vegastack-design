import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Board, type BoardColumn } from "./board";

interface Deal {
  id: string;
  name: string;
}

function makeColumns(): BoardColumn<Deal>[] {
  return [
    {
      id: "lead",
      title: "Lead",
      items: [
        { id: "d1", name: "Acme" },
        { id: "d2", name: "Globex" },
      ],
    },
    { id: "won", title: "Won", items: [{ id: "d3", name: "Initech" }] },
    {
      id: "parked",
      title: "Parked",
      items: [],
      droppable: false,
      lockedReason: "Closed deals only move by automation",
    },
  ];
}

function Controlled({
  onMove,
  gate,
  initial,
  onCardActivate,
}: {
  onMove?: (id: string, container: string, index: number) => void;
  gate?: () => Promise<void>;
  initial?: BoardColumn<Deal>[];
  onCardActivate?: (deal: Deal) => void;
}) {
  const [columns, setColumns] = React.useState<BoardColumn<Deal>[]>(
    initial ?? makeColumns(),
  );
  return (
    <Board<Deal>
      aria-label="Deals"
      columns={columns}
      getItemId={(deal) => deal.id}
      renderCard={(deal) => <span>{deal.name}</span>}
      onCardActivate={onCardActivate}
      onMove={(move) => {
        onMove?.(move.id, move.to.container, move.to.index);
        if (gate) return gate();
        setColumns((prev) => {
          const moved = prev
            .flatMap((c) => c.items)
            .find((d) => d.id === move.id)!;
          return prev.map((column) => {
            const without = column.items.filter((d) => d.id !== move.id);
            if (column.id !== move.to.container)
              return { ...column, items: without };
            const next = [...without];
            next.splice(move.to.index, 0, moved);
            return { ...column, items: next };
          });
        });
      }}
    />
  );
}

function columnCards(columnId: string): string[] {
  return Array.from(
    document.querySelectorAll(
      `[data-column="${columnId}"] [data-slot="board-card"]`,
    ),
  ).map(
    (el) =>
      el.querySelector('[data-slot="board-card-surface"]')?.textContent ?? "",
  );
}

test("renders columns with counts, cards as list items, and a locked empty lane", async () => {
  const screen = await render(<Controlled />);
  const board = screen.getByRole("group", { name: "Deals" });
  await expect.element(board).toBeInTheDocument();
  expect(columnCards("lead")).toEqual(["Acme", "Globex"]);
  expect(columnCards("won")).toEqual(["Initech"]);
  // Empty non-droppable lane names its lock reason, using Empty bordered.
  const parked = document.querySelector('[data-column="parked"]')!;
  expect(parked.textContent).toContain("Closed deals only move by automation");
  expect(
    parked.querySelector('[data-slot="board-column-empty"]'),
  ).not.toBeNull();
});

test("cards are draggable via the engine (desktop)", async () => {
  await render(<Controlled />);
  const card = document.querySelector(
    '[data-slot="board-card"]',
  ) as HTMLElement;
  expect(card.getAttribute("draggable")).toBe("true");
});

test("roving focus: one tab stop, ArrowDown within a column, ArrowRight across at a clamped index", async () => {
  await render(<Controlled />);
  const surfaces = Array.from(
    document.querySelectorAll('[data-slot="board-card-surface"]'),
  ) as HTMLElement[];
  expect(surfaces.map((s) => s.tabIndex)).toEqual([0, -1, -1]);
  surfaces[0]!.focus();
  await userEvent.keyboard("{ArrowDown}");
  expect((document.activeElement as HTMLElement).textContent).toContain(
    "Globex",
  );
  // Across to Won (index clamps 1 → 0, its only card).
  await userEvent.keyboard("{ArrowRight}");
  expect((document.activeElement as HTMLElement).textContent).toContain(
    "Initech",
  );
  await userEvent.keyboard("{ArrowLeft}");
  expect((document.activeElement as HTMLElement).textContent).toContain("Acme");
});

test("Space lifts the focused card into move mode; ArrowRight commits a cross-column move", async () => {
  const onMove = vi.fn();
  await render(<Controlled onMove={onMove} />);
  const surfaces = Array.from(
    document.querySelectorAll('[data-slot="board-card-surface"]'),
  ) as HTMLElement[];
  surfaces[0]!.focus();
  await userEvent.keyboard(" ");
  const live = document.querySelector('[role="status"]')!;
  expect(live.textContent).toContain("Move mode on");
  await userEvent.keyboard("{ArrowRight}");
  expect(onMove).toHaveBeenCalledWith("d1", "won", 0);
  await expect.poll(() => columnCards("won")).toEqual(["Acme", "Initech"]);
});

test("Enter activates a card; the menu's Move to… commits with lock reasons on unavailable targets", async () => {
  const onCardActivate = vi.fn();
  const screen = await render(<Controlled onCardActivate={onCardActivate} />);
  const surfaces = Array.from(
    document.querySelectorAll('[data-slot="board-card-surface"]'),
  ) as HTMLElement[];
  surfaces[0]!.focus();
  await userEvent.keyboard("{Enter}");
  expect(onCardActivate).toHaveBeenCalledWith(
    expect.objectContaining({ id: "d1" }),
  );
  // M opens the per-card Move menu.
  await userEvent.keyboard("m");
  const wonItem = screen.getByRole("menuitem", { name: /Move to Won/ });
  await expect.element(wonItem).toBeInTheDocument();
  const parkedItem = screen
    .getByRole("menuitem", { name: /Move to Parked/ })
    .element() as HTMLElement;
  expect(
    parkedItem.getAttribute("aria-disabled") === "true" ||
      parkedItem.hasAttribute("data-disabled"),
  ).toBe(true);
  expect(parkedItem.textContent).toContain(
    "Closed deals only move by automation",
  );
  await wonItem.click();
  // Menu moves APPEND to the target column.
  await expect.poll(() => columnCards("won")).toEqual(["Initech", "Acme"]);
});

test("a rejected move shimmers pending, then announces the snap-back with order unchanged", async () => {
  let reject!: (e?: unknown) => void;
  const gate = () =>
    new Promise<void>((_, rej) => {
      reject = rej;
    });
  await render(<Controlled gate={gate} />);
  const surfaces = Array.from(
    document.querySelectorAll('[data-slot="board-card-surface"]'),
  ) as HTMLElement[];
  surfaces[0]!.focus();
  await userEvent.keyboard(" ");
  await userEvent.keyboard("{ArrowRight}");
  const card = document.querySelector('[data-drag-item="d1"]') as HTMLElement;
  expect(card.hasAttribute("data-drag-pending")).toBe(true);
  reject(new Error("gated"));
  await expect
    .poll(() =>
      (
        document.querySelector('[data-drag-item="d1"]') as HTMLElement
      ).hasAttribute("data-drag-pending"),
    )
    .toBe(false);
  expect(columnCards("lead")).toEqual(["Acme", "Globex"]);
  expect(document.querySelector('[role="status"]')!.textContent).toContain(
    "Move rejected",
  );
});

test("collapsed columns render as an expandable strip; expanded-from-collapsed is read-only", async () => {
  const columns = makeColumns();
  columns[1] = { ...columns[1]!, collapsed: true };
  const screen = await render(<Controlled initial={columns} />);
  const strip = screen.getByRole("button", { name: /Expand column/ });
  await expect.element(strip).toBeInTheDocument();
  expect(document.querySelector('[data-column="won"]')).toBeNull();
  await strip.click();
  const expanded = document.querySelector('[data-column="won"]') as HTMLElement;
  expect(expanded).not.toBeNull();
  expect(expanded.hasAttribute("data-read-only")).toBe(true);
  // Read-only cards lose the move menu (drags are gated at dragstart by the
  // hook's canDrag — the native attribute remains, the behaviour does not).
  expect(expanded.querySelector('[aria-label="Move card"]')).toBeNull();
});

test("the drag posture is flat: no shadow utility anywhere on cards", async () => {
  await render(<Controlled />);
  const offenders = Array.from(
    document.querySelectorAll(
      '[data-slot="board-card"], [data-slot="board-card"] *',
    ),
  ).filter((el) => /shadow-/.test(el.getAttribute("class") ?? ""));
  expect(offenders).toEqual([]);
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

test("no a11y violations — board with cards, empty locked lane, move mode", async () => {
  const screen = await render(<Controlled />);
  await expectNoA11yViolations(screen.container);
  const surfaces = Array.from(
    document.querySelectorAll('[data-slot="board-card-surface"]'),
  ) as HTMLElement[];
  surfaces[0]!.focus();
  await userEvent.keyboard(" ");
  await expectNoA11yViolations(screen.container);
});

test("a cross-column keyboard move keeps move mode and focus follows the card", async () => {
  await render(<Controlled />);
  const surfaces = Array.from(
    document.querySelectorAll('[data-slot="board-card-surface"]'),
  ) as HTMLElement[];
  surfaces[0]!.focus();
  await userEvent.keyboard(" ");
  await userEvent.keyboard("{ArrowRight}");
  await expect.poll(() => columnCards("won")).toEqual(["Acme", "Initech"]);
  // The card REMOUNTED under the Won column — focus must follow it and move
  // mode must survive, or the session strands on <body>.
  await expect
    .poll(() => (document.activeElement as HTMLElement)?.textContent ?? "")
    .toContain("Acme");
  const moved = document.querySelector('[data-drag-item="d1"]')!;
  expect(moved.closest('[data-column="won"]')).not.toBeNull();
  expect(moved.hasAttribute("data-dragging")).toBe(true);
  // A second step in the same session still works.
  await userEvent.keyboard("{ArrowDown}");
  await expect.poll(() => columnCards("won")).toEqual(["Initech", "Acme"]);
  await userEvent.keyboard("{Escape}");
  expect(document.querySelector('[role="status"]')!.textContent).toContain(
    "Move mode off",
  );
});

test("the roving tab stop falls back when the active card disappears", async () => {
  function Shrinking() {
    const [columns, setColumns] = React.useState(makeColumns());
    return (
      <div>
        <button
          type="button"
          onClick={() =>
            setColumns((prev) =>
              prev.map((c) => ({
                ...c,
                items: c.items.filter((d) => d.id !== "d2"),
              })),
            )
          }
        >
          remove
        </button>
        <Board<Deal>
          aria-label="Deals"
          columns={columns}
          getItemId={(deal) => deal.id}
          renderCard={(deal) => <span>{deal.name}</span>}
          onMove={() => {}}
        />
      </div>
    );
  }
  const screen = await render(<Shrinking />);
  const surfaces = Array.from(
    document.querySelectorAll('[data-slot="board-card-surface"]'),
  ) as HTMLElement[];
  // Focus the second card, then let the host remove it.
  surfaces[1]!.focus();
  await screen.getByRole("button", { name: "remove" }).click();
  const remaining = Array.from(
    document.querySelectorAll('[data-slot="board-card-surface"]'),
  ) as HTMLElement[];
  // The board must keep exactly one tab stop.
  expect(remaining.map((s) => s.tabIndex)).toContain(0);
});

test("the card menu offers lossless within-column ordering", async () => {
  const onMove = vi.fn();
  await render(<Controlled onMove={onMove} />);
  const surfaces = Array.from(
    document.querySelectorAll('[data-slot="board-card-surface"]'),
  ) as HTMLElement[];
  surfaces[0]!.focus();
  await userEvent.keyboard("m");
  const menu = await vi.waitFor(() => {
    const el = document.querySelector('[role="menu"]');
    if (!el) throw new Error("menu not open");
    return el;
  });
  const labels = Array.from(menu.querySelectorAll('[role="menuitem"]')).map(
    (item) => item.textContent ?? "",
  );
  expect(labels.some((l) => l.startsWith("Move down"))).toBe(true);
  expect(labels.some((l) => l.startsWith("Move to bottom"))).toBe(true);
  const down = Array.from(menu.querySelectorAll('[role="menuitem"]')).find(
    (item) => item.textContent === "Move down",
  ) as HTMLElement;
  down.click();
  await expect.poll(() => onMove).toHaveBeenCalledWith("d1", "lead", 1);
  await expect.poll(() => columnCards("lead")).toEqual(["Globex", "Acme"]);
});

test("the two-step menu flow is keyboard-lossless: cross-column move restores focus, M reopens, refine works", async () => {
  const onMove = vi.fn();
  await render(<Controlled onMove={onMove} />);
  const surfaces = Array.from(
    document.querySelectorAll('[data-slot="board-card-surface"]'),
  ) as HTMLElement[];
  surfaces[0]!.focus();
  await userEvent.keyboard("m");
  const won = await vi.waitFor(() => {
    const item = Array.from(
      document.querySelectorAll('[role="menuitem"]'),
    ).find((el) => el.textContent?.startsWith("Move to Won"));
    if (!item) throw new Error("menu not open");
    return item as HTMLElement;
  });
  won.click();
  await expect.poll(() => columnCards("won")).toEqual(["Initech", "Acme"]);
  // Step 1 remounted the card under Won — focus must land back on it, or
  // the documented refine step is unreachable without a pointer.
  await expect
    .poll(() => (document.activeElement as HTMLElement)?.textContent ?? "")
    .toContain("Acme");
  // Step 2: M reopens the menu on the moved card; Move up refines.
  await userEvent.keyboard("m");
  const moveUp = await vi.waitFor(() => {
    const item = Array.from(
      document.querySelectorAll('[role="menuitem"]'),
    ).find((el) => el.textContent === "Move up");
    if (!item) throw new Error("menu not reopened");
    return item as HTMLElement;
  });
  moveUp.click();
  await expect.poll(() => columnCards("won")).toEqual(["Acme", "Initech"]);
});

test("the card layer keeps ONE tab stop for surfaces and ONE for menu triggers", async () => {
  await render(<Controlled />);
  const surfaceStops = Array.from(
    document.querySelectorAll('[data-slot="board-card-surface"]'),
  ).filter((el) => (el as HTMLElement).tabIndex === 0);
  const triggerStops = Array.from(
    document.querySelectorAll('[aria-label="Move card"]'),
  ).filter((el) => (el as HTMLElement).tabIndex === 0);
  expect(surfaceStops.length).toBe(1);
  expect(triggerStops.length).toBe(1);
  // And they belong to the SAME (roving) card.
  expect(surfaceStops[0]!.parentElement!.contains(triggerStops[0]!)).toBe(true);
});
