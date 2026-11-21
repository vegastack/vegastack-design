import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/geometry.css";
import { HEALTH_LABEL, HealthIndicator, type Health } from "./health-indicator";

const HEALTHS = Object.keys(HEALTH_LABEL) as Health[];

test("every health shows its glyph and its words; none is grey No update", async () => {
  const screen = await render(
    <>
      {HEALTHS.map((health) => (
        <HealthIndicator key={health} health={health} />
      ))}
    </>,
  );
  const items = [
    ...screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="health-indicator"]',
    ),
  ];
  expect(items.map((item) => item.textContent)).toEqual([
    "On track",
    "At risk",
    "Off track",
    "No update",
  ]);
  expect(items.map((item) => item.dataset.health)).toEqual(HEALTHS);
  for (const item of items) expect(item.querySelector("svg")).not.toBeNull();
  // A check is primary (COL-25), the risk inks are glyph inks only, none is muted.
  const inks = items.map((item) =>
    item.querySelector("svg")!.getAttribute("class"),
  );
  expect(inks[0]).toContain("text-primary");
  expect(inks[1]).toContain("text-warning-text");
  expect(inks[2]).toContain("text-destructive-text");
  expect(inks[3]).toContain("text-muted-foreground");
  expect(items[3]!.className).toContain("text-muted-foreground");
  await expectNoA11yViolations(screen.container);
});

test("labelHidden keeps the glyph and makes the words its name; size 14 is the meta size", async () => {
  const screen = await render(
    <>
      <HealthIndicator health="at_risk" labelHidden />
      <HealthIndicator health="none" size={14} label="No update in 10 days" />
    </>,
  );
  await expect
    .element(screen.getByRole("img", { name: "At risk" }))
    .toBeInTheDocument();
  const [hidden, meta] = screen.container.querySelectorAll<HTMLElement>(
    '[data-slot="health-indicator"]',
  );
  expect(hidden!.textContent).toBe("");
  expect(meta!.dataset.size).toBe("14");
  expect(meta!.textContent).toBe("No update in 10 days");
  await expectNoA11yViolations(screen.container);
});
