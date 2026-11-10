import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { KpiCard, KpiGrid } from "./kpi-card";

test("names the tile 'label: value, delta' and renders the Stat parts", async () => {
  const ref = React.createRef<HTMLDivElement>();
  const screen = await render(
    <KpiCard
      ref={ref}
      label="Runs"
      value="1,284"
      delta={{ text: "+12% vs last week", direction: "up", tone: "positive" }}
    />,
  );
  const tile = screen.getByRole("group", {
    name: "Runs: 1,284, +12% vs last week",
  });
  await expect.element(tile).toHaveAttribute("data-slot", "kpi-card");
  expect(ref.current).toBe(tile.element());
  const value = screen.getByText("1,284");
  await expect.element(value).toHaveAttribute("data-slot", "stat-value");
  expect((value.element() as HTMLElement).className).toContain("text-2xl");
  const delta = screen.getByText("+12% vs last week");
  await expect.element(delta).toHaveAttribute("data-intent", "up");
  await expect.element(delta).toHaveAttribute("data-tone", "positive");
  await expectNoA11yViolations(screen.container);
});

test("omits the delta from the name when absent; a number value reads as text", async () => {
  const screen = await render(<KpiCard label="Agents" value={7} />);
  await expect
    .element(screen.getByRole("group", { name: "Agents: 7" }))
    .toBeInTheDocument();
});

test("a non-text value is named from the rendered label, value and delta", async () => {
  const screen = await render(
    <KpiCard
      label="Cost"
      value={<span>$12.40</span>}
      delta={{ text: "No change", direction: "flat", tone: "neutral" }}
    />,
  );
  await expect
    .element(screen.getByRole("group", { name: "Cost $12.40 No change" }))
    .toBeInTheDocument();
});

test("a linked tile with a non-text value still names its link with the value", async () => {
  const screen = await render(
    <KpiCard
      label="Cost"
      value={<span>$12.40</span>}
      linkRender={<a href="/cost" />}
    />,
  );
  await expect
    .element(screen.getByRole("link", { name: "Cost $12.40" }))
    .toHaveAttribute("href", "/cost");
  await expectNoA11yViolations(screen.container);
});

test("delta tone sets the ink, independent of direction", async () => {
  const screen = await render(
    <div>
      <KpiCard
        label="Errors"
        value="31"
        delta={{ text: "+4", direction: "up", tone: "negative" }}
      />
      <KpiCard
        label="Latency"
        value="1.2 s"
        delta={{ text: "−0.3 s", direction: "down", tone: "positive" }}
      />
      <KpiCard
        label="Seats"
        value="40"
        delta={{ text: "No change", direction: "flat", tone: "neutral" }}
      />
    </div>,
  );
  const cls = (text: string) =>
    (screen.getByText(text).element() as HTMLElement).className;
  expect(cls("+4")).toContain("text-destructive-text");
  expect(cls("+4")).not.toContain("text-success-text");
  expect(cls("−0.3 s")).toContain("text-success-text");
  expect(cls("−0.3 s")).not.toContain("text-destructive-text");
  expect(cls("No change")).toContain("text-muted-foreground");
});

test("value null reads 'No data' through StatEmpty, never a dash or a zero", async () => {
  const screen = await render(<KpiCard label="Cost" value={null} />);
  const empty = screen.getByText("No data");
  await expect.element(empty).toHaveAttribute("data-slot", "stat-empty");
  await expect
    .element(screen.getByRole("group", { name: "Cost: No data" }))
    .toBeInTheDocument();
  expect(document.querySelector('[data-slot="stat-value"]')).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("loading shows the large StatSkeleton plus a spark-height skeleton, busy", async () => {
  const screen = await render(<KpiCard label="Runs" value="12" loading />);
  const tile = screen.getByRole("group", { name: "Runs" });
  await expect.element(tile).toHaveAttribute("aria-busy", "true");
  const skeleton = document.querySelector('[data-slot="stat-skeleton"]');
  expect(skeleton?.getAttribute("data-size")).toBe("lg");
  expect(document.querySelector('[data-slot="stat-value"]')).toBeNull();
  expect(
    tile.element().querySelector('[data-slot="skeleton"].h-6'),
  ).not.toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("spark draws an aria-hidden polyline in the single-series ink, last 120 points", async () => {
  const many = Array.from({ length: 150 }, (_, i) => i % 7);
  const screen = await render(<KpiCard label="Runs" value="12" spark={many} />);
  const svg = screen.container.querySelector('[data-slot="kpi-card-spark"]');
  expect(svg).not.toBeNull();
  expect(svg?.getAttribute("aria-hidden")).toBe("true");
  expect(svg?.classList.contains("h-6")).toBe(true);
  const line = svg?.querySelector("polyline");
  expect(line?.getAttribute("class")).toContain("stroke-chart-single");
  expect(line?.getAttribute("points")?.split(" ")).toHaveLength(120);
});

test("a spark with fewer than two points draws nothing", async () => {
  const screen = await render(<KpiCard label="Runs" value="12" spark={[4]} />);
  expect(
    screen.container.querySelector('[data-slot="kpi-card-spark"]'),
  ).toBeNull();
});

test("hint renders an InfoHint beside the label", async () => {
  const screen = await render(
    <KpiCard label="Runs" value="12" hint="Every run that started." />,
  );
  const hint = screen.getByRole("button", { name: "About Runs" });
  await expect.element(hint).toHaveAttribute("data-slot", "info-hint");
  await userEvent.click(hint);
  await expect
    .element(screen.getByText("Every run that started."))
    .toBeVisible();
  await userEvent.keyboard("{Escape}");
});

test("linkRender makes the whole tile one link named like the tile; the hint stays outside it", async () => {
  const screen = await render(
    <KpiCard
      label="Runs"
      value="1,284"
      hint="Every run that started."
      delta={{ text: "+12%", direction: "up", tone: "positive" }}
      linkRender={<a href="/agents/runs" className="custom" />}
    />,
  );
  const link = screen.getByRole("link", { name: "Runs: 1,284, +12%" });
  await expect.element(link).toHaveAttribute("href", "/agents/runs");
  await expect.element(link).toHaveAttribute("data-slot", "kpi-card-link");
  const el = link.element() as HTMLElement;
  expect(el.className).toContain("absolute");
  expect(el.className).toContain("inset-0");
  expect(el.className).toContain("custom");
  // No nested interactive content: the hint is a sibling of the link, not inside it.
  const hint = screen.getByRole("button", { name: "About Runs" }).element();
  expect(el.contains(hint)).toBe(false);
  // A linked tile is named by its link, not by a second group with the same name.
  expect(screen.container.querySelector('[role="group"]')).toBeNull();
  el.focus();
  expect(document.activeElement).toBe(el);
  await expectNoA11yViolations(screen.container);
});

test("KpiGrid lays tiles out 2 → 3 (sm) → 4 (lg) → 7 (xl) columns", async () => {
  const ref = React.createRef<HTMLDivElement>();
  const screen = await render(
    <KpiGrid ref={ref} data-testid="grid">
      <KpiCard label="Runs" value="1" />
      <KpiCard label="Failures" value="0" />
    </KpiGrid>,
  );
  const grid = screen.getByTestId("grid");
  await expect.element(grid).toHaveAttribute("data-slot", "kpi-grid");
  expect(ref.current).toBe(grid.element());
  for (const cls of [
    "grid-cols-2",
    "sm:grid-cols-3",
    "lg:grid-cols-4",
    "xl:grid-cols-7",
  ])
    expect(grid.element().classList.contains(cls)).toBe(true);
});
