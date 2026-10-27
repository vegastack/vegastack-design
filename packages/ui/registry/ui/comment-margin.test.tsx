import { render } from "vitest-browser-react";
import { expect, onTestFinished, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import geometryCss from "../../test/geometry.css?inline";
import {
  CommentMargin,
  CommentPopover,
  layoutCommentMargin,
} from "./comment-margin";

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
