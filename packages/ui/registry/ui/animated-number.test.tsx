import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { AnimatedNumber } from "./animated-number";

/* ---------------------------------------------------------------------------------------------
 * Fast-tween mirror (same technique as checkbox.test.tsx's "Touch-target remediation" suite):
 * this package's fast unit-test harness compiles no Tailwind/token CSS, so `--duration-*` /
 * `--motion-ease-standard` resolve empty via `getComputedStyle` and the component falls back to
 * its documented JS defaults (200ms base / ease-standard curve). That's correct behavior, but
 * 200ms of real rAF frames is slow for a test suite. Injecting a literal `<style>` that sets
 * `:root { --duration-fast: <tiny>ms; }` makes `getComputedStyle` resolve a REAL value again —
 * this measures the actual tween loop reading real CSS, just tuned fast, not a mocked one.
 * ------------------------------------------------------------------------------------------- */
function injectFastDurationMirror(ms = 20): () => void {
  const style = document.createElement("style");
  style.textContent = `:root { --duration-fast: ${ms}ms; --duration-base: ${ms}ms; --duration-slow: ${ms}ms; --motion-ease-standard: cubic-bezier(0.2, 0, 0, 1); }`;
  document.head.appendChild(style);
  return () => document.head.removeChild(style);
}

/** Reads the visible (aria-hidden) tween text — the one the user's eyes track. */
function visibleText(container: Element): string | null {
  return (
    container.querySelector('[data-slot="animated-number-value"]')
      ?.textContent ?? null
  );
}

/** Reads the sr-only live-region text — the one assistive tech hears. */
function liveText(container: Element): string | null {
  return (
    container.querySelector('[data-slot="animated-number-live"]')
      ?.textContent ?? null
  );
}

function StatefulNumber({
  initial,
  format,
  duration = "fast",
}: {
  initial: number;
  format?: Intl.NumberFormatOptions;
  duration?: "fast" | "base" | "slow";
}) {
  const [value, setValue] = React.useState(initial);
  return (
    <div>
      <AnimatedNumber value={value} format={format} duration={duration} />
      <button type="button" onClick={() => setValue((v) => v + 100)}>
        Increment
      </button>
      <button type="button" onClick={() => setValue(9999)}>
        Jump
      </button>
    </div>
  );
}

test("renders the exact final value statically at rest — no animation on mount", async () => {
  const screen = await render(<AnimatedNumber value={1234} />);
  expect(visibleText(screen.container)).toBe(
    new Intl.NumberFormat().format(1234),
  );
  expect(liveText(screen.container)).toBe(new Intl.NumberFormat().format(1234));
});

test("carries the data-slot and sets numerals in mono with tabular figures", async () => {
  const screen = await render(<AnimatedNumber value={42} />);
  const root = screen.container.querySelector('[data-slot="animated-number"]');
  expect(root).not.toBeNull();
  // Numerals canon: mono + tabular-nums for layout stability while tweening.
  expect((root as HTMLElement).classList.contains("font-mono")).toBe(true);
  expect((root as HTMLElement).classList.contains("tabular-nums")).toBe(true);
});

test("formats a static value with currency options", async () => {
  const screen = await render(
    <AnimatedNumber
      value={1999.5}
      format={{ style: "currency", currency: "USD" }}
    />,
  );
  const expected = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(1999.5);
  expect(visibleText(screen.container)).toBe(expected);
  expect(liveText(screen.container)).toBe(expected);
});

test("tweens to the new target on a value change and settles exactly on it", async () => {
  const cleanup = injectFastDurationMirror(20);
  try {
    const screen = await render(<StatefulNumber initial={0} duration="fast" />);
    expect(visibleText(screen.container)).toBe("0");

    const button = screen.getByRole("button", { name: "Increment" });
    (button.element() as HTMLElement).click();

    await expect
      .poll(() => visibleText(screen.container), { timeout: 2000 })
      .toBe("100");
    // The live region also settles on the final value (see the a11y test below for "only once").
    expect(liveText(screen.container)).toBe("100");
  } finally {
    cleanup();
  }
});

test("interrupting a tween mid-flight retargets to the NEW value with no snap-back", async () => {
  // Leave enough time for every engine to render a proven intermediate frame before retargeting.
  // A fixed 15ms delay raced WebKit's first requestAnimationFrame under CI load: the second click
  // could land before React committed the first value change, so the test measured batching rather
  // than an in-flight interruption.
  const cleanup = injectFastDurationMirror(500);
  try {
    const screen = await render(<StatefulNumber initial={0} duration="fast" />);
    const increment = screen.getByRole("button", { name: "Increment" });
    const jump = screen.getByRole("button", { name: "Jump" });

    (increment.element() as HTMLElement).click(); // 0 -> 100, tweening

    // Synchronize on an actual rendered frame instead of assuming a browser frame fits inside a
    // wall-clock delay. This proves the next click really interrupts an active tween.
    await expect
      .poll(
        () => {
          const current = visibleText(screen.container);
          return current !== "0" && current !== "100";
        },
        { timeout: 2000 },
      )
      .toBe(true);
    (jump.element() as HTMLElement).click(); // retarget the in-flight value -> 9999

    const finalTarget = new Intl.NumberFormat().format(9999);
    await expect
      .poll(() => visibleText(screen.container), { timeout: 3000 })
      .toBe(finalTarget);
    // Never settles back on the pre-interruption target.
    expect(visibleText(screen.container)).not.toBe("100");
    expect(liveText(screen.container)).toBe(finalTarget);
  } finally {
    cleanup();
  }
});

test("prefers-reduced-motion renders value changes instantly, with no tween", async () => {
  const matchMediaMock = vi.fn((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)",
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
  const matchMediaSpy = vi
    .spyOn(window, "matchMedia")
    .mockImplementation(matchMediaMock as never);

  try {
    // No fast-duration mirror here on purpose: if reduced motion were NOT honored, this would
    // fall back to the slow 200ms JS default and the very next poll tick would still show the
    // stale value — proving the instant path bypasses the tween/timing path entirely.
    const screen = await render(<StatefulNumber initial={0} duration="base" />);
    const button = screen.getByRole("button", { name: "Increment" });
    (button.element() as HTMLElement).click();

    await expect
      .poll(() => visibleText(screen.container), { timeout: 500 })
      .toBe("100");
    expect(liveText(screen.container)).toBe("100");
  } finally {
    matchMediaSpy.mockRestore();
  }
});

test("the animated intermediate frames are formatted through the same formatter as the settled value", async () => {
  const cleanup = injectFastDurationMirror(150);
  try {
    const screen = await render(
      <StatefulNumberWithFormat
        initial={0}
        target={5000}
        format={{ style: "currency", currency: "USD" }}
      />,
    );
    const button = screen.getByRole("button", { name: "Go" });
    (button.element() as HTMLElement).click();

    // Poll for at least one intermediate frame that is currency-formatted but neither the start
    // nor the end value — proves formatting is applied mid-tween, not just at rest.
    const startText = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(0);
    const endText = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(5000);
    let sawIntermediate = false;
    const deadline = Date.now() + 2000;
    while (Date.now() < deadline) {
      const text = visibleText(screen.container);
      if (
        text &&
        text !== startText &&
        text !== endText &&
        text.includes("$")
      ) {
        sawIntermediate = true;
        break;
      }
      if (text === endText) break;
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    expect(sawIntermediate).toBe(true);
    await expect
      .poll(() => visibleText(screen.container), { timeout: 2000 })
      .toBe(endText);
  } finally {
    cleanup();
  }
});

function StatefulNumberWithFormat({
  initial,
  target,
  format,
}: {
  initial: number;
  target: number;
  format: Intl.NumberFormatOptions;
}) {
  const [value, setValue] = React.useState(initial);
  return (
    <div>
      <AnimatedNumber value={value} format={format} duration="fast" />
      <button type="button" onClick={() => setValue(target)}>
        Go
      </button>
    </div>
  );
}

test("the visible tween text is aria-hidden and the live region announces only the settled value", async () => {
  const cleanup = injectFastDurationMirror(20);
  try {
    const screen = await render(<StatefulNumber initial={0} duration="fast" />);
    const valueEl = screen.container.querySelector(
      '[data-slot="animated-number-value"]',
    );
    const liveEl = screen.container.querySelector(
      '[data-slot="animated-number-live"]',
    );
    expect(valueEl?.getAttribute("aria-hidden")).toBe("true");
    expect(liveEl?.getAttribute("aria-live")).toBe("polite");
    expect(liveEl?.getAttribute("role")).toBe("status");
    expect(liveEl?.classList.contains("sr-only")).toBe(true);

    // Before the tween finishes, the live region must still read the OLD settled value (not a
    // ticking one) — it only updates once the animation lands on the target.
    (
      screen.getByRole("button", { name: "Increment" }).element() as HTMLElement
    ).click();
    expect(liveText(screen.container)).toBe("0");

    await expect
      .poll(() => liveText(screen.container), { timeout: 2000 })
      .toBe("100");
  } finally {
    cleanup();
  }
});

test("no a11y violations at rest", async () => {
  const screen = await render(
    <AnimatedNumber
      value={1234}
      format={{ style: "currency", currency: "USD" }}
    />,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations after a settled value change", async () => {
  const cleanup = injectFastDurationMirror(15);
  try {
    const screen = await render(<StatefulNumber initial={0} duration="fast" />);
    (
      screen.getByRole("button", { name: "Increment" }).element() as HTMLElement
    ).click();
    await expect
      .poll(() => visibleText(screen.container), { timeout: 2000 })
      .toBe("100");
    await expectNoA11yViolations(screen.container);
  } finally {
    cleanup();
  }
});

test("forwards ref to the underlying root element", async () => {
  const ref = React.createRef<HTMLSpanElement>();
  await render(<AnimatedNumber ref={ref} value={7} />);
  expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  expect(ref.current?.dataset.slot).toBe("animated-number");
});
