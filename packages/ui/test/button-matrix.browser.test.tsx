import "./contrast.css"; // compiled Tailwind + @vegastack token theme (Vite via @tailwindcss/vite)
import * as React from "react";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { describe, expect, test } from "vitest";
import {
  cn,
  fillInteractive,
  surfaceInteractiveGroup,
} from "@vegastack/design";
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

/* ────────────────────────────────────────────────────────────────────────────────────────────────
 * THE HOVER/PRESSED RECIPES ACTUALLY COMPILE — and the `@source` glob that makes them compile is
 * load-bearing because of these assertions.
 *
 * `contrast.css` and `geometry.css` both declared
 * an `@source` glob pointing at `packages/design/src/index.ts`, commented as the one that compiles
 * the surfaceInteractive / fillInteractive recipe literals,
 * and an adversarial review (2026-09-09) deleted it from BOTH and got 590/590 green: the glob was a
 * comment, not a gate. Two things made it inert.
 *
 *   1. Tailwind v4 AUTO-DETECTS sources under the Vite root, which here is `packages/ui`. Every
 *      `hover:bg-surface-2` / `active:bg-surface-3` written literally in a component or a `.test.tsx`
 *      (there are many — `item.tsx`, `tabs.tsx`, `data-list.tsx`, several `toContain` assertions)
 *      compiles those two utilities whether or not the recipe file is ever scanned.
 *   2. The one place that DID assert "the recipe classes compile"
 *      (`surface-ladder.browser.test.tsx`) writes the same two literals into its own source three
 *      lines above, so it was measuring its own file.
 *
 * The classes that exist ONLY in `packages/design/src/index.ts` are the ones asserted below:
 * `surfaceInteractiveGroup`'s two group-scoped wash rungs and every CHROMATIC `fillInteractive` tone
 * (primary, destructive, success, warning, info — `foreground` and `brand` are also written
 * literally elsewhere in this package, so they prove nothing on their own). Delete the glob and
 * these rules are absent from the compiled sheet; change a rung in the recipe and the value
 * assertion moves. Nothing here restates a class literal — every string comes from the imported
 * constants at run time, so this file cannot become its own source the way `surface-ladder` did.
 * ─────────────────────────────────────────────────────────────────────────────────────────────── */

/**
 * Every STYLE rule in every reachable stylesheet, as its own text.
 *
 * Descending matters. Taking only the top-level rules hands back one `@layer utilities { … }` blob
 * that contains the entire sheet, so "the rule for this class also declares a background-color"
 * would be true of any class whatsoever. A style rule's own `cssText` still carries the `@supports`
 * fallback nested inside it, which is where the `color-mix()` value lives.
 */
function compiledRules(): string[] {
  const texts: string[] = [];
  const walk = (rules: CSSRuleList) => {
    for (const rule of [...rules]) {
      if ("selectorText" in rule) {
        texts.push(rule.cssText);
        continue;
      }
      const nested = (rule as CSSGroupingRule).cssRules;
      if (nested) walk(nested);
    }
  };
  for (const sheet of [...document.styleSheets]) {
    try {
      walk(sheet.cssRules);
    } catch {
      // A stylesheet this page cannot read tells us nothing either way.
    }
  }
  return texts;
}

const escapeForRegExp = (character: string) =>
  /[.*+?^${}()|[\]\\/]/.test(character) ? `\\${character}` : character;

/**
 * A pattern matching the class as Tailwind EMITS it in a selector — every character that is not
 * `[A-Za-z0-9_-]` may or may not carry a CSS backslash escape, and the ones that are also regular
 * expression metacharacters have to be escaped for this pattern too.
 */
function selectorFor(className: string) {
  return new RegExp(
    `\\.${[...className]
      .map((character) =>
        /[A-Za-z0-9_-]/.test(character)
          ? character
          : `\\\\?${escapeForRegExp(character)}`,
      )
      .join("")}`,
  );
}

/**
 * The custom properties a `bg-*` recipe class must resolve through, derived from the class STRING
 * rather than restated — writing `--color-primary`'s utility here would put the candidate back in
 * this file's source and re-create the exact self-measurement this block exists to avoid.
 */
function expectedVariables(className: string) {
  const match =
    /:bg-([a-z0-9-]+)(?:\/\((--[a-z-]+)\))?$/.exec(className) ?? undefined;
  expect(
    match,
    `${className} is not a recognisable bg-* recipe class`,
  ).toBeTruthy();
  // Tailwind emits the RAW token variable (`var(--surface-2)`), not the `--color-*` theme alias.
  return [`--${match![1]}`, ...(match![2] ? [match![2]] : [])];
}

describe("the hover/pressed recipes compile from @vegastack/design", () => {
  // The chromatic tones only. `foreground` and `brand` are ALSO written as literals elsewhere under
  // the Vite root, so they would compile with the glob deleted and prove nothing.
  const CHROMATIC = [
    "primary",
    "destructive",
    "success",
    "warning",
    "info",
  ] as const;

  test("every recipe class the design package owns has a compiled rule with its token", async () => {
    // Mount them, so the assertion is over classes something in this page actually wears rather
    // than over a stylesheet nobody uses.
    await render(
      <div>
        <div className={cn("size-8", surfaceInteractiveGroup)} />
        {CHROMATIC.map((tone) => (
          <button
            key={tone}
            type="button"
            aria-label={tone}
            className={cn("size-8", fillInteractive[tone])}
          />
        ))}
      </div>,
    );

    const rules = compiledRules();
    const classes = [
      ...surfaceInteractiveGroup.split(" "),
      ...CHROMATIC.flatMap((tone) => fillInteractive[tone].split(" ")),
    ];
    expect(classes.length, "the recipes resolved to nothing").toBeGreaterThan(
      10,
    );

    for (const className of classes) {
      const selector = selectorFor(className);
      const rule = rules.find((text) => selector.test(text));
      expect(
        rule,
        `\`${className}\` has NO compiled rule. It exists only in packages/design/src/index.ts, so ` +
          `the \`@source '../../design/src/index.ts'\` glob in test/contrast.css is what makes it ` +
          `compile — a missing glob drops the rule silently and every hover/pressed assertion over ` +
          `it passes against nothing.`,
      ).toBeTruthy();
      expect(
        rule,
        `${className} compiled without a background-color`,
      ).toContain("background-color");
      for (const variable of expectedVariables(className)) {
        expect(
          rule,
          `${className} compiled without ${variable} — the rung it paints moved`,
        ).toContain(variable);
      }
    }
  });

  test("a chromatic wash is actually painted on hover", async () => {
    const screen = await render(
      <div>
        {/* Parking space for the pointer — the page is shared across files. */}
        <div data-testid="away" style={{ height: 240 }} />
        <button
          type="button"
          data-testid="washed"
          aria-label="Approve"
          className={cn("size-8", fillInteractive.success)}
        />
      </div>,
    );
    const at = (id: string) =>
      screen.container.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;

    await userEvent.hover(at("away"));
    const rest = getComputedStyle(at("washed")).backgroundColor;

    await userEvent.hover(at("washed"));
    const hovered = getComputedStyle(at("washed")).backgroundColor;

    expect(
      hovered,
      "the fillInteractive hover rung painted nothing — the recipe compiled but does not apply",
    ).not.toBe(rest);
  });
});
