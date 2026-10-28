import * as React from "react";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  AvatarStack,
  PersonHoverCard,
  PersonHoverCardProvider,
} from "./person-hover-card";

test("stacks people and lists everyone from the stack", async () => {
  const screen = await render(
    <AvatarStack
      label="Participants"
      max={2}
      people={[
        { name: "Asha Rao", email: "asha@acme.com" },
        { name: "Dev Menon" },
        { name: "Northwind FM leads" },
      ]}
    />,
  );
  await screen.getByRole("button", { name: /^Participants:/ }).click();
  await expect.element(screen.getByText("Northwind FM leads")).toBeVisible();
  await expectNoA11yViolations(screen.container);
});

test("stacks a team as its tile and lists it with the people", async () => {
  const screen = await render(
    <AvatarStack
      label="Shared with"
      people={[
        { name: "Asha Rao", email: "asha@acme.com", hue: "blue" },
        { name: "Sales", email: "8 members", kind: "team", hue: "green" },
      ]}
    />,
  );
  const stack = screen.getByRole("button", { name: /^Shared with:/ });
  expect(
    stack.element().querySelector('[data-slot="avatar"][data-kind="team"]'),
  ).not.toBeNull();
  await stack.click();
  const list = screen.getByRole("list", { name: "Shared with" });
  await expect.element(list.getByText("8 members")).toBeVisible();
  expect(
    list.element().querySelector('[data-slot="avatar"][data-kind="team"]'),
  ).not.toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("AvatarStack counts from total, overlaps by 4px and ends its list with a footer", async () => {
  const screen = await render(
    <AvatarStack
      people={[{ name: "Kavya Iyer" }, { name: "D. Rao" }]}
      total={14}
      max={2}
      label="Members"
      footer={<button type="button">Manage access</button>}
    />,
  );
  expect(
    screen.container.querySelector('[data-slot="avatar-group-count"]')
      ?.textContent,
  ).toBe("+12");
  expect(
    screen.container.querySelector('[data-slot="avatar-group"]')?.className,
  ).toContain("-space-x-1");
  expect(screen.container.textContent).toContain("DR");
  const stack = screen.getByRole("button", { name: /Members: .* and 12 more/ });
  await stack.click();
  await expect
    .element(screen.getByRole("button", { name: "Manage access" }))
    .toBeVisible();
  await expectNoA11yViolations(document.body);
});

test('trigger="name" renders the name as an inline text button that opens the card', async () => {
  const screen = await render(
    <p>
      <PersonHoverCard
        person={{ name: "Asha Rao", email: "asha@acme.com" }}
        trigger="name"
      >
        Asha Rao
      </PersonHoverCard>{" "}
      commented
    </p>,
  );
  const name = screen.getByRole("button", { name: "Asha Rao" });
  await expect
    .element(name)
    .toHaveAttribute("data-slot", "person-hover-card-name");
  await name.click();
  await expect.element(screen.getByText("asha@acme.com")).toBeVisible();
  await expectNoA11yViolations(screen.container);
});

test("PersonHoverCardProvider draws the host's card for the people it knows, PersonCard otherwise", async () => {
  const screen = await render(
    <PersonHoverCardProvider
      value={{
        card: (p, close) =>
          p.id === "c1" ? (
            <button type="button" onClick={close}>
              Agent card for {p.name}
            </button>
          ) : null,
      }}
    >
      <PersonHoverCard
        person={{ id: "c1", name: "Claude Code", kind: "agent", via: "Asha" }}
        trigger="name"
      >
        Claude Code
      </PersonHoverCard>{" "}
      <PersonHoverCard
        person={{ name: "Asha Rao", email: "asha@acme.com" }}
        trigger="name"
      >
        Asha Rao
      </PersonHoverCard>
    </PersonHoverCardProvider>,
  );
  await screen.getByRole("button", { name: "Claude Code" }).click();
  const custom = page.getByRole("button", {
    name: "Agent card for Claude Code",
  });
  await expect.element(custom).toBeVisible();
  await custom.click();
  await expect.element(custom).not.toBeInTheDocument();
  await screen.getByRole("button", { name: "Asha Rao" }).click();
  await expect.element(page.getByText("asha@acme.com")).toBeVisible();
});
