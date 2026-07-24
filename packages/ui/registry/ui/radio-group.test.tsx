import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { RadioGroup, RadioGroupItem } from "./radio-group";

function Basic(props: React.ComponentProps<typeof RadioGroup>) {
  return (
    <RadioGroup aria-label="Density" {...props}>
      <RadioGroupItem value="comfortable" aria-label="Comfortable" />
      <RadioGroupItem value="compact" aria-label="Compact" />
      <RadioGroupItem value="spacious" aria-label="Spacious" />
    </RadioGroup>
  );
}

test("renders a radiogroup with its options", async () => {
  const screen = await render(<Basic />);
  const group = screen.getByRole("radiogroup", { name: "Density" });
  await expect.element(group).toBeInTheDocument();
  await expect.element(group).toHaveAttribute("data-slot", "radio-group");
  await expect.element(group).toHaveAttribute("data-orientation", "vertical");
  await expect.element(group).toHaveClass("gap-3");

  await expect
    .element(screen.getByRole("radio", { name: "Comfortable" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("radio", { name: "Compact" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("radio", { name: "Spacious" }))
    .toBeInTheDocument();
});

test("selecting an option fires onValueChange and updates aria-checked", async () => {
  const onValueChange = vi.fn();
  const screen = await render(<Basic onValueChange={onValueChange} />);
  const compact = screen.getByRole("radio", { name: "Compact" });

  // Native click: Tailwind layout utilities aren't compiled in the vitest browser
  // run, so the size-4 box collapses to zero and Playwright's visibility hit-test
  // fails. The element's click handler still selects the radio.
  (compact.element() as HTMLElement).click();
  expect(onValueChange).toHaveBeenCalledTimes(1);
  expect(onValueChange).toHaveBeenLastCalledWith("compact", expect.anything());
  await expect.element(compact).toHaveAttribute("aria-checked", "true");
  await expect.element(compact).toHaveAttribute("data-checked");
});

test("only one option can be selected at a time", async () => {
  const screen = await render(<Basic defaultValue="comfortable" />);
  const comfortable = screen.getByRole("radio", { name: "Comfortable" });
  const spacious = screen.getByRole("radio", { name: "Spacious" });
  await expect.element(comfortable).toHaveAttribute("aria-checked", "true");

  (spacious.element() as HTMLElement).click();
  await expect.element(spacious).toHaveAttribute("aria-checked", "true");
  await expect.element(comfortable).toHaveAttribute("aria-checked", "false");
});

test("arrow-key navigation moves the selection between options", async () => {
  const onValueChange = vi.fn();
  const screen = await render(
    <Basic defaultValue="comfortable" onValueChange={onValueChange} />,
  );
  const comfortable = screen.getByRole("radio", { name: "Comfortable" });

  comfortable.element().focus();
  // Arrow keys move focus AND selection in a radio group.
  await userEvent.keyboard("{ArrowDown}");
  expect(onValueChange).toHaveBeenLastCalledWith("compact", expect.anything());
  await expect
    .element(screen.getByRole("radio", { name: "Compact" }))
    .toHaveAttribute("aria-checked", "true");
});

test("disabled group prevents selection", async () => {
  const onValueChange = vi.fn();
  const screen = await render(<Basic disabled onValueChange={onValueChange} />);
  const compact = screen.getByRole("radio", { name: "Compact" });
  await expect.element(compact).toHaveAttribute("data-disabled");

  // Native click bypasses pointer-events; the handler must still not fire.
  compact.element().dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(onValueChange).not.toHaveBeenCalled();
});

test("reflects the layout orientation on the data attribute", async () => {
  const screen = await render(<Basic orientation="horizontal" />);
  const group = screen.getByRole("radiogroup", { name: "Density" });
  await expect.element(group).toHaveAttribute("data-orientation", "horizontal");
  await expect.element(group).toHaveAttribute("aria-orientation", "horizontal");
  await expect.element(group).toHaveClass("gap-4");
});

test("no a11y violations when options are labelled", async () => {
  const screen = await render(
    <RadioGroup aria-label="Density">
      <label>
        Comfortable
        <RadioGroupItem value="comfortable" />
      </label>
      <label>
        Compact
        <RadioGroupItem value="compact" />
      </label>
    </RadioGroup>,
  );
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — checked", async () => {
  const screen = await render(<Basic defaultValue="comfortable" />);
  await expectNoA11yViolations(screen.container);
});

test("no a11y violations — disabled", async () => {
  const screen = await render(<Basic disabled />);
  await expectNoA11yViolations(screen.container);
});

test("render composes a custom item element while keeping slot + classes", async () => {
  // Base UI's `render` replaces RadioGroupItem's root
  // host element but merges our data-slot, className, and role="radio" onto it.
  const screen = await render(
    <RadioGroup aria-label="Density">
      <RadioGroupItem
        value="comfortable"
        aria-label="Comfortable"
        className="sentinel-radio"
        render={<div data-testid="custom-radio-root" />}
      />
    </RadioGroup>,
  );
  const radio = screen.getByRole("radio", { name: "Comfortable" });
  const el = radio.element() as HTMLElement;
  expect(el.tagName).toBe("DIV");
  expect(el.getAttribute("data-testid")).toBe("custom-radio-root");
  await expect.element(radio).toHaveAttribute("data-slot", "radio-group-item");
  expect(el.classList.contains("sentinel-radio")).toBe(true);
});

test("supports nativeButton composition for sibling htmlFor labels", async () => {
  const screen = await render(
    <RadioGroup aria-label="Payment method">
      <label htmlFor="payment-card">Card</label>
      <RadioGroupItem
        id="payment-card"
        value="card"
        nativeButton
        render={<button type="button" />}
      />
    </RadioGroup>,
  );
  const radio = screen.getByRole("radio", { name: "Card" });
  expect((radio.element() as HTMLElement).tagName).toBe("BUTTON");
});

test("forwards ref to the underlying radiogroup root element", async () => {
  const ref = React.createRef<HTMLDivElement>();
  await render(
    <RadioGroup ref={ref} aria-label="Density">
      <RadioGroupItem value="comfortable" aria-label="Comfortable" />
    </RadioGroup>,
  );
  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.dataset.slot).toBe("radio-group");
});

/* ---------------------------------------------------------------------------------------------
 * Phase M — error-shake. See use-animation-replay.test.tsx for the hook's own coverage
 * (mechanism, focus preservation, interruption); these tests only verify the wiring.
 * ------------------------------------------------------------------------------------------- */

test("auto-shakes once when the item transitions into invalid", async () => {
  function Harness() {
    const [invalid, setInvalid] = React.useState(false);
    return (
      <div>
        <button type="button" onClick={() => setInvalid(true)}>
          invalidate
        </button>
        <RadioGroup aria-label="Density">
          <RadioGroupItem
            value="compact"
            aria-label="Compact"
            aria-invalid={invalid || undefined}
          />
        </RadioGroup>
      </div>
    );
  }
  const screen = await render(<Harness />);
  const item = screen.getByRole("radio", { name: "Compact" });
  await expect.element(item).not.toHaveClass("motion-shake");
  await screen.getByRole("button", { name: "invalidate" }).click();
  await expect.element(item).toHaveClass("motion-shake");
});

test("does not shake an item that is already invalid at mount", async () => {
  const screen = await render(
    <RadioGroup aria-label="Density">
      <RadioGroupItem value="compact" aria-label="Compact" aria-invalid />
    </RadioGroup>,
  );
  const item = screen.getByRole("radio", { name: "Compact" });
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect((item.element() as HTMLElement).className).not.toContain(
    "motion-shake",
  );
});

test("shakeSignal re-shakes a still-invalid item on repeated failure", async () => {
  function Harness() {
    const [signal, setSignal] = React.useState(0);
    return (
      <div>
        <button type="button" onClick={() => setSignal((s) => s + 1)}>
          retry
        </button>
        <RadioGroup aria-label="Density">
          <RadioGroupItem
            value="compact"
            aria-label="Compact"
            aria-invalid
            shakeSignal={signal}
          />
        </RadioGroup>
      </div>
    );
  }
  const screen = await render(<Harness />);
  const item = screen.getByRole("radio", { name: "Compact" });
  await new Promise((resolve) => setTimeout(resolve, 100));
  await expect.element(item).not.toHaveClass("motion-shake");
  await screen.getByRole("button", { name: "retry" }).click();
  await expect.element(item).toHaveClass("motion-shake");
});

test("applies the size data attribute", async () => {
  const screen = await render(
    <RadioGroup aria-label="Density">
      <RadioGroupItem value="compact" aria-label="Compact" size="sm" />
    </RadioGroup>,
  );
  await expect
    .element(screen.getByRole("radio", { name: "Compact" }))
    .toHaveAttribute("data-size", "sm");
});

/* ---------------------------------------------------------------------------------------------
 * Touch-target remediation (WCAG 2.5.8) — effective hit-area measurement.
 *
 * Same rationale/technique as checkbox.test.tsx: this harness runs without compiled Tailwind, so
 * `before:-inset-1` etc. never resolve to real CSS here. Each test injects a literal <style> tag
 * that is a 1:1 mirror of what these EXACT Tailwind utility values compile to, including the
 * real 1px border that reduces the pseudo-element containing box, keyed to the item's `data-slot`/
 * `data-size` attributes (real regardless of compiled CSS), then measures the REAL,
 * browser-computed layout against it.
 * ------------------------------------------------------------------------------------------- */

function injectRadioItemHitAreaMirror(): () => void {
  const style = document.createElement("style");
  style.textContent = `
    body { margin: 24px; }
    [data-slot="radio-group-item"] { position: relative; display: inline-flex; box-sizing: border-box; border: 1px solid transparent; }
    [data-slot="radio-group-item"][data-size="default"] { width: 16px; height: 16px; }
    [data-slot="radio-group-item"][data-size="sm"] { width: 14px; height: 14px; }
    [data-slot="radio-group-item"][data-size="default"]::before { content: ""; position: absolute; inset: -6px; }
    [data-slot="radio-group-item"][data-size="sm"]::before { content: ""; position: absolute; inset: -6px; }
  `;
  document.head.appendChild(style);
  return () => document.head.removeChild(style);
}

test("default size (16px) resolves an effective hit area >= 24x24 via the before pseudo-element", async () => {
  const cleanup = injectRadioItemHitAreaMirror();
  try {
    const screen = await render(<Basic />);
    const el = screen
      .getByRole("radio", { name: "Comfortable" })
      .element() as HTMLElement;
    el.getBoundingClientRect(); // force a layout flush before reading resolved pseudo-element geometry
    const before = getComputedStyle(el, "::before");
    expect(parseFloat(before.width)).toBeGreaterThanOrEqual(24);
    expect(parseFloat(before.height)).toBeGreaterThanOrEqual(24);
  } finally {
    cleanup();
  }
});

test("sm size (14px) resolves an effective hit area >= 24x24 via the before pseudo-element", async () => {
  const cleanup = injectRadioItemHitAreaMirror();
  try {
    const screen = await render(
      <RadioGroup aria-label="Density">
        <RadioGroupItem value="compact" aria-label="Compact" size="sm" />
      </RadioGroup>,
    );
    const el = screen
      .getByRole("radio", { name: "Compact" })
      .element() as HTMLElement;
    el.getBoundingClientRect(); // force a layout flush before reading resolved pseudo-element geometry
    const before = getComputedStyle(el, "::before");
    expect(parseFloat(before.width)).toBeGreaterThanOrEqual(24);
    expect(parseFloat(before.height)).toBeGreaterThanOrEqual(24);
  } finally {
    cleanup();
  }
});

test("a point just outside the visual dot, inside the expanded hit area, still hits and selects the item", async () => {
  const cleanup = injectRadioItemHitAreaMirror();
  try {
    const onValueChange = vi.fn();
    const screen = await render(<Basic onValueChange={onValueChange} />);
    const el = screen
      .getByRole("radio", { name: "Comfortable" })
      .element() as HTMLElement;
    const rect = el.getBoundingClientRect();
    // 3px left of the visual left edge — inside the 6px expansion.
    const x = rect.left - 3;
    const y = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(x, y);
    expect(hit).toBe(el);
    (hit as HTMLElement).click();
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith(
      "comfortable",
      expect.anything(),
    );
  } finally {
    cleanup();
  }
});

test("a point beyond the expanded hit area does not resolve to the item", async () => {
  const cleanup = injectRadioItemHitAreaMirror();
  try {
    const screen = await render(<Basic />);
    const el = screen
      .getByRole("radio", { name: "Comfortable" })
      .element() as HTMLElement;
    const rect = el.getBoundingClientRect();
    // 8px left of the visual left edge — beyond the 6px expansion boundary.
    const x = rect.left - 8;
    const y = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(x, y);
    expect(hit).not.toBe(el);
  } finally {
    cleanup();
  }
});
