import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/geometry.css";
import {
  MilestoneGlyph,
  MilestoneList,
  type MilestoneListItem,
  type MilestoneMove,
} from "./milestone-list";

const ITEMS: MilestoneListItem[] = [
  { id: "a", name: "Discovery", state: "done", date: "2026-03-02" },
  {
    id: "b",
    name: "Beta",
    state: "late",
    date: "2026-04-10",
    weight: 3,
    tasks: { done: 3, total: 5 },
    warning: "After the target date",
  },
  { id: "c", name: "Launch", state: "open" },
];

test("a row shows its diamond, name, weight chip only when not 1, tasks, warning and date", async () => {
  const screen = await render(
    <MilestoneList items={ITEMS} formatDate={(iso) => iso.slice(5)} />,
  );
  const rows = [
    ...screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="milestone-list-row"]',
    ),
  ];
  expect(rows.map((row) => row.dataset.state)).toEqual([
    "done",
    "late",
    "open",
  ]);
  expect(
    screen.container.querySelectorAll('[data-slot="milestone-list-weight"]'),
  ).toHaveLength(1);
  await expect.element(screen.getByText("Weight 3")).toBeInTheDocument();
  await expect
    .element(screen.getByText("3 of 5 tasks done"))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "After the target date" }))
    .toBeInTheDocument();
  await expect.element(screen.getByText("03-02")).toBeInTheDocument();
  expect(
    rows[2]!.querySelector('[data-slot="milestone-list-date"]'),
  ).toBeNull();
  await expect
    .element(screen.getByRole("img", { name: "Late" }))
    .toBeInTheDocument();
  // Read-only: no grips, no add row, no menus.
  expect(
    screen.container.querySelector("[data-slot=milestone-list-add]"),
  ).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("the diamond: filled primary when done, hollow muted while open, hollow warning when late", async () => {
  const screen = await render(
    <>
      <MilestoneGlyph state="done" />
      <MilestoneGlyph state="open" />
      <MilestoneGlyph state="late" size={14} />
    </>,
  );
  const shapes = [
    ...screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="milestone-glyph"] > span',
    ),
  ].map((shape) => shape.className);
  expect(shapes[0]).toContain("bg-primary");
  expect(shapes[1]).toContain("border-muted-foreground");
  expect(shapes[1]).not.toContain("bg-");
  expect(shapes[2]).toContain("border-warning-text");
});

function Editable({
  onMove,
  onAdd,
  onDoneChange,
}: {
  onMove: (id: string, to: MilestoneMove) => void;
  onAdd?: () => void;
  onDoneChange?: (id: string, done: boolean) => void;
}) {
  const [items, setItems] = React.useState(ITEMS);
  return (
    <MilestoneList
      items={items}
      onAdd={onAdd}
      onDoneChange={onDoneChange}
      getActions={(item) => [
        { label: "Rename", onSelect: () => {} },
        { label: `Remove ${item.name}`, destructive: true },
      ]}
      onMove={(id, to) => {
        onMove(id, to);
        setItems((prev) => {
          const moved = prev.find((item) => item.id === id)!;
          const rest = prev.filter((item) => item.id !== id);
          const at = to.before
            ? rest.findIndex((item) => item.id === to.before)
            : rest.length;
          rest.splice(at, 0, moved);
          return rest;
        });
      }}
    />
  );
}

test("the keyboard reorders from the grip and onMove names the new neighbours", async () => {
  const onMove = vi.fn();
  const screen = await render(<Editable onMove={onMove} />);
  const grip = screen.getByRole("button", { name: "Reorder Discovery" });
  (grip.element() as HTMLElement).focus();
  await userEvent.keyboard(" ");
  await userEvent.keyboard("{ArrowDown}");
  await userEvent.keyboard("{Escape}");
  expect(onMove).toHaveBeenCalledWith("a", { before: "c", after: "b" });
  await expectNoA11yViolations(screen.container);
});

test("editor tools: the done toggle, the ⋯ menu and the add row", async () => {
  const onAdd = vi.fn();
  const onDoneChange = vi.fn();
  const screen = await render(
    <Editable onMove={() => {}} onAdd={onAdd} onDoneChange={onDoneChange} />,
  );
  await screen.getByRole("button", { name: "Mark Launch as done" }).click();
  expect(onDoneChange).toHaveBeenCalledWith("c", true);
  await screen
    .getByRole("button", { name: "Mark Discovery as not done" })
    .click();
  expect(onDoneChange).toHaveBeenCalledWith("a", false);
  await screen.getByRole("button", { name: "Add milestone" }).click();
  expect(onAdd).toHaveBeenCalledOnce();
  await screen.getByRole("button", { name: "Actions for Beta" }).click();
  await expect
    .element(screen.getByRole("menuitem", { name: "Rename" }))
    .toBeVisible();
});

test("empty shows the consumer's words above the add row", async () => {
  const screen = await render(
    <MilestoneList
      items={[]}
      onAdd={() => {}}
      emptyState={<p>Add milestones to mark the big steps</p>}
    />,
  );
  await expect
    .element(screen.getByText("Add milestones to mark the big steps"))
    .toBeVisible();
  await expect
    .element(screen.getByRole("button", { name: "Add milestone" }))
    .toBeVisible();
  await expectNoA11yViolations(screen.container);
});
