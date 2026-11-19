import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import "../../test/geometry.css";
import { RunTimeline, type RunTimelineStep } from "./run-timeline";

const at = "2026-11-19T09:00:00.000Z";
const tool = (id: string, overrides: Partial<RunTimelineStep> = {}) =>
  ({
    id,
    kind: "tool",
    title: `Read file ${id}`,
    status: "done",
    startedAt: at,
    durationMs: 1200,
    ...overrides,
  }) satisfies RunTimelineStep;

test("steps read in the work log's anatomy, with cost, decision, Why? and Undo", async () => {
  const onUndo = vi.fn();
  const screen = await render(
    <RunTimeline
      summary={<span>₹2.40</span>}
      steps={[
        {
          id: "t",
          kind: "turn",
          title: "Planned the follow-ups",
          status: "done",
          startedAt: at,
        },
        tool("1", {
          title: "Gmail › Send to ravi@acme.com",
          cost: "₹0.42",
          decision: {
            answer: "allow",
            by: "Rule",
            rule: "Always to @acme.com",
            why: { href: "/why/1" },
          },
          onUndo,
        }),
        tool("2", {
          status: "delivery_unknown",
          title: "Gmail › Send to priya@acme.com",
        }),
        tool("3", { status: "failed", title: "Slides › Update deck" }),
        tool("4", { status: "done", undoneBy: "Anu" }),
      ]}
    />,
  );
  await expect
    .element(page.getByRole("region", { name: "Run steps" }))
    .toBeVisible();
  const list = page.getByRole("list", { name: "Steps" });
  await expect.element(list).toBeVisible();
  const steps = screen.container.querySelectorAll(
    '[data-slot="run-timeline-step"]',
  );
  expect(steps).toHaveLength(5);
  expect(steps[1]!.textContent).toContain("₹0.42");
  expect(steps[1]!.textContent).toContain(
    "Allowed · Rule · Always to @acme.com",
  );
  await expect
    .element(page.getByRole("link", { name: "Why?" }))
    .toHaveAttribute("href", "/why/1");
  expect(steps[2]!.textContent).toContain(
    "Delivery unknown · checking before any retry",
  );
  expect(
    steps[3]!.querySelector('[aria-label="Couldn\'t finish"]'),
  ).not.toBeNull();
  expect(steps[4]!.textContent).toContain("Undone by Anu");
  await page.getByRole("button", { name: "Undo" }).click();
  expect(onUndo).toHaveBeenCalled();
  await expectNoA11yViolations(screen.container);
});

test("the run's live state is one bolt in the header, never one per row", async () => {
  const screen = await render(
    <RunTimeline
      steps={[
        tool("1", { status: "running" }),
        tool("2", { status: "running" }),
        {
          id: "s",
          kind: "subagent",
          title: "Research",
          status: "running",
          startedAt: at,
          children: [tool("3", { status: "running" })],
        },
      ]}
    />,
  );
  const root = screen.container.querySelector('[data-slot="run-timeline"]')!;
  expect(root.getAttribute("data-live")).toBe("running");
  expect(root.querySelectorAll('[data-slot="text-spinner"]')).toHaveLength(1);
  expect(
    root.querySelector(
      '[data-slot="run-timeline-header"] [data-slot="text-spinner"]',
    ),
  ).not.toBeNull();
});

test("long runs of tool steps fold and open in place; 1,000 steps stay small until opened", async () => {
  const onExpand = vi.fn();
  const steps = Array.from({ length: 1000 }, (_, index) => tool(String(index)));
  steps[2] = tool("2", { detail: <p>The file's first lines</p> });
  const screen = await render(
    <RunTimeline steps={steps} onExpand={onExpand} />,
  );
  const root = screen.container.querySelector('[data-slot="run-timeline"]')!;
  expect(root.querySelectorAll('[data-slot="run-timeline-step"]')).toHaveLength(
    5,
  );
  expect(root.querySelectorAll("*").length).toBeLessThan(200);
  await page.getByRole("button", { name: "Details" }).click();
  expect(onExpand).toHaveBeenCalledWith("2");
  await expect.element(page.getByText("The file's first lines")).toBeVisible();
  await page.getByRole("button", { name: "995 more steps" }).click();
  expect(root.querySelectorAll('[data-slot="run-timeline-step"]')).toHaveLength(
    1000,
  );
});

test("a subagent's steps nest under it; waiting pulses in the header; empty says so", async () => {
  const screen = await render(
    <>
      <RunTimeline
        steps={[
          {
            id: "s",
            kind: "subagent",
            title: "Supplier research",
            status: "waiting",
            startedAt: at,
            children: [tool("a"), tool("b")],
          },
        ]}
      />
      <RunTimeline steps={[]} />
    </>,
  );
  // A waiting branch starts open.
  await expect
    .element(page.getByRole("list", { name: "Steps of Supplier research" }))
    .toBeVisible();
  const [waiting, empty] = screen.container.querySelectorAll(
    '[data-slot="run-timeline"]',
  );
  expect(waiting!.getAttribute("data-live")).toBe("waiting");
  expect(empty!.textContent).toBe("No steps yet");
  await expectNoA11yViolations(screen.container);
});

test("a mixed run of 1,000 steps also stays small until opened; delivery unknown says it in words", async () => {
  const steps: RunTimelineStep[] = Array.from({ length: 1000 }, (_, index) =>
    index % 2
      ? tool(String(index))
      : {
          id: String(index),
          kind: "turn",
          title: `Thought ${index}`,
          status: "done",
          startedAt: at,
        },
  );
  const screen = await render(
    <>
      <RunTimeline steps={steps} />
      <RunTimeline steps={[tool("d", { status: "delivery_unknown" })]} />
    </>,
  );
  const [root, delivery] = screen.container.querySelectorAll(
    '[data-slot="run-timeline"]',
  );
  expect(root!.querySelectorAll("*").length).toBeLessThan(200);
  expect(delivery!.querySelector('[data-slot="status-glyph"]')).toBeNull();
  await page.getByRole("button", { name: "975 more steps" }).click();
  expect(
    root!.querySelectorAll('[data-slot="run-timeline-step"]'),
  ).toHaveLength(1000);
});

test("a finished subagent's steps start folded; opening shows them", async () => {
  await render(
    <RunTimeline
      steps={[
        {
          id: "s",
          kind: "subagent",
          title: "Research",
          status: "done",
          startedAt: at,
          children: [tool("a"), tool("b")],
        },
      ]}
    />,
  );
  await expect
    .element(page.getByRole("list", { name: "Steps of Research" }))
    .not.toBeInTheDocument();
  await page.getByRole("button", { name: "Show 2 steps" }).click();
  await expect
    .element(page.getByRole("list", { name: "Steps of Research" }))
    .toBeVisible();
});
