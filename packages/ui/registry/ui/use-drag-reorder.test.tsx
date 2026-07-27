import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  useDragReorder,
  type DragReorderMove,
  type UseDragReorderOptions,
} from "./use-drag-reorder";

function Harness({
  lists,
  onReorder,
  ...options
}: Partial<UseDragReorderOptions> & {
  lists: Record<string, readonly string[]>;
  onReorder: UseDragReorderOptions["onReorder"];
}) {
  const reorder = useDragReorder({ lists, onReorder, ...options });
  return (
    <div>
      {Object.entries(lists).map(([container, ids]) => (
        <ul key={container} {...reorder.getContainerProps(container)}>
          {ids.map((id) => (
            <li key={id} {...reorder.getItemProps(container, id)}>
              {id}
              <button
                type="button"
                aria-label={`Move ${id}`}
                {...reorder.getHandleProps(container, id)}
              >
                ⋮⋮
              </button>
            </li>
          ))}
        </ul>
      ))}
      <span {...reorder.getLiveRegionProps()} />
      <output data-testid="active">{reorder.activeId ?? "none"}</output>
      <output data-testid="pending">{reorder.pending?.id ?? "none"}</output>
    </div>
  );
}

function ControlledList({
  onMove,
  onReorder,
}: {
  onMove?: (m: DragReorderMove) => void;
  onReorder?: UseDragReorderOptions["onReorder"];
}) {
  const [ids, setIds] = React.useState(["a", "b", "c"]);
  return (
    <Harness
      lists={{ list: ids }}
      onReorder={(move) => {
        onMove?.(move);
        if (onReorder) return onReorder(move);
        setIds((prev) => {
          const next = prev.filter((x) => x !== move.id);
          next.splice(move.to.index, 0, move.id);
          return next;
        });
      }}
    />
  );
}

function liveText(): string {
  return (
    document.querySelector('[role="status"][aria-live="polite"]')
      ?.textContent ?? ""
  );
}

test("items register as native draggables with the data contract", async () => {
  await render(<Harness lists={{ list: ["a", "b"] }} onReorder={() => {}} />);
  const item = document.querySelector('[data-drag-item="a"]') as HTMLElement;
  expect(item).not.toBeNull();
  // Pragmatic wires the element: the native draggable attribute proves it.
  expect(item.getAttribute("draggable")).toBe("true");
  const container = document.querySelector(
    '[data-drop-container="list"]',
  ) as HTMLElement;
  expect(container).not.toBeNull();
});

test("Space enters move mode (announced), arrows commit one step at a time, Escape ends", async () => {
  const onMove = vi.fn();
  const screen = await render(<ControlledList onMove={onMove} />);
  const handle = screen
    .getByRole("button", { name: "Move b" })
    .element() as HTMLElement;
  handle.focus();
  await userEvent.keyboard(" ");
  expect(liveText()).toContain("Move mode on");
  expect(liveText()).toContain("Item 2 of 3");
  await userEvent.keyboard("{ArrowUp}");
  expect(onMove).toHaveBeenLastCalledWith(
    expect.objectContaining({
      id: "b",
      from: { container: "list", index: 1 },
      to: { container: "list", index: 0 },
      input: "keyboard",
    }),
  );
  expect(liveText()).toContain("Moved to position 1 of 3");
  await userEvent.keyboard("{Escape}");
  expect(liveText()).toContain("Move mode off");
  // Out of move mode, arrows do nothing.
  await userEvent.keyboard("{ArrowDown}");
  expect(onMove).toHaveBeenCalledTimes(1);
});

test("arrows clamp at the ends — no wrap, no useless commit", async () => {
  const onMove = vi.fn();
  const screen = await render(<ControlledList onMove={onMove} />);
  const handle = screen
    .getByRole("button", { name: "Move a" })
    .element() as HTMLElement;
  handle.focus();
  await userEvent.keyboard(" ");
  await userEvent.keyboard("{ArrowUp}");
  expect(onMove).not.toHaveBeenCalled();
});

test("cross-container arrows move between lists, clamping the index", async () => {
  const onMove = vi.fn();
  function Board() {
    const [lists, setLists] = React.useState<Record<string, string[]>>({
      todo: ["a", "b", "c"],
      done: ["x"],
    });
    return (
      <Harness
        lists={lists}
        onReorder={(move) => {
          onMove(move);
          setLists((prev) => {
            const next = Object.fromEntries(
              Object.entries(prev).map(([k, v]) => [
                k,
                v.filter((x) => x !== move.id),
              ]),
            );
            next[move.to.container]!.splice(move.to.index, 0, move.id);
            return next;
          });
        }}
      />
    );
  }
  const screen = await render(<Board />);
  const handle = screen
    .getByRole("button", { name: "Move c" })
    .element() as HTMLElement;
  handle.focus();
  await userEvent.keyboard(" ");
  await userEvent.keyboard("{ArrowRight}");
  expect(onMove).toHaveBeenLastCalledWith(
    expect.objectContaining({
      id: "c",
      from: { container: "todo", index: 2 },
      // index clamps to the target list's length (1 item).
      to: { container: "done", index: 1 },
    }),
  );
  expect(liveText()).toContain("Moved to done");
});

test("a promise-returning onReorder is pending until it settles; rejection announces and clears", async () => {
  let reject!: (e?: unknown) => void;
  const gate = new Promise<void>((_, rej) => {
    reject = rej;
  });
  const screen = await render(<ControlledList onReorder={() => gate} />);
  const handle = screen
    .getByRole("button", { name: "Move a" })
    .element() as HTMLElement;
  handle.focus();
  await userEvent.keyboard(" ");
  await userEvent.keyboard("{ArrowDown}");
  await expect.element(screen.getByTestId("pending")).toHaveTextContent("a");
  const item = document.querySelector('[data-drag-item="a"]') as HTMLElement;
  expect(item.hasAttribute("data-drag-pending")).toBe(true);
  reject(new Error("server said no"));
  await expect.element(screen.getByTestId("pending")).toHaveTextContent("none");
  expect(liveText()).toContain("Move rejected — position restored");
});

test("requestMove is the menu-equivalent entry point", async () => {
  const onMove = vi.fn();
  function Menu() {
    const [ids, setIds] = React.useState(["a", "b"]);
    const reorder = useDragReorder({
      lists: { list: ids },
      onReorder: (move) => {
        onMove(move);
        setIds((prev) => {
          const next = prev.filter((x) => x !== move.id);
          next.splice(move.to.index, 0, move.id);
          return next;
        });
      },
    });
    return (
      <div>
        <button
          type="button"
          onClick={() =>
            reorder.requestMove({
              id: "b",
              from: { container: "list", index: 1 },
              to: { container: "list", index: 0 },
            })
          }
        >
          Move up
        </button>
        <span {...reorder.getLiveRegionProps()} />
      </div>
    );
  }
  const screen = await render(<Menu />);
  await screen.getByRole("button", { name: "Move up" }).click();
  expect(onMove).toHaveBeenCalledWith(
    expect.objectContaining({ id: "b", input: "keyboard" }),
  );
  expect(liveText()).toContain("Moved to position 1 of 2");
});

test("disabled (static or per-item) blocks move mode", async () => {
  const onMove = vi.fn();
  const screen = await render(
    <Harness
      lists={{ list: ["a", "b"] }}
      onReorder={onMove}
      disabled={(id) => id === "a"}
    />,
  );
  const handleA = screen
    .getByRole("button", { name: "Move a" })
    .element() as HTMLElement;
  handleA.focus();
  await userEvent.keyboard(" ");
  expect(liveText()).toBe("");
  const handleB = screen
    .getByRole("button", { name: "Move b" })
    .element() as HTMLElement;
  handleB.focus();
  await userEvent.keyboard(" ");
  expect(liveText()).toContain("Move mode on");
});

test("blur ends move mode", async () => {
  const screen = await render(<ControlledList />);
  const handle = screen
    .getByRole("button", { name: "Move a" })
    .element() as HTMLElement;
  handle.focus();
  await userEvent.keyboard(" ");
  expect(liveText()).toContain("Move mode on");
  handle.blur();
  await expect.poll(() => liveText()).toContain("Move mode off");
});

test("announcement builders are overridable", async () => {
  const screen = await render(
    <Harness
      lists={{ list: ["a", "b"] }}
      onReorder={() => {}}
      announcements={{ lifted: ({ id }) => `Grabbed ${id}` }}
    />,
  );
  const handle = screen
    .getByRole("button", { name: "Move a" })
    .element() as HTMLElement;
  handle.focus();
  await userEvent.keyboard(" ");
  expect(liveText()).toBe("Grabbed a");
});

test("no a11y violations — list with handles and live region", async () => {
  const screen = await render(<ControlledList />);
  await expectNoA11yViolations(screen.container);
});
