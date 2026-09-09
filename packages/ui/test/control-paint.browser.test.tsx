import "./contrast.css"; // compiled Tailwind + @vegastack token theme (Vite via @tailwindcss/vite)
import * as React from "react";
import { render } from "vitest-browser-react";
import { beforeAll, describe, expect, test } from "vitest";

import { Field } from "../registry/ui/field";
import { Input } from "../registry/ui/input";
import { NumberField } from "../registry/ui/number-field";
import { OTPInput } from "../registry/ui/otp-input";
import { Switch } from "../registry/ui/switch";
import { Textarea } from "../registry/ui/textarea";

/**
 * CONTROL-PAINT CONTRACTS — what the browser paints, not what the source authored.
 *
 * WHY THIS LANE EXISTS (2026-09-09)
 *   Four "class-glue" defects shipped to consumers for a full release: two adjacent string
 *   literals concatenated with `+` and no separating space, so the utility on either side of the
 *   seam was destroyed. Every class literal read correctly in review, `design-lint` reported clean,
 *   and `transition-pairing` positively PASSED on a literal whose ease token no longer reached the
 *   element. The Switch measured `background-color: rgba(0, 0, 0, 0)` and `padding: 0px` in BOTH
 *   states — a track with no colour at all, on/off conveyed only by thumb position.
 *
 *   `design-lint`'s `class-glue` rule now rejects that seam structurally, and it is the primary
 *   gate. This lane is the independent one: it asserts the RESULT rather than the shape of the
 *   source, so a future defect that destroys the same utilities by some other mechanism — a
 *   cascade collision, a tailwind-merge conflict, a token rename — is caught too.
 *
 * THE REFERENCE-FIXTURE TECHNIQUE
 *   Rather than hardcode colour strings (which pins the lane to today's token VALUES and turns
 *   every legitimate retune red), each assertion compares against a control the system already
 *   paints correctly, mounted in the same page: a bare `<Input aria-invalid />` is the reference
 *   for "the invalid border tint", and `getComputedStyle(document.documentElement)` supplies the
 *   token for the flat colour assertions. The comparison is therefore about the RULE, not the hue.
 */

/** Resolve a design token to the value the document actually computes for it. */
const token = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/**
 * Compare two computed colours by their numeric components. Chromium serialises the same colour
 * as `oklch(L C H / a)` when it comes straight from a token and as `oklab(…)` once it has been
 * composited through an alpha modifier, so a string comparison across those two forms is noise.
 */
const numbers = (value: string) =>
  (value.match(/-?\d+(?:\.\d+)?/g) ?? []).map((n) => Number(n));

/**
 * Every query is scoped to the mounted container, never `document`. A page-wide
 * `document.querySelector("button")` picks up whatever an earlier test in the file left behind —
 * measured 2026-09-09: it returned the Switch's own `<button>` root instead of the NumberField
 * stepper, and three assertions went red for a reason that had nothing to do with the component.
 */
const within = (container: Element) => ({
  testId: (id: string) =>
    container.querySelector(`[data-testid="${id}"]`) as HTMLElement,
  slot: (name: string) =>
    container.querySelector(`[data-slot="${name}"]`) as HTMLElement,
  one: (selector: string) => container.querySelector(selector) as HTMLElement,
});

/**
 * Wait two frames before measuring. A colour read in the same frame as the mount (or the focus)
 * serialises mid-transition — the same trap `geometry.browser.test.tsx` documents — so the
 * resting and settled values differ only by their serialisation form and a comparison reads as a
 * mismatch that is not one.
 */
const settle = () =>
  new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))),
  );

/**
 * THE STAGE — every fixture mounts inside it, and it is `pointer-events: none`.
 *
 * The Playwright pointer keeps whatever position the previous test file left it in, and a fixture
 * mounted at the top-left of a fresh page lands under it. Measured 2026-09-09: in roughly half of
 * the runs where this file shared the suite with the other form tests, the fixtures matched
 * `:hover` — the reference `<Input aria-invalid />` painted the neutral HOVER tint
 * (`--alpha-border-subtle`, 0.2) instead of the destructive one, and the NumberField stepper
 * painted `hover:text-foreground`. Both components were behaving correctly; the lane was measuring
 * the wrong state and blaming the component for it.
 *
 * `pointer-events: none` makes `:hover` structurally unable to match, wherever the cursor happens
 * to be, and it changes none of the properties this file reads — colour, padding, easing, outline —
 * nor does it stop `element.focus()`. Moving the pointer instead would mean importing
 * `@vitest/browser/context` here, which pulled a mid-run dependency re-optimisation that reloaded
 * live pages across the whole suite. A lane about RESTING paint has to state where the pointer is;
 * this states that it cannot reach the stage at all.
 */
function Stage({ children }: { children: React.ReactNode }) {
  return <div style={{ pointerEvents: "none" }}>{children}</div>;
}

/**
 * COMPILED-CSS SENTINEL — and a WAIT, not just a check.
 *
 * `@tailwindcss/vite` generates this lane's stylesheet on demand, and when the file runs alongside
 * the rest of the suite the sheet can reach the page a few frames after the first test mounts.
 * Measured 2026-09-09: roughly one run in three, the reference `<Input aria-invalid />` read the
 * NEUTRAL `--input` hairline and the NumberField stepper read `--foreground` — not because either
 * component was wrong, but because no utility had been applied yet. A lane that measures an
 * unstyled page is the fail-open every compiled-CSS entry in this directory warns about, so this
 * hook blocks until the sheet is demonstrably live and fails loudly if it never becomes so.
 *
 * The sentinel exercises BOTH halves the assertions depend on: a theme token (`--muted-foreground`
 * must resolve, so `theme.css` is in) and a utility that consumes it (`text-muted-foreground` must
 * paint it, so Tailwind's generated layer is in). Checking only the token would go quiet on exactly
 * the failure above.
 */
beforeAll(async () => {
  const sentinel = document.createElement("div");
  sentinel.className = "size-6 text-muted-foreground";
  document.body.append(sentinel);
  const deadline = Date.now() + 10_000;
  let last = "";
  try {
    for (;;) {
      const style = getComputedStyle(sentinel);
      const expected = token("--muted-foreground");
      last = `width=${style.width} color=${style.color} --muted-foreground=${expected || "<unset>"}`;
      if (
        expected !== "" &&
        style.width === "24px" &&
        numbers(style.color).length > 0 &&
        numbers(style.color).join() === numbers(expected).join()
      )
        return;
      if (Date.now() > deadline)
        throw new Error(
          `the compiled stylesheet never reached the page: ${last}. Every assertion in this file ` +
            `measures compiled CSS and would be vacuous without it.`,
        );
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  } finally {
    sentinel.remove();
  }
});

describe("Switch — the track is painted, in both states", () => {
  /**
   * The defect: `"…p-0.5" + "bg-surface-3 data-checked:bg-primary" + "not-disabled:hover:…"` glued
   * into `p-0.5bg-surface-3` and `data-checked:bg-primarynot-disabled:hover:border-…`. FOUR
   * utilities destroyed at one stroke, and the surviving `not-disabled:data-checked:hover:` rung
   * meant the control appeared only while the pointer was over a checked switch.
   */
  test("the off-track is the surface-3 rung and the on-track is primary", async () => {
    const screen = await render(
      <Stage>
        <Switch data-testid="switch-off" aria-label="off" />
        <Switch data-testid="switch-on" aria-label="on" defaultChecked />
      </Stage>,
    );
    await settle();
    const q = within(screen.container);
    const off = getComputedStyle(q.testId("switch-off"));
    const on = getComputedStyle(q.testId("switch-on"));

    // design.md §Surfaces: "the switch off-track is the exception: `surface-3`", and
    // §Components: "neutral `primary` ink when on". Both are load-bearing prose that measured
    // false for a full release.
    expect(numbers(off.backgroundColor)).toEqual(numbers(token("--surface-3")));
    expect(numbers(on.backgroundColor)).toEqual(numbers(token("--primary")));

    // The 2px inset that gives the thumb its uniform gap. `p-0.5` was the left-hand casualty of
    // the same seam, so a passing colour assertion alone would not have caught it.
    expect(off.padding).toBe("2px");
    expect(on.padding).toBe("2px");
  });

  test("the thumb travels on the motion-ease-standard token, not Tailwind's default", async () => {
    const screen = await render(
      <Stage>
        <Switch data-testid="switch-ease" aria-label="ease" />
      </Stage>,
    );
    await settle();
    const thumb = within(screen.container).testId("switch-ease")
      .firstElementChild as HTMLElement;
    // `ease-standarddata-unchecked:translate-x-0` left the thumb on Chromium's
    // `cubic-bezier(0.4, 0, 0.2, 1)` while `design-lint`'s transition-pairing rule read
    // `ease-standard` in the literal and passed.
    expect(getComputedStyle(thumb).transitionTimingFunction).toBe(
      token("--motion-ease-standard"),
    );
  });
});

describe("Text entry suppresses the global focus ring", () => {
  /**
   * `outline-hiddencaret-foreground` left the OTP slot as the one text-entry surface in the system
   * wearing the 2px `:focus-visible` outline — contradicting its own JSDoc and AGENTS.md
   * § Accessibility, and passing the geometry lane's focus assertion BECAUSE of the defect.
   */
  test("a focused OTP slot shows no outline; the border tint is the affordance", async () => {
    const screen = await render(
      <Stage>
        <OTPInput data-testid="otp-focus" aria-label="code" length={4} />
      </Stage>,
    );
    await settle();
    const slot = within(screen.container).slot("otp-input-slot");
    const rest = numbers(getComputedStyle(slot).borderTopColor);
    slot.focus();
    await settle();
    const focused = getComputedStyle(slot);
    // `outline-hidden` compiles to a TRANSPARENT 2px outline (kept so `forced-colors: active` has
    // something to repaint), which computes as `outline-style: none`.
    expect(focused.outlineStyle).toBe("none");
    expect(numbers(focused.borderTopColor)).not.toEqual(rest);
  });
});

describe("NumberField — the stepper is muted ink with a hover step", () => {
  test("the stepper rests on muted-foreground, not foreground", async () => {
    const screen = await render(
      <Stage>
        <NumberField
          data-testid="nf-ink"
          aria-label="quantity"
          defaultValue={1}
        />
      </Stage>,
    );
    await settle();
    const stepper = within(screen.container).one("button");
    // `text-muted-foregroundhover:text-foreground` shipped the stepper at full `--foreground`
    // with no hover step at all — the seam destroyed both halves of the ink pair.
    expect(numbers(getComputedStyle(stepper).color)).toEqual(
      numbers(token("--muted-foreground")),
    );
    expect(numbers(token("--muted-foreground"))).not.toEqual(
      numbers(token("--foreground")),
    );
  });
});

describe("aria-invalid reaches the element that paints the tint", () => {
  /**
   * `aria-invalid` was accepted and inert on two controls: on `OTPInput` it landed on
   * `OTPField.Root` and the slots never saw it; on `NumberField` it landed on the
   * `[data-field-group]` element itself, and `fieldControlGroup`'s `has-aria-invalid:` is a
   * `:has()` over DESCENDANTS. Both measured the neutral `--input` hairline.
   *
   * `<Input aria-invalid />` is the reference: it is the path that always worked.
   */
  test("a standalone invalid OTPInput and NumberField tint like an invalid Input", async () => {
    const screen = await render(
      <Stage>
        <Input data-testid="ref-invalid" aria-label="reference" aria-invalid />
        <OTPInput aria-label="code" length={4} aria-invalid />
        <NumberField aria-label="quantity" defaultValue={1} aria-invalid />
      </Stage>,
    );
    await settle();
    const q = within(screen.container);
    const reference = numbers(
      getComputedStyle(q.testId("ref-invalid")).borderTopColor,
    );
    const slot = q.slot("otp-input-slot");
    const group = q.one("[data-field-group]");

    expect(slot.getAttribute("aria-invalid")).toBe("true");
    expect(numbers(getComputedStyle(slot).borderTopColor)).toEqual(reference);
    expect(numbers(getComputedStyle(group).borderTopColor)).toEqual(reference);
    // Non-vacuous: the reference really is a different colour from the resting hairline.
    expect(reference).not.toEqual(numbers(token("--input")));
  });

  test("borderlessInvalidRestingBorder — a flattened field still shows the tint at rest", async () => {
    const screen = await render(
      <Stage>
        <Input
          data-testid="ref-borderless"
          aria-label="reference"
          aria-invalid
        />
        <Field label="Title" error="Required" borderless>
          <Input data-testid="borderless-invalid" />
        </Field>
      </Stage>,
    );
    await settle();
    const q = within(screen.container);
    // `BORDERLESS`'s `border-transparent` used to outrank the invalid tint as well as the focus
    // tint, so an invalid inline-edit field measured `rgba(0, 0, 0, 0)` at rest: error copy and
    // the shake fired, and the control itself carried no cue.
    expect(
      numbers(getComputedStyle(q.testId("borderless-invalid")).borderTopColor),
    ).toEqual(
      numbers(getComputedStyle(q.testId("ref-borderless")).borderTopColor),
    );
  });

  test("a Field-wrapped Textarea takes the tint, because Field can reach it now", async () => {
    const screen = await render(
      <Stage>
        <Input data-testid="ref-textarea" aria-label="reference" aria-invalid />
        <Field label="Notes" error="Required">
          <Textarea data-testid="field-textarea" />
        </Field>
      </Stage>,
    );
    await settle();
    const q = within(screen.container);
    // A raw `<textarea>` never received `aria-invalid` from Field's context, so an invalid
    // `Field > Textarea` painted the NEUTRAL hairline while its error copy said otherwise.
    expect(
      numbers(getComputedStyle(q.testId("field-textarea")).borderTopColor),
    ).toEqual(
      numbers(getComputedStyle(q.testId("ref-textarea")).borderTopColor),
    );
  });
});
