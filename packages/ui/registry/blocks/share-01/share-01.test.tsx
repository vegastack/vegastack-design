import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { afterEach, expect, test, vi } from "vitest";

import { expectNoA11yViolations } from "../../../test/a11y";
import "../../../test/stacking.css";
import Share01Page from "./page";
import { ShareDemo } from "./components/share-demo";
import { ShareDialog } from "./components/share-dialog";

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
    .element(dialog.getByRole("combobox", { name: "Add people or teams" }))
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

test("share-01 invite mode: the level beside the input, Notify on, a message, Invite adds them", async () => {
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
  await dialog.getByRole("button", { name: "Invite", exact: true }).click();
  await expect.element(dialog.getByText("People with access")).toBeVisible();
  await expect.element(dialog.getByText("Lena Ortiz")).toBeVisible();
});

test("share-01 Publish: only the switch publishes; then copy, reset, expiry and a confirmed stop", async () => {
  await page.viewport(1280, 900);
  const screen = await render(<ShareDemo defaultOpen defaultTab="publish" />);
  const dialog = screen.getByRole("dialog", { name: "Share" });
  const toggle = dialog.getByRole("switch", { name: "Publish to the web" });
  await expect.element(toggle).not.toBeChecked();
  await expect
    .element(dialog.getByRole("button", { name: "Copy public link" }))
    .not.toBeInTheDocument();
  await toggle.click();
  await expect
    .element(dialog.getByRole("textbox", { name: "Public link" }))
    .toHaveValue("https://app.acme.com/s/k3J9xQ2");
  await expect
    .element(dialog.getByRole("button", { name: "Copy public link" }))
    .toBeVisible();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
  await dialog.getByRole("button", { name: "Reset link" }).click();
  await expect
    .element(dialog.getByRole("textbox", { name: "Public link" }))
    .toHaveValue("https://app.acme.com/s/Pw7mT4c");
  await dialog.getByRole("button", { name: "Stop publishing" }).click();
  const confirm = screen.getByRole("alertdialog", { name: "Stop publishing?" });
  await expect.element(confirm).toBeVisible();
  await confirm.getByRole("button", { name: "Stop publishing" }).click();
  await expect
    .element(dialog.getByRole("textbox", { name: "Public link" }))
    .not.toBeInTheDocument();
  await expect.element(toggle).not.toBeChecked();
});

test("share-01 a My space item reads My space, with no space level to change", async () => {
  await page.viewport(1280, 900);
  const screen = await render(<ShareDemo defaultOpen personal />);
  const dialog = screen.getByRole("dialog", { name: "Share" });
  await expect
    .poll(
      () => document.querySelector('[data-slot="share-general"]')?.textContent,
    )
    .toContain("My space · Only you and the people above");
  await expect
    .element(dialog.getByRole("combobox", { name: "Space access" }))
    .not.toBeInTheDocument();
  await expect.element(dialog.getByText(/Everyone in/)).not.toBeInTheDocument();
});

test("share-01 read-only viewer: no invite row, no menus, the published link to copy", async () => {
  await page.viewport(1280, 900);
  const screen = await render(
    <ShareDemo defaultOpen readOnly publicLinkOn defaultTab="publish" />,
  );
  const dialog = screen.getByRole("dialog", { name: "Share" });
  expect(dialog.element().querySelector("[data-people-input]")).toBeNull();
  expect(dialog.element().querySelector("[data-permission-menu]")).toBeNull();
  await expect
    .element(dialog.getByRole("switch", { name: "Publish to the web" }))
    .not.toBeInTheDocument();
  await expect
    .element(dialog.getByRole("button", { name: "Stop publishing" }))
    .not.toBeInTheDocument();
  await expect
    .element(dialog.getByRole("button", { name: "Copy public link" }))
    .toBeVisible();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
  await dialog.getByRole("tab", { name: "Share" }).click();
  await expect.element(dialog.getByText("Anand Iyer")).toBeVisible();
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

const LEVELS = [
  { value: "edit", label: "Can edit" },
  { value: "view", label: "Can view" },
];
const PRIYA = { id: "u2", name: "Priya Shah", email: "priya@acme.com" };
const LENA = { id: "u5", name: "Lena Ortiz", email: "lena@acme.com" };
const OMAR = { id: "u6", name: "Omar Haddad", email: "omar@acme.com" };

test("share-01 generalLevelReadOnly: the level is text, the mode stays a select", async () => {
  await page.viewport(1280, 900);
  const screen = await render(<ShareDemo defaultOpen generalLevelReadOnly />);
  const dialog = screen.getByRole("dialog", { name: "Share" });
  await expect
    .element(dialog.getByRole("combobox", { name: "Space access" }))
    .toBeEnabled();
  await expect
    .element(
      dialog.getByRole("button", {
        name: "Everyone in Sales's access: Can edit",
      }),
    )
    .not.toBeInTheDocument();
  await expect
    .element(
      dialog.getByRole("button", { name: "Anand Iyer's access: Can view" }),
    )
    .toBeVisible();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

test("share-01 defaultInvitees is reactive and keeps edits until it changes", async () => {
  await page.viewport(1280, 900);
  const props = {
    open: true,
    levels: LEVELS,
    people: [],
    search: () => Promise.resolve([PRIYA, LENA, OMAR]),
  };
  const chip = (name: string) =>
    screen
      .getByRole("dialog", { name: "Share" })
      .getByRole("button", { name: `Remove ${name}` });
  const screen = await render(<ShareDialog {...props} defaultInvitees={[]} />);
  const dialog = screen.getByRole("dialog", { name: "Share" });
  await expect.element(dialog.getByText("People with access")).toBeVisible();

  // The prop changes: the chips follow it and the dialog is in invite mode.
  await screen.rerender(<ShareDialog {...props} defaultInvitees={[PRIYA]} />);
  await expect.element(chip("Priya Shah")).toBeVisible();
  await expect
    .element(dialog.getByRole("checkbox", { name: "Notify people" }))
    .toBeVisible();

  // A new array with the same people is not a change; the viewer's edit stays.
  await dialog
    .getByRole("combobox", { name: "Add people or teams" })
    .fill("Lena");
  await screen.getByRole("option", { name: /Lena Ortiz/ }).click();
  await expect.element(chip("Lena Ortiz")).toBeVisible();
  await screen.rerender(<ShareDialog {...props} defaultInvitees={[PRIYA]} />);
  await expect.element(chip("Lena Ortiz")).toBeVisible();
  await expect.element(chip("Priya Shah")).toBeVisible();

  // A different prop replaces them.
  await screen.rerender(<ShareDialog {...props} defaultInvitees={[OMAR]} />);
  await expect.element(chip("Omar Haddad")).toBeVisible();
  await expect.element(chip("Priya Shah")).not.toBeInTheDocument();
  await expect.element(chip("Lena Ortiz")).not.toBeInTheDocument();
});
