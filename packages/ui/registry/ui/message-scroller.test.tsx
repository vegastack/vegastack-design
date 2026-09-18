/**
 * MessageScroller — upstream's `@shadcn/react` engine plus
 * `packages/ui/upstream/patches/message-scroller.patch`.
 *
 * COMPILED CSS IS LOAD-BEARING HERE. `../../test/geometry.css` compiles the real token theme, so
 * the two assertions that MEASURE rather than read a class string — FOC-9's negative outline offset
 * and the `data-pending-scroll:invisible` recovery — run against the cascade a user gets instead of
 * an unstyled realm where `invisible` and `-outline-offset-2` compile to nothing. axe's
 * `color-contrast` rule is live for the same reason.
 */
import "../../test/geometry.css";
import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from "./message-scroller";

function Thread({
  count = 6,
  busy = false,
  label = "Conversation",
}: {
  count?: number;
  busy?: boolean;
  label?: string;
}) {
  return (
    <MessageScrollerProvider autoScroll defaultScrollPosition="end">
      <MessageScroller className="h-48 w-72">
        <MessageScrollerViewport aria-label={label}>
          <MessageScrollerContent aria-busy={busy}>
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

/** Every `class` attribute in a rendered tree, as one string. */
function renderedClasses(root: Element) {
  return [root, ...root.querySelectorAll("*")]
    .map((element) => element.getAttribute("class") ?? "")
    .join(" ");
}

/** Tab until `element` holds focus. A REAL keyboard path: Chromium withholds `:focus-visible` from
 *  some programmatic focus, which would make an outline assertion a false negative. */
async function tabTo(element: HTMLElement, maximum = 8) {
  for (
    let step = 0;
    step < maximum && document.activeElement !== element;
    step++
  ) {
    await userEvent.tab();
  }
  expect(
    document.activeElement,
    "the keyboard path never reached the element",
  ).toBe(element);
}

// ── structure ─────────────────────────────────────────────────────────────────────────────────

test("renders the scroller structure and exposes every slot", async () => {
  const screen = await render(<Thread />);
  for (const slot of [
    "message-scroller",
    "message-scroller-viewport",
    "message-scroller-content",
    "message-scroller-button",
  ]) {
    expect(
      screen.container.querySelector(`[data-slot="${slot}"]`),
      `missing [data-slot="${slot}"]`,
    ).not.toBeNull();
  }
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

test("both button directions render, each with its own hidden label and data-direction", async () => {
  const screen = await render(
    <MessageScrollerProvider defaultScrollPosition="start">
      <MessageScroller className="h-48 w-72">
        <MessageScrollerViewport aria-label="Conversation">
          <MessageScrollerContent>
            {Array.from({ length: 20 }, (_, i) => (
              <MessageScrollerItem key={i} messageId={`m${i}`}>
                Message {i + 1}
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton direction="start" />
        <MessageScrollerButton direction="end" />
      </MessageScroller>
    </MessageScrollerProvider>,
  );
  await expect
    .element(screen.getByRole("button", { name: "Scroll to start" }))
    .toHaveAttribute("data-direction", "start");
  await expect
    .element(screen.getByRole("button", { name: "Scroll to end" }))
    .toHaveAttribute("data-direction", "end");
});

test("the button's variant and size default to secondary / icon-sm and are forwarded", async () => {
  const screen = await render(
    <MessageScrollerProvider defaultScrollPosition="start">
      <MessageScroller className="h-48 w-72">
        <MessageScrollerViewport aria-label="Conversation">
          <MessageScrollerContent>
            <MessageScrollerItem messageId="only">Message</MessageScrollerItem>
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton direction="end" />
        <MessageScrollerButton direction="start" variant="outline" size="sm">
          Jump to latest
        </MessageScrollerButton>
      </MessageScroller>
    </MessageScrollerProvider>,
  );
  const fallback = screen.container.querySelector(
    '[data-slot="message-scroller-button"][data-direction="end"]',
  )!;
  expect(fallback.getAttribute("data-variant")).toBe("secondary");
  expect(fallback.getAttribute("data-size")).toBe("icon-sm");

  const custom = screen.container.querySelector(
    '[data-slot="message-scroller-button"][data-direction="start"]',
  )!;
  expect(custom.getAttribute("data-variant")).toBe("outline");
  expect(custom.getAttribute("data-size")).toBe("sm");
  expect(custom.textContent).toContain("Jump to latest");
});

// ── the engine contracts the patch claims WITHOUT a hunk ───────────────────────────────────────

test("A11Y-3 (NO HUNK): Content is the transcript's polite log, announcing additions only", async () => {
  const screen = await render(<Thread />);
  const content = screen.container.querySelector(
    '[data-slot="message-scroller-content"]',
  )!;
  // The patch header claims the engine already ships these. If a future @shadcn/react drops them,
  // the claim is false and this fails instead of the page quietly lying.
  expect(content.getAttribute("role")).toBe("log");
  expect(content.getAttribute("aria-relevant")).toBe("additions");
  // A11Y-3's other half: nothing in this component is an `alert`.
  expect(screen.container.querySelector('[role="alert"]')).toBeNull();
});

test("A11Y-4 (NO HUNK): the viewport is the one labelled region, and the log is the one live region", async () => {
  const screen = await render(<Thread label="Support thread" />);
  const viewport = screen.container.querySelector(
    '[data-slot="message-scroller-viewport"]',
  )!;
  expect(viewport.getAttribute("role")).toBe("region");
  expect(viewport.getAttribute("aria-label")).toBe("Support thread");
  // Exactly one live region: adding a `useAnnouncer` beside the engine's `log` would announce
  // every message twice, which is why the patch adds none.
  expect(
    screen.container.querySelectorAll(
      '[role="log"], [role="status"], [aria-live]',
    ).length,
  ).toBe(1);
});

test("the engine's default aria-label is Messages when the consumer passes none", async () => {
  const screen = await render(
    <MessageScrollerProvider defaultScrollPosition="start">
      <MessageScroller className="h-48 w-72">
        <MessageScrollerViewport>
          <MessageScrollerContent>
            <MessageScrollerItem messageId="only">Message</MessageScrollerItem>
          </MessageScrollerContent>
        </MessageScrollerViewport>
      </MessageScroller>
    </MessageScrollerProvider>,
  );
  await expect
    .element(screen.getByRole("region", { name: "Messages" }))
    .toBeInTheDocument();
});

test("FLAGGED FOR MK: the engine makes the viewport a tab stop UNCONDITIONALLY", async () => {
  // `@shadcn/react@0.3.1` writes `tabIndex: value ?? 0` on the viewport with no regard for whether
  // the transcript can scroll at all, so a one-line thread is still a focus stop — the half of
  // A11Y-6 Base UI's `ScrollArea.Viewport` conditions. The component deliberately does NOT patch
  // it (A11Y-6 is not assigned here, and its second clause licenses a named `role="region"`
  // viewport), and the docs page carries the note. This pins the engine's exact shape so the note
  // fails as STALE the day upstream conditions it.
  const screen = await render(
    <MessageScrollerProvider defaultScrollPosition="start">
      <MessageScroller className="h-96 w-72">
        <MessageScrollerViewport aria-label="Conversation">
          <MessageScrollerContent>
            <MessageScrollerItem messageId="only">
              One short message — nothing to scroll.
            </MessageScrollerItem>
          </MessageScrollerContent>
        </MessageScrollerViewport>
      </MessageScroller>
    </MessageScrollerProvider>,
  );
  const viewport = screen.container.querySelector<HTMLElement>(
    '[data-slot="message-scroller-viewport"]',
  )!;
  expect(viewport.scrollHeight).toBeLessThanOrEqual(viewport.clientHeight);
  expect(viewport.getAttribute("tabindex")).toBe("0");
});

// ── the exceptions the patch DOES implement ────────────────────────────────────────────────────

test("FOC-9: the focused viewport pulls the global outline INSIDE the frame's clip", async () => {
  const screen = await render(<Thread />);
  const root = screen.container.querySelector<HTMLElement>(
    '[data-slot="message-scroller"]',
  )!;
  const viewport = screen.container.querySelector<HTMLElement>(
    '[data-slot="message-scroller-viewport"]',
  )!;
  // The premise of the deviation: the frame above the viewport clips, so an OUTWARD offset would
  // be drawn and then cut away.
  expect(getComputedStyle(root).overflow).toBe("hidden");

  await tabTo(viewport);
  expect(viewport.matches(":focus-visible")).toBe(true);
  await Promise.all(
    viewport
      .getAnimations()
      .map((animation) => animation.finished.catch(() => {})),
  );
  const style = getComputedStyle(viewport);
  // base.css's ring still paints — FOC-9 moves the offset and nothing else.
  expect(style.outlineStyle).not.toBe("none");
  expect(Number.parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
  // …and it is drawn INSIDE the border box, which is the whole deviation.
  expect(Number.parseFloat(style.outlineOffset)).toBeLessThan(0);
});

test("FOC-1/FOC-6: no ring-3 and no ring-ring glow anywhere in the rendered tree", async () => {
  const screen = await render(<Thread />);
  const classes = renderedClasses(screen.container);
  expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\//);
});

test("MOT-5: prefers-reduced-motion overrides the engine's smooth default to an instant scroll", async () => {
  // The vendored `@shadcn/react/message-scroller` engine's Button defaults its click-triggered
  // scroll to `behavior: "smooth"` with no reduced-motion awareness, and `base.css`'s global reset
  // cannot reach it — a `scrollTo` that asks for `smooth` explicitly outranks the
  // `scroll-behavior` property. The wrapper is the only place the preference can be honoured.
  // Exercise the real click → scroll path: force genuine scrollable geometry with explicit inline
  // `style`, scroll away from the "start" edge so the button becomes active, then assert the actual
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
  const matchMediaSpy = vi
    .spyOn(window, "matchMedia")
    .mockImplementation(matchMediaMock);

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
    const scrollToSpy = vi
      .spyOn(viewport, "scrollTo")
      .mockImplementation(function scrollToMock(
        this: HTMLElement,
        options?: ScrollToOptions | number,
      ) {
        if (
          options &&
          typeof options === "object" &&
          typeof options.top === "number"
        ) {
          this.scrollTop = options.top;
        }
      } as typeof viewport.scrollTo);

    const button = screen.getByRole("button", { name: "Scroll to end" });
    // Wait for the "end" edge to become reachable (real layout: 30 * 20px content vs an 80px
    // viewport is well past the engine's scroll-edge threshold).
    await expect
      .poll(() => button.element().getAttribute("data-active"), {
        timeout: 2000,
      })
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

// `@shadcn/react` 0.3.1 sets `data-pending-scroll` on the root and the viewport until
// `defaultScrollPosition` is applied, and the recipe answers it with `invisible` so a
// server-rendered transcript never flashes the top of the thread. The failure mode that would
// matter is the attribute STICKING — a permanently invisible viewport. Assert it is gone once
// mounted, for a populated thread and for an empty one (the engine clears it down two paths).
test("data-pending-scroll is cleared after mount so the viewport is never stranded invisible", async () => {
  for (const count of [6, 0]) {
    const screen = await render(<Thread count={count} />);
    const root = screen.container.querySelector(
      '[data-slot="message-scroller"]',
    );
    const viewport = screen.container.querySelector(
      '[data-slot="message-scroller-viewport"]',
    );
    expect(root).not.toBeNull();
    expect(viewport).not.toBeNull();
    // Poll the RENDERED FACT, not one reading of the attribute. Measured 2026-09-18: on an EMPTY
    // transcript the engine clears `data-pending-scroll`, re-applies it once as the content
    // resizes, and clears it again — so a `waitFor` on the attribute alone resolves on the first
    // clear and then reads a viewport that is invisible again. What must be true is that the
    // viewport ENDS UP visible; assert that, then the attribute that drives it.
    await expect
      .poll(() => getComputedStyle(viewport!).visibility, { timeout: 2000 })
      .toBe("visible");
    expect(root!.hasAttribute("data-pending-scroll")).toBe(false);
    expect(viewport!.hasAttribute("data-pending-scroll")).toBe(false);
  }
});

// ── the re-exported hooks ──────────────────────────────────────────────────────────────────────

function HookHarness() {
  const { scrollToEnd, scrollToMessage } = useMessageScroller();
  const { start, end } = useMessageScrollerScrollable();
  const { currentAnchorId, visibleMessageIds } = useMessageScrollerVisibility();
  return (
    <div>
      <p data-testid="scrollable">
        {String(start)}/{String(end)}
      </p>
      <p data-testid="visibility">
        {currentAnchorId ?? "none"}:{visibleMessageIds.length}
      </p>
      <button type="button" onClick={() => scrollToEnd({ behavior: "auto" })}>
        To end
      </button>
      <button
        type="button"
        onClick={() =>
          scrollToMessage("m0", { align: "start", behavior: "auto" })
        }
      >
        To first
      </button>
    </div>
  );
}

test("the re-exported hooks drive and report the viewport", async () => {
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
                scrollAnchor={i % 5 === 0}
                style={{ height: "20px", display: "block" }}
              >
                Message {i + 1}
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
      </MessageScroller>
      <HookHarness />
    </MessageScrollerProvider>,
  );

  const viewport = screen.container.querySelector<HTMLElement>(
    '[data-slot="message-scroller-viewport"]',
  )!;
  // useMessageScrollerScrollable: at the start edge, only the end direction can scroll.
  await expect
    .poll(
      () =>
        screen.container.querySelector('[data-testid="scrollable"]')
          ?.textContent,
    )
    .toBe("false/true");

  await screen.getByRole("button", { name: "To end" }).click();
  await expect.poll(() => viewport.scrollTop).toBeGreaterThan(0);

  await screen.getByRole("button", { name: "To first" }).click();
  await expect.poll(() => viewport.scrollTop).toBe(0);

  // useMessageScrollerVisibility: something is in view and an anchor is current.
  await expect
    .poll(() =>
      Number(
        screen.container
          .querySelector('[data-testid="visibility"]')
          ?.textContent?.split(":")[1] ?? 0,
      ),
    )
    .toBeGreaterThan(0);
});

// ── a11y, per distinct state ───────────────────────────────────────────────────────────────────

test("no a11y violations — populated thread", async () => {
  const screen = await render(<Thread count={4} />);
  await expect
    .element(screen.getByRole("button", { name: "Scroll to end" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — empty thread", async () => {
  const screen = await render(<Thread count={0} />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — streaming (aria-busy on the log)", async () => {
  const screen = await render(<Thread count={4} busy />);
  const content = screen.container.querySelector(
    '[data-slot="message-scroller-content"]',
  )!;
  expect(content.getAttribute("aria-busy")).toBe("true");
  await expectNoA11yViolations(screen.container);
});
