import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { ChoiceCard, ChoiceCardGroup } from "./choice-card";

test("cards are radios: a click anywhere chooses one, arrows move, disabled stays put", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <ChoiceCardGroup
      aria-label="Access"
      defaultValue="open"
      onValueChange={onValueChange}
    >
      <ChoiceCard
        value="open"
        title="Open"
        description="Everyone can find and join"
      />
      <ChoiceCard
        value="private"
        title="Private"
        description="Only members can find and open it"
      />
      <ChoiceCard value="locked" title="Locked" disabled />
    </ChoiceCardGroup>,
  );
  await expect
    .element(screen.getByRole("radio", { name: /Open/ }))
    .toBeChecked();
  await screen.getByText("Only members can find and open it").click();
  expect(onValueChange).toHaveBeenLastCalledWith("private", expect.anything());
  await expect
    .element(screen.getByRole("radio", { name: /Private/ }))
    .toBeChecked();
  await userEvent.keyboard("{ArrowUp}");
  expect(onValueChange).toHaveBeenLastCalledWith("open", expect.anything());
  await expect
    .element(screen.getByRole("radio", { name: /Locked/ }))
    .toBeDisabled();
  expect(
    screen.container.querySelectorAll('[data-slot="choice-card"]'),
  ).toHaveLength(3);
  await expectNoA11yViolations(screen.container);
});
