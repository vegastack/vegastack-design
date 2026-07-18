import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { AutoSaveInput } from "./auto-save-input";

test("renders the initial value and no status icon while idle", async () => {
  const screen = await render(
    <AutoSaveInput
      aria-label="Name"
      defaultValue="Ada"
      onSave={async () => {}}
    />,
  );
  const input = screen.getByLabelText("Name");
  await expect.element(input).toHaveValue("Ada");
  await expect.element(input).toHaveAttribute("data-slot", "auto-save-input");
  await expect.element(input).toHaveAttribute("data-state", "idle");
});

test("debounces typing and calls onSave once after the delay, then shows saved", async () => {
  vi.useFakeTimers();
  try {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const screen = await render(
      <AutoSaveInput
        aria-label="Name"
        defaultValue=""
        onSave={onSave}
        debounceMs={800}
      />,
    );

    await screen.getByLabelText("Name").fill("Ada");
    // Within the debounce window: no save yet.
    await vi.advanceTimersByTimeAsync(500);
    expect(onSave).not.toHaveBeenCalled();

    // Window elapses → exactly one save with the latest value.
    await vi.advanceTimersByTimeAsync(300);
    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith("Ada");

    await expect
      .element(screen.getByLabelText("Name"))
      .toHaveAttribute("data-state", "saved");
    const status = screen.container.querySelector(
      '[data-slot="auto-save-input-status"]',
    );
    expect(status?.textContent).toContain("Saved");
  } finally {
    vi.useRealTimers();
  }
});

test("shows the error status when onSave rejects", async () => {
  vi.useFakeTimers();
  try {
    const onSave = vi.fn().mockRejectedValue(new Error("boom"));
    const screen = await render(
      <AutoSaveInput
        aria-label="Name"
        defaultValue=""
        onSave={onSave}
        debounceMs={800}
      />,
    );

    await screen.getByLabelText("Name").fill("x");
    await vi.advanceTimersByTimeAsync(800);

    expect(onSave).toHaveBeenCalledOnce();
    const input = screen.getByLabelText("Name");
    await expect.element(input).toHaveAttribute("data-state", "error");
    await expect.element(input).toHaveAttribute("aria-invalid", "true");
    const status = screen.container.querySelector(
      '[data-slot="auto-save-input-status"]',
    );
    expect(status?.textContent).toContain("Save failed");
  } finally {
    vi.useRealTimers();
  }
});

test("failing validate skips the save and surfaces the error status", async () => {
  vi.useFakeTimers();
  try {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const screen = await render(
      <AutoSaveInput
        aria-label="Name"
        defaultValue="Ada"
        onSave={onSave}
        validate={(v) => v.trim().length > 0}
      />,
    );

    await screen.getByLabelText("Name").fill("");
    await vi.advanceTimersByTimeAsync(1000);

    expect(onSave).not.toHaveBeenCalled();
    await expect
      .element(screen.getByLabelText("Name"))
      .toHaveAttribute("data-state", "error");
  } finally {
    vi.useRealTimers();
  }
});

test("controlled value follows parent record changes without saving them back", async () => {
  vi.useFakeTimers();
  try {
    const onSave = vi.fn().mockResolvedValue(undefined);

    function ControlledHost() {
      const [name, setName] = React.useState("Ada");
      return (
        <>
          <button type="button" onClick={() => setName("Grace")}>
            Switch record
          </button>
          <AutoSaveInput
            aria-label="Name"
            value={name}
            onValueChange={setName}
            onSave={onSave}
            debounceMs={300}
          />
        </>
      );
    }

    const screen = await render(<ControlledHost />);
    const input = screen.getByLabelText("Name");
    await expect.element(input).toHaveValue("Ada");

    await screen.getByRole("button", { name: "Switch record" }).click();
    await expect.element(input).toHaveValue("Grace");
    await vi.advanceTimersByTimeAsync(400);
    expect(onSave).not.toHaveBeenCalled();

    await input.fill("Grace Hopper");
    await vi.advanceTimersByTimeAsync(300);
    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith("Grace Hopper");
  } finally {
    vi.useRealTimers();
  }
});

test("forwards ref to the underlying input element", async () => {
  const ref = React.createRef<HTMLInputElement>();
  await render(
    <AutoSaveInput
      ref={ref}
      aria-label="Name"
      defaultValue="Ada"
      onSave={async () => {}}
    />,
  );
  expect(ref.current).toBeInstanceOf(HTMLInputElement);
  expect(ref.current?.dataset.slot).toBe("auto-save-input");
});

test("no a11y violations", async () => {
  const screen = await render(
    <label>
      Display name
      <AutoSaveInput defaultValue="Ada" onSave={async () => {}} />
    </label>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(
    <label>
      Display name
      <AutoSaveInput defaultValue="Ada" onSave={async () => {}} disabled />
    </label>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — saving", async () => {
  vi.useFakeTimers();
  try {
    // Never-resolving onSave keeps the status pinned at "saving" for the check.
    const onSave = vi.fn(() => new Promise<void>(() => {}));
    const screen = await render(
      <label>
        Display name
        <AutoSaveInput defaultValue="" onSave={onSave} debounceMs={800} />
      </label>,
    );
    await screen.getByLabelText("Display name").fill("Ada");
    await vi.advanceTimersByTimeAsync(800);
    await expect
      .element(screen.getByLabelText("Display name"))
      .toHaveAttribute("data-state", "saving");
    // axe-core's async run relies on real timers internally; fake timers left
    // active here hang it indefinitely. The "saving" status is pinned by the
    // never-resolving `onSave` promise (independent of the timer mode), so
    // switching to real timers first doesn't disturb the state under test.
    vi.useRealTimers();
    await expectNoA11yViolations(screen.container);
  } finally {
    vi.useRealTimers();
  }
});

test("no a11y violations — error", async () => {
  vi.useFakeTimers();
  try {
    const onSave = vi.fn().mockRejectedValue(new Error("boom"));
    const screen = await render(
      <label>
        Display name
        <AutoSaveInput defaultValue="" onSave={onSave} debounceMs={800} />
      </label>,
    );
    await screen.getByLabelText("Display name").fill("x");
    await vi.advanceTimersByTimeAsync(800);
    await expect
      .element(screen.getByLabelText("Display name"))
      .toHaveAttribute("data-state", "error");
    // See the "saving" test above: axe-core's async run needs real timers.
    vi.useRealTimers();
    await expectNoA11yViolations(screen.container);
  } finally {
    vi.useRealTimers();
  }
});

/* ---------------------------------------------------------------------------
 * Motion (Phase M) — saving→saved / saving→error keyed-presence status swap.
 *
 * Same style-mirror technique as copy-button.test.tsx (see that file's header
 * comment, and checkbox.test.tsx's "Touch-target remediation" section for the
 * original pattern this is modeled on) — this harness has no compiled Tailwind,
 * so `motion-pop-in` / `vs-pop-in` are mirrored locally rather than relied on.
 *
 * The saved `Check` reuses `motion-pop-in` (not `motion-check-draw`) for the same
 * reason documented on copy-button.tsx's icon swap: lucide-react only spreads
 * props onto the root `<svg>`, never the generated `<path>`, so `pathLength`
 * can't reach the check glyph.
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

test("the saved Check carries motion-pop-in with the vs-pop-in animation resolved", async () => {
  const cleanup = injectMotionPopInMirror();
  vi.useFakeTimers();
  try {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const screen = await render(
      <AutoSaveInput aria-label="Name" defaultValue="" onSave={onSave} debounceMs={800} />,
    );
    await screen.getByLabelText("Name").fill("Ada");
    await vi.advanceTimersByTimeAsync(800);
    await expect
      .element(screen.getByLabelText("Name"))
      .toHaveAttribute("data-state", "saved");

    const icon = screen.container.querySelector(
      '[data-slot="auto-save-input-status"] svg',
    ) as SVGElement;
    expect(icon.classList.contains("motion-pop-in")).toBe(true);
    const computed = getComputedStyle(icon);
    expect(computed.animationName).toBe("vs-pop-in");
    expect(computed.animationDuration).toBe("0.15s");
  } finally {
    vi.useRealTimers();
    cleanup();
  }
});

test("the error X carries motion-pop-in with the vs-pop-in animation resolved", async () => {
  const cleanup = injectMotionPopInMirror();
  vi.useFakeTimers();
  try {
    const onSave = vi.fn().mockRejectedValue(new Error("boom"));
    const screen = await render(
      <AutoSaveInput aria-label="Name" defaultValue="" onSave={onSave} debounceMs={800} />,
    );
    await screen.getByLabelText("Name").fill("x");
    await vi.advanceTimersByTimeAsync(800);
    await expect
      .element(screen.getByLabelText("Name"))
      .toHaveAttribute("data-state", "error");

    const icon = screen.container.querySelector(
      '[data-slot="auto-save-input-status"] svg',
    ) as SVGElement;
    expect(icon.classList.contains("motion-pop-in")).toBe(true);
    expect(getComputedStyle(icon).animationName).toBe("vs-pop-in");
  } finally {
    vi.useRealTimers();
    cleanup();
  }
});

test("the status icon remounts (new node identity) across the saving→saved swap", async () => {
  vi.useFakeTimers();
  try {
    let resolveSave!: () => void;
    const onSave = vi.fn(() => new Promise<void>((resolve) => (resolveSave = resolve)));
    const screen = await render(
      <AutoSaveInput aria-label="Name" defaultValue="" onSave={onSave} debounceMs={800} />,
    );

    await screen.getByLabelText("Name").fill("Ada");
    await vi.advanceTimersByTimeAsync(800);
    await expect
      .element(screen.getByLabelText("Name"))
      .toHaveAttribute("data-state", "saving");
    const before = screen.container.querySelector(
      '[data-slot="auto-save-input-status"] svg',
    );
    expect(before).not.toBeNull();

    resolveSave();
    await vi.advanceTimersByTimeAsync(0);
    await expect
      .element(screen.getByLabelText("Name"))
      .toHaveAttribute("data-state", "saved");
    const after = screen.container.querySelector(
      '[data-slot="auto-save-input-status"] svg',
    );
    expect(after).not.toBeNull();
    expect(after).not.toBe(before);
  } finally {
    vi.useRealTimers();
  }
});

test("flipping status twice in quick succession (saving→saved→error) settles on the correct icon", async () => {
  vi.useFakeTimers();
  try {
    let resolveFirst!: () => void;
    let rejectSecond!: (err: Error) => void;
    const onSave = vi
      .fn()
      .mockImplementationOnce(() => new Promise<void>((resolve) => (resolveFirst = resolve)))
      .mockImplementationOnce(
        () => new Promise<void>((_resolve, reject) => (rejectSecond = reject)),
      );

    const screen = await render(
      <AutoSaveInput aria-label="Name" defaultValue="" onSave={onSave} debounceMs={300} />,
    );
    const input = screen.getByLabelText("Name");

    await input.fill("Ada");
    await vi.advanceTimersByTimeAsync(300);
    await expect.element(input).toHaveAttribute("data-state", "saving");

    resolveFirst();
    await vi.advanceTimersByTimeAsync(0);
    await expect.element(input).toHaveAttribute("data-state", "saved");

    await input.fill("Ada Lovelace");
    await vi.advanceTimersByTimeAsync(300);
    await expect.element(input).toHaveAttribute("data-state", "saving");

    rejectSecond(new Error("boom"));
    await vi.advanceTimersByTimeAsync(0);
    await expect.element(input).toHaveAttribute("data-state", "error");

    // No stray icon left behind from an earlier state.
    const icons = screen.container.querySelectorAll(
      '[data-slot="auto-save-input-status"] svg',
    );
    expect(icons.length).toBe(1);
  } finally {
    vi.useRealTimers();
  }
});

// Reduced-motion note: the global `prefers-reduced-motion: reduce` reset in
// packages/design-tokens/src/base.css forces `animation-duration: 0.01ms !important` on
// every element, and `vs-pop-in`'s `to` state (opacity: 1, scale: 1) already
// equals each icon's natural resting style. No per-component `motion-reduce:`
// variant is needed here by design.
