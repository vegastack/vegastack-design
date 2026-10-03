import * as React from "react";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Board, type BoardColumn, type BoardProps } from "./board";
import { useTruncationFocusable } from "./truncated-text";

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

function applyMove(
  prev: BoardColumn<Deal>[],
  id: string,
  container: string,
  index: number,
): BoardColumn<Deal>[] {
  const moved = prev.flatMap((c) => c.items).find((d) => d.id === id)!;
  return prev.map((column) => {
    const without = column.items.filter((d) => d.id !== id);
    if (column.id !== container) return { ...column, items: without };
    const next = [...without];
    next.splice(index, 0, moved);
    return { ...column, items: next };
  });
}

function Controlled({
  onMove,
  gate,
  initial,
  ...props
}: {
  onMove?: (id: string, container: string, index: number) => void;
  gate?: () => Promise<void>;
  initial?: BoardColumn<Deal>[];
} & Partial<BoardProps<Deal>>) {
  const [columns, setColumns] = React.useState<BoardColumn<Deal>[]>(
    initial ?? makeColumns(),
  );
  return (
    <Board<Deal>
      aria-label="Deals"
      height="24rem"
      columns={columns}
      getItemId={(deal) => deal.id}
      getItemLabel={(deal) => deal.name}
      renderCard={(deal) => <span>{deal.name}</span>}
      onMove={(move) => {
        onMove?.(move.id, move.to.container, move.to.index);
        if (gate) return gate();
        setColumns((prev) =>
          applyMove(prev, move.id, move.to.container, move.to.index),
        );
      }}
      {...props}
    />
  );
}

function laneCards(columnId: string): string[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      `[data-column="${columnId}"] [data-slot="board-card"]`,
    ),
  ).map((el) => el.dataset.boardCardId ?? "");
}

function surface(id: string): HTMLElement {
  return document.querySelector<HTMLElement>(
    `[data-board-card-id="${id}"] [data-slot="board-card-surface"]`,
  )!;
}

/** Click through the DOM: this suite loads no CSS, so elements have no box to hit. */
async function press(locator: ReturnType<typeof page.getByRole>) {
  await expect.element(locator).toBeInTheDocument();
  (locator.element() as HTMLElement).click();
}

function announcement(): string {
  return Array.from(document.querySelectorAll('[role="status"]'))
    .map((node) => node.textContent ?? "")
    .join(" ");
}

test("renders lanes with counts, cards as list items, and a locked empty lane", async () => {
  const screen = await render(<Controlled />);
  await expect
    .element(screen.getByRole("group", { name: "Deals" }))
    .toBeInTheDocument();
  expect(laneCards("lead")).toEqual(["d1", "d2"]);
  expect(laneCards("won")).toEqual(["d3"]);
  const parked = document.querySelector('[data-column="parked"]')!;
  const empty = parked.querySelector('[data-slot="board-column-empty"]')!;
  expect(empty.textContent).toContain("Nothing here");
  expect(empty.textContent).toContain("Closed deals only move by automation");
  await expect
    .element(screen.getByRole("region", { name: "Lead, 2 cards" }))
    .toBeInTheDocument();
});

test("lanes are 20rem wide by default, grow, and the scroller hides its scrollbar", async () => {
  await render(<Controlled />);
  const board = document.querySelector<HTMLElement>('[data-slot="board"]')!;
  expect(board.style.getPropertyValue("--board-column-width")).toBe("20rem");
  const lane = document.querySelector<HTMLElement>('[data-column="lead"]')!;
  expect(lane.className).toContain("basis-(--board-column-width)");
  expect(lane.className).toContain("grow");
  const scroller = document.querySelector<HTMLElement>(
    '[data-slot="board-scroller"]',
  )!;
  expect(scroller.className).toContain("[scrollbar-width:none]");
  expect(document.querySelector('[data-slot="board-fade-end"]')).not.toBeNull();
});

test('height="fill" sizes the board to the viewport below it; cards scroll inside lanes', async () => {
  await render(<Controlled height="fill" fillOffset="0px" />);
  const board = document.querySelector<HTMLElement>('[data-slot="board"]')!;
  expect(board.style.getPropertyValue("--board-height")).toContain("100dvh");
  expect(board.className).toContain("h-(--board-height)");
  const body = document.querySelector<HTMLElement>(
    '[data-column="lead"] [data-slot="board-column-body"]',
  )!;
  expect(body.className).toContain("overflow-y-auto");
});

test("roving focus: one tab stop, ArrowDown within a lane, ArrowRight across", async () => {
  await render(<Controlled />);
  const tabbable = document.querySelectorAll(
    '[data-slot="board-card-surface"][tabindex="0"]',
  );
  expect(tabbable).toHaveLength(1);
  surface("d1").focus();
  await userEvent.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(surface("d2"));
  await userEvent.keyboard("{ArrowRight}");
  expect(document.activeElement).toBe(surface("d3"));
});

test("Space picks up, arrows move a ghost, Space drops — one onMove on the drop", async () => {
  const onMove = vi.fn();
  await render(<Controlled onMove={onMove} />);
  surface("d1").focus();
  await userEvent.keyboard(" ");
  expect(announcement()).toContain("Picked up Acme");
  await userEvent.keyboard("{ArrowDown}");
  expect(laneCards("lead")).toEqual(["d2", "d1"]);
  expect(onMove).not.toHaveBeenCalled();
  await userEvent.keyboard("{ArrowRight}");
  expect(laneCards("won")).toContain("d1");
  expect(document.activeElement).toBe(surface("d1"));
  await userEvent.keyboard(" ");
  expect(onMove).toHaveBeenCalledTimes(1);
  expect(onMove).toHaveBeenCalledWith("d1", "won", 1);
  expect(laneCards("won")).toEqual(["d3", "d1"]);
});

test("Escape cancels a keyboard move and puts the card back", async () => {
  const onMove = vi.fn();
  await render(<Controlled onMove={onMove} />);
  surface("d1").focus();
  await userEvent.keyboard(" ");
  await userEvent.keyboard("{ArrowRight}");
  await userEvent.keyboard("{Escape}");
  expect(onMove).not.toHaveBeenCalled();
  expect(laneCards("lead")).toEqual(["d1", "d2"]);
  expect(announcement()).toContain("Move cancelled");
});

test("a keyboard move skips a lane that refuses cards", async () => {
  const onMove = vi.fn();
  await render(<Controlled onMove={onMove} />);
  surface("d3").focus();
  await userEvent.keyboard(" ");
  await userEvent.keyboard("{ArrowRight}");
  expect(laneCards("parked")).toEqual([]);
  expect(laneCards("won")).toEqual(["d3"]);
});

test("moves are optimistic; a rejection snaps back, announces and stops pending", async () => {
  let reject!: (e?: unknown) => void;
  const gate = () =>
    new Promise<void>((_, rej) => {
      reject = rej;
    });
  await render(<Controlled gate={gate} />);
  surface("d1").focus();
  await userEvent.keyboard(" ");
  await userEvent.keyboard("{ArrowRight}");
  await userEvent.keyboard(" ");
  // Optimistic: the card is in its new lane while the server decides.
  expect(laneCards("won")).toContain("d1");
  const moved = document.querySelector<HTMLElement>(
    '[data-board-card-id="d1"]',
  )!;
  expect(moved.hasAttribute("data-drag-pending")).toBe(true);
  reject(new Error("stage gate"));
  await expect.poll(() => laneCards("lead")).toEqual(["d1", "d2"]);
  expect(announcement()).toContain("Move rejected");
});

test("Enter activates a button card", async () => {
  const onCardActivate = vi.fn();
  await render(<Controlled onCardActivate={onCardActivate} />);
  surface("d1").focus();
  await userEvent.keyboard("{Enter}");
  expect(onCardActivate).toHaveBeenCalledWith({ id: "d1", name: "Acme" });
});

test("getItemActions come first in the card menu, submenus included", async () => {
  const open = vi.fn();
  await render(
    <Controlled
      getItemActions={() => [
        { label: "Open", onSelect: open },
        {
          label: "Change stage",
          items: [{ label: "Qualified", onSelect: () => {} }],
        },
      ]}
    />,
  );
  await press(page.getByRole("button", { name: "Actions for Acme" }));
  const items = page.getByRole("menuitem").elements();
  expect(items[0]?.textContent).toBe("Open");
  expect(items[1]?.textContent).toContain("Change stage");
  await press(page.getByRole("menuitem", { name: "Open" }));
  expect(open).toHaveBeenCalled();
});

test("lanes collapse from their header button to a slim strip and expand again", async () => {
  const onCollapsedChange = vi.fn();
  const screen = await render(
    <Controlled onCollapsedChange={onCollapsedChange} />,
  );
  await press(screen.getByRole("button", { name: "Collapse Won lane" }));
  expect(onCollapsedChange).toHaveBeenLastCalledWith(["won"]);
  const strip = document.querySelector<HTMLElement>(
    '[data-slot="board-column-collapsed"]',
  )!;
  expect(strip.textContent).toContain("Won, 1 card. Expand column");
  strip.click();
  await expect
    .poll(() => document.querySelector('[data-column="won"]'))
    .not.toBeNull();
});

test("defaultCollapsed lanes expand read-only", async () => {
  const columns = makeColumns();
  columns[1] = { ...columns[1]!, defaultCollapsed: true };
  await render(<Controlled initial={columns} />);
  const strip = document.querySelector<HTMLElement>(
    '[data-slot="board-column-collapsed"]',
  )!;
  expect(strip.textContent).toContain("read-only");
  strip.click();
  await expect
    .poll(() =>
      document
        .querySelector('[data-column="won"]')
        ?.hasAttribute("data-read-only"),
    )
    .toBe(true);
});

test("onAdd shows + Add after each lane's last card with the lane's id", async () => {
  const onAdd = vi.fn();
  const screen = await render(<Controlled onAdd={onAdd} addLabel="Add deal" />);
  const buttons = screen.getByRole("button", { name: "Add deal" }).elements();
  expect(buttons.length).toBe(3);
  await press(screen.getByRole("button", { name: "Add deal" }).nth(1));
  expect(onAdd).toHaveBeenCalledWith("won");
});

test("a loading lane shows skeleton cards and is aria-busy", async () => {
  const columns = makeColumns();
  columns[1] = { ...columns[1]!, items: [], loading: true };
  await render(<Controlled initial={columns} />);
  const lane = document.querySelector('[data-column="won"]')!;
  expect(lane.getAttribute("aria-busy")).toBe("true");
  expect(
    lane.querySelector('[data-slot="board-column-skeleton"]'),
  ).not.toBeNull();
  expect(lane.querySelector('[data-slot="board-column-empty"]')).toBeNull();
});

test("emptyState replaces the dashed zone at rest", async () => {
  const columns = makeColumns();
  columns[1] = {
    ...columns[1]!,
    items: [],
    emptyState: <p data-testid="custom-empty">No wins yet</p>,
  };
  const screen = await render(<Controlled initial={columns} />);
  await expect.element(screen.getByTestId("custom-empty")).toBeInTheDocument();
});

test("a lane's loadMore auto-loads when its foot scrolls into view, with the button as fallback", async () => {
  const onLoadMore = vi.fn();
  const columns = makeColumns();
  columns[0] = { ...columns[0]!, loadMore: { hasMore: true, onLoadMore } };
  const screen = await render(<Controlled initial={columns} />);
  await expect.poll(() => onLoadMore.mock.calls.length).toBeGreaterThan(0);
  await expect
    .element(screen.getByRole("button", { name: "Load more" }))
    .toBeInTheDocument();
});

test("getItemHref makes each card activator a real link", async () => {
  await render(<Controlled getItemHref={(deal) => `/deals/${deal.id}`} />);
  const link = surface("d1");
  expect(link.tagName).toBe("A");
  expect(link.getAttribute("href")).toBe("/deals/d1");
  expect(link.getAttribute("draggable")).toBe("false");
});

test("a card's own controls stay clickable above its activator", async () => {
  const toggle = vi.fn();
  const onCardActivate = vi.fn();
  const screen = await render(
    <Controlled
      onCardActivate={onCardActivate}
      renderCard={(deal) => (
        <span>
          <button type="button" onClick={toggle}>
            Done {deal.name}
          </button>
        </span>
      )}
    />,
  );
  await press(screen.getByRole("button", { name: "Done Acme" }));
  expect(toggle).toHaveBeenCalled();
  expect(onCardActivate).not.toHaveBeenCalled();
});

test("readOnly removes every move but keeps a card's own actions", async () => {
  await render(
    <Controlled
      readOnly
      getItemActions={() => [{ label: "Open", onSelect: () => {} }]}
    />,
  );
  surface("d1").focus();
  await userEvent.keyboard(" ");
  expect(announcement()).not.toContain("Picked up");
  await userEvent.keyboard("m");
  await expect
    .element(page.getByRole("menuitem", { name: "Open" }))
    .toBeInTheDocument();
  expect(page.getByRole("menuitem", { name: /Move/ }).elements()).toHaveLength(
    0,
  );
});

test("cards turn the ambient truncation focus off (one tab stop per card)", async () => {
  let focusable: boolean | undefined;
  function Probe() {
    focusable = useTruncationFocusable();
    return null;
  }
  await render(<Controlled renderCard={() => <Probe />} />);
  expect(focusable).toBe(false);
});

test("a non-string title with no label warns in development", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const columns = makeColumns();
  columns[0] = { ...columns[0]!, title: <strong>Lead</strong> };
  await render(<Controlled initial={columns} />);
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('column "lead"'));
  warn.mockRestore();
});

test("no a11y violations — board at rest, and with a card picked up", async () => {
  const screen = await render(
    <Controlled
      getItemActions={() => [{ label: "Open", onSelect: () => {} }]}
    />,
  );
  await expectNoA11yViolations(screen.container);
  surface("d1").focus();
  await userEvent.keyboard(" ");
  await expectNoA11yViolations(screen.container);
});

test("canMoveItem locks one card: no pointer drag, no Space pick-up, still opens", async () => {
  const onCardActivate = vi.fn();
  const onMove = vi.fn();
  const screen = await render(
    <Controlled
      onMove={onMove}
      onCardActivate={onCardActivate}
      canMoveItem={(deal) => deal.id !== "d1"}
      getItemActions={() => [{ label: "Open", onSelect: () => {} }]}
    />,
  );
  const locked = document.querySelector<HTMLElement>(
    '[data-board-card-id="d1"]',
  )!;
  const free = document.querySelector<HTMLElement>(
    '[data-board-card-id="d2"]',
  )!;
  // Pointer: the default cursor and no drag source; the movable card keeps both.
  expect(locked.hasAttribute("data-move-locked")).toBe(true);
  expect(locked.className).not.toContain("cursor-grab");
  expect(free.className).toContain("cursor-grab");
  expect(free.hasAttribute("data-move-locked")).toBe(false);
  // A11y: no "draggable" role description on the locked card only.
  expect(surface("d1").getAttribute("aria-roledescription")).toBeNull();
  expect(surface("d2").getAttribute("aria-roledescription")).toBe(
    "Draggable card",
  );
  // Keyboard: Space does not lift it, and the arrows only browse.
  surface("d1").focus();
  await userEvent.keyboard(" ");
  expect(announcement()).not.toContain("Picked up");
  expect(surface("d1").getAttribute("aria-pressed")).toBe("false");
  await userEvent.keyboard("{ArrowDown}");
  expect(document.activeElement).toBe(surface("d2"));
  expect(onMove).not.toHaveBeenCalled();
  expect(laneCards("lead")).toEqual(["d1", "d2"]);
  // It still opens and keeps its menu.
  surface("d1").focus();
  await userEvent.keyboard("{Enter}");
  expect(onCardActivate).toHaveBeenCalledWith({ id: "d1", name: "Acme" });
  await userEvent.keyboard("m");
  await expect
    .element(page.getByRole("menuitem", { name: "Open" }))
    .toBeInTheDocument();
  await userEvent.keyboard("{Escape}");
  // The other cards still move around it.
  surface("d2").focus();
  await userEvent.keyboard(" {ArrowUp} ");
  expect(onMove).toHaveBeenCalledWith("d2", "lead", 0);
  await expectNoA11yViolations(screen.container);
});

test("revoking a lifted card cancels drop and pending moves serialize later lifts", async () => {
  const onMove = vi.fn();
  const screen = await render(
    <Controlled onMove={onMove} canMoveItem={() => true} />,
  );
  surface("d1").focus();
  await userEvent.keyboard(" {ArrowRight}");
  await screen.rerender(
    <Controlled onMove={onMove} canMoveItem={() => false} />,
  );
  await userEvent.keyboard(" ");
  expect(onMove).not.toHaveBeenCalled();
  expect(laneCards("lead")).toEqual(["d1", "d2"]);
  let reject!: (error: Error) => void;
  await screen.rerender(
    <Controlled
      onMove={onMove}
      gate={() =>
        new Promise((_, fail) => {
          reject = fail;
        })
      }
    />,
  );
  surface("d1").focus();
  await userEvent.keyboard(" {ArrowRight} ");
  expect(onMove).toHaveBeenCalledTimes(1);
  surface("d2").focus();
  await userEvent.keyboard(" {ArrowRight} ");
  expect(onMove).toHaveBeenCalledTimes(1);
  reject(new Error("refused"));
  await expect.poll(() => laneCards("lead")).toEqual(["d1", "d2"]);
});

test("pointer drop rechecks permission after its settling animation", async () => {
  const onMove = vi.fn();
  const screen = await render(
    <Controlled onMove={onMove} canMoveItem={() => true} />,
  );
  const destination = screen.container.querySelector(
    '[data-board-lane="won"]',
  )!;
  const hit = vi
    .spyOn(document, "elementFromPoint")
    .mockReturnValue(destination);
  const pointer = (type: string, target: EventTarget, x: number) =>
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        pointerId: 77,
        pointerType: "mouse",
        button: 0,
        clientX: x,
        clientY: 10,
      }),
    );
  try {
    pointer("pointerdown", surface("d1"), 10);
    pointer("pointermove", window, 40);
    await expect
      .poll(() =>
        screen.container.querySelector('[data-slot="board-drag-overlay"]'),
      )
      .not.toBeNull();
    await expect
      .poll(() =>
        destination.querySelector('[data-slot="board-card-placeholder"]'),
      )
      .not.toBeNull();
    pointer("pointerup", window, 40);
    await screen.rerender(
      <Controlled onMove={onMove} canMoveItem={() => false} />,
    );
    await new Promise((resolve) => setTimeout(resolve, 220));
    expect(onMove).not.toHaveBeenCalled();
    expect(laneCards("lead")).toEqual(["d1", "d2"]);
  } finally {
    hit.mockRestore();
  }
});
