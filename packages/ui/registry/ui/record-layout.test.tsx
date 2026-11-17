import "../../test/geometry.css";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import { RecordLayout, RecordLayoutMain } from "./record-layout";

test("the main column takes the whole width of the layout", async () => {
  const screen = await render(
    <div style={{ width: 900 }}>
      <RecordLayout>
        <RecordLayoutMain>
          <h1>Weekly sync</h1>
        </RecordLayoutMain>
      </RecordLayout>
    </div>,
  );
  const main = screen.container.querySelector<HTMLElement>(
    "[data-slot=record-layout-main]",
  )!;
  expect(Math.round(main.getBoundingClientRect().width)).toBe(900);
  await expectNoA11yViolations(screen.container);
});
