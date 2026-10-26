import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  AutoSaveIndicator,
  AutoSaveInput,
  useInvalidRevert,
} from "./auto-save-input";

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
    // Vitest 5 locators match the accessible name EXACTLY. The polite status text lives
    // inside the <label>, so once saving starts the field's accessible name becomes
    // "Display name Saving" — query by role instead of restating a name that changes with
    // the state under test.
    await expect
      .element(screen.getByRole("textbox"))
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
    // Same as the "saving" test: the accessible name is "Display name Save failed" here.
    await expect
      .element(screen.getByRole("textbox"))
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
      <AutoSaveInput
        aria-label="Name"
        defaultValue=""
        onSave={onSave}
        debounceMs={800}
      />,
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
      <AutoSaveInput
        aria-label="Name"
        defaultValue=""
        onSave={onSave}
        debounceMs={800}
      />,
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
    const onSave = vi.fn(
      () => new Promise<void>((resolve) => (resolveSave = resolve)),
    );
    const screen = await render(
      <AutoSaveInput
        aria-label="Name"
        defaultValue=""
        onSave={onSave}
        debounceMs={800}
      />,
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
      .mockImplementationOnce(
        () => new Promise<void>((resolve) => (resolveFirst = resolve)),
      )
      .mockImplementationOnce(
        () => new Promise<void>((_resolve, reject) => (rejectSecond = reject)),
      );

    const screen = await render(
      <AutoSaveInput
        aria-label="Name"
        defaultValue=""
        onSave={onSave}
        debounceMs={300}
      />,
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

test('AutoSaveIndicator variant="icon": one icon per state, labelled for screen readers, box reserved', async () => {
  const screen = await render(
    <AutoSaveIndicator variant="icon" status="idle" />,
  );
  const region = screen.getByRole("status").element() as HTMLElement;
  expect(region.getAttribute("data-variant")).toBe("icon");
  expect(region.textContent).toBe("");
  expect(region.getAttribute("class")).toContain("size-4");

  await screen.rerender(<AutoSaveIndicator variant="icon" status="saving" />);
  await expect.element(screen.getByRole("status")).toHaveTextContent("Saving");
  expect(region.querySelector("svg")).not.toBeNull();
  expect(region.getAttribute("class")).toContain("size-4");

  await screen.rerender(<AutoSaveIndicator variant="icon" status="saved" />);
  await expect.element(screen.getByRole("status")).toHaveTextContent("Saved");
  expect(region.querySelector("svg")!.getAttribute("class")).toContain(
    "text-muted-foreground",
  );
  await expectNoA11yViolations(screen.container);

  // Back to idle: the check stays mounted while it fades out, with no label.
  await screen.rerender(<AutoSaveIndicator variant="icon" status="idle" />);
  expect(region.textContent).toBe("");
  expect(region.querySelector("svg")).not.toBeNull();
  expect(region.firstElementChild!.getAttribute("class")).toContain(
    "opacity-0",
  );

  await screen.rerender(<AutoSaveIndicator variant="icon" status="error" />);
  await expect
    .element(screen.getByRole("status"))
    .toHaveTextContent("Couldn't save");
  const svg = region.querySelector("svg")!.getAttribute("class")!;
  expect(svg).toContain("text-warning-text");
  expect(svg).toContain("lucide-triangle-alert");
  expect(svg).not.toContain("motion-shake");
});

test("AutoSaveIndicator: a live document's connecting and offline states, worded and never colour alone", async () => {
  const screen = await render(<AutoSaveIndicator status="connecting" />);
  const region = screen.getByRole("status");
  await expect.element(region).toHaveTextContent("Connecting…");
  expect(
    region.element().querySelector('[data-slot="spinner"], svg'),
  ).not.toBeNull();

  await screen.rerender(
    <AutoSaveIndicator
      status="offline"
      labels={{ offline: "Offline — saved on this device" }}
    />,
  );
  await expect
    .element(region)
    .toHaveTextContent("Offline — saved on this device");
  expect(region.element().getAttribute("class")).toContain("text-warning-text");
  expect(
    region.element().querySelector("svg")!.getAttribute("class"),
  ).toContain("lucide-cloud-off");
  await expectNoA11yViolations(screen.container);

  // The icon variant keeps its 16px box and names the state for screen readers.
  await screen.rerender(<AutoSaveIndicator variant="icon" status="offline" />);
  await expect.element(region).toHaveTextContent("Offline — changes will sync");
  expect(region.element().getAttribute("class")).toContain("size-4");
  await screen.rerender(
    <AutoSaveIndicator variant="icon" status="connecting" />,
  );
  await expect.element(region).toHaveTextContent("Connecting");
});

test("AutoSaveIndicator compact=narrow keeps its words in the text slot it hides in a narrow bar", async () => {
  const screen = await render(
    <AutoSaveIndicator
      status="offline"
      compact="narrow"
      labels={{ offline: "Offline — keep this tab open" }}
    />,
  );
  const status = screen.getByRole("status");
  await expect.element(status).toHaveAttribute("data-compact", "narrow");
  expect(
    status.element().querySelector("[data-slot=auto-save-indicator-text]")
      ?.textContent,
  ).toBe("Offline — keep this tab open");
});

test("AutoSaveIndicator invalid: no tick, a visible 'Not saved' in the warning ink, in both variants", async () => {
  for (const variant of ["icon", "text"] as const) {
    const screen = await render(
      <AutoSaveIndicator variant={variant} status="saved" invalid />,
    );
    const status = screen.getByRole("status");
    await expect.element(status).toHaveAttribute("data-invalid", "");
    await expect.element(status).toHaveTextContent("Not saved");
    await expect.element(status).toHaveClass("text-warning-text");
    // The saved tick never shows beside an error.
    expect(status.element().querySelector(".lucide-check")).toBeNull();
    await expectNoA11yViolations(screen.container);
    await screen.unmount();
  }
  const relabelled = await render(
    <AutoSaveIndicator
      variant="icon"
      status="idle"
      invalid
      labels={{ invalid: "Not saved yet" }}
    />,
  );
  await expect
    .element(relabelled.getByRole("status"))
    .toHaveTextContent("Not saved yet");
});

function RevertField({
  saved,
  onRevert,
}: {
  saved: string;
  onRevert: () => void;
}) {
  const [draft, setDraft] = React.useState(saved);
  const revert = useInvalidRevert({
    invalid: draft.trim() === "",
    onRevert: () => {
      setDraft(saved);
      onRevert();
    },
  });
  return (
    <>
      <input
        aria-label="Name"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={revert.onBlur}
        onFocus={revert.onFocus}
      />
      <button type="button">Elsewhere</button>
    </>
  );
}

test("useInvalidRevert: leaving an invalid field puts the saved value back after 1s, once", async () => {
  vi.useFakeTimers();
  try {
    const onRevert = vi.fn();
    const screen = await render(
      <RevertField saved="Ada" onRevert={onRevert} />,
    );
    const input = screen.getByLabelText("Name");
    await input.fill("");
    (input.element() as HTMLInputElement).blur();
    await vi.advanceTimersByTimeAsync(900);
    expect(onRevert).not.toHaveBeenCalled();
    await expect.element(input).toHaveValue("");
    await vi.advanceTimersByTimeAsync(100);
    expect(onRevert).toHaveBeenCalledOnce();
    await expect.element(input).toHaveValue("Ada");
  } finally {
    vi.useRealTimers();
  }
});

test("useInvalidRevert: coming back to the field, or fixing the value, cancels the revert", async () => {
  vi.useFakeTimers();
  try {
    const onRevert = vi.fn();
    const screen = await render(
      <RevertField saved="Ada" onRevert={onRevert} />,
    );
    const input = screen.getByLabelText("Name");
    const element = input.element() as HTMLInputElement;
    await input.fill("");
    element.blur();
    await vi.advanceTimersByTimeAsync(500);
    element.focus();
    await vi.advanceTimersByTimeAsync(1000);
    expect(onRevert).not.toHaveBeenCalled();

    element.blur();
    await vi.advanceTimersByTimeAsync(500);
    await input.fill("Grace");
    await vi.advanceTimersByTimeAsync(1000);
    expect(onRevert).not.toHaveBeenCalled();
    await expect.element(input).toHaveValue("Grace");

    // A valid value left alone is never reverted.
    element.blur();
    await vi.advanceTimersByTimeAsync(2000);
    expect(onRevert).not.toHaveBeenCalled();
  } finally {
    vi.useRealTimers();
  }
});

test("AutoSaveInput: a rejected value reads 'Not saved' (not a failed save) and onInvalidRevert restores the saved value", async () => {
  vi.useFakeTimers();
  try {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onInvalidRevert = vi.fn();
    const screen = await render(
      <AutoSaveInput
        aria-label="Name"
        defaultValue="Ada"
        onSave={onSave}
        validate={(v) => v.trim().length > 0}
        onInvalidRevert={onInvalidRevert}
      />,
    );
    const input = screen.getByRole("textbox");
    await input.fill("");
    await vi.advanceTimersByTimeAsync(10);
    const status = screen.container.querySelector(
      '[data-slot="auto-save-input-status"]',
    );
    expect(status?.textContent).toContain("Not saved");
    expect(status?.textContent).not.toContain("Save failed");

    (input.element() as HTMLInputElement).blur();
    await vi.advanceTimersByTimeAsync(1000);
    expect(onInvalidRevert).toHaveBeenCalledWith("Ada");
    await expect.element(input).toHaveValue("Ada");
    await expect.element(input).toHaveAttribute("data-state", "idle");
    expect(onSave).not.toHaveBeenCalled();
  } finally {
    vi.useRealTimers();
  }
});

test("AutoSaveInput: a save that lands after a newer invalid edit is what the revert restores", async () => {
  vi.useFakeTimers();
  try {
    let resolveSave: () => void = () => {};
    const onSave = vi.fn(
      () => new Promise<void>((resolve) => (resolveSave = resolve)),
    );
    const onInvalidRevert = vi.fn();
    const screen = await render(
      <AutoSaveInput
        aria-label="Name"
        defaultValue="Ada"
        debounceMs={100}
        onSave={onSave}
        validate={(v) => v.trim().length > 0}
        onInvalidRevert={onInvalidRevert}
      />,
    );
    const input = screen.getByRole("textbox");
    await input.fill("Grace");
    await vi.advanceTimersByTimeAsync(100);
    expect(onSave).toHaveBeenCalledWith("Grace");
    // Cleared while "Grace" is still in flight; then "Grace" lands.
    await input.fill("");
    resolveSave();
    await vi.advanceTimersByTimeAsync(10);
    (input.element() as HTMLInputElement).blur();
    await vi.advanceTimersByTimeAsync(1000);
    expect(onInvalidRevert).toHaveBeenCalledWith("Grace");
    await expect.element(input).toHaveValue("Grace");
  } finally {
    vi.useRealTimers();
  }
});

test("AutoSaveInput: a revert due while a save is in flight waits for it and restores what persisted", async () => {
  vi.useFakeTimers();
  try {
    let resolveSave: () => void = () => {};
    const onSave = vi.fn(
      () => new Promise<void>((resolve) => (resolveSave = resolve)),
    );
    const onInvalidRevert = vi.fn();
    const screen = await render(
      <AutoSaveInput
        aria-label="Name"
        defaultValue="Ada"
        debounceMs={100}
        onSave={onSave}
        validate={(v) => v.trim().length > 0}
        onInvalidRevert={onInvalidRevert}
      />,
    );
    const input = screen.getByRole("textbox");
    await input.fill("Grace");
    await vi.advanceTimersByTimeAsync(100);
    await input.fill("");
    await vi.advanceTimersByTimeAsync(10);
    (input.element() as HTMLInputElement).blur();
    await vi.advanceTimersByTimeAsync(1000);
    // The revert is due, but "Grace" has not landed yet: nothing is put back.
    expect(onInvalidRevert).not.toHaveBeenCalled();
    resolveSave();
    // The save's settle chain is several promise hops; let them all run.
    for (let i = 0; i < 5; i++) await vi.advanceTimersByTimeAsync(10);
    expect(onInvalidRevert).toHaveBeenCalledWith("Grace");
    await expect.element(input).toHaveValue("Grace");
  } finally {
    vi.useRealTimers();
  }
});

test("AutoSaveInput: a revert waiting on a save is dropped when the field is used again", async () => {
  vi.useFakeTimers();
  try {
    let resolveSave: () => void = () => {};
    const onSave = vi.fn(
      () => new Promise<void>((resolve) => (resolveSave = resolve)),
    );
    const onInvalidRevert = vi.fn();
    const screen = await render(
      <AutoSaveInput
        aria-label="Name"
        defaultValue="Ada"
        debounceMs={100}
        onSave={onSave}
        validate={(v) => v.trim().length > 0}
        onInvalidRevert={onInvalidRevert}
      />,
    );
    const input = screen.getByRole("textbox");
    const element = input.element() as HTMLInputElement;
    await input.fill("Grace");
    await vi.advanceTimersByTimeAsync(100);
    await input.fill("");
    await vi.advanceTimersByTimeAsync(10);
    element.blur();
    await vi.advanceTimersByTimeAsync(1000);
    // The revert is queued behind "Grace"; the person comes back and types.
    element.focus();
    await input.fill("Katherine");
    resolveSave();
    for (let i = 0; i < 5; i++) await vi.advanceTimersByTimeAsync(10);
    expect(onInvalidRevert).not.toHaveBeenCalled();
    await expect.element(input).toHaveValue("Katherine");
  } finally {
    vi.useRealTimers();
  }
});

test("AutoSaveInput: saves landing out of order leave the newest as the baseline a revert restores", async () => {
  vi.useFakeTimers();
  try {
    const resolvers: Record<string, () => void> = {};
    const onSave = vi.fn(
      (value: string) =>
        new Promise<void>((resolve) => (resolvers[value] = resolve)),
    );
    const onInvalidRevert = vi.fn();
    const screen = await render(
      <AutoSaveInput
        aria-label="Name"
        defaultValue="Ada"
        debounceMs={100}
        onSave={onSave}
        validate={(v) => v.trim().length > 0}
        onInvalidRevert={onInvalidRevert}
      />,
    );
    const input = screen.getByRole("textbox");
    await input.fill("Grace");
    await vi.advanceTimersByTimeAsync(100);
    await input.fill("Lin");
    await vi.advanceTimersByTimeAsync(100);
    expect(onSave.mock.calls.map(([v]) => v)).toEqual(["Grace", "Lin"]);
    await input.fill("");
    await vi.advanceTimersByTimeAsync(10);
    (input.element() as HTMLInputElement).blur();
    await vi.advanceTimersByTimeAsync(1000);
    resolvers.Lin!();
    for (let i = 0; i < 5; i++) await vi.advanceTimersByTimeAsync(10);
    // "Grace" is still out: no revert yet.
    expect(onInvalidRevert).not.toHaveBeenCalled();
    resolvers.Grace!();
    for (let i = 0; i < 5; i++) await vi.advanceTimersByTimeAsync(10);
    expect(onInvalidRevert).toHaveBeenCalledWith("Lin");
    await expect.element(input).toHaveValue("Lin");
  } finally {
    vi.useRealTimers();
  }
});

test("AutoSaveInput: switching the revert off drops a revert already queued behind a save", async () => {
  vi.useFakeTimers();
  try {
    let resolveSave: () => void = () => {};
    const onSave = vi.fn(
      () => new Promise<void>((resolve) => (resolveSave = resolve)),
    );
    const onInvalidRevert = vi.fn();
    const field = (revert?: (saved: string) => void) => (
      <AutoSaveInput
        aria-label="Name"
        defaultValue="Ada"
        debounceMs={100}
        onSave={onSave}
        validate={(v) => v.trim().length > 0}
        onInvalidRevert={revert}
      />
    );
    const screen = await render(field(onInvalidRevert));
    const input = screen.getByRole("textbox");
    await input.fill("Grace");
    await vi.advanceTimersByTimeAsync(100);
    await input.fill("");
    await vi.advanceTimersByTimeAsync(10);
    (input.element() as HTMLInputElement).blur();
    await vi.advanceTimersByTimeAsync(1000);
    await screen.rerender(field(undefined));
    resolveSave();
    for (let i = 0; i < 5; i++) await vi.advanceTimersByTimeAsync(10);
    expect(onInvalidRevert).not.toHaveBeenCalled();
    await expect.element(input).toHaveValue("");
  } finally {
    vi.useRealTimers();
  }
});
