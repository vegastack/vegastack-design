import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { AvatarStack } from "./person-hover-card";

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
