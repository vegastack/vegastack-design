import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  ChatClock,
  ErrorRow,
  LiveLine,
  StuckRow,
  WorkLog,
  WorkSummary,
  formatClock,
} from "./chat-work-log";

const slot = (root: ParentNode, name: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`);
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

test("formatClock reads like a clock", () => {
  expect(formatClock(9_000)).toBe("0:09");
  expect(formatClock(80_000)).toBe("1:20");
  expect(formatClock(3_725_000)).toBe("1:02:05");
});

test("ChatClock counts up from startedAt in tabular figures; a settled reading is still", async () => {
  const screen = await render(
    <>
      <ChatClock startedAt={ago(9_500)} />
      <ChatClock ms={41_000} running={false} />
    </>,
  );
  const clocks = screen.container.querySelectorAll('[data-slot="chat-clock"]');
  expect(clocks[0]!.textContent).toBe("0:09");
  expect(clocks[0]!.className).toContain("tabular-nums");
  expect(clocks[1]!.textContent).toBe("0:41");
});

test("LiveLine: one spinner, the words and the timer in one line; the words reach a screen reader politely", async () => {
  const onToggle = vi.fn();
  const screen = await render(
    <LiveLine
      words="Searching the web"
      startedAt={ago(9_000)}
      open={false}
      onToggle={onToggle}
    />,
  );
  expect(
    screen.container.querySelectorAll('[data-slot="text-spinner"]'),
  ).toHaveLength(1);
  const trigger = screen.getByRole("button", { name: /Searching the web/ });
  await userEvent.click(trigger);
  expect(onToggle).toHaveBeenCalledOnce();
  expect(screen.getByRole("status").element().textContent).toBe(
    "Searching the web",
  );
  expect(slot(screen.container, "live-line-stuck")).toBeNull();
  await expectNoA11yViolations(screen.container);
});

test("LiveLine: 45s with no event shows what it waits on, with Stop and Keep waiting; Keep waiting quiets it", async () => {
  const onStop = vi.fn();
  const onKeepWaiting = vi.fn();
  const screen = await render(
    <LiveLine
      words="Running 4 Subagents"
      startedAt={ago(420_000)}
      lastEventAt={ago(50_000)}
      waitingOn="4 Subagents"
      onStop={onStop}
      onKeepWaiting={onKeepWaiting}
    />,
  );
  const stuck = slot(screen.container, "live-line-stuck")!;
  expect(stuck.textContent).toMatch(
    /Waiting on 4 Subagents · last step 50s ago/,
  );
  await expectNoA11yViolations(screen.container);
  await userEvent.click(screen.getByRole("button", { name: "Stop" }));
  expect(onStop).toHaveBeenCalledOnce();
  await userEvent.click(screen.getByRole("button", { name: "Keep waiting" }));
  expect(onKeepWaiting).toHaveBeenCalledOnce();
  expect(slot(screen.container, "live-line-stuck")).toBeNull();
});

test("WorkSummary is the log's trigger, the same 28px line", async () => {
  const onToggle = vi.fn();
  const screen = await render(
    <WorkSummary
      summary="Worked for 41s · searched 3 times"
      open={false}
      onToggle={onToggle}
    />,
  );
  const button = screen.getByRole("button", {
    name: "Worked for 41s · searched 3 times",
  });
  expect(button.element().getAttribute("aria-expanded")).toBe("false");
  expect(button.element().className).toContain("h-7");
  await userEvent.click(button);
  expect(onToggle).toHaveBeenCalledOnce();
});

test("WorkLog: notes clamp to two lines until opened; Verbose opens them and shows each call's input", async () => {
  const note = "Looking for Indian makers of LED downlights. ".repeat(6);
  const parts = [
    { type: "reasoning", text: note },
    {
      type: "dynamic-tool",
      toolName: "web_search",
      toolCallId: "c1",
      state: "output-available" as const,
      input: { query: "LED downlights India" },
      output: {},
      resultProviderMetadata: {
        vegastack: {
          verb: "Searched the web",
          subject: "LED downlights India",
          meta: "12 results",
          durationMs: 2000,
        },
      },
    },
    {
      type: "dynamic-tool",
      toolName: "subagent",
      toolCallId: "s1",
      state: "input-available" as const,
    },
    { type: "text", text: "not work" },
  ];
  const summary = await render(<WorkLog parts={parts} />);
  expect(
    summary.container.querySelectorAll('[data-slot="work-row"]'),
  ).toHaveLength(1);
  // Clamped to two lines until opened (whether it overflows is measured on compiled CSS).
  expect(summary.container.querySelector(".line-clamp-2")).not.toBeNull();
  const row = slot(summary.container, "work-row")!;
  expect(row.textContent).toContain("Searched the web");
  expect(row.textContent).toContain("12 results");
  expect(slot(summary.container, "work-row-input")).toBeNull();
  await summary.unmount();

  const verbose = await render(<WorkLog parts={parts} detail="verbose" />);
  expect(verbose.container.querySelector(".line-clamp-2")).toBeNull();
  expect(slot(verbose.container, "work-row-input")!.textContent).toContain(
    "LED downlights India",
  );
  await expectNoA11yViolations(verbose.container);
});

test("ErrorRow and StuckRow: a glyph only, plain words, one action — never a status fill", async () => {
  const onClick = vi.fn();
  const screen = await render(
    <>
      <ErrorRow
        words="Couldn't finish: Google refused the slide update."
        changed="Nothing else was changed."
        action={{ label: "Retry this step", onClick }}
      />
      <StuckRow words="Paused: today's limit is reached." />
    </>,
  );
  const error = slot(screen.container, "error-row")!;
  expect(error.querySelector('[data-status="needs-you"]')).not.toBeNull();
  expect(
    slot(screen.container, "stuck-row")!.querySelector(
      '[data-status="pending"]',
    ),
  ).not.toBeNull();
  for (const row of [error, slot(screen.container, "stuck-row")!])
    expect(row.outerHTML).not.toMatch(/bg-(destructive|warning|success)/);
  await userEvent.click(
    screen.getByRole("button", { name: "Retry this step" }),
  );
  expect(onClick).toHaveBeenCalledOnce();
  await expectNoA11yViolations(screen.container);
});

test("LiveLine: Keep waiting quiets a forced stuck line too", async () => {
  const screen = await render(
    <LiveLine words="Running 4 Subagents" stuck waitingOn="4 Subagents" />,
  );
  expect(slot(screen.container, "live-line-stuck")).not.toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Keep waiting" }));
  expect(slot(screen.container, "live-line-stuck")).toBeNull();
});

test("ChatClock counts working time on from the server's count, and holds while paused", async () => {
  const counted = new Date(Date.now() - 5_000).toISOString();
  const screen = await render(
    <>
      <ChatClock workedMs={30_000} countedAt={counted} />
      <ChatClock workedMs={30_000} countedAt={counted} running={false} />
    </>,
  );
  const clocks = screen.container.querySelectorAll('[data-slot="chat-clock"]');
  expect(clocks[0]!.textContent).toBe("0:35");
  expect(clocks[1]!.textContent).toBe("0:30");
});

test("ChatClock without a server count holds its reading while paused", async () => {
  const startedAt = new Date(Date.now() - 9_400).toISOString();
  const screen = await render(<ChatClock startedAt={startedAt} />);
  const clock = () =>
    screen.container.querySelector('[data-slot="chat-clock"]')!.textContent;
  expect(clock()).toBe("0:09");
  await screen.rerender(<ChatClock startedAt={startedAt} running={false} />);
  expect(clock()).toBe("0:09");
});
