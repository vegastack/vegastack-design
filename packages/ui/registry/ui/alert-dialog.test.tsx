import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "./alert-dialog";

function Example({
  onConfirm,
  onCancel,
}: {
  onConfirm?: () => void;
  onCancel?: () => void;
} = {}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger>Delete project</AlertDialogTrigger>
      <AlertDialogContent intent="destructive">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete project</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction intent="destructive" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

test("is closed by default — no alertdialog in the DOM", async () => {
  await render(<Example />);
  expect(document.querySelector('[role="alertdialog"]')).toBeNull();
});

test("opens on trigger click and shows title + description", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Delete project" }).click();

  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();
  expect(
    document.querySelector('[data-slot="alert-dialog-viewport"]'),
  ).not.toBeNull();
  await expect
    .element(screen.getByText("This action cannot be undone."))
    .toBeInTheDocument();
});

test("wires aria-labelledby / aria-describedby to title and description", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Delete project" }).click();

  const dialog = document.querySelector('[role="alertdialog"]')!;
  const labelledBy = dialog.getAttribute("aria-labelledby");
  const describedBy = dialog.getAttribute("aria-describedby");
  expect(document.getElementById(labelledBy!)?.textContent).toBe(
    "Delete project",
  );
  expect(document.getElementById(describedBy!)?.textContent).toBe(
    "This action cannot be undone.",
  );
});

test("carries the intent data attribute on content and action", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Delete project" }).click();

  await expect
    .element(screen.getByRole("alertdialog"))
    .toHaveAttribute("data-intent", "destructive");
  expect(
    document
      .querySelector('[data-slot="alert-dialog-action"]')
      ?.getAttribute("data-intent"),
  ).toBe("destructive");
});

test("Action closes the dialog and fires its onClick", async () => {
  const onConfirm = vi.fn();
  const screen = await render(<Example onConfirm={onConfirm} />);
  await screen.getByRole("button", { name: "Delete project" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();

  // Native click: Tailwind layout utilities aren't compiled in the vitest browser
  // run, so the popup isn't positioned and Base UI's full-viewport modal backdrop
  // would intercept Playwright's pointer hit-test. The click handler still fires.
  clickBySlot("alert-dialog-action");
  expect(onConfirm).toHaveBeenCalledTimes(1);
  await vi_waitForClosed();
});

test("Action loading shows the spinner, marks aria-busy, and blocks the click from closing", async () => {
  const onConfirm = vi.fn();
  const screen = await render(
    <AlertDialog>
      <AlertDialogTrigger>Delete project</AlertDialogTrigger>
      <AlertDialogContent intent="destructive">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete project</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction intent="destructive" loading onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>,
  );
  await screen.getByRole("button", { name: "Delete project" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();

  const action = document.querySelector('[data-slot="alert-dialog-action"]')!;
  expect(action.getAttribute("aria-busy")).toBe("true");
  expect(action.getAttribute("data-loading")).toBe("");
  // `Button` sets `focusableWhenDisabled` while loading, so Base UI marks the control
  // `aria-disabled` (not the native `disabled` attribute) — it stays focusable/discoverable,
  // but Base UI's own click handler still short-circuits on `disabled` before anything else runs.
  expect(action.getAttribute("aria-disabled")).toBe("true");

  // Neither the consumer's onClick nor Base UI's Close handler run while busy — the dialog
  // stays open. Native `.click()` bypasses Playwright's actionability gate (which treats
  // `aria-disabled="true"` as "not enabled"), matching `clickBySlot` above.
  (action as HTMLButtonElement).click();
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(onConfirm).not.toHaveBeenCalled();
  expect(document.querySelector('[role="alertdialog"]')).not.toBeNull();
});

test("no a11y violations — loading", async () => {
  const screen = await render(
    <AlertDialog>
      <AlertDialogTrigger>Delete project</AlertDialogTrigger>
      <AlertDialogContent intent="destructive">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete project</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction intent="destructive" loading>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>,
  );
  await screen.getByRole("button", { name: "Delete project" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();
  // The popup portals to <body>, so audit the whole document, not just the container.
  await expectNoA11yViolations(document.body);
});

test("Cancel closes the dialog and fires its onClick", async () => {
  const onCancel = vi.fn();
  const screen = await render(<Example onCancel={onCancel} />);
  await screen.getByRole("button", { name: "Delete project" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();

  clickBySlot("alert-dialog-cancel");
  expect(onCancel).toHaveBeenCalledTimes(1);
  await vi_waitForClosed();
});

test("does NOT close when the backdrop is clicked (alert dialogs are non-dismissable)", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Delete project" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();

  clickBySlot("alert-dialog-backdrop");
  // Give any (incorrect) dismissal a chance to run, then assert it's still open.
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(document.querySelector('[role="alertdialog"]')).not.toBeNull();
});

test("closes on Escape as a cancel request", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Delete project" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();

  await userEvent.keyboard("{Escape}");
  await vi_waitForClosed();
});

test("no a11y violations when open", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Delete project" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();
  // The popup portals to <body>, so audit the whole document, not just the container.
  await expectNoA11yViolations(document.body);
});

test("AlertDialogContent forwards ref to its host element", async () => {
  // The portaled popup is the host element AlertDialogContent owns.
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <AlertDialog open>
      <AlertDialogContent ref={ref}>
        <AlertDialogTitle>Delete project</AlertDialogTitle>
        <AlertDialogDescription>
          This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogContent>
    </AlertDialog>,
  );
  expect(ref.current).toBeInstanceOf(HTMLElement);
  expect(ref.current?.dataset.slot).toBe("alert-dialog-content");
});

/** Fire a native click on the portaled control identified by its `data-slot`. */
function clickBySlot(slot: string) {
  const el = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
  expect(el, `expected a [data-slot="${slot}"] element`).not.toBeNull();
  el!.click();
}

/** Poll until the alert dialog has left the DOM (after the exit transition). */
async function vi_waitForClosed() {
  await expect
    .poll(() => document.querySelector('[role="alertdialog"]'), {
      timeout: 2000,
    })
    .toBeNull();
}

test("popup keeps the centralized focus-visible outline (no outline-none — register P0-02)", async () => {
  const screen = await render(<Example />);
  await screen.getByRole("button", { name: "Delete project" }).click();
  await expect.element(screen.getByRole("alertdialog")).toBeInTheDocument();
  const popup = document.querySelector('[data-slot="alert-dialog-content"]')!;
  expect(popup.className).not.toMatch(/\boutline-none\b/);
});
