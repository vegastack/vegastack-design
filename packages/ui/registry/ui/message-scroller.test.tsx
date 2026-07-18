import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "./message-scroller";

function Thread({ count = 6 }: { count?: number }) {
  return (
    <MessageScrollerProvider autoScroll defaultScrollPosition="end">
      <MessageScroller className="h-48 w-72">
        <MessageScrollerViewport aria-label="Conversation">
          <MessageScrollerContent>
            {Array.from({ length: count }, (_, i) => (
              <MessageScrollerItem key={i} messageId={`m${i}`}>
                Message {i + 1}
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton direction="end" />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

test("renders the scroller structure and exposes its slots", async () => {
  const screen = await render(<Thread />);
  expect(
    screen.container.querySelector('[data-slot="message-scroller"]'),
  ).not.toBeNull();
  expect(
    screen.container.querySelector('[data-slot="message-scroller-viewport"]'),
  ).not.toBeNull();
  expect(
    screen.container.querySelector('[data-slot="message-scroller-content"]'),
  ).not.toBeNull();
  expect(
    screen.container.querySelectorAll('[data-slot="message-scroller-item"]')
      .length,
  ).toBe(6);
});

test("the scroll button carries an accessible label and direction", async () => {
  const screen = await render(<Thread />);
  const btn = screen.getByRole("button", { name: "Scroll to end" });
  await expect.element(btn).toBeInTheDocument();
  await expect
    .element(btn)
    .toHaveAttribute("data-slot", "message-scroller-button");
  await expect.element(btn).toHaveAttribute("data-direction", "end");
});

test("no a11y violations", async () => {
  const screen = await render(<Thread count={4} />);
  await expect
    .element(screen.getByRole("button", { name: "Scroll to end" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

test("prefers-reduced-motion overrides the primitive's smooth default to an instant scroll", async () => {
  // The vendored `@shadcn/react/message-scroller` primitive's Button defaults its click-triggered
  // scroll to `behavior: "smooth"` with no reduced-motion awareness (see the wrapper's JSDoc).
  // Exercise the real click → scroll path: force genuine scrollable geometry with explicit inline
  // `style` (this suite compiles no Tailwind, so the component's own classes lay out as plain
  // blocks — inline styles are a real, non-Tailwind way to get a real scrollable viewport), scroll
  // away from the "start" edge so the button becomes active or clickable, then assert the actual
  // `viewport.scrollTo` call used `behavior: "auto"` once `prefers-reduced-motion: reduce` matches.
  const matchMediaMock = vi.fn((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)",
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
  const matchMediaSpy = vi.spyOn(window, "matchMedia").mockImplementation(matchMediaMock);

  try {
    const screen = await render(
      <MessageScrollerProvider defaultScrollPosition="start">
        <MessageScroller style={{ height: "80px", width: "200px" }}>
          <MessageScrollerViewport
            aria-label="Conversation"
            style={{ height: "80px", overflowY: "auto", display: "block" }}
          >
            <MessageScrollerContent style={{ display: "block" }}>
              {Array.from({ length: 30 }, (_, i) => (
                <MessageScrollerItem
                  key={i}
                  messageId={`m${i}`}
                  style={{ height: "20px", display: "block" }}
                >
                  Message {i + 1}
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton direction="end" />
        </MessageScroller>
      </MessageScrollerProvider>,
    );

    const viewport = document.querySelector<HTMLElement>(
      '[data-slot="message-scroller-viewport"]',
    )!;
    const scrollToSpy = vi.spyOn(viewport, "scrollTo").mockImplementation(
      function scrollToMock(this: HTMLElement, options?: ScrollToOptions | number) {
        if (options && typeof options === "object" && typeof options.top === "number") {
          this.scrollTop = options.top;
        }
      } as typeof viewport.scrollTo,
    );

    const button = screen.getByRole("button", { name: "Scroll to end" });
    // Wait for the "end" edge to become reachable (real layout: 30 * 20px content vs an 80px
    // viewport is well past the primitive's scroll-edge threshold).
    await expect
      .poll(() => button.element().getAttribute("data-active"), { timeout: 2000 })
      .toBe("true");

    scrollToSpy.mockClear();
    await button.click();

    expect(scrollToSpy).toHaveBeenCalled();
    const options = scrollToSpy.mock.calls.at(-1)?.[0] as ScrollToOptions;
    expect(options.behavior).toBe("auto");
  } finally {
    matchMediaSpy.mockRestore();
  }
});
