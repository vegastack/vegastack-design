import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { ScrollArea } from "./scroll-area";

const LongContent = () => (
  <div style={{ height: 800, width: 800 }}>
    <p>Scrollable content</p>
  </div>
);

test("renders content inside the viewport", async () => {
  const screen = await render(
    <ScrollArea className="h-32 w-48">
      <LongContent />
    </ScrollArea>,
  );
  await expect
    .element(screen.getByText("Scrollable content"))
    .toBeInTheDocument();
});

test("marks up the root and viewport slots", async () => {
  const screen = await render(
    <ScrollArea
      data-testid="area"
      aria-label="Release notes"
      className="h-32 w-48"
    >
      <LongContent />
    </ScrollArea>,
  );
  const root = screen.getByTestId("area");
  await expect.element(root).toHaveAttribute("data-slot", "scroll-area");
  const viewport = root
    .element()
    .querySelector('[data-slot="scroll-area-viewport"]');
  expect(viewport).not.toBeNull();
  expect(viewport).toHaveAttribute("tabindex", "0");
  expect(viewport).toHaveAttribute("aria-label", "Release notes");
});

test("applies the className to the container (size constraint)", async () => {
  const screen = await render(
    <ScrollArea data-testid="area" className="h-32 w-48">
      <LongContent />
    </ScrollArea>,
  );
  const root = screen.getByTestId("area");
  // The size constraint lands on the root container…
  await expect.element(root).toHaveClass("h-32");
  await expect.element(root).toHaveClass("w-48");
  // …and the viewport fills it.
  const viewport = root
    .element()
    .querySelector('[data-slot="scroll-area-viewport"]');
  expect(viewport?.className).toContain("size-full");
});

// Base UI mounts each scrollbar only after it measures real overflow on that
// axis (or when `keepMounted` is set). The browser test environment ships no
// Tailwind CSS, so size utilities produce no layout and overflow can't be
// measured — these structural tests pass `scrollbarProps={{ keepMounted: true }}`
// to the auto-rendered bars so they assert our real composition deterministically.

test("an auto-rendered vertical ScrollBar renders with the right slot + orientation", async () => {
  const screen = await render(
    <ScrollArea data-testid="area" scrollbarProps={{ keepMounted: true }}>
      <LongContent />
    </ScrollArea>,
  );
  const root = screen.getByTestId("area").element();
  const bars = root.querySelectorAll('[data-slot="scroll-area-scrollbar"]');
  expect(bars.length).toBe(1);
  expect(bars[0]?.getAttribute("data-orientation")).toBe("vertical");
});

test('composes both axes for orientation="both"', async () => {
  // The corner (`data-slot="scroll-area-corner"`) is a Base UI runtime element
  // that only materializes once BOTH axes have measurable overflow, so we assert
  // the dual-axis scrollbar composition here rather than the conditional corner.
  const screen = await render(
    <ScrollArea
      data-testid="area"
      orientation="both"
      scrollbarProps={{ keepMounted: true }}
    >
      <LongContent />
    </ScrollArea>,
  );
  const root = screen.getByTestId("area").element();
  expect(
    root.querySelector(
      '[data-slot="scroll-area-scrollbar"][data-orientation="vertical"]',
    ),
  ).not.toBeNull();
  expect(
    root.querySelector(
      '[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]',
    ),
  ).not.toBeNull();
});

test("ScrollBar renders a token-styled thumb", async () => {
  const screen = await render(
    <ScrollArea data-testid="area" scrollbarProps={{ keepMounted: true }}>
      <LongContent />
    </ScrollArea>,
  );
  const thumb = screen
    .getByTestId("area")
    .element()
    .querySelector('[data-slot="scroll-area-thumb"]');
  expect(thumb).not.toBeNull();
  expect(thumb?.className).toContain("bg-border");
  expect(thumb?.className).toContain("rounded-full");
});

test("no a11y violations", async () => {
  const screen = await render(
    <ScrollArea aria-label="Release notes" className="h-32 w-48">
      <LongContent />
    </ScrollArea>,
  );
  await expectNoA11yViolations(screen.container);
});

test("ScrollArea forwards ref to its host root element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <ScrollArea ref={ref} className="h-32 w-48">
      <LongContent />
    </ScrollArea>,
  );
  expect(ref.current).toBeInstanceOf(HTMLElement);
  expect(ref.current?.dataset.slot).toBe("scroll-area");
});

test("the 10px visual scrollbar exposes a real 24px inward pointer target", async () => {
  const style = document.createElement("style");
  style.textContent = `
    [data-testid="scroll-hit-area"] {
      position: fixed;
      inset: auto;
      top: 100px;
      left: 300px;
      width: 100px;
      height: 80px;
      overflow: hidden;
    }
    .scroll-hit-bar {
      position: absolute;
      inset-block: 0;
      inset-inline-end: 0;
      width: 10px;
      height: 80px;
      z-index: 10;
    }
    .scroll-hit-bar::before {
      content: "";
      position: absolute;
      inset-block: 0;
      inset-inline-end: 0;
      width: 24px;
    }
  `;
  document.head.append(style);

  try {
    const screen = await render(
      <ScrollArea
        data-testid="scroll-hit-area"
        aria-label="Hit target probe"
        scrollbarProps={{ keepMounted: true, className: "scroll-hit-bar" }}
      >
        <LongContent />
      </ScrollArea>,
    );
    const root = screen.getByTestId("scroll-hit-area").element();
    const bar = root.querySelector<HTMLElement>(".scroll-hit-bar");
    expect(bar).not.toBeNull();
    const rect = root.getBoundingClientRect();
    expect(document.elementFromPoint(rect.right - 23, rect.top + 10)).toBe(bar);
    expect(document.elementFromPoint(rect.right - 25, rect.top + 10)).not.toBe(
      bar,
    );
  } finally {
    style.remove();
  }
});
