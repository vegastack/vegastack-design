// The contract for `isTransparent` / `alphaOf`, which twelve assertions across six files now
// depend on to decide whether something is painted.
//
// WHY THIS FILE EXISTS AT ALL
//   Those twelve used to compare against the literal `"rgba(0, 0, 0, 0)"`, and the `.not.toBe`
//   half of them was FAIL-OPEN: an element that had lost its fill entirely still satisfied "not
//   rgba(0, 0, 0, 0)" whenever Chromium spelled the nothing as `oklab(0 0 0 / 0)` instead. Moving
//   them onto a predicate fixes that — and makes the predicate itself load-bearing. A helper that
//   silently returned `false` for every input would turn all ten "is painted" assertions green
//   over a blank page, which is the same fail-open defect one level down. So it is pinned here.
//
// WHY IT IS A BROWSER TEST AND NOT A UNIT TEST
//   Two reasons. The inventory check in `verify-component-contracts.mjs` requires
//   `affectedTestPolicy.crossCuttingTests` to own EXACTLY the `packages/ui/test/*.browser.test.tsx`
//   files, so a `.test.ts` beside them would be coverage the affected selector never picks. And the
//   second half of the contract can only be stated in a real engine: that a genuinely transparent
//   element reads as transparent WHATEVER Chromium chose to call it that day.
//
// The synthetic cases below are deliberately exhaustive over the spellings, and deliberately do NOT
// assert which spelling a given element produces — that is the runner-to-runner variance that
// started all of this (`docs/ledger/bugs.md`, 2026-09-22), and pinning it would re-create the bug.

import { expect, test } from "vitest";

import { alphaOf, isTransparent } from "./color";

// Every spelling Chromium is known to emit for "no paint at all".
const TRANSPARENT = [
  "rgba(0, 0, 0, 0)",
  "rgba(255, 255, 255, 0)",
  "oklab(0 0 0 / 0)",
  "oklch(0 0 0 / 0)",
  "oklch(0.7 0.15 240 / 0)",
  "color(srgb 0 0 0 / 0)",
  "transparent",
  "rgba(0, 0, 0, 0%)",
  "oklch(0.7 0.15 240 / 0%)",
];

// Anything that paints, including a colour that is merely dark or merely faint.
const PAINTED = [
  "rgb(0, 0, 0)",
  "rgba(0, 0, 0, 1)",
  "rgba(0, 0, 0, 0.01)",
  "oklab(0 0 0 / 1)",
  "oklch(0 0 0)",
  "oklch(0.7 0.15 240)",
  "oklch(0.7 0.15 240 / 0.5)",
  "color(srgb 0 0 0 / 0.5)",
  "#000000",
  "rgba(0, 0, 0, 50%)",
];

test("every spelling of a fully transparent colour reads as transparent", () => {
  for (const value of TRANSPARENT)
    expect(isTransparent(value), `${value} should be transparent`).toBe(true);
});

test("a colour that paints is never reported transparent, however dark or faint", () => {
  for (const value of PAINTED)
    expect(isTransparent(value), `${value} should NOT be transparent`).toBe(
      false,
    );
});

test("an absent computed value counts as transparent", () => {
  // `getComputedStyle` returns "" for a property on a detached or not-yet-laid-out element, and
  // every call site means "nothing is painted" by it.
  for (const value of ["", null, undefined])
    expect(isTransparent(value)).toBe(true);
});

test("alphaOf reads the alpha out of both CSS syntaxes", () => {
  expect(alphaOf("rgba(0, 0, 0, 0)")).toBe(0);
  expect(alphaOf("rgba(0, 0, 0, 0.5)")).toBe(0.5);
  expect(alphaOf("rgba(0, 0, 0, 50%)")).toBe(0.5);
  expect(alphaOf("oklab(0 0 0 / 0)")).toBe(0);
  expect(alphaOf("oklch(0.7 0.15 240 / 0.25)")).toBe(0.25);
  expect(alphaOf("oklch(0.7 0.15 240 / 25%)")).toBe(0.25);
  // No alpha component declared means opaque, not unknown.
  expect(alphaOf("rgb(0, 0, 0)")).toBe(1);
  expect(alphaOf("oklch(0.7 0.15 240)")).toBe(1);
  expect(alphaOf("#000000")).toBe(1);
});

test("the defect this replaces, stated: the literal comparison misses a transparent oklab", () => {
  const empty = "oklab(0 0 0 / 0)";
  // This is the assertion ten call sites used to make to mean "something is painted here". It
  // PASSES on a fully transparent element — the fail-open defect, observed rather than described
  // (`docs/ledger/bugs.md`, 2026-09-22). If this line ever stops holding, Chromium has changed
  // its serialisation again and the literal form was never the contract in the first place.
  expect(empty).not.toBe("rgba(0, 0, 0, 0)");
  // What those call sites assert now.
  expect(isTransparent(empty)).toBe(true);
});

test("an alpha slot that cannot be read fails loudly instead of guessing", () => {
  // There is no safe default here: guessing opaque silently satisfies every "is painted"
  // assertion, guessing transparent silently satisfies every "is empty" one. Both are the
  // fail-open shape this helper exists to remove, so it throws.
  //
  // A bare "." is the reachable case: `[0-9.]+` admits it, `Number(".")` is NaN. An alpha slot
  // that is merely EMPTY (`/ )`) does not match either pattern, so it falls through to the
  // no-alpha-declared branch and is opaque — which is correct, not a miss.
  expect(() => alphaOf("oklch(0.7 0.15 240 / .)")).toThrow(/could not read/);
  expect(() => alphaOf("rgba(0, 0, 0, .)")).toThrow(/could not read/);
  expect(alphaOf("oklch(0.7 0.15 240 / )")).toBe(1);
});

test("the predicate is not vacuous: it separates the two sets", () => {
  // A helper that always returned `true` would pass the transparent test, and one that always
  // returned `false` would pass the painted test. Neither can pass this.
  expect(TRANSPARENT.every((value) => isTransparent(value))).toBe(true);
  expect(PAINTED.some((value) => isTransparent(value))).toBe(false);
});

test("a real element's transparency is read correctly whatever Chromium calls it", () => {
  // The half that only a real engine can state. Both elements are given their colour through a
  // custom property in OKLCH, which is the pipeline that makes Chromium reach for `oklab()` in the
  // first place — but the assertion is about the MEANING, so it holds under either spelling.
  const host = document.createElement("div");
  host.innerHTML = `
    <div id="c-none"    style="--c: oklch(0.7 0.15 240); background-color: transparent"></div>
    <div id="c-painted" style="--c: oklch(0.7 0.15 240); background-color: var(--c)"></div>
  `;
  document.body.append(host);
  try {
    const none = getComputedStyle(
      host.querySelector("#c-none") as HTMLElement,
    ).backgroundColor;
    const painted = getComputedStyle(
      host.querySelector("#c-painted") as HTMLElement,
    ).backgroundColor;

    expect(isTransparent(none), `engine spelled the empty fill "${none}"`).toBe(
      true,
    );
    expect(
      isTransparent(painted),
      `engine spelled the real fill "${painted}"`,
    ).toBe(false);
  } finally {
    host.remove();
  }
});
