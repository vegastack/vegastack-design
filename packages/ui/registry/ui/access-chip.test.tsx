import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { AccessChip } from "./access-chip";

test("a space chip names the space, is a focusable button and opens on click", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <AccessChip
      access={{
        kind: "space",
        space: { name: "Product", access: "open", hue: "blue" },
      }}
      published
      onClick={onClick}
    />,
  );
  const chip = screen.getByRole("button", { name: "Product, Published" });
  await expect.element(chip).toBeVisible();
  expect(
    screen.container.querySelector('[data-slot="access-chip-published"]'),
  ).not.toBeNull();
  await userEvent.tab();
  expect(document.activeElement).toBe(chip.element());
  await userEvent.keyboard("{Enter}");
  expect(onClick).toHaveBeenCalledTimes(1);
  await expectNoA11yViolations(screen.container);
});

test("invited, personal and icon-only forms", async () => {
  const screen = await render(
    <>
      <AccessChip access={{ kind: "invited" }} />
      <AccessChip access={{ kind: "personal" }} iconOnly />
    </>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Only invited" }))
    .toBeVisible();
  const personal = screen.getByRole("button", { name: "My space" });
  await expect.element(personal).toBeVisible();
  expect(personal.element().textContent).toBe("");
  await expectNoA11yViolations(screen.container);
});
