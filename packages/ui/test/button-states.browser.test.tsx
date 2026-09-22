import "./contrast.css"; // compiled Tailwind + @vegastack token theme (Vite via @tailwindcss/vite)
import { RefreshCw } from "lucide-react";
import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { Button } from "../registry/ui/button";
import { isTransparent } from "./color";

/**
 * Button state gate. The unit suite runs WITHOUT compiled CSS, so a claim about geometry, opacity
 * or a resolved colour can only be measured here — this file imports the same compiled-theme entry
 * the contrast gate uses.
 *
 * REPLACED the button MATRIX gate (audit 2026-09-07, F2) in Batch 2 of the shadcn reset. That gate
 * pinned the `variant × tone` custom-property recipe — thirteen `--btn-*` variables, a neutral
 * ghost that inherited its host ink, and the recipe's survival inside a nested theme scope. The
 * reset adopted upstream's flat `variant` API verbatim (API-2 = **shadcn**), so there are no tone
 * variables left to pin. What survives is every claim that is still true, plus the ones the reset
 * introduced:
 *
 *  - `loading` does not move the button's width (API-5 / A11Y-12 — the spinner is out of flow and
 *    the label keeps its box at `opacity: 0`, never `visibility: hidden`);
 *  - `disabled` dims but `loading` does not, and neither sets `pointer-events: none` (FRM-4 — a
 *    disabled control has to stay hoverable so a Tooltip can explain why);
 *  - the `destructive` variant paints a TINT and inks it with `--destructive-text` (A11Y-13);
 *  - a keyboard-focused button paints the ONE global outline and no ring/box-shadow glow
 *    (FOC-1 / FOC-6) — the class-string half is asserted in the unit test, the painted half here;
 *  - the four icon sizes are true squares, and `rounded-full` is actually round.
 */

const VARIANTS = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
] as const;

function token(name: string) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

function resolved(color: string) {
  const probe = document.createElement("span");
  probe.style.color = color;
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

test("loading does not move the button's width (API-5 / A11Y-12)", async () => {
  const screen = await render(
    <div className="flex gap-2">
      <Button data-testid="idle">Save changes</Button>
      <Button data-testid="busy" loading>
        Save changes
      </Button>
    </div>,
  );
  const idle = screen.getByTestId("idle").element().getBoundingClientRect();
  const busy = screen.getByTestId("busy").element().getBoundingClientRect();
  expect(Math.abs(busy.width - idle.width)).toBeLessThan(1);
});

test("the loading label is hidden through a real box and the spinner is centered", async () => {
  const screen = await render(
    <Button loading>
      <span data-testid="label">Save changes</span>
    </Button>,
  );
  const wrapper = screen.getByTestId("label").element().parentElement!;
  const style = getComputedStyle(wrapper);
  expect(style.display).not.toBe("contents");
  expect(wrapper.getClientRects().length).toBeGreaterThan(0);
  expect(wrapper.getBoundingClientRect().width).toBeGreaterThan(0);
  expect(style.opacity).toBe("0");
  expect(style.visibility).not.toBe("hidden");

  const button = screen.getByRole("button", { name: "Save changes" }).element();
  const spinner = button.querySelector('[data-slot="spinner"]')!;
  expect(getComputedStyle(spinner.parentElement!).opacity).toBe("1");
  expect(getComputedStyle(spinner.parentElement!).visibility).toBe("visible");

  const buttonBox = button.getBoundingClientRect();
  const spinnerBox = spinner.getBoundingClientRect();
  expect(spinnerBox.width).toBeGreaterThan(0);
  expect(spinnerBox.height).toBeGreaterThan(0);
  expect(
    Math.abs(
      spinnerBox.x + spinnerBox.width / 2 - buttonBox.x - buttonBox.width / 2,
    ),
  ).toBeLessThan(1);
  expect(
    Math.abs(
      spinnerBox.y + spinnerBox.height / 2 - buttonBox.y - buttonBox.height / 2,
    ),
  ).toBeLessThan(1);
});

test("loading preserves icon-label dimensions and gap for every text size", async () => {
  for (const theme of ["", "dark"] as const) {
    for (const size of ["xs", "sm", "default", "lg"] as const) {
      const children = (
        <>
          <RefreshCw aria-hidden="true" data-testid={`icon-${theme}-${size}`} />
          <span data-testid={`text-${theme}-${size}`}>Regenerate</span>
        </>
      );
      const screen = await render(
        <div className={theme}>
          <Button size={size} data-testid={`idle-${theme}-${size}`}>
            {children}
          </Button>
          <Button loading size={size} data-testid={`busy-${theme}-${size}`}>
            {children}
          </Button>
        </div>,
      );
      const idle = screen.getByTestId(`idle-${theme}-${size}`).element();
      const busy = screen.getByTestId(`busy-${theme}-${size}`).element();
      const idleBox = idle.getBoundingClientRect();
      const busyBox = busy.getBoundingClientRect();
      expect(Math.abs(idleBox.width - busyBox.width)).toBeLessThan(1);
      expect(Math.abs(idleBox.height - busyBox.height)).toBeLessThan(1);

      const gap = (root: Element) => {
        const icon = root
          .querySelector('[data-testid^="icon-"]')!
          .getBoundingClientRect();
        const text = root
          .querySelector('[data-testid^="text-"]')!
          .getBoundingClientRect();
        return text.left - icon.right;
      };
      expect(Math.abs(gap(idle) - gap(busy))).toBeLessThan(1);
      expect(gap(busy)).toBeGreaterThan(0);
    }
  }
});

test("loading toggles without moving a nested label or changing its name", async () => {
  const content = (
    <span>
      <span>Regenerate</span>
    </span>
  );
  const screen = await render(<Button>{content}</Button>);
  const idleButton = screen
    .getByRole("button", { name: "Regenerate" })
    .element();
  const idleBox = idleButton.getBoundingClientRect();

  await screen.rerender(<Button loading>{content}</Button>);
  const busyButton = screen
    .getByRole("button", { name: "Regenerate" })
    .element();
  const busyBox = busyButton.getBoundingClientRect();
  expect(Math.abs(idleBox.width - busyBox.width)).toBeLessThan(1);
  expect(Math.abs(idleBox.height - busyBox.height)).toBeLessThan(1);
  expect(busyButton.querySelector(".opacity-0")).not.toBeNull();

  await screen.rerender(<Button>{content}</Button>);
  const restoredButton = screen
    .getByRole("button", { name: "Regenerate" })
    .element();
  const restoredBox = restoredButton.getBoundingClientRect();
  expect(Math.abs(idleBox.width - restoredBox.width)).toBeLessThan(1);
  expect(Math.abs(idleBox.height - restoredBox.height)).toBeLessThan(1);
  expect(restoredButton.querySelector(".opacity-0")).toBeNull();
});

test("disabled dims, loading does not, and neither removes pointer events (FRM-4)", async () => {
  const screen = await render(
    <div className="flex gap-2">
      <Button data-testid="rest">Rest</Button>
      <Button data-testid="off" disabled>
        Disabled
      </Button>
      <Button data-testid="busy" loading>
        Loading
      </Button>
    </div>,
  );
  const opacity = (id: string) =>
    Number(getComputedStyle(screen.getByTestId(id).element()).opacity);
  const pointer = (id: string) =>
    getComputedStyle(screen.getByTestId(id).element()).pointerEvents;

  expect(opacity("off")).toBeLessThan(opacity("rest"));
  expect(opacity("busy")).toBeCloseTo(opacity("rest"), 2);
  for (const id of ["rest", "off", "busy"])
    expect(pointer(id)).not.toBe("none");
});

test("A11Y-13: the destructive variant is a tint inked with --destructive-text", async () => {
  const screen = await render(
    <Button variant="destructive" data-testid="d">
      Delete
    </Button>,
  );
  const style = getComputedStyle(screen.getByTestId("d").element());
  expect(isTransparent(style.backgroundColor)).toBe(false);
  expect(style.backgroundColor).not.toBe(resolved(token("--destructive")));
  expect(style.color).toBe(resolved(token("--destructive-text")));
});

test("FOC-1 / FOC-6: a keyboard-focused button paints one outline and no glow", async () => {
  for (const variant of VARIANTS) {
    const screen = await render(
      <Button variant={variant} data-testid={`f-${variant}`}>
        Focus
      </Button>,
    );
    const element = screen.getByTestId(`f-${variant}`).element() as HTMLElement;
    await userEvent.tab();
    const style = getComputedStyle(element);
    expect(document.activeElement).toBe(element);
    // The user agent's own ring is not an affordance this system ships.
    expect(style.outlineStyle).not.toBe("auto");
    expect(style.outlineStyle).not.toBe("none");
    expect(Number.parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
    // No ring, and no box-shadow standing in for one.
    expect(style.boxShadow === "none" || style.boxShadow === "").toBe(true);
  }
});

// Batch 7a of the shadcn reset retired `IconButton` in favour of upstream's four icon sizes on
// `Button`. The geometry claim survives the wrapper: these are the sizes a consumer now writes,
// and `rounded-full` is the shape the wrapper's `shape="round"` used to apply.
test("each icon size is a true square, and rounded-full is round", async () => {
  for (const [size, px] of [
    ["icon-xs", 24],
    ["icon-sm", 28],
    ["icon", 32],
    ["icon-lg", 36],
  ] as const) {
    const screen = await render(
      <Button aria-label="Add" size={size} data-testid={`s-${size}`}>
        <svg aria-hidden="true" />
      </Button>,
    );
    const box = screen
      .getByTestId(`s-${size}`)
      .element()
      .getBoundingClientRect();
    expect(box.width).toBeCloseTo(px, 0);
    expect(box.height).toBeCloseTo(px, 0);
  }

  const round = await render(
    <Button
      aria-label="Dismiss"
      size="icon"
      className="rounded-full"
      data-testid="round"
    >
      <svg aria-hidden="true" />
    </Button>,
  );
  const element = round.getByTestId("round").element();
  const { width } = element.getBoundingClientRect();
  expect(
    Number.parseFloat(getComputedStyle(element).borderTopLeftRadius),
  ).toBeGreaterThanOrEqual(width / 2 - 1);
});

test("loading keeps every icon size square and paints its spinner", async () => {
  for (const [size, px] of [
    ["icon-xs", 24],
    ["icon-sm", 28],
    ["icon", 32],
    ["icon-lg", 36],
  ] as const) {
    const screen = await render(
      <Button
        loading
        aria-label={`Loading ${size}`}
        size={size}
        data-testid={`loading-${size}`}
      >
        <RefreshCw aria-hidden="true" />
      </Button>,
    );
    const button = screen.getByTestId(`loading-${size}`).element();
    const box = button.getBoundingClientRect();
    const spinner = button.querySelector('[data-slot="spinner"]')!;
    const spinnerBox = spinner.getBoundingClientRect();
    expect(box.width).toBeCloseTo(px, 0);
    expect(box.height).toBeCloseTo(px, 0);
    expect(spinnerBox.width).toBeGreaterThan(0);
    expect(spinnerBox.height).toBeGreaterThan(0);
  }
});
