import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Skeleton, SkeletonReveal } from "./skeleton";

test("renders a decorative placeholder with the default line shape", async () => {
  const screen = await render(<Skeleton data-testid="sk" />);
  const sk = screen.getByTestId("sk");
  await expect.element(sk).toBeInTheDocument();
  await expect.element(sk).toHaveAttribute("data-slot", "skeleton");
  await expect.element(sk).toHaveAttribute("data-shape", "line");
  // Decorative — hidden from the a11y tree.
  await expect.element(sk).toHaveAttribute("aria-hidden", "true");
  await expect.element(sk).toHaveAttribute("role", "presentation");
});

test("applies the shape data attribute", async () => {
  const screen = await render(<Skeleton shape="circle" data-testid="sk" />);
  await expect
    .element(screen.getByTestId("sk"))
    .toHaveAttribute("data-shape", "circle");
});

test("renders a stack of `count` line placeholders", async () => {
  const screen = await render(<Skeleton count={3} data-testid="sk" />);
  const root = screen.getByTestId("sk");
  await expect.element(root).toHaveAttribute("data-count", "3");
  expect(
    root.element().querySelectorAll('[data-slot="skeleton-line"]'),
  ).toHaveLength(3);
});

test("clamps an invalid count to a single placeholder", async () => {
  const screen = await render(<Skeleton count={0} data-testid="sk" />);
  const sk = screen.getByTestId("sk");
  // Falls back to the single-element form (no stacked lines).
  await expect.element(sk).toHaveAttribute("data-slot", "skeleton");
  expect(sk.element().querySelector('[data-slot="skeleton-line"]')).toBeNull();
});

test("normalizes non-finite counts to a single placeholder", async () => {
  const screen = await render(<Skeleton count={Number.NaN} data-testid="sk" />);
  await expect
    .element(screen.getByTestId("sk"))
    .not.toHaveAttribute("data-count");
  await screen.rerender(
    <Skeleton count={Number.POSITIVE_INFINITY} data-testid="sk" />,
  );
  await expect
    .element(screen.getByTestId("sk"))
    .not.toHaveAttribute("data-count");
});

test("includes the reduced-motion guard alongside the pulse", async () => {
  const screen = await render(<Skeleton data-testid="sk" />);
  const sk = screen.getByTestId("sk");
  await expect.element(sk).toHaveClass("animate-pulse");
  await expect.element(sk).toHaveClass("motion-reduce:animate-none");
});

test("merges a custom className", async () => {
  const screen = await render(<Skeleton className="w-1/2" data-testid="sk" />);
  await expect.element(screen.getByTestId("sk")).toHaveClass("w-1/2");
});

test("forwards ref to the root element (single placeholder)", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(<Skeleton ref={ref} />);
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("skeleton");
});

test("forwards ref to the wrapping element (stacked placeholders)", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(<Skeleton ref={ref} count={3} />);
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("skeleton");
  expect(ref.current?.dataset.count).toBe("3");
});

test("no a11y violations", async () => {
  const screen = await render(
    <div role="status" aria-busy="true" aria-label="Loading content">
      <Skeleton count={3} />
    </div>,
  );
  await expectNoA11yViolations(screen.container);
});

/* ---------------------------------------------------------------------------------------------
 * SkeletonReveal (Phase M "skeleton reveal", audit 09 §d5) — `Skeleton` stays a static
 * placeholder; SkeletonReveal keys the loading/content swap and gives the arriving content
 * `motion-enter-up` so it fades + rises in instead of popping flatly into place.
 * ------------------------------------------------------------------------------------------- */

test("renders exactly the skeleton prop while loading, with no extra wrapper", async () => {
  const screen = await render(
    <SkeletonReveal loading skeleton={<Skeleton data-testid="sk" />}>
      <p>Loaded content</p>
    </SkeletonReveal>,
  );
  await expect.element(screen.getByTestId("sk")).toBeInTheDocument();
  expect(
    screen.container.querySelector('[data-slot="skeleton-reveal-content"]'),
  ).toBeNull();
  expect(screen.container.textContent).not.toContain("Loaded content");
});

test("reveals the content wrapper with motion-enter-up once loading is false", async () => {
  const screen = await render(
    <SkeletonReveal loading={false} skeleton={<Skeleton data-testid="sk" />}>
      <p>Loaded content</p>
    </SkeletonReveal>,
  );
  const wrapper = screen.container.querySelector(
    '[data-slot="skeleton-reveal-content"]',
  );
  expect(wrapper).not.toBeNull();
  expect(wrapper?.className).toContain("motion-enter-up");
  expect(screen.container.textContent).toContain("Loaded content");
  expect(screen.container.querySelector('[data-testid="sk"]')).toBeNull();
});

test("remounts the content node (replaying the reveal) when loading flips from true to false", async () => {
  const screen = await render(
    <SkeletonReveal loading skeleton={<Skeleton data-testid="sk" />}>
      <p>Loaded content</p>
    </SkeletonReveal>,
  );
  expect(
    screen.container.querySelector('[data-slot="skeleton-reveal-content"]'),
  ).toBeNull();

  await screen.rerender(
    <SkeletonReveal loading={false} skeleton={<Skeleton data-testid="sk" />}>
      <p>Loaded content</p>
    </SkeletonReveal>,
  );
  const wrapper = screen.container.querySelector(
    '[data-slot="skeleton-reveal-content"]',
  );
  expect(wrapper).not.toBeNull();
  expect(wrapper?.textContent).toBe("Loaded content");
});

test("merges a custom className onto the content wrapper", async () => {
  const screen = await render(
    <SkeletonReveal
      loading={false}
      skeleton={<Skeleton />}
      className="flex flex-col gap-2"
    >
      <p>Loaded content</p>
    </SkeletonReveal>,
  );
  const wrapper = screen.container.querySelector(
    '[data-slot="skeleton-reveal-content"]',
  );
  expect(wrapper?.className).toContain("flex");
  expect(wrapper?.className).toContain("motion-enter-up");
});

test("forwards ref to the content wrapper element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <SkeletonReveal ref={ref} loading={false} skeleton={<Skeleton />}>
      Loaded
    </SkeletonReveal>,
  );
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("skeleton-reveal-content");
});

test("SkeletonReveal: no a11y violations in either state", async () => {
  const loadingScreen = await render(
    <div role="status" aria-busy="true" aria-label="Loading content">
      <SkeletonReveal loading skeleton={<Skeleton count={2} />}>
        <p>Loaded content</p>
      </SkeletonReveal>
    </div>,
  );
  await expectNoA11yViolations(loadingScreen.container);

  const loadedScreen = await render(
    <SkeletonReveal loading={false} skeleton={<Skeleton count={2} />}>
      <p>Loaded content</p>
    </SkeletonReveal>,
  );
  await expectNoA11yViolations(loadedScreen.container);
});
