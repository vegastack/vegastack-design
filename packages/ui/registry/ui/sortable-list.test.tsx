import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { SortableList, type SortableListItem } from "./sortable-list";

function Controlled({
  onMove,
  gate,
  disabled,
  initial = ["Alpha", "Beta", "Gamma"],
}: {
  onMove?: (id: string, to: number) => void;
  gate?: () => Promise<void>;
  disabled?: boolean;
  initial?: string[];
}) {
  const [items, setItems] = React.useState<SortableListItem[]>(
    initial.map((label) => ({ id: label.toLowerCase(), label })),
  );
  return (
    <SortableList
      aria-label="Stages"
      items={items}
      disabled={disabled}
      renderItem={(item) => <span>{item.label}</span>}
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

test("renders a labelled list of items with handles and menus", async () => {
  const screen = await render(<Controlled />);
  const list = screen.getByRole("list", { name: "Stages" });
  await expect.element(list).toBeInTheDocument();
  expect(rowLabels()).toEqual(["Alpha", "Beta", "Gamma"]);
  await expect
    .element(screen.getByRole("button", { name: "Reorder Alpha" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Move Alpha" }))
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
  await screen.getByRole("button", { name: "Move Gamma" }).click();
  await screen.getByRole("menuitem", { name: "Move to top" }).click();
  await expect.poll(() => rowLabels()).toEqual(["Gamma", "Alpha", "Beta"]);
  await screen.getByRole("button", { name: "Move Gamma" }).click();
  await screen.getByRole("menuitem", { name: "Move down" }).click();
  await expect.poll(() => rowLabels()).toEqual(["Alpha", "Gamma", "Beta"]);
  await screen.getByRole("button", { name: "Move Gamma" }).click();
  await screen.getByRole("menuitem", { name: "Move to bottom" }).click();
  await expect.poll(() => rowLabels()).toEqual(["Alpha", "Beta", "Gamma"]);
});

test("edge menu items disable (no wrap): Move up on the first row", async () => {
  const screen = await render(<Controlled />);
  await screen.getByRole("button", { name: "Move Alpha" }).click();
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
  expect(document.querySelector('[aria-label^="Move "]')).toBeNull();
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
