import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { EMPTY_ILLUSTRATIONS, EmptyIllustration } from "./empty-illustration";

test("every drawing renders decorative", async () => {
  const screen = await render(
    <div>
      {EMPTY_ILLUSTRATIONS.map((name) => (
        <EmptyIllustration key={name} name={name} />
      ))}
    </div>,
  );
  const svgs = [...screen.container.querySelectorAll("svg")];
  expect(svgs.map((svg) => svg.getAttribute("data-name"))).toEqual([
    ...EMPTY_ILLUSTRATIONS,
  ]);
  for (const svg of svgs) expect(svg.getAttribute("aria-hidden")).toBe("true");
  await expectNoA11yViolations(screen.container);
});
