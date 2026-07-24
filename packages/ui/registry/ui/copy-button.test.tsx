import * as React from "react";
import { render } from "vitest-browser-react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { CopyButton } from "./copy-button";

// `navigator.clipboard` is a getter-only property in the browser, so we can't
// reassign it — but its `writeText` method is configurable, so spy on it in place
// and resolve (the headless context has no real clipboard permission).
let writeText: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  writeText = vi
    .spyOn(navigator.clipboard, "writeText")
    .mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('renders a button labelled "Copy" by default', async () => {
  const screen = await render(<CopyButton value="hello" />);
  const btn = screen.getByRole("button", { name: "Copy" });
  await expect.element(btn).toBeInTheDocument();
  await expect.element(btn).toHaveAttribute("data-slot", "copy-button");
});

test("defaults to ghost / icon-sm", async () => {
  const screen = await render(<CopyButton value="hello" />);
  const btn = screen.getByRole("button", { name: "Copy" });
  await expect.element(btn).toHaveAttribute("data-variant", "ghost");
  await expect.element(btn).toHaveAttribute("data-size", "icon-sm");
});

test("showLabel renders visible status text and defaults to the small text-button size", async () => {
  const screen = await render(<CopyButton value="hello" showLabel />);
  const btn = screen.getByRole("button", { name: "Copy" });
  const label = screen.container.querySelector(
    '[data-slot="copy-button-label"]',
  );

  await expect.element(btn).toHaveAttribute("data-size", "sm");
  await expect.element(btn).toHaveAttribute("data-label-visible", "");
  expect(label?.textContent).toBe("Copy");

  await btn.click();
  expect(label?.textContent).toBe("Copied");
});

test("click copies value, shows the check, and fires onCopied", async () => {
  const onCopied = vi.fn();
  const screen = await render(
    <CopyButton value="copy-me" onCopied={onCopied} />,
  );
  await screen.getByRole("button", { name: "Copy" }).click();

  expect(writeText).toHaveBeenCalledOnce();
  expect(writeText).toHaveBeenCalledWith("copy-me");
  expect(onCopied).toHaveBeenCalledOnce();
  expect(onCopied).toHaveBeenCalledWith("copy-me");

  // Label flips to "Copied" and the data-copied state attribute is set.
  const copied = screen.getByRole("button", { name: "Copied" });
  await expect.element(copied).toBeInTheDocument();
  await expect.element(copied).toHaveAttribute("data-copied", "");
  expect(copied.element().className).toContain("text-primary");
  expect(copied.element().className).not.toContain("text-success-text");
});

test("announces the copy via a visually-hidden live region", async () => {
  const screen = await render(<CopyButton value="copy-me" />);
  // Empty (and effectively silent) before the copy.
  const status = screen.container.querySelector('[role="status"]');
  expect(status?.textContent).toBe("");

  await screen.getByRole("button", { name: "Copy" }).click();
  await expect.element(screen.getByRole("status")).toHaveTextContent("Copied");

  // Reverts to empty once the "Copied" state times out.
  await expect
    .element(screen.getByRole("button", { name: "Copy" }))
    .toBeInTheDocument();
  expect(screen.container.querySelector('[role="status"]')?.textContent).toBe(
    "",
  );
});

test('reverts to "Copy" after the timeout elapses', async () => {
  vi.useFakeTimers();
  try {
    const screen = await render(<CopyButton value="x" timeout={1500} />);
    await screen.getByRole("button", { name: "Copy" }).click();
    await expect
      .element(screen.getByRole("button", { name: "Copied" }))
      .toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(1500);
    await expect
      .element(screen.getByRole("button", { name: "Copy" }))
      .toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});

test("calls onPress before copying", async () => {
  const onPress = vi.fn();
  const screen = await render(<CopyButton value="x" onPress={onPress} />);
  await screen.getByRole("button", { name: "Copy" }).click();
  expect(onPress).toHaveBeenCalledOnce();
  expect(writeText).toHaveBeenCalledWith("x");
});

test("onPress can cancel the clipboard write", async () => {
  const screen = await render(
    <CopyButton value="x" onPress={(event) => event.preventDefault()} />,
  );
  await screen.getByRole("button", { name: "Copy" }).click();
  expect(writeText).not.toHaveBeenCalled();
});

test("no a11y violations", async () => {
  const screen = await render(<CopyButton value="hello" />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — copied", async () => {
  const screen = await render(<CopyButton value="hello" />);
  await screen.getByRole("button", { name: "Copy" }).click();
  await expect
    .element(screen.getByRole("button", { name: "Copied" }))
    .toBeInTheDocument();
  await expectNoA11yViolations(screen.container);
});

test("forwards ref to the underlying button element", async () => {
  // Delegating wrapper: {...props} (carrying ref) is spread onto Button, which
  // forwards onto its <button> host. No code change needed (Pattern D).
  const ref = React.createRef<HTMLButtonElement>();
  await render(<CopyButton ref={ref} value="hello" />);
  expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  expect(ref.current?.dataset.slot).toBe("copy-button");
});

/* ---------------------------------------------------------------------------
 * Motion (Phase M) — Copy→Check keyed-presence swap.
 *
 * This suite runs WITHOUT compiled Tailwind (see checkbox.test.tsx's "Touch-target
 * remediation" section for the technique), so the literal `motion-pop-in` utility
 * + `vs-pop-in` keyframe from packages/design-tokens/src/utilities.css never resolve here
 * either. Each test injects a 1:1 mirror of that utility + keyframe + the two
 * motion tokens it consumes, then reads Chromium's real computed style against it.
 *
 * `motion-check-draw` is deliberately NOT used — see the deviation comment on the
 * icon swap in copy-button.tsx (lucide-react's `createLucideIcon` spreads
 * consumer props only onto the root `<svg>`, never the generated `<path>`, so
 * `pathLength` can't reach the check glyph through the public `<Check />` API).
 * ------------------------------------------------------------------------------*/

function injectMotionPopInMirror(): () => void {
  const style = document.createElement("style");
  style.textContent = `
    :root {
      --duration-fast: 150ms;
      --motion-ease-spring: linear(0, 0.5 60%, 1.05 80%, 0.98 90%, 1);
    }
    @keyframes vs-pop-in {
      from { opacity: 0; scale: 0.9; }
      to { opacity: 1; scale: 1; }
    }
    .motion-pop-in {
      animation: vs-pop-in var(--duration-fast) var(--motion-ease-spring);
    }
  `;
  document.head.appendChild(style);
  return () => document.head.removeChild(style);
}

test("the Copy icon carries motion-pop-in with the vs-pop-in animation resolved", async () => {
  const cleanup = injectMotionPopInMirror();
  try {
    const screen = await render(<CopyButton value="hello" />);
    const btn = screen
      .getByRole("button", { name: "Copy" })
      .element() as HTMLElement;
    const icon = btn.querySelector("svg") as SVGElement;
    expect(icon.classList.contains("motion-pop-in")).toBe(true);
    const computed = getComputedStyle(icon);
    expect(computed.animationName).toBe("vs-pop-in");
    expect(computed.animationDuration).toBe("0.15s");
    // The spring easing resolves to something other than the browser default —
    // proof the `ease-*` token half of the pairing is actually wired up.
    expect(computed.animationTimingFunction).not.toBe("ease");
  } finally {
    cleanup();
  }
});

test("the Check icon swaps in with motion-pop-in after a successful copy", async () => {
  const cleanup = injectMotionPopInMirror();
  try {
    const screen = await render(<CopyButton value="hello" />);
    await screen.getByRole("button", { name: "Copy" }).click();
    const btn = screen
      .getByRole("button", { name: "Copied" })
      .element() as HTMLElement;
    const icon = btn.querySelector("svg") as SVGElement;
    expect(icon.classList.contains("motion-pop-in")).toBe(true);
    expect(getComputedStyle(icon).animationName).toBe("vs-pop-in");
  } finally {
    cleanup();
  }
});

test("the icon remounts (new node identity) across the Copy/Check swap", async () => {
  const screen = await render(<CopyButton value="hello" />);
  const btnBefore = screen
    .getByRole("button", { name: "Copy" })
    .element() as HTMLElement;
  const before = btnBefore.querySelector("svg");
  expect(before).not.toBeNull();

  await screen.getByRole("button", { name: "Copy" }).click();

  const btnAfter = screen
    .getByRole("button", { name: "Copied" })
    .element() as HTMLElement;
  const after = btnAfter.querySelector("svg");
  expect(after).not.toBeNull();
  expect(after).not.toBe(before);
});

test("rapid re-clicks during the reveal window settle on the correct icon without crashing", async () => {
  vi.useFakeTimers();
  try {
    const screen = await render(<CopyButton value="x" timeout={1500} />);
    const btn = screen.container.querySelector(
      '[data-slot="copy-button"]',
    ) as HTMLButtonElement;

    btn.click();
    await vi.advanceTimersByTimeAsync(200);
    btn.click();
    await vi.advanceTimersByTimeAsync(200);
    btn.click();

    await expect
      .element(screen.getByRole("button", { name: "Copied" }))
      .toBeInTheDocument();
    expect(writeText).toHaveBeenCalledTimes(3);

    // The last click's timer wins — it resets the revert timeout each time.
    await vi.advanceTimersByTimeAsync(1500);
    await expect
      .element(screen.getByRole("button", { name: "Copy" }))
      .toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});

// Reduced-motion note: the global `prefers-reduced-motion: reduce` reset in
// packages/design-tokens/src/base.css forces `animation-duration: 0.01ms !important` /
// `animation-iteration-count: 1 !important` on every element, and `vs-pop-in`'s
// `to` state (opacity: 1, scale: 1) already equals the icon's natural resting
// style. No per-component `motion-reduce:` variant is needed here by design.
