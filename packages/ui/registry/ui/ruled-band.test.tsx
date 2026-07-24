import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { RuledBand, RuledBandLabel } from "./ruled-band";

test("renders both rules by default and mono-voice labels", async () => {
  const screen = await render(
    <RuledBand>
      <RuledBandLabel className="uppercase">Changelog / 2026</RuledBandLabel>
      <RuledBandLabel className="uppercase">39 updates</RuledBandLabel>
    </RuledBand>,
  );
  const band = document.querySelector(
    '[data-slot="ruled-band"]',
  ) as HTMLElement;
  expect(band.dataset.rule).toBe("both");
  expect(band.className).toContain("border-t");
  expect(band.className).toContain("border-b");
  const label = screen.getByText("Changelog / 2026");
  expect((label.element() as HTMLElement).className).toContain("font-mono");
});

test('rule="top" drops the bottom rule', async () => {
  await render(
    <RuledBand rule="top">
      <RuledBandLabel>Fig. 01</RuledBandLabel>
    </RuledBand>,
  );
  const band = document.querySelector(
    '[data-slot="ruled-band"]',
  ) as HTMLElement;
  const classes = band.className.split(/\s+/);
  expect(classes).toContain("border-t");
  expect(classes).not.toContain("border-b");
});

test("has no accessibility violations", async () => {
  const screen = await render(
    <RuledBand>
      <RuledBandLabel>Left</RuledBandLabel>
      <RuledBandLabel>Right</RuledBandLabel>
    </RuledBand>,
  );
  await expectNoA11yViolations(screen.container);
});
