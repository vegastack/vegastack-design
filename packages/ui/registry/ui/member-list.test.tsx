import * as React from "react";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { afterEach, expect, test, vi } from "vitest";

import { expectNoA11yViolations } from "../../test/a11y";
// Real Tailwind + tokens: the 36px rows, the eight-row scroll cap and the add row's container
// query are geometry.
import "../../test/stacking.css";
import { DropdownMenuItem } from "./dropdown-menu";
import { Input } from "./input";
import {
  MemberList,
  MemberListAdd,
  type MemberListMember,
} from "./member-list";

afterEach(async () => {
  await page.viewport(414, 896);
});

const ROLES = [
  {
    value: "full",
    label: "Full access",
    description: "Edit, share and delete",
  },
  { value: "edit", label: "Can edit", description: "Edit and comment" },
  { value: "view", label: "Can view", description: "View and comment" },
];

const MEMBERS: MemberListMember[] = [
  {
    id: "u1",
    person: { name: "Manoj Kumar", hue: "blue" },
    description: "Creator",
    role: "full",
    locked: true,
    lockedReason: "Set by role: Creator",
    you: true,
  },
  {
    id: "t1",
    person: { name: "Product team", kind: "team", hue: "cyan" },
    description: "2 people",
    role: "edit",
  },
  { id: "u2", person: { name: "Priya Shah", hue: "green" }, role: "view" },
];

test("member-list rows: avatar, name, (you) and a sub line, the role as a chip menu, ⋯ with Remove", async () => {
  await page.viewport(1280, 900);
  const onRoleChange = vi.fn();
  const onRemove = vi.fn();
  const screen = await render(
    <div style={{ width: 480 }}>
      <MemberList
        members={MEMBERS}
        roles={ROLES}
        onRoleChange={onRoleChange}
        onRemove={onRemove}
      />
    </div>,
  );
  const list = screen.getByRole("list", { name: "Members" });
  await expect.element(list).toBeInTheDocument();
  await expect.element(screen.getByText("2 people")).toBeVisible();
  await expect.element(screen.getByText("(you)")).toBeVisible();
  // 36px rows.
  for (const row of document.querySelectorAll(
    '[data-slot="member-list-row"]',
  )) {
    expect(Math.round(row.getBoundingClientRect().height)).toBe(36);
  }
  // The built-in row: a lock and no ⋯, but its ⋯ column is kept so the chips line up.
  await expect
    .element(
      screen.getByRole("button", {
        name: "Manoj Kumar's role: Full access, Set by role: Creator",
      }),
    )
    .toBeDisabled();
  await expect
    .element(screen.getByRole("button", { name: "More for Manoj Kumar" }))
    .not.toBeInTheDocument();
  const chips = [
    ...document.querySelectorAll<HTMLElement>('[data-slot="permission-menu"]'),
  ].map((chip) => Math.round(chip.getBoundingClientRect().right));
  expect(new Set(chips).size).toBe(1);
  await expectNoA11yViolations(screen.container);

  await screen
    .getByRole("button", { name: "Priya Shah's role: Can view" })
    .click();
  await screen.getByRole("menuitemradio", { name: /^Can edit/ }).click();
  expect(onRoleChange).toHaveBeenCalledWith("u2", "edit");
  await userEvent.keyboard("{Escape}");
  await vi.waitFor(() =>
    expect(document.querySelector("[data-base-ui-inert]")).toBeNull(),
  );

  await screen.getByRole("button", { name: "More for Product team" }).click();
  await expectNoA11yViolations(document.body, ["color-contrast"]);
  await screen.getByRole("menuitem", { name: "Remove" }).click();
  expect(onRemove).toHaveBeenCalledWith("t1");
});

test("member-list menuItems add to a row's ⋯ menu; removable=false keeps a menu without Remove", async () => {
  const onResend = vi.fn();
  const screen = await render(
    <MemberList
      members={[
        {
          id: "i1",
          person: { name: "Lena Ortiz" },
          role: "view",
          removable: false,
        },
      ]}
      roles={ROLES}
      onRemove={() => {}}
      menuItems={(member) => (
        <DropdownMenuItem onClick={() => onResend(member.id)}>
          Resend invite
        </DropdownMenuItem>
      )}
    />,
  );
  await screen.getByRole("button", { name: "More for Lena Ortiz" }).click();
  await expect
    .element(screen.getByRole("menuitem", { name: "Remove" }))
    .not.toBeInTheDocument();
  await screen.getByRole("menuitem", { name: "Resend invite" }).click();
  expect(onResend).toHaveBeenCalledWith("i1");
});

test("member-list read-only: roles are text, no menus; without roles a role is plain text", async () => {
  const screen = await render(
    <MemberList
      members={MEMBERS}
      roles={ROLES}
      canManage={false}
      onRemove={() => {}}
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: /More for/ }))
    .not.toBeInTheDocument();
  await expect.element(screen.getByText("Can edit")).toBeVisible();
  expect(document.querySelector("[data-locked]")).toBeNull();
  await expectNoA11yViolations(screen.container);
  await screen.unmount();

  const plain = await render(
    <MemberList
      members={[{ id: "u9", person: { name: "Omar Haddad" }, role: "Member" }]}
    />,
  );
  await expect.element(plain.getByText("Member")).toBeVisible();
  expect(document.querySelector('[data-slot="permission-menu"]')).toBeNull();
});

test("member-list loading, empty, and empty={null}", async () => {
  const loading = await render(<MemberList members={[]} loading />);
  const list = loading.getByRole("list", { name: "Members" });
  await expect.element(list).toHaveAttribute("aria-busy", "true");
  await expectNoA11yViolations(loading.container);
  await loading.unmount();

  const empty = await render(<MemberList members={[]} />);
  await expect.element(empty.getByText("No members yet")).toBeVisible();
  await empty.unmount();

  const none = await render(<MemberList members={[]} empty={null} />);
  expect(
    none.container.querySelector('[data-slot="member-list-empty"]'),
  ).toBeNull();
});

test("member-list scrolls inside itself after eight rows", async () => {
  await page.viewport(1280, 900);
  const many = Array.from({ length: 12 }, (_, i) => ({
    id: `p${i}`,
    person: { name: `Person ${i + 1}` },
    role: "view",
  }));
  const screen = await render(
    <div style={{ width: 480 }}>
      <MemberList members={many} roles={ROLES} onRemove={() => {}} />
    </div>,
  );
  const scroller = document.querySelector<HTMLElement>(
    '[data-slot="member-list-scroll"]',
  )!;
  expect(Math.round(scroller.getBoundingClientRect().height)).toBe(8 * 36);
  const viewport = scroller.querySelector<HTMLElement>(
    '[data-slot="scroll-area-viewport"]',
  )!;
  expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
  await expectNoA11yViolations(screen.container);
  await screen.unmount();

  await render(<MemberList members={many.slice(0, 8)} roles={ROLES} />);
  expect(document.querySelector('[data-slot="member-list-scroll"]')).toBeNull();
});

test("member-list-add: picker, role and Add on one line when wide, stacked when narrow", async () => {
  await page.viewport(1280, 900);
  const onAdd = vi.fn();
  const onRoleChange = vi.fn();
  function Add({ disabled }: { disabled?: boolean }) {
    return (
      <MemberListAdd
        picker={<Input aria-label="Add people" />}
        roles={ROLES}
        role="view"
        onRoleChange={onRoleChange}
        onAdd={onAdd}
        disabled={disabled}
      />
    );
  }
  const screen = await render(
    <div style={{ width: 560 }}>
      <MemberList add={<Add />} members={MEMBERS} roles={ROLES} />
    </div>,
  );
  const picker = screen.getByRole("textbox", { name: "Add people" });
  const add = screen.getByRole("button", { name: "Add", exact: true });
  const role = screen.getByRole("button", {
    name: "Role for new members: Can view",
  });
  const top = (el: Element) => Math.round(el.getBoundingClientRect().top);
  expect(top(add.element())).toBe(top(picker.element()));
  expect(top(role.element())).toBe(top(picker.element()));
  await add.click();
  expect(onAdd).toHaveBeenCalledOnce();
  await role.click();
  await screen.getByRole("menuitemradio", { name: /^Can edit/ }).click();
  expect(onRoleChange).toHaveBeenCalledWith("edit");
  await expectNoA11yViolations(screen.container);
  await screen.unmount();

  await page.viewport(390, 844);
  const narrow = await render(
    <div style={{ width: 358 }}>
      <Add disabled />
    </div>,
  );
  const narrowAdd = narrow.getByRole("button", { name: "Add", exact: true });
  await expect.element(narrowAdd).toBeDisabled();
  expect(narrowAdd.element().getBoundingClientRect().top).toBeGreaterThan(
    narrow
      .getByRole("textbox", { name: "Add people" })
      .element()
      .getBoundingClientRect().bottom,
  );
});

test("member-list labels override every string; refs forward", async () => {
  const ref = React.createRef<HTMLDivElement>();
  const addRef = React.createRef<HTMLDivElement>();
  const screen = await render(
    <MemberList
      ref={ref}
      add={<MemberListAdd ref={addRef} picker={<span />} addLabel="Invite" />}
      members={[{ id: "u2", person: { name: "Priya Shah" }, role: "view" }]}
      roles={ROLES}
      onRoleChange={() => {}}
      onRemove={() => {}}
      labels={{
        list: "People with access",
        roleFor: (name, role) => `${name}'s access: ${role}`,
        more: (name) => `Options for ${name}`,
      }}
    />,
  );
  await expect
    .element(screen.getByRole("list", { name: "People with access" }))
    .toBeInTheDocument();
  await expect
    .element(
      screen.getByRole("button", { name: "Priya Shah's access: Can view" }),
    )
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Options for Priya Shah" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("button", { name: "Invite" }))
    .toBeInTheDocument();
  expect(ref.current?.dataset.slot).toBe("member-list");
  expect(addRef.current?.dataset.slot).toBe("member-list-add");
});

test("member-list without onRoleChange shows roles as text, never a menu that does nothing", async () => {
  const screen = await render(
    <MemberList
      members={[{ id: "u2", person: { name: "Priya Shah" }, role: "view" }]}
      roles={ROLES}
      onRemove={() => {}}
      add={<MemberListAdd picker={<span />} roles={ROLES} role="edit" />}
    />,
  );
  await expect
    .element(screen.getByRole("button", { name: /role/ }))
    .not.toBeInTheDocument();
  await expect.element(screen.getByText("Can view")).toBeVisible();
  await expect.element(screen.getByText("Can edit")).toBeVisible();
  // Remove still works through the ⋯ menu.
  await expect
    .element(screen.getByRole("button", { name: "More for Priya Shah" }))
    .toBeInTheDocument();
});
