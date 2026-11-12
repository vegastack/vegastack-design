import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  RunUsageChip,
  RunUsagePanel,
  RunUsageTable,
  type RunUsageCall,
  type RunUsageSummary,
} from "./run-usage";
import "../../test/geometry.css";

const slot = (root: ParentNode, name: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`);

const SUMMARY: RunUsageSummary = {
  steps: 3,
  contextTokens: 62000,
  contextWindow: 100000,
  cachedRatio: 0.92,
  cost: 0.031,
};

const CALLS: RunUsageCall[] = [
  {
    id: "1",
    model: "Claude Haiku 5.5",
    purpose: "Step",
    tokens: { new: 4100, cacheWrite: 18000, output: 300 },
    cache: "write",
    ms: 1800,
    cost: 0.012,
  },
  {
    id: "2",
    model: "Claude Haiku 5.5",
    purpose: "Step",
    tokens: { new: 900, cacheRead: 22000, output: 500 },
    cache: "hit",
    ms: 400,
    cost: 0.004,
  },
  {
    id: "3",
    model: "Claude Haiku 5.5",
    purpose: "Subagent",
    subagent: "Research",
    tokens: { new: 14000, output: 700 },
    cache: "miss",
    cacheReason: "The instructions changed",
    ms: 2600,
    cost: 0.015,
    basis: "estimated",
  },
];

test("the chip reads steps, context with its share, cache and money", async () => {
  const screen = await render(<RunUsageChip summary={SUMMARY} />);
  const chip = slot(screen.container, "run-usage-chip")!;
  expect(chip.textContent).toBe(
    "3 steps · 62k context (62\u00a0%) · 92\u00a0% cached · $0.03",
  );
  await expectNoA11yViolations(screen.container);
});

test("the chip shows no money when cost is left out, and ~ for an estimate", async () => {
  const screen = await render(
    <RunUsageChip
      summary={{ steps: 1, contextTokens: 1500, basis: "estimated" }}
    />,
  );
  const chip = slot(screen.container, "run-usage-chip")!;
  expect(chip.textContent).not.toContain("$");
  expect(chip.textContent).toContain("1 step");
  const estimated = slot(chip, "run-usage-estimated")!;
  expect(estimated.textContent).toBe("~about 1.5k context");
  expect(estimated.querySelector("[aria-hidden]")!.textContent).toBe("~");
});

test("the panel names itself and shows models, activity, cache misses and the tree total", async () => {
  const screen = await render(
    <RunUsagePanel
      summary={{
        ...SUMMARY,
        searches: 2,
        subagents: 1,
        retries: 0,
        modelMs: 4800,
        toolMs: 1200,
        wallMs: 6500,
        tree: { cost: 0.09, tokens: 81000 },
      }}
      models={[
        {
          model: "Claude Haiku 5.5",
          steps: 3,
          tokens: {
            new: 19000,
            cacheRead: 22000,
            cacheWrite: 18000,
            output: 1500,
            reasoning: 400,
          },
          cost: 0.031,
        },
      ]}
      calls={CALLS}
      asOf="Data as of 14:02"
    />,
  );
  await expect
    .element(page.getByRole("region", { name: "Run usage" }))
    .toBeVisible();
  const root = slot(screen.container, "run-usage-panel")!;
  expect(root.dataset.state).toBe("ready");
  expect(slot(root, "run-usage-model")!.textContent).toContain(
    "1.5k (400 thinking)",
  );
  expect(slot(root, "run-usage-activity")!.textContent).toContain("Subagents");
  expect(slot(root, "run-usage-cache")!.textContent).toContain(
    "1 of 3 steps read from the cache",
  );
  expect(slot(root, "run-usage-cache-miss")!.textContent).toContain(
    "The instructions changed",
  );
  expect(slot(root, "run-usage-tree")!.textContent).toContain("$0.09");
  expect(slot(root, "run-usage-as-of")!.textContent).toBe("Data as of 14:02");
  await expectNoA11yViolations(screen.container);
});

test("the panel shows its empty, loading and error states", async () => {
  const empty = await render(<RunUsagePanel summary={{ steps: 0 }} />);
  expect(slot(empty.container, "run-usage-panel")!.dataset.state).toBe("empty");
  await expectNoA11yViolations(empty.container);

  const loading = await render(<RunUsagePanel state="loading" />);
  const busy = slot(loading.container, "run-usage-panel")!;
  expect(busy.getAttribute("aria-busy")).toBe("true");
  expect(
    slot(busy, "run-usage-loading")!.querySelector('[role="status"]')!
      .textContent,
  ).toBe("Loading usage");
  await expectNoA11yViolations(loading.container);

  const onRetry = vi.fn();
  const failed = await render(
    <RunUsagePanel state="error" error="Timed out" onRetry={onRetry} />,
  );
  await failed.getByRole("button", { name: "Try again" }).click();
  expect(onRetry).toHaveBeenCalledOnce();
  await expectNoA11yViolations(failed.container);
});

test("the table is captioned, has a row per call and a total, numbers right-aligned", async () => {
  await page.viewport(1280, 800);
  const screen = await render(
    <div style={{ width: 1100 }}>
      <RunUsageTable calls={CALLS} />
    </div>,
  );
  const table = screen.container.querySelector("table")!;
  expect(table.querySelector("caption")!.textContent).toBe("Model calls");
  expect(table.querySelectorAll("tbody tr")).toHaveLength(3);
  const headers = [...table.querySelectorAll("thead th")].map(
    (th) => th.textContent,
  );
  expect(headers).toEqual([
    "Model",
    "Purpose",
    "New",
    "Cache read",
    "Cache write",
    "Output",
    "Cache",
    "Time",
    "Cost",
  ]);
  const estimated = table.querySelector('[data-basis="estimated"]')!;
  expect(estimated.textContent).toContain("Research");
  expect(estimated.textContent).toContain("~about 14k");
  const cell = table.querySelector("tbody td:nth-child(3)")!;
  expect(getComputedStyle(cell).textAlign).toMatch(/end|right/);
  expect(table.querySelector("tfoot")!.textContent).toContain("$0.03");
  await expectNoA11yViolations(screen.container);
});

test("the table hides money when told to and scrolls inside a named region when narrow", async () => {
  await page.viewport(390, 800);
  const screen = await render(
    <div style={{ width: 358 }}>
      <RunUsageTable calls={CALLS} showCost={false} />
    </div>,
  );
  const table = screen.container.querySelector("table")!;
  expect(table.textContent).not.toContain("$");
  const region = page.getByRole("region", { name: "Model calls" });
  await expect.element(region).toBeVisible();
  // It measures itself, so it takes a tab stop once it knows it scrolls.
  await expect.element(region).toHaveAttribute("tabindex", "0");
  await expectNoA11yViolations(screen.container);
});

test("the table shows its empty state", async () => {
  const screen = await render(<RunUsageTable calls={[]} />);
  expect(slot(screen.container, "run-usage-table")!.dataset.state).toBe(
    "empty",
  );
  expect(slot(screen.container, "run-usage-empty")).not.toBeNull();
});

test("an error after loading is announced; one present at first paint is not", async () => {
  const screen = await render(<RunUsagePanel state="loading" />);
  const region = () =>
    screen.container.querySelector<HTMLElement>('[aria-live="polite"]');
  expect(region()!.textContent).toBe("");
  await screen.rerender(<RunUsagePanel state="error" />);
  await expect
    .poll(() => region()!.textContent)
    .toBe("Usage couldn't be loaded.");

  const table = await render(<RunUsageTable calls={[]} state="error" />);
  expect(
    table.container.querySelector('[aria-live="polite"]')!.textContent,
  ).toBe("");
});

test("totals stay blank when a call has no number, and cache counts every step", async () => {
  const calls: RunUsageCall[] = [
    {
      id: "a",
      model: "M",
      purpose: "Step",
      tokens: { new: 10 },
      cache: "hit",
      cost: 0.2,
    },
    {
      id: "b",
      model: "M",
      purpose: "Step",
      tokens: { new: 10 },
      cache: "none",
      cost: null,
    },
    {
      id: "c",
      model: "M",
      purpose: "Step",
      tokens: { new: 10 },
      cache: "none",
    },
  ];
  const screen = await render(
    <div style={{ width: 1100 }}>
      <RunUsageTable calls={calls} showCost />
      <RunUsagePanel summary={{ steps: 3 }} calls={calls} />
    </div>,
  );
  const foot = screen.container.querySelector("tfoot")!;
  expect(foot.textContent).not.toContain("$");
  expect(foot.textContent).not.toContain("0.0s");
  expect(slot(screen.container, "run-usage-cache")!.textContent).toContain(
    "1 of 3 steps read from the cache",
  );
});

test("an estimated call marks its cache numbers too", async () => {
  const screen = await render(
    <div style={{ width: 1100 }}>
      <RunUsageTable
        calls={[
          {
            id: "e",
            model: "M",
            purpose: "Step",
            tokens: { new: 10, cacheRead: 2000, cacheWrite: 3000 },
            basis: "estimated",
          },
        ]}
      />
    </div>,
  );
  const row = screen.container.querySelector("tbody tr")!;
  expect(row.querySelectorAll('[data-basis="estimated"]')).toHaveLength(4);
});
