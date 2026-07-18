import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
  PopoverTitle,
  PopoverDescription,
} from "./popover";

function Example() {
  return (
    <Popover>
      <PopoverTrigger>Open popover</PopoverTrigger>
      <PopoverContent>
        <PopoverTitle>Dimensions</PopoverTitle>
        <PopoverDescription>
          Set the layout dimensions for this layer.
        </PopoverDescription>
        <PopoverClose>Done</PopoverClose>
      </PopoverContent>
    </Popover>
  );
}

test("is closed by default — no popover content in the DOM", async () => {
  await render(<Example />);
  expect(document.querySelector('[data-slot="popover-content"]')).toBeNull();
});

test("opens on trigger click and renders its content", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Open popover" }).click();

  await expect
    .element(screen.getByRole("heading", { name: "Dimensions" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByText("Set the layout dimensions for this layer."))
    .toBeInTheDocument();
});

test("wires aria-labelledby / aria-describedby to title and description", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Open popover" }).click();
  await expect
    .element(screen.getByRole("heading", { name: "Dimensions" }))
    .toBeInTheDocument();

  const popup = document.querySelector('[data-slot="popover-content"]')!;
  const labelledBy = popup.getAttribute("aria-labelledby");
  const describedBy = popup.getAttribute("aria-describedby");
  expect(document.getElementById(labelledBy!)?.textContent).toBe("Dimensions");
  expect(document.getElementById(describedBy!)?.textContent).toBe(
    "Set the layout dimensions for this layer.",
  );
});

test("forwards the side prop onto the positioner", async () => {
  const screen = await render(
    <Popover defaultOpen>
      <PopoverTrigger>Trigger</PopoverTrigger>
      <PopoverContent side="right" align="start">
        Positioned content
      </PopoverContent>
    </Popover>,
  );
  await expect
    .element(screen.getByText("Positioned content"))
    .toBeInTheDocument();

  // Base UI reflects the resolved placement onto the positioner's data attributes.
  // `side` is stable; `align` can flip on viewport collision, so we only assert it's present.
  const positioner = document.querySelector(
    '[data-slot="popover-positioner"]',
  )!;
  expect(positioner.getAttribute("data-side")).toBe("right");
  expect(positioner.getAttribute("data-align")).toBeTruthy();
});

test("forwards portal, positioner, and optional viewport props", async () => {
  const screen = await render(
    <Popover defaultOpen>
      <PopoverTrigger>Trigger</PopoverTrigger>
      <PopoverContent
        portalProps={{ className: "popover-portal-prop" }}
        positionerProps={{ className: "consumer-positioner" }}
        viewportProps={{ className: "consumer-viewport" }}
      >
        Positioned content
      </PopoverContent>
    </Popover>,
  );
  await expect
    .element(screen.getByText("Positioned content"))
    .toBeInTheDocument();

  const positioner = document.querySelector(
    '[data-slot="popover-positioner"]',
  )!;
  expect(positioner.className).toContain("z-(--z-overlay)");
  expect(positioner.className).toContain("consumer-positioner");
  expect(document.querySelector(".popover-portal-prop")).not.toBeNull();
  expect(
    document.querySelector('[data-slot="popover-viewport"]')?.className,
  ).toContain("consumer-viewport");
});

test("renders an arrow when arrow is set", async () => {
  await render(
    <Popover defaultOpen>
      <PopoverTrigger>Trigger</PopoverTrigger>
      <PopoverContent arrow>Has an arrow</PopoverContent>
    </Popover>,
  );
  await expect
    .poll(() => document.querySelector('[data-slot="popover-arrow"]'))
    .not.toBeNull();
});

test("closes when a PopoverClose action is clicked", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Open popover" }).click();
  await expect
    .element(screen.getByRole("heading", { name: "Dimensions" }))
    .toBeInTheDocument();

  clickBySlot("popover-close");
  await vi_waitForClosed();
});

test("closes on Escape", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Open popover" }).click();
  await expect
    .element(screen.getByRole("heading", { name: "Dimensions" }))
    .toBeInTheDocument();

  await userEvent.keyboard("{Escape}");
  await vi_waitForClosed();
});

test("no a11y violations when open", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Open popover" }).click();
  await expect
    .element(screen.getByRole("heading", { name: "Dimensions" }))
    .toBeInTheDocument();
  // The popup portals to <body>, so audit the whole document, not just the container.
  await expectNoA11yViolations(document.body);
});

test("PopoverTrigger forwards ref to its host element", async () => {
  const ref = React.createRef<HTMLButtonElement>();
  await render(
    <Popover>
      <PopoverTrigger ref={ref}>Open popover</PopoverTrigger>
      <PopoverContent>Content</PopoverContent>
    </Popover>,
  );
  expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  expect(ref.current?.dataset.slot).toBe("popover-trigger");
});

/** Fire a native click on the portaled control identified by its `data-slot`. */
function clickBySlot(slot: string) {
  const el = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
  expect(el, `expected a [data-slot="${slot}"] element`).not.toBeNull();
  el!.click();
}

/** Poll until the popover content has left the DOM (after the exit transition). */
async function vi_waitForClosed() {
  await expect
    .poll(() => document.querySelector('[data-slot="popover-content"]'), {
      timeout: 2000,
    })
    .toBeNull();
}

test("popup keeps the centralized focus-visible outline (no outline-none — register P0-02)", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Open popover" }).click();
  await expect
    .element(screen.getByRole("heading", { name: "Dimensions" }))
    .toBeInTheDocument();
  const popup = document.querySelector('[data-slot="popover-content"]')!;
  expect(popup.className).not.toMatch(/\boutline-none\b/);
});
