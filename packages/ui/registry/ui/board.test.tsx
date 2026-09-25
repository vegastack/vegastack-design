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

test("Enter activates a button card; the menu's Move to… commits with lock reasons", async () => {
  const onCardActivate = vi.fn();
  const onMove = vi.fn();
  await render(<Controlled onMove={onMove} onCardActivate={onCardActivate} />);
  surface("d1").focus();
  await userEvent.keyboard("{Enter}");
  expect(onCardActivate).toHaveBeenCalledWith({ id: "d1", name: "Acme" });
  await userEvent.keyboard("m");
  const menu = page.getByRole("menu");
  await expect.element(menu).toBeInTheDocument();
  const parked = page.getByRole("menuitem", { name: /Move to Parked/ });
  await expect.element(parked).toHaveAttribute("aria-disabled", "true");
  expect(parked.element().textContent).toContain(
    "Closed deals only move by automation",
  );
  await press(page.getByRole("menuitem", { name: "Move to Won" }));
  expect(onMove).toHaveBeenCalledWith("d1", "won", 1);
});

test("the card menu offers within-lane ordering", async () => {
  const onMove = vi.fn();
  await render(<Controlled onMove={onMove} />);
  surface("d2").focus();
  await userEvent.keyboard("m");
  await expect
    .element(page.getByRole("menuitem", { name: "Move down" }))
    .toHaveAttribute("aria-disabled", "true");
  await press(page.getByRole("menuitem", { name: "Move to top" }));
  expect(onMove).toHaveBeenCalledWith("d2", "lead", 0);
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

test("lanes collapse from their header menu to a slim strip and expand again", async () => {
  const onCollapsedChange = vi.fn();
  const screen = await render(
    <Controlled onCollapsedChange={onCollapsedChange} />,
  );
  await press(screen.getByRole("button", { name: "Won lane actions" }));
  await press(page.getByRole("menuitem", { name: "Collapse lane" }));
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

test("onAdd shows + Add at each lane's foot with the lane's id", async () => {
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
