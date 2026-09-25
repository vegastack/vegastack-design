import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { Calendar } from "lucide-react";
import { expectNoA11yViolations } from "../../test/a11y";
import { MetaLine, MetaLineItem } from "./meta-line";

test("renders each fact with a decorative icon", async () => {
  const screen = await render(
    <MetaLine>
      <MetaLineItem icon={<Calendar />}>25 Sep, 10:30</MetaLineItem>
      <MetaLineItem>42 min</MetaLineItem>
    </MetaLine>,
  );
  await expect.element(screen.getByText("25 Sep, 10:30")).toBeVisible();
  await expect.element(screen.getByText("42 min")).toBeVisible();
  expect(
    screen.container.querySelectorAll('[data-slot="meta-line-item"]'),
  ).toHaveLength(2);
  await expectNoA11yViolations(screen.container);
});
