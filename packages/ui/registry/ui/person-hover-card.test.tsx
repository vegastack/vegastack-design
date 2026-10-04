import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { AvatarStack, PersonHoverCard } from "./person-hover-card";

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
