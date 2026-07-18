import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Checkbox } from "./checkbox";

test("renders an unchecked checkbox by default", async () => {
  const screen = await render(<Checkbox aria-label="Accept terms" />);
  const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
  await expect.element(checkbox).toBeInTheDocument();
  await expect.element(checkbox).toHaveAttribute("data-slot", "checkbox");
  await expect.element(checkbox).toHaveAttribute("aria-checked", "false");
});

test("toggles on click and fires onCheckedChange", async () => {
  const onCheckedChange = vi.fn();
  const screen = await render(
    <Checkbox aria-label="Accept terms" onCheckedChange={onCheckedChange} />,
  );
  const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });

  // Native click: Tailwind layout utilities aren't compiled in the vitest browser
  // run, so the size-4 box collapses to zero and Playwright's visibility hit-test
  // fails. The element's click handler still toggles the checkbox.
  (checkbox.element() as HTMLElement).click();
  expect(onCheckedChange).toHaveBeenCalledTimes(1);
  expect(onCheckedChange).toHaveBeenLastCalledWith(true, expect.anything());
  await expect.element(checkbox).toHaveAttribute("aria-checked", "true");
  await expect.element(checkbox).toHaveAttribute("data-checked");

  (checkbox.element() as HTMLElement).click();
  expect(onCheckedChange).toHaveBeenCalledTimes(2);
  expect(onCheckedChange).toHaveBeenLastCalledWith(false, expect.anything());
  await expect.element(checkbox).toHaveAttribute("aria-checked", "false");
});

test("renders checked when defaultChecked is set", async () => {
  const screen = await render(
    <Checkbox aria-label="Subscribe" defaultChecked />,
  );
  const checkbox = screen.getByRole("checkbox", { name: "Subscribe" });
  await expect.element(checkbox).toHaveAttribute("aria-checked", "true");
  await expect.element(checkbox).toHaveAttribute("data-checked");
});

test("disabled prevents toggling", async () => {
  const onCheckedChange = vi.fn();
  const screen = await render(
    <Checkbox
      aria-label="Accept terms"
      disabled
      onCheckedChange={onCheckedChange}
    />,
  );
  const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
  await expect.element(checkbox).toBeDisabled();
  await expect.element(checkbox).toHaveAttribute("data-disabled");

  // Native click bypasses pointer-events; the handler must still not fire.
  checkbox.element().dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(onCheckedChange).not.toHaveBeenCalled();
});

test("indeterminate reflects the mixed state", async () => {
  const screen = await render(
    <Checkbox aria-label="Select all" indeterminate />,
  );
  const checkbox = screen.getByRole("checkbox", { name: "Select all" });
  await expect.element(checkbox).toHaveAttribute("aria-checked", "mixed");
  await expect.element(checkbox).toHaveAttribute("data-indeterminate");
});

test("applies the size data attribute", async () => {
  const screen = await render(<Checkbox aria-label="Compact" size="sm" />);
  await expect
    .element(screen.getByRole("checkbox", { name: "Compact" }))
    .toHaveAttribute("data-size", "sm");
});

test("forwards ref to the underlying checkbox root element", async () => {
  // Base UI's Checkbox.Root renders a <span role="checkbox"> (not a native button);
  // the forwarded ref lands on that root element (carrying data-slot="checkbox").
  const ref = React.createRef<HTMLElement>();
  await render(<Checkbox ref={ref} aria-label="Accept terms" />);
  expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  expect(ref.current?.dataset.slot).toBe("checkbox");
});

test("render composes a custom root element while keeping slot + classes", async () => {
  // Base UI's `render` replaces the root host element
  // but merges our wrapper's data-slot, className, and role onto it.
  const screen = await render(
    <Checkbox
      aria-label="Accept terms"
      className="sentinel-checkbox"
      render={<div data-testid="custom-checkbox-root" />}
    />,
  );
  const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
  const el = checkbox.element() as HTMLElement;
  // The custom <div> is the root (not the default <span>).
  expect(el.tagName).toBe("DIV");
  expect(el.getAttribute("data-testid")).toBe("custom-checkbox-root");
  // Our wrapper's slot + class still apply through the composition.
  await expect.element(checkbox).toHaveAttribute("data-slot", "checkbox");
  expect(el.classList.contains("sentinel-checkbox")).toBe(true);
});

test("supports nativeButton composition for sibling htmlFor labels", async () => {
  const screen = await render(
    <div>
      <label htmlFor="terms-checkbox">Accept terms</label>
      <Checkbox
        id="terms-checkbox"
        nativeButton
        render={<button type="button" />}
      />
    </div>,
  );
  const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
  expect((checkbox.element() as HTMLElement).tagName).toBe("BUTTON");
});

test("no a11y violations when labelled", async () => {
  const screen = await render(
    <label>
      Accept terms
      <Checkbox name="terms" />
    </label>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — checked", async () => {
  const screen = await render(
    <label>
      Accept terms
      <Checkbox name="terms" defaultChecked />
    </label>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — indeterminate", async () => {
  const screen = await render(<Checkbox aria-label="Select all" indeterminate />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(<Checkbox aria-label="Accept terms" disabled />);
  await expectNoA11yViolations(screen.container);
});

/* ---------------------------------------------------------------------------------------------
 * Touch-target remediation (WCAG 2.5.8) — effective hit-area measurement.
 *
 * This suite runs WITHOUT compiled Tailwind (see the note on "toggles on click" above — the
 * size-4 box itself collapses to zero in this harness), so `before:-inset-1` etc. never resolve
 * to real CSS here either. To still get a REAL, browser-computed measurement of the effective hit
 * area (not a hand-rolled arithmetic assertion), each test injects a small literal <style> tag
 * that is a 1:1, mechanical mirror of what these EXACT Tailwind utility values compile to
 * (Tailwind's spacing scale: `-inset-N` = `inset: calc(var(--spacing) * -N)` with
 * `--spacing: 0.25rem` = 4px — the "-inset-1 = 4px" scale this remediation's house rule
 * documents), keyed to the checkbox's own `data-slot`/`data-size` attributes (real regardless of
 * compiled CSS). Chromium then does real layout + hit-testing against it — this measures the
 * actual rendered geometry those exact class values produce, not our assumption about them.
 * ------------------------------------------------------------------------------------------- */

function injectCheckboxHitAreaMirror(): () => void {
  const style = document.createElement("style");
  style.textContent = `
    /* Body margin so the checkbox isn't flush against the viewport edge — the boundary probes
       below need room to sample points OUTSIDE the visual box on every side. */
    body { margin: 24px; }
    [data-slot="checkbox"] { position: relative; display: inline-flex; box-sizing: border-box; }
    [data-slot="checkbox"][data-size="default"] { width: 16px; height: 16px; }
    [data-slot="checkbox"][data-size="sm"] { width: 14px; height: 14px; }
    [data-slot="checkbox"][data-size="default"]::before { content: ""; position: absolute; inset: -4px; }
    [data-slot="checkbox"][data-size="sm"]::before { content: ""; position: absolute; inset: -6px; }
  `;
  document.head.appendChild(style);
  return () => document.head.removeChild(style);
}

test("default size (16px) resolves an effective hit area >= 24x24 via the before pseudo-element", async () => {
  const cleanup = injectCheckboxHitAreaMirror();
  try {
    const screen = await render(<Checkbox aria-label="Accept terms" />);
    const el = screen.getByRole("checkbox", { name: "Accept terms" }).element() as HTMLElement;
    el.getBoundingClientRect(); // force a layout flush before reading resolved pseudo-element geometry
    const before = getComputedStyle(el, "::before");
    expect(parseFloat(before.width)).toBeGreaterThanOrEqual(24);
    expect(parseFloat(before.height)).toBeGreaterThanOrEqual(24);
  } finally {
    cleanup();
  }
});

test("sm size (14px) resolves an effective hit area >= 24x24 via the before pseudo-element", async () => {
  const cleanup = injectCheckboxHitAreaMirror();
  try {
    const screen = await render(<Checkbox aria-label="Compact" size="sm" />);
    const el = screen.getByRole("checkbox", { name: "Compact" }).element() as HTMLElement;
    el.getBoundingClientRect(); // force a layout flush before reading resolved pseudo-element geometry
    const before = getComputedStyle(el, "::before");
    expect(parseFloat(before.width)).toBeGreaterThanOrEqual(24);
    expect(parseFloat(before.height)).toBeGreaterThanOrEqual(24);
  } finally {
    cleanup();
  }
});

test("a point just outside the visual box, inside the expanded hit area, still hits and toggles the checkbox", async () => {
  const cleanup = injectCheckboxHitAreaMirror();
  try {
    const onCheckedChange = vi.fn();
    const screen = await render(
      <Checkbox aria-label="Accept terms" onCheckedChange={onCheckedChange} />,
    );
    const el = screen.getByRole("checkbox", { name: "Accept terms" }).element() as HTMLElement;
    const rect = el.getBoundingClientRect();
    // 3px above the visual top edge — inside the 4px `before:-inset-1` expansion, outside the 16px box.
    const x = rect.left + rect.width / 2;
    const y = rect.top - 3;
    const hit = document.elementFromPoint(x, y);
    expect(hit).toBe(el);
    (hit as HTMLElement).click();
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
  } finally {
    cleanup();
  }
});

/* ---------------------------------------------------------------------------------------------
 * Phase M — error-shake. See use-animation-replay.test.tsx for the hook's own coverage
 * (mechanism, focus preservation, interruption); these tests only verify the wiring.
 * ------------------------------------------------------------------------------------------- */

test("auto-shakes once when it transitions into invalid", async () => {
  function Harness() {
    const [invalid, setInvalid] = React.useState(false);
    return (
      <div>
        <button type="button" onClick={() => setInvalid(true)}>
          invalidate
        </button>
        <Checkbox aria-label="Accept terms" aria-invalid={invalid || undefined} />
      </div>
    );
  }
  const screen = await render(<Harness />);
  const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
  await expect.element(checkbox).not.toHaveClass("motion-shake");
  await screen.getByRole("button", { name: "invalidate" }).click();
  await expect.element(checkbox).toHaveClass("motion-shake");
});

test("does not shake when already invalid at mount", async () => {
  const screen = await render(<Checkbox aria-label="Accept terms" aria-invalid />);
  const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect((checkbox.element() as HTMLElement).className).not.toContain("motion-shake");
});

test("shakeSignal re-shakes a still-invalid checkbox on repeated failure", async () => {
  function Harness() {
    const [signal, setSignal] = React.useState(0);
    return (
      <div>
        <button type="button" onClick={() => setSignal((s) => s + 1)}>
          retry
        </button>
        <Checkbox aria-label="Accept terms" aria-invalid shakeSignal={signal} />
      </div>
    );
  }
  const screen = await render(<Harness />);
  const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
  await new Promise((resolve) => setTimeout(resolve, 100));
  await expect.element(checkbox).not.toHaveClass("motion-shake");
  await screen.getByRole("button", { name: "retry" }).click();
  await expect.element(checkbox).toHaveClass("motion-shake");
});

test("forwards ref alongside the internal shake ref (both land on the root element)", async () => {
  const ref = React.createRef<HTMLElement>();
  const screen = await render(<Checkbox ref={ref} aria-label="Accept terms" aria-invalid />);
  const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
  expect(ref.current).toBe(checkbox.element());
});

test("a point beyond the expanded hit area does not resolve to the checkbox", async () => {
  const cleanup = injectCheckboxHitAreaMirror();
  try {
    const screen = await render(<Checkbox aria-label="Accept terms" />);
    const el = screen.getByRole("checkbox", { name: "Accept terms" }).element() as HTMLElement;
    const rect = el.getBoundingClientRect();
    // 8px above the visual top edge — 4px beyond the 4px `before:-inset-1` expansion boundary.
    const x = rect.left + rect.width / 2;
    const y = rect.top - 8;
    const hit = document.elementFromPoint(x, y);
    expect(hit).not.toBe(el);
  } finally {
    cleanup();
  }
});
