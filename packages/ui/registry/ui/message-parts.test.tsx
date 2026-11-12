import * as React from "react";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Button } from "./button";
import { Citation } from "./cited-list";
import { CopyButton } from "./copy-button";
import { Message, MessageContent } from "./message";
import { Toggle } from "./toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import {
  MessageActions,
  MessageActivity,
  MessageActivityNote,
  MessageActivityResults,
  MessageActivityStep,
  MessageBubble,
  MessageChange,
  MessageDisclaimer,
  MessageFold,
  foldLineCut,
  MessageHandoff,
  MessageNotice,
  MessagePlan,
  MessageSourceList,
  MessageSources,
  MessageStatus,
  MessageTime,
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
    <>
      <div data-testid="rest" className="h-8 w-8" />
      <MessageSteps summary="1 step" defaultOpen>
        <MessageStep label="Done" />
      </MessageSteps>
    </>,
  );
  // The pointer may still rest where an earlier test clicked; park it away from both lines.
  await userEvent.hover(page.getByTestId("rest"));
  const open = page.getByRole("button", { name: "1 step" });
  await render(
    <MessageSteps summary="2 steps">
      <MessageStep label="Done" />
    </MessageSteps>,
  );
  const closed = page.getByRole("button", { name: "2 steps" });
  // Polled: the Button's colour transition can still be running on a loaded runner.
  await expect
    .poll(
      () =>
        getComputedStyle(open.element()).color ===
        getComputedStyle(closed.element()).color,
    )
    .toBe(true);
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

const SOURCES = [
  {
    href: "https://ies.org/tm-21",
    title: "TM-21-21",
    site: "ies.org",
    icon: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  },
  { href: "https://energystar.gov/lm80", title: null, site: "energystar.gov" },
  {
    href: "https://a.example/1",
    title: "Three",
    site: "a.example",
    icon: "/no-such-icon.png",
  },
  { href: "https://b.example/2", title: "Four", site: "b.example" },
  { href: "https://c.example/3", title: "Five", site: "c.example" },
];

test("a person's message: muted surface, foreground ink, kept line breaks, reading metrics", async () => {
  const screen = await render(
    <Message align="end">
      <MessageContent>
        <MessageBubble>{"First line\nSecond line"}</MessageBubble>
        <MessageTime date={Date.now() - 120_000} />
      </MessageContent>
    </Message>,
  );
  const bubble = slot(screen.container, "bubble")!;
  expect(bubble.dataset.variant).toBe("muted");
  expect(bubble.dataset.align).toBe("end");
  const content = slot(screen.container, "bubble-content")!;
  const style = getComputedStyle(content);
  expect(style.whiteSpace).toBe("pre-wrap");
  // The reading body: 14/24, or 16/26 on a coarse pointer or a narrow window.
  expect([
    ["14px", "24px"],
    ["16px", "26px"],
  ]).toContainEqual([style.fontSize, style.lineHeight]);
  // Two typed lines are two rendered lines.
  expect(content.getBoundingClientRect().height).toBeGreaterThan(
    2 * parseFloat(style.lineHeight),
  );
  const time = slot(screen.container, "message-time")!;
  expect(time.textContent).toBe("2m ago");
  expect(time.dataset.reveal).toBe("always");
  await expectNoA11yViolations(screen.container);
});

test("an answer's time shows on hover or focus, like its actions", async () => {
  const screen = await render(
    <Message>
      <MessageContent>
        <p>Answer</p>
        <MessageTime date={Date.now()} reveal="hover" />
      </MessageContent>
    </Message>,
  );
  const time = slot(screen.container, "message-time")!;
  expect(getComputedStyle(time).opacity).toBe("0");
  await userEvent.hover(slot(screen.container, "message")!);
  await vi.waitFor(() => expect(getComputedStyle(time).opacity).toBe("1"));
});

test("every button in the actions row, wrapped in a trigger or not, is one 28px square with a 16px icon", async () => {
  const icon = <svg aria-hidden viewBox="0 0 24 24" />;
  const screen = await render(
    <MessageActions reveal="always">
      <Button size="icon-xs" variant="ghost" aria-label="Copy">
        {icon}
      </Button>
      <CopyButton value="An answer" size="icon-xs" />
      <Button size="icon-sm" variant="ghost" aria-label="Retry">
        <svg aria-hidden data-icon="inline-end" viewBox="0 0 24 24" />
      </Button>
      <Toggle aria-label="Helpful">
        <svg aria-hidden data-icon="inline-start" viewBox="0 0 24 24" />
      </Toggle>
      <Tooltip>
        <TooltipTrigger render={<Toggle aria-label="Not helpful" />}>
          <span>{icon}</span>
        </TooltipTrigger>
        <TooltipContent>Not helpful</TooltipContent>
      </Tooltip>
    </MessageActions>,
  );
  const buttons = Array.from(
    screen.container.querySelectorAll<HTMLElement>("button"),
  );
  expect(buttons).toHaveLength(5);
  for (const button of buttons) {
    const box = button.getBoundingClientRect();
    expect([box.width, box.height]).toEqual([28, 28]);
    const { paddingLeft, paddingRight } = getComputedStyle(button);
    expect([paddingLeft, paddingRight]).toEqual(["0px", "0px"]);
    // The computed size, not the box: CopyButton's icon pops in with a scale.
    const glyph = getComputedStyle(button.querySelector("svg")!);
    expect([glyph.width, glyph.height]).toEqual(["16px", "16px"]);
  }
});

test("the source list: closed, three icons and a count; open, numbered links with a globe for a missing icon", async () => {
  const screen = await render(<MessageSourceList sources={SOURCES} />);
  const trigger = page.getByRole("button", { name: "Sources · 5" });
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  const icons = screen.container.querySelectorAll(
    "[data-slot=message-source-list-trigger] [data-slot=message-site-icon]",
  );
  expect(icons).toHaveLength(3);
  // No letter avatars: an icon is an image or a globe, never text.
  for (const icon of icons) expect(icon.textContent).toBe("");
  await trigger.click();
  const links = screen.container.querySelectorAll<HTMLAnchorElement>(
    "[data-slot=message-source]",
  );
  expect(links).toHaveLength(5);
  expect(links[0]!.getAttribute("target")).toBe("_blank");
  expect(links[0]!.getAttribute("rel")).toBe("noreferrer noopener");
  // A missing title shows the site; the failing icon falls back to the globe.
  expect(links[1]!.textContent).toContain("energystar.gov");
  await vi.waitFor(
    () =>
      expect(
        links[2]!.querySelector("[data-slot=message-site-icon] svg"),
        links[2]!.innerHTML,
      ).not.toBeNull(),
    { timeout: 5000 },
  );
  expect(links[0]!.querySelector("img")).not.toBeNull();
  await expectNoA11yViolations(screen.container);
  const empty = await render(<MessageSourceList sources={[]} />);
  expect(empty.container.innerHTML).toBe("");
});

test("activity: a done summary with its time opens to notes and steps; a step opens its results", async () => {
  const screen = await render(
    <MessageActivity summary="Searched the web · 2 searches" ms={14_000}>
      <MessageActivityNote>Planning a search.</MessageActivityNote>
      <MessageActivityStep
        label="Searched the web"
        detail="TM-21"
        meta="1 result"
      >
        <MessageActivityResults results={SOURCES.slice(0, 1)} />
      </MessageActivityStep>
      <MessageActivityStep
        status="failed"
        label="Opened"
        detail="ies.org"
        error="No answer."
      />
    </MessageActivity>,
  );
  const trigger = page.getByRole("button", {
    name: /Searched the web · 2 searches · 14s/,
  });
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect.element(page.getByText("Planning a search.")).toBeVisible();
  const step = page.getByRole("button", {
    name: /Done: Searched the web TM-21/,
  });
  await expect.element(step).toHaveAttribute("aria-expanded", "false");
  // Keyboard: Enter opens the nested step, and its results are links.
  (step.element() as HTMLElement).focus();
  await userEvent.keyboard("{Enter}");
  await expect.element(step).toHaveAttribute("aria-expanded", "true");
  await expect
    .element(page.getByRole("list", { name: "Results" }))
    .toBeVisible();
  await expect
    .element(page.getByRole("link", { name: /TM-21-21/ }))
    .toHaveAttribute("href", "https://ies.org/tm-21");
  const failed = screen.container.querySelector<HTMLElement>(
    "[data-slot=message-activity-step][data-status=failed]",
  )!;
  expect(failed.textContent).toContain("Failed:");
  expect(failed.textContent).toContain("No answer.");
  await expectNoA11yViolations(screen.container);
});

test("activity while running shimmers and counts up", async () => {
  const screen = await render(
    <MessageActivity
      running
      startedAt={Date.now() - 5_000}
      summary="Searching the web"
    />,
  );
  const summary = slot(screen.container, "message-activity-summary")!;
  expect(summary.className).toContain("shimmer");
  await vi.waitFor(() =>
    expect(
      slot(screen.container, "message-activity-time")?.textContent,
    ).toMatch(/^· [56]s$/),
  );
  expect(
    slot(screen.container, "message-activity-time")!.getAttribute(
      "aria-hidden",
    ),
  ).toBe("true");
  await expectNoA11yViolations(screen.container);
});

test("activity opens while running, closes once a second after, and stays as the reader leaves it", async () => {
  function Turn() {
    const [running, setRunning] = React.useState(true);
    return (
      <>
        <button type="button" onClick={() => setRunning((value) => !value)}>
          Toggle run
        </button>
        <MessageActivity running={running} summary="Working">
          <MessageActivityNote>Planning.</MessageActivityNote>
        </MessageActivity>
      </>
    );
  }
  await render(<Turn />);
  const trigger = page.getByRole("button", { name: /Working/ });
  await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "Toggle run" }).click();
  await vi.waitFor(
    () => expect(trigger.element().getAttribute("aria-expanded")).toBe("false"),
    { timeout: 3000 },
  );
  // The reader opens it; a new run and its end never close it again.
  await trigger.click();
  await page.getByRole("button", { name: "Toggle run" }).click();
  await page.getByRole("button", { name: "Toggle run" }).click();
  await new Promise((resolve) => setTimeout(resolve, 1300));
  await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
});

test("a fold ends between two lines of text, never through one", async () => {
  const screen = await render(
    <div style={{ width: 240 }}>
      <MessageFold>
        <p style={{ lineHeight: "30px", fontSize: 14, margin: 0 }}>
          {"word ".repeat(400)}
        </p>
      </MessageFold>
    </div>,
  );
  const content = slot(screen.container, "message-fold-content")!;
  await expect
    .element(page.getByRole("button", { name: "Show more" }))
    .toBeVisible();
  // 20rem is 320px, which falls through the 11th 30px line (300–330): its text crosses it.
  await expect
    .poll(() => content.getBoundingClientRect().height)
    .toBeLessThan(320);
  const height = content.getBoundingClientRect().height;
  const top = content.getBoundingClientRect().top;
  const range = document.createRange();
  range.selectNodeContents(content.querySelector("p")!.firstChild!);
  const rects = [...range.getClientRects()];
  expect(rects.length).toBeGreaterThan(11);
  for (const rect of rects)
    expect(rect.top - top < height && rect.bottom - top > height + 0.5).toBe(
      false,
    );
});

test("foldLineCut keeps the limit when no text crosses it", async () => {
  const screen = await render(<div style={{ height: 400 }} />);
  expect(
    foldLineCut(screen.container.firstElementChild as HTMLElement, 320),
  ).toBe(320);
});
