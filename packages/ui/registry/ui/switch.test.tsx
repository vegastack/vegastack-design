import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { Switch } from "./switch";

test("renders a switch with the slot and default size attributes", async () => {
  const screen = await render(<Switch aria-label="Notifications" />);
  const sw = screen.getByRole("switch", { name: "Notifications" });
  await expect.element(sw).toBeInTheDocument();
  await expect.element(sw).toHaveAttribute("data-slot", "switch");
  await expect.element(sw).toHaveAttribute("data-size", "default");
  // Starts unchecked.
  await expect.element(sw).toHaveAttribute("aria-checked", "false");
});

test("toggles on click and fires onCheckedChange", async () => {
  const onCheckedChange = vi.fn();
  const screen = await render(
    <Switch aria-label="Notifications" onCheckedChange={onCheckedChange} />,
  );
  const sw = screen.getByRole("switch", { name: "Notifications" });

  // The thumb is empty, so the track has no intrinsic size without compiled
  // Tailwind (CSS isn't loaded in unit tests) — dispatch a native click so the
  // handler runs without Playwright's visibility/actionability checks.
  sw.element().dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(onCheckedChange).toHaveBeenCalledTimes(1);
  expect(onCheckedChange).toHaveBeenLastCalledWith(true, expect.anything());
  await expect.element(sw).toHaveAttribute("aria-checked", "true");
  await expect.element(sw).toHaveAttribute("data-checked");

  sw.element().dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(onCheckedChange).toHaveBeenCalledTimes(2);
  expect(onCheckedChange).toHaveBeenLastCalledWith(false, expect.anything());
  await expect.element(sw).toHaveAttribute("aria-checked", "false");
  await expect.element(sw).toHaveAttribute("data-unchecked");
});

test("renders an initial on state from defaultChecked", async () => {
  const screen = await render(<Switch aria-label="Dark mode" defaultChecked />);
  await expect
    .element(screen.getByRole("switch", { name: "Dark mode" }))
    .toHaveAttribute("aria-checked", "true");
});

test("a disabled switch does not toggle or fire onCheckedChange", async () => {
  const onCheckedChange = vi.fn();
  const screen = await render(
    <Switch aria-label="Locked" disabled onCheckedChange={onCheckedChange} />,
  );
  const sw = screen.getByRole("switch", { name: "Locked" });
  await expect.element(sw).toBeDisabled();
  await expect.element(sw).toHaveAttribute("data-disabled");

  // Native click bypasses pointer-events; the handler must still not fire.
  sw.element().dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(onCheckedChange).not.toHaveBeenCalled();
  await expect.element(sw).toHaveAttribute("aria-checked", "false");
});

test("reflects the size variant on the data-size attribute", async () => {
  const screen = await render(<Switch aria-label="Compact" size="sm" />);
  await expect
    .element(screen.getByRole("switch", { name: "Compact" }))
    .toHaveAttribute("data-size", "sm");
});

test("no a11y violations with an accessible name", async () => {
  const screen = await render(<Switch aria-label="Wireless" />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — checked", async () => {
  const screen = await render(<Switch aria-label="Wireless" defaultChecked />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(<Switch aria-label="Locked" disabled />);
  await expectNoA11yViolations(screen.container);
});

test("render composes a custom root element while keeping slot + classes", async () => {
  // Base UI's `render` replaces the root host element
  // but merges our wrapper's data-slot, className, and role onto it.
  const screen = await render(
    <Switch
      aria-label="Notifications"
      className="sentinel-switch"
      render={<div data-testid="custom-switch-root" />}
    />,
  );
  const sw = screen.getByRole("switch", { name: "Notifications" });
  const el = sw.element() as HTMLElement;
  expect(el.tagName).toBe("DIV");
  expect(el.getAttribute("data-testid")).toBe("custom-switch-root");
  await expect.element(sw).toHaveAttribute("data-slot", "switch");
  expect(el.classList.contains("sentinel-switch")).toBe(true);
});

test("supports nativeButton composition for sibling htmlFor labels", async () => {
  const screen = await render(
    <div>
      <label htmlFor="notifications-switch">Notifications</label>
      <Switch
        id="notifications-switch"
        nativeButton
        render={<button type="button" />}
      />
    </div>,
  );
  const sw = screen.getByRole("switch", { name: "Notifications" });
  expect((sw.element() as HTMLElement).tagName).toBe("BUTTON");
});

test("forwards ref to the underlying switch root element", async () => {
  // Base UI's Switch.Root renders a `<span role="switch">` (not a native
  // <button>) plus a hidden <input> — so the forwarded ref lands on that span.
  const ref = React.createRef<HTMLSpanElement>();
  await render(<Switch ref={ref} aria-label="Notifications" />);
  expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  expect(ref.current?.getAttribute("role")).toBe("switch");
  expect(ref.current?.dataset.slot).toBe("switch");
});

/* ---------------------------------------------------------------------------------------------
 * Touch-target remediation (WCAG 2.5.8) — effective hit-area measurement.
 *
 * Same rationale/technique as checkbox.test.tsx: this harness runs without compiled Tailwind, so
 * `before:-inset-y-*` never resolves to real CSS here. Each test injects a literal <style> tag
 * that is a 1:1 mirror of what these EXACT Tailwind utility values compile to (the "-inset-1 =
 * 4px" scale this remediation's house rule documents), keyed to the switch's own `data-slot`/
 * `data-size` attributes (real regardless of compiled CSS), then measures the REAL,
 * browser-computed layout against it.
 *
 * `sm`/`default` are fixed VERTICALLY only (`before:inset-x-0 before:-inset-y-*`) — width already
 * clears 24px at every size, so only height needs help. `lg` is intentionally left unmirrored /
 * untested here: it already renders at 24×44, so the component adds no `before` pseudo for it.
 * ------------------------------------------------------------------------------------------- */

function injectSwitchHitAreaMirror(): () => void {
  const style = document.createElement("style");
  style.textContent = `
    body { margin: 24px; }
    [data-slot="switch"] { position: relative; display: inline-flex; box-sizing: border-box; }
    [data-slot="switch"][data-size="sm"] { width: 28px; height: 16px; }
    [data-slot="switch"][data-size="default"] { width: 36px; height: 20px; }
    [data-slot="switch"][data-size="sm"]::before { content: ""; position: absolute; left: 0; right: 0; top: -4px; bottom: -4px; }
    [data-slot="switch"][data-size="default"]::before { content: ""; position: absolute; left: 0; right: 0; top: -2px; bottom: -2px; }
  `;
  document.head.appendChild(style);
  return () => document.head.removeChild(style);
}

test("sm size (16px tall) resolves an effective hit area >= 24x24 via the before pseudo-element", async () => {
  const cleanup = injectSwitchHitAreaMirror();
  try {
    const screen = await render(<Switch aria-label="Compact" size="sm" />);
    const el = screen.getByRole("switch", { name: "Compact" }).element() as HTMLElement;
    el.getBoundingClientRect(); // force a layout flush before reading resolved pseudo-element geometry
    const before = getComputedStyle(el, "::before");
    // Width is UNCHANGED (28px, already >= 24) — only height is expanded.
    expect(parseFloat(before.width)).toBeCloseTo(28, 0);
    expect(parseFloat(before.height)).toBeGreaterThanOrEqual(24);
  } finally {
    cleanup();
  }
});

test("default size (20px tall) resolves an effective hit area >= 24x24 via the before pseudo-element", async () => {
  const cleanup = injectSwitchHitAreaMirror();
  try {
    const screen = await render(<Switch aria-label="Notifications" />);
    const el = screen.getByRole("switch", { name: "Notifications" }).element() as HTMLElement;
    el.getBoundingClientRect(); // force a layout flush before reading resolved pseudo-element geometry
    const before = getComputedStyle(el, "::before");
    // Width is UNCHANGED (36px, already >= 24) — only height is expanded.
    expect(parseFloat(before.width)).toBeCloseTo(36, 0);
    expect(parseFloat(before.height)).toBeGreaterThanOrEqual(24);
  } finally {
    cleanup();
  }
});

test("a point just above the visual track, inside the expanded hit area, still hits and toggles the switch", async () => {
  const cleanup = injectSwitchHitAreaMirror();
  try {
    const onCheckedChange = vi.fn();
    const screen = await render(
      <Switch aria-label="Compact" size="sm" onCheckedChange={onCheckedChange} />,
    );
    const el = screen.getByRole("switch", { name: "Compact" }).element() as HTMLElement;
    const rect = el.getBoundingClientRect();
    // 3px above the visual top edge — inside the 4px `before:-inset-y-1` expansion, outside the 16px track.
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

test("a point beyond the expanded hit area does not resolve to the switch", async () => {
  const cleanup = injectSwitchHitAreaMirror();
  try {
    const screen = await render(<Switch aria-label="Compact" size="sm" />);
    const el = screen.getByRole("switch", { name: "Compact" }).element() as HTMLElement;
    const rect = el.getBoundingClientRect();
    // 8px above the visual top edge — 4px beyond the 4px `before:-inset-y-1` expansion boundary.
    const x = rect.left + rect.width / 2;
    const y = rect.top - 8;
    const hit = document.elementFromPoint(x, y);
    expect(hit).not.toBe(el);
  } finally {
    cleanup();
  }
});
