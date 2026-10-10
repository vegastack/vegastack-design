import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { afterEach, expect, test, vi } from "vitest";

import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/stacking.css";
// The block's demo is this suite's stateful fixture: it wires the dialog to sample state, so a
// level change, a removal or a publish round-trips the way a host app's would.
import { ShareDemo } from "../blocks/share-01/components/share-demo";
import { ShareDialog } from "./share-dialog";

afterEach(async () => {
  await page.viewport(414, 896);
});

test("share-dialog invite mode: the level beside the input, Notify on, a message, Invite adds them", async () => {
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

test("share-dialog Publish: only the switch publishes; then copy, reset, expiry and a confirmed stop", async () => {
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

test("share-dialog a My space item reads My space, with no space level to change", async () => {
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

test("share-dialog read-only viewer: no invite row, no menus, the published link to copy", async () => {
  await page.viewport(1280, 900);
  const screen = await render(
    <ShareDemo defaultOpen readOnly publicLinkOn defaultTab="publish" />,
  );
  const dialog = screen.getByRole("dialog", { name: "Share" });
  expect(
    dialog.element().querySelector('[data-slot="people-picker"]'),
  ).toBeNull();
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

test("share-dialog is a bottom Sheet on a phone", async () => {
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

test("share-dialog generalLevelReadOnly: the level is text, the mode stays a select", async () => {
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

test("share-dialog defaultInvitees is reactive and keeps edits until it changes", async () => {
  await page.viewport(1280, 900);
  const props = {
    open: true,
    levels: LEVELS,
    people: [],
    search: () => Promise.resolve({ items: [PRIYA, LENA, OMAR] }),
  };
  // The picker's trigger reads the chosen names.
  const chosen = () =>
    document.querySelector('[data-slot="people-picker"]')?.textContent ?? "";
  const chip = (name: string) => ({
    has: () => vi.waitFor(() => expect(chosen()).toContain(name)),
    gone: () => vi.waitFor(() => expect(chosen()).not.toContain(name)),
  });
  const screen = await render(<ShareDialog {...props} defaultInvitees={[]} />);
  const dialog = screen.getByRole("dialog", { name: "Share" });
  await expect.element(dialog.getByText("People with access")).toBeVisible();

  // The prop changes: the chips follow it and the dialog is in invite mode.
  await screen.rerender(<ShareDialog {...props} defaultInvitees={[PRIYA]} />);
  await chip("Priya Shah").has();
  await expect
    .element(dialog.getByRole("checkbox", { name: "Notify people" }))
    .toBeVisible();

  // A new array with the same people is not a change; the viewer's edit stays.
  await dialog.getByRole("button", { name: "Add people or teams" }).click();
  await screen.getByRole("combobox", { name: "Search people" }).fill("Lena");
  await screen.getByRole("option", { name: /Lena Ortiz/ }).click();
  await userEvent.keyboard("{Escape}");
  await chip("Lena Ortiz").has();
  await screen.rerender(<ShareDialog {...props} defaultInvitees={[PRIYA]} />);
  await chip("Lena Ortiz").has();
  await chip("Priya Shah").has();

  // A different prop replaces them.
  await screen.rerender(<ShareDialog {...props} defaultInvitees={[OMAR]} />);
  await chip("Omar Haddad").has();
  await chip("Priya Shah").gone();
  await chip("Lena Ortiz").gone();
});

test("share-dialog while published: the Share tab says so in one line, and Manage opens Publish", async () => {
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

test("share-dialog a space the viewer cannot see is a plain statement: no mode, no level", async () => {
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
  test(`share-dialog keeps one height across tabs (${label}), with a long or an empty people list`, async () => {
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

test("share-dialog a scrolled people list does not carry its scroll into Publish", async () => {
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
  test(`share-dialog tab underline and label start on the content edge (${label})`, async () => {
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
    // Flush with the edge, the list must not clip: a focused tab's outline (2px, offset 1px in
    // forced colours) would lose its leading side.
    const list = tab.closest<HTMLElement>('[data-slot="tabs-list"]')!;
    expect(getComputedStyle(list).overflowX).toBe("visible");
    expect(getComputedStyle(list).overflowY).toBe("visible");
  });
}

test("share-dialog canPublish gates the Publish controls apart from canManage", async () => {
  await page.viewport(1280, 900);
  const base = {
    open: true,
    defaultTab: "publish" as const,
    levels: LEVELS,
    people: [],
    search: () => Promise.resolve({ items: [PRIYA] }),
    publicLink: {
      url: "https://app.acme.com/s/k3J9xQ2",
      expires: "7d" as const,
    },
  };
  // A manager who may not publish: the invite row stays, the publish controls go.
  const screen = await render(<ShareDialog {...base} canPublish={false} />);
  const dialog = screen.getByRole("dialog", { name: "Share" });
  await expect
    .element(dialog.getByRole("switch", { name: "Publish to the web" }))
    .not.toBeInTheDocument();
  await expect
    .element(dialog.getByRole("button", { name: "Stop publishing" }))
    .not.toBeInTheDocument();
  await expect
    .element(dialog.getByRole("button", { name: "Copy public link" }))
    .toBeVisible();
  expect(
    dialog.element().querySelector('[data-slot="people-picker"]'),
  ).not.toBeNull();
  await expectNoA11yViolations(document.body, ["color-contrast"]);

  // A viewer who may publish but not manage access: the switch, no invite row.
  await screen.rerender(<ShareDialog {...base} canManage={false} canPublish />);
  await expect
    .element(dialog.getByRole("switch", { name: "Publish to the web" }))
    .toBeChecked();
  await expect
    .element(dialog.getByRole("button", { name: "Stop publishing" }))
    .toBeVisible();
  expect(
    dialog.element().querySelector('[data-slot="people-picker"]'),
  ).toBeNull();

  // Unset, it follows canManage.
  await screen.rerender(<ShareDialog {...base} canManage={false} />);
  await expect
    .element(dialog.getByRole("switch", { name: "Publish to the web" }))
    .not.toBeInTheDocument();
});

test("share-dialog hints sit right after the People, Space access and Publish labels", async () => {
  await page.viewport(1280, 900);
  const screen = await render(
    <ShareDialog
      open
      levels={LEVELS}
      people={[]}
      generalAccess={{
        space: { name: "Sales", hue: "green", access: "private" },
        mode: "space",
        level: "edit",
      }}
      hints={{
        people: <span data-testid="hint-people">?</span>,
        general: <span data-testid="hint-general">?</span>,
        publish: <span data-testid="hint-publish">?</span>,
      }}
    />,
  );
  const dialog = screen.getByRole("dialog", { name: "Share" });
  await expect.element(dialog.getByText("People with access")).toBeVisible();
  const after = (id: string) =>
    document.querySelector(`[data-testid="${id}"]`)?.previousElementSibling
      ?.textContent;
  expect(after("hint-people")).toBe("People with access");
  expect(after("hint-general")).toBe("Space access");
  expect(after("hint-publish")).toBe("Publish to the web");
  // The Publish switch keeps its accessible name from the label alone.
  await dialog.getByRole("tab", { name: "Publish" }).click();
  await expect
    .element(dialog.getByRole("switch", { name: "Publish to the web" }))
    .toBeVisible();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
});
