/**
 * `notifications-01.test.tsx` — the block's browser contract: the rail row and the bell carry the
 * unread count in their names; the sheet's rows are links; "Mark all read" is announced once and
 * leaves Unread "all caught up"; focus returns to the trigger on close; the error and loading
 * states render; axe-clean. Compiled contrast is in `test/contrast.browser.test.tsx`.
 */

import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { beforeEach, expect, test, vi } from "vitest";

import { expectNoA11yViolations } from "../../../test/a11y";
import { InboxSheet } from "./components/inbox-sheet";
import { NOTIFICATIONS } from "./components/sample-notifications";
import Notifications01 from "./page";

// Desktop, so the rail mounts in place (see app-shell-01.test.tsx).
beforeEach(() => {
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
});

test("the triggers carry the count, rows are links, and mark-all announces once", async () => {
  const screen = await render(<Notifications01 />);
  await expect
    .element(screen.getByRole("button", { name: "Inbox, 3 unread" }))
    .toBeInTheDocument();
  const row = screen.getByRole("button", { name: "Inbox 3 unread" });
  const rowElement = row.element();
  await row.click();
  const sheet = screen.getByRole("dialog", { name: "Inbox" });
  await expect
    .element(
      sheet.getByRole("link", {
        name: /Raj Patel assigned you Confirm the support hiring budget/,
      }),
    )
    .toHaveAttribute("href", "/tasks/t41");
  await expectNoA11yViolations(document.body, ["color-contrast"]);

  // Unstyled, the sheet's backdrop has no layout and covers its content for a pointer; a DOM
  // click is what a real press dispatches.
  (
    sheet
      .getByRole("button", { name: "Mark all read" })
      .element() as HTMLElement
  ).click();
  await expect
    .element(sheet.getByRole("status"))
    .toHaveTextContent("Marked all read");
  (
    sheet.getByRole("button", { name: "Unread" }).element() as HTMLElement
  ).click();
  await expect
    .element(sheet.getByText("You’re all caught up").first())
    .toBeInTheDocument();

  await userEvent.keyboard("{Escape}");
  await expect.poll(() => document.activeElement).toBe(rowElement);
});

test("the error and loading states render and are axe-clean", async () => {
  const failed = await render(
    <InboxSheet
      open
      onOpenChange={() => {}}
      notifications={NOTIFICATIONS}
      error="Check your connection, then try again."
      onRetry={() => {}}
      onMarkAllRead={() => {}}
      onToggleRead={() => {}}
    />,
  );
  await expect
    .element(failed.getByRole("button", { name: "Try again" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
  await failed.unmount();

  const loading = await render(
    <InboxSheet
      open
      onOpenChange={() => {}}
      notifications={[]}
      loading
      onMarkAllRead={() => {}}
      onToggleRead={() => {}}
    />,
  );
  await expect.element(loading.getByText("Loading inbox")).toBeInTheDocument();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});
