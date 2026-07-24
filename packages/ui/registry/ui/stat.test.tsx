import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Stat, StatDelta, StatEmpty, StatLabel, StatValue } from "./stat";

test("renders label over value at the default scale", async () => {
  const screen = await render(
    <Stat>
      <StatLabel>Estimated ARR</StatLabel>
      <StatValue>$1M–$10M</StatValue>
    </Stat>,
  );
  await expect.element(screen.getByText("Estimated ARR")).toBeInTheDocument();
  const value = screen.getByText("$1M–$10M");
  expect((value.element() as HTMLElement).className).toContain("text-base");
});

test('size="lg" scales the value via context (dashboard tile voice)', async () => {
  const screen = await render(
    <Stat size="lg">
      <StatLabel>Active companies</StatLabel>
      <StatValue>1,284</StatValue>
      <StatDelta intent="up">+12% this month</StatDelta>
    </Stat>,
  );
  const value = screen.getByText("1,284");
  expect((value.element() as HTMLElement).className).toContain("text-3xl");
  const delta = screen.getByText("+12% this month");
  expect((delta.element() as HTMLElement).className).toContain(
    "text-success-text",
  );
  await expect.element(delta).toHaveAttribute("data-intent", "up");
});

test("StatEmpty renders the honest contrast-safe muted value", async () => {
  const screen = await render(
    <Stat>
      <StatLabel>Connection strength</StatLabel>
      <StatEmpty>No connection</StatEmpty>
    </Stat>,
  );
  const empty = screen.getByText("No connection");
  expect((empty.element() as HTMLElement).className).toContain(
    "text-muted-foreground",
  );
});

test("has no accessibility violations", async () => {
  const screen = await render(
    <Stat>
      <StatLabel>Funding raised</StatLabel>
      <StatValue>$31,200,000</StatValue>
      <StatDelta intent="down">−3% vs last quarter</StatDelta>
    </Stat>,
  );
  await expectNoA11yViolations(screen.container);
});
