import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Button } from "./button";
import { Citation } from "./cited-list";
import { Message, MessageContent } from "./message";
import {
  MessageActions,
  MessageChange,
  MessageDisclaimer,
  MessageFold,
  MessageHandoff,
  MessageNotice,
  MessagePlan,
  MessageSources,
  MessageStatus,
  MessageStep,
  MessageSteps,
  MessageVersionSwitch,
} from "./message-parts";
import "../../test/geometry.css";

const slot = (root: ParentNode, name: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`);

test("steps start closed behind their summary and open on a press", async () => {
  const screen = await render(
    <MessageSteps summary="2 steps · Searched meetings">
      <MessageStep label="Searched meetings" meta="2 results" />
      <MessageStep label="Read a note" />
    </MessageSteps>,
  );
  const trigger = page.getByRole("button", { name: /2 steps/ });
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  expect(
    screen.container.querySelectorAll("[data-slot=message-step]"),
  ).toHaveLength(0);
  await trigger.click();
  await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
  expect(
    screen.container.querySelectorAll("[data-slot=message-step]"),
  ).toHaveLength(2);
  await expectNoA11yViolations(screen.container);
});

test("a step's status is in words, and a failed step gives its reason", async () => {
  const screen = await render(
    <MessageSteps summary="4 steps" defaultOpen>
      <MessageStep label="Done" />
      <MessageStep status="running" label="Working…" />
      <MessageStep status="failed" label="Failed" error="No answer." />
      <MessageStep
        status="stopped"
        label="Halted"
        statusLabels={{ stopped: "Cancelled" }}
      />
    </MessageSteps>,
  );
  const steps = screen.container.querySelectorAll<HTMLElement>(
    "[data-slot=message-step]",
  );
  expect([...steps].map((step) => step.dataset.status)).toEqual([
    "done",
    "running",
    "failed",
    "stopped",
  ]);
  // What a screen reader gets: the icons are hidden, so the words must be there.
  expect(steps[0]!.textContent).toBe("Done:Done");
  expect(steps[2]!.textContent).toContain("Failed:Failed");
  expect(steps[3]!.textContent).toContain("Cancelled:Halted");
  expect(steps[1]!.querySelector("[data-slot=spinner]")).not.toBeNull();
  expect(steps[1]!.querySelector("[role=status]")).toBeNull();
  expect(slot(steps[2]!, "message-step-error")!.textContent).toBe("No answer.");
  await expectNoA11yViolations(screen.container);
});

test("the steps line keeps its muted ink when open", async () => {
  await render(
    <MessageSteps summary="1 step" defaultOpen>
      <MessageStep label="Done" />
    </MessageSteps>,
  );
  const open = page.getByRole("button", { name: "1 step" });
  const ink = getComputedStyle(open.element()).color;
  await render(
    <MessageSteps summary="2 steps">
      <MessageStep label="Done" />
    </MessageSteps>,
  );
  const closed = page.getByRole("button", { name: "2 steps" });
  expect(ink).toBe(getComputedStyle(closed.element()).color);
});

test("a plan says each item's state in words", async () => {
  const items = [
    { id: "a", label: "Read", state: "done" },
    { id: "b", label: "Match", state: "doing" },
    { id: "c", label: "Rate", state: "failed" },
    { id: "d", label: "Update", state: "todo" },
  ] as const;
  const screen = await render(<MessagePlan aria-label="Plan" items={items} />);
  const rows = screen.container.querySelectorAll<HTMLElement>(
    "ol[data-slot=message-plan] > li",
  );
  expect([...rows].map((row) => row.dataset.state)).toEqual([
    "done",
    "doing",
    "failed",
    "todo",
  ]);
  expect(rows[0]!.textContent).toBe("Done:Read");
  await expectNoA11yViolations(screen.container);
  await screen.rerender(
    <MessagePlan
      aria-label="Plan"
      items={items}
      stateLabels={{ done: "Finished" }}
    />,
  );
  expect(
    screen.container.querySelector("[data-slot=message-plan-item]")!
      .textContent,
  ).toBe("Finished:Read");
});

test("status and notice lines stay silent unless marked live", async () => {
  const screen = await render(
    <>
      <MessageStatus>Reading…</MessageStatus>
      <MessageStatus status="error">It stopped.</MessageStatus>
      <MessageNotice action={<Button size="xs">Reply privately</Button>}>
        1 more source is private to you.
      </MessageNotice>
    </>,
  );
  const [progress, error] = screen.container.querySelectorAll<HTMLElement>(
    "[data-slot=message-status]",
  );
  const notice = slot(screen.container, "message-notice")!;
  expect(progress!.dataset.status).toBe("progress");
  expect(error!.dataset.status).toBe("error");
  expect(notice.dataset.status).toBe("info");
  // Inside a role="log" a live part would be read twice, and a past failure would interrupt.
  expect(
    screen.container.querySelector("[role=status],[role=alert]"),
  ).toBeNull();
  expect(notice.textContent).toContain("Reply privately");
  await expectNoA11yViolations(screen.container);
  await screen.rerender(
    <MessageStatus status="error" live>
      It stopped.
    </MessageStatus>,
  );
  expect(screen.container.querySelector("[role=alert]")).not.toBeNull();
});

test("a change row ends with its action; a hand-off is a divider", async () => {
  const undo = vi.fn();
  const screen = await render(
    <>
      <MessageChange
        action={
          <Button size="xs" variant="ghost" onClick={undo}>
            Undo
          </Button>
        }
      >
        Created task SR-41
      </MessageChange>
      <MessageHandoff>Assistant asked BOQ processor</MessageHandoff>
    </>,
  );
  await page.getByRole("button", { name: "Undo" }).click();
  expect(undo).toHaveBeenCalledTimes(1);
  const handoff = slot(screen.container, "message-handoff")!;
  expect(handoff.textContent).toBe("Assistant asked BOQ processor");
  expect(
    handoff.querySelector("[data-slot=separator]")!.getAttribute("aria-hidden"),
  ).toBe("true");
  await expectNoA11yViolations(screen.container);
});

test("sources name their group; the disclaimer is plain muted text", async () => {
  const screen = await render(
    <>
      <MessageSources label="From">
        <Citation href="#a">A note</Citation>
      </MessageSources>
      <MessageDisclaimer>Generated by AI · can make mistakes</MessageDisclaimer>
    </>,
  );
  await expect.element(page.getByRole("group", { name: "From" })).toBeVisible();
  expect(slot(screen.container, "message-disclaimer")!.tagName).toBe("P");
  await expectNoA11yViolations(screen.container);
});

test("actions show on hover or focus and hold their place while hidden", async () => {
  const screen = await render(
    <Message data-testid="message">
      <MessageContent>
        <p>An answer.</p>
        <MessageActions>
          <Button size="icon-xs" variant="ghost" aria-label="Copy" />
        </MessageActions>
      </MessageContent>
    </Message>,
  );
  const row = slot(screen.container, "message-actions")!;
  const height = row.getBoundingClientRect().height;
  expect(row.dataset.reveal).toBe("hover");
  expect(getComputedStyle(row).opacity).toBe("0");
  expect(height).toBeGreaterThanOrEqual(24);
  await page.getByTestId("message").hover();
  await vi.waitFor(() => expect(getComputedStyle(row).opacity).toBe("1"));
  (page.getByRole("button", { name: "Copy" }).element() as HTMLElement).focus();
  await vi.waitFor(() => expect(getComputedStyle(row).opacity).toBe("1"));
  expect(row.getBoundingClientRect().height).toBe(height);
  await expectNoA11yViolations(screen.container);
});

test("outside a Message, hovering the row itself reveals it", async () => {
  const screen = await render(
    <MessageActions data-testid="row">
      <Button size="icon-xs" variant="ghost" aria-label="Copy" />
    </MessageActions>,
  );
  const row = slot(screen.container, "message-actions")!;
  expect(getComputedStyle(row).opacity).toBe("0");
  await page.getByTestId("row").hover();
  await vi.waitFor(() => expect(getComputedStyle(row).opacity).toBe("1"));
});

test("always-on actions never hide", async () => {
  const screen = await render(
    <Message>
      <MessageContent>
        <MessageActions reveal="always">
          <Button size="icon-xs" variant="ghost" aria-label="Copy" />
        </MessageActions>
      </MessageContent>
    </Message>,
  );
  expect(
    getComputedStyle(slot(screen.container, "message-actions")!).opacity,
  ).toBe("1");
});

test("the version switch needs two versions and stops at each end", async () => {
  const onPrevious = vi.fn();
  const onNext = vi.fn();
  const props = { onPrevious, onNext };
  const screen = await render(
    <MessageVersionSwitch current={1} total={1} {...props} />,
  );
  expect(slot(screen.container, "message-version-switch")).toBeNull();
  await screen.rerender(
    <MessageVersionSwitch current={2} total={2} {...props} />,
  );
  const position = slot(screen.container, "message-version-switch-position")!;
  expect(position.textContent).toBe("2 of 2");
  const previous = page.getByRole("button", { name: "Previous version" });
  const next = page.getByRole("button", { name: "Next version" });
  await expect.element(next).toHaveAttribute("aria-disabled", "true");
  await previous.click();
  expect(onPrevious).toHaveBeenCalledTimes(1);
  await expectNoA11yViolations(screen.container);
  await screen.rerender(
    <MessageVersionSwitch current={1} total={2} {...props} />,
  );
  await expect.element(previous).toHaveAttribute("aria-disabled", "true");
  await next.click();
  expect(onNext).toHaveBeenCalledTimes(1);
  await screen.rerender(
    <MessageVersionSwitch current={5} total={2} {...props} />,
  );
  expect(position.textContent).toBe("2 of 2");
});

test("a fold holds long content until Show more", async () => {
  const onOpenChange = vi.fn();
  const screen = await render(
    <MessageFold onOpenChange={onOpenChange}>
      <div style={{ height: 800 }}>Long</div>
    </MessageFold>,
  );
  const content = slot(screen.container, "message-fold-content")!;
  const more = page.getByRole("button", { name: "Show more" });
  await expect.element(more).toBeVisible();
  expect(content.getBoundingClientRect().height).toBeLessThan(400);
  expect(slot(screen.container, "message-fold")!.dataset.folded).toBe("");
  await more.click();
  expect(content.getBoundingClientRect().height).toBe(800);
  expect(onOpenChange).toHaveBeenLastCalledWith(true);
  await expect
    .element(page.getByRole("button", { name: "Show less" }))
    .toBeVisible();
  await expectNoA11yViolations(screen.container);
});

test("content that fits is never folded", async () => {
  const screen = await render(
    <MessageFold>
      <div style={{ height: 100 }}>Short</div>
    </MessageFold>,
  );
  await new Promise((done) => requestAnimationFrame(() => done(null)));
  const root = slot(screen.container, "message-fold")!;
  expect(root.dataset.folded).toBeUndefined();
  expect(getComputedStyle(slot(root, "message-fold-content")!).maskImage).toBe(
    "none",
  );
  expect(screen.container.querySelector("button")).toBeNull();
});

test("an open fold stays open, and tabbing into a folded one opens it", async () => {
  const screen = await render(
    <MessageFold defaultOpen>
      <div style={{ height: 800 }}>Streamed here</div>
    </MessageFold>,
  );
  expect(
    slot(screen.container, "message-fold-content")!.getBoundingClientRect()
      .height,
  ).toBe(800);
  const folded = await render(
    <>
      <button type="button">Before</button>
      <MessageFold>
        <div style={{ height: 700 }} />
        <a href="#deep">Deep link</a>
      </MessageFold>
    </>,
  );
  const more = folded.getByRole("button", { name: "Show more" });
  await expect.element(more).toBeVisible();
  (
    folded.getByRole("button", { name: "Before" }).element() as HTMLElement
  ).focus();
  await userEvent.tab();
  await expect
    .element(folded.getByRole("button", { name: "Show less" }))
    .toBeVisible();
  expect(document.activeElement?.textContent).toBe("Deep link");
});
