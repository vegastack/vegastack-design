import "./contrast.css"; // compiled Tailwind + @vegastack token theme (Vite via @tailwindcss/vite)
import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { expect, test } from "vitest";
import { Button, type ButtonTone } from "../registry/ui/button";
import { IconButton } from "../registry/ui/icon-button";

/**
 * Button matrix gate (audit 2026-09-07, F2). The unit suite runs WITHOUT compiled CSS, so a claim
 * about geometry, opacity or a resolved custom property can only be measured here — this file
 * imports the same compiled-theme entry the contrast and surface-ladder gates use.
 *
 * What it pins, and the defect each pin catches:
 *
 *  - every `tone` actually defines the vars its recipes read (a typo'd `--btn-*` name renders an
 *    invisible button rather than failing);
 *  - `loading` does not move the button's width (B1-08 — the spinner is out of flow, the label
 *    keeps its box);
 *  - `disabled` dims but `loading` does not, and neither sets `pointer-events: none` (D7 — a
 *    disabled control must stay hoverable so a Tooltip can explain why);
 *  - `IconButton` is a true square, and `shape="round"` is actually round.
 */

const TONES: readonly ButtonTone[] = [
  "neutral",
  "destructive",
  "success",
  "warning",
  "info",
];

/**
 * Every custom property a variant recipe reads, EXCEPT `--btn-ghost-ink`: the neutral tone sets it
 * to the `inherit` keyword, which is invalid at computed-value time for a custom property and so
 * reads back empty. That is the intended mechanism (a neutral ghost keeps its host's ink) and it
 * gets its own test below.
 */
const TONE_VARS = [
  "--btn-fill",
  "--btn-fill-hover",
  "--btn-fill-active",
  "--btn-ink",
  "--btn-soft",
  "--btn-soft-hover",
  "--btn-soft-active",
  "--btn-tint",
  "--btn-face",
  "--btn-line",
  "--btn-line-hover",
  "--btn-link",
] as const;

test("every tone defines every custom property the recipes read", async () => {
  for (const tone of TONES) {
    const screen = await render(
      <Button variant="soft" tone={tone}>
        Action
      </Button>,
    );
    const el = screen.container.querySelector("button")!;
    const style = getComputedStyle(el);
    for (const name of TONE_VARS) {
      expect(
        style.getPropertyValue(name).trim(),
        `${tone} is missing ${name}`,
      ).not.toBe("");
    }
  }
});

test("a soft button's rest, hover and pressed fills are three distinct colours", async () => {
  for (const tone of TONES) {
    const screen = await render(
      <Button variant="soft" tone={tone}>
        Action
      </Button>,
    );
    const style = getComputedStyle(screen.container.querySelector("button")!);
    const rest = style.getPropertyValue("--btn-soft").trim();
    const hover = style.getPropertyValue("--btn-soft-hover").trim();
    const pressed = style.getPropertyValue("--btn-soft-active").trim();
    expect(
      new Set([rest, hover, pressed]).size,
      `${tone} rungs collapsed`,
    ).toBe(3);
  }
});

test("a neutral ghost inherits its host ink; a status ghost takes its own", async () => {
  const screen = await render(
    <div style={{ color: "rgb(1, 2, 3)" }}>
      {/* Parking space for the pointer — see the `userEvent.hover` below. */}
      <div data-testid="away" style={{ height: 240 }} />
      <Button data-testid="neutral" variant="ghost">
        Dismiss
      </Button>
      <Button data-testid="success" variant="ghost" tone="success">
        Approve
      </Button>
    </div>,
  );
  const el = (id: string) =>
    screen.container.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
  const at = (id: string) => getComputedStyle(el(id)).color;

  // This asserts the REST ink, and every test file in the run shares one browser page: the pointer
  // stays wherever the previously executed file left it, so it can already be sitting on top of
  // this button by the time it mounts. A hovered ghost paints `--btn-tint` (for the neutral tone,
  // `--foreground`) instead of inheriting, which made this test fail in the full suite and pass in
  // isolation — the tell was a hover background on `Dismiss` in the failure screenshot. Park the
  // pointer on a spacer so rest is actually rest.
  await userEvent.hover(el("away"));

  expect(at("neutral")).toBe("rgb(1, 2, 3)");
  expect(at("success")).not.toBe("rgb(1, 2, 3)");
});

test("the tone vars follow a NESTED theme scope, not just :root", async () => {
  // Regression: the tone vars first referenced Tailwind's `--color-*` aliases, which are declared
  // once on `:root` and therefore computed there — inside a `<div class="dark">` (or a
  // MarketingSurface) a button kept painting light-theme ink on a dark ground. Referencing the raw
  // token variables makes the value resolve at the button. Caught by the dark half of the
  // rendered-contrast gate; pinned here as the direct assertion.
  const screen = await render(
    <div>
      <Button data-testid="light" variant="soft" tone="destructive">
        Delete
      </Button>
      <div className="dark">
        <Button data-testid="dark" variant="soft" tone="destructive">
          Delete
        </Button>
      </div>
    </div>,
  );
  const ink = (id: string) =>
    getComputedStyle(
      screen.container.querySelector<HTMLElement>(`[data-testid="${id}"]`)!,
    ).color;

  expect(ink("light")).not.toBe("");
  expect(ink("dark")).not.toBe(ink("light"));
});

test("loading does not move the button's width (audit B1-08)", async () => {
  const screen = await render(
    <div>
      <Button data-testid="idle">Save changes</Button>
      <Button data-testid="busy" loading>
        Save changes
      </Button>
    </div>,
  );
  const idle = screen.container.querySelector<HTMLElement>(
    '[data-testid="idle"]',
  )!;
  const busy = screen.container.querySelector<HTMLElement>(
    '[data-testid="busy"]',
  )!;
  expect(
    Math.abs(
      busy.getBoundingClientRect().width - idle.getBoundingClientRect().width,
    ),
  ).toBeLessThan(0.5);
});

test("disabled dims and keeps pointer events; loading does neither (audit D7)", async () => {
  const screen = await render(
    <div>
      <Button data-testid="idle">Save</Button>
      <Button data-testid="off" disabled>
        Save
      </Button>
      <Button data-testid="busy" loading>
        Save
      </Button>
    </div>,
  );
  const at = (id: string) =>
    getComputedStyle(
      screen.container.querySelector<HTMLElement>(`[data-testid="${id}"]`)!,
    );

  expect(Number(at("off").opacity)).toBeLessThan(Number(at("idle").opacity));
  expect(Number(at("busy").opacity)).toBe(Number(at("idle").opacity));
  // The whole point of D7: a disabled control has to be hoverable to carry a Tooltip.
  expect(at("off").pointerEvents).not.toBe("none");
  expect(at("off").cursor).toBe("not-allowed");
});

test("IconButton is a true square at every size, and shape=round is round", async () => {
  const screen = await render(
    <div>
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <IconButton
          key={size}
          data-testid={`sq-${size}`}
          size={size}
          aria-label={`Add ${size}`}
        >
          <svg aria-hidden />
        </IconButton>
      ))}
      <IconButton data-testid="round" shape="round" aria-label="Add round">
        <svg aria-hidden />
      </IconButton>
    </div>,
  );

  for (const size of ["xs", "sm", "md", "lg"] as const) {
    const box = screen.container
      .querySelector<HTMLElement>(`[data-testid="sq-${size}"]`)!
      .getBoundingClientRect();
    expect(
      Math.abs(box.width - box.height),
      `${size} is not square`,
    ).toBeLessThan(0.5);
  }

  const round = screen.container.querySelector<HTMLElement>(
    '[data-testid="round"]',
  )!;
  const radius = Number.parseFloat(getComputedStyle(round).borderTopLeftRadius);
  expect(radius).toBeGreaterThanOrEqual(
    round.getBoundingClientRect().height / 2,
  );
});
