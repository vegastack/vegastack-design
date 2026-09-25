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
