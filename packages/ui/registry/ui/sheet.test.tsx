import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "./sheet";

function Example() {
  return (
    <Sheet>
      <SheetTrigger>Open sheet</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here.
          </SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose>Cancel</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

test("is closed by default — no sheet in the DOM", async () => {
  await render(<Example />);
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});

test("opens on trigger click and shows title + description", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Open sheet" }).click();

  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  expect(document.querySelector('[data-slot="sheet-viewport"]')).not.toBeNull();
  await expect.element(screen.getByText("Edit profile")).toBeInTheDocument();
  await expect
    .element(screen.getByText("Make changes to your profile here."))
    .toBeInTheDocument();
});

test("wires aria-labelledby / aria-describedby to title and description", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Open sheet" }).click();

  const dialog = document.querySelector('[role="dialog"]')!;
  const labelledBy = dialog.getAttribute("aria-labelledby");
  const describedBy = dialog.getAttribute("aria-describedby");
  expect(document.getElementById(labelledBy!)?.textContent).toBe(
    "Edit profile",
  );
  expect(document.getElementById(describedBy!)?.textContent).toBe(
    "Make changes to your profile here.",
  );
});

test("applies the side data attribute (default right)", async () => {
  const screen = await render(
    <Sheet defaultOpen>
      <SheetContent>
        <SheetTitle>Default side</SheetTitle>
        <SheetDescription>Slides in from the right.</SheetDescription>
      </SheetContent>
    </Sheet>,
  );
  await expect
    .element(screen.getByRole("dialog"))
    .toHaveAttribute("data-side", "right");
});

test("applies the chosen side data attribute", async () => {
  const screen = await render(
    <Sheet defaultOpen>
      <SheetContent side="left">
        <SheetTitle>Left side</SheetTitle>
        <SheetDescription>Slides in from the left.</SheetDescription>
      </SheetContent>
    </Sheet>,
  );
  await expect
    .element(screen.getByRole("dialog"))
    .toHaveAttribute("data-side", "left");
});

test("closes when the X close button is clicked", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Open sheet" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();

  // Native click: Tailwind layout utilities aren't compiled in the vitest browser
  // run, so the panel isn't positioned and Base UI's full-viewport modal backdrop
  // would intercept Playwright's pointer hit-test. The click handler still fires.
  clickBySlot("sheet-close");
  await vi_waitForClosed();
});

test("closes when a SheetClose action is clicked", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Open sheet" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();

  clickBySlot("sheet-close-action");
  await vi_waitForClosed();
});

test("closes on Escape", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Open sheet" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();

  await userEvent.keyboard("{Escape}");
  await vi_waitForClosed();
});

test("no a11y violations when open", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Open sheet" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  // The popup portals to <body>, so audit the whole document, not just the container.
  await expectNoA11yViolations(document.body);
});

test("SheetContent forwards ref to its host element", async () => {
  // The portaled popup is the host element SheetContent owns.
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <Sheet open>
      <SheetContent ref={ref}>
        <SheetTitle>Edit profile</SheetTitle>
        <SheetDescription>Make changes to your profile here.</SheetDescription>
      </SheetContent>
    </Sheet>,
  );
  expect(ref.current).toBeInstanceOf(HTMLElement);
  expect(ref.current?.dataset.slot).toBe("sheet-content");
});

/** Fire a native click on the portaled control identified by its `data-slot`. */
function clickBySlot(slot: string) {
  const el = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
  expect(el, `expected a [data-slot="${slot}"] element`).not.toBeNull();
  el!.click();
}

/** Poll until the sheet has left the DOM (after the exit transition). */
async function vi_waitForClosed() {
  await expect
    .poll(() => document.querySelector('[role="dialog"]'), { timeout: 2000 })
    .toBeNull();
}

test.each([
  ["top", "pt-[calc(var(--spacing)*0+env(safe-area-inset-top))]"],
  ["right", "pr-[calc(var(--spacing)*0+env(safe-area-inset-right))]"],
  ["bottom", "pb-[calc(var(--spacing)*0+env(safe-area-inset-bottom))]"],
  ["left", "pl-[calc(var(--spacing)*0+env(safe-area-inset-left))]"],
] as const)(
  "%s sheet pads its flush edge with env(safe-area-inset-%s) (audit §a)",
  async (side, expectedClass) => {
    const screen = await render(
      <Sheet defaultOpen>
        <SheetContent side={side}>
          <SheetTitle>{side} side</SheetTitle>
          <SheetDescription>Safe-area padding check.</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    const popup = screen.getByRole("dialog").element();
    expect(popup.className).toContain(expectedClass);
  },
);

test("modal-family rhythm matches Dialog: p-5 header/footer inset, close at top-3 right-3", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Open sheet" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();

  const header = document.querySelector('[data-slot="sheet-header"]')!;
  const footer = document.querySelector('[data-slot="sheet-footer"]')!;
  const close = document.querySelector('[data-slot="sheet-close"]')!;
  expect(header.classList.contains("p-5")).toBe(true);
  expect(footer.classList.contains("p-5")).toBe(true);
  expect(close.classList.contains("top-3")).toBe(true);
  expect(close.classList.contains("right-3")).toBe(true);
});

test("panel keeps the centralized focus-visible outline (no outline-none — register P0-02)", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Open sheet" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  const popup = document.querySelector('[data-slot="sheet-content"]')!;
  expect(popup.className).not.toMatch(/\boutline-none\b/);
});
