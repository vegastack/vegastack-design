import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { TextSpinner } from "./text-spinner";
import "../../test/geometry.css";

const slot = (root: ParentNode, name: string) =>
  root.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;

test("working is the default: thirteen bolt dots, each striking on its own row, hidden from assistive technology", async () => {
  const screen = await render(<TextSpinner />);
  const root = slot(screen.container, "text-spinner");
  expect(root.dataset.variant).toBe("working");
  expect(root.className).toContain("text-muted-foreground");
  const bolt = slot(screen.container, "text-spinner-bolt");
  expect(bolt.getAttribute("aria-hidden")).toBe("true");
  expect(bolt.getAttribute("class")).not.toContain("motion-pulse");
  const dots = [...bolt.querySelectorAll("circle")];
  expect(dots).toHaveLength(13);
  // Six rows, top to bottom: each dot starts its row's frame later, so the bolt fills downwards.
  expect(
    new Set(dots.map((dot) => dot.style.getPropertyValue("--vs-row"))),
  ).toEqual(new Set(["0", "1", "2", "3", "4", "5"]));
  for (const dot of dots)
    expect(dot.getAttribute("class")).toBe("motion-strike");
});

test("waiting pulses the whole bolt and leaves the dots unstepped", async () => {
  const screen = await render(<TextSpinner variant="waiting" />);
  expect(slot(screen.container, "text-spinner").dataset.variant).toBe(
    "waiting",
  );
  const bolt = slot(screen.container, "text-spinner-bolt");
  expect(bolt.getAttribute("class")).toContain("motion-pulse");
  for (const dot of bolt.querySelectorAll("circle")) {
    expect(dot.getAttribute("class")).toBeNull();
    expect(dot.style.getPropertyValue("--vs-row")).toBe("");
  }
});

test("a screen reader hears the label, Working by default, and nothing when the label is empty", async () => {
  const named = await render(<TextSpinner />);
  expect(named.container.querySelector(".sr-only")?.textContent).toBe(
    "Working",
  );
  const custom = await render(<TextSpinner label="Reconnecting" />);
  expect(custom.container.querySelector(".sr-only")?.textContent).toBe(
    "Reconnecting",
  );
  const silent = await render(<TextSpinner label="" />);
  expect(silent.container.querySelector(".sr-only")).toBeNull();
});

test("no a11y violations — working and waiting", async () => {
  const screen = await render(
    <p>
      <TextSpinner /> Searching <TextSpinner variant="waiting" label="" />
    </p>,
  );
  await expectNoA11yViolations(screen.container);
});

test("compiled: the bolt is as tall as capital letters, in a fixed slot, on the two loader utilities", async () => {
  const screen = await render(
    <p className="text-sm">
      <TextSpinner label="" />
      <TextSpinner variant="waiting" label="" />
    </p>,
  );
  const [working, waiting] = [
    ...screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="text-spinner"]',
    ),
  ];
  const fontSize = parseFloat(getComputedStyle(working!).fontSize);
  const bolt = slot(working!, "text-spinner-bolt").getBoundingClientRect();
  expect(bolt.height).toBeCloseTo(fontSize * 0.72, 0);
  expect(bolt.width).toBeCloseTo(fontSize * 0.48, 0);
  expect(working!.getBoundingClientRect().width).toBeCloseTo(fontSize * 0.6, 0);
  expect(
    getComputedStyle(working!.querySelector("circle")!).animationName,
  ).toBe("vs-strike");
  expect(
    getComputedStyle(slot(waiting!, "text-spinner-bolt")).animationName,
  ).toBe("vs-pulse");
});

/** Every rule of the page's compiled CSS, nested rules (`@layer`) included. */
function cssRules(): CSSRule[] {
  const out: CSSRule[] = [];
  const walk = (rules: CSSRuleList) => {
    for (const rule of rules) {
      out.push(rule);
      if ("cssRules" in rule) walk((rule as CSSGroupingRule).cssRules);
    }
  };
  for (const sheet of document.styleSheets) walk(sheet.cssRules);
  return out;
}

const keyframes = (name: string) =>
  [
    ...cssRules().find(
      (rule): rule is CSSKeyframesRule =>
        rule instanceof CSSKeyframesRule && rule.name === name,
    )!.cssRules,
  ].map((frame) => [
    parseFloat((frame as CSSKeyframeRule).keyText),
    Number((frame as CSSKeyframeRule).style.opacity),
  ]);

test("compiled motion: Strike lights each row from its own frame for 10 of 17; Pulse steps six opacities and ends on the full bolt", async () => {
  await render(<TextSpinner />);
  // The cycle and each row's offset, as the utility declares them. A shorthand holding var() is
  // empty in the CSSOM until computed, and this page's reset overrides the computed values, so
  // read the compiled stylesheet's own text.
  const css = [...document.querySelectorAll("style")]
    .map((style) => style.textContent)
    .join("\n");
  const strike = css.match(/\.motion-strike\s*\{([^}]*)\}/)![1]!;
  expect(strike).toMatch(
    /vs-strike\s+calc\(var\(--duration-loader-frame\)\s*\*\s*17\)\s+step-end\s+infinite/,
  );
  expect(strike).toMatch(
    /animation-delay:\s*calc\(\(var\(--vs-row,\s*0\)\s*-\s*7\)\s*\*\s*var\(--duration-loader-frame\)\)/,
  );
  // Dim until 7/17 of the cycle, then lit to the end (the resting style), stepped.
  expect(keyframes("vs-strike")).toEqual([
    [0, 0.18],
    [41.1764, 1],
    [100, 1],
  ]);
  // Replay the cycle: a dot's own frame is (frame + 7 − row) mod 17, lit from frame 7.
  for (let row = 0; row < 6; row++) {
    const lit = Array.from({ length: 17 }, (_, frame) => frame).filter(
      (frame) => (((frame + 7 - row) % 17) / 17) * 100 >= 41.1764,
    );
    expect(lit).toEqual(Array.from({ length: 10 }, (_, i) => row + i));
  }
  // Pulse: one value per sixth, held (step-end), ending on the full bolt.
  const pulse = keyframes("vs-pulse");
  const at = (frame: number) =>
    pulse.filter(([offset]) => offset! <= (frame / 6) * 100 + 0.01).at(-1)![1];
  expect([0, 1, 2, 3, 4, 5].map(at)).toEqual([0.75, 0.45, 0.45, 0.75, 1, 1]);
  expect(pulse.at(-1)).toEqual([100, 1]);
});

test("reduced motion (the reset this page mirrors from base.css): both variants rest on the full bolt", async () => {
  const screen = await render(
    <p>
      <TextSpinner label="" />
      <TextSpinner variant="waiting" label="" />
    </p>,
  );
  await Promise.all(
    screen.container.getAnimations({ subtree: true }).map((a) => a.finished),
  );
  for (const bolt of screen.container.querySelectorAll<SVGElement>(
    '[data-slot="text-spinner-bolt"]',
  )) {
    expect(getComputedStyle(bolt).opacity).toBe("1");
    for (const dot of bolt.querySelectorAll("circle"))
      expect(getComputedStyle(dot).opacity).toBe("1");
  }
});

test("a container that sizes its icons (a Button, the live line's trigger, a notice's lead) leaves the bolt at text size", async () => {
  const screen = await render(
    <p className="text-sm">
      <span className="[&_svg:not([class*='size-'])]:size-4">
        <TextSpinner label="" />
      </span>
      <TextSpinner variant="waiting" label="" />
    </p>,
  );
  const [inside, plain] = [
    ...screen.container.querySelectorAll<SVGElement>(
      '[data-slot="text-spinner-bolt"]',
    ),
  ].map((bolt) => bolt.getBoundingClientRect());
  // Working inside the icon-sizing container and waiting outside it: one size, 0.72em × 0.48em.
  expect(inside!.height).toBeCloseTo(plain!.height, 1);
  expect(inside!.width).toBeCloseTo(plain!.width, 1);
  expect(inside!.height).toBeCloseTo(14 * 0.72, 0);
  expect(inside!.width).toBeCloseTo(14 * 0.48, 0);
});
