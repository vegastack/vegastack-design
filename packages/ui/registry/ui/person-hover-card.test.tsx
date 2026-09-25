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
