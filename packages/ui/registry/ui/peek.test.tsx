import "../../test/geometry.css";
import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Peek,
  PeekActions,
  PeekBody,
  PeekClose,
  PeekHeader,
  PeekNav,
  PeekOpen,
  PeekPath,
  PeekTitle,
  type PeekProps,
} from "./peek";

const bySlot = (slot: string) =>
  document.querySelector<HTMLElement>(`[data-slot='${slot}']`);

/** A list of rows in a 1000px page area, with a peek over its right side. */
function ListWithPeek({
  initialOpen = false,
  layout = "side",
  onWidth,
  ...props
}: Partial<PeekProps> & {
  initialOpen?: boolean;
  onWidth?: (w: number) => void;
}) {
  const [open, setOpen] = React.useState(initialOpen);
  const [index, setIndex] = React.useState(0);
  const [width, setWidth] = React.useState(560);
  return (
    <div
      data-testid="area"
      style={{ position: "relative", width: 1000, height: 600 }}
    >
      <div data-testid="list" style={{ height: 600, overflow: "auto" }}>
        {Array.from({ length: 60 }, (_, i) => (
          <button
            key={i}
            type="button"
            style={{ display: "block", height: 40 }}
            onClick={() => {
              setIndex(i);
              setOpen(true);
            }}
          >
            Row {i}
          </button>
        ))}
        <input aria-label="Filter" />
      </div>
      <Peek
        open={open}
        onOpenChange={setOpen}
        width={width}
        onWidthChange={(w) => {
          setWidth(w);
          onWidth?.(w);
        }}
        layout={layout}
        {...props}
      >
        <PeekHeader>
          <PeekNav
            onPrevious={index > 0 ? () => setIndex(index - 1) : undefined}
            onNext={() => setIndex(index + 1)}
          />
          <PeekPath>Tasks › Website › #{index}</PeekPath>
          <PeekActions>
            <PeekOpen href={`#task-${index}`} />
            <PeekClose />
          </PeekActions>
        </PeekHeader>
        <PeekBody>
          <PeekTitle>Task {index}</PeekTitle>
          <p>Body of task {index}</p>
          <input aria-label="Reply" />
        </PeekBody>
      </Peek>
    </div>
  );
}

test("a peek is a non-modal dialog named by the record's title, over the right of the page area", async () => {
  const screen = await render(<ListWithPeek initialOpen />);
  const peek = bySlot("peek")!;
  expect(peek.getAttribute("role")).toBe("dialog");
  expect(peek.hasAttribute("aria-modal")).toBe(false);
  expect(peek.getAttribute("aria-labelledby")).toBe(bySlot("peek-title")!.id);
  const area = screen.getByTestId("area").element().getBoundingClientRect();
  const box = peek.getBoundingClientRect();
  expect(Math.round(box.right)).toBe(Math.round(area.right));
  expect(Math.round(box.width)).toBe(560);
  // The list behind stays live: nothing outside is inert.
  expect(screen.getByTestId("list").element().closest("[inert]")).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("opening by a person moves focus in without scrolling the list, and plays the motion; a peek open on load does not", async () => {
  const screen = await render(<ListWithPeek />);
  const list = screen.getByTestId("list").element() as HTMLElement;
  list.scrollTop = 800;
  const row = screen.getByRole("button", { name: "Row 25" });
  await row.click();
  const peek = bySlot("peek")!;
  expect(document.activeElement).toBe(peek);
  expect(list.scrollTop).toBe(800);
  expect(peek.getAttribute("data-motion")).toBe("enter");
});

test("a peek open on first render appears at rest, with no motion", async () => {
  await render(<ListWithPeek initialOpen />);
  expect(bySlot("peek")!.hasAttribute("data-motion")).toBe(false);
});

test("Escape closes it and returns focus to the row; a field keeps its own Escape", async () => {
  const screen = await render(<ListWithPeek />);
  await screen.getByRole("button", { name: "Row 3" }).click();
  await screen.getByRole("textbox", { name: "Reply" }).click();
  await userEvent.keyboard("{Escape}");
  expect(bySlot("peek")).not.toBeNull();

  (bySlot("peek") as HTMLElement).focus();
  await userEvent.keyboard("{Escape}");
  expect(bySlot("peek")).toBeNull();
  expect(document.activeElement?.textContent).toBe("Row 3");
});

test("✕ closes it; ↑ ↓ walk the list and the first row disables ↑", async () => {
  const screen = await render(<ListWithPeek />);
  await screen.getByRole("button", { name: "Row 0" }).click();
  const previous = screen.getByRole("button", { name: "Previous" });
  expect(previous.element().hasAttribute("data-disabled")).toBe(true);
  await screen.getByRole("button", { name: "Next" }).click();
  expect(bySlot("peek-title")!.textContent).toBe("Task 1");
  expect(bySlot("peek-open")!.getAttribute("href")).toBe("#task-1");
  await screen.getByRole("button", { name: "Close" }).click();
  expect(bySlot("peek")).toBeNull();
});

test("F6 moves between the peek and the row that opened it", async () => {
  const screen = await render(<ListWithPeek />);
  await screen.getByRole("button", { name: "Row 2" }).click();
  await userEvent.keyboard("{F6}");
  expect(document.activeElement?.textContent).toBe("Row 2");
  await userEvent.keyboard("{F6}");
  expect(document.activeElement).toBe(bySlot("peek"));
});

test("the resize handle steps by keys between 420px and 70% of the page area", async () => {
  const widths: number[] = [];
  await render(<ListWithPeek initialOpen onWidth={(w) => widths.push(w)} />);
  const handle = bySlot("peek-resize-handle")!;
  expect(handle.getAttribute("role")).toBe("separator");
  handle.focus();
  await userEvent.keyboard("{ArrowLeft}");
  expect(widths.at(-1)).toBe(592);
  await userEvent.keyboard("{End}");
  expect(widths.at(-1)).toBe(700);
  await userEvent.keyboard("{Home}");
  expect(widths.at(-1)).toBe(420);
  // The test stylesheet runs every transition for a few microseconds: let it land.
  await new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(r)),
  );
  expect(Math.round(handle.parentElement!.getBoundingClientRect().width)).toBe(
    420,
  );
});

test("the phone sheet rests on its first snap point, and a tap inside never closes it", async () => {
  const onOpenChange = vi.fn();
  const screen = await render(
    <Peek open onOpenChange={onOpenChange} layout="sheet">
      <PeekHeader>
        <PeekPath>Tasks</PeekPath>
        <PeekActions>
          <PeekClose />
        </PeekActions>
      </PeekHeader>
      <PeekBody>
        <PeekTitle>Task 1</PeekTitle>
        <p data-testid="text">Body</p>
        <button type="button">Assign</button>
      </PeekBody>
    </Peek>,
  );
  const popup = bySlot("peek-sheet")!;
  expect(popup.hasAttribute("data-snap-points")).toBe(true);
  expect(popup.getAttribute("aria-labelledby")).toBe(bySlot("peek-title")!.id);
  await screen.getByTestId("text").click();
  await screen.getByRole("button", { name: "Assign" }).click();
  expect(onOpenChange).not.toHaveBeenCalled();
  await expectNoA11yViolations(document.body);
  await screen.getByRole("button", { name: "Close" }).click();
  expect(onOpenChange).toHaveBeenCalledWith(false);
});
