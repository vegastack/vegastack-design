import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { afterEach, expect, test, vi } from "vitest";

import { expectNoA11yViolations } from "../../../test/a11y";
import "../../../test/stacking.css";
import Share01Page from "./page";
import { ShareDemo } from "./components/share-demo";

afterEach(async () => {
  await page.viewport(414, 896);
});

test("share-01 opens a Dialog with people, general access and the public link", async () => {
  await page.viewport(1280, 900);
  const screen = await render(<Share01Page />);
  await screen.getByRole("button", { name: "Share" }).click();
  const dialog = screen.getByRole("dialog", { name: "Share" });
  await expect.element(dialog).toBeVisible();
  expect(document.querySelector('[data-slot="dialog-content"]')).not.toBeNull();
  await expect
    .element(dialog.getByRole("combobox", { name: "Add people or teams" }))
    .toBeVisible();
  await expect.element(dialog.getByText("Manager of Priya")).toBeVisible();
  // Built-in rows are read-only; a shared row has a menu.
  await expect
    .element(
      dialog.getByRole("button", { name: "Manoj Kumar's access: Full access" }),
    )
    .not.toBeInTheDocument();
  await expect
    .element(
      dialog.getByRole("button", { name: "Anand Iyer's access: Can view" }),
    )
    .toBeVisible();
  expect(
    dialog.getByRole("combobox", { name: "General access" }).element()
      .textContent,
  ).toContain("Everyone in Sales");
  await expect
    .element(dialog.getByRole("button", { name: "Copy public link" }))
    .toBeVisible();
  await expect
    .element(dialog.getByText("Admins can view this space."))
    .toBeVisible();
  await expect
    .element(dialog.getByRole("button", { name: "Done" }))
    .toBeVisible();
  await expectNoA11yViolations(document.body, ["color-contrast"]);

  await dialog
    .getByRole("button", { name: "Anand Iyer's access: Can view" })
    .click();
  await screen.getByRole("menuitem", { name: "Remove access" }).click();
  await expect.element(dialog.getByText("Anand Iyer")).not.toBeInTheDocument();
});

test("share-01 invite mode: one level for the batch, Notify on, a message, Share adds them", async () => {
  await page.viewport(1280, 900);
  const screen = await render(
    <ShareDemo
      defaultOpen
      invitees={[{ id: "u5", name: "Lena Ortiz", email: "lena@acme.com" }]}
    />,
  );
  const dialog = screen.getByRole("dialog", { name: "Share" });
  await expect
    .element(dialog.getByRole("checkbox", { name: "Notify people" }))
    .toBeChecked();
  await expect
    .element(
      dialog.getByRole("button", { name: "Access for new people: Can view" }),
    )
    .toBeVisible();
  await expect
    .element(dialog.getByRole("textbox", { name: "Add a message" }))
    .toBeVisible();
  await expect
    .element(dialog.getByText("People with access"))
    .not.toBeInTheDocument();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
  await screen.getByRole("button", { name: "Share", exact: true }).click();
  await expect.element(dialog.getByText("People with access")).toBeVisible();
  await expect.element(dialog.getByText("Lena Ortiz")).toBeVisible();
});

test("share-01 public link on: the URL, copy, reset with a tooltip, expiry and Stop sharing", async () => {
  await page.viewport(1280, 900);
  const screen = await render(<ShareDemo defaultOpen publicLinkOn />);
  const dialog = screen.getByRole("dialog", { name: "Share" });
  await expect
    .element(dialog.getByRole("textbox", { name: "Public link" }))
    .toHaveValue("https://app.acme.com/s/k3J9xQ2");
  await expect
    .element(dialog.getByRole("button", { name: "Copy public link" }))
    .toBeVisible();
  expect(
    dialog.getByRole("combobox", { name: "Expires" }).element().textContent,
  ).toContain("7 days");
  await expectNoA11yViolations(document.body, ["color-contrast"]);
  await dialog.getByRole("button", { name: "Reset link" }).click();
  await expect
    .element(dialog.getByRole("textbox", { name: "Public link" }))
    .toHaveValue("https://app.acme.com/s/Pw7mT4c");
  await dialog.getByRole("button", { name: "Stop sharing" }).click();
  await expect.element(dialog.getByText("Off", { exact: true })).toBeVisible();
});

test("share-01 read-only viewer: no invite row and no menus", async () => {
  await page.viewport(1280, 900);
  const screen = await render(<ShareDemo defaultOpen readOnly publicLinkOn />);
  const dialog = screen.getByRole("dialog", { name: "Share" });
  await expect.element(dialog.getByText("Anand Iyer")).toBeVisible();
  expect(dialog.element().querySelector("[data-people-input]")).toBeNull();
  expect(dialog.element().querySelector("[data-permission-menu]")).toBeNull();
  await expect
    .element(dialog.getByRole("button", { name: "Stop sharing" }))
    .not.toBeInTheDocument();
  await expect
    .element(dialog.getByRole("button", { name: "Copy public link" }))
    .toBeVisible();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("share-01 is a bottom Sheet on a phone", async () => {
  await page.viewport(390, 844);
  const screen = await render(<ShareDemo defaultOpen />);
  await expect
    .element(screen.getByRole("dialog", { name: "Share" }))
    .toBeVisible();
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-slot="sheet-content"][data-side="bottom"]'),
    ).not.toBeNull(),
  );
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});
