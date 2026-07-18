import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./dialog";

function Example() {
  return (
    <Dialog>
      <DialogTrigger>Open dialog</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>Cancel</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

test("is closed by default — no dialog in the DOM", async () => {
  await render(<Example />);
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});

test("opens on trigger click and shows title + description", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Open dialog" }).click();

  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  expect(
    document.querySelector('[data-slot="dialog-viewport"]'),
  ).not.toBeNull();
  await expect.element(screen.getByText("Delete project")).toBeInTheDocument();
  await expect
    .element(screen.getByText("This action cannot be undone."))
    .toBeInTheDocument();
});

test("wires aria-labelledby / aria-describedby to title and description", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Open dialog" }).click();

  const dialog = document.querySelector('[role="dialog"]')!;
  const labelledBy = dialog.getAttribute("aria-labelledby");
  const describedBy = dialog.getAttribute("aria-describedby");
  expect(document.getElementById(labelledBy!)?.textContent).toBe(
    "Delete project",
  );
  expect(document.getElementById(describedBy!)?.textContent).toBe(
    "This action cannot be undone.",
  );
});

test("applies the size data attribute", async () => {
  const screen = await render(
    <Dialog defaultOpen>
      <DialogContent size="lg">
        <DialogTitle>Sized</DialogTitle>
        <DialogDescription>Large dialog.</DialogDescription>
      </DialogContent>
    </Dialog>,
  );
  await expect
    .element(screen.getByRole("dialog"))
    .toHaveAttribute("data-size", "lg");
});

test("closes when the X close button is clicked", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Open dialog" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();

  // Native click: Tailwind layout utilities aren't compiled in the vitest browser
  // run, so the popup isn't positioned and Base UI's full-viewport modal backdrop
  // would intercept Playwright's pointer hit-test. The click handler still fires.
  clickBySlot("dialog-close");
  await vi_waitForClosed();
});

test("closes when a DialogClose action is clicked", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Open dialog" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();

  clickBySlot("dialog-close-action");
  await vi_waitForClosed();
});

test("closes on Escape", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Open dialog" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();

  await userEvent.keyboard("{Escape}");
  await vi_waitForClosed();
});

test("no a11y violations when open", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Open dialog" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  // The popup portals to <body>, so audit the whole document, not just the container.
  await expectNoA11yViolations(document.body);
});

test("DialogContent forwards ref to its host element", async () => {
  // The portaled popup is the host element DialogContent owns.
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <Dialog open>
      <DialogContent ref={ref}>
        <DialogTitle>Delete project</DialogTitle>
        <DialogDescription>This action cannot be undone.</DialogDescription>
      </DialogContent>
    </Dialog>,
  );
  expect(ref.current).toBeInstanceOf(HTMLElement);
  expect(ref.current?.dataset.slot).toBe("dialog-content");
});

/** Fire a native click on the portaled control identified by its `data-slot`. */
function clickBySlot(slot: string) {
  const el = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
  expect(el, `expected a [data-slot="${slot}"] element`).not.toBeNull();
  el!.click();
}

/** Poll until the dialog has left the DOM (after the exit transition). */
async function vi_waitForClosed() {
  await expect
    .poll(() => document.querySelector('[role="dialog"]'), { timeout: 2000 })
    .toBeNull();
}

test("popup keeps the centralized focus-visible outline (no outline-none — register P0-02)", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Open dialog" }).click();
  await expect.element(screen.getByRole("dialog")).toBeInTheDocument();
  const popup = document.querySelector('[data-slot="dialog-content"]')!;
  expect(popup.className).not.toMatch(/\boutline-none\b/);
});
