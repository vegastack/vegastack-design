import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import geometryCss from "../../test/geometry.css?inline";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  Stat,
  StatDelta,
  StatEmpty,
  StatGroup,
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

const GROUP = [
  { label: "Overdue", value: 1, href: "/tasks?due=overdue" },
  { label: "Today", value: 3, href: "/tasks?due=today" },
  { label: "Upcoming", value: 12 },
  { label: "Waiting on you", value: 2 },
];

test("StatGroup renders each stat, label first; an href makes the cell a link", async () => {
  const screen = await render(<StatGroup items={GROUP} />);
  await expect
    .element(screen.getByRole("link", { name: "Overdue 1" }))
    .toHaveAttribute("href", "/tasks?due=overdue");
  const cells = screen.container.querySelectorAll(
    '[data-slot="stat-group-item"]',
  );
  expect(cells).toHaveLength(4);
  expect(cells[2]!.tagName).toBe("DIV");
  expect(cells[2]!.textContent).toBe("Upcoming12");
  await expectNoA11yViolations(screen.container);
});

test("StatGroup links render through linkRender", async () => {
  function RouterLink(props: React.ComponentProps<"a">) {
    return <a data-router="" {...props} />;
  }
  const screen = await render(
    <StatGroup items={GROUP} linkRender={<RouterLink className="extra" />} />,
  );
  const link = screen.getByRole("link", { name: "Today 3" });
  await expect.element(link).toHaveAttribute("data-router", "");
  await expect.element(link).toHaveClass("extra");
});

test("StatGroup: loading holds the line busy; a failed read is a dash with a message, never 0", async () => {
  const screen = await render(
    <StatGroup
      items={[
        { label: "Overdue", value: undefined },
        { label: "Today", value: null },
      ]}
      errorLabel="Couldn't load"
    />,
  );
  const [loading, failed] = Array.from(
    screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="stat-group-item"]',
    ),
  );
  expect(loading!.getAttribute("aria-busy")).toBe("true");
  expect(loading!.querySelector('[data-slot="skeleton"]')).not.toBeNull();
  expect(failed!.textContent).toBe("Today—Couldn't load");
  await expectNoA11yViolations(screen.container);
});

test("StatGroup hideWhenAllZero renders nothing only when every value is 0", async () => {
  const zero = GROUP.map((g) => ({ ...g, value: 0 }));
  const screen = await render(
    <div data-testid="host">
      <StatGroup items={zero} hideWhenAllZero />
    </div>,
  );
  expect(screen.container.querySelector('[data-slot="stat-group"]')).toBeNull();
  const shown = await render(
    <StatGroup
      items={zero.map((g, i) => (i ? g : { ...g, value: undefined }))}
      hideWhenAllZero
    />,
  );
  expect(
    shown.container.querySelector('[data-slot="stat-group"]'),
  ).not.toBeNull();
  const off = await render(<StatGroup items={zero} />);
  expect(
    off.container.querySelector('[data-slot="stat-group"]'),
  ).not.toBeNull();
});

test("StatGroup is one row from 24rem of its own width and a 2×2 grid below (compiled CSS)", async () => {
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  try {
    const screen = await render(
      <div>
        <div style={{ width: 360 }} data-testid="narrow">
          <StatGroup items={GROUP} />
        </div>
        <div style={{ width: 640 }} data-testid="wide">
          <StatGroup items={GROUP} />
        </div>
      </div>,
    );
    const tops = (id: string) =>
      new Set(
        Array.from(
          screen
            .getByTestId(id)
            .element()
            .querySelectorAll('[data-slot="stat-group-item"]'),
        ).map((c) => Math.round(c.getBoundingClientRect().top)),
      ).size;
    expect(tops("narrow")).toBe(2);
    expect(tops("wide")).toBe(1);
  } finally {
    sheet.remove();
  }
});
