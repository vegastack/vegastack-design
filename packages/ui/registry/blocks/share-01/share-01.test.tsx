import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { afterEach, expect, test } from "vitest";

import { expectNoA11yViolations } from "../../../test/a11y";
import "../../../test/stacking.css";
import Share01Page from "./page";

// The dialog's own behaviour — invite, publish, permissions, heights — is share-dialog's suite
// (registry/ui/share-dialog.test.tsx); this one proves the block's page mounts and composes it.

afterEach(async () => {
  await page.viewport(414, 896);
});

test("share-01 opens an md Dialog with Share and Publish tabs, people and space access", async () => {
  await page.viewport(1280, 900);
  const screen = await render(<Share01Page />);
  await screen.getByRole("button", { name: "Share" }).click();
  const dialog = screen.getByRole("dialog", { name: "Share" });
  await expect.element(dialog).toBeVisible();
  expect(
    document.querySelector('[data-slot="dialog-content"][data-size="md"]'),
  ).not.toBeNull();
  await expect
    .element(dialog.getByRole("tab", { name: "Share" }))
    .toHaveAttribute("aria-selected", "true");
  await expect
    .element(dialog.getByRole("tab", { name: "Publish" }))
    .toBeVisible();
  await expect
    .element(dialog.getByRole("button", { name: "Add people or teams" }))
    .toBeVisible();
  await expect.element(dialog.getByText("Manager of Priya")).toBeVisible();
  // Built-in rows are locked (still a tab stop, with the reason); a shared row has a menu.
  const locked = dialog.element().querySelector("[data-locked]");
  expect(locked).not.toBeNull();
  await expect
    .element(
      dialog.getByRole("button", { name: "Anand Iyer's access: Can view" }),
    )
    .toBeVisible();
  expect(
    dialog.getByRole("combobox", { name: "Space access" }).element()
      .textContent,
  ).toContain("Everyone in Sales");
  // The Share tab copies the item's own link and never offers a public copy.
  await expect
    .element(dialog.getByRole("button", { name: "Copy link" }))
    .toBeVisible();
  await expect
    .element(dialog.getByRole("button", { name: "Copy public link" }))
    .not.toBeInTheDocument();
  await expect
    .element(dialog.getByRole("button", { name: "Done" }))
    .not.toBeInTheDocument();
  await expect
    .element(dialog.getByText("Admins can view this space."))
    .toBeVisible();
  await expectNoA11yViolations(document.body, ["color-contrast"]);

  await dialog
    .getByRole("button", { name: "Anand Iyer's access: Can view" })
    .click();
  await screen.getByRole("menuitem", { name: "Remove access" }).click();
  await expect.element(dialog.getByText("Anand Iyer")).not.toBeInTheDocument();
});
