import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { StaggeredTextReveal } from "./staggered-text-reveal";

test("splits text into one word span per whitespace-separated word, in order", async () => {
  const screen = await render(
    <StaggeredTextReveal text="Ship agentic UI, fast." />,
  );
  const root = screen.container.querySelector(
    '[data-slot="staggered-text-reveal"]',
  ) as HTMLElement;
  expect(root.textContent).toBe("Ship agentic UI, fast.");
  const words = screen.container.querySelectorAll(
    '[data-slot="staggered-text-reveal-word"]',
  );
  expect(Array.from(words).map((w) => w.textContent)).toEqual([
    "Ship",
    "agentic",
    "UI,",
    "fast.",
  ]);
});

test("collapses repeated whitespace and ignores leading/trailing whitespace", async () => {
  const screen = await render(<StaggeredTextReveal text="  one   two  " />);
  const words = screen.container.querySelectorAll(
    '[data-slot="staggered-text-reveal-word"]',
  );
  expect(words.length).toBe(2);
});

test("each word carries a deterministic, index-derived --stagger-i custom property", async () => {
  const screen = await render(<StaggeredTextReveal text="one two three" />);
  const words = Array.from(
    screen.container.querySelectorAll(
      '[data-slot="staggered-text-reveal-word"]',
    ),
  ) as HTMLElement[];
  expect(words.map((w) => w.style.getPropertyValue("--stagger-i"))).toEqual([
    "0",
    "1",
    "2",
  ]);
});

test("stepMultiplier scales the --stagger-step custom property", async () => {
  const screen = await render(
    <StaggeredTextReveal text="one two" stepMultiplier={2} />,
  );
  const word = screen.container.querySelector(
    '[data-slot="staggered-text-reveal-word"]',
  ) as HTMLElement;
  expect(word.style.getPropertyValue("--stagger-step")).toBe(
    "calc(var(--duration-fast) * 2)",
  );
});

test("every word carries the shared motion-enter-up utility once revealed", async () => {
  const screen = await render(<StaggeredTextReveal text="one two" />);
  const words = screen.container.querySelectorAll(
    '[data-slot="staggered-text-reveal-word"]',
  );
  words.forEach((w) =>
    expect(w.classList.contains("motion-enter-up")).toBe(true),
  );
});

test("text rendered on screen reveals immediately — no wasted frame", async () => {
  // The gate must not hide text that is already in view: the CSS animation has started,
  // and pulling it back would be a visible flash.
  const screen = await render(<StaggeredTextReveal text="one two" />);
  const root = screen.container.querySelector(
    '[data-slot="staggered-text-reveal"]',
  ) as HTMLElement;
  expect(root.hasAttribute("data-revealed")).toBe(true);
});

test("whenVisible={false} opts out of the gate entirely", async () => {
  const screen = await render(
    <StaggeredTextReveal text="one two" whenVisible={false} />,
  );
  const root = screen.container.querySelector(
    '[data-slot="staggered-text-reveal"]',
  ) as HTMLElement;
  expect(root.hasAttribute("data-revealed")).toBe(true);
  const words = screen.container.querySelectorAll(
    '[data-slot="staggered-text-reveal-word"]',
  );
  words.forEach((w) =>
    expect(w.classList.contains("motion-enter-up")).toBe(true),
  );
});

test("text far below the fold holds at the FROM state until it scrolls in", async () => {
  const screen = await render(
    <div style={{ paddingTop: "300vh" }}>
      <StaggeredTextReveal text="one two" />
    </div>,
  );
  const root = screen.container.querySelector(
    '[data-slot="staggered-text-reveal"]',
  ) as HTMLElement;
  // Held: the reveal would otherwise have finished before anyone scrolled to it.
  await vi.waitFor(() =>
    expect(root.hasAttribute("data-revealed")).toBe(false),
  );
  const words = screen.container.querySelectorAll(
    '[data-slot="staggered-text-reveal-word"]',
  );
  words.forEach((w) => expect(w.classList.contains("opacity-0")).toBe(true));

  root.scrollIntoView();
  await vi.waitFor(() => expect(root.hasAttribute("data-revealed")).toBe(true));
  screen.container
    .querySelectorAll('[data-slot="staggered-text-reveal-word"]')
    .forEach((w) => expect(w.classList.contains("motion-enter-up")).toBe(true));
});

test("rendering the same text twice produces identical delay assignments (deterministic)", async () => {
  const a = await render(<StaggeredTextReveal text="Ship agentic UI" />);
  const b = await render(<StaggeredTextReveal text="Ship agentic UI" />);
  const delaysOf = (screen: typeof a) =>
    Array.from(
      screen.container.querySelectorAll(
        '[data-slot="staggered-text-reveal-word"]',
      ),
    ).map((w) => (w as HTMLElement).style.getPropertyValue("--stagger-i"));
  expect(delaysOf(a)).toEqual(delaysOf(b));
});

test("no a11y violations", async () => {
  const screen = await render(
    <StaggeredTextReveal text="Ship agentic UI, fast." />,
  );
  await expectNoA11yViolations(screen.container);
});
