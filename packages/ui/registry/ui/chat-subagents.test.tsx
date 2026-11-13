import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  BackgroundWork,
  SubagentsBlock,
  subagentsSummary,
} from "./chat-subagents";
import type { ChatToolPart } from "./chat-work-log";

const part = (
  callId: string,
  title: string,
  output: Record<string, unknown> | undefined,
  state: ChatToolPart["state"] = "output-available",
): ChatToolPart => ({
  type: "dynamic-tool",
  toolName: "subagent",
  toolCallId: callId,
  state,
  input: { title },
  output,
  preliminary: output?.status === "running",
});

const PARTS = [
  part("s1", "Hublit and Halonix", {
    status: "running",
    steps: 3,
    durationMs: 41_000,
  }),
  part("s2", "Bhagwati and Instapower", { status: "waiting" }),
  part("s3", "Wipro Lighting", {
    status: "done",
    steps: 5,
    durationMs: 52_000,
    costMicroUsd: 2_000,
  }),
  part("s4", "Surya Roshni", {
    status: "stopped",
    reason: "ran out of steps",
    costMicroUsd: 4_000,
  }),
];

test("live: every row shows at once with a status word, its title and quiet meta; no spinner of its own", async () => {
  const onOpen = vi.fn();
  const onOpenRequest = vi.fn();
  const onRetry = vi.fn();
  const screen = await render(
    <SubagentsBlock
      parts={PARTS}
      live
      onOpen={onOpen}
      onOpenRequest={onOpenRequest}
      onRetry={onRetry}
    />,
  );
  const rows = screen.container.querySelectorAll('[data-slot="subagent-row"]');
  expect([...rows].map((r) => r.getAttribute("data-status"))).toEqual([
    "running",
    "waiting",
    "done",
    "stopped",
  ]);
  expect(rows[0]!.textContent).toMatch(
    /Running.*Hublit and Halonix.*3 steps · 41s/,
  );
  expect(rows[3]!.textContent).toContain("ran out of steps");
  expect(
    screen.container.querySelector('[data-slot="text-spinner"]'),
  ).toBeNull();
  expect(screen.container.outerHTML).not.toMatch(
    /text-destructive|bg-destructive/,
  );
  await userEvent.click(
    screen.getByRole("button", { name: /Hublit and Halonix/ }),
  );
  expect(onOpen).toHaveBeenCalledWith("s1");
  await userEvent.click(screen.getByRole("button", { name: "waiting on you" }));
  expect(onOpenRequest).toHaveBeenCalledWith("s2");
  await userEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(onRetry).toHaveBeenCalledWith("s4");
  await expectNoA11yViolations(screen.container);
});

test("settled: one sentence that opens the rows", async () => {
  const settled = [
    PARTS[2]!,
    PARTS[3]!,
    part("s5", "Havells", { status: "done", costMicroUsd: 0 }),
    part("s6", "Syska", { status: "done" }),
  ];
  expect(
    subagentsSummary(
      settled.map((p) => ({
        callId: p.toolCallId,
        title: "",
        status: (p.output as { status: "done" }).status,
        reason: (p.output as { reason?: string }).reason,
        costMicroUsd: (p.output as { costMicroUsd?: number }).costMicroUsd,
      })),
    ),
  ).toBe("Finished 4 Subagents · 1 stopped (ran out of steps) · $0.006");
  const screen = await render(
    <SubagentsBlock parts={settled} onOpen={() => {}} />,
  );
  const trigger = screen.getByRole("button", {
    name: "Finished 4 Subagents · 1 stopped (ran out of steps) · $0.006",
  });
  expect(trigger.element().getAttribute("aria-expanded")).toBe("false");
  await userEvent.click(trigger);
  expect(trigger.element().getAttribute("aria-expanded")).toBe("true");
  await expectNoA11yViolations(screen.container);
});

test("a failed call reads as words, never a red ✕", async () => {
  const screen = await render(
    <SubagentsBlock
      live
      parts={[
        {
          ...part("s1", "Halonix", undefined, "output-error"),
          errorText: "the site refused",
        },
      ]}
      onOpen={() => {}}
    />,
  );
  const row = screen.container.querySelector('[data-slot="subagent-row"]')!;
  expect(row.getAttribute("data-status")).toBe("failed");
  expect(row.textContent).toMatch(/Couldn't finish.*Halonix.*the site refused/);
  expect(row.querySelector('[data-status="failed"]')).toBeNull();
});

test("BackgroundWork: live or partly failed is a chip; settled is a muted line; both open", async () => {
  const onOpen = vi.fn();
  const screen = await render(
    <>
      <BackgroundWork
        live
        label="4 Subagents · 3 done, 1 running"
        onOpen={onOpen}
      />
      <BackgroundWork
        attention
        label="11 commands done, 1 failed"
        onOpen={onOpen}
      />
      <BackgroundWork label="Finished 2 background commands" onOpen={onOpen} />
    </>,
  );
  const items = screen.container.querySelectorAll(
    '[data-slot="background-work"], [data-slot="chat-chip"]',
  );
  expect(items.length).toBeGreaterThanOrEqual(3);
  const chips = screen.container.querySelectorAll('[data-slot="chat-chip"]');
  expect(chips).toHaveLength(2);
  expect(chips[1]!.getAttribute("data-tone")).toBe("attention");
  await userEvent.click(
    screen.getByRole("button", { name: /Finished 2 background commands/ }),
  );
  expect(onOpen).toHaveBeenCalledOnce();
  await expectNoA11yViolations(screen.container);
});
