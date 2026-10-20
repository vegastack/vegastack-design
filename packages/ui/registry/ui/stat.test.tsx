import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import geometryCss from "../../test/geometry.css?inline";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Stat,
  StatDelta,
  StatEmpty,
  StatLabel,
  StatSkeleton,
  StatValue,
} from "./stat";

test("renders label over value at the default scale", async () => {
  const screen = await render(
    <Stat>
      <StatLabel>Estimated ARR</StatLabel>
      <StatValue>$1M–$10M</StatValue>
    </Stat>,
  );
  await expect.element(screen.getByText("Estimated ARR")).toBeInTheDocument();
  const value = screen.getByText("$1M–$10M");
  expect((value.element() as HTMLElement).className).toContain("text-sm");
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
  expect((value.element() as HTMLElement).className).toContain("text-2xl");
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

test("StatSkeleton is exactly as tall as a loaded Stat, at both sizes (compiled CSS)", async () => {
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  try {
    const screen = await render(
      <div className="flex items-start gap-4">
        <Stat size="lg" data-testid="lg">
          <StatLabel>Overdue</StatLabel>
          <StatValue>12</StatValue>
        </Stat>
        <div data-testid="lg-skeleton">
          <StatSkeleton size="lg" />
        </div>
        <Stat data-testid="md">
          <StatLabel>Estimated ARR</StatLabel>
          <StatValue>$1M–$10M</StatValue>
        </Stat>
        <div data-testid="md-skeleton">
          <StatSkeleton />
        </div>
      </div>,
    );
    const height = (id: string) =>
      screen.getByTestId(id).element().getBoundingClientRect().height;
    expect(height("lg-skeleton")).toBe(height("lg"));
    expect(height("md-skeleton")).toBe(height("md"));
  } finally {
    sheet.remove();
  }
});
