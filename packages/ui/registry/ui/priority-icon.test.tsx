import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { PriorityIcon } from "./priority-icon";

test("renders a labelled image with the priority data attribute", async () => {
  const screen = await render(<PriorityIcon priority="high" />);
  const icon = screen.getByRole("img");
  await expect.element(icon).toHaveAttribute("aria-label", "High priority");
  await expect.element(icon).toHaveAttribute("data-priority", "high");
});

test("no a11y violations", async () => {
  const screen = await render(<PriorityIcon priority="urgent" />);
  await expectNoA11yViolations(screen.container);
});
