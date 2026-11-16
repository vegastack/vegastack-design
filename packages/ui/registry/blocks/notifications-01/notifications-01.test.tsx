/**
 * `notifications-01.test.tsx` — the block's browser contract: the rail and phone-bar items carry the
 * unread count in their names; the sheet's rows are links; "Mark all read" is announced once (and
 * there is no Unread toggle); the For you and Updates tabs split the rows; focus returns to the trigger on close; the error and loading
 * states render; axe-clean. Compiled contrast is in `test/contrast.browser.test.tsx`.
 */

import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";

import { expectNoA11yViolations } from "../../../test/a11y";
import { InboxSheet } from "./components/inbox-sheet";
import { NOTIFICATIONS } from "./components/sample-notifications";
import Notifications01 from "./page";

test("the triggers carry the count, rows are links, and mark-all announces once", async () => {
  const screen = await render(<Notifications01 />);
  // The rail item and the phone bar's item both open the Inbox; the rail's comes first.
  const row = screen.getByRole("button", { name: "Inbox, 3" }).first();
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
  // T31: no Unread toggle; the tabs alone split the rows.
  expect(
    document.querySelector('[data-slot="inbox-filters"] button[aria-pressed]'),
  ).toBeNull();
  await expect
    .element(sheet.getByRole("link", { name: /Raj Patel assigned you/ }))
    .toBeInTheDocument();
  await expect
    .element(sheet.getByRole("link", { name: /Weekly sync with Skyline/ }))
    .not.toBeInTheDocument();
  (
    sheet.getByRole("tab", { name: "Updates" }).element() as HTMLElement
  ).click();
  await expect
    .element(sheet.getByRole("link", { name: /Weekly sync with Skyline/ }))
    .toBeInTheDocument();
  await expect
    .element(sheet.getByRole("link", { name: /Raj Patel assigned you/ }))
    .not.toBeInTheDocument();

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
  await expect
    .element(loading.getByRole("status", { name: "Loading inbox" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});
