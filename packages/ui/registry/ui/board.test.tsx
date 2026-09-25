import * as React from "react";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Board, type BoardColumn } from "./board";
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
  // Empty non-droppable lane names its lock reason, using an Empty block.
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

test("the drop-over highlight recolours the column Card's BORDER, the hairline Card really paints", async () => {
  // Regression, found rebuilding this file in Batch 7c: the highlight must target whichever
  // hairline upstream-backed `Card` actually draws, or it colours a zero-width edge and paints
  // nothing. Since BRD-1 went ours (23-09-2026) `Card` draws a real `border border-border`, so the
  // highlight is a border colour and there is no ring for a `ring-*` colour to land on.
  const screen = await render(
    <Board<Deal>
      aria-label="Deals"
      columns={makeColumns()}
      getItemId={(deal) => deal.id}
      renderCard={(deal) => <span>{deal.name}</span>}
      onMove={() => {}}
    />,
  );
  const column = screen.container.querySelector(
    '[data-slot="board-column"]',
  ) as HTMLElement;
  expect(column.className).toContain("data-drop-over:border-primary/50");
  expect(column.className).not.toContain("data-drop-over:ring-");
  // The border the override targets is really there (width AND colour), and no ring is.
  // (This lane loads no stylesheet, so the class contract is the honest proof here.)
  expect(column.classList.contains("border")).toBe(true);
  expect(column.classList.contains("border-border")).toBe(true);
  expect(column.className).not.toMatch(/(^|\s)ring-1(\s|$)|ring-foreground/);
});

// ---- DS-69: lanes, cards and announcements have names ----------------------

interface Task {
  id: string;
  title: string;
}

const TASKS: BoardColumn<Task>[] = [
  {
    id: "todo",
    title: "To do",
    items: [
      { id: "t1", title: "Write spec" },
      { id: "t2", title: "Review copy" },
    ],
  },
  {
    id: "in_progress",
    // A non-string title (a Badge, an icon) cannot name anything on its own.
    title: (
      <span>
        <span aria-hidden="true">●</span> In progress
      </span>
    ),
    label: "In progress",
    items: [{ id: "t3", title: "Ship tokens" }],
  },
  { id: "done", title: "Done", items: [] },
];

function LabelledBoard({
  columns = TASKS,
  dragDisabled,
  withLabels = true,
}: {
  columns?: BoardColumn<Task>[];
  dragDisabled?: boolean;
  withLabels?: boolean;
}) {
  const [state, setState] = React.useState(columns);
  return (
    <Board<Task>
      aria-label="Tasks"
      columns={state}
      dragDisabled={dragDisabled}
      getItemId={(task) => task.id}
      getItemLabel={withLabels ? (task) => task.title : undefined}
      renderCard={(task) => <span>{task.title}</span>}
      onMove={(move) =>
        setState((prev) => {
          const moved = prev
            .flatMap((c) => c.items)
            .find((t) => t.id === move.id)!;
          return prev.map((column) => {
            const without = column.items.filter((t) => t.id !== move.id);
            if (column.id !== move.to.container)
              return { ...column, items: without };
            const next = [...without];
            next.splice(move.to.index, 0, moved);
            return { ...column, items: next };
          });
        })
      }
    />
  );
}

test("menu moves use the lane label and the card control uses the card label", async () => {
  const screen = await render(<LabelledBoard />);
  await screen.getByRole("button", { name: "Move Write spec" }).click();
  await expect
    .element(screen.getByRole("menuitem", { name: "Move to In progress" }))
    .toBeInTheDocument();
  // A string title still names its lane with no label.
  await expect
    .element(screen.getByRole("menuitem", { name: "Move to Done" }))
    .toBeInTheDocument();
});

test("without getItemLabel the card control keeps its generic name", async () => {
  const screen = await render(<LabelledBoard withLabels={false} />);
  await expect
    .element(screen.getByRole("button", { name: "Move card" }).first())
    .toBeInTheDocument();
});

test("the lane is named by its label and card count, its list by the label", async () => {
  const screen = await render(<LabelledBoard />);
  await expect
    .element(screen.getByRole("region", { name: "To do, 2 cards" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("region", { name: "In progress, 1 card" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("list", { name: "In progress" }))
    .toBeInTheDocument();
});

test("announcements are built from lane and card labels", async () => {
  await render(<LabelledBoard />);
  const surface = document.querySelector(
    '[data-slot="board-card-surface"]',
  ) as HTMLElement;
  surface.focus();
  await userEvent.keyboard(" ");
  const live = () => document.querySelector('[role="status"]')!.textContent;
  await expect
    .poll(live)
    .toContain("Move mode on. Write spec, 1 of 2 in To do");
  await userEvent.keyboard("{ArrowRight}");
  await expect
    .poll(live)
    // The count is the hook's (use-drag-reorder); the names are the board's.
    .toContain("Moved Write spec to In progress, position 1");
  await userEvent.keyboard("{ArrowDown}");
  await expect.poll(live).toContain("Moved Write spec to position 2");
});

test("a non-string title with no label warns in development", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  await render(
    <LabelledBoard
      columns={[
        { id: "x", title: <span>Unnamed</span>, items: [] },
        { id: "y", title: "Named", items: [] },
      ]}
    />,
  );
  await expect
    .poll(() => warn.mock.calls.map((c) => String(c[0])))
    .toEqual([expect.stringContaining('column "x"')]);
  warn.mockRestore();
});

test("'Drag a card here' shows only when a pointer drag can start", async () => {
  await page.viewport(1280, 900);
  const screen = await render(<LabelledBoard />);
  const done = () =>
    document.querySelector('[data-column="done"]')!.textContent ?? "";
  expect(done()).toContain("Drag a card here");
  await screen.rerender(<LabelledBoard dragDisabled />);
  expect(done()).toContain("No cards");
  expect(done()).not.toContain("Drag a card here");
});

test("below 768px an empty lane does not promise a drag", async () => {
  await page.viewport(390, 844);
  try {
    await render(<LabelledBoard />);
    await expect
      .poll(() => document.querySelector('[data-column="done"]')!.textContent)
      .not.toContain("Drag a card here");
  } finally {
    await page.viewport(1280, 900);
  }
});

test("cards turn the ambient truncation focus off (one tab stop per card)", async () => {
  function Probe() {
    return <span data-probe={String(useTruncationFocusable())} />;
  }
  await render(
    <Board<Task>
      aria-label="Tasks"
      columns={TASKS}
      getItemId={(task) => task.id}
      renderCard={() => <Probe />}
      onMove={() => {}}
    />,
  );
  const probes = Array.from(document.querySelectorAll("[data-probe]"));
  expect(probes.length).toBe(3);
  expect(probes.every((p) => p.getAttribute("data-probe") === "false")).toBe(
    true,
  );
});

test("no a11y violations — labelled lanes and cards, menu open", async () => {
  const screen = await render(<LabelledBoard />);
  await expectNoA11yViolations(screen.container);
  await screen.getByRole("button", { name: "Move Write spec" }).click();
  await expect
    .element(screen.getByRole("menuitem", { name: "Move to In progress" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body);
});

// ---- DS-51: paged lanes, lane states, card links ---------------------------

const TWO_TASKS: Task[] = [
  { id: "p1", title: "Write spec" },
  { id: "p2", title: "Review copy" },
];

function laneBoard(
  columns: BoardColumn<Task>[],
  extra: Partial<React.ComponentProps<typeof Board<Task>>> = {},
) {
  return (
    <Board<Task>
      aria-label="Tasks"
      columns={columns}
      getItemId={(t) => t.id}
      getItemLabel={(t) => t.title}
      renderCard={(t) => t.title}
      onMove={() => {}}
      {...extra}
    />
  );
}

test("lane count shows the total, not the loaded rows", async () => {
  const screen = await render(
    laneBoard([{ id: "open", title: "Open", items: TWO_TASKS, count: 14 }], {
      countLabel: (n) => `${n} ${n === 1 ? "task" : "tasks"}`,
    }),
  );
  await expect
    .element(screen.getByRole("region", { name: "Open, 14 tasks" }))
    .toBeInTheDocument();
  // The visible count is muted tabular text, not a Badge.
  const count = document.querySelector(
    '[data-slot="board-column-count"]',
  ) as HTMLElement;
  expect(count.textContent).toBe("14");
  expect(count.className).toContain("tabular-nums");
  expect(count.className).toContain("text-muted-foreground");
  expect(
    document.querySelector(
      '[data-slot="board-column-title"] [data-slot="badge"]',
    ),
  ).toBeNull();
  // The list is named by the lane alone — its item count is the list's own.
  await expect
    .element(screen.getByRole("list", { name: "Open" }))
    .toBeInTheDocument();
});

test("without count or countLabel the lane is named by its loaded cards", async () => {
  const screen = await render(
    laneBoard([{ id: "open", title: "Open", items: TWO_TASKS }]),
  );
  await expect
    .element(screen.getByRole("region", { name: "Open, 2 cards" }))
    .toBeInTheDocument();
});

test("a loading lane shows skeleton cards and is aria-busy", async () => {
  const screen = await render(
    laneBoard([
      { id: "open", title: "Open", items: [], loading: true },
      { id: "done", title: "Done", items: TWO_TASKS, loading: true },
    ]),
  );
  const open = screen.getByRole("region", { name: "Open, 0 cards" });
  await expect.element(open).toHaveAttribute("aria-busy", "true");
  const openEl = open.element();
  expect(
    openEl.querySelector('[data-slot="board-column-skeleton"]'),
  ).not.toBeNull();
  // Loading replaces the empty state rather than promising "No cards".
  expect(openEl.querySelector('[data-slot="board-column-empty"]')).toBeNull();
  // A lane with cards keeps them while more load.
  const done = screen.getByRole("region", { name: "Done, 2 cards" }).element();
  expect(done.querySelectorAll('[data-slot="board-card"]').length).toBe(2);
  expect(
    done.querySelector('[data-slot="board-column-skeleton"]'),
  ).not.toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("emptyState replaces the default empty lane", async () => {
  const screen = await render(
    laneBoard([
      {
        id: "open",
        title: "Open",
        items: [],
        emptyState: <p>No open tasks. Create one from the toolbar.</p>,
      },
    ]),
  );
  const lane = screen.getByRole("region", { name: "Open, 0 cards" }).element();
  expect(lane.textContent).toContain(
    "No open tasks. Create one from the toolbar.",
  );
  expect(lane.textContent).not.toContain("No cards");
  await expectNoA11yViolations(screen.container);
});

test("defaultCollapsed renders the strip, named by the lane and its count", async () => {
  const screen = await render(
    laneBoard([
      { id: "open", title: "Open", items: TWO_TASKS },
      {
        id: "done",
        title: "Done",
        items: TWO_TASKS,
        count: 40,
        defaultCollapsed: true,
      },
    ]),
  );
  const strip = screen.getByRole("button", {
    name: "Done, 40 cards. Expand column, read-only",
  });
  await expect.element(strip).toBeInTheDocument();
  expect(document.querySelector('[data-column="done"]')).toBeNull();
  await expectNoA11yViolations(screen.container);
  await strip.click();
  expect(
    document
      .querySelector('[data-column="done"]')!
      .hasAttribute("data-read-only"),
  ).toBe(true);
});

test("a read-only lane keeps a card's own actions and drops only the Move items (DS-51)", async () => {
  const screen = await render(
    laneBoard(
      [{ id: "done", title: "Done", items: TWO_TASKS, defaultCollapsed: true }],
      {
        getItemActions: (t) => [
          { label: `Edit ${t.title}`, onSelect: () => {} },
        ],
      },
    ),
  );
  await screen.getByRole("button", { name: /^Done/ }).click();
  await screen.getByRole("button", { name: "Actions for Write spec" }).click();
  await expect
    .element(screen.getByRole("menuitem", { name: "Edit Write spec" }))
    .toBeInTheDocument();
  expect(
    [...document.querySelectorAll('[role="menuitem"]')].map(
      (n) => n.textContent,
    ),
  ).toEqual(["Edit Write spec"]);
});

test("getItemHref makes each card a real link, one roving tab stop", async () => {
  const onCardActivate = vi.fn();
  const screen = await render(
    laneBoard([{ id: "open", title: "Open", items: TWO_TASKS }], {
      getItemHref: (t) => `/tasks/${t.id}`,
      onCardActivate,
    }),
  );
  const link = screen.getByRole("link", { name: "Write spec" });
  await expect.element(link).toHaveAttribute("href", "/tasks/p1");
  const links = Array.from(
    document.querySelectorAll('[data-slot="board-card-surface"]'),
  ) as HTMLElement[];
  expect(links.map((l) => l.tagName)).toEqual(["A", "A"]);
  expect(links.map((l) => l.tabIndex)).toEqual([0, -1]);
  // No nested interactive: the menu control is the link's sibling.
  expect(links[0]!.querySelector("button, a, [role=button]")).toBeNull();
  await expectNoA11yViolations(screen.container);
  // A card with no href stays a button.
  await screen.rerender(
    laneBoard([{ id: "open", title: "Open", items: TWO_TASKS }], {
      getItemHref: (t) => (t.id === "p1" ? "/tasks/p1" : undefined),
    }),
  );
  expect(
    Array.from(
      document.querySelectorAll('[data-slot="board-card-surface"]'),
    ).map((el) => el.getAttribute("role") ?? el.tagName),
  ).toEqual(["A", "button"]);
});

test("a card link opens with modifiers: the board never prevents the browser's own handling", async () => {
  const onCardActivate = vi.fn();
  await render(
    laneBoard([{ id: "open", title: "Open", items: TWO_TASKS }], {
      getItemHref: (t) => `/tasks/${t.id}`,
      onCardActivate,
    }),
  );
  const link = document.querySelector(
    '[data-slot="board-card-surface"]',
  ) as HTMLAnchorElement;
  const seen: boolean[] = [];
  // Record whether the board prevented the default, then stop the real
  // navigation so the test page stays put.
  const guard = (event: Event) => {
    seen.push(event.defaultPrevented);
    event.preventDefault();
  };
  window.addEventListener("click", guard);
  try {
    for (const init of [
      { metaKey: true },
      { ctrlKey: true },
      { shiftKey: true },
      { button: 1 },
      {},
    ])
      link.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, ...init }),
      );
  } finally {
    window.removeEventListener("click", guard);
  }
  expect(seen).toEqual([false, false, false, false, false]);
  // The link IS the activation — onCardActivate is for button cards.
  expect(onCardActivate).not.toHaveBeenCalled();
  // Enter follows the link natively rather than lifting the card.
  link.focus();
  const enter = new KeyboardEvent("keydown", {
    key: "Enter",
    bubbles: true,
    cancelable: true,
  });
  link.dispatchEvent(enter);
  expect(enter.defaultPrevented).toBe(false);
  expect(document.querySelector('[role="status"]')!.textContent).not.toContain(
    "Move mode on",
  );
});

test("Space still lifts a link card into move mode", async () => {
  await render(
    laneBoard(
      [
        { id: "open", title: "Open", items: TWO_TASKS },
        { id: "done", title: "Done", items: [] },
      ],
      { getItemHref: (t) => `/tasks/${t.id}` },
    ),
  );
  (
    document.querySelector('[data-slot="board-card-surface"]') as HTMLElement
  ).focus();
  await userEvent.keyboard(" ");
  await expect
    .poll(() => document.querySelector('[role="status"]')!.textContent)
    .toContain("Move mode on. Write spec, 1 of 2 in Open");
  await userEvent.keyboard("{Escape}");
});

test("itemLinkRender swaps the link element and keeps href and the board's props", async () => {
  function RouterLink(props: React.ComponentPropsWithRef<"a">) {
    return <a data-router="" {...props} />;
  }
  const screen = await render(
    laneBoard([{ id: "open", title: "Open", items: TWO_TASKS }], {
      getItemHref: (t) => `/tasks/${t.id}`,
      itemLinkRender: <RouterLink />,
    }),
  );
  const link = screen.getByRole("link", { name: "Write spec" });
  await expect.element(link).toHaveAttribute("href", "/tasks/p1");
  await expect.element(link).toHaveAttribute("data-router", "");
  await expect.element(link).toHaveAttribute("data-slot", "board-card-surface");
  await expect.element(link).toHaveAttribute("tabindex", "0");
});

test("the card's href wins over one on the itemLinkRender template, as on DataList's row link", async () => {
  function RouterLink(props: React.ComponentPropsWithRef<"a">) {
    return <a {...props} />;
  }
  const screen = await render(
    laneBoard([{ id: "open", title: "Open", items: TWO_TASKS }], {
      getItemHref: (t) => `/tasks/${t.id}`,
      itemLinkRender: <RouterLink href="" />,
    }),
  );
  await expect
    .element(screen.getByRole("link", { name: "Write spec" }))
    .toHaveAttribute("href", "/tasks/p1");
});

test("a card with a menu reserves end padding so a long title wraps before the ⋯ trigger", async () => {
  await render(
    laneBoard([{ id: "open", title: "Open", items: TWO_TASKS }], {
      getItemActions: () => [{ label: "Delete", onSelect: () => {} }],
    }),
  );
  const surface = document.querySelector<HTMLElement>(
    '[data-slot="board-card-surface"]',
  )!;
  expect(surface.classList.contains("pe-8")).toBe(true);
});

test("a lane's loadMore renders the shared LoadMore footer (DS-30)", async () => {
  const onLoadMore = vi.fn();
  const columns = makeColumns();
  columns[0] = { ...columns[0]!, loadMore: { hasMore: true, onLoadMore } };
  const screen = await render(
    <Board
      columns={columns}
      getItemId={(d) => d.id}
      getItemLabel={(d) => d.name}
      renderCard={(d) => d.name}
      onMove={() => {}}
    />,
  );
  const lane = screen.container.querySelector(
    '[data-slot="board-column"][data-column="lead"]',
  )!;
  expect(lane.querySelector('[data-slot="load-more"]')).not.toBeNull();
  await screen.getByRole("button", { name: "Load more" }).click();
  expect(onLoadMore).toHaveBeenCalledOnce();
  await expectNoA11yViolations(screen.container);
});

test("getItemActions render first in the card menu, then the Move items (DS-32)", async () => {
  const onOpen = vi.fn();
  const screen = await render(
    <Board
      columns={makeColumns()}
      getItemId={(d) => d.id}
      getItemLabel={(d) => d.name}
      renderCard={(d) => d.name}
      onMove={() => {}}
      getItemActions={(d) => [{ label: `Open ${d.name}`, onSelect: onOpen }]}
    />,
  );
  await userEvent.keyboard("{Tab}");
  const trigger = screen.getByRole("button", { name: "Actions for Acme" });
  await trigger.click();
  await expect
    .poll(() => document.querySelectorAll('[role="menuitem"]').length)
    .toBeGreaterThan(1);
  const items = [...document.querySelectorAll('[role="menuitem"]')].map((n) =>
    n.textContent?.trim(),
  );
  expect(items[0]).toBe("Open Acme");
  expect(items).toContain("Move down");
  await screen.getByRole("menuitem", { name: "Open Acme" }).click();
  expect(onOpen).toHaveBeenCalledOnce();
});
