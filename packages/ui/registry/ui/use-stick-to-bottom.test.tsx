/**
 * useStickToBottom — the chat thread's follow-the-newest behaviour over `MessageScroller` with the
 * engine's `autoScroll` off. Real Chromium geometry: every assertion measures the viewport.
 */
import "../../test/geometry.css";
import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "./message-scroller";
import { isAtScrollBottom, useStickToBottom } from "./use-stick-to-bottom";

type Controls = {
  stream: (words: string) => void;
  send: () => void;
  shrink: () => void;
};

function Thread({ controls }: { controls: { current: Controls | null } }) {
  const [messages, setMessages] = React.useState(() =>
    Array.from({ length: 8 }, (_, i) => `Message ${i} ${"word ".repeat(30)}`),
  );
  const [live, setLive] = React.useState("");
  const [tall, setTall] = React.useState(true);
  controls.current = {
    stream: (words) => setLive((text) => text + words),
    send: () => setMessages((all) => [...all, `Sent ${all.length}`]),
    shrink: () => setTall(false),
  };
  const stick = useStickToBottom({ follow: messages.length });
  return (
    <MessageScrollerProvider defaultScrollPosition="end">
      <MessageScroller className="h-64 w-72">
        <MessageScrollerViewport ref={stick.attachViewport}>
          <MessageScrollerContent ref={stick.attachContent} className="p-3">
            {messages.map((text, i) => (
              <MessageScrollerItem key={i} messageId={`m${i}`}>
                {text}
              </MessageScrollerItem>
            ))}
            <MessageScrollerItem messageId="live">
              {tall ? <div className="h-24" /> : null}
              <p>{live}</p>
            </MessageScrollerItem>
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton
          direction="end"
          onClick={(event) => {
            event.preventDefault();
            stick.scrollToBottom({ behavior: "smooth" });
          }}
        />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function setup() {
  const controls: { current: Controls | null } = { current: null };
  const screen = await render(<Thread controls={controls} />);
  const viewport = screen.container.querySelector<HTMLElement>(
    '[data-slot="message-scroller-viewport"]',
  )!;
  const atBottom = () => isAtScrollBottom(viewport, 4);
  await expect.poll(atBottom).toBe(true);
  // Items lay out at an estimated height until first seen (`content-visibility: auto`): read the
  // thread once, top to bottom, so a later scroll measures real heights, as a reader's would.
  const jump = screen.container.querySelector<HTMLElement>(
    '[data-slot="message-scroller-button"]',
  )!;
  viewport.scrollTop = 0;
  await expect.poll(() => jump.dataset.active).toBe("true");
  jump.click();
  await expect.poll(atBottom).toBe(true);
  await wait(100);
  return { controls: controls.current!, viewport, atBottom, screen, jump };
}

async function streamFor(controls: Controls, steps: number) {
  for (let step = 0; step < steps; step++) {
    controls.stream("token token token ");
    await wait(20);
  }
  await wait(100);
}

function scrollUp(viewport: HTMLElement, by: number) {
  viewport.dispatchEvent(
    new WheelEvent("wheel", { deltaY: -by, bubbles: true }),
  );
  viewport.scrollTop = Math.max(0, viewport.scrollTop - by);
  viewport.dispatchEvent(new Event("scroll"));
}

test("streamed words keep a reader at the bottom on the newest line", async () => {
  const { controls, atBottom } = await setup();
  await streamFor(controls, 30);
  expect(atBottom()).toBe(true);
});

test("a wheel or key at the bottom that moves nothing never lets go (the engine's autoScroll does)", async () => {
  const { controls, viewport, atBottom } = await setup();
  viewport.dispatchEvent(
    new WheelEvent("wheel", { deltaY: 40, bubbles: true }),
  );
  viewport.dispatchEvent(
    new KeyboardEvent("keydown", { key: " ", bubbles: true }),
  );
  await streamFor(controls, 20);
  expect(atBottom()).toBe(true);
});

test("scrolling up holds the view still as words arrive, and Jump to latest shows", async () => {
  const { controls, viewport, screen } = await setup();
  scrollUp(viewport, 300);
  await wait(50);
  const held = viewport.scrollTop;
  await streamFor(controls, 20);
  expect(viewport.scrollTop).toBe(held);
  const jump = screen.container.querySelector<HTMLElement>(
    '[data-slot="message-scroller-button"]',
  )!;
  await expect.poll(() => jump.dataset.active).toBe("true");
});

test("Jump to latest pins again: the words that follow are followed", async () => {
  const { controls, viewport, atBottom, screen } = await setup();
  scrollUp(viewport, 300);
  await wait(50);
  const jump = screen.container.querySelector<HTMLElement>(
    '[data-slot="message-scroller-button"]',
  )!;
  await expect.poll(() => jump.dataset.active).toBe("true");
  jump.click();
  await expect.poll(atBottom).toBe(true);
  await streamFor(controls, 20);
  expect(atBottom()).toBe(true);
});

test("sending always shows the newest line, even when the reader had scrolled up", async () => {
  const { controls, viewport, atBottom } = await setup();
  scrollUp(viewport, 600);
  await wait(50);
  expect(atBottom()).toBe(false);
  controls.send();
  await expect.poll(atBottom).toBe(true);
  await streamFor(controls, 10);
  expect(atBottom()).toBe(true);
});

test("content that shrinks (an activity block closing) leaves a pinned reader pinned", async () => {
  const { controls, atBottom } = await setup();
  controls.shrink();
  await wait(100);
  expect(atBottom()).toBe(true);
  await streamFor(controls, 20);
  expect(atBottom()).toBe(true);
});

test("isAtScrollBottom measures the gap against the threshold", () => {
  expect(
    isAtScrollBottom({ scrollHeight: 500, scrollTop: 292, clientHeight: 200 }),
  ).toBe(true);
  expect(
    isAtScrollBottom({ scrollHeight: 500, scrollTop: 290, clientHeight: 200 }),
  ).toBe(false);
  expect(
    isAtScrollBottom(
      { scrollHeight: 500, scrollTop: 270, clientHeight: 200 },
      30,
    ),
  ).toBe(true);
});

function Opener() {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <div style={{ height: open ? 600 : 40 }}>Folded answer</div>
      <button type="button" aria-expanded={open} onClick={() => setOpen(true)}>
        Show more
      </button>
    </div>
  );
}

function OpenerThread() {
  const stick = useStickToBottom({ follow: 0 });
  return (
    <MessageScrollerProvider defaultScrollPosition="end">
      <MessageScroller className="h-64 w-72">
        <MessageScrollerViewport ref={stick.attachViewport}>
          <MessageScrollerContent ref={stick.attachContent} className="p-3">
            <MessageScrollerItem messageId="a">
              <div className="h-40" />
            </MessageScrollerItem>
            <MessageScrollerItem messageId="b">
              <Opener />
            </MessageScrollerItem>
          </MessageScrollerContent>
        </MessageScrollerViewport>
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

test("opening something the reader is reading (Show more) never moves the view", async () => {
  const screen = await render(<OpenerThread />);
  const viewport = screen.container.querySelector<HTMLElement>(
    '[data-slot="message-scroller-viewport"]',
  )!;
  await expect.poll(() => isAtScrollBottom(viewport, 4)).toBe(true);
  await wait(100);
  const before = viewport.scrollTop;
  screen.container.querySelector<HTMLButtonElement>("button")!.click();
  await wait(200);
  expect(viewport.scrollTop).toBe(before);
  expect(isAtScrollBottom(viewport, 4)).toBe(false);
});

function PageThread({ controls }: { controls: { current: Controls | null } }) {
  const [messages, setMessages] = React.useState(() =>
    Array.from({ length: 8 }, (_, i) => `Message ${i} ${"word ".repeat(30)}`),
  );
  const [live, setLive] = React.useState("");
  controls.current = {
    stream: (words) => setLive((text) => text + words),
    send: () => setMessages((all) => [...all, `Sent ${all.length}`]),
    shrink: () => undefined,
  };
  const stick = useStickToBottom({ follow: messages.length, scroller: "page" });
  return (
    <div data-testid="page" className="h-64 w-72 overflow-y-auto">
      <header className="h-10">Title</header>
      <div ref={stick.attachContent} className="flex flex-col gap-3 p-3">
        {messages.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
        <p>{live}</p>
      </div>
      <div className="sticky bottom-0 h-12 bg-background">
        <span data-testid="at-bottom">{String(stick.atBottom)}</span>
      </div>
    </div>
  );
}

test("page mode: the page's own scroller follows, lets go on scroll up, and atBottom says so", async () => {
  const controls: { current: Controls | null } = { current: null };
  const screen = await render(<PageThread controls={controls} />);
  const pageEl = screen.container.querySelector<HTMLElement>(
    '[data-testid="page"]',
  )!;
  const flag = () =>
    screen.container.querySelector('[data-testid="at-bottom"]')!.textContent;
  await expect.poll(() => isAtScrollBottom(pageEl, 4)).toBe(true);
  await streamFor(controls.current!, 20);
  expect(isAtScrollBottom(pageEl, 4)).toBe(true);
  expect(flag()).toBe("true");
  scrollUp(pageEl, 300);
  await wait(50);
  const held = pageEl.scrollTop;
  await streamFor(controls.current!, 10);
  expect(pageEl.scrollTop).toBe(held);
  await expect.poll(flag).toBe("false");
  controls.current!.send();
  await expect.poll(() => isAtScrollBottom(pageEl, 4)).toBe(true);
  await expect.poll(flag).toBe("true");
});
