import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { MemoryGroup } from "./memory-group";

const DATA = {
  notebook: "Personal memory",
  items: [
    {
      id: "m1",
      text: "Prefers Inter for slides",
      undoable: true,
      editable: true,
    },
    {
      id: "m2",
      text: "Quotes go out on Fridays",
      undoable: false,
      editable: false,
    },
  ],
};

test("one quiet fold, no card: the summary counts and names the notebook; Undo and Edit act on their note", async () => {
  const onUndo = vi.fn();
  const onEdit = vi.fn();
  const screen = await render(
    <MemoryGroup data={DATA} onUndo={onUndo} onEdit={onEdit} />,
  );
  await expect
    .element(screen.getByText("Remembered 2 things · Personal memory"))
    .toBeInTheDocument();
  expect(screen.container.querySelector('[data-slot="chat-card"]')).toBeNull();
  expect(screen.container.innerHTML).not.toMatch(/text-success|bg-success/);
  await userEvent.click(
    screen.getByRole("button", { name: "Undo: Prefers Inter for slides" }),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Edit: Prefers Inter for slides" }),
  );
  expect(onUndo).toHaveBeenCalledWith("m1");
  expect(onEdit).toHaveBeenCalledWith("m1");
  expect(
    screen.container.querySelectorAll("li")[1]!.querySelector("button"),
  ).toBeNull();
});

test("nothing remembered renders nothing", async () => {
  const screen = await render(
    <MemoryGroup
      data={{ notebook: "x", items: [] }}
      onUndo={() => {}}
      onEdit={() => {}}
    />,
  );
  expect(
    screen.container.querySelector('[data-slot="memory-group"]'),
  ).toBeNull();
});

test("no a11y violations — open and closed", async () => {
  const screen = await render(
    <div>
      <MemoryGroup data={DATA} onUndo={() => {}} onEdit={() => {}} />
      <MemoryGroup
        data={DATA}
        defaultOpen={false}
        onUndo={() => {}}
        onEdit={() => {}}
      />
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});
