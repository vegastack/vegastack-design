import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { ScrollArea, ScrollBar } from "./scroll-area";
import { DirectionProvider } from "./direction";

const slot = (name: string, root: ParentNode = document) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`);

const slots = (name: string, root: ParentNode = document) => [
  ...root.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`),
];

/*
 * This lane compiles no Tailwind, and this component's overflow depends on one compiled class: the
 * viewport's `size-full`. Without it the viewport grows to its content, nothing ever overflows, and
 * every geometry assertion below would pass vacuously. `VIEWPORT_SIZING` restates exactly that one
 * class — nothing else — so the measurements are real. Sizes that must be real are inline styles.
 */
const VIEWPORT_SIZING = `[data-slot="scroll-area-viewport"] { height: 100%; width: 100%; }`;

function Sized({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{VIEWPORT_SIZING}</style>
      {children}
    </>
  );
}

const BOX = { height: 120, width: 160 } as const;

/** Overflows on y only. */
function Tall(props: React.ComponentProps<typeof ScrollArea>) {
  return (
    <Sized>
      <ScrollArea style={BOX} aria-label="Tags" {...props}>
        <div style={{ height: 600 }}>
          {Array.from({ length: 30 }, (_, index) => (
            <div key={index}>v1.2.0-beta.{index}</div>
          ))}
        </div>
      </ScrollArea>
    </Sized>
  );
}

/** Overflows on neither axis. */
function Fits(props: React.ComponentProps<typeof ScrollArea>) {
  return (
    <Sized>
      <ScrollArea style={BOX} aria-label="Tags" {...props}>
        <div style={{ height: 20, width: 40 }}>Short</div>
      </ScrollArea>
    </Sized>
  );
}

/** Overflows on both axes, with the horizontal bar composed the way upstream documents it. */
function BothAxes(props: React.ComponentProps<typeof ScrollArea>) {
  return (
    <Sized>
      <ScrollArea style={BOX} aria-label="Artwork" {...props}>
        <div style={{ width: 800, height: 600 }}>wide and tall</div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Sized>
  );
}

test("renders the viewport, a vertical scrollbar and its thumb (Usage)", async () => {
  const screen = await render(<Tall />);
  expect(slot("scroll-area", screen.container)).not.toBeNull();
  expect(slot("scroll-area-viewport", screen.container)).not.toBeNull();
  await expect
    .poll(() => slots("scroll-area-scrollbar", screen.container).length)
    .toBe(1);
  const bar = slot("scroll-area-scrollbar", screen.container) as HTMLElement;
  expect(bar.getAttribute("data-orientation")).toBe("vertical");
  expect(slot("scroll-area-thumb", screen.container)).not.toBeNull();
});

test("children land inside the viewport, not beside it (Usage)", async () => {
  const screen = await render(<Tall />);
  const viewport = slot(
    "scroll-area-viewport",
    screen.container,
  ) as HTMLElement;
  expect(viewport.textContent).toContain("v1.2.0-beta.0");
  await expect
    .poll(() => viewport.scrollHeight)
    .toBeGreaterThan(viewport.clientHeight);
});

test("Composition: a horizontal ScrollBar child adds the second axis", async () => {
  const screen = await render(<BothAxes />);
  await expect
    .poll(() => slots("scroll-area-scrollbar", screen.container).length)
    .toBe(2);
  const bars = slots("scroll-area-scrollbar", screen.container);
  expect(
    bars.map((bar) => bar.getAttribute("data-orientation")).sort(),
  ).toEqual(["horizontal", "vertical"]);
  // The composed bar is written beside the content, so it lands inside the viewport — which is
  // exactly the shape upstream's Horizontal example uses.
  const viewport = slot(
    "scroll-area-viewport",
    screen.container,
  ) as HTMLElement;
  const horizontal = bars.find(
    (bar) => bar.getAttribute("data-orientation") === "horizontal",
  ) as HTMLElement;
  expect(viewport.contains(horizontal)).toBe(true);
});

test("ScrollBar defaults to the vertical axis and merges its own className", async () => {
  const screen = await render(
    <Sized>
      <ScrollArea style={BOX} aria-label="Tags">
        <div style={{ height: 600 }}>tall</div>
        <ScrollBar className="test-bar" />
      </ScrollArea>
    </Sized>,
  );
  const find = () =>
    screen.container.querySelector<HTMLElement>(
      "[data-slot='scroll-area-scrollbar'].test-bar",
    );
  await expect.poll(find).not.toBeNull();
  const composed = find() as HTMLElement;
  expect(composed.getAttribute("data-orientation")).toBe("vertical");
  // The recipe's own classes survive the merge.
  expect(composed.className).toContain("touch-none");
});

test("Horizontal: the viewport actually scrolls on the x axis (Horizontal)", async () => {
  const screen = await render(
    <Sized>
      <ScrollArea style={{ width: 160, height: 60 }} aria-label="Artwork">
        <div style={{ width: 800 }}>wide</div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Sized>,
  );
  const viewport = slot(
    "scroll-area-viewport",
    screen.container,
  ) as HTMLElement;
  await expect
    .poll(() => viewport.scrollWidth)
    .toBeGreaterThan(viewport.clientWidth);
  await expect
    .poll(() =>
      slots("scroll-area-scrollbar", screen.container).some(
        (bar) => bar.getAttribute("data-orientation") === "horizontal",
      ),
    )
    .toBe(true);
  viewport.scrollLeft = 100;
  expect(viewport.scrollLeft).toBeGreaterThan(0);
});

test("A11Y-6: a viewport with overflowing content is a tab stop", async () => {
  const screen = await render(<Tall />);
  const viewport = slot(
    "scroll-area-viewport",
    screen.container,
  ) as HTMLElement;
  await expect.poll(() => viewport.getAttribute("tabindex")).toBe("0");
  viewport.focus();
  expect(document.activeElement).toBe(viewport);
});

test("A11Y-6: a viewport whose content fits is NOT a tab stop", async () => {
  const screen = await render(<Fits />);
  const viewport = slot(
    "scroll-area-viewport",
    screen.container,
  ) as HTMLElement;
  // The other half of the row. Base UI computes `tabIndex: hidden.x && hidden.y ? -1 : 0`; if it
  // ever made the viewport unconditionally tabbable, A11Y-6 would stop being satisfied with NO
  // HUNK in our patch — and this assertion is the only thing in the repository that would notice.
  await expect.poll(() => viewport.getAttribute("tabindex")).toBe("-1");
  // Proven against the geometry, not just the attribute: nothing here overflows.
  expect(viewport.scrollHeight).toBeLessThanOrEqual(viewport.clientHeight);
  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
});

test("RTL: the vertical scrollbar uses a logical border side (RTL)", async () => {
  const screen = await render(
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <Tall />
      </div>
    </DirectionProvider>,
  );
  const viewport = slot(
    "scroll-area-viewport",
    screen.container,
  ) as HTMLElement;
  expect(getComputedStyle(viewport).direction).toBe("rtl");
  await expect
    .poll(() => slot("scroll-area-scrollbar", screen.container))
    .not.toBeNull();
  const bar = slot("scroll-area-scrollbar", screen.container) as HTMLElement;
  expect(bar.className).toContain("data-vertical:border-s");
  expect(bar.className).not.toContain("border-l");
});

test("FOC-1/FOC-6: no focus glow and no outline suppression on the viewport", async () => {
  const screen = await render(<Tall />);
  const viewport = slot(
    "scroll-area-viewport",
    screen.container,
  ) as HTMLElement;
  // Upstream suppressed the outline on the ONE focusable part of this component. Named here so a
  // future pull that reintroduces the glow fails on the element it would actually hurt.
  expect(viewport.className).not.toMatch(/(?:^|\s)outline-none(?:\s|$)/);
  expect(viewport.className).not.toContain("focus-visible:outline-1");
  for (const element of screen.container.querySelectorAll<HTMLElement>("*")) {
    const classes =
      typeof element.className === "string" ? element.className : "";
    expect(classes).not.toMatch(/ring-3|ring-\[3px\]|ring-ring\/\d+/);
    expect(classes).not.toContain("focus-visible:ring-");
    expect(classes).not.toMatch(/(?:^|\s)outline-hidden(?:\s|$)/);
  }
});

test("no a11y violations — scrollable", async () => {
  const screen = await render(<Tall />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — content fits", async () => {
  const screen = await render(<Fits />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — both axes composed", async () => {
  const screen = await render(<BothAxes />);
  await expectNoA11yViolations(screen.container);
});
