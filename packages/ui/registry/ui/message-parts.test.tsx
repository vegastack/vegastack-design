import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Button } from "./button";
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

test("a step shows its state, and a failed step its reason", async () => {
  const screen = await render(
    <MessageSteps summary="3 steps" defaultOpen>
      <MessageStep label="Done" />
      <MessageStep status="running" label="Working…" />
      <MessageStep status="failed" label="Failed" error="No answer." />
    </MessageSteps>,
  );
  const steps = screen.container.querySelectorAll<HTMLElement>(
    "[data-slot=message-step]",
  );
  expect([...steps].map((step) => step.dataset.status)).toEqual([
    "done",
    "running",
    "failed",
  ]);
  expect(steps[1]!.querySelector("[data-slot=spinner]")).not.toBeNull();
  expect(steps[1]!.querySelector("[role=status]")).toBeNull();
  expect(slot(steps[2]!, "message-step-error")!.textContent).toBe("No answer.");
  await expectNoA11yViolations(screen.container);
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

test("status lines keep StatusLine's roles under their own slots", async () => {
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
  expect(progress!.dataset.status).toBe("progress");
  expect(progress!.getAttribute("role")).toBe("status");
  expect(error!.getAttribute("role")).toBe("alert");
  const notice = slot(screen.container, "message-notice")!;
  expect(notice.dataset.status).toBe("info");
  expect(notice.textContent).toContain("Reply privately");
  await expectNoA11yViolations(screen.container);
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
  expect(slot(screen.container, "message-handoff")!.textContent).toBe(
    "Assistant asked BOQ processor",
  );
  await expectNoA11yViolations(screen.container);
});

test("sources name their group; the disclaimer is plain muted text", async () => {
  const screen = await render(
    <>
      <MessageSources label="From">
        <a href="#a">A note</a>
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
    <Message>
      <MessageContent>
        <p>An answer.</p>
        <MessageActions>
          <Button size="icon-xs" variant="ghost" aria-label="Copy" />
        </MessageActions>
      </MessageContent>
    </Message>,
  );
  const row = slot(screen.container, "message-actions")!;
  expect(row.dataset.reveal).toBe("hover");
  expect(getComputedStyle(row).opacity).toBe("0");
  expect(row.getBoundingClientRect().height).toBeGreaterThan(0);
  const copy = page.getByRole("button", { name: "Copy" });
  (copy.element() as HTMLElement).focus();
  await vi.waitFor(() => expect(getComputedStyle(row).opacity).toBe("1"));
  await expectNoA11yViolations(screen.container);
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
  const screen = await render(
    <MessageVersionSwitch current={1} total={1} onPrevious={onPrevious} />,
  );
  expect(slot(screen.container, "message-version-switch")).toBeNull();
  await screen.rerender(
    <MessageVersionSwitch current={2} total={2} onPrevious={onPrevious} />,
  );
  expect(slot(screen.container, "message-version-position")!.textContent).toBe(
    "2 of 2",
  );
  await expect
    .element(page.getByRole("button", { name: "Next version" }))
    .toHaveAttribute("aria-disabled", "true");
  await page.getByRole("button", { name: "Previous version" }).click();
  expect(onPrevious).toHaveBeenCalledTimes(1);
  await expectNoA11yViolations(screen.container);
});

test("a fold holds long content until Show more, and short content not at all", async () => {
  const screen = await render(
    <MessageFold>
      <div style={{ height: 800 }}>Long</div>
    </MessageFold>,
  );
  const content = slot(screen.container, "message-fold-content")!;
  expect(content.getBoundingClientRect().height).toBeLessThan(400);
  await page.getByRole("button", { name: "Show more" }).click();
  expect(content.getBoundingClientRect().height).toBe(800);
  await expect
    .element(page.getByRole("button", { name: "Show less" }))
    .toHaveAttribute("aria-expanded", "true");
  await expectNoA11yViolations(screen.container);
  await screen.rerender(
    <MessageFold foldable={false}>
      <div style={{ height: 800 }}>Short</div>
    </MessageFold>,
  );
  expect(screen.container.querySelector("button")).toBeNull();
});
