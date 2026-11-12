import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { EffectPill, PLAN_EFFECTS } from "./effect-pill";
import "../../test/geometry.css";

test("every effect shows its word, its icon and its own hue", async () => {
  const screen = await render(
    <div>
      {PLAN_EFFECTS.map((effect) => (
        <EffectPill key={effect} effect={effect} />
      ))}
    </div>,
  );
  const pills = [
    ...screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="effect-pill"]',
    ),
  ];
  expect(pills.map((p) => p.dataset.effect)).toEqual([...PLAN_EFFECTS]);
  expect(pills.map((p) => p.textContent)).toEqual([...PLAN_EFFECTS]);
  for (const pill of pills) expect(pill.querySelector("svg")).not.toBeNull();
  expect(pills[5]!.className).toContain("text-warning-text");
  expect(pills[4]!.className).toContain("text-destructive-text");
  await expectNoA11yViolations(screen.container);
});

test("icon only keeps the word for screen readers, and a label replaces it", async () => {
  const screen = await render(
    <p>
      <EffectPill effect="send" iconOnly />
      <EffectPill effect="read" label="look" />
    </p>,
  );
  const [icon, word] = [
    ...screen.container.querySelectorAll<HTMLElement>(
      '[data-slot="effect-pill"]',
    ),
  ];
  expect(icon!.dataset.iconOnly).toBe("");
  expect(icon!.querySelector(".sr-only")!.textContent).toBe("send");
  expect(word!.textContent).toBe("look");
  await expectNoA11yViolations(screen.container);
});
