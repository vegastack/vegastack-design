import * as React from "react";
import { render } from "vitest-browser-react";
import { beforeAll, expect, onTestFinished, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import geometryCss from "../../test/geometry.css?inline";
import {
  CommentMargin,
  CommentPopover,
  layoutCommentMargin,
} from "./comment-margin";
import {
  CommentComposer,
  CommentThread,
  CommentThreadSkeleton,
} from "./comments";
import { preloadTextEdit } from "./text-edit";

// The composer's focus cue lives on the real editor, which loads on intent.
beforeAll(() => preloadTextEdit());

const THREAD = {
  id: "t1",
  root: {
    id: "c1",
    author: { name: "Asha Rao" },
    body: "Is 25 A right for a 7 kW cooker?",
    createdAt: Date.now(),
  },
  replies: [],
};

/** Whether a computed `box-shadow` draws anything: Tailwind composes transparent layers for none. */
const drawsShadow = (node: Element) =>
  getComputedStyle(node)
    .boxShadow.split(/,\s*(?=rgb)/)
    .some((layer) => layer !== "none" && !layer.startsWith("rgba(0, 0, 0, 0)"));

const card = (label: string) => (
  <div style={{ height: 60 }} data-testid={label}>
    {label}
  </div>
);

const tops = (container: HTMLElement) =>
  Object.fromEntries(
    [
      ...container.querySelectorAll<HTMLElement>(
        '[data-slot="comment-margin-item"]',
      ),
    ].map((item) => [item.textContent, item.style.top]),
  );

test("cards stack without overlapping, and a null top is not rendered", async () => {
  const items = [
    { id: "a", top: 0, node: card("A") },
    { id: "b", top: 10, node: card("B") },
    { id: "c", top: 20, node: card("C") },
    { id: "gone", top: null, node: card("Gone") },
  ];
  const screen = await render(<CommentMargin items={items} />);
  await vi.waitFor(() =>
    expect(tops(screen.container)).toEqual({
      A: "0px",
      B: "72px",
      C: "144px",
    }),
  );
  expect(screen.container.textContent).not.toContain("Gone");
});

test("the active card sits level with its text and the cards above it move up", async () => {
  const items = [
    { id: "a", top: 0, node: card("A") },
    { id: "b", top: 10, node: card("B") },
    { id: "c", top: 20, node: card("C") },
  ];
  const screen = await render(<CommentMargin items={items} activeId="c" />);
  await vi.waitFor(() =>
    expect(tops(screen.container)).toEqual({
      A: "-124px",
      B: "-52px",
      C: "20px",
    }),
  );
  expect(
    screen.container.querySelector(
      '[data-active][data-slot="comment-margin-item"]',
    )?.textContent,
  ).toBe("C");
  await expectNoA11yViolations(screen.container);
});

test("layoutCommentMargin follows an active card down when it sits below its neighbours", () => {
  const laid = layoutCommentMargin(
    [
      { id: "a", top: 0, height: 60 },
      { id: "b", top: 200, height: 60 },
      { id: "c", top: 210, height: 60 },
    ],
    12,
    "b",
  );
  expect(Object.fromEntries(laid)).toEqual({ a: 0, b: 200, c: 272 });
});

test("CommentPopover shows its thread anchored to the highlight and closes on Escape", async () => {
  const onOpenChange = vi.fn();
  const screen = await render(
    <CommentPopover
      open
      onOpenChange={onOpenChange}
      anchorRect={new DOMRect(40, 40, 80, 18)}
    >
      <p>Thread body</p>
    </CommentPopover>,
  );
  await expect.element(screen.getByText("Thread body")).toBeVisible();
  const popup = document.querySelector('[data-slot="comment-popover"]')!;
  expect(popup).not.toBeNull();
  (popup as HTMLElement).dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
});

/** The compiled tokens and utilities, so a test reads real computed styles. */
function injectCompiledCss() {
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
}

/** What a class resolves to here, read off a real element. */
function resolved(className: string, property: keyof CSSStyleDeclaration) {
  const reference = document.createElement("div");
  reference.className = className;
  document.body.append(reference);
  const value = getComputedStyle(reference)[property];
  reference.remove();
  return value;
}

const ANCHOR = new DOMRect(40, 40, 80, 18);
const popup = () =>
  document.querySelector<HTMLElement>('[data-slot="comment-popover"]')!;
const box = (node: Element) => {
  const style = getComputedStyle(node);
  return {
    border: style.borderTopWidth,
    fill: style.backgroundColor,
    shadow: drawsShadow(node),
  };
};
const popover = (children: React.ReactNode) => (
  <CommentPopover open onOpenChange={() => {}} anchorRect={ANCHOR}>
    {children}
  </CommentPopover>
);

for (const theme of ["light", "dark"]) {
  test(`CommentPopover in ${theme} is the floating surface, with one border, one fill and one shadow`, async () => {
    injectCompiledCss();
    document.documentElement.classList.toggle("dark", theme === "dark");
    onTestFinished(() => document.documentElement.classList.remove("dark"));
    const fill = resolved("bg-popover", "backgroundColor");
    const ink = resolved("text-popover-foreground", "color");
    const radius = resolved("rounded-lg", "borderTopLeftRadius");

    const thread = await render(
      popover(<CommentThread thread={THREAD} active />),
    );
    await expect.poll(() => popup()?.querySelector("article")).toBeTruthy();
    expect(box(popup())).toEqual({ border: "1px", fill, shadow: true });
    expect(getComputedStyle(popup()).borderTopLeftRadius).toBe(radius);
    expect(getComputedStyle(popup()).color).toBe(ink);
    expect(box(popup().querySelector('[data-slot="comment-thread"]')!)).toEqual(
      {
        border: "0px",
        fill: "rgba(0, 0, 0, 0)",
        shadow: false,
      },
    );
    await thread.unmount();

    // A composer's box is the one border.
    const composer = await render(
      popover(<CommentComposer onSubmit={() => {}} />),
    );
    await expect
      .poll(() => popup()?.querySelector('[data-slot="comment-box"]'))
      .toBeTruthy();
    expect(box(popup())).toEqual({ border: "0px", fill, shadow: true });
    const field = popup().querySelector<HTMLElement>(
      '[data-slot="comment-box"] > *',
    )!;
    expect(box(field).border).toBe("1px");

    // ...and it keeps text entry's focus cue: the border darkens while the editor holds focus.
    const rest = resolved("border border-input", "borderTopColor");
    const focused = resolved("border border-ring/50", "borderTopColor");
    const editor = await vi.waitFor(() => {
      const node = field.querySelector<HTMLElement>("[contenteditable=true]");
      expect(node).not.toBeNull();
      return node!;
    });
    editor.blur();
    await expect.poll(() => getComputedStyle(field).borderTopColor).toBe(rest);
    editor.focus();
    await expect
      .poll(() => getComputedStyle(field).borderTopColor)
      .toBe(focused);
    await composer.unmount();
  });
}

test("CommentPopover: a skeleton gives up its border, and a composer beside a thread leaves the popup its edge", async () => {
  injectCompiledCss();
  const skeleton = await render(popover(<CommentThreadSkeleton />));
  await expect
    .poll(() => popup()?.querySelector('[data-slot="comment-thread-skeleton"]'))
    .toBeTruthy();
  expect(box(popup()).border).toBe("1px");
  expect(
    box(popup().querySelector('[data-slot="comment-thread-skeleton"]')!).border,
  ).toBe("0px");
  await skeleton.unmount();

  await render(
    popover(
      <>
        <CommentThread thread={THREAD} />
        <CommentComposer onSubmit={() => {}} />
      </>,
    ),
  );
  await expect
    .poll(() => popup()?.querySelector('[data-slot="comment-box"]'))
    .toBeTruthy();
  expect(box(popup()).border).toBe("1px");
});

test("CommentPopover: a composer's error, hint and count keep off the edge the popup no longer draws", async () => {
  injectCompiledCss();
  await render(
    popover(
      <CommentComposer
        onSubmit={() => {}}
        defaultValue="Too long"
        error="Couldn't post"
        hint="Everyone on this page can read this"
        maxLength={4}
      />,
    ),
  );
  await expect
    .poll(() => popup()?.querySelector('[data-slot="comment-composer-hint"]'))
    .toBeTruthy();
  // Measured once the popup's zoom-in has settled.
  await expect.poll(() => popup().getAnimations().length).toBe(0);
  const edge = popup().getBoundingClientRect();
  const hint = popup().querySelector('[data-slot="comment-composer-hint"]')!;
  const error = popup().querySelector('[role="alert"]')!;
  const counter = popup().querySelector('[data-slot="comment-box-counter"]')!;
  for (const text of [hint, error]) {
    const range = document.createRange();
    range.selectNodeContents(text);
    expect(range.getBoundingClientRect().left - edge.left).toBe(12);
  }
  const count = document.createRange();
  // The figures a reader sees: the counter also holds a screen reader's sentence.
  count.selectNodeContents(counter.querySelector('[aria-hidden="true"]')!);
  expect(edge.right - count.getBoundingClientRect().right).toBe(12);
  // The last line keeps off the popup's end; the count, with lines after it, leaves that to them.
  expect(getComputedStyle(hint).paddingBottom).toBe("8px");
  expect(getComputedStyle(counter).paddingBottom).toBe("0px");
});

test("CommentPopover: a count alone under the box keeps off the popup's end", async () => {
  injectCompiledCss();
  await render(
    popover(
      <CommentComposer onSubmit={() => {}} defaultValue="Hi!" maxLength={3} />,
    ),
  );
  await expect
    .poll(() => popup()?.querySelector('[data-slot="comment-box-counter"]'))
    .toBeTruthy();
  expect(
    getComputedStyle(
      popup().querySelector('[data-slot="comment-box-counter"]')!,
    ).paddingBottom,
  ).toBe("8px");
});

test("CommentPopover closing with no rect and no content leaves whole and in place, then goes", async () => {
  injectCompiledCss();
  // Long enough to measure the exit; the real one is 100ms.
  const slow = document.createElement("style");
  slow.textContent =
    '[data-slot="comment-popover"][data-closed] { animation-duration: 1s !important; }';
  document.head.append(slow);
  onTestFinished(() => slow.remove());
  const wrap = (
    open: boolean,
    rect: DOMRect | null,
    children: React.ReactNode,
  ) => (
    <CommentPopover open={open} onOpenChange={() => {}} anchorRect={rect}>
      {children}
    </CommentPopover>
  );
  const screen = await render(wrap(true, ANCHOR, <p>Thread body</p>));
  await expect.element(screen.getByText("Thread body")).toBeVisible();
  await expect.poll(() => popup().getAnimations().length).toBe(0);
  const before = popup().getBoundingClientRect();

  // The web app's order: all three in one render.
  await screen.rerender(wrap(false, null, null));
  await expect.poll(() => popup()?.hasAttribute("data-closed")).toBe(true);
  expect(popup().textContent).toBe("Thread body");
  // Anything that makes it place itself again mid-exit (a resize, a scroll) reads the last rect.
  window.dispatchEvent(new Event("resize"));
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(popup()?.hasAttribute("data-closed")).toBe(true);
  const leaving = popup().getBoundingClientRect();
  expect(leaving.top).toBeGreaterThan(40);
  expect(leaving.height).toBeGreaterThan(before.height / 2);

  await expect.poll(popup, { timeout: 3000 }).toBeNull();

  // Open again: the new content, not the old.
  await screen.rerender(wrap(true, ANCHOR, <p>Next thread</p>));
  await expect.element(screen.getByText("Next thread")).toBeVisible();
  expect(popup().textContent).toBe("Next thread");
});

test("a thread and a composer beside an open popover keep their own surfaces", async () => {
  injectCompiledCss();
  await render(
    <>
      <CommentMargin
        items={[
          {
            id: "t1",
            top: 0,
            node: <CommentThread thread={THREAD} active />,
          },
        ]}
      />
      <CommentComposer onSubmit={() => {}} />
      {popover(<CommentThread thread={{ ...THREAD, id: "t2" }} active />)}
    </>,
  );
  await expect.poll(() => popup()?.querySelector("article")).toBeTruthy();
  const margin = document.querySelector(
    '[data-slot="comment-margin"] [data-slot="comment-thread"]',
  )!;
  expect(box(margin).border).toBe("1px");
  expect(box(margin).fill).not.toBe("rgba(0, 0, 0, 0)");
  await expect.poll(() => drawsShadow(margin)).toBe(true);
  const outside = [
    ...document.querySelectorAll<HTMLElement>('[data-slot="comment-box"] > *'),
  ].find((node) => !popup().contains(node))!;
  expect(box(outside).border).toBe("1px");
  const hintless = outside.closest('[data-slot="comment-composer"]')!;
  expect(getComputedStyle(hintless).paddingLeft).toBe("0px");
});

test("quote={false} hides each card's quote, and a thread header left with nothing else; the default keeps it", async () => {
  const thread = (id: string, resolve: boolean) => (
    <article data-slot="comment-thread" data-testid={id}>
      <div data-slot="comment-thread-header">
        <div>
          <blockquote data-slot="comment-thread-quote">
            The quoted words
          </blockquote>
        </div>
        {resolve ? <button type="button">Resolve</button> : null}
      </div>
      <p>First comment</p>
    </article>
  );
  const items = [
    { id: "a", top: 0, node: thread("a", false) },
    { id: "b", top: 200, node: thread("b", true) },
  ];
  // The hiding is CSS: compile it.
  const sheet = document.createElement("style");
  sheet.textContent = geometryCss;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
  const shown = (el: Element | null) =>
    !!el && getComputedStyle(el).display !== "none";
  const screen = await render(<CommentMargin items={items} />);
  const quotes = () =>
    [
      ...screen.container.querySelectorAll("[data-slot=comment-thread-quote]"),
    ].map(shown);
  expect(quotes()).toEqual([true, true]);
  await screen.rerender(<CommentMargin items={items} quote={false} />);
  expect(
    screen.container
      .querySelector("[data-slot=comment-margin]")
      ?.getAttribute("data-quote"),
  ).toBe("hidden");
  expect(quotes()).toEqual([false, false]);
  const header = (id: string) =>
    screen.container.querySelector(
      `[data-testid=${id}] [data-slot=comment-thread-header]`,
    );
  // A header with only the quote goes; one with the resolve control stays.
  expect(shown(header("a"))).toBe(false);
  expect(shown(header("b"))).toBe(true);
  await expectNoA11yViolations(screen.container);
});
