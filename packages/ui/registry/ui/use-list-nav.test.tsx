import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { useListNav, type UseListNavOptions } from "./use-list-nav";

function Grid({
  count = 9,
  labels,
  dir,
  ...options
}: Partial<UseListNavOptions> & {
  labels?: string[];
  dir?: "ltr" | "rtl";
}) {
  const items = labels ?? Array.from({ length: count }, (_, i) => `Item ${i}`);
  const nav = useListNav({ count: items.length, ...options });
  return (
    <div dir={dir} onKeyDown={nav.handleKeyDown} data-testid="container">
      {items.map((label, index) => (
        <button key={label} type="button" {...nav.getItemProps(index)}>
          {label}
        </button>
      ))}
    </div>
  );
}

function activeButton(): HTMLElement | null {
  return document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
}

function tabIndexes(): number[] {
  return Array.from(document.querySelectorAll("button")).map((b) => b.tabIndex);
}

test("exactly one item is Tab-reachable; the rest are -1", async () => {
  await render(<Grid count={4} />);
  expect(tabIndexes()).toEqual([0, -1, -1, -1]);
});

test("defaultActiveIndex places the initial tab stop (clamped into range)", async () => {
  await render(<Grid count={4} defaultActiveIndex={2} />);
  expect(tabIndexes()).toEqual([-1, -1, 0, -1]);
});

test("ArrowRight/ArrowLeft move focus by one and update the roving tab stop", async () => {
  const screen = await render(<Grid count={3} />);
  const first = screen.getByRole("button", { name: "Item 0" });
  (first.element() as HTMLElement).focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(activeButton()?.textContent).toBe("Item 1");
  expect(tabIndexes()).toEqual([-1, 0, -1]);
  await userEvent.keyboard("{ArrowLeft}");
  expect(activeButton()?.textContent).toBe("Item 0");
});

test("edges clamp — no wrap-around", async () => {
  const screen = await render(<Grid count={3} />);
  (
    screen.getByRole("button", { name: "Item 0" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{ArrowLeft}");
  expect(activeButton()?.textContent).toBe("Item 0");
  await userEvent.keyboard("{End}");
  expect(activeButton()?.textContent).toBe("Item 2");
  await userEvent.keyboard("{ArrowRight}");
  expect(activeButton()?.textContent).toBe("Item 2");
});

test("ArrowDown/ArrowUp move a full row when columns > 1", async () => {
  const screen = await render(<Grid count={9} columns={3} />);
  (
    screen.getByRole("button", { name: "Item 1" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{ArrowDown}");
  expect(activeButton()?.textContent).toBe("Item 4");
  await userEvent.keyboard("{ArrowDown}");
  expect(activeButton()?.textContent).toBe("Item 7");
  await userEvent.keyboard("{ArrowUp}");
  expect(activeButton()?.textContent).toBe("Item 4");
});

test("Home/End default to the whole collection (the shipped picker behaviour)", async () => {
  const screen = await render(<Grid count={9} columns={3} />);
  (
    screen.getByRole("button", { name: "Item 4" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{Home}");
  expect(activeButton()?.textContent).toBe("Item 0");
  await userEvent.keyboard("{End}");
  expect(activeButton()?.textContent).toBe("Item 8");
});

test('homeEndScope="row" jumps to the start/end of the active row only', async () => {
  const screen = await render(
    <Grid count={9} columns={3} homeEndScope="row" />,
  );
  (
    screen.getByRole("button", { name: "Item 4" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{Home}");
  expect(activeButton()?.textContent).toBe("Item 3");
  await userEvent.keyboard("{End}");
  expect(activeButton()?.textContent).toBe("Item 5");
});

test('homeEndScope="row" End clamps on a short last row', async () => {
  const screen = await render(
    <Grid count={7} columns={3} homeEndScope="row" defaultActiveIndex={6} />,
  );
  (
    screen.getByRole("button", { name: "Item 6" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{End}");
  expect(activeButton()?.textContent).toBe("Item 6");
  await userEvent.keyboard("{Home}");
  expect(activeButton()?.textContent).toBe("Item 6");
});

test("RTL flips the horizontal arrows (read live from computed direction)", async () => {
  const screen = await render(<Grid count={3} dir="rtl" />);
  (
    screen.getByRole("button", { name: "Item 0" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{ArrowLeft}");
  expect(activeButton()?.textContent).toBe("Item 1");
  await userEvent.keyboard("{ArrowRight}");
  expect(activeButton()?.textContent).toBe("Item 0");
});

test("disabled suppresses all handling", async () => {
  const screen = await render(<Grid count={3} disabled />);
  (
    screen.getByRole("button", { name: "Item 0" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(activeButton()?.textContent).toBe("Item 0");
  expect(tabIndexes()).toEqual([0, -1, -1]);
});

test("shouldHandle=false suppresses navigation (overlay-open escape hatch)", async () => {
  let overlayOpen = true;
  const screen = await render(
    <Grid count={3} shouldHandle={() => !overlayOpen} />,
  );
  (
    screen.getByRole("button", { name: "Item 0" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(activeButton()?.textContent).toBe("Item 0");
  overlayOpen = false;
  await userEvent.keyboard("{ArrowRight}");
  expect(activeButton()?.textContent).toBe("Item 1");
});

test("clicking an item moves the roving tab stop to it", async () => {
  const screen = await render(<Grid count={3} />);
  const second = screen.getByRole("button", { name: "Item 1" });
  (second.element() as HTMLElement).focus();
  // The tab-stop move lands on React's next render, not synchronously.
  await expect.poll(() => tabIndexes()).toEqual([-1, 0, -1]);
});

test("the active index re-clamps when the collection shrinks", async () => {
  const screen = await render(<Grid count={5} defaultActiveIndex={4} />);
  expect(tabIndexes()).toEqual([-1, -1, -1, -1, 0]);
  await screen.rerender(<Grid count={5} labels={["Item 0", "Item 1"]} />);
  expect(tabIndexes()).toEqual([-1, 0]);
});

test("unhandled keys pass through (no preventDefault)", async () => {
  const screen = await render(<Grid count={3} />);
  const first = screen
    .getByRole("button", { name: "Item 0" })
    .element() as HTMLElement;
  first.focus();
  const event = new KeyboardEvent("keydown", {
    key: "a",
    bubbles: true,
    cancelable: true,
  });
  first.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(false);
});

test("no a11y violations — roving grid harness", async () => {
  const screen = await render(
    <div role="toolbar" aria-label="Items">
      <Grid count={6} columns={3} />
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});
