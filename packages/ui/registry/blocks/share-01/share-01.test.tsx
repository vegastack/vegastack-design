import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
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

test("share-01 while published: the Share tab says so in one line, and Manage opens Publish", async () => {
  await page.viewport(1280, 900);
  const screen = await render(<ShareDemo defaultOpen publicLinkOn />);
  const dialog = screen.getByRole("dialog", { name: "Share" });
  await expect.element(dialog.getByText("Published to the web")).toBeVisible();
  // Keyboard activation: focus must not fall to <body> when Manage unmounts.
  (
    dialog.getByRole("button", { name: "Manage" }).element() as HTMLElement
  ).focus();
  await userEvent.keyboard("{Enter}");
  const publishTab = dialog.getByRole("tab", { name: "Publish" });
  await expect.element(publishTab).toHaveAttribute("aria-selected", "true");
  expect(document.activeElement).toBe(publishTab.element());
  await expect
    .element(dialog.getByRole("textbox", { name: "Public link" }))
    .toBeVisible();
});

test("share-01 a space the viewer cannot see is a plain statement: no mode, no level", async () => {
  await page.viewport(1280, 900);
  const screen = await render(
    <ShareDemo
      defaultOpen
      hiddenSpace={{ kind: "personal", ownerName: "Priya" }}
    />,
  );
  const dialog = screen.getByRole("dialog", { name: "Share" });
  await expect
    .poll(
      () => document.querySelector('[data-slot="share-general"]')?.textContent,
    )
    .toContain("In Priya's My space");
  await expect
    .element(dialog.getByRole("combobox", { name: "Space access" }))
    .not.toBeInTheDocument();
  expect(
    document.querySelector(
      '[data-slot="share-general"] [data-permission-menu]',
    ),
  ).toBeNull();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});

for (const [label, width, slot] of [
  ["Dialog", 1280, "dialog-content"],
  ["phone sheet", 390, "sheet-content"],
] as const) {
  test(`share-01 keeps one height across tabs (${label}), with a long or an empty people list`, async () => {
    await page.viewport(width, 900);
    // Layout height, not the box on screen: the open animation scales the popup.
    const height = () =>
      document.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!
        .offsetHeight;
    const switchTo = async (name: string) => {
      await page.getByRole("tab", { name }).click();
      await expect
        .element(page.getByRole("tab", { name }))
        .toHaveAttribute("aria-selected", "true");
    };
    // A long people list (Share is the taller panel) …
    const long = await render(<ShareDemo defaultOpen />);
    await vi.waitFor(() =>
      expect(document.querySelector(`[data-slot="${slot}"]`)).not.toBeNull(),
    );
    const shareHeight = height();
    await switchTo("Publish");
    expect(height()).toBe(shareHeight);
    // The inactive panel is out of the accessibility tree and the tab order.
    expect(
      document.querySelector('[data-slot="share-people"]')!.closest("[inert]"),
    ).not.toBeNull();
    await switchTo("Share");
    expect(height()).toBe(shareHeight);
    await long.unmount();

    // … and an empty one with the item published (Publish is the taller panel).
    await render(
      <ShareDialog
        open
        levels={[{ value: "view", label: "Can view" }]}
        people={[]}
        publicLink={{ url: "https://app.acme.com/s/k3J9xQ2", expires: "7d" }}
        linkUrl="https://app.acme.com/tasks/REG-142"
      />,
    );
    await vi.waitFor(() =>
      expect(document.querySelector(`[data-slot="${slot}"]`)).not.toBeNull(),
    );
    const emptyHeight = height();
    await switchTo("Publish");
    expect(height()).toBe(emptyHeight);
    await expectNoA11yViolations(document.body, ["color-contrast"]);
  });
}

test("share-01 a scrolled people list does not carry its scroll into Publish", async () => {
  await page.viewport(1280, 520);
  const people = Array.from({ length: 40 }, (_, i) => ({
    id: `p${i}`,
    person: { name: `Person ${i + 1}` },
    level: "view",
  }));
  await render(
    <ShareDialog
      open
      levels={[{ value: "view", label: "Can view" }]}
      people={people}
      linkUrl="https://app.acme.com/tasks/REG-142"
    />,
  );
  const body = await vi.waitUntil(() =>
    document.querySelector<HTMLElement>('[data-slot="dialog-body"]'),
  );
  await vi.waitFor(() =>
    expect(body.scrollHeight).toBeGreaterThan(body.clientHeight),
  );
  body.scrollTo({ top: body.scrollHeight });
  await vi.waitFor(() => expect(body.scrollTop).toBeGreaterThan(0));
  await page.getByRole("tab", { name: "Publish" }).click();
  await vi.waitFor(() => expect(body.scrollTop).toBe(0));
  const toggleLocator = page.getByRole("switch", {
    name: "Publish to the web",
  });
  await expect.element(toggleLocator).toBeVisible();
  const toggle = toggleLocator.element().getBoundingClientRect();
  const frame = body.getBoundingClientRect();
  expect(toggle.top).toBeGreaterThanOrEqual(frame.top);
  expect(toggle.bottom).toBeLessThanOrEqual(frame.bottom);
});

for (const [label, width, title, body] of [
  ["Dialog", 1280, "dialog-title", "dialog-body"],
  ["phone sheet", 390, "sheet-title", "sheet-body"],
] as const) {
  test(`share-01 tab underline and label start on the content edge (${label})`, async () => {
    await page.viewport(width, 900);
    await render(<ShareDemo defaultOpen />);
    const edge = await vi.waitUntil(() =>
      document.querySelector<HTMLElement>(`[data-slot="${title}"]`),
    );
    await new Promise((resolve) => setTimeout(resolve, 300));
    const left = edge.getBoundingClientRect().left;
    const tab = document.querySelector<HTMLElement>(
      '[data-slot="tabs-trigger"]',
    )!;
    const tabStyle = getComputedStyle(tab);
    // The underline is the trigger's `::after`, inset-x-0 of its padding box.
    const underline =
      tab.getBoundingClientRect().left +
      Number.parseFloat(tabStyle.borderLeftWidth);
    const text = document.createRange();
    text.selectNodeContents(tab);
    const content = document
      .querySelector<HTMLElement>(
        `[data-slot="${body}"] [data-slot="share-people"]`,
      )!
      .getBoundingClientRect().left;
    expect(Math.round(underline)).toBe(Math.round(left));
    expect(Math.round(text.getBoundingClientRect().left)).toBe(
      Math.round(left),
    );
    expect(Math.round(content)).toBe(Math.round(left));
  });
}
