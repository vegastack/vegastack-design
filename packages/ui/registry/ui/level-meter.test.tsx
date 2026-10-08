import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { LevelMeter } from "./level-meter";

test("lights segments for the given level and exposes a meter", async () => {
  const screen = await render(<LevelMeter level={0.5} segments={10} />);
  const meter = screen.getByRole("meter", { name: "Input level" });
  await expect.element(meter).toHaveAttribute("aria-valuenow", "50");
  expect(screen.container.querySelectorAll("[data-on]").length).toBe(5);
  await expectNoA11yViolations(screen.container);
});

test("inactive shows silence", async () => {
  const screen = await render(<LevelMeter level={1} active={false} />);
  await expect
    .element(screen.getByRole("meter"))
    .toHaveAttribute("aria-valuenow", "0");
});
