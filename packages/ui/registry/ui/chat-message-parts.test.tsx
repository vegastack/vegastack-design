import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { MessageParts, type ChatMessageLike } from "./chat-message-parts";
import type { ChatToolPart } from "./chat-work-log";

const tool = (
  callId: string,
  state: ChatToolPart["state"],
  extra: Partial<ChatToolPart> = {},
): ChatToolPart => ({
  type: "dynamic-tool",
  toolName: "web_search",
  toolCallId: callId,
  state,
  input: { query: "LED downlights India" },
  callProviderMetadata: {
    vegastack: { verb: "Searched the web", subject: "LED downlights India" },
  },
  ...extra,
});

const subagent = (callId: string, status: string, title: string) => ({
  type: "dynamic-tool",
  toolName: "subagent",
  toolCallId: callId,
  state: status === "running" ? "input-available" : "output-available",
  input: { title },
  output: { title, status, steps: 3, durationMs: 41_000 },
  preliminary: status === "running",
});

const message = (
  parts: ChatMessageLike["parts"],
  turn: Record<string, unknown> = {},
): ChatMessageLike => ({
  id: "m1",
  role: "assistant",
  parts,
  metadata: { turn: { startedAt: new Date().toISOString(), ...turn } },
});

const spinners = (root: ParentNode) =>
  root.querySelectorAll('[data-slot="text-spinner"]').length;

const EVERY_STATE: ChatToolPart["state"][] = [
  "input-streaming",
  "input-available",
  "approval-requested",
  "approval-responded",
  "output-available",
  "output-error",
  "output-denied",
];

test("every tool state renders a row with words, and states are words, not spinners", async () => {
  const parts = EVERY_STATE.map((state, i) =>
    tool(`c${i}`, state, {
      errorText:
        state === "output-error" ? "the query was malformed" : undefined,
      approval:
        state === "output-denied"
          ? { id: "i1", approved: false, reason: "sharing needs an admin" }
          : undefined,
    }),
  );
  const screen = await render(
    <MessageParts message={message(parts)} detail="normal" live={false} />,
  );
  await userEvent.click(screen.getByRole("button", { expanded: false }));
  const rows = screen.container.querySelectorAll('[data-slot="work-row"]');
  expect(rows).toHaveLength(EVERY_STATE.length);
  for (const [i, state] of EVERY_STATE.entries())
    expect(rows[i]!.getAttribute("data-state")).toBe(state);
  expect(rows[0]!.textContent).toContain("Running");
  expect(rows[2]!.textContent).toContain("Waiting on you");
  expect(rows[5]!.textContent).toContain("the query was malformed");
  expect(rows[6]!.textContent).toContain("sharing needs an admin");
  expect(spinners(screen.container)).toBe(0);
});

test("one moving thing: at most one TextSpinner per message, whatever its parts", async () => {
  const parts = [
    { type: "reasoning", text: "Looking for Indian makers of LED downlights." },
    ...EVERY_STATE.map((state, i) => tool(`c${i}`, state)),
    subagent("s1", "running", "Hublit and Halonix"),
    subagent("s2", "running", "Bhagwati and Instapower"),
    subagent("s3", "done", "Wipro Lighting"),
    {
      type: "data-tasklist",
      id: "t1",
      data: {
        id: "t1",
        state: "working",
        startedAt: new Date().toISOString(),
        items: [
          { id: "a", text: "Find makers", status: "completed" },
          { id: "b", text: "Research them", status: "in_progress", running: 2 },
        ],
      },
    },
    { type: "text", text: "Here's what I found", state: "streaming" },
  ];
  const [taskList, text] = parts.slice(-2);
  const work = parts.slice(0, -2);
  // Every shape a running turn takes: working; led by a task list; answering.
  const shapes = [work, [taskList!, ...work], [...work, text!]];
  for (const detail of ["summary", "normal", "verbose"] as const)
    for (const [index, shape] of shapes.entries()) {
      const live = await render(
        <MessageParts message={message(shape)} detail={detail} live />,
      );
      // Working, the live line is the one moving thing; a task list or a starting answer says the
      // progress instead, with no second spinner.
      expect(spinners(live.container)).toBe(index === 0 ? 1 : 0);
      await live.unmount();
    }
  const settled = await render(
    <MessageParts message={message(parts)} detail="verbose" live={false} />,
  );
  expect(spinners(settled.container)).toBe(0);
});

test("reader setting: Summary keeps the log closed; Normal opens it while the turn runs and folds when the answer starts", async () => {
  const work = [tool("c1", "output-available"), tool("c2", "input-available")];
  const summary = await render(
    <MessageParts message={message(work)} detail="summary" live />,
  );
  expect(
    summary.container
      .querySelector('[data-slot="live-line-trigger"]')!
      .getAttribute("aria-expanded"),
  ).toBe("false");
  await summary.unmount();

  const normal = await render(
    <MessageParts message={message(work)} detail="normal" live />,
  );
  const trigger = () =>
    normal.container.querySelector(
      '[data-slot="live-line-trigger"], [data-slot="work-summary"]',
    )!;
  expect(trigger().getAttribute("aria-expanded")).toBe("true");
  await normal.rerender(
    <MessageParts
      message={message([
        ...work,
        { type: "text", text: "The answer", state: "streaming" },
      ])}
      detail="normal"
      live
    />,
  );
  expect(trigger().getAttribute("aria-expanded")).toBe("false");
});

test("settled: one muted sentence from the server; the answer is never folded; data parts go to the app", async () => {
  const long = Array.from(
    { length: 40 },
    (_, i) => `Line ${i} of the answer.`,
  ).join("\n\n");
  const renderPlan = vi.fn(() => <p>the plan card</p>);
  const screen = await render(
    <MessageParts
      message={message(
        [
          tool("c1", "output-available"),
          { type: "data-plan", id: "p1", data: { id: "p1" } },
          { type: "text", text: long, state: "done" },
        ],
        { summary: "Worked for 41s · searched 3 times", state: "done" },
      )}
      renderData={{ "data-plan": renderPlan }}
    />,
  );
  await expect
    .element(
      screen.getByRole("button", { name: "Worked for 41s · searched 3 times" }),
    )
    .toBeInTheDocument();
  expect(renderPlan).toHaveBeenCalledOnce();
  expect(screen.container.textContent).toContain("Line 39 of the answer.");
  expect(screen.container.textContent).not.toMatch(/Show more/);
  await expectNoA11yViolations(screen.container);
});

test("an error the turn couldn't get past is a quiet row with one action", async () => {
  const onRetry = vi.fn();
  const screen = await render(
    <MessageParts
      message={message(
        [tool("c1", "output-error", { errorText: "bad cell" })],
        {
          state: "failed",
          error: {
            words: "Couldn't finish: Google refused the slide update.",
            changed: "Nothing else was changed.",
            retryable: true,
          },
        },
      )}
      onRetry={onRetry}
    />,
  );
  const row = screen.container.querySelector('[data-slot="error-row"]')!;
  expect(row.textContent).toContain("Nothing else was changed.");
  expect(row.className).not.toMatch(/destructive|bg-warning/);
  await userEvent.click(
    screen.getByRole("button", { name: "Retry this step" }),
  );
  expect(onRetry).toHaveBeenCalledOnce();
});

test("when the answer starts, the live line settles into its sentence in place", async () => {
  const work = [tool("c1", "output-available")];
  const screen = await render(
    <MessageParts message={message(work)} detail="summary" live />,
  );
  expect(
    screen.container.querySelector('[data-slot="live-line"]'),
  ).not.toBeNull();
  await screen.rerender(
    <MessageParts
      message={message([
        ...work,
        { type: "text", text: "Here's what I found", state: "streaming" },
      ])}
      detail="summary"
      live
    />,
  );
  expect(screen.container.querySelector('[data-slot="live-line"]')).toBeNull();
  const line = screen.container.querySelector('[data-slot="work-summary"]')!;
  expect(line.textContent).toContain("1 step so far");
  expect(line.className).toContain("animate-in");
});

test("a settled turn loaded from history doesn't animate its line", async () => {
  const screen = await render(
    <MessageParts
      message={message([tool("c1", "output-available")], {
        summary: "Worked for 4s",
      })}
    />,
  );
  expect(
    screen.container.querySelector('[data-slot="work-summary"]')!.className,
  ).not.toContain("animate-in");
});

test("a turn of only Subagents keeps its line when the answer starts", async () => {
  const subagents = [subagent("s1", "running", "Hublit and Halonix")];
  const screen = await render(
    <MessageParts message={message(subagents)} live />,
  );
  expect(
    screen.container.querySelector('[data-slot="live-line"]'),
  ).not.toBeNull();
  await screen.rerender(
    <MessageParts
      message={message([
        ...subagents,
        { type: "text", text: "Found them", state: "streaming" },
      ])}
      live
    />,
  );
  const line = screen.container.querySelector('[data-slot="work-summary"]')!;
  expect(line.textContent).toBe("Ran 1 Subagent");
  expect(line.tagName).toBe("P");
});

test("a text-only turn shows no work line once it answers", async () => {
  const screen = await render(<MessageParts message={message([])} live />);
  expect(
    screen.container.querySelector('[data-slot="live-line"]'),
  ).not.toBeNull();
  await screen.rerender(
    <MessageParts
      message={message([{ type: "text", text: "Hi", state: "streaming" }])}
      live
    />,
  );
  expect(
    screen.container.querySelector('[data-slot="message-work"]'),
  ).toBeNull();
});
