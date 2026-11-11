import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/geometry.css";
import { KpiCard, KpiGrid, kpiGridColumns, sparkPaths } from "./kpi-card";

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

test("no value: a muted dash at the value's size with the reason under it, one rule", async () => {
  const screen = await render(
    <KpiCard
      label="Helpful"
      value={null}
      empty="Needs 5 ratings"
      tone="success"
    />,
  );
  const value = document.querySelector<HTMLElement>(
    '[data-slot="stat-value"]',
  )!;
  expect(value.dataset.empty).toBe("");
  expect(value.className).toContain("text-muted-foreground");
  expect(value.className).not.toContain("text-success-text");
  expect(value.textContent).toContain("—");
  await expect.element(screen.getByText("Needs 5 ratings")).toBeVisible();
  await expect
    .element(
      screen.getByRole("group", { name: "Helpful: No value, Needs 5 ratings" }),
    )
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

test("tone inks the value with the family's text ink", async () => {
  await render(<KpiCard label="Success" value="62%" tone="danger" />);
  const value = document.querySelector<HTMLElement>(
    '[data-slot="stat-value"]',
  )!;
  expect(value.dataset.tone).toBe("danger");
  expect(value.className).toContain("text-destructive-text");
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

test("spark draws a line over a soft area in the tile's ink, last 120 points", async () => {
  const many = Array.from({ length: 150 }, (_, i) => (i % 7) + 1);
  const screen = await render(
    <KpiCard label="Tokens" value="12K" spark={many} series={3} />,
  );
  const svg = screen.container.querySelector('[data-slot="kpi-card-spark"]');
  expect(svg).not.toBeNull();
  expect(svg?.getAttribute("aria-hidden")).toBe("true");
  expect(svg?.getAttribute("class")).toContain("text-chart-3");
  expect(svg?.querySelectorAll("path")).toHaveLength(2);
  expect(sparkPaths(many)?.count).toBe(120);
});

test("a spark draws only with at least three points of data: no flat line and a cliff", async () => {
  const screen = await render(
    <KpiCard label="Runs" value="12" spark={[0, 0, 0, 0, 0, 0, 9, 4]} />,
  );
  expect(
    screen.container.querySelector('[data-slot="kpi-card-spark"]'),
  ).toBeNull();
  expect(sparkPaths([0, 2, 0, 3, 5])).not.toBeNull();
  expect(sparkPaths([4])).toBeNull();
});

test("a tone wins over a series for the spark", async () => {
  const screen = await render(
    <KpiCard
      label="Success"
      value="98%"
      tone="success"
      series={2}
      spark={[1, 2, 3]}
    />,
  );
  expect(
    screen.container
      .querySelector('[data-slot="kpi-card-spark"]')
      ?.getAttribute("class"),
  ).toContain("text-success");
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

test("KpiGrid sizes tiles to its container, and labels and values wrap, never truncate", async () => {
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
  // Container-sized, balanced tracks, never viewport breakpoints.
  const tiles = grid.element().querySelector('[data-slot="kpi-grid-tiles"]')!;
  expect(tiles.className).toContain("@min-[20.75rem]/kpi-grid:grid-cols-2");
  for (const cls of ["sm:grid-cols-3", "lg:grid-cols-4", "xl:grid-cols-7"])
    expect(tiles.classList.contains(cls)).toBe(false);
  // Neither the label nor the value truncates.
  for (const slot of ["stat-label", "stat-value"])
    expect(
      grid
        .element()
        .querySelector(`[data-slot="${slot}"]`)!
        .classList.contains("truncate"),
    ).toBe(false);
});

test("kpiGridColumns: only counts that fill every row", () => {
  expect(kpiGridColumns(4)).toEqual([
    "@min-[20.75rem]/kpi-grid:grid-cols-2",
    "@min-[42.25rem]/kpi-grid:grid-cols-4",
  ]);
  expect(kpiGridColumns(3)).toEqual(["@min-[31.5rem]/kpi-grid:grid-cols-3"]);
  expect(kpiGridColumns(9)).toBeNull();
});

test("four tiles in a 560px container sit two by two, never three and one", async () => {
  const screen = await render(
    <div style={{ width: 560 }}>
      <KpiGrid>
        {["A", "B", "C", "D"].map((l) => (
          <KpiCard key={l} label={l} value="1" />
        ))}
      </KpiGrid>
    </div>,
  );
  const tops = [
    ...screen.container.querySelectorAll('[data-slot="kpi-card"]'),
  ].map((t) => Math.round(t.getBoundingClientRect().top));
  expect(new Set(tops).size).toBe(2);
  expect(tops[0]).toBe(tops[1]);
  expect(tops[2]).toBe(tops[3]);
});
