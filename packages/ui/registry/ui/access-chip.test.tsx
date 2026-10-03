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

test("a hidden space shows its kind, never its name: someone's My space or a private space", async () => {
  const screen = await render(
    <>
      <AccessChip
        access={{
          kind: "hidden",
          hint: { kind: "personal", ownerName: "Priya" },
        }}
      />
      <AccessChip
        access={{ kind: "hidden", hint: { kind: "private" } }}
        published
      />
    </>,
  );
  const mine = screen.getByRole("button", { name: "Priya's My space" });
  await expect.element(mine).toBeVisible();
  expect(mine.element().querySelector("svg")?.getAttribute("class")).toContain(
    "lucide-user-lock",
  );
  const priv = screen.getByRole("button", { name: "Private space, Published" });
  expect(priv.element().getAttribute("aria-description")).toBe(
    "Members of a private space can open it. Anyone with the public link can view it.",
  );
  expect(
    priv
      .element()
      .querySelector('[data-slot="access-chip-icon"]')
      ?.getAttribute("class"),
  ).toContain("lucide-lock");
  await expectNoA11yViolations(screen.container);
});
