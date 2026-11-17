import * as React from "react";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { PersonHoverCard, PersonHoverCardProvider } from "./person-hover-card";

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
        person={{ id: "c1", name: "Claude Code", kind: "agent", for: "Asha" }}
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
