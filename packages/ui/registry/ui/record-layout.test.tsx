import "../../test/geometry.css";
import * as React from "react";
import { render } from "vitest-browser-react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "../../test/a11y";
import {
  RecordDetailsSheet,
  RecordLayout,
  RecordLayoutMain,
  RecordLayoutRail,
} from "./record-layout";

test("lays out the main column and rail; the details sheet opens with its content", async () => {
  const screen = await render(
    <RecordLayout>
      <RecordLayoutMain>
        <h1>Weekly sync</h1>
        <RecordDetailsSheet>
          <p>Type: Call</p>
        </RecordDetailsSheet>
      </RecordLayoutMain>
      <RecordLayoutRail aria-label="Details">
        <p>Rail</p>
      </RecordLayoutRail>
    </RecordLayout>,
  );
  expect(
    screen.container.querySelector("[data-slot=record-layout-rail]"),
  ).not.toBeNull();
  await expectNoA11yViolations(screen.container);
  const trigger = screen.getByRole("button", { name: "Details" });
  if (getComputedStyle(trigger.element()).display !== "none") {
    await trigger.click();
    await expect.element(screen.getByText("Type: Call")).toBeVisible();
  }
});

test("stack: below 64rem the rail flows under the main column, full width and unscrolled; from 64rem it sits beside", async () => {
  const Page = ({ width }: { width: number }) => (
    <div style={{ width }} data-width={width}>
      <RecordLayout stack>
        <RecordLayoutMain>
          <div style={{ height: 200 }}>Preview</div>
        </RecordLayoutMain>
        <RecordLayoutRail aria-label={`Details ${width}`}>
          <p>Size 2 MB</p>
        </RecordLayoutRail>
      </RecordLayout>
    </div>
  );
  const screen = await render(
    <>
      <Page width={600} />
      <Page width={1200} />
    </>,
  );
  const parts = (width: number) => {
    const page = document.querySelector(`[data-width="${width}"]`)!;
    const rail = page.querySelector<HTMLElement>(
      "[data-slot=record-layout-rail]",
    )!;
    return {
      main: page
        .querySelector("[data-slot=record-layout-main]")!
        .getBoundingClientRect(),
      rail: rail.getBoundingClientRect(),
      style: getComputedStyle(rail),
    };
  };
  await expect
    .element(screen.getByRole("complementary", { name: "Details 600" }))
    .toBeVisible();
  const narrow = parts(600);
  expect(narrow.rail.top).toBeGreaterThanOrEqual(narrow.main.bottom);
  expect(Math.round(narrow.rail.width)).toBe(600);
  expect(narrow.style.position).toBe("static");
  expect(narrow.style.overflowY).toBe("visible");

  const wide = parts(1200);
  expect(wide.rail.left).toBeGreaterThan(wide.main.right);
  expect(Math.round(wide.rail.width)).toBe(320);
  expect(wide.style.position).toBe("sticky");
  await expectNoA11yViolations(screen.container);
});
